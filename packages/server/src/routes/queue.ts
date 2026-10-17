import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const queueRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * List review queue items with filtering and pagination
 */
queueRouter.get('/review-queue', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'all';
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = `
      SELECT r.id, r.event_id, r.email, r.fingerprint_id, r.risk_score, r.reasons,
             r.status, r.reviewer_notes, r.reviewed_at, r.created_at,
             e.ip_address, e.event_type, e.user_agent, e.risk_level,
             f.linked_accounts_count, f.is_banned
      FROM review_queue r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN fingerprints f ON r.fingerprint_id = f.id AND f.app_id = r.app_id
      WHERE r.app_id = $1
    `;
    const params: any[] = [APP_ID];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      query += ` AND (LOWER(r.email) LIKE $${pIdx} OR r.fingerprint_id LIKE $${pIdx} OR e.ip_address LIKE $${pIdx})`;
    }

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    query += ` ORDER BY r.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const items = await db.query(query, params);

    const pendingRow = await db.queryOne<{ cnt: number | string }>(
      `SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = $1 AND status = 'pending'`,
      [APP_ID]
    );
    const pendingCount = parseInt(String(pendingRow?.cnt || 0), 10);

    const totalRow = await db.queryOne<{ cnt: number | string }>(
      `SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = $1`,
      [APP_ID]
    );
    const totalCount = parseInt(String(totalRow?.cnt || 0), 10);

    res.json({
      items,
      pendingCount,
      totalCount,
      limit,
      offset,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get detailed item in review queue
 */
queueRouter.get('/review-queue/:id', async (req: Request, res: Response) => {
  try {
    const item = await db.queryOne(
      `SELECT r.*, e.ip_address, e.user_agent, e.raw_signals, e.event_type,
              f.first_seen_at as fp_first_seen, f.last_seen_at as fp_last_seen,
              f.total_events as fp_total_events, f.linked_accounts_count, f.is_banned
       FROM review_queue r
       JOIN events e ON r.event_id = e.id
       LEFT JOIN fingerprints f ON r.fingerprint_id = f.id AND f.app_id = r.app_id
       WHERE r.id = $1 AND r.app_id = $2`,
      [req.params.id, APP_ID]
    );

    if (!item) {
      return res.status(404).json({ error: 'Review item not found' });
    }

    // Related accounts on this fingerprint
    const linkedAccounts = await db.query(
      `SELECT email, status, first_seen_at, last_seen_at, ip_address
       FROM accounts
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY first_seen_at DESC`,
      [APP_ID, item.fingerprint_id]
    );

    // Event history on this fingerprint
    const eventTimeline = await db.query(
      `SELECT id, event_type, email, ip_address, risk_score, status, created_at
       FROM events
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY created_at DESC
       LIMIT 20`,
      [APP_ID, item.fingerprint_id]
    );

    res.json({
      item,
      linkedAccounts,
      eventTimeline,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Submit manual review decision: approve, reject, or mark as abuser
 */
queueRouter.post('/review-queue/:id/decision', async (req: Request, res: Response) => {
  try {
    const { decision, notes = '' } = req.body;

    if (!['approved', 'rejected', 'abuser'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be approved, rejected, or abuser' });
    }

    const item = await db.queryOne<{ event_id: string; fingerprint_id: string; email?: string }>(
      'SELECT * FROM review_queue WHERE id = $1 AND app_id = $2',
      [req.params.id, APP_ID]
    );

    if (!item) {
      return res.status(404).json({ error: 'Review item not found' });
    }

    const now = Date.now();

    await db.execute(
      `UPDATE review_queue
       SET status = $1, reviewer_notes = $2, reviewed_at = $3
       WHERE id = $4 AND app_id = $5`,
      [decision, notes, now, req.params.id, APP_ID]
    );

    await db.execute(
      `UPDATE events
       SET status = $1
       WHERE id = $2 AND app_id = $3`,
      [decision, item.event_id, APP_ID]
    );

    if (decision === 'abuser') {
      await db.execute(
        `UPDATE fingerprints
         SET is_banned = 1, tags = 'abuser'
         WHERE id = $1 AND app_id = $2`,
        [item.fingerprint_id, APP_ID]
      );

      await db.execute(
        `UPDATE accounts
         SET status = 'banned'
         WHERE fingerprint_id = $1 AND app_id = $2`,
        [item.fingerprint_id, APP_ID]
      );
    } else if (decision === 'approved' && item.email) {
      await db.execute(
        `UPDATE accounts
         SET status = 'approved'
         WHERE email = $1 AND app_id = $2`,
        [item.email, APP_ID]
      );
    }

    res.json({
      success: true,
      decision,
      reviewedAt: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
