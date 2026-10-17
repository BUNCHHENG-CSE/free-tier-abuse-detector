import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const queueRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * List review queue items with filtering and pagination
 */
queueRouter.get('/review-queue', (req: Request, res: Response) => {
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
      WHERE r.app_id = ?
    `;
    const params: any[] = [APP_ID];

    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (LOWER(r.email) LIKE ? OR r.fingerprint_id LIKE ? OR e.ip_address LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const items = db.prepare(query).all(...params) as any[];

    // Parse reasons JSON
    const parsed = items.map((item) => ({
      ...item,
      reasons: typeof item.reasons === 'string' ? JSON.parse(item.reasons) : item.reasons,
    }));

    // Stats count
    const pendingCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = ? AND status = 'pending'
    `).get(APP_ID) as { cnt: number }).cnt;

    const totalCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM review_queue WHERE app_id = ?
    `).get(APP_ID) as { cnt: number }).cnt;

    res.json({
      items: parsed,
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
queueRouter.get('/review-queue/:id', (req: Request, res: Response) => {
  try {
    const item = db.prepare(`
      SELECT r.*, e.ip_address, e.user_agent, e.raw_signals, e.event_type,
             f.first_seen_at as fp_first_seen, f.last_seen_at as fp_last_seen,
             f.total_events as fp_total_events, f.linked_accounts_count, f.is_banned
      FROM review_queue r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN fingerprints f ON r.fingerprint_id = f.id AND f.app_id = r.app_id
      WHERE r.id = ? AND r.app_id = ?
    `).get(req.params.id, APP_ID) as any;

    if (!item) {
      return res.status(404).json({ error: 'Review item not found' });
    }

    // Related accounts on this fingerprint
    const linkedAccounts = db.prepare(`
      SELECT email, status, first_seen_at, last_seen_at, ip_address
      FROM accounts
      WHERE app_id = ? AND fingerprint_id = ?
      ORDER BY first_seen_at DESC
    `).all(APP_ID, item.fingerprint_id);

    // Event history on this fingerprint
    const eventTimeline = db.prepare(`
      SELECT id, event_type, email, ip_address, risk_score, status, created_at
      FROM events
      WHERE app_id = ? AND fingerprint_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(APP_ID, item.fingerprint_id);

    res.json({
      item: {
        ...item,
        reasons: typeof item.reasons === 'string' ? JSON.parse(item.reasons) : item.reasons,
        raw_signals: typeof item.raw_signals === 'string' ? JSON.parse(item.raw_signals) : item.raw_signals,
      },
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
queueRouter.post('/review-queue/:id/decision', (req: Request, res: Response) => {
  try {
    const { decision, notes = '' } = req.body; // 'approved' | 'rejected' | 'abuser'

    if (!['approved', 'rejected', 'abuser'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be approved, rejected, or abuser' });
    }

    const item = db.prepare('SELECT * FROM review_queue WHERE id = ? AND app_id = ?').get(req.params.id, APP_ID) as any;
    if (!item) {
      return res.status(404).json({ error: 'Review item not found' });
    }

    const now = Date.now();

    // Update review queue record
    db.prepare(`
      UPDATE review_queue
      SET status = ?, reviewer_notes = ?, reviewed_at = ?
      WHERE id = ? AND app_id = ?
    `).run(decision, notes, now, req.params.id, APP_ID);

    // Update event record status
    db.prepare(`
      UPDATE events
      SET status = ?
      WHERE id = ? AND app_id = ?
    `).run(decision, item.event_id, APP_ID);

    // If marked as abuser, ban device fingerprint and its linked accounts
    if (decision === 'abuser') {
      db.prepare(`
        UPDATE fingerprints
        SET is_banned = 1, tags = 'abuser'
        WHERE id = ? AND app_id = ?
      `).run(item.fingerprint_id, APP_ID);

      db.prepare(`
        UPDATE accounts
        SET status = 'banned'
        WHERE fingerprint_id = ? AND app_id = ?
      `).run(item.fingerprint_id, APP_ID);
    } else if (decision === 'approved' && item.email) {
      db.prepare(`
        UPDATE accounts
        SET status = 'approved'
        WHERE email = ? AND app_id = ?
      `).run(item.email, APP_ID);
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
