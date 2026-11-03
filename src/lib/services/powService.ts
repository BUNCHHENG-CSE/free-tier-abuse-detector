import crypto from 'node:crypto';
import { db } from '../db/database';
import { getAppRules } from './riskEngine';

export interface PoWChallengeData {
  challengeId: string;
  seed: string;
  difficulty: number;
  expiresAt: number;
}

export interface PoWSolutionInput {
  challengeId: string;
  nonce: number;
  hash?: string;
  timeTakenMs?: number;
}

export async function createChallenge(
  appId: string,
  fingerprintId: string,
  customDifficulty?: number
): Promise<PoWChallengeData> {
  const rules = await getAppRules(appId);
  const difficulty = customDifficulty ?? (rules.pow_difficulty || 4);
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;
  const challengeId = `pow_${now}_${crypto.randomBytes(6).toString('hex')}`;
  const seed = crypto.randomBytes(16).toString('hex');

  await db.execute(
    `INSERT INTO pow_challenges (
      id, app_id, fingerprint_id, seed, difficulty, solved, created_at, expires_at
    )
    VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
    [challengeId, appId, fingerprintId, seed, difficulty, now, expiresAt]
  );

  return {
    challengeId,
    seed,
    difficulty,
    expiresAt,
  };
}

export async function validateSolution(
  appId: string,
  fingerprintId: string,
  solution: PoWSolutionInput
): Promise<{ valid: boolean; reason?: string }> {
  if (!solution || !solution.challengeId || typeof solution.nonce !== 'number') {
    return { valid: false, reason: 'INVALID_PAYLOAD' };
  }

  const record = await db.queryOne<{
    seed: string;
    difficulty: number;
    solved: number;
    expires_at: number;
  }>(
    `SELECT seed, difficulty, solved, expires_at
     FROM pow_challenges
     WHERE id = $1 AND app_id = $2 AND fingerprint_id = $3`,
    [solution.challengeId, appId, fingerprintId]
  );

  if (!record) {
    return { valid: false, reason: 'CHALLENGE_NOT_FOUND' };
  }

  if (record.solved === 1) {
    return { valid: false, reason: 'CHALLENGE_ALREADY_USED' };
  }

  if (Date.now() > Number(record.expires_at)) {
    return { valid: false, reason: 'CHALLENGE_EXPIRED' };
  }

  const expectedPrefix = '0'.repeat(record.difficulty);
  const payload = `${record.seed}:${solution.nonce}`;
  const computedHash = crypto.createHash('sha256').update(payload).digest('hex');

  if (!computedHash.startsWith(expectedPrefix)) {
    return { valid: false, reason: 'INVALID_NONCE_HASH' };
  }

  await db.execute('UPDATE pow_challenges SET solved = 1 WHERE id = $1', [solution.challengeId]);

  return { valid: true };
}
