import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const authError = verifyCron(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const text = body.text || 'AI is transforming technology';
  
  const GATE_KEY = 'sk-DGNaVV1xCr8zGp5pX4I2uJ6c4fDcNpEMwE';
  const BASE_URL = 'https://api.gapgpt.app/v1';
  
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATE_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Translate to Persian. Return only the translation.' },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20000),
    });
    
    const data = await res.text();
    
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      response: data.slice(0, 500),
      keyPrefix: GATE_KEY.slice(0, 6),
      baseUrl: BASE_URL,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      keyPrefix: GATE_KEY.slice(0, 6),
      baseUrl: BASE_URL,
    }, { status: 500 });
  }
}
