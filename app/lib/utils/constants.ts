export const VALIDATION_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INVALID_JSON: 'Invalid JSON payload',
  INVALID_MODEL: 'Ollama model not specified. Set OLLAMA_MODEL env variable.',
  INVALID_USER_INPUT: 'User input must be a non-empty string',
  MESSAGE: {
    EMPTY: 'Message cannot be empty',
    REQUIRED: 'Message is required',
    TOO_LONG: 'Message too long',
  },
  MODEL_MISSING_CONTENT: 'Invalid response from Ollama: missing content',
  MODEL_REQUEST_FAIL: 'Ollama request failed:',
  PROMPT: {
    INVALID: 'Prompt must be a non-empty string',
  },
};

export const USER_PROMPT_TEMPLATE = `You are NirvanaAI — a secure, mindful local AI assistant. Respond clearly and helpfully.`;
