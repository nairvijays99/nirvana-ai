import { USER_PROMPT_TEMPLATE, VALIDATION_ERRORS } from '@/lib';

export function buildPrompt(userInput: string): string {
  if (typeof userInput !== 'string' || userInput.trim().length === 0) {
    throw new Error(VALIDATION_ERRORS.PROMPT.INVALID);
  }

  return `${USER_PROMPT_TEMPLATE.trim()}
Question:
${userInput.trim()}`;
}
