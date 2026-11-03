import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  await initDatabase();
  return NextResponse.json({
    status: 'healthy',
    service: 'AbuseShield Next.js Full-Stack Server',
    version: '2.0.0',
    dbEngine: db.isPostgres ? 'PostgreSQL (Neon + Prisma)' : 'SQLite (Local Embedded)',
    timestamp: Date.now(),
  });
}
