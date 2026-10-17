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

export function getAppRules(appId: string): RuleConfig {
  const row = db.prepare('SELECT * FROM rules WHERE app_id = ?').get(appId) as RuleConfig | undefined;
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
  const rules = getAppRules(input.appId);
  const fpId = input.clientFingerprintId;
  const reasons: string[] = [];
  let score = 0;

  // 1. Analyze Email
  const emailAnalysis = input.email ? analyzeEmail(input.email) : null;
  const normalizedEmail = emailAnalysis ? emailAnalysis.normalized : (input.userId || '');

  // 2. Check Device Banned History
  const fpRecord = db.prepare(`
    SELECT is_banned, total_events, linked_accounts_count
    FROM fingerprints WHERE id = ? AND app_id = ?
  `).get(fpId, input.appId) as { is_banned: number; total_events: number; linked_accounts_count: number } | undefined;

  if (fpRecord && fpRecord.is_banned === 1) {
    score += 55;
    reasons.push('Device previously flagged as a known abuser');
  }

  // 3. Velocity Check: Signups within last 24h on this fingerprint
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const recentEvents = db.prepare(`
    SELECT COUNT(*) as cnt FROM events
    WHERE app_id = ? AND fingerprint_id = ? AND created_at > ?
  `).get(input.appId, fpId, twentyFourHoursAgo) as { cnt: number };

  const recentCount = (recentEvents?.cnt || 0) + 1; // including current
  if (recentCount >= rules.max_registrations_24h) {
    score += 40;
    reasons.push(`High registration velocity: ${recentCount} actions in 24 hours on this device (threshold: ${rules.max_registrations_24h})`);
  }

  // 4. Multi-Account Linkage Check
  const linkedAccounts = db.prepare(`
    SELECT COUNT(DISTINCT normalized_email) as cnt FROM accounts
    WHERE app_id = ? AND fingerprint_id = ?
  `).get(input.appId, fpId) as { cnt: number };

  let currentLinked = linkedAccounts?.cnt || 0;
  // If this is a new email not yet counted
  if (normalizedEmail) {
    const emailExistsForFp = db.prepare(`
      SELECT 1 FROM accounts WHERE app_id = ? AND fingerprint_id = ? AND normalized_email = ?
    `).get(input.appId, fpId, normalizedEmail);
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
    const existingAlias = db.prepare(`
      SELECT email FROM accounts WHERE app_id = ? AND normalized_email = ? LIMIT 1
    `).get(input.appId, normalizedEmail) as { email: string } | undefined;

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
    const ipCheck = checkIpHop(input.appId, fpId, input.ipAddress);
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

  // Clamp score
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
  db.prepare(`
    INSERT INTO events (
      id, app_id, event_type, email, normalized_email, user_id,
      fingerprint_id, client_token, ip_address, user_agent,
      risk_score, risk_level, reasons, status, raw_signals, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    JSON.stringify(reasons),
    eventStatus,
    input.signals ? JSON.stringify(input.signals) : null,
    now
  );

  // Upsert Fingerprint record
  const existingFp = db.prepare('SELECT id FROM fingerprints WHERE id = ? AND app_id = ?').get(fpId, input.appId);
  const canvasHash = input.signals?.canvas?.hash || null;
  const webglRenderer = input.signals?.webgl?.unmaskedRenderer || null;

  if (existingFp) {
    db.prepare(`
      UPDATE fingerprints
      SET last_seen_at = ?,
          total_events = total_events + 1,
          linked_accounts_count = ?,
          primary_ip = ?,
          canvas_hash = COALESCE(?, canvas_hash),
          webgl_renderer = COALESCE(?, webgl_renderer)
      WHERE id = ? AND app_id = ?
    `).run(now, currentLinked, input.ipAddress, canvasHash, webglRenderer, fpId, input.appId);
  } else {
    db.prepare(`
      INSERT INTO fingerprints (
        id, app_id, first_seen_at, last_seen_at, total_events,
        linked_accounts_count, primary_ip, canvas_hash, webgl_renderer, tags, is_banned
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fpId,
      input.appId,
      now,
      now,
      1,
      currentLinked,
      input.ipAddress,
      canvasHash,
      webglRenderer,
      'new',
      0
    );
  }

  // Upsert Account record if email provided
  if (input.email && normalizedEmail) {
    const existingAccount = db.prepare('SELECT id FROM accounts WHERE app_id = ? AND email = ?').get(input.appId, input.email);
    if (!existingAccount) {
      const accountId = `acc_${now}_${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(`
        INSERT INTO accounts (
          id, app_id, email, normalized_email, user_id, fingerprint_id, ip_address, status, first_seen_at, last_seen_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        accountId,
        input.appId,
        input.email,
        normalizedEmail,
        input.userId || null,
        fpId,
        input.ipAddress,
        isFlagged ? 'flagged' : 'active',
        now,
        now
      );
    } else {
      db.prepare(`
        UPDATE accounts
        SET last_seen_at = ?, fingerprint_id = ?, ip_address = ?
        WHERE app_id = ? AND email = ?
      `).run(now, fpId, input.ipAddress, input.appId, input.email);
    }
  }

  // If flagged, add to Review Queue
  if (isFlagged) {
    const reviewId = `rev_${now}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO review_queue (
        id, app_id, event_id, email, fingerprint_id, risk_score, reasons, status, reviewer_notes, reviewed_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId,
      input.appId,
      eventId,
      input.email || null,
      fpId,
      finalScore,
      JSON.stringify(reasons),
      'pending',
      null,
      null,
      now
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
