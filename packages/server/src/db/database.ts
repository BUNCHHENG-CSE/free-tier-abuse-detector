import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'abuseshield.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Optimize performance for high-throughput ingestion
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  // Ignored if in-memory
}

export function initDatabase() {
  db.exec(`
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
      reasons TEXT NOT NULL, -- JSON string array
      status TEXT NOT NULL,  -- 'allowed' | 'flagged' | 'rejected' | 'approved'
      raw_signals TEXT,      -- JSON
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
      status TEXT DEFAULT 'active', -- 'active' | 'flagged' | 'banned' | 'approved'
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
      reasons TEXT NOT NULL, -- JSON array
      status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'abuser'
      reviewer_notes TEXT,
      reviewed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue(app_id, status, created_at);
  `);

  // Seed default demo application if empty
  const existingApp = db.prepare('SELECT id FROM apps WHERE id = ?').get('app_demo_default');
  if (!existingApp) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO apps (id, name, api_key, webhook_url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('app_demo_default', 'Acme Cloud Production', 'pk_live_abuseshield_demo', '', now);

    db.prepare(`
      INSERT INTO rules (
        app_id, max_registrations_24h, max_accounts_per_fp,
        flag_disposable_email, flag_headless_bot, flag_ip_hopping,
        min_score_to_flag, webhook_on_flag, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('app_demo_default', 3, 2, 1, 1, 1, 35, 1, now);
  }
}
