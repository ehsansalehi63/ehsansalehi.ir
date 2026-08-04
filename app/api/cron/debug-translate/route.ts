import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== 'Bearer admin123') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const GATE_KEY = 'sk-DGNaVGvNi7RhsW1FpsweR1GxrqQRq11wuJo53NSr1Fw1PMwE';

  try {
    const res = await fetch('https://api.gapgpt.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATE_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Translate to Persian. Return only the translation.' },
          { role: 'user', content: 'AI is transforming technology' }
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const text = await res.text();

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      response: text.slice(0, 500),
      keyPrefix: GATE_KEY.slice(0, 10),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: msg,
      keyPrefix: GATE_KEY.slice(0, 10),
    }, { status: 500 });
  }
}
