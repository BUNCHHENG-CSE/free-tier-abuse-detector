import { db, initDatabase } from '@/lib/db/database';
import { json } from '@/lib/server/apiHelper';

export async function GET() {
  await initDatabase();
  return json({
    status: 'healthy',
    service: 'AbuseShield Anti-Abuse Next.js Platform',
    version: '2.0.0',
    dbEngine: db.isPostgres ? 'PostgreSQL' : 'SQLite',
    timestamp: Date.now(),
  });
}
