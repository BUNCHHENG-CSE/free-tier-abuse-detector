import { DatabaseAdapter } from './types';
import { PostgresAdapter } from './postgres';
import { SqliteAdapter } from './sqlite';
import { prisma } from './prisma';

const globalForDb = globalThis as unknown as {
  activeDb: DatabaseAdapter | undefined;
  initPromise: Promise<DatabaseAdapter> | undefined;
};

export function getDatabase(): DatabaseAdapter {
  if (!globalForDb.activeDb) {
    const useSqlite =
      process.env.USE_SQLITE === 'true' ||
      process.env.DB_DRIVER === 'sqlite' ||
      process.env.DATABASE_URL?.startsWith('sqlite:') ||
      process.env.DATABASE_URL?.startsWith('file:');

    const dbUrl = process.env.DATABASE_URL;
    const isPlaceholderNeon = dbUrl?.includes('ep-cool-darkness-123456');

    if (
      !useSqlite &&
      dbUrl &&
      !isPlaceholderNeon &&
      (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))
    ) {
      console.log('🐘 Initializing Neon PostgreSQL connection pool & Prisma ORM...');
      globalForDb.activeDb = new PostgresAdapter(dbUrl);
    } else {
      console.log('📁 Initializing local SQLite database (node:sqlite WAL mode)...');
      globalForDb.activeDb = new SqliteAdapter();
    }
  }
  return globalForDb.activeDb;
}

export async function initDatabase(): Promise<DatabaseAdapter> {
  if (globalForDb.initPromise) {
    return globalForDb.initPromise;
  }

  globalForDb.initPromise = (async () => {
    let database = getDatabase();
    if (database instanceof PostgresAdapter) {
      try {
        await database.initSchema();
        try {
          await prisma.$connect();
          console.log('💎 [Prisma ORM + Neon] Connected to PostgreSQL with production schema.');
        } catch (prismaErr) {
          console.warn('⚠️ [Prisma ORM] Connection notice:', prismaErr);
        }
      } catch (err: any) {
        console.warn(`⚠️  PostgreSQL connection failed (${err.code || err.message}).`);
        console.log('📁 Automatically falling back to local SQLite database...');
        globalForDb.activeDb = new SqliteAdapter();
        database = globalForDb.activeDb;
        await database.initSchema();
        console.log(`⚡ [SQLite Engine] Initialized and verified schema at ${(database as SqliteAdapter).dbPath || 'local'}`);
      }
    } else if (database instanceof SqliteAdapter) {
      await database.initSchema();
      console.log(`⚡ [SQLite Engine] Initialized and verified schema at ${(database as SqliteAdapter).dbPath || 'local'}`);
    }
    return database;
  })();

  return globalForDb.initPromise;
}

export const db: DatabaseAdapter = {
  get isPostgres() {
    return getDatabase().isPostgres;
  },
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const adapter = await initDatabase();
    return adapter.query<T>(sql, params);
  },
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const adapter = await initDatabase();
    return adapter.queryOne<T>(sql, params);
  },
  async execute(sql: string, params?: any[]): Promise<{ rowCount: number }> {
    const adapter = await initDatabase();
    return adapter.execute(sql, params);
  },
  async initSchema(): Promise<void> {
    await initDatabase();
  },
  async close(): Promise<void> {
    const adapter = getDatabase();
    await adapter.close();
  },
};

export { prisma };
export * from './types';
