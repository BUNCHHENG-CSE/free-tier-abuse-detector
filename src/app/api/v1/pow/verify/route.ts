import { NextRequest, NextResponse } from 'next/server';
import { validateSolution } from '@/lib/services/powService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(req: NextRequest) {
  try {
    const { fingerprintId, solution } = await req.json();
    if (!fingerprintId || !solution) {
      return NextResponse.json({ error: 'Missing fingerprintId or solution' }, { status: 400 });
    }

    const result = await validateSolution(APP_ID, fingerprintId, solution);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
