import { NextResponse } from 'next/server';
import { generateText } from '@/lib';
import { VALIDATION_ERRORS } from '@/lib/utils';
import { z } from 'zod';

// Define message schema for validation
const MessageSchema = z.object({
  message: z
    .string(VALIDATION_ERRORS.MESSAGE.REQUIRED)
    .min(1, VALIDATION_ERRORS.MESSAGE.EMPTY)
    .max(2000, VALIDATION_ERRORS.MESSAGE.TOO_LONG),
});

// Force Next.js to use Node.js over Edge runtime for better compatibility
export const runtime = 'nodejs';

// Ensures fresh execution on every request
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Validate message using Zod
    const parseResult = MessageSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const message = issues[0]?.message ?? VALIDATION_ERRORS.INVALID_JSON;

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { message } = parseResult.data;

    try {
      // Generate text response
      const response = await generateText(message);

      return new Response(response, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (generationError) {
      throw generationError;
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: VALIDATION_ERRORS.INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
