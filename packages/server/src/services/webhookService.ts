import { db } from '../db/database';

export interface WebhookPayload {
  event: 'abuse.flagged' | 'abuse.review_needed';
  appId: string;
  eventId: string;
  email?: string;
  fingerprintId: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  timestamp: number;
}

export async function dispatchWebhookIfConfigured(appId: string, payload: WebhookPayload): Promise<void> {
  try {
    const app = db.prepare('SELECT webhook_url FROM apps WHERE id = ?').get(appId) as { webhook_url?: string } | undefined;
    if (!app || !app.webhook_url || !app.webhook_url.startsWith('http')) {
      return;
    }

    // Fire and forget, with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    fetch(app.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AbuseShield-Webhook/1.0',
        'X-AbuseShield-Delivery': payload.eventId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          console.warn(`[Webhook] Delivery to ${app.webhook_url} failed with HTTP ${res.status}`);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.warn(`[Webhook] Delivery error to ${app.webhook_url}:`, err.message);
      });
  } catch (err) {
    // Non-blocking
  }
}
