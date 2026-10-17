/**
 * Fast, zero-dependency MurmurHash3 (32-bit & 64-bit combination).
 * Highly deterministic with low collision rates across device fingerprints.
 */

export function murmurHash3(key: string, seed: number = 0): number {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const len = key.length;
  const nblocks = len >> 2;

  for (let i = 0; i < nblocks; i++) {
    const idx = i << 2;
    let k1 =
      (key.charCodeAt(idx) & 0xff) |
      ((key.charCodeAt(idx + 1) & 0xff) << 8) |
      ((key.charCodeAt(idx + 2) & 0xff) << 16) |
      ((key.charCodeAt(idx + 3) & 0xff) << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  let k1 = 0;
  const tail = nblocks << 2;
  switch (len & 3) {
    case 3:
      k1 ^= (key.charCodeAt(tail + 2) & 0xff) << 16;
    case 2:
      k1 ^= (key.charCodeAt(tail + 1) & 0xff) << 8;
    case 1:
      k1 ^= key.charCodeAt(tail) & 0xff;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Generates a 64-bit hex hash string from an arbitrary input string.
 */
export function hash64(input: string): string {
  const h1 = murmurHash3(input, 31).toString(16).padStart(8, '0');
  const h2 = murmurHash3(input, 97).toString(16).padStart(8, '0');
  return `${h1}${h2}`;
}

/**
 * Generates a 128-bit hex fingerprint identifier (e.g. fp_3f8a91c...)
 */
export function generateFingerprintId(compositeKey: string): string {
  const h1 = murmurHash3(compositeKey, 101).toString(16).padStart(8, '0');
  const h2 = murmurHash3(compositeKey, 233).toString(16).padStart(8, '0');
  const h3 = murmurHash3(compositeKey, 509).toString(16).padStart(8, '0');
  const h4 = murmurHash3(compositeKey, 769).toString(16).padStart(8, '0');
  return `fp_${h1}${h2}${h3}${h4}`;
}
