import { db } from '../db/database';

export interface WebhookPayload {
  event: 'abuse.flagged' | 'abuse.review_needed' | 'test.alert';
  appId: string;
  eventId: string;
  email?: string;
  fingerprintId: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  timestamp: number;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';
}

function formatDiscordPayload(payload: WebhookPayload) {
  const color = payload.riskScore >= 70 ? 0xf43f5e : payload.riskScore >= 35 ? 0xf59e0b : 0x10b981;
  const baseUrl = getBaseUrl();
  const quickBanUrl = `${baseUrl}/api/v1/action/quick-ban?appId=${encodeURIComponent(payload.appId)}&fpId=${encodeURIComponent(payload.fingerprintId)}`;

  return {
    username: 'AbuseShield HUD',
    avatar_url: 'https://raw.githubusercontent.com/abuseshield/assets/main/shield.png',
    embeds: [
      {
        title: `🚨 AbuseShield Alert: ${payload.riskLevel} Risk Registration`,
        description: `Automated detection triggered for free-tier registration.`,
        color,
        fields: [
          { name: 'Risk Score', value: `**${payload.riskScore} / 100** (${payload.riskLevel})`, inline: true },
          { name: 'Email Target', value: payload.email ? `\`${payload.email}\`` : '_None provided_', inline: true },
          { name: 'Hardware Fingerprint', value: `\`${payload.fingerprintId}\``, inline: false },
          {
            name: 'Detection Reasons',
            value: payload.reasons.length > 0 ? payload.reasons.map((r) => `• ${r}`).join('\n') : '_Clean profile_',
            inline: false,
          },
          {
            name: 'Quick Actions',
            value: `[Open Review HUD](${baseUrl})  •  [⚡ 1-Click Ban Device](${quickBanUrl})`,
            inline: false,
          },
        ],
        footer: { text: 'AbuseShield Security Ops • Free-Tier Protection' },
        timestamp: new Date(payload.timestamp).toISOString(),
      },
    ],
  };
}

function formatSlackPayload(payload: WebhookPayload) {
  const baseUrl = getBaseUrl();
  const quickBanUrl = `${baseUrl}/api/v1/action/quick-ban?appId=${encodeURIComponent(payload.appId)}&fpId=${encodeURIComponent(payload.fingerprintId)}`;

  return {
    text: `🚨 AbuseShield Alert: ${payload.riskLevel} Risk (${payload.riskScore}/100) on ${payload.email || payload.fingerprintId}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🚨 AbuseShield: ${payload.riskLevel} Risk Registration Detected`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Risk Score:*\n${payload.riskScore}/100 (${payload.riskLevel})` },
          { type: 'mrkdwn', text: `*Email:*\n${payload.email || '_None_'}` },
          { type: 'mrkdwn', text: `*Device ID:*\n\`${payload.fingerprintId}\`` },
          { type: 'mrkdwn', text: `*Event ID:*\n\`${payload.eventId}\`` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Flagged Reasons:*\n${payload.reasons.map((r) => `• ${r}`).join('\n') || '_None_'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open Admin HUD' },
            url: baseUrl,
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '⚡ Ban Device' },
            url: quickBanUrl,
            style: 'danger',
          },
        ],
      },
    ],
  };
}

async function sendToUrl(url: string, bodyObj: any, eventId: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AbuseShield-Webhook/2.0',
        'X-AbuseShield-Delivery': eventId,
      },
      body: JSON.stringify(bodyObj),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function dispatchWebhookIfConfigured(appId: string, payload: WebhookPayload): Promise<void> {
  try {
    const [app, rules] = await Promise.all([
      db.queryOne<{ webhook_url?: string }>('SELECT webhook_url FROM apps WHERE id = $1', [appId]),
      db.queryOne<{ discord_webhook_url?: string; slack_webhook_url?: string; webhook_on_flag?: number }>(
        'SELECT discord_webhook_url, slack_webhook_url, webhook_on_flag FROM rules WHERE app_id = $1',
        [appId]
      ),
    ]);

    if (rules && rules.webhook_on_flag === 0 && payload.event !== 'test.alert') {
      return;
    }

    const tasks: Promise<any>[] = [];

    if (app?.webhook_url && app.webhook_url.startsWith('http')) {
      if (app.webhook_url.includes('discord.com/api/webhooks')) {
        tasks.push(sendToUrl(app.webhook_url, formatDiscordPayload(payload), payload.eventId));
      } else if (app.webhook_url.includes('hooks.slack.com')) {
        tasks.push(sendToUrl(app.webhook_url, formatSlackPayload(payload), payload.eventId));
      } else {
        tasks.push(sendToUrl(app.webhook_url, payload, payload.eventId));
      }
    }

    if (rules?.discord_webhook_url && rules.discord_webhook_url.startsWith('http')) {
      tasks.push(sendToUrl(rules.discord_webhook_url, formatDiscordPayload(payload), payload.eventId));
    }

    if (rules?.slack_webhook_url && rules.slack_webhook_url.startsWith('http')) {
      tasks.push(sendToUrl(rules.slack_webhook_url, formatSlackPayload(payload), payload.eventId));
    }

    await Promise.allSettled(tasks);
  } catch {
    // Non-blocking
  }
}

export async function sendTestWebhook(
  appId: string,
  targetUrl?: string,
  type?: string
): Promise<{ success: boolean; message: string }> {
  const dummyPayload: WebhookPayload = {
    event: 'test.alert',
    appId,
    eventId: `ev_test_${Date.now()}`,
    email: 'test_user+freequota@tempmail.com',
    fingerprintId: 'fp_test_3a8f9c1b7e2d4a5b6c7d8e9f0a1b2c3d',
    riskScore: 78,
    riskLevel: 'HIGH',
    reasons: [
      'High registration velocity: 4 signups in 24h on this device',
      'Disposable / temporary email domain detected (tempmail.com)',
      'Dual-pass canvas farbling / anti-fingerprint noise detected',
    ],
    timestamp: Date.now(),
  };

  if (targetUrl) {
    let body: any = dummyPayload;
    if (type === 'discord' || targetUrl.includes('discord.com/api/webhooks')) {
      body = formatDiscordPayload(dummyPayload);
    } else if (type === 'slack' || targetUrl.includes('hooks.slack.com')) {
      body = formatSlackPayload(dummyPayload);
    }
    const ok = await sendToUrl(targetUrl, body, dummyPayload.eventId);
    return {
      success: ok,
      message: ok ? 'Test webhook delivered successfully!' : 'Webhook endpoint responded with error or timed out.',
    };
  }

  await dispatchWebhookIfConfigured(appId, dummyPayload);
  return { success: true, message: 'Dispatched test payload to all configured alert channels.' };
}
