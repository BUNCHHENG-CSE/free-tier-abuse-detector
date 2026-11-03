import { db } from '../db/database';
import { NextResponse } from 'next/server';

export async function resolveAppId(req: Request): Promise<string> {
  const apiKey = req.headers.get('x-abuseshield-key') || 'anon';

  if (!apiKey || apiKey === 'pk_live_abuseshield_demo' || apiKey === 'anon') {
    return 'app_demo_default';
  }

  const app = await db.queryOne<{ id: string }>('SELECT id FROM apps WHERE api_key = $1', [apiKey]);
  return app ? app.id : 'app_demo_default';
}

export function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-AbuseShield-Key',
    },
  });
}

export function error(message: string, status = 500) {
  return NextResponse.json({ error: message }, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-AbuseShield-Key',
    },
  });
}
