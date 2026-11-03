import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db/database';
import { sendTestWebhook } from '@/lib/services/webhookService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const { url, type } = await req.json();
    const result = await sendTestWebhook(APP_ID, url, type);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
