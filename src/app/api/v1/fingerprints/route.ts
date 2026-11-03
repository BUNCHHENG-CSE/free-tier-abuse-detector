import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10) || 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;

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
      query += ` AND (LOWER(id) LIKE $${pIdx} OR LOWER(primary_ip) LIKE $${pIdx} OR LOWER(tags) LIKE $${pIdx} OR LOWER(webgl_renderer) LIKE $${pIdx})`;
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

    return NextResponse.json({
      fingerprints: fingerprints.map((fp: any) => ({
        ...fp,
        first_seen_at: Number(fp.first_seen_at),
        last_seen_at: Number(fp.last_seen_at),
        total_events: Number(fp.total_events),
        linked_accounts_count: Number(fp.linked_accounts_count),
        is_banned: Number(fp.is_banned),
      })),
      totalCount,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
