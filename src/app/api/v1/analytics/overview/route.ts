import { db, initDatabase } from '@/lib/db/database';
import { prisma } from '@/lib/db/prisma';
import { resolveAppId, json, error } from '@/lib/server/apiHelper';

export async function GET(req: Request) {
  try {
    await initDatabase();
    const appId = await resolveAppId(req);

    let _totalEvents = 0;
    let totalSignups = 0;
    let flaggedCount = 0;
    let pendingReviewCount = 0;
    let multiAccountFpCount = 0;

    if (db.isPostgres) {
      const counts = await prisma.$transaction([
        prisma.event.count({ where: { appId } }),
        prisma.event.count({ where: { appId, eventType: 'signup' } }),
        prisma.event.count({ where: { appId, status: { in: ['flagged', 'rejected', 'abuser', 'challenged'] } } }),
        prisma.reviewQueue.count({ where: { appId, status: 'pending' } }),
        prisma.fingerprint.count({ where: { appId, linkedAccountsCount: { gt: 1 } } }),
      ]);
      [_totalEvents, totalSignups, flaggedCount, pendingReviewCount, multiAccountFpCount] = counts;
    } else {
      const totalEventsRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM events WHERE app_id = $1`,
        [appId]
      );
      _totalEvents = parseInt(String(totalEventsRow?.cnt || 0), 10);

      const totalSignupsRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM events WHERE app_id = $1 AND event_type = 'signup'`,
        [appId]
      );
      totalSignups = parseInt(String(totalSignupsRow?.cnt || 0), 10);

      const flaggedRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM events WHERE app_id = $1 AND status IN ('flagged', 'rejected', 'abuser', 'challenged')`,
        [appId]
      );
      flaggedCount = parseInt(String(flaggedRow?.cnt || 0), 10);

      const pendingRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = $1 AND status = 'pending'`,
        [appId]
      );
      pendingReviewCount = parseInt(String(pendingRow?.cnt || 0), 10);

      const multiAccountRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM fingerprints WHERE app_id = $1 AND linked_accounts_count > 1`,
        [appId]
      );
      multiAccountFpCount = parseInt(String(multiAccountRow?.cnt || 0), 10);
    }

    const abuseSharePercent = totalSignups > 0 ? parseFloat(((flaggedCount / totalSignups) * 100).toFixed(1)) : 0;
    const estimatedSavings = Math.round(flaggedCount * 4.25);

    const timelineRows = await db.query<{
      created_at: number;
      status: string;
    }>(
      `SELECT created_at, status FROM events
       WHERE app_id = $1
       ORDER BY created_at ASC
       LIMIT 100`,
      [appId]
    );

    const timeBuckets = new Map<string, { total: number; flagged: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      timeBuckets.set(label, { total: 0, flagged: 0 });
    }

    timelineRows.forEach((row) => {
      const d = new Date(row.created_at);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (timeBuckets.has(label)) {
        const b = timeBuckets.get(label)!;
        b.total++;
        if (['flagged', 'rejected', 'abuser', 'challenged'].includes(row.status)) {
          b.flagged++;
        }
      }
    });

    const timeline = Array.from(timeBuckets.entries()).map(([time, data]) => ({
      time,
      total: data.total,
      flagged: data.flagged,
    }));

    const eventsWithReasons = await db.query<{ reasons: any }>(
      `SELECT reasons FROM events WHERE app_id = $1 AND reasons != '[]' ORDER BY created_at DESC LIMIT 100`,
      [appId]
    );

    const reasonCounts = new Map<string, number>();
    eventsWithReasons.forEach((ev) => {
      const list = Array.isArray(ev.reasons) ? ev.reasons : [];
      list.forEach((r: string) => {
        const clean = r.split('(')[0].trim();
        reasonCounts.set(clean, (reasonCounts.get(clean) || 0) + 1);
      });
    });

    const topReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return json({
      metrics: {
        totalSignups,
        flaggedCount,
        pendingReviewCount,
        multiAccountFpCount,
        abuseSharePercent,
        estimatedSavings,
      },
      timeline,
      topReasons,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
