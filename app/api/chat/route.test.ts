import { POST } from './route';
import { generateText } from '@/lib';
import { VALIDATION_ERRORS } from '@/lib/utils';
import { z } from 'zod';

// ——————————————————————— MOCKS ———————————————————————

jest.mock('@/lib', () => ({
  generateText: jest.fn(),
}));

// Properly mock NextResponse.json to return a real Response
jest.mock('next/server', () => {
  const mockJsonResponse = (data: any, init?: ResponseInit) => {
    return new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  };

  return {
    NextResponse: {
      json: jest.fn().mockImplementation(mockJsonResponse),
    },
  };
});

// Mock global Response for `new Response(...)` in success path
const OriginalResponse = global.Response;
global.Response = class extends Response {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, {
      status: init?.status || 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...init?.headers,
      },
    });
  }
} as any;

const createMockRequest = (body: any) =>
  ({
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Request;

const createInvalidJsonRequest = () =>
  ({
    json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
  }) as unknown as Request;

describe('POST /api/chat', () => {
  const mockGenerateText = generateText as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return generated text on valid input', async () => {
    const input = { message: 'Hello' };
    mockGenerateText.mockResolvedValue('AI response');

    const req = createMockRequest(input);
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('AI response');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('should return 400 for invalid JSON', async () => {
    const req = createInvalidJsonRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: VALIDATION_ERRORS.INVALID_JSON });
  });

  it('should return 400 if message is missing', async () => {
    const req = createMockRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe(VALIDATION_ERRORS.MESSAGE.REQUIRED);
  });

  it('should return 400 if message is empty string', async () => {
    const req = createMockRequest({ message: '' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe(VALIDATION_ERRORS.MESSAGE.EMPTY);
  });

  it('should return 400 if message exceeds 2000 characters', async () => {
    const req = createMockRequest({ message: 'a'.repeat(2001) });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe(VALIDATION_ERRORS.MESSAGE.TOO_LONG);
  });

  it('should return 400 for non-object body (e.g., string)', async () => {
    const req = createMockRequest('invalid');
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Expected object/i);
  });

  it('should return first validation error only', async () => {
    const req = createMockRequest({ message: '' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe(VALIDATION_ERRORS.MESSAGE.EMPTY);
  });

  it('should return 500 if generateText throws', async () => {
    mockGenerateText.mockRejectedValue(new Error('AI down'));

    const req = createMockRequest({ message: 'hi' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });

  // ——————— EDGE CASES ———————
  it('should handle message with exactly 2000 characters', async () => {
    const msg = 'a'.repeat(2000);
    mockGenerateText.mockResolvedValue('success');

    const req = createMockRequest({ message: msg });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('success');
  });

  it('should handle message with leading/trailing whitespace', async () => {
    const input = { message: '  hello  ' };
    mockGenerateText.mockResolvedValue('ok');

    const req = createMockRequest(input);
    await POST(req);
  });

  it('should set correct security headers on success', async () => {
    mockGenerateText.mockResolvedValue('resp');

    const req = createMockRequest({ message: 'hi' });
    const res = await POST(req);

    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
