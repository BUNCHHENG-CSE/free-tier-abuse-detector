import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseAdapter } from './types';

export class SqliteAdapter implements DatabaseAdapter {
  public isPostgres = false;
  public dbPath: string;
  private db: DatabaseSync;

  constructor(filePath?: string) {
    const rawPath = filePath || process.env.SQLITE_PATH;
    let finalPath: string;

    if (rawPath) {
      finalPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(/*turbopackIgnore: true*/ process.cwd(), rawPath);
    } else {
      finalPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'data', 'abuseshield.sqlite');
    }

    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.dbPath = finalPath;
    this.db = new DatabaseSync(finalPath);

    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
      this.db.exec('PRAGMA foreign_keys = ON;');
    } catch {
      // Ignored
    }
  }

  private convertPlaceholders(sql: string): string {
    // Convert $1, $2, $3 to ? for SQLite compatibility
    return sql.replace(/\$\d+/g, '?');
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const converted = this.convertPlaceholders(sql);
    const formattedParams = params.map((p) => {
      if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
        return JSON.stringify(p);
      }
      return p;
    });

    const stmt = this.db.prepare(converted);
    const rows = stmt.all(...formattedParams) as any[];

    // Parse JSON string fields for consistency with PostgreSQL JSONB
    return rows.map((r) => {
      const copy = { ...r };
      if (typeof copy.reasons === 'string') {
        try {
          copy.reasons = JSON.parse(copy.reasons);
        } catch {}
      }
      if (typeof copy.raw_signals === 'string') {
        try {
          copy.raw_signals = JSON.parse(copy.raw_signals);
        } catch {}
      }
      return copy;
    }) as T[];
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
    const converted = this.convertPlaceholders(sql);
    const formattedParams = params.map((p) => {
      if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
        return JSON.stringify(p);
      }
      return p;
    });

    const stmt = this.db.prepare(converted);
    const result = stmt.run(...formattedParams);
    return { rowCount: Number(result.changes) };
  }

  public async initSchema(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        webhook_url TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rules (
        app_id TEXT PRIMARY KEY,
        max_registrations_24h INTEGER DEFAULT 3,
        max_accounts_per_fp INTEGER DEFAULT 2,
        flag_disposable_email INTEGER DEFAULT 1,
        flag_headless_bot INTEGER DEFAULT 1,
        flag_ip_hopping INTEGER DEFAULT 1,
        flag_behavioral_bot INTEGER DEFAULT 1,
        flag_tampering INTEGER DEFAULT 1,
        pow_enabled INTEGER DEFAULT 1,
        pow_difficulty INTEGER DEFAULT 4,
        quota_limit INTEGER DEFAULT 50,
        discord_webhook_url TEXT,
        slack_webhook_url TEXT,
        min_score_to_flag INTEGER DEFAULT 35,
        webhook_on_flag INTEGER DEFAULT 1,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        email TEXT,
        normalized_email TEXT,
        user_id TEXT,
        fingerprint_id TEXT NOT NULL,
        client_token TEXT,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        reasons TEXT NOT NULL,
        status TEXT NOT NULL,
        raw_signals TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_events_fp ON events(app_id, fingerprint_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_events_email ON events(app_id, normalized_email);
      CREATE INDEX IF NOT EXISTS idx_events_created ON events(app_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(app_id, status);

      CREATE TABLE IF NOT EXISTS fingerprints (
        id TEXT NOT NULL,
        app_id TEXT NOT NULL,
        first_seen_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        total_events INTEGER DEFAULT 1,
        linked_accounts_count INTEGER DEFAULT 1,
        primary_ip TEXT,
        canvas_hash TEXT,
        webgl_renderer TEXT,
        tags TEXT,
        is_banned INTEGER DEFAULT 0,
        PRIMARY KEY (id, app_id),
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_fp_accounts ON fingerprints(app_id, linked_accounts_count);

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        email TEXT NOT NULL,
        normalized_email TEXT NOT NULL,
        user_id TEXT,
        fingerprint_id TEXT NOT NULL,
        ip_address TEXT,
        status TEXT DEFAULT 'active',
        first_seen_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(app_id, normalized_email);
      CREATE INDEX IF NOT EXISTS idx_accounts_fp ON accounts(app_id, fingerprint_id);

      CREATE TABLE IF NOT EXISTS review_queue (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        event_id TEXT UNIQUE NOT NULL,
        email TEXT,
        fingerprint_id TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        reasons TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        reviewer_notes TEXT,
        reviewed_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue(app_id, status, created_at);

      CREATE TABLE IF NOT EXISTS device_quotas (
        fingerprint_id TEXT NOT NULL,
        app_id TEXT NOT NULL,
        credits_allocated INTEGER DEFAULT 50,
        credits_used INTEGER DEFAULT 0,
        linked_accounts_count INTEGER DEFAULT 1,
        is_locked INTEGER DEFAULT 0,
        last_used_at INTEGER NOT NULL,
        PRIMARY KEY (fingerprint_id, app_id),
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_quota_fp ON device_quotas(app_id, fingerprint_id);

      CREATE TABLE IF NOT EXISTS pow_challenges (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        fingerprint_id TEXT NOT NULL,
        seed TEXT NOT NULL,
        difficulty INTEGER DEFAULT 4,
        solved INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_pow_fp ON pow_challenges(app_id, fingerprint_id);
    `);

    const alterColumns = [
      'ALTER TABLE rules ADD COLUMN flag_behavioral_bot INTEGER DEFAULT 1',
      'ALTER TABLE rules ADD COLUMN flag_tampering INTEGER DEFAULT 1',
      'ALTER TABLE rules ADD COLUMN pow_enabled INTEGER DEFAULT 1',
      'ALTER TABLE rules ADD COLUMN pow_difficulty INTEGER DEFAULT 4',
      'ALTER TABLE rules ADD COLUMN quota_limit INTEGER DEFAULT 50',
      'ALTER TABLE rules ADD COLUMN discord_webhook_url TEXT',
      'ALTER TABLE rules ADD COLUMN slack_webhook_url TEXT',
    ];

    for (const sql of alterColumns) {
      try {
        this.db.exec(sql);
      } catch {
        // Column already exists
      }
    }

    const existing = await this.queryOne('SELECT id FROM apps WHERE id = ?', ['app_demo_default']);
    if (!existing) {
      const now = Date.now();
      await this.execute(
        `INSERT INTO apps (id, name, api_key, webhook_url, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        ['app_demo_default', 'Acme Cloud Production', 'pk_live_abuseshield_demo', '', now]
      );

      await this.execute(
        `INSERT INTO rules (
          app_id, max_registrations_24h, max_accounts_per_fp,
          flag_disposable_email, flag_headless_bot, flag_ip_hopping,
          flag_behavioral_bot, flag_tampering, pow_enabled, pow_difficulty,
          quota_limit, discord_webhook_url, slack_webhook_url,
          min_score_to_flag, webhook_on_flag, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['app_demo_default', 3, 2, 1, 1, 1, 1, 1, 1, 4, 50, '', '', 35, 1, now]
      );
    }
  }

  public async close(): Promise<void> {
    this.db.close();
  }
}
