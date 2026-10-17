import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const fingerprintsRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * List fingerprints with search and pagination
 */
fingerprintsRouter.get('/fingerprints', (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = `
      SELECT id, first_seen_at, last_seen_at, total_events, linked_accounts_count,
             primary_ip, canvas_hash, webgl_renderer, tags, is_banned
      FROM fingerprints
      WHERE app_id = ?
    `;
    const params: any[] = [APP_ID];

    if (search) {
      query += ` AND (LOWER(id) LIKE ? OR LOWER(primary_ip) LIKE ? OR LOWER(tags) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY linked_accounts_count DESC, last_seen_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const fingerprints = db.prepare(query).all(...params);

    const totalCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM fingerprints WHERE app_id = ?
    `).get(APP_ID) as { cnt: number }).cnt;

    res.json({
      fingerprints,
      totalCount,
      limit,
      offset,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get fingerprint details and all associated accounts and events
 */
fingerprintsRouter.get('/fingerprints/:id', (req: Request, res: Response) => {
  try {
    const fpId = req.params.id;
    const fp = db.prepare(`
      SELECT * FROM fingerprints WHERE id = ? AND app_id = ?
    `).get(fpId, APP_ID);

    if (!fp) {
      return res.status(404).json({ error: 'Fingerprint not found' });
    }

    const accounts = db.prepare(`
      SELECT id, email, status, first_seen_at, last_seen_at, ip_address
      FROM accounts
      WHERE app_id = ? AND fingerprint_id = ?
      ORDER BY first_seen_at DESC
    `).all(APP_ID, fpId);

    const events = db.prepare(`
      SELECT id, event_type, email, ip_address, risk_score, risk_level, reasons, status, created_at
      FROM events
      WHERE app_id = ? AND fingerprint_id = ?
      ORDER BY created_at DESC
      LIMIT 25
    `).all(APP_ID, fpId) as any[];

    const parsedEvents = events.map((ev) => ({
      ...ev,
      reasons: typeof ev.reasons === 'string' ? JSON.parse(ev.reasons) : ev.reasons,
    }));

    res.json({
      fingerprint: fp,
      accounts,
      events: parsedEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle ban / whitelist on a fingerprint
 */
fingerprintsRouter.post('/fingerprints/:id/ban', (req: Request, res: Response) => {
  try {
    const fpId = req.params.id;
    const { isBanned = true } = req.body;

    db.prepare(`
      UPDATE fingerprints
      SET is_banned = ?, tags = ?
      WHERE id = ? AND app_id = ?
    `).run(isBanned ? 1 : 0, isBanned ? 'banned' : 'active', fpId, APP_ID);

    res.json({ success: true, fingerprintId: fpId, isBanned });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
