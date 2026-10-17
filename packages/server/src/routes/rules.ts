import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getAppRules } from '../services/riskEngine';

export const rulesRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * Get current rule thresholds and app settings
 */
rulesRouter.get('/rules', (req: Request, res: Response) => {
  try {
    const rules = getAppRules(APP_ID);
    const app = db.prepare('SELECT name, api_key, webhook_url FROM apps WHERE id = ?').get(APP_ID) as any;

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
rulesRouter.put('/rules', (req: Request, res: Response) => {
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

    db.prepare(`
      UPDATE rules
      SET max_registrations_24h = COALESCE(?, max_registrations_24h),
          max_accounts_per_fp = COALESCE(?, max_accounts_per_fp),
          flag_disposable_email = COALESCE(?, flag_disposable_email),
          flag_headless_bot = COALESCE(?, flag_headless_bot),
          flag_ip_hopping = COALESCE(?, flag_ip_hopping),
          min_score_to_flag = COALESCE(?, min_score_to_flag),
          webhook_on_flag = COALESCE(?, webhook_on_flag),
          updated_at = ?
      WHERE app_id = ?
    `).run(
      max_registrations_24h,
      max_accounts_per_fp,
      flag_disposable_email !== undefined ? (flag_disposable_email ? 1 : 0) : null,
      flag_headless_bot !== undefined ? (flag_headless_bot ? 1 : 0) : null,
      flag_ip_hopping !== undefined ? (flag_ip_hopping ? 1 : 0) : null,
      min_score_to_flag,
      webhook_on_flag !== undefined ? (webhook_on_flag ? 1 : 0) : null,
      now,
      APP_ID
    );

    if (webhook_url !== undefined) {
      db.prepare(`
        UPDATE apps
        SET webhook_url = ?
        WHERE id = ?
      `).run(webhook_url, APP_ID);
    }

    const updatedRules = getAppRules(APP_ID);
    const updatedApp = db.prepare('SELECT name, api_key, webhook_url FROM apps WHERE id = ?').get(APP_ID) as any;

    res.json({
      success: true,
      rules: updatedRules,
      app: updatedApp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
