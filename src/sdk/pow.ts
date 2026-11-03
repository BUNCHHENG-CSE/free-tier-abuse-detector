import { PoWChallenge, PoWSolution } from './types';

/**
 * Lightweight Proof-of-Work (PoW) solver.
 * Finds a nonce such that SHA-256(seed + ":" + nonce) starts with `difficulty` hex zeros.
 * Uses native Web Crypto API when available for hardware-accelerated speed.
 */
export async function solvePoW(challenge: PoWChallenge): Promise<PoWSolution> {
  const { challengeId, seed, difficulty = 4 } = challenge;
  const targetPrefix = '0'.repeat(difficulty);
  const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  let nonce = 0;
  const encoder = new TextEncoder();

  // If modern browser with subtle crypto
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    while (nonce < 1000000) {
      const data = encoder.encode(`${seed}:${nonce}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      if (hashHex.startsWith(targetPrefix)) {
        const timeTakenMs = Math.round(
          ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startTime
        );
        return {
          challengeId,
          nonce,
          hash: hashHex,
          timeTakenMs,
        };
      }
      nonce++;
    }
  }

  // Fallback for non-subtle / Node environments
  return {
    challengeId,
    nonce: 0,
    hash: 'unsupported',
    timeTakenMs: 0,
  };
}
