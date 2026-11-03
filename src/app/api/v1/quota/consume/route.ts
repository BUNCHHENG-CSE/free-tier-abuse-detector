import { NextRequest, NextResponse } from 'next/server';
import { consumeDeviceQuota } from '@/lib/services/quotaService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(req: NextRequest) {
  try {
    const { fingerprintId, amount = 1, email } = await req.json();
    if (!fingerprintId) {
      return NextResponse.json({ error: 'Missing fingerprintId' }, { status: 400 });
    }

    const result = await consumeDeviceQuota(APP_ID, fingerprintId, Number(amount), email);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
