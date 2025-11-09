// app/api/chat/route.test.ts
import { POST } from './route';
import { NextRequest } from 'next/server';
import { ollama } from 'ollama-ai-provider-v2';
import { streamText } from 'ai';
import { VALIDATION_ERRORS, SYSTEM_PROMPT } from '@/lib';

// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------
jest.mock('ollama-ai-provider-v2', () => ({
  ollama: jest.fn(),
}));
jest.mock('ai', () => ({
  convertToModelMessages: jest.fn(),
  streamText: jest.fn(),
}));

const mockOllama = ollama as jest.Mock;
const mockStreamText = streamText as jest.Mock;
const mockConvertMessages = require('ai').convertToModelMessages as jest.Mock;

// ---------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

describe('POST /api/chat', () => {
  const validMessage = {
    id: 'msg1',
    role: 'user' as const,
    parts: [{ type: 'text' as const, text: 'Hello' }],
  };
  const validBody = { messages: [validMessage] };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OLLAMA_MODEL = 'llama3.1:8b';
  });

  // -------------------------------------------------
  // 1. SUCCESS
  // -------------------------------------------------
  it('should stream a response for a valid payload', async () => {
    const mockModel = { id: 'llama3.1:8b' };
    mockOllama.mockReturnValue(mockModel);

    const mockResult = {
      toUIMessageStreamResponse: jest.fn().mockReturnValue(new Response('stream', { status: 200 })),
    };
    mockStreamText.mockResolvedValue(mockResult);
    mockConvertMessages.mockReturnValue([{ role: 'user', content: 'Hello' }]);

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockOllama).toHaveBeenCalledWith('llama3.1:8b');
    expect(mockConvertMessages).toHaveBeenCalledWith([validMessage]);
    expect(mockStreamText).toHaveBeenCalledWith({
      model: mockModel,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7,
    });
    expect(mockResult.toUIMessageStreamResponse).toHaveBeenCalledWith({
      headers: expect.objectContaining({
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }),
    });
  });

  // -------------------------------------------------
  // 2. INVALID JSON (parse error)
  // -------------------------------------------------
  it('should return 400 for malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: '{ "messages": [ { "id": "1", "role": "user", "parts": [] }', // <-- broken
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
  });

  // -------------------------------------------------
  // 3. ZOD validation failures
  // -------------------------------------------------
  it('should return 400 when messages array is empty', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
    expect(json.details).toContainEqual(
      expect.objectContaining({
        code: 'too_small',
        path: ['messages'],
        minimum: 1,
        inclusive: true,
      })
    );
  });

  it('should return 400 when a text part is empty', async () => {
    const payload = {
      messages: [
        {
          id: 'msg1',
          role: 'user',
          parts: [{ type: 'text', text: '' }], // <-- violates min(1)
        },
      ],
    };

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
    expect(json.details).toContainEqual(
      expect.objectContaining({
        code: 'too_small',
        path: ['messages', 0, 'parts', 0, 'text'],
        message: expect.stringContaining('>=1'), // Zod 3.22+ wording
        minimum: 1,
        inclusive: true,
      })
    );
  });

  // -------------------------------------------------
  // 4. Model configuration errors
  // -------------------------------------------------
  it('should return 503 when OLLAMA_MODEL env is missing', async () => {
    delete process.env.OLLAMA_MODEL;

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toBe(VALIDATION_ERRORS.MODEL_NOT_CONFIGURED);
  });

  it('should return 503 when ollama() returns null', async () => {
    mockOllama.mockReturnValue(null);

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toBe(VALIDATION_ERRORS.MODEL_NOT_AVAILABLE);
  });

  // -------------------------------------------------
  // 5. Network / Ollama errors
  // -------------------------------------------------
  it('should return 502 for fetch-failed / ECONNREFUSED', async () => {
    mockOllama.mockReturnValue({});

    const err = new Error('fetch failed');
    // @ts-ignore – simulate Node’s cause
    err.cause = { code: 'ECONNREFUSED' };
    mockStreamText.mockRejectedValue(err);

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toBe(VALIDATION_ERRORS.MODEL_REQUEST_FAIL);
  });

  // -------------------------------------------------
  // 6. Generic / unknown errors
  // -------------------------------------------------
  it('should return 500 for generic errors', async () => {
    mockOllama.mockReturnValue({});
    mockStreamText.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe(VALIDATION_ERRORS.INTERNAL_SERVER_ERROR);
    expect(json.message).toBe('boom');
  });

  it('should return 500 for non-Error throws', async () => {
    mockOllama.mockReturnValue({});
    mockStreamText.mockRejectedValue('string-error');

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe(VALIDATION_ERRORS.UNKNOWN_ERROR);
  });

  it('should accept step-start and step-end parts', async () => {
    const payload = {
      messages: [
        {
          id: 'u1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hi' }],
        },
        {
          id: 'a1',
          role: 'assistant',
          parts: [{ type: 'step-start' }, { type: 'text', text: 'Ok' }, { type: 'step-end' }],
        },
      ],
    };

    mockOllama.mockReturnValue({});
    const mockResult = { toUIMessageStreamResponse: jest.fn().mockReturnValue(new Response()) };
    mockStreamText.mockResolvedValue(mockResult);
    mockConvertMessages.mockReturnValue([]);

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
