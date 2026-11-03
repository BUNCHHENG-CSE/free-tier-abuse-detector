import test from 'node:test';
import assert from 'node:assert';
import { evaluateRisk } from '../lib/services/riskEngine';
import { solvePoW } from '../sdk/pow';
import { initDatabase } from '../lib/db/database';
import { getDeviceQuota, consumeDeviceQuota, resetDeviceQuota, lockDeviceQuota } from '../lib/services/quotaService';
import { createChallenge, validateSolution } from '../lib/services/powService';

test('Feature 1: Behavioral Cadence engine detects automated sub-second submissions', async () => {
  await initDatabase();

  // Test automated cadence: fast submission time (<800ms) with zero interaction
  const botAssessment = await evaluateRisk({
    appId: 'app_demo_default',
    email: 'cadence_bot_test@example.com',
    clientFingerprintId: 'fp_cadence_test_1',
    ipAddress: '192.168.1.50',
    signals: {
      behavior: {
        timeOnPageMs: 150, // 150ms is inhuman
        isAutomatedCadence: true,
        mouseMovementsCount: 0,
      },
      canvas: { supported: true, hash: 'canvas_hash_1', isCanvasFarblingDetected: false },
    },
  });

  assert.ok(botAssessment.riskScore >= 20);
  assert.ok(
    botAssessment.reasons.some(
      (r) => r.toLowerCase().includes('cadence') || r.toLowerCase().includes('automated')
    )
  );

  // Test organic human: relaxed submission time with natural mouse moves
  const humanAssessment = await evaluateRisk({
    appId: 'app_demo_default',
    email: 'organic_human_test@example.com',
    clientFingerprintId: 'fp_human_test_1',
    ipAddress: '192.168.1.51',
    signals: {
      behavior: {
        timeOnPageMs: 4200,
        isAutomatedCadence: false,
        mouseMovementsCount: 24,
      },
      canvas: { supported: true, hash: 'canvas_hash_2', isCanvasFarblingDetected: false },
    },
  });

  assert.ok(!humanAssessment.reasons.some((r) => r.includes('Automated cadence')));
});

test('Feature 2: Anti-Fingerprint Farbling & Hardware Tampering detects injected noise', async () => {
  await initDatabase();

  const farbledAssessment = await evaluateRisk({
    appId: 'app_demo_default',
    email: 'farbler_test@example.com',
    clientFingerprintId: 'fp_farble_test_1',
    ipAddress: '192.168.1.60',
    signals: {
      canvas: {
        supported: true,
        hash: 'farbled_noise_1',
        isCanvasFarblingDetected: true,
      },
      system: {
        platformMismatch: true,
      },
    },
  });

  assert.ok(farbledAssessment.riskScore >= 25);
  assert.ok(
    farbledAssessment.reasons.some((r) => r.includes('Farbling') || r.includes('tampering') || r.includes('Anti-fingerprinting'))
  );
});

test('Feature 3: Cross-Account Free Quota Pool enforces device-bound limits', async () => {
  await initDatabase();
  const testFp = `fp_quota_unit_${Date.now()}`;

  // Initial quota
  const initial = await getDeviceQuota('app_demo_default', testFp);
  assert.strictEqual(initial.credits_used, 0);
  assert.ok(initial.credits_allocated > 0);

  // Consume 20 credits
  const afterFirst = await consumeDeviceQuota('app_demo_default', testFp, 20);
  assert.strictEqual(afterFirst.allowed, true);
  assert.strictEqual(afterFirst.used, 20);

  // Consume remaining + exceed allocation
  const remaining = afterFirst.remaining;
  const afterExhaust = await consumeDeviceQuota('app_demo_default', testFp, remaining);
  assert.strictEqual(afterExhaust.used, afterFirst.allocated);

  // Over-consumption rejected
  const rejected = await consumeDeviceQuota('app_demo_default', testFp, 5);
  assert.strictEqual(rejected.allowed, false);

  // Lock and Unlock
  await lockDeviceQuota('app_demo_default', testFp, true);
  const lockedEval = await consumeDeviceQuota('app_demo_default', testFp, 1);
  assert.strictEqual(lockedEval.allowed, false);
  assert.strictEqual(lockedEval.isLocked, true);

  // Reset quota
  await resetDeviceQuota('app_demo_default', testFp);
  const resetState = await getDeviceQuota('app_demo_default', testFp);
  assert.strictEqual(resetState.credits_used, 0);
});

test('Feature 4: Adaptive Proof-of-Work puzzle creates and validates cryptographic SHA-256 micro-puzzles', async () => {
  await initDatabase();
  const testFp = `fp_pow_unit_${Date.now()}`;

  // Generate difficulty 2 challenge for lightning fast unit test verification
  const challenge = await createChallenge('app_demo_default', testFp, 2);
  assert.ok(challenge.challengeId.startsWith('pow_'));
  assert.strictEqual(challenge.difficulty, 2);

  // Solve using SDK's PoW solver
  const solution = await solvePoW({
    challengeId: challenge.challengeId,
    seed: challenge.seed,
    difficulty: challenge.difficulty,
  });

  assert.ok(solution.nonce >= 0);
  assert.ok(solution.hash);

  // Validate on server
  const validation = await validateSolution('app_demo_default', testFp, solution);
  assert.strictEqual(validation.valid, true);

  // Replaying solved challenge must fail
  const replayValidation = await validateSolution('app_demo_default', testFp, solution);
  assert.strictEqual(replayValidation.valid, false);
});
