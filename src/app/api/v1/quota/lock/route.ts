import { NextRequest, NextResponse } from 'next/server';
import { lockDeviceQuota } from '@/lib/services/quotaService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(req: NextRequest) {
  try {
    const { fingerprintId, isLocked } = await req.json();
    if (!fingerprintId) {
      return NextResponse.json({ error: 'Missing fingerprintId' }, { status: 400 });
    }

    const success = await lockDeviceQuota(APP_ID, fingerprintId, Boolean(isLocked));
    return NextResponse.json({ success, isLocked: Boolean(isLocked) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
