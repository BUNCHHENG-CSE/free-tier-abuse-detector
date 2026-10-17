import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { evaluateRisk } from '../services/riskEngine';

export const simulateRouter = Router();

const APP_ID = 'app_demo_default';

/**
 * Trigger an interactive abuse scenario
 */
simulateRouter.post('/simulate/scenario', async (req: Request, res: Response) => {
  try {
    const { scenario = 'vpn_multi_accounting' } = req.body;
    const now = Date.now();

    if (scenario === 'legitimate') {
      const email = `alex.developer${Math.floor(Math.random() * 900 + 100)}@gmail.com`;
      const fpId = `fp_legit_${Math.random().toString(36).slice(2, 10)}`;
      const ip = `73.189.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

      const result = await evaluateRisk({
        appId: APP_ID,
        email,
        action: 'signup',
        clientFingerprintId: fpId,
        clientToken: `tok_${Math.random().toString(36).slice(2, 12)}`,
        ipAddress: ip,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        signals: {
          canvas: { supported: true, hash: 'c9f8a12e' },
          webgl: { supported: true, unmaskedRenderer: 'Apple M2 Pro', unmaskedVendor: 'Apple' },
          screen: { width: 1728, height: 1117, colorDepth: 30, devicePixelRatio: 2 },
          bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
        },
      });

      return res.json({ scenario, result, email, fingerprintId: fpId });
    }

    if (scenario === 'vpn_multi_accounting') {
      const sharedFpId = `fp_vpn_syndicate_88a`;
      const vpnIps = ['185.220.101.5', '194.26.29.112', '45.154.255.89'];
      const results = [];

      for (let i = 0; i < 3; i++) {
        const email = `crypto_trader_${i + 1}_${Math.floor(Math.random() * 90 + 10)}@proton.me`;
        const resObj = await evaluateRisk({
          appId: APP_ID,
          email,
          action: 'signup',
          clientFingerprintId: sharedFpId,
          clientToken: `tok_vpn_${sharedFpId}`,
          ipAddress: vpnIps[i % vpnIps.length],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          signals: {
            canvas: { supported: true, hash: 'canvas_hash_syndicate_88a' },
            webgl: { supported: true, unmaskedRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)', unmaskedVendor: 'Google Inc. (NVIDIA)' },
            screen: { width: 2560, height: 1440, colorDepth: 24, devicePixelRatio: 1 },
            bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
          },
        });
        results.push({ email, ip: vpnIps[i], result: resObj });
      }

      return res.json({ scenario, sharedFingerprintId: sharedFpId, executions: results });
    }

    if (scenario === 'disposable_batch') {
      const sharedFp = `fp_disposable_bot_${Math.random().toString(36).slice(2, 6)}`;
      const disposableDomains = ['mailinator.com', '10minutemail.com', 'temp-mail.org'];
      const results = [];

      for (let i = 0; i < 2; i++) {
        const email = `freecredits_${Math.floor(Math.random() * 9000 + 1000)}@${disposableDomains[i]}`;
        const resObj = await evaluateRisk({
          appId: APP_ID,
          email,
          action: 'signup',
          clientFingerprintId: sharedFp,
          clientToken: `tok_${Math.random().toString(36).slice(2, 8)}`,
          ipAddress: '104.244.42.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          signals: {
            canvas: { supported: true, hash: 'c8172b' },
            webgl: { supported: true, unmaskedRenderer: 'Intel UHD Graphics 630', unmaskedVendor: 'Intel Inc.' },
            bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
          },
        });
        results.push({ email, result: resObj });
      }

      return res.json({ scenario, executions: results });
    }

    if (scenario === 'headless_bot') {
      const email = `scraper_bot_${Date.now()}@gmail.com`;
      const fpId = `fp_headless_${Math.random().toString(36).slice(2, 8)}`;

      const resObj = await evaluateRisk({
        appId: APP_ID,
        email,
        action: 'signup',
        clientFingerprintId: fpId,
        clientToken: `tok_bot_${fpId}`,
        ipAddress: '198.51.100.42',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/122.0.0.0 Safari/537.36',
        signals: {
          canvas: { supported: true, hash: 'fake_canvas_hash' },
          webgl: { supported: false },
          screen: { width: 800, height: 600, colorDepth: 24, devicePixelRatio: 1 },
          bot: { isWebdriver: true, isHeadless: true, hasAutomationFlags: true },
        },
      });

      return res.json({ scenario, result: resObj });
    }

    if (scenario === 'seed_demo_data') {
      await db.execute('DELETE FROM review_queue WHERE app_id = $1', [APP_ID]);
      await db.execute('DELETE FROM accounts WHERE app_id = $1', [APP_ID]);
      await db.execute('DELETE FROM fingerprints WHERE app_id = $1', [APP_ID]);
      await db.execute('DELETE FROM events WHERE app_id = $1', [APP_ID]);

      // 1. Seed Clean Legitimate Users
      const legitUsers = [
        { email: 'marcus.vance@techcorp.io', os: 'Mac', gpu: 'Apple M3 Pro', ip: '98.210.45.12' },
        { email: 'elena.rostova@designlab.co', os: 'Windows', gpu: 'NVIDIA RTX 4070', ip: '24.180.12.98' },
        { email: 'dave.miller@indieproduct.dev', os: 'Linux', gpu: 'AMD Radeon RX 6700 XT', ip: '67.165.234.11' },
        { email: 'priya.sharma@saasmetrics.app', os: 'Mac', gpu: 'Apple M1 Max', ip: '76.102.89.54' },
        { email: 'julian.bernard@paris-agency.fr', os: 'Windows', gpu: 'Intel Iris Xe Graphics', ip: '82.64.120.33' },
      ];

      for (const u of legitUsers) {
        const fpId = `fp_legit_${u.email.split('@')[0]}`;
        await evaluateRisk({
          appId: APP_ID,
          email: u.email,
          action: 'signup',
          clientFingerprintId: fpId,
          clientToken: `tok_${fpId}`,
          ipAddress: u.ip,
          userAgent: `Mozilla/5.0 (${u.os}) AppleWebKit/537.36`,
          signals: {
            canvas: { supported: true, hash: `canvas_${fpId}` },
            webgl: { supported: true, unmaskedRenderer: u.gpu, unmaskedVendor: 'Hardware' },
            screen: { width: 1920, height: 1080, colorDepth: 24, devicePixelRatio: 1 },
            bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
          },
        });
      }

      // 2. Seed Abuse Cluster 1: Multi-Accounting Free-Tier Quota Harvester (same device, 4 accounts)
      const abuserFp1 = 'fp_quota_harvester_99x';
      const quotaAccounts = [
        'sammy.hacks+free1@gmail.com',
        'sammy.hacks+free2@gmail.com',
        'temp_worker_44@mailinator.com',
        'bot_api_token_fetcher@yopmail.com',
      ];
      for (const email of quotaAccounts) {
        await evaluateRisk({
          appId: APP_ID,
          email,
          action: 'signup',
          clientFingerprintId: abuserFp1,
          clientToken: `tok_${abuserFp1}`,
          ipAddress: '142.250.180.14',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
          signals: {
            canvas: { supported: true, hash: 'canvas_hash_cluster_1' },
            webgl: { supported: true, unmaskedRenderer: 'ANGLE (Intel, Intel UHD Graphics 620)', unmaskedVendor: 'Intel' },
            screen: { width: 1366, height: 768, colorDepth: 24, devicePixelRatio: 1 },
            bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
          },
        });
      }

      // 3. Seed Abuse Cluster 2: VPN IP Hopping Syndicate (same fingerprint, rotated across 3 VPN IPs)
      const abuserFp2 = 'fp_vpn_rotator_2024';
      const vpnAccounts = [
        { email: 'crypto_lead_gen@proton.me', ip: '185.220.101.5' },
        { email: 'growth_scraper_01@proton.me', ip: '194.26.29.112' },
        { email: 'fast_quota_farm@proton.me', ip: '45.154.255.89' },
      ];
      for (const item of vpnAccounts) {
        await evaluateRisk({
          appId: APP_ID,
          email: item.email,
          action: 'signup',
          clientFingerprintId: abuserFp2,
          clientToken: `tok_${abuserFp2}`,
          ipAddress: item.ip,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/123.0',
          signals: {
            canvas: { supported: true, hash: 'canvas_hash_vpn_rotator' },
            webgl: { supported: true, unmaskedRenderer: 'NVIDIA GeForce GTX 1660 SUPER', unmaskedVendor: 'NVIDIA' },
            screen: { width: 1920, height: 1080, colorDepth: 24, devicePixelRatio: 1 },
            bot: { isWebdriver: false, isHeadless: false, hasAutomationFlags: false },
          },
        });
      }

      // 4. Seed Abuse Cluster 3: Automated Scripted Bot (Headless Chrome + WebDriver)
      const botFp = 'fp_headless_puppeteer_v1';
      for (let i = 1; i <= 3; i++) {
        await evaluateRisk({
          appId: APP_ID,
          email: `script_crawler_${i}@guerrillamail.com`,
          action: 'signup',
          clientFingerprintId: botFp,
          clientToken: `tok_headless_${botFp}`,
          ipAddress: '104.244.42.1',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/122.0.0.0 Safari/537.36',
          signals: {
            canvas: { supported: false, hash: 'blocked_or_error' },
            webgl: { supported: false },
            screen: { width: 800, height: 600, colorDepth: 24, devicePixelRatio: 1 },
            bot: { isWebdriver: true, isHeadless: true, hasAutomationFlags: true },
          },
        });
      }

      return res.json({ success: true, message: 'Seeded demo dataset with 15 events, 3 abuse clusters, and legitimate users.' });
    }

    res.status(400).json({ error: 'Unknown scenario' });
  } catch (err: any) {
    console.error('[Simulate Route Error]', err);
    res.status(500).json({ error: err?.message || String(err), stack: err?.stack });
  }
});
