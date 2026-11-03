import { db, initDatabase } from '@/lib/db/database';
import { resolveAppId, json, error } from '@/lib/server/apiHelper';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const appId = await resolveAppId(req);
    const { id } = await context.params;

    const item = await db.queryOne(
      `SELECT r.*, e.ip_address, e.event_type, e.user_agent, e.risk_level, e.raw_signals,
              f.linked_accounts_count, f.is_banned
       FROM review_queue r
       JOIN events e ON r.event_id = e.id
       LEFT JOIN fingerprints f ON r.fingerprint_id = f.id AND f.app_id = r.app_id
       WHERE r.id = $1 AND r.app_id = $2`,
      [id, appId]
    );

    if (!item) {
      return error('Review item not found', 404);
    }

    const linkedAccounts = await db.query(
      `SELECT email, status, first_seen_at, last_seen_at, ip_address
       FROM accounts
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY last_seen_at DESC`,
      [appId, item.fingerprint_id]
    );

    const eventTimeline = await db.query(
      `SELECT id, event_type, email, ip_address, risk_score, status, created_at
       FROM events
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [appId, item.fingerprint_id]
    );

    return json({
      item,
      linkedAccounts,
      eventTimeline,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
