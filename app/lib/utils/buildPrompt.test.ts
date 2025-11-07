import { buildPrompt } from './buildPrompt';

jest.mock('@/lib', () => ({
  USER_PROMPT_TEMPLATE: '  You are a helpful AI. Answer clearly and concisely.  ',
  VALIDATION_ERRORS: {
    PROMPT: {
      INVALID: 'Prompt must be a non-empty string',
    },
  },
}));

const DEFAULT_TEMPLATE = 'You are a helpful AI. Answer clearly and concisely.';
const QUESTION_LINE = 'Question:';

describe('buildPrompt', () => {
  describe('Positive Cases', () => {
    it('builds a prompt with normal input', () => {
      const out = buildPrompt('What is TypeScript?');
      expect(out).toBe(`${DEFAULT_TEMPLATE}\n${QUESTION_LINE}\nWhat is TypeScript?`);
    });

    it('trims whitespace from template and user input', () => {
      const out = buildPrompt('   Hello world!   ');
      expect(out).toBe(`${DEFAULT_TEMPLATE}\n${QUESTION_LINE}\nHello world!`);
    });

    it('preserves internal new-lines in a multi-line template', () => {
      // ---- override the mock just for this test ----
      jest.requireMock('@/lib').USER_PROMPT_TEMPLATE = `
        You are an expert.
        
        Be concise.
        Always think step-by-step.
      `;

      // re-require the function so it picks up the new mock value
      const { buildPrompt: mocked } = require('./buildPrompt');

      const out = mocked('Test query');

      expect(out).toBe(
        `You are an expert.\n        \n        Be concise.\n        Always think step-by-step.\n${QUESTION_LINE}\nTest query`
      );

      // clean-up for the next test
      jest.resetModules();
    });
  });

  describe('Negative Cases', () => {
    it('throws for empty string', () => {
      expect(() => buildPrompt('')).toThrow('Prompt must be a non-empty string');
    });

    it('throws for whitespace-only input', () => {
      expect(() => buildPrompt('   \t\n   ')).toThrow('Prompt must be a non-empty string');
    });

    it('throws for null / undefined / non-string', () => {
      expect(() => buildPrompt(null as any)).toThrow('Prompt must be a non-empty string');
      expect(() => buildPrompt(undefined as any)).toThrow('Prompt must be a non-empty string');
      expect(() => buildPrompt(123 as any)).toThrow('Prompt must be a non-empty string');
    });
  });
});
