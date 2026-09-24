import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = getFirestore();
const MODEL = 'gemini-2.0-flash';
const MAX_TEXT_CHARS = 120_000;
const MAX_IMAGE_BASE64_CHARS = 8_000_000;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
type ProxyRequest =
  | {
      kind: 'message';
      provider: 'gemini' | 'openai' | 'anthropic';
      messages: Message[];
      options?: { temperature?: number; maxTokens?: number };
    }
  | {
      kind: 'image';
      imageBase64: string;
      mimeType: string;
      prompt: string;
    };

const requireString = (value: unknown, name: string, maxLength: number): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new HttpsError('invalid-argument', `${name} is missing or too large.`);
  }
  return value;
};

const enforceUserRateLimit = async (uid: string): Promise<void> => {
  const ref = db.collection('aiRateLimits').doc(uid);
  const now = Date.now();

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const windowStartedAt = Number(data?.windowStartedAt || 0);
    const count = Number(data?.count || 0);

    if (now - windowStartedAt >= WINDOW_MS) {
      transaction.set(ref, { windowStartedAt: now, count: 1, updatedAt: FieldValue.serverTimestamp() });
      return;
    }

    if (count >= MAX_REQUESTS_PER_WINDOW) {
      throw new HttpsError('resource-exhausted', 'Too many AI requests. Please wait a minute and try again.');
    }

    transaction.update(ref, { count: count + 1, updatedAt: FieldValue.serverTimestamp() });
  });
};

const toGeminiContents = (messages: Message[]) => {
  const systemText = messages
    .filter(message => message.role === 'system')
    .map(message => message.content)
    .join('\n\n');
  const conversation = messages.filter(message => message.role !== 'system');

  return conversation.map((message, index) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{
      text: index === 0 && systemText
        ? `${systemText}\n\nUser: ${message.content}`
        : message.content,
    }],
  }));
};

const callGemini = async (apiKey: string, body: object): Promise<{ content: string; model: string }> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const payload = await response.json() as any;

  if (!response.ok) {
    console.error('Gemini request failed', { status: response.status, message: payload?.error?.message });
    if (response.status === 429) {
      throw new HttpsError('resource-exhausted', 'The AI service is busy. Please wait and try again.');
    }
    throw new HttpsError('unavailable', 'The AI service could not complete this request.');
  }

  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== 'string' || content.length === 0) {
    throw new HttpsError('internal', 'The AI service returned an invalid response.');
  }

  return { content, model: MODEL };
};

export const aiProxy = onCall(
  {
    region: 'us-central1',
    secrets: [geminiApiKey],
    timeoutSeconds: 120,
    memory: '512MiB',
    maxInstances: 20,
  },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in before using AI features.');
    }

    await enforceUserRateLimit(request.auth.uid);
    const data = request.data as ProxyRequest;

    if (data?.kind === 'message') {
      if (data.provider !== 'gemini') {
        throw new HttpsError('failed-precondition', 'This AI provider is not enabled.');
      }
      if (!Array.isArray(data.messages) || data.messages.length === 0 || data.messages.length > 40) {
        throw new HttpsError('invalid-argument', 'A valid message list is required.');
      }
      const messages = data.messages.map(message => ({
        role: message.role,
        content: requireString(message.content, 'Message content', MAX_TEXT_CHARS),
      }));
      const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
      if (totalChars > MAX_TEXT_CHARS) {
        throw new HttpsError('invalid-argument', 'The AI request is too large.');
      }

      return callGemini(geminiApiKey.value(), {
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: Math.min(1, Math.max(0, Number(data.options?.temperature ?? 0.7))),
          maxOutputTokens: Math.min(8192, Math.max(256, Number(data.options?.maxTokens ?? 2000))),
        },
      });
    }

    if (data?.kind === 'image') {
      const imageBase64 = requireString(data.imageBase64, 'Image', MAX_IMAGE_BASE64_CHARS);
      const prompt = requireString(data.prompt, 'Prompt', 20_000);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.mimeType)) {
        throw new HttpsError('invalid-argument', 'Unsupported image type.');
      }

      return callGemini(geminiApiKey.value(), {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: data.mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
      });
    }

    throw new HttpsError('invalid-argument', 'Unknown AI request type.');
  }
);
