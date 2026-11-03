import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';
import { prisma } from '@/lib/db/prisma';
import { getAppRules } from '@/lib/services/riskEngine';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function GET() {
  try {
    await initDatabase();

    if (db.isPostgres) {
      const [rules, app] = await Promise.all([
        getAppRules(APP_ID),
        prisma.app.findUnique({
          where: { id: APP_ID },
          select: { name: true, apiKey: true, webhookUrl: true },
        }),
      ]);

      return NextResponse.json({
        rules,
        app: app
          ? { name: app.name, api_key: app.apiKey, webhook_url: app.webhookUrl || '' }
          : { name: 'Acme Cloud Production', api_key: 'pk_live_abuseshield_demo', webhook_url: '' },
      });
    }

    const rules = await getAppRules(APP_ID);
    const app = await db.queryOne(
      'SELECT name, api_key, webhook_url FROM apps WHERE id = $1',
      [APP_ID]
    );

    return NextResponse.json({
      rules,
      app: app || { name: 'Acme Cloud Production', api_key: 'pk_live_abuseshield_demo', webhook_url: '' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase();
    const {
      max_registrations_24h,
      max_accounts_per_fp,
      flag_disposable_email,
      flag_headless_bot,
      flag_ip_hopping,
      flag_behavioral_bot,
      flag_tampering,
      pow_enabled,
      pow_difficulty,
      quota_limit,
      discord_webhook_url,
      slack_webhook_url,
      min_score_to_flag,
      webhook_on_flag,
      webhook_url,
    } = await req.json();

    const now = Date.now();

    if (db.isPostgres) {
      await prisma.$transaction(async (tx) => {
        await tx.rule.upsert({
          where: { appId: APP_ID },
          update: {
            maxRegistrations24h: max_registrations_24h !== undefined ? Number(max_registrations_24h) : undefined,
            maxAccountsPerFp: max_accounts_per_fp !== undefined ? Number(max_accounts_per_fp) : undefined,
            flagDisposableEmail: flag_disposable_email !== undefined ? (flag_disposable_email ? 1 : 0) : undefined,
            flagHeadlessBot: flag_headless_bot !== undefined ? (flag_headless_bot ? 1 : 0) : undefined,
            flagIpHopping: flag_ip_hopping !== undefined ? (flag_ip_hopping ? 1 : 0) : undefined,
            flagBehavioralBot: flag_behavioral_bot !== undefined ? (flag_behavioral_bot ? 1 : 0) : undefined,
            flagTampering: flag_tampering !== undefined ? (flag_tampering ? 1 : 0) : undefined,
            powEnabled: pow_enabled !== undefined ? (pow_enabled ? 1 : 0) : undefined,
            powDifficulty: pow_difficulty !== undefined ? Number(pow_difficulty) : undefined,
            quotaLimit: quota_limit !== undefined ? Number(quota_limit) : undefined,
            discordWebhookUrl: discord_webhook_url !== undefined ? discord_webhook_url : undefined,
            slackWebhookUrl: slack_webhook_url !== undefined ? slack_webhook_url : undefined,
            minScoreToFlag: min_score_to_flag !== undefined ? Number(min_score_to_flag) : undefined,
            webhookOnFlag: webhook_on_flag !== undefined ? (webhook_on_flag ? 1 : 0) : undefined,
            updatedAt: BigInt(now),
          },
          create: {
            appId: APP_ID,
            maxRegistrations24h: max_registrations_24h ?? 3,
            maxAccountsPerFp: max_accounts_per_fp ?? 2,
            flagDisposableEmail: flag_disposable_email ? 1 : 0,
            flagHeadlessBot: flag_headless_bot ? 1 : 0,
            flagIpHopping: flag_ip_hopping ? 1 : 0,
            flagBehavioralBot: flag_behavioral_bot ? 1 : 0,
            flagTampering: flag_tampering ? 1 : 0,
            powEnabled: pow_enabled ? 1 : 0,
            powDifficulty: pow_difficulty ?? 4,
            quotaLimit: quota_limit ?? 50,
            discordWebhookUrl: discord_webhook_url || null,
            slackWebhookUrl: slack_webhook_url || null,
            minScoreToFlag: min_score_to_flag ?? 35,
            webhookOnFlag: webhook_on_flag ? 1 : 0,
            updatedAt: BigInt(now),
          },
        });

        if (webhook_url !== undefined) {
          await tx.app.update({
            where: { id: APP_ID },
            data: { webhookUrl: webhook_url },
          });
        }
      });

      const updatedRules = await getAppRules(APP_ID);
      const updatedApp = await prisma.app.findUnique({
        where: { id: APP_ID },
        select: { name: true, apiKey: true, webhookUrl: true },
      });

      return NextResponse.json({
        success: true,
        rules: updatedRules,
        app: updatedApp
          ? { name: updatedApp.name, api_key: updatedApp.apiKey, webhook_url: updatedApp.webhookUrl || '' }
          : null,
      });
    }

    await db.execute(
      `UPDATE rules
       SET max_registrations_24h = COALESCE($1, max_registrations_24h),
           max_accounts_per_fp = COALESCE($2, max_accounts_per_fp),
           flag_disposable_email = COALESCE($3, flag_disposable_email),
           flag_headless_bot = COALESCE($4, flag_headless_bot),
           flag_ip_hopping = COALESCE($5, flag_ip_hopping),
           flag_behavioral_bot = COALESCE($6, flag_behavioral_bot),
           flag_tampering = COALESCE($7, flag_tampering),
           pow_enabled = COALESCE($8, pow_enabled),
           pow_difficulty = COALESCE($9, pow_difficulty),
           quota_limit = COALESCE($10, quota_limit),
           discord_webhook_url = COALESCE($11, discord_webhook_url),
           slack_webhook_url = COALESCE($12, slack_webhook_url),
           min_score_to_flag = COALESCE($13, min_score_to_flag),
           webhook_on_flag = COALESCE($14, webhook_on_flag),
           updated_at = $15
       WHERE app_id = $16`,
      [
        max_registrations_24h !== undefined ? max_registrations_24h : null,
        max_accounts_per_fp !== undefined ? max_accounts_per_fp : null,
        flag_disposable_email !== undefined ? (flag_disposable_email ? 1 : 0) : null,
        flag_headless_bot !== undefined ? (flag_headless_bot ? 1 : 0) : null,
        flag_ip_hopping !== undefined ? (flag_ip_hopping ? 1 : 0) : null,
        flag_behavioral_bot !== undefined ? (flag_behavioral_bot ? 1 : 0) : null,
        flag_tampering !== undefined ? (flag_tampering ? 1 : 0) : null,
        pow_enabled !== undefined ? (pow_enabled ? 1 : 0) : null,
        pow_difficulty !== undefined ? pow_difficulty : null,
        quota_limit !== undefined ? quota_limit : null,
        discord_webhook_url !== undefined ? discord_webhook_url : null,
        slack_webhook_url !== undefined ? slack_webhook_url : null,
        min_score_to_flag !== undefined ? min_score_to_flag : null,
        webhook_on_flag !== undefined ? (webhook_on_flag ? 1 : 0) : null,
        now,
        APP_ID,
      ]
    );

    if (webhook_url !== undefined) {
      await db.execute(
        `UPDATE apps
         SET webhook_url = $1
         WHERE id = $2`,
        [webhook_url, APP_ID]
      );
    }

    const updatedRules = await getAppRules(APP_ID);
    const updatedApp = await db.queryOne(
      'SELECT name, api_key, webhook_url FROM apps WHERE id = $1',
      [APP_ID]
    );

    return NextResponse.json({
      success: true,
      rules: updatedRules,
      app: updatedApp,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
