import { NextRequest, NextResponse } from 'next/server';
import { resetDeviceQuota } from '@/lib/services/quotaService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(req: NextRequest) {
  try {
    const { fingerprintId } = await req.json();
    if (!fingerprintId) {
      return NextResponse.json({ error: 'Missing fingerprintId' }, { status: 400 });
    }

    const success = await resetDeviceQuota(APP_ID, fingerprintId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
