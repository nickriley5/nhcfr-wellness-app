import { httpsCallable } from 'firebase/functions';
import { getAIFunctions } from './functionsClient';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface ProviderMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  confidence?: number;
}

export interface ProviderOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface AIProxyResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
}

interface ImageAnalysisRequest {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}

const getAIProxy = () => httpsCallable<
    | { kind: 'message'; provider: AIProvider; messages: ProviderMessage[]; options?: ProviderOptions }
    | ({ kind: 'image' } & ImageAnalysisRequest),
    AIProxyResponse
  >(getAIFunctions(), 'aiProxy', { timeout: 120000 });

export async function sendProviderMessage(
  provider: AIProvider,
  messages: ProviderMessage[],
  options?: ProviderOptions
): Promise<ProviderResponse> {
  const result = await getAIProxy()({ kind: 'message', provider, messages, options });
  return result.data;
}

export async function analyzeImageWithProvider(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<ProviderResponse> {
  const result = await getAIProxy()({ kind: 'image', imageBase64, mimeType, prompt });
  return result.data;
}
