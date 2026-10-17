import test from 'node:test';
import assert from 'node:assert';
import { analyzeEmail } from '../services/emailValidator';
import { evaluateRisk, getAppRules } from '../services/riskEngine';
import { initDatabase, db } from '../db/database';

test('Email validator accurately identifies disposable domains and strips aliases', () => {
  const normal = analyzeEmail('john.doe@gmail.com');
  assert.strictEqual(normal.isDisposable, false);
  assert.strictEqual(normal.normalized, 'johndoe@gmail.com'); // Dots stripped for gmail

  const alias = analyzeEmail('john.doe+abuse123@gmail.com');
  assert.strictEqual(alias.hasSubaddressing, true);
  assert.strictEqual(alias.normalized, 'johndoe@gmail.com'); // Plus alias stripped

  const disposable1 = analyzeEmail('fake_user@mailinator.com');
  assert.strictEqual(disposable1.isDisposable, true);

  const disposable2 = analyzeEmail('harvest@10minutemail.com');
  assert.strictEqual(disposable2.isDisposable, true);

  const disposable3 = analyzeEmail('tester@temp-mail.org');
  assert.strictEqual(disposable3.isDisposable, true);
});

test('Risk Engine allows clean first-time legitimate user registration', async () => {
  initDatabase();

  const fpId = `fp_test_legit_${Date.now()}`;
  const result = await evaluateRisk({
    appId: 'app_demo_default',
    email: `legit_user_${Date.now()}@company.com`,
    action: 'signup',
    clientFingerprintId: fpId,
    clientToken: `tok_${fpId}`,
    ipAddress: '98.12.34.56',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    signals: {
      canvas: { supported: true, hash: 'valid_canvas_hash' },
      webgl: { supported: true, unmaskedRenderer: 'Intel UHD 630' },
      bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
    },
  });

  assert.strictEqual(result.action, 'allow');
  assert.strictEqual(result.reviewRequired, false);
  assert.ok(result.riskScore < 35);
});

test('Risk Engine flags disposable email addresses', async () => {
  initDatabase();

  const fpId = `fp_test_disposable_${Date.now()}`;
  const result = await evaluateRisk({
    appId: 'app_demo_default',
    email: `abuser_${Date.now()}@mailinator.com`,
    action: 'signup',
    clientFingerprintId: fpId,
    clientToken: `tok_${fpId}`,
    ipAddress: '198.51.100.99',
    userAgent: 'Mozilla/5.0 Chrome/122.0.0.0',
    signals: {
      canvas: { supported: true, hash: 'h1' },
      webgl: { supported: true, unmaskedRenderer: 'NVIDIA' },
      bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
    },
  });

  assert.strictEqual(result.action, 'flag');
  assert.strictEqual(result.reviewRequired, true);
  assert.ok(result.reasons.some((r) => r.includes('Disposable / temporary email')));
});

test('Risk Engine flags repeated multi-accounting on the same fingerprint', async () => {
  initDatabase();

  const sharedFpId = `fp_shared_syndicate_${Date.now()}`;

  // Register Account 1
  await evaluateRisk({
    appId: 'app_demo_default',
    email: `syndicate_acc1_${Date.now()}@domain.com`,
    action: 'signup',
    clientFingerprintId: sharedFpId,
    clientToken: `tok_${sharedFpId}`,
    ipAddress: '101.20.30.40',
    signals: {
      canvas: { supported: true, hash: 'h_shared' },
      webgl: { supported: true, unmaskedRenderer: 'NVIDIA' },
      bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
    },
  });

  // Register Account 2
  await evaluateRisk({
    appId: 'app_demo_default',
    email: `syndicate_acc2_${Date.now()}@domain.com`,
    action: 'signup',
    clientFingerprintId: sharedFpId,
    clientToken: `tok_${sharedFpId}`,
    ipAddress: '101.20.30.41',
    signals: {
      canvas: { supported: true, hash: 'h_shared' },
      webgl: { supported: true, unmaskedRenderer: 'NVIDIA' },
      bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
    },
  });

  // Register Account 3 (Should trigger multi-account linkage & velocity rule)
  const result3 = await evaluateRisk({
    appId: 'app_demo_default',
    email: `syndicate_acc3_${Date.now()}@domain.com`,
    action: 'signup',
    clientFingerprintId: sharedFpId,
    clientToken: `tok_${sharedFpId}`,
    ipAddress: '101.20.30.42',
    signals: {
      canvas: { supported: true, hash: 'h_shared' },
      webgl: { supported: true, unmaskedRenderer: 'NVIDIA' },
      bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
    },
  });

  assert.strictEqual(result3.action, 'flag');
  assert.strictEqual(result3.reviewRequired, true);
  assert.ok(result3.reasons.some((r) => r.includes('distinct accounts') || r.includes('velocity')));

  // Check that item was placed in review queue
  const queueItem = db.prepare('SELECT * FROM review_queue WHERE fingerprint_id = ?').get(sharedFpId) as any;
  assert.ok(queueItem);
  assert.strictEqual(queueItem.status, 'pending');
});
