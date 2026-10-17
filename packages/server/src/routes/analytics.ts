import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getClusterGraph } from '../services/clusterService';

export const analyticsRouter = Router();

const APP_ID = 'app_demo_default';

analyticsRouter.get('/analytics/overview', (req: Request, res: Response) => {
  try {
    const totalEvents = (db.prepare(`
      SELECT COUNT(*) as cnt FROM events WHERE app_id = ?
    `).get(APP_ID) as { cnt: number }).cnt;

    const totalSignups = (db.prepare(`
      SELECT COUNT(*) as cnt FROM events WHERE app_id = ? AND event_type = 'signup'
    `).get(APP_ID) as { cnt: number }).cnt;

    const flaggedCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM events WHERE app_id = ? AND status IN ('flagged', 'rejected', 'abuser')
    `).get(APP_ID) as { cnt: number }).cnt;

    const pendingReviewCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = ? AND status = 'pending'
    `).get(APP_ID) as { cnt: number }).cnt;

    const multiAccountFpCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM fingerprints WHERE app_id = ? AND linked_accounts_count > 1
    `).get(APP_ID) as { cnt: number }).cnt;

    const denominator = totalSignups > 0 ? totalSignups : (totalEvents > 0 ? totalEvents : 1);
    const abuseSharePercent = parseFloat(((flaggedCount / denominator) * 100).toFixed(1));

    // Estimated revenue leakage prevented: each abuse account costs ~$12 in free AI compute / database quota
    const estimatedSavings = flaggedCount * 12;

    // 24-hour activity timeline (hourly buckets)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = db.prepare(`
      SELECT created_at, status FROM events
      WHERE app_id = ? AND created_at > ?
      ORDER BY created_at ASC
    `).all(APP_ID, twentyFourHoursAgo) as { created_at: number; status: string }[];

    // Bucket into 12 two-hour intervals
    const timelineBuckets: { time: string; total: number; flagged: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const bucketEnd = Date.now() - i * 2 * 60 * 60 * 1000;
      const bucketStart = bucketEnd - 2 * 60 * 60 * 1000;
      const hourLabel = new Date(bucketEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const inBucket = recentEvents.filter((e) => e.created_at >= bucketStart && e.created_at < bucketEnd);
      const flaggedInBucket = inBucket.filter((e) => ['flagged', 'rejected', 'abuser'].includes(e.status));

      timelineBuckets.push({
        time: hourLabel,
        total: inBucket.length,
        flagged: flaggedInBucket.length,
      });
    }

    // Top triggered reasons
    const recentFlagged = db.prepare(`
      SELECT reasons FROM events
      WHERE app_id = ? AND status IN ('flagged', 'rejected', 'abuser')
      ORDER BY created_at DESC
      LIMIT 100
    `).all(APP_ID) as { reasons: string }[];

    const reasonCounts: Record<string, number> = {};
    recentFlagged.forEach((row) => {
      try {
        const parsed = JSON.parse(row.reasons);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: string) => {
            // Simplify reason string for chart categorization
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
      } catch {
        // Ignored
      }
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

analyticsRouter.get('/analytics/clusters', (req: Request, res: Response) => {
  try {
    const graph = getClusterGraph(APP_ID);
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
