// app/lib/ollama/generateText.ts
import ollama from 'ollama';
import { VALIDATION_ERRORS } from '@/lib';
import type { ChatResponse } from 'ollama';

export async function generateText(prompt: string): Promise<string> {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error(VALIDATION_ERRORS.PROMPT.INVALID);
  }

  const trimmedPrompt = prompt.trim();

  // Use process.env directly — safe for tests
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL;
  if (!OLLAMA_MODEL) {
    throw new Error(VALIDATION_ERRORS.INVALID_MODEL);
  }

  let response: ChatResponse;

  try {
    response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: trimmedPrompt }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`${VALIDATION_ERRORS.MODEL_REQUEST_FAIL}: ${msg}`);
  }

  const content = response?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error(VALIDATION_ERRORS.MODEL_MISSING_CONTENT);
  }

  return content.trim();
}
