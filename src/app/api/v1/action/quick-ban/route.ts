import { NextRequest } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';
import { lockDeviceQuota } from '@/lib/services/quotaService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await initDatabase();
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId') || 'app_demo_default';
  const fpId = searchParams.get('fpId');

  if (!fpId) {
    return new Response('<h3>Error: Missing fpId parameter</h3>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const now = Date.now();

    await db.execute(
      `UPDATE fingerprints
       SET is_banned = 1, tags = 'banned_slack_discord', last_seen_at = $1
       WHERE app_id = $2 AND id = $3`,
      [now, appId, fpId]
    );

    await db.execute(
      `UPDATE accounts
       SET status = 'banned', last_seen_at = $1
       WHERE app_id = $2 AND fingerprint_id = $3`,
      [now, appId, fpId]
    );

    await lockDeviceQuota(appId, fpId, true);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AbuseShield • Device Banned</title>
        <style>
          body {
            background-color: #060912;
            color: #f8fafc;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .card {
            background: rgba(11, 16, 29, 0.9);
            border: 1px solid rgba(244, 63, 94, 0.4);
            border-radius: 20px;
            padding: 32px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.2);
          }
          h2 { color: #f43f5e; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .badge {
            background: rgba(244, 63, 94, 0.15);
            border: 1px solid rgba(244, 63, 94, 0.3);
            color: #fda4af;
            padding: 6px 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            display: inline-block;
            margin: 12px 0;
            word-break: break-all;
          }
          a.btn {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 24px;
            border-radius: 12px;
            background: #6366f1;
            color: #fff;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: background 0.2s;
          }
          a.btn:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🛡️ Device Successfully Banned</h2>
          <p>The hardware fingerprint and all linked accounts have been banned and its free credit quota has been locked.</p>
          <div class="badge">${fpId}</div>
          <div>
            <a href="/" class="btn">Return to AbuseShield Dashboard &rarr;</a>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    return new Response(`<h3>Error executing ban: ${err.message}</h3>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
