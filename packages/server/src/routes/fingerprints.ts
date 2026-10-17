import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { prisma } from '../db/prisma';

export const fingerprintsRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * List fingerprints with search and pagination
 */
fingerprintsRouter.get('/fingerprints', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = `
      SELECT id, first_seen_at, last_seen_at, total_events, linked_accounts_count,
             primary_ip, canvas_hash, webgl_renderer, tags, is_banned
      FROM fingerprints
      WHERE app_id = $1
    `;
    const params: any[] = [APP_ID];

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      query += ` AND (LOWER(id) LIKE $${pIdx} OR LOWER(primary_ip) LIKE $${pIdx} OR LOWER(tags) LIKE $${pIdx})`;
    }

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    query += ` ORDER BY linked_accounts_count DESC, last_seen_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const fingerprints = await db.query(query, params);

    const totalRow = await db.queryOne<{ cnt: number | string }>(
      `SELECT COUNT(*) as cnt FROM fingerprints WHERE app_id = $1`,
      [APP_ID]
    );
    const totalCount = parseInt(String(totalRow?.cnt || 0), 10);

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
fingerprintsRouter.get('/fingerprints/:id', async (req: Request, res: Response) => {
  try {
    const fpId = req.params.id;

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
          select: { id: true, eventType: true, email: true, ipAddress: true, riskScore: true, riskLevel: true, reasons: true, status: true, createdAt: true },
        }),
      ]);

      if (!fp) {
        return res.status(404).json({ error: 'Fingerprint not found' });
      }

      return res.json({
        fingerprint: fp,
        accounts,
        events,
      });
    }

    const fp = await db.queryOne(
      `SELECT * FROM fingerprints WHERE id = $1 AND app_id = $2`,
      [fpId, APP_ID]
    );

    if (!fp) {
      return res.status(404).json({ error: 'Fingerprint not found' });
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

    res.json({
      fingerprint: fp,
      accounts,
      events,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle ban / whitelist on a fingerprint
 */
fingerprintsRouter.post('/fingerprints/:id/ban', async (req: Request, res: Response) => {
  try {
    const fpId = req.params.id;
    const { isBanned = true } = req.body;

    if (db.isPostgres) {
      await prisma.$transaction(async (tx) => {
        await tx.fingerprint.update({
          where: { id_appId: { id: fpId, appId: APP_ID } },
          data: {
            isBanned: isBanned ? 1 : 0,
            tags: isBanned ? 'banned' : 'active',
          },
        });

        if (isBanned) {
          await tx.account.updateMany({
            where: { fingerprintId: fpId, appId: APP_ID },
            data: { status: 'banned' },
          });
        }
      });

      return res.json({ success: true, fingerprintId: fpId, isBanned });
    }

    await db.execute(
      `UPDATE fingerprints
       SET is_banned = $1, tags = $2
       WHERE id = $3 AND app_id = $4`,
      [isBanned ? 1 : 0, isBanned ? 'banned' : 'active', fpId, APP_ID]
    );

    res.json({ success: true, fingerprintId: fpId, isBanned });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
