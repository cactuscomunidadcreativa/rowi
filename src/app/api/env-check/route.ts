import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.OPENAI_API_KEY || '';
  return NextResponse.json({
    ok: true,
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 8) : null,
  });
}
