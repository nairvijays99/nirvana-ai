import { NextRequest, NextResponse } from 'next/server';
import { ollama } from 'ollama-ai-provider-v2';
import { convertToModelMessages, streamText } from 'ai';
import { VALIDATION_ERRORS, SYSTEM_PROMPT } from '@/lib';
import { z } from 'zod';

const MessagePartSchema = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.enum(['step-start', 'step-end']),
  }),
]);

const UIMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  parts: z.array(MessagePartSchema),
});

const ChatRequestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(UIMessageSchema).min(1),
  trigger: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body;

  try {
    body = await req.json();
  } catch (error) {
    // Handle JSON parse errors BEFORE Zod
    return NextResponse.json(
      { error: VALIDATION_ERRORS.INVALID_JSON, details: error },
      { status: 400 }
    );
  }
  try {
    const parseResult = ChatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: VALIDATION_ERRORS.INVALID_JSON, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { messages } = parseResult.data;

    const modelName = process.env.OLLAMA_MODEL as string | undefined;
    if (!modelName) {
      return NextResponse.json({ error: VALIDATION_ERRORS.MODEL_NOT_CONFIGURED }, { status: 503 });
    }

    const model = ollama(modelName);
    if (!model) {
      return NextResponse.json({ error: VALIDATION_ERRORS.MODEL_NOT_AVAILABLE }, { status: 503 });
    }

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    // Stream response
    const result = await streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      temperature: 0.7,
    });

    // Return streaming response compatible with useChat()
    return result.toUIMessageStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: VALIDATION_ERRORS.INVALID_JSON, details: error.issues },
        { status: 400 }
      );
    }

    // Handle network / Ollama connection errors
    if (error instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (error.message.includes('fetch failed') || (error.cause as any)?.code === 'ECONNREFUSED') {
        return NextResponse.json({ error: VALIDATION_ERRORS.MODEL_REQUEST_FAIL }, { status: 502 });
      }

      return NextResponse.json(
        { error: VALIDATION_ERRORS.INTERNAL_SERVER_ERROR, message: error.message },
        { status: 500 }
      );
    }

    // Catch-all for unexpected throw types
    return NextResponse.json({ error: VALIDATION_ERRORS.UNKNOWN_ERROR }, { status: 500 });
  }
}
