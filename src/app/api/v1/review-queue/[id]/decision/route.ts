import { db, initDatabase } from '@/lib/db/database';
import { prisma } from '@/lib/db/prisma';
import { lockDeviceQuota } from '@/lib/services/quotaService';
import { resolveAppId, json, error } from '@/lib/server/apiHelper';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const appId = await resolveAppId(req);
    const { id } = await context.params;
    const body = await req.json();
    const { decision, notes } = body;

    if (!['approved', 'rejected', 'abuser'].includes(decision)) {
      return error('Invalid decision', 400);
    }

    const item = await db.queryOne<{ event_id: string; fingerprint_id: string; email?: string }>(
      `SELECT event_id, fingerprint_id, email FROM review_queue WHERE id = $1 AND app_id = $2`,
      [id, appId]
    );

    if (!item) {
      return error('Review item not found', 404);
    }

    const now = Date.now();

    if (db.isPostgres) {
      await prisma.$transaction(async (tx) => {
        await tx.reviewQueue.update({
          where: { id },
          data: {
            status: decision,
            reviewerNotes: notes || null,
            reviewedAt: BigInt(now),
          },
        });

        await tx.event.update({
          where: { id: item.event_id },
          data: { status: decision },
        });

        if (decision === 'abuser') {
          await tx.fingerprint.update({
            where: { id_appId: { id: item.fingerprint_id, appId } },
            data: { isBanned: 1, tags: 'banned_abuser' },
          });

          await tx.account.updateMany({
            where: { appId, fingerprintId: item.fingerprint_id },
            data: { status: 'banned' },
          });
        }
      });
    } else {
      await db.execute(
        `UPDATE review_queue
         SET status = $1, reviewer_notes = $2, reviewed_at = $3
         WHERE id = $4 AND app_id = $5`,
        [decision, notes || null, now, id, appId]
      );

      await db.execute(
        `UPDATE events SET status = $1 WHERE id = $2 AND app_id = $3`,
        [decision, item.event_id, appId]
      );

      if (decision === 'abuser') {
        await db.execute(
          `UPDATE fingerprints SET is_banned = 1, tags = 'banned_abuser'
           WHERE id = $1 AND app_id = $2`,
          [item.fingerprint_id, appId]
        );

        await db.execute(
          `UPDATE accounts SET status = 'banned'
           WHERE app_id = $1 AND fingerprint_id = $2`,
          [appId, item.fingerprint_id]
        );
      }
    }

    if (decision === 'abuser') {
      await lockDeviceQuota(appId, item.fingerprint_id, true);
    }

    return json({
      success: true,
      decision,
      reviewedAt: now,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
