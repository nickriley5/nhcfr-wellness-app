import { getEnv } from '../env';
import type { ProviderConfigMap } from './providers';

const env = getEnv();

const config = {
  GEMINI_API_KEY: env.GEMINI_API_KEY ?? '',
  OPENAI_API_KEY: env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY ?? '',
};

if (config.GEMINI_API_KEY) {
  console.log('✅ Gemini API key loaded successfully');
} else {
  console.warn('⚠️ Gemini API key not configured');
}

export const AI_CONFIG: ProviderConfigMap = {
  openai: {
    apiKey: config.OPENAI_API_KEY || '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
  },
  anthropic: {
    apiKey: config.ANTHROPIC_API_KEY || '',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    apiKey: config.GEMINI_API_KEY || '',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-flash-latest',
  },
};
