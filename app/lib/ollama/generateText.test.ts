// app/lib/ollama/generateText.test.ts
import ollama from 'ollama';
import type { ChatResponse } from 'ollama';

jest.mock('ollama', () => ({
  chat: jest.fn(),
}));
const mockChat = ollama.chat as jest.Mock;

jest.mock('@/lib', () => ({
  SYSTEM_PROMPT: 'You are a helpful AI.',
  VALIDATION_ERRORS: {
    PROMPT: { INVALID: 'Prompt must be a non-empty string' },
    INVALID_MODEL: 'Ollama model not specified. Set OLLAMA_MODEL env variable.',
    MODEL_REQUEST_FAIL: 'Ollama request failed',
    MODEL_MISSING_CONTENT: 'Invalid response from Ollama: missing content',
  },
}));

let generateText: (prompt: string) => Promise<string>;

beforeAll(async () => {
  const mod = await import('./generateText');
  generateText = mod.generateText;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OLLAMA_MODEL = 'llama3.1';
});

describe('generateText', () => {
  describe('Negative Cases', () => {
    it('should throw for empty, null, undefined, or whitespace-only input', async () => {
      const invalid = ['', '   ', null, undefined] as any[]; // 0, false removed
      for (const p of invalid) {
        await expect(generateText(p)).rejects.toThrow('Prompt must be a non-empty string');
      }
    });

    // ... rest of tests unchanged
  });
});
