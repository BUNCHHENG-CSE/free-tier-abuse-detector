import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { evaluateRisk } from '../services/riskEngine';
import { extractClientIp } from '../services/ipEnricher';

export const ingestRouter = Router();

// Middleware: Resolve App by API Key
async function resolveApp(req: Request, res: Response, next: NextFunction) {
  const apiKey =
    (req.headers['x-abuseshield-key'] as string) ||
    (req.query.apiKey as string) ||
    req.body.apiKey;

  if (!apiKey) {
    (req as any).appId = 'app_demo_default';
    return next();
  }

  const app = await db.queryOne<{ id: string }>('SELECT id FROM apps WHERE api_key = $1', [apiKey]);
  if (!app) {
    if (apiKey === 'pk_live_abuseshield_demo' || apiKey === 'anon') {
      (req as any).appId = 'app_demo_default';
      return next();
    }
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  (req as any).appId = app.id;
  next();
}

/**
 * Main verification endpoint: Evaluates browser signals & registration history
 */
ingestRouter.post('/verify', resolveApp, async (req: Request, res: Response) => {
  try {
    const appId = (req as any).appId;
    const {
      email,
      userId,
      action = 'signup',
      clientFingerprintId,
      clientToken,
      signals,
    } = req.body;

    if (!clientFingerprintId) {
      return res.status(400).json({ error: 'Missing clientFingerprintId' });
    }

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    const result = await evaluateRisk({
      appId,
      email,
      userId,
      action,
      clientFingerprintId,
      clientToken,
      signals,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[Ingest] Verify error:', err);
    res.status(500).json({ error: 'Internal verification error', message: err.message });
  }
});

/**
 * Async telemetry endpoint
 */
ingestRouter.post('/telemetry', resolveApp, async (req: Request, res: Response) => {
  try {
    const appId = (req as any).appId;
    const { eventType = 'pageview', clientFingerprintId, clientToken, signals } = req.body;

    if (!clientFingerprintId) {
      return res.status(400).json({ error: 'Missing clientFingerprintId' });
    }

    const ipAddress = extractClientIp(req);
    const now = Date.now();
    const eventId = `ev_telem_${now}_${Math.random().toString(36).slice(2, 7)}`;

    await db.execute(
      `INSERT INTO events (
        id, app_id, event_type, email, normalized_email, user_id,
        fingerprint_id, client_token, ip_address, user_agent,
        risk_score, risk_level, reasons, status, raw_signals, created_at
      )
      VALUES ($1, $2, $3, NULL, NULL, NULL, $4, $5, $6, $7, 0, 'LOW', '[]', 'telemetry', $8, $9)`,
      [
        eventId,
        appId,
        eventType,
        clientFingerprintId,
        clientToken || null,
        ipAddress,
        req.headers['user-agent'] || null,
        signals || null,
        now,
      ]
    );

    res.json({ success: true, eventId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
