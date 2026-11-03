import { NextRequest, NextResponse } from 'next/server';
import { listDeviceQuotas } from '@/lib/services/quotaService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const result = await listDeviceQuotas(APP_ID, limit, offset);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
