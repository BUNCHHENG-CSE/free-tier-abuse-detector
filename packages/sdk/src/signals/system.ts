import { SystemSignal } from '../types';

/**
 * Collects system environment and browser locale configuration.
 */
export function getSystemSignal(): SystemSignal {
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // Fallback
  }

  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const timezoneOffset = new Date().getTimezoneOffset();
  const language = nav?.language || 'en-US';
  const languages = nav?.languages ? Array.from(nav.languages) : [language];
  const platform = nav?.platform || 'unknown';
  const hardwareConcurrency = nav?.hardwareConcurrency || 4;
  const deviceMemory = nav && 'deviceMemory' in nav ? (nav as any).deviceMemory : undefined;
  const cookieEnabled = nav?.cookieEnabled ?? true;
  const doNotTrack = nav?.doNotTrack || null;

  return {
    timezone,
    timezoneOffset,
    language,
    languages,
    platform,
    hardwareConcurrency,
    deviceMemory,
    cookieEnabled,
    doNotTrack,
  };
}
