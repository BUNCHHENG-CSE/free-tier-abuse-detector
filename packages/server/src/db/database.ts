import { DatabaseAdapter } from './types';
import { PostgresAdapter } from './postgres';
import { SqliteAdapter } from './sqlite';
import { prisma } from './prisma';

let activeDb: DatabaseAdapter | null = null;

export function getDatabase(): DatabaseAdapter {
  if (!activeDb) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      console.log('🐘 Initializing PostgreSQL database connection pool & Prisma ORM...');
      activeDb = new PostgresAdapter(dbUrl);
    } else {
      console.log('📁 No PostgreSQL DATABASE_URL found. Using local SQLite database...');
      activeDb = new SqliteAdapter();
    }
  }
  return activeDb;
}

export const db = new Proxy({} as DatabaseAdapter, {
  get(target, prop) {
    const database = getDatabase();
    const val = (database as any)[prop];
    if (typeof val === 'function') {
      return val.bind(database);
    }
    return val;
  },
});

export async function initDatabase(): Promise<DatabaseAdapter> {
  const database = getDatabase();
  if (database instanceof PostgresAdapter) {
    await database.initSchema();
    try {
      await prisma.$connect();
      console.log('💎 [Prisma ORM] Connected to PostgreSQL with optimized schema.');
    } catch (err) {
      console.warn('⚠️ [Prisma ORM] Connection notice:', err);
    }
  } else if (database instanceof SqliteAdapter) {
    await database.initSchema();
  }
  return database;
}

export { prisma };
export * from './types';

