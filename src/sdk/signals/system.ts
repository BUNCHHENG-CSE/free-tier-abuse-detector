import { SystemSignal } from '../types';

/**
 * Collects system environment and browser locale configuration,
 * including hardware spoofing and OS inconsistency indicators.
 */
export function getSystemSignal(): SystemSignal {
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // Fallback
  }

  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const win = typeof window !== 'undefined' ? window : null;
  const scr = typeof screen !== 'undefined' ? screen : null;

  const timezoneOffset = new Date().getTimezoneOffset();
  const language = nav?.language || 'en-US';
  const languages = nav?.languages ? Array.from(nav.languages) : [language];
  const platform = nav?.platform || 'unknown';
  const hardwareConcurrency = nav?.hardwareConcurrency || 4;
  const deviceMemory = nav && 'deviceMemory' in nav ? (nav as any).deviceMemory : undefined;
  const cookieEnabled = nav?.cookieEnabled ?? true;
  const doNotTrack = nav?.doNotTrack || null;
  const userAgent = nav?.userAgent || '';

  // Inconsistency heuristics
  let platformMismatch = false;
  if (platform && userAgent) {
    const isUaMac = /Macintosh|Mac OS X/i.test(userAgent);
    const isUaWin = /Windows NT/i.test(userAgent);
    const isUaLinux = /Linux/i.test(userAgent) && !/Android/i.test(userAgent);

    const isPlatMac = /Mac/i.test(platform);
    const isPlatWin = /Win/i.test(platform);
    const isPlatLinux = /Linux/i.test(platform);

    if ((isUaMac && !isPlatMac) || (isUaWin && !isPlatWin) || (isUaLinux && !isPlatLinux)) {
      platformMismatch = true;
    }
  }

  let screenParadox = false;
  if (scr) {
    if (scr.availWidth > scr.width || scr.availHeight > scr.height) {
      screenParadox = true;
    }
  }
  if (win && win.outerWidth === 0 && win.outerHeight === 0 && nav && !/mobile/i.test(userAgent)) {
    screenParadox = true;
  }

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
    platformMismatch,
    screenParadox,
    isTampered: platformMismatch || screenParadox,
  };
}
