import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { prisma } from '../db/prisma';
import { getAppRules } from '../services/riskEngine';

export const rulesRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * Get current rule thresholds and app settings
 */
rulesRouter.get('/rules', async (req: Request, res: Response) => {
  try {
    if (db.isPostgres) {
      const [rules, app] = await Promise.all([
        getAppRules(APP_ID),
        prisma.app.findUnique({
          where: { id: APP_ID },
          select: { name: true, apiKey: true, webhookUrl: true },
        }),
      ]);

      return res.json({
        rules,
        app: app ? { name: app.name, api_key: app.apiKey, webhook_url: app.webhookUrl } : null,
      });
    }

    const rules = await getAppRules(APP_ID);
    const app = await db.queryOne(
      'SELECT name, api_key, webhook_url FROM apps WHERE id = $1',
      [APP_ID]
    );

    res.json({
      rules,
      app,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update rule thresholds and app settings
 */
rulesRouter.put('/rules', async (req: Request, res: Response) => {
  try {
    const {
      max_registrations_24h,
      max_accounts_per_fp,
      flag_disposable_email,
      flag_headless_bot,
      flag_ip_hopping,
      min_score_to_flag,
      webhook_on_flag,
      webhook_url,
    } = req.body;

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

      return res.json({
        success: true,
        rules: updatedRules,
        app: updatedApp ? { name: updatedApp.name, api_key: updatedApp.apiKey, webhook_url: updatedApp.webhookUrl } : null,
      });
    }

    await db.execute(
      `UPDATE rules
       SET max_registrations_24h = COALESCE($1, max_registrations_24h),
           max_accounts_per_fp = COALESCE($2, max_accounts_per_fp),
           flag_disposable_email = COALESCE($3, flag_disposable_email),
           flag_headless_bot = COALESCE($4, flag_headless_bot),
           flag_ip_hopping = COALESCE($5, flag_ip_hopping),
           min_score_to_flag = COALESCE($6, min_score_to_flag),
           webhook_on_flag = COALESCE($7, webhook_on_flag),
           updated_at = $8
       WHERE app_id = $9`,
      [
        max_registrations_24h !== undefined ? max_registrations_24h : null,
        max_accounts_per_fp !== undefined ? max_accounts_per_fp : null,
        flag_disposable_email !== undefined ? (flag_disposable_email ? 1 : 0) : null,
        flag_headless_bot !== undefined ? (flag_headless_bot ? 1 : 0) : null,
        flag_ip_hopping !== undefined ? (flag_ip_hopping ? 1 : 0) : null,
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

    res.json({
      success: true,
      rules: updatedRules,
      app: updatedApp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
