import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { prisma } from '../db/prisma';
import { getClusterGraph } from '../services/clusterService';

export const analyticsRouter = Router();

const APP_ID = 'app_demo_default';

analyticsRouter.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    let totalEvents = 0;
    let totalSignups = 0;
    let flaggedCount = 0;
    let pendingReviewCount = 0;
    let multiAccountFpCount = 0;

    // Pipelined count queries via Prisma ORM when PostgreSQL is active
    if (db.isPostgres) {
      const counts = await prisma.$transaction([
        prisma.event.count({ where: { appId: APP_ID } }),
        prisma.event.count({ where: { appId: APP_ID, eventType: 'signup' } }),
        prisma.event.count({ where: { appId: APP_ID, status: { in: ['flagged', 'rejected', 'abuser'] } } }),
        prisma.reviewQueue.count({ where: { appId: APP_ID, status: 'pending' } }),
        prisma.fingerprint.count({ where: { appId: APP_ID, linkedAccountsCount: { gt: 1 } } }),
      ]);
      [totalEvents, totalSignups, flaggedCount, pendingReviewCount, multiAccountFpCount] = counts;
    } else {
      const totalEventsRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM events WHERE app_id = $1`,
        [APP_ID]
      );
      totalEvents = parseInt(String(totalEventsRow?.cnt || 0), 10);

      const totalSignupsRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM events WHERE app_id = $1 AND event_type = 'signup'`,
        [APP_ID]
      );
      totalSignups = parseInt(String(totalSignupsRow?.cnt || 0), 10);

      const flaggedRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM events WHERE app_id = $1 AND status IN ('flagged', 'rejected', 'abuser')`,
        [APP_ID]
      );
      flaggedCount = parseInt(String(flaggedRow?.cnt || 0), 10);

      const pendingRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = $1 AND status = 'pending'`,
        [APP_ID]
      );
      pendingReviewCount = parseInt(String(pendingRow?.cnt || 0), 10);

      const multiAccountFpRow = await db.queryOne<{ cnt: number | string }>(
        `SELECT COUNT(*) as cnt FROM fingerprints WHERE app_id = $1 AND linked_accounts_count > 1`,
        [APP_ID]
      );
      multiAccountFpCount = parseInt(String(multiAccountFpRow?.cnt || 0), 10);
    }

    const denominator = totalSignups > 0 ? totalSignups : (totalEvents > 0 ? totalEvents : 1);
    const abuseSharePercent = parseFloat(((flaggedCount / denominator) * 100).toFixed(1));
    const estimatedSavings = flaggedCount * 12;

    // 24-hour activity timeline
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = await db.query<{ created_at: number | string; status: string }>(
      `SELECT created_at, status FROM events
       WHERE app_id = $1 AND created_at > $2
       ORDER BY created_at ASC`,
      [APP_ID, twentyFourHoursAgo]
    );

    const timelineBuckets: { time: string; total: number; flagged: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const bucketEnd = Date.now() - i * 2 * 60 * 60 * 1000;
      const bucketStart = bucketEnd - 2 * 60 * 60 * 1000;
      const hourLabel = new Date(bucketEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const inBucket = recentEvents.filter((e) => {
        const t = parseInt(String(e.created_at), 10);
        return t >= bucketStart && t < bucketEnd;
      });
      const flaggedInBucket = inBucket.filter((e) => ['flagged', 'rejected', 'abuser'].includes(e.status));

      timelineBuckets.push({
        time: hourLabel,
        total: inBucket.length,
        flagged: flaggedInBucket.length,
      });
    }

    // Top triggered reasons
    const recentFlagged = await db.query<{ reasons: any }>(
      `SELECT reasons FROM events
       WHERE app_id = $1 AND status IN ('flagged', 'rejected', 'abuser')
       ORDER BY created_at DESC
       LIMIT 100`,
      [APP_ID]
    );

    const reasonCounts: Record<string, number> = {};
    recentFlagged.forEach((row) => {
      try {
        const parsed = typeof row.reasons === 'string' ? JSON.parse(row.reasons) : row.reasons;
        if (Array.isArray(parsed)) {
          parsed.forEach((r: string) => {
            let category = 'Other Risk Signal';
            if (/velocity/i.test(r)) category = 'Excessive 24h Velocity';
            else if (/distinct accounts/i.test(r)) category = 'Multi-Account Clustering';
            else if (/disposable/i.test(r)) category = 'Disposable / Temp Email';
            else if (/webdriver|headless|automation/i.test(r)) category = 'Headless / Bot Automation';
            else if (/vpn|ip hopping/i.test(r)) category = 'VPN / Rapid IP Hopping';
            else if (/alias|plus-addressing/i.test(r)) category = 'Email Subaddressing Reuse';
            else if (/abuser/i.test(r)) category = 'Known Abuser Device';

            reasonCounts[category] = (reasonCounts[category] || 0) + 1;
          });
        }
      } catch {}
    });

    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      metrics: {
        totalSignups: totalSignups || totalEvents,
        flaggedCount,
        pendingReviewCount,
        multiAccountFpCount,
        abuseSharePercent,
        estimatedSavings,
      },
      timeline: timelineBuckets,
      topReasons,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

analyticsRouter.get('/analytics/clusters', async (req: Request, res: Response) => {
  try {
    const graph = await getClusterGraph(APP_ID);
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
