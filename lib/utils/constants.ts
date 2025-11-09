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
  MODEL_REQUEST_FAIL:
    'Unable to connect to Ollama. Make sure the instance is running on http://localhost:11434',
  MODEL_NOT_CONFIGURED: 'Ollama model configuration missing in env file',
  MODEL_NOT_AVAILABLE: 'Specified Ollama model is not available. Ensure Ollama is serving',
  PROMPT: {
    INVALID: 'Prompt must be a non-empty string',
  },
  UNKNOWN_ERROR: 'An unknown error occurred',
};

export const SYSTEM_PROMPT = `You are Nirvana, a secure, mindful local AI assistant. Respond with a sense of humour`;
