// app/lib/ollama/generateText.ts
import ollama from 'ollama';
import { VALIDATION_ERRORS, SYSTEM_PROMPT } from '@/lib';
import type { ChatResponse } from 'ollama';

export async function generateText(prompt: string): Promise<string> {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error(VALIDATION_ERRORS.PROMPT.INVALID);
  }

  const input = prompt.trim();

  const model = process.env.OLLAMA_MODEL;
  if (!model) {
    throw new Error(VALIDATION_ERRORS.INVALID_MODEL);
  }

  const response: ChatResponse = await ollama
    .chat({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
    })
    .catch(err => {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`${VALIDATION_ERRORS.MODEL_REQUEST_FAIL}: ${msg}`);
    });

  const content = response.message?.content;
  if (typeof content !== 'string') {
    throw new Error(VALIDATION_ERRORS.MODEL_MISSING_CONTENT);
  }

  return content.trim();
}
