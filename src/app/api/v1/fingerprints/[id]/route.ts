import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id: fpId } = await context.params;

    if (db.isPostgres) {
      const [fp, accounts, events] = await Promise.all([
        prisma.fingerprint.findUnique({
          where: { id_appId: { id: fpId, appId: APP_ID } },
        }),
        prisma.account.findMany({
          where: { appId: APP_ID, fingerprintId: fpId },
          orderBy: { firstSeenAt: 'desc' },
          select: { id: true, email: true, status: true, firstSeenAt: true, lastSeenAt: true, ipAddress: true },
        }),
        prisma.event.findMany({
          where: { appId: APP_ID, fingerprintId: fpId },
          orderBy: { createdAt: 'desc' },
          take: 25,
          select: {
            id: true,
            eventType: true,
            email: true,
            ipAddress: true,
            riskScore: true,
            riskLevel: true,
            reasons: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      if (!fp) {
        return NextResponse.json({ error: 'Fingerprint not found' }, { status: 404 });
      }

      return NextResponse.json({
        fingerprint: {
          id: fp.id,
          app_id: fp.appId,
          first_seen_at: Number(fp.firstSeenAt),
          last_seen_at: Number(fp.lastSeenAt),
          total_events: fp.totalEvents,
          linked_accounts_count: fp.linkedAccountsCount,
          primary_ip: fp.primaryIp,
          canvas_hash: fp.canvasHash,
          webgl_renderer: fp.webglRenderer,
          tags: fp.tags,
          is_banned: fp.isBanned,
        },
        accounts: accounts.map((a) => ({
          id: a.id,
          email: a.email,
          status: a.status,
          first_seen_at: Number(a.firstSeenAt),
          last_seen_at: Number(a.lastSeenAt),
          ip_address: a.ipAddress,
        })),
        events: events.map((e) => ({
          id: e.id,
          event_type: e.eventType,
          email: e.email,
          ip_address: e.ipAddress,
          risk_score: e.riskScore,
          risk_level: e.riskLevel,
          reasons: e.reasons,
          status: e.status,
          created_at: Number(e.createdAt),
        })),
      });
    }

    const fp = await db.queryOne(
      `SELECT * FROM fingerprints WHERE id = $1 AND app_id = $2`,
      [fpId, APP_ID]
    );

    if (!fp) {
      return NextResponse.json({ error: 'Fingerprint not found' }, { status: 404 });
    }

    const accounts = await db.query(
      `SELECT id, email, status, first_seen_at, last_seen_at, ip_address
       FROM accounts
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY first_seen_at DESC`,
      [APP_ID, fpId]
    );

    const events = await db.query(
      `SELECT id, event_type, email, ip_address, risk_score, risk_level, reasons, status, created_at
       FROM events
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY created_at DESC
       LIMIT 25`,
      [APP_ID, fpId]
    );

    return NextResponse.json({
      fingerprint: fp,
      accounts,
      events,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
