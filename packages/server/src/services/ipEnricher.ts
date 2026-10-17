import { Request } from 'express';
import { db } from '../db/database';

export interface IPAnalysis {
  ip: string;
  isPrivate: boolean;
  isVpnOrHopping: boolean;
  recentDistinctIpsCount: number;
}

export function extractClientIp(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'] as string;
  if (cfIp) return cfIp.trim();

  const realIp = req.headers['x-real-ip'] as string;
  if (realIp) return realIp.trim();

  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0];
    if (first) return first.trim();
  }

  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

export function isPrivateIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

/**
 * Checks if this device fingerprint has been hopping across multiple distinct IP addresses
 * in the last 12 hours (indicative of VPN rotating or proxy chains).
 */
export async function checkIpHop(
  appId: string,
  fingerprintId: string,
  currentIp: string
): Promise<{ isVpnOrHopping: boolean; recentDistinctIpsCount: number }> {
  try {
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    const rows = await db.query<{ ip_address: string }>(
      `SELECT DISTINCT ip_address FROM events
       WHERE app_id = $1 AND fingerprint_id = $2 AND created_at > $3`,
      [appId, fingerprintId, twelveHoursAgo]
    );

    const ips = new Set(rows.map((r) => r.ip_address));
    ips.add(currentIp);

    const count = ips.size;
    const isVpnOrHopping = count >= 3;

    return {
      isVpnOrHopping,
      recentDistinctIpsCount: count,
    };
  } catch {
    return { isVpnOrHopping: false, recentDistinctIpsCount: 1 };
  }
}
