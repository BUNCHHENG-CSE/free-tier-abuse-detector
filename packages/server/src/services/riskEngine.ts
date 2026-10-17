import { db } from '../db/database';
import { analyzeEmail } from './emailValidator';
import { checkIpHop } from './ipEnricher';
import { dispatchWebhookIfConfigured } from './webhookService';

export interface VerifyInput {
  appId: string;
  email?: string;
  userId?: string;
  action?: string;
  clientFingerprintId: string;
  clientToken?: string;
  signals?: any;
  ipAddress: string;
  userAgent?: string;
}

export interface RuleConfig {
  app_id: string;
  max_registrations_24h: number;
  max_accounts_per_fp: number;
  flag_disposable_email: number;
  flag_headless_bot: number;
  flag_ip_hopping: number;
  min_score_to_flag: number;
  webhook_on_flag: number;
}

export interface RiskEvaluationResult {
  action: 'allow' | 'flag' | 'deny';
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  fingerprintId: string;
  eventId: string;
  reviewRequired: boolean;
}

export async function getAppRules(appId: string): Promise<RuleConfig> {
  const row = await db.queryOne<RuleConfig>(
    'SELECT * FROM rules WHERE app_id = $1',
    [appId]
  );
  if (row) return row;

  return {
    app_id: appId,
    max_registrations_24h: 3,
    max_accounts_per_fp: 2,
    flag_disposable_email: 1,
    flag_headless_bot: 1,
    flag_ip_hopping: 1,
    min_score_to_flag: 35,
    webhook_on_flag: 1,
  };
}

export async function evaluateRisk(input: VerifyInput): Promise<RiskEvaluationResult> {
  const now = Date.now();
  const rules = await getAppRules(input.appId);
  const fpId = input.clientFingerprintId;
  const reasons: string[] = [];
  let score = 0;

  // 1. Analyze Email
  const emailAnalysis = input.email ? analyzeEmail(input.email) : null;
  const normalizedEmail = emailAnalysis ? emailAnalysis.normalized : (input.userId || '');

  // 2. Check Device Banned History
  const fpRecord = await db.queryOne<{ is_banned: number; total_events: number; linked_accounts_count: number }>(
    `SELECT is_banned, total_events, linked_accounts_count
     FROM fingerprints WHERE id = $1 AND app_id = $2`,
    [fpId, input.appId]
  );

  if (fpRecord && fpRecord.is_banned === 1) {
    score += 55;
    reasons.push('Device previously flagged as a known abuser');
  }

  // 3. Velocity Check: Signups within last 24h on this fingerprint
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const recentEvents = await db.queryOne<{ cnt: number | string }>(
    `SELECT COUNT(*) as cnt FROM events
     WHERE app_id = $1 AND fingerprint_id = $2 AND created_at > $3`,
    [input.appId, fpId, twentyFourHoursAgo]
  );

  const recentCount = (parseInt(String(recentEvents?.cnt || 0), 10)) + 1; // including current
  if (recentCount >= rules.max_registrations_24h) {
    score += 40;
    reasons.push(`High registration velocity: ${recentCount} actions in 24 hours on this device (threshold: ${rules.max_registrations_24h})`);
  }

  // 4. Multi-Account Linkage Check
  const linkedAccounts = await db.queryOne<{ cnt: number | string }>(
    `SELECT COUNT(DISTINCT normalized_email) as cnt FROM accounts
     WHERE app_id = $1 AND fingerprint_id = $2`,
    [input.appId, fpId]
  );

  let currentLinked = parseInt(String(linkedAccounts?.cnt || 0), 10);
  if (normalizedEmail) {
    const emailExistsForFp = await db.queryOne(
      `SELECT 1 FROM accounts WHERE app_id = $1 AND fingerprint_id = $2 AND normalized_email = $3 LIMIT 1`,
      [input.appId, fpId, normalizedEmail]
    );
    if (!emailExistsForFp) {
      currentLinked += 1;
    }
  }

  if (currentLinked >= rules.max_accounts_per_fp) {
    score += 35;
    reasons.push(`Device linked to ${currentLinked} distinct accounts (threshold: ${rules.max_accounts_per_fp})`);
  }

  // 5. Disposable Email Check
  if (rules.flag_disposable_email && emailAnalysis?.isDisposable) {
    score += 35;
    reasons.push(`Disposable / temporary email domain detected (${emailAnalysis.domain})`);
  }

  // 6. Subaddressing / Plus Alias Reuse Check
  if (emailAnalysis?.hasSubaddressing) {
    const existingAlias = await db.queryOne<{ email: string }>(
      `SELECT email FROM accounts WHERE app_id = $1 AND normalized_email = $2 LIMIT 1`,
      [input.appId, normalizedEmail]
    );

    if (existingAlias && existingAlias.email !== input.email) {
      score += 25;
      reasons.push(`Plus-addressing alias reusing registered mailbox: ${existingAlias.email}`);
    }
  }

  // 7. Bot / Headless Signals
  const botSignals = input.signals?.bot;
  if (rules.flag_headless_bot && botSignals) {
    if (botSignals.isWebdriver) {
      score += 45;
      reasons.push('Automated browser detected via navigator.webdriver');
    }
    if (botSignals.isHeadless) {
      score += 40;
      reasons.push('Headless browser user-agent / runtime environment detected');
    }
    if (botSignals.hasAutomationFlags && !botSignals.isWebdriver && !botSignals.isHeadless) {
      score += 30;
      reasons.push('Automation frameworks detected (Selenium/Puppeteer runtime markers)');
    }
  }

  // 8. IP Hopping / VPN signature
  if (rules.flag_ip_hopping) {
    const ipCheck = await checkIpHop(input.appId, fpId, input.ipAddress);
    if (ipCheck.isVpnOrHopping) {
      score += 20;
      reasons.push(`Rapid IP hopping across ${ipCheck.recentDistinctIpsCount} distinct IPs (VPN bypass signature)`);
    }
  }

  // 9. Hardware Signals Consistency
  const canvas = input.signals?.canvas;
  const webgl = input.signals?.webgl;
  if (canvas && (!canvas.supported || canvas.hash === 'blocked_or_error')) {
    score += 15;
    reasons.push('Canvas rendering blocked or spoofed');
  }
  if (webgl && (!webgl.supported || !webgl.unmaskedRenderer)) {
    score += 15;
    reasons.push('Hardware GPU acceleration absent or masked');
  }

  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (finalScore >= 80) riskLevel = 'CRITICAL';
  else if (finalScore >= 60) riskLevel = 'HIGH';
  else if (finalScore >= 31) riskLevel = 'MEDIUM';

  const isFlagged = finalScore >= rules.min_score_to_flag;
  const action: 'allow' | 'flag' | 'deny' = isFlagged ? 'flag' : 'allow';
  const eventStatus = isFlagged ? 'flagged' : 'allowed';

  const eventId = `ev_${now}_${Math.random().toString(36).slice(2, 9)}`;

  // Store Event
  await db.execute(
    `INSERT INTO events (
      id, app_id, event_type, email, normalized_email, user_id,
      fingerprint_id, client_token, ip_address, user_agent,
      risk_score, risk_level, reasons, status, raw_signals, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      eventId,
      input.appId,
      input.action || 'signup',
      input.email || null,
      normalizedEmail || null,
      input.userId || null,
      fpId,
      input.clientToken || null,
      input.ipAddress,
      input.userAgent || null,
      finalScore,
      riskLevel,
      reasons,
      eventStatus,
      input.signals || null,
      now,
    ]
  );

  // Upsert Fingerprint with high-concurrency ON CONFLICT
  const canvasHash = input.signals?.canvas?.hash || null;
  const webglRenderer = input.signals?.webgl?.unmaskedRenderer || null;

  await db.execute(
    `INSERT INTO fingerprints (
      id, app_id, first_seen_at, last_seen_at, total_events,
      linked_accounts_count, primary_ip, canvas_hash, webgl_renderer, tags, is_banned
    )
    VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, 'new', 0)
    ON CONFLICT (id, app_id) DO UPDATE SET
      last_seen_at = EXCLUDED.last_seen_at,
      total_events = fingerprints.total_events + 1,
      linked_accounts_count = EXCLUDED.linked_accounts_count,
      primary_ip = EXCLUDED.primary_ip,
      canvas_hash = COALESCE(EXCLUDED.canvas_hash, fingerprints.canvas_hash),
      webgl_renderer = COALESCE(EXCLUDED.webgl_renderer, fingerprints.webgl_renderer)`,
    [fpId, input.appId, now, now, currentLinked, input.ipAddress, canvasHash, webglRenderer]
  );

  // Upsert Account record if email provided
  if (input.email && normalizedEmail) {
    const existingAccount = await db.queryOne(
      'SELECT id FROM accounts WHERE app_id = $1 AND email = $2',
      [input.appId, input.email]
    );

    if (!existingAccount) {
      const accountId = `acc_${now}_${Math.random().toString(36).slice(2, 8)}`;
      await db.execute(
        `INSERT INTO accounts (
          id, app_id, email, normalized_email, user_id, fingerprint_id, ip_address, status, first_seen_at, last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          accountId,
          input.appId,
          input.email,
          normalizedEmail,
          input.userId || null,
          fpId,
          input.ipAddress,
          isFlagged ? 'flagged' : 'active',
          now,
          now,
        ]
      );
    } else {
      await db.execute(
        `UPDATE accounts
         SET last_seen_at = $1, fingerprint_id = $2, ip_address = $3
         WHERE app_id = $4 AND email = $5`,
        [now, fpId, input.ipAddress, input.appId, input.email]
      );
    }
  }

  // If flagged, add to Review Queue
  if (isFlagged) {
    const reviewId = `rev_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute(
      `INSERT INTO review_queue (
        id, app_id, event_id, email, fingerprint_id, risk_score, reasons, status, reviewer_notes, reviewed_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL, $9)`,
      [
        reviewId,
        input.appId,
        eventId,
        input.email || null,
        fpId,
        finalScore,
        reasons,
        'pending',
        now,
      ]
    );

    // Dispatch Webhook notification
    if (rules.webhook_on_flag) {
      dispatchWebhookIfConfigured(input.appId, {
        event: 'abuse.flagged',
        appId: input.appId,
        eventId,
        email: input.email,
        fingerprintId: fpId,
        riskScore: finalScore,
        riskLevel,
        reasons,
        timestamp: now,
      });
    }
  }

  return {
    action,
    riskScore: finalScore,
    riskLevel,
    reasons,
    fingerprintId: fpId,
    eventId,
    reviewRequired: isFlagged,
  };
}
