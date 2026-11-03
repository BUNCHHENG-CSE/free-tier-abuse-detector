import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';
import { evaluateRisk } from '@/lib/services/riskEngine';
import { extractClientIp } from '@/lib/services/ipEnricher';

export const dynamic = 'force-dynamic';

async function resolveAppId(req: NextRequest, body: any): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const apiKey =
    req.headers.get('x-abuseshield-key') ||
    searchParams.get('apiKey') ||
    body?.apiKey;

  if (!apiKey) {
    return 'app_demo_default';
  }

  const app = await db.queryOne<{ id: string }>('SELECT id FROM apps WHERE api_key = $1', [apiKey]);
  if (!app) {
    if (apiKey === 'pk_live_abuseshield_demo' || apiKey === 'anon') {
      return 'app_demo_default';
    }
    return null;
  }

  return app.id;
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    const appId = await resolveAppId(req, body);

    if (!appId) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const {
      email,
      userId,
      action = 'signup',
      clientFingerprintId,
      clientToken,
      signals,
      powSolution,
    } = body;

    if (!clientFingerprintId) {
      return NextResponse.json({ error: 'Missing clientFingerprintId' }, { status: 400 });
    }

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';

    const result = await evaluateRisk({
      appId,
      email,
      userId,
      action,
      clientFingerprintId,
      clientToken,
      signals,
      ipAddress,
      userAgent,
      powSolution,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[Ingest] Verify error:', err);
    return NextResponse.json(
      { error: 'Internal verification error', message: err.message },
      { status: 500 }
    );
  }
}
