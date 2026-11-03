import { Pool, PoolConfig } from 'pg';
import { DatabaseAdapter } from './types';

export class PostgresAdapter implements DatabaseAdapter {
  public isPostgres = true;
  private pool: Pool;

  constructor(connectionString: string, options: Partial<PoolConfig> = {}) {
    const isNeonOrSsl =
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require') ||
      process.env.DB_SSL === 'true';

    const config: PoolConfig = {
      connectionString,
      max: options.max || parseInt(process.env.DB_POOL_MAX || '25', 10),
      idleTimeoutMillis: options.idleTimeoutMillis || parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
      connectionTimeoutMillis:
        options.connectionTimeoutMillis || parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10),
      ssl: isNeonOrSsl ? { rejectUnauthorized: false } : undefined,
      ...options,
    };

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      console.error('[PostgreSQL / Neon Pool Error]', err);
    });
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const formattedParams = params.map((p) => {
      if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
        return JSON.stringify(p);
      }
      return p;
    });

    const res = await this.pool.query(sql, formattedParams);
    return res.rows as T[];
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
    const formattedParams = params.map((p) => {
      if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
        return JSON.stringify(p);
      }
      return p;
    });

    const res = await this.pool.query(sql, formattedParams);
    return { rowCount: res.rowCount || 0 };
  }

  public async initSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        -- 1. Applications Registry
        CREATE TABLE IF NOT EXISTS apps (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          api_key VARCHAR(128) UNIQUE NOT NULL,
          webhook_url TEXT,
          created_at BIGINT NOT NULL
        );

        -- 2. Rules Configuration
        CREATE TABLE IF NOT EXISTS rules (
          app_id VARCHAR(64) PRIMARY KEY REFERENCES apps(id) ON DELETE CASCADE,
          max_registrations_24h INT DEFAULT 3,
          max_accounts_per_fp INT DEFAULT 2,
          flag_disposable_email SMALLINT DEFAULT 1,
          flag_headless_bot SMALLINT DEFAULT 1,
          flag_ip_hopping SMALLINT DEFAULT 1,
          flag_behavioral_bot SMALLINT DEFAULT 1,
          flag_tampering SMALLINT DEFAULT 1,
          pow_enabled SMALLINT DEFAULT 1,
          pow_difficulty INT DEFAULT 4,
          quota_limit INT DEFAULT 50,
          discord_webhook_url TEXT,
          slack_webhook_url TEXT,
          min_score_to_flag INT DEFAULT 35,
          webhook_on_flag SMALLINT DEFAULT 1,
          updated_at BIGINT NOT NULL
        );

        -- 3. Telemetry & Verification Events
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          event_type VARCHAR(64) NOT NULL,
          email VARCHAR(255),
          normalized_email VARCHAR(255),
          user_id VARCHAR(128),
          fingerprint_id VARCHAR(64) NOT NULL,
          client_token VARCHAR(64),
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT,
          risk_score INT NOT NULL,
          risk_level VARCHAR(16) NOT NULL,
          reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
          status VARCHAR(32) NOT NULL,
          raw_signals JSONB,
          created_at BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_events_fp_time ON events (app_id, fingerprint_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_events_email ON events (app_id, normalized_email);
        CREATE INDEX IF NOT EXISTS idx_events_created ON events (app_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events (app_id, status);

        -- 4. Device Fingerprints Registry
        CREATE TABLE IF NOT EXISTS fingerprints (
          id VARCHAR(64) NOT NULL,
          app_id VARCHAR(64) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          first_seen_at BIGINT NOT NULL,
          last_seen_at BIGINT NOT NULL,
          total_events INT DEFAULT 1,
          linked_accounts_count INT DEFAULT 1,
          primary_ip VARCHAR(45),
          canvas_hash VARCHAR(64),
          webgl_renderer TEXT,
          tags VARCHAR(64),
          is_banned SMALLINT DEFAULT 0,
          PRIMARY KEY (id, app_id)
        );

        CREATE INDEX IF NOT EXISTS idx_fp_accounts ON fingerprints (app_id, linked_accounts_count DESC);

        -- 5. User Accounts Registry
        CREATE TABLE IF NOT EXISTS accounts (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          normalized_email VARCHAR(255) NOT NULL,
          user_id VARCHAR(128),
          fingerprint_id VARCHAR(64) NOT NULL,
          ip_address VARCHAR(45),
          status VARCHAR(32) DEFAULT 'active',
          first_seen_at BIGINT NOT NULL,
          last_seen_at BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts (app_id, normalized_email);
        CREATE INDEX IF NOT EXISTS idx_accounts_fp ON accounts (app_id, fingerprint_id);

        -- 6. Manual Review Queue
        CREATE TABLE IF NOT EXISTS review_queue (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          event_id VARCHAR(64) UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          email VARCHAR(255),
          fingerprint_id VARCHAR(64) NOT NULL,
          risk_score INT NOT NULL,
          reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
          status VARCHAR(32) DEFAULT 'pending',
          reviewer_notes TEXT,
          reviewed_at BIGINT,
          created_at BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_review_status_time ON review_queue (app_id, status, created_at DESC);

        -- 7. Device-Bound Trial Quotas
        CREATE TABLE IF NOT EXISTS device_quotas (
          fingerprint_id VARCHAR(64) NOT NULL,
          app_id VARCHAR(64) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          credits_allocated INT DEFAULT 50,
          credits_used INT DEFAULT 0,
          linked_accounts_count INT DEFAULT 1,
          is_locked SMALLINT DEFAULT 0,
          last_used_at BIGINT NOT NULL,
          PRIMARY KEY (fingerprint_id, app_id)
        );

        -- 8. Adaptive Proof-of-Work Challenges
        CREATE TABLE IF NOT EXISTS pow_challenges (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          fingerprint_id VARCHAR(64) NOT NULL,
          seed VARCHAR(128) NOT NULL,
          difficulty INT DEFAULT 4,
          solved SMALLINT DEFAULT 0,
          created_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_pow_fp ON pow_challenges (app_id, fingerprint_id);

        -- Seed Default Demo Application
        INSERT INTO apps (id, name, api_key, webhook_url, created_at)
        VALUES ('app_demo_default', 'Acme Cloud Production', 'pk_live_abuseshield_demo', '', 1700000000000)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO rules (
          app_id, max_registrations_24h, max_accounts_per_fp,
          flag_disposable_email, flag_headless_bot, flag_ip_hopping,
          flag_behavioral_bot, flag_tampering, pow_enabled, pow_difficulty,
          quota_limit, min_score_to_flag, webhook_on_flag, updated_at
        )
        VALUES ('app_demo_default', 3, 2, 1, 1, 1, 1, 1, 1, 4, 50, 35, 1, 1700000000000)
        ON CONFLICT (app_id) DO NOTHING;
      `);
      console.log('🐘 [Neon PostgreSQL] Production schema and indexes verified.');
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
