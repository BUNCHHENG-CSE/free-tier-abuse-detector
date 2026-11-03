import { NextRequest, NextResponse } from 'next/server';
import { createChallenge } from '@/lib/services/powService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(req: NextRequest) {
  try {
    const { fingerprintId, difficulty } = await req.json();
    if (!fingerprintId) {
      return NextResponse.json({ error: 'Missing fingerprintId' }, { status: 400 });
    }

    const challenge = await createChallenge(
      APP_ID,
      fingerprintId,
      difficulty ? Number(difficulty) : undefined
    );
    return NextResponse.json(challenge);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
