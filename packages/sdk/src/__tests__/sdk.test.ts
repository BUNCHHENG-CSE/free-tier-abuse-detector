import test from 'node:test';
import assert from 'node:assert';
import { murmurHash3, hash64, generateFingerprintId } from '../hash';
import { AbuseShield } from '../index';

test('MurmurHash3 generates consistent 32-bit hashes', () => {
  const hash1 = murmurHash3('hello world', 0);
  const hash2 = murmurHash3('hello world', 0);
  const hashDiff = murmurHash3('hello world!', 0);

  assert.strictEqual(typeof hash1, 'number');
  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hashDiff);
});

test('hash64 generates 16-character hex strings', () => {
  const h = hash64('sample-hardware-string');
  assert.strictEqual(h.length, 16);
  assert.match(h, /^[0-9a-f]{16}$/);
});

test('generateFingerprintId generates standard fp_ prefix with 32 hex chars', () => {
  const fpId = generateFingerprintId('canvas_hash|||webgl_vendor|||1920x1080');
  assert.ok(fpId.startsWith('fp_'));
  assert.strictEqual(fpId.length, 35); // 'fp_' + 32 chars
});

test('AbuseShield.getFingerprint executes safely in Node/SSR environment', async () => {
  const client = AbuseShield.init({ apiKey: 'test_key_123', debug: false });
  const result = await client.getFingerprint();

  assert.ok(result.fingerprintId);
  assert.ok(result.fingerprintId.startsWith('fp_'));
  assert.ok(typeof result.confidence === 'number');
  assert.ok(result.signals);
  assert.strictEqual(result.signals.system.platform, typeof navigator !== 'undefined' ? navigator.platform : 'unknown');
});
