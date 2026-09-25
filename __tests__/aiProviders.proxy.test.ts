const mockCallable = jest.fn();

jest.mock('../utils/ai/functionsClient', () => ({ getAIFunctions: () => ({}) }));
jest.mock('firebase/functions', () => ({
  httpsCallable: () => (payload: unknown) => mockCallable(payload),
}));

import { analyzeImageWithProvider, sendProviderMessage } from '../utils/ai/providers';

describe('AI provider proxy', () => {
  beforeEach(() => {
    mockCallable.mockReset();
  });

  it('routes text generation through the authenticated callable contract', async () => {
    mockCallable.mockResolvedValue({ data: { content: 'ok', model: 'gemini-2.0-flash' } });

    const response = await sendProviderMessage(
      'gemini',
      [{ role: 'user', content: 'Build a workout' }],
      { temperature: 0.5, maxTokens: 1200 }
    );

    expect(mockCallable).toHaveBeenCalledWith({
      kind: 'message',
      provider: 'gemini',
      messages: [{ role: 'user', content: 'Build a workout' }],
      options: { temperature: 0.5, maxTokens: 1200 },
    });
    expect(response.content).toBe('ok');
  });

  it('routes meal images without any provider credential', async () => {
    mockCallable.mockResolvedValue({ data: { content: '{"items":[]}', model: 'gemini-2.0-flash' } });

    await analyzeImageWithProvider('base64-image', 'image/jpeg', 'Analyze this meal');

    const request = mockCallable.mock.calls[0][0];
    expect(request).toEqual({
      kind: 'image',
      imageBase64: 'base64-image',
      mimeType: 'image/jpeg',
      prompt: 'Analyze this meal',
    });
    expect(JSON.stringify(request)).not.toMatch(/apiKey|GEMINI_API_KEY/);
  });
});
