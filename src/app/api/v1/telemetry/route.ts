import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';
import { extractClientIp } from '@/lib/services/ipEnricher';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    const { eventType = 'pageview', clientFingerprintId, clientToken, signals } = body;

    if (!clientFingerprintId) {
      return NextResponse.json({ error: 'Missing clientFingerprintId' }, { status: 400 });
    }

    const ipAddress = extractClientIp(req);
    const now = Date.now();
    const eventId = `ev_telem_${now}_${Math.random().toString(36).slice(2, 7)}`;

    await db.execute(
      `INSERT INTO events (
        id, app_id, event_type, email, normalized_email, user_id,
        fingerprint_id, client_token, ip_address, user_agent,
        risk_score, risk_level, reasons, status, raw_signals, created_at
      )
      VALUES ($1, $2, $3, NULL, NULL, NULL, $4, $5, $6, $7, 0, 'LOW', '[]', 'telemetry', $8, $9)`,
      [
        eventId,
        'app_demo_default',
        eventType,
        clientFingerprintId,
        clientToken || null,
        ipAddress,
        req.headers.get('user-agent') || null,
        signals || null,
        now,
      ]
    );

    return NextResponse.json({ success: true, eventId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
