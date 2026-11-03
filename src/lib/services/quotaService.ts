import { db } from '../db/database';
import { getAppRules } from './riskEngine';

export interface DeviceQuotaRecord {
  fingerprint_id: string;
  app_id: string;
  credits_allocated: number;
  credits_used: number;
  linked_accounts_count: number;
  is_locked: number;
  last_used_at: number;
}

export interface QuotaEvaluationResult {
  allowed: boolean;
  allocated: number;
  used: number;
  remaining: number;
  isLocked: boolean;
  reason?: string;
}

export async function getDeviceQuota(appId: string, fingerprintId: string): Promise<DeviceQuotaRecord> {
  const existing = await db.queryOne<DeviceQuotaRecord>(
    'SELECT * FROM device_quotas WHERE app_id = $1 AND fingerprint_id = $2',
    [appId, fingerprintId]
  );

  if (existing) {
    return {
      ...existing,
      credits_allocated: Number(existing.credits_allocated),
      credits_used: Number(existing.credits_used),
      linked_accounts_count: Number(existing.linked_accounts_count),
      is_locked: Number(existing.is_locked),
      last_used_at: Number(existing.last_used_at),
    };
  }

  const countRow = await db.queryOne<{ cnt: number | string }>(
    'SELECT COUNT(DISTINCT normalized_email) as cnt FROM accounts WHERE app_id = $1 AND fingerprint_id = $2',
    [appId, fingerprintId]
  );
  const linkedCount = Math.max(1, parseInt(String(countRow?.cnt || 1), 10));

  const rules = await getAppRules(appId);
  const allocated = rules.quota_limit || 50;
  const now = Date.now();

  const newRecord: DeviceQuotaRecord = {
    fingerprint_id: fingerprintId,
    app_id: appId,
    credits_allocated: allocated,
    credits_used: 0,
    linked_accounts_count: linkedCount,
    is_locked: 0,
    last_used_at: now,
  };

  await db.execute(
    `INSERT INTO device_quotas (
      fingerprint_id, app_id, credits_allocated, credits_used,
      linked_accounts_count, is_locked, last_used_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (fingerprint_id, app_id) DO NOTHING`,
    [
      fingerprintId,
      appId,
      newRecord.credits_allocated,
      newRecord.credits_used,
      newRecord.linked_accounts_count,
      newRecord.is_locked,
      newRecord.last_used_at,
    ]
  );

  return newRecord;
}

export async function consumeDeviceQuota(
  appId: string,
  fingerprintId: string,
  amount: number = 1,
  _email?: string
): Promise<QuotaEvaluationResult> {
  const quota = await getDeviceQuota(appId, fingerprintId);

  if (quota.is_locked === 1) {
    return {
      allowed: false,
      allocated: quota.credits_allocated,
      used: quota.credits_used,
      remaining: Math.max(0, quota.credits_allocated - quota.credits_used),
      isLocked: true,
      reason: 'DEVICE_QUOTA_LOCKED',
    };
  }

  const newUsed = quota.credits_used + amount;
  if (newUsed > quota.credits_allocated) {
    return {
      allowed: false,
      allocated: quota.credits_allocated,
      used: quota.credits_used,
      remaining: Math.max(0, quota.credits_allocated - quota.credits_used),
      isLocked: false,
      reason: 'DEVICE_QUOTA_EXHAUSTED',
    };
  }

  const now = Date.now();
  await db.execute(
    `UPDATE device_quotas
     SET credits_used = credits_used + $1, last_used_at = $2
     WHERE app_id = $3 AND fingerprint_id = $4`,
    [amount, now, appId, fingerprintId]
  );

  return {
    allowed: true,
    allocated: quota.credits_allocated,
    used: newUsed,
    remaining: Math.max(0, quota.credits_allocated - newUsed),
    isLocked: false,
  };
}

export async function resetDeviceQuota(appId: string, fingerprintId: string): Promise<boolean> {
  const now = Date.now();
  const res = await db.execute(
    `UPDATE device_quotas
     SET credits_used = 0, is_locked = 0, last_used_at = $1
     WHERE app_id = $2 AND fingerprint_id = $3`,
    [now, appId, fingerprintId]
  );
  return res.rowCount > 0;
}

export async function lockDeviceQuota(
  appId: string,
  fingerprintId: string,
  isLocked: boolean
): Promise<boolean> {
  const now = Date.now();
  const res = await db.execute(
    `UPDATE device_quotas
     SET is_locked = $1, last_used_at = $2
     WHERE app_id = $3 AND fingerprint_id = $4`,
    [isLocked ? 1 : 0, now, appId, fingerprintId]
  );
  return res.rowCount > 0;
}

export async function listDeviceQuotas(
  appId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ total: number; quotas: DeviceQuotaRecord[] }> {
  const countRow = await db.queryOne<{ cnt: number | string }>(
    'SELECT COUNT(*) as cnt FROM device_quotas WHERE app_id = $1',
    [appId]
  );
  const total = parseInt(String(countRow?.cnt || 0), 10);

  const quotas = await db.query<DeviceQuotaRecord>(
    `SELECT * FROM device_quotas
     WHERE app_id = $1
     ORDER BY last_used_at DESC
     LIMIT $2 OFFSET $3`,
    [appId, limit, offset]
  );

  return {
    total,
    quotas: quotas.map((q) => ({
      ...q,
      credits_allocated: Number(q.credits_allocated),
      credits_used: Number(q.credits_used),
      linked_accounts_count: Number(q.linked_accounts_count),
      is_locked: Number(q.is_locked),
      last_used_at: Number(q.last_used_at),
    })),
  };
}
