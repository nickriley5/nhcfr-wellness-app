import axios from 'axios';

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

export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export type ProviderConfigMap = Record<AIProvider, ProviderConfig>;

export async function sendProviderMessage(
  provider: AIProvider,
  messages: ProviderMessage[],
  config: ProviderConfigMap,
  options?: ProviderOptions
): Promise<ProviderResponse> {
  const providerConfig = config[provider];
  if (!providerConfig?.apiKey) {
    throw new Error(`${provider} API key not configured. Please check your .env file.`);
  }

  switch (provider) {
    case 'openai':
      return sendOpenAIMessage(messages, providerConfig, options);
    case 'anthropic':
      return sendAnthropicMessage(messages, providerConfig, options);
    case 'gemini':
      return sendGeminiMessage(messages, providerConfig, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function sendOpenAIMessage(
  messages: ProviderMessage[],
  config: ProviderConfig,
  options?: ProviderOptions
): Promise<ProviderResponse> {
  const response = await axios.post<any>(
    `${config.baseURL}/chat/completions`,
    {
      model: config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    content: response.data.choices[0].message.content,
    tokensUsed: response.data.usage?.total_tokens,
    model: config.model,
  };
}

async function sendAnthropicMessage(
  messages: ProviderMessage[],
  config: ProviderConfig,
  options?: ProviderOptions
): Promise<ProviderResponse> {
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await axios.post<any>(
    `${config.baseURL}/messages`,
    {
      model: config.model,
      max_tokens: options?.maxTokens || 2000,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    },
    {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    content: response.data.content[0].text,
    tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens,
    model: config.model,
  };
}

async function sendGeminiMessage(
  messages: ProviderMessage[],
  config: ProviderConfig,
  options?: ProviderOptions
): Promise<ProviderResponse> {
  const maxRetries = 3;
  const baseDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendGeminiMessageAttempt(messages, config, options);
    } catch (error: any) {
      const is503 = error.response?.status === 503;
      const isNetworkFailure =
        error?.message?.includes('Network error reaching Gemini API') ||
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNABORTED' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENETUNREACH' ||
        error?.code === 'EHOSTUNREACH';
      const isLastAttempt = attempt === maxRetries;

      if ((is503 || isNetworkFailure) && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const reason = is503 ? '503' : 'network';
        console.log(`🔄 Gemini retry ${attempt}/${maxRetries} (${reason}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed after all retry attempts');
}

async function sendGeminiMessageAttempt(
  messages: ProviderMessage[],
  config: ProviderConfig,
  options?: ProviderOptions
): Promise<ProviderResponse> {
  const mapGeminiAxiosError = (error: any): Error => {
    if (error?.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 503) {
        return error;
      }
      if (status === 429) {
        return new Error('⏱️ Rate limit exceeded. You made too many requests. Please wait and try again.');
      }
      if (status === 400) {
        return new Error(`❌ Invalid request: ${errorData?.error?.message || 'Bad request'}`);
      }
      if (status === 401 || status === 403) {
        return new Error('🔑 API key is invalid or has been revoked. Please check your Gemini key.');
      }
      if (status === 404) {
        return new Error(`🔍 Model not found. The model "${config.model}" may not be available.`);
      }

      return new Error(`Gemini API error (${status}): ${errorData?.error?.message || error.message}`);
    }

    if (error?.code === 'ECONNABORTED') {
      return new Error('⏱️ Request timed out while contacting Gemini. Please try again.');
    }

    if (error?.message === 'Network Error' || !error?.response) {
      const mapped = new Error(
        '🌐 Network error reaching Gemini API. Check internet connectivity, Android date/time, and whether your network blocks Google APIs.'
      );
      (mapped as any).code = error?.code || 'ERR_NETWORK';
      return mapped;
    }

    return error instanceof Error ? error : new Error(String(error));
  };

  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const alternatingMessages: ProviderMessage[] = [];
  let lastRole: string | null = null;

  for (const msg of nonSystemMessages) {
    if (msg.role !== lastRole) {
      alternatingMessages.push(msg);
      lastRole = msg.role;
    }
  }

  if (alternatingMessages.every(m => m.role === 'user')) {
    const lastUserMessage = alternatingMessages[alternatingMessages.length - 1];
    const messageText = systemMessage
      ? `${systemMessage.content}\n\nUser: ${lastUserMessage.content}`
      : lastUserMessage.content;

    const formattedMessages = [{
      role: 'user',
      parts: [{ text: messageText }],
    }];

    const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
    console.log('🌐 Gemini API URL:', url.replace(config.apiKey, 'API_KEY_HIDDEN'));

    try {
      const response = await axios.post<any>(
        url,
        {
          contents: formattedMessages,
          generationConfig: {
            temperature: options?.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || 8192,
            topP: 0.95,
            topK: 40,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 90000,
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      return {
        content: response.data.candidates[0].content.parts[0].text,
        model: config.model,
      };
    } catch (error: any) {
      throw mapGeminiAxiosError(error);
    }
  }

  if (systemMessage && alternatingMessages.length > 0) {
    const firstUserMsg = alternatingMessages.find(m => m.role === 'user');
    if (firstUserMsg) {
      firstUserMsg.content = `${systemMessage.content}\n\nUser: ${firstUserMsg.content}`;
    }
  }

  const formattedMessages = alternatingMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
  console.log('🌐 Gemini API URL:', url.replace(config.apiKey, 'API_KEY_HIDDEN'));
  console.log('📨 Request payload:', JSON.stringify({ contents: formattedMessages }, null, 2));

  try {
    const response = await axios.post<any>(
      url,
      {
        contents: formattedMessages,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 2000,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      }
    );

    console.log('📥 Gemini response received:', JSON.stringify(response.data).substring(0, 200));

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Unexpected Gemini response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from Gemini API');
    }

    return {
      content: response.data.candidates[0].content.parts[0].text,
      model: config.model,
    };
  } catch (error: any) {
    throw mapGeminiAxiosError(error);
  }
}
