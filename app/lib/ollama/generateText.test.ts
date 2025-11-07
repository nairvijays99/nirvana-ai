import { generateText } from './generateText'; // Adjust path as needed
import ollama from 'ollama';
import type { ChatResponse } from 'ollama';
import { VALIDATION_ERRORS } from '@/lib';

jest.mock('ollama', () => ({
  chat: jest.fn(),
}));

const mockChat = ollama.chat as jest.Mock;

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

jest.mock('@/lib', () => ({
  VALIDATION_ERRORS: {
    PROMPT: { INVALID: 'Prompt must be a non-empty string' },
    INVALID_MODEL: 'Ollama model not specified. Set OLLAMA_MODEL env variable.',
    MODEL_REQUEST_FAIL: 'Ollama request failed:',
    MODEL_MISSING_CONTENT: 'Invalid response from Ollama: missing content',
  },
}));

describe('generateText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OLLAMA_MODEL = 'llama3.1';
  });

  describe('Positive Cases', () => {
    it('should generate text successfully with valid prompt', async () => {
      const mockResponse: ChatResponse = {
        model: 'llama3.1',
        created_at: new Date(),
        message: { role: 'assistant', content: '  Hello World!  ' },
        done: true,
      };

      mockChat.mockResolvedValue(mockResponse);

      const result = await generateText('Say hello');

      expect(result).toBe('Hello World!');
      expect(mockChat).toHaveBeenCalledWith({
        model: 'llama3.1',
        messages: [{ role: 'user', content: 'Say hello' }],
      });
    });

    it('should trim whitespace from input prompt and output content', async () => {
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: '  Trimmed  ' },
      } as ChatResponse);

      const result = await generateText('   Test prompt   ');
      expect(result).toBe('Trimmed');
    });

    it('should handle minimal valid content', async () => {
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: 'OK' },
      } as ChatResponse);

      const result = await generateText('Ping');
      expect(result).toBe('OK');
    });
  });

  describe('Negative Cases', () => {
    it('should throw for empty, null, undefined, or whitespace-only prompt', async () => {
      const invalidPrompts = ['', '   ', null, undefined, 123] as any[];

      for (const prompt of invalidPrompts) {
        await expect(generateText(prompt)).rejects.toThrow(VALIDATION_ERRORS.PROMPT.INVALID);
      }
    });

    it('should throw if OLLAMA_MODEL is not set', async () => {
      delete process.env.OLLAMA_MODEL;

      await expect(generateText('Hello')).rejects.toThrow(VALIDATION_ERRORS.INVALID_MODEL);
      expect(mockChat).not.toHaveBeenCalled();
    });

    it('should throw wrapped error when ollama.chat fails', async () => {
      const networkError = new Error('Connection refused');
      mockChat.mockRejectedValue(networkError);

      const err = await generateText('Test').catch(e => e);
      expect(err.message).toBe(`${VALIDATION_ERRORS.MODEL_REQUEST_FAIL}: Connection refused`);
    });

    it('should throw for non-Error rejection (e.g. string)', async () => {
      mockChat.mockRejectedValue('Network down');

      const err = await generateText('Test').catch(e => e);
      expect(err.message).toBe(`${VALIDATION_ERRORS.MODEL_REQUEST_FAIL}: Unknown error`);
    });

    it('should throw if response is missing message or content', async () => {
      const invalidResponses = [
        {}, // no message
        { message: {} }, // no content
        { message: { content: null } },
        { message: { content: undefined } },
        { message: { content: 123 } }, // wrong type
      ];

      for (const resp of invalidResponses) {
        mockChat.mockResolvedValue(resp as ChatResponse);
        await expect(generateText('Test')).rejects.toThrow(VALIDATION_ERRORS.MODEL_MISSING_CONTENT);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long prompts (10k+ chars)', async () => {
      const longPrompt = 'x'.repeat(15000);
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: 'Long input received' },
      } as ChatResponse);

      const result = await generateText(longPrompt);
      expect(result).toBe('Long input received');
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: longPrompt }],
        })
      );
    });

    it('should handle special characters, newlines, and JSON in prompt', async () => {
      const specialPrompt = `Hello\nWorld! 🌍\n\nLine1\r\nLine2\n<>&"'${JSON.stringify({
        key: 'value',
      })}`;
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: 'Received special chars' },
      } as ChatResponse);

      await generateText(specialPrompt);
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: specialPrompt }],
        })
      );
    });

    it('should support concurrent calls without interference', async () => {
      mockChat
        .mockResolvedValueOnce({
          message: { role: 'assistant', content: 'First' },
        } as ChatResponse)
        .mockResolvedValueOnce({
          message: { role: 'assistant', content: 'Second' },
        } as ChatResponse);

      const [res1, res2] = await Promise.all([generateText('One'), generateText('Two')]);

      expect(res1).toBe('First');
      expect(res2).toBe('Second');
      expect(mockChat).toHaveBeenCalledTimes(2);
    });

    it('should handle content with leading/trailing whitespace', async () => {
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: '\n\n  Hi  \n\n' },
      } as ChatResponse);

      const result = await generateText('Echo');
      expect(result).toBe('Hi');
    });
  });
});
