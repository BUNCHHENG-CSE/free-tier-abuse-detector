import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10) || 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;

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

    return NextResponse.json({
      items: items.map((it: any) => ({
        ...it,
        risk_score: Number(it.risk_score),
        created_at: Number(it.created_at),
        reviewed_at: it.reviewed_at ? Number(it.reviewed_at) : undefined,
        linked_accounts_count: Number(it.linked_accounts_count || 1),
        is_banned: Number(it.is_banned || 0),
      })),
      pendingCount,
      totalCount,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
