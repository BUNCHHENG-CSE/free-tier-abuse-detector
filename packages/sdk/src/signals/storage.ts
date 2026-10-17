import { StorageSignal } from '../types';

const TOKEN_KEY = '_as_fp_token';

function generateRandomToken(): string {
  const chars = 'abcdef0123456789';
  let token = 'tok_';
  for (let i = 0; i < 28; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Manages persistent client device token across LocalStorage and cookies.
 */
export function getStorageSignal(): StorageSignal {
  let persistedToken = '';
  let storageAvailable = false;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storageAvailable = true;
      const stored = window.localStorage.getItem(TOKEN_KEY);
      if (stored) {
        persistedToken = stored;
      }
    }
  } catch {
    // LocalStorage blocked (e.g. Incognito / Safari third-party)
  }

  // Check cookie fallback if not in LocalStorage
  if (!persistedToken && typeof document !== 'undefined' && document.cookie) {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${TOKEN_KEY})=([^;]*)`));
    if (match && match[3]) {
      persistedToken = decodeURIComponent(match[3]);
    }
  }

  // If still missing, generate and persist
  if (!persistedToken) {
    persistedToken = generateRandomToken();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, persistedToken);
      }
    } catch {
      // Ignored
    }

    try {
      if (typeof document !== 'undefined') {
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${TOKEN_KEY}=${encodeURIComponent(persistedToken)}; expires=${expires}; path=/; SameSite=Lax`;
      }
    } catch {
      // Ignored
    }
  }

  return {
    persistedToken,
    storageAvailable,
  };
}
