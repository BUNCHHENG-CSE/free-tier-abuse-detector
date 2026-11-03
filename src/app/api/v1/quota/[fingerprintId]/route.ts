import { NextRequest, NextResponse } from 'next/server';
import { getDeviceQuota } from '@/lib/services/quotaService';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ fingerprintId: string }> }
) {
  try {
    const { fingerprintId } = await context.params;
    const quota = await getDeviceQuota(APP_ID, fingerprintId);
    return NextResponse.json({
      allowed: quota.is_locked === 0 && quota.credits_used < quota.credits_allocated,
      allocated: quota.credits_allocated,
      used: quota.credits_used,
      remaining: Math.max(0, quota.credits_allocated - quota.credits_used),
      linkedAccountsCount: quota.linked_accounts_count,
      isLocked: quota.is_locked === 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
