import path from 'node:path';
import fs from 'node:fs';

// Auto-load .env file if available in root or server directory
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    const candidateEnvFiles = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '../.env'),
      path.resolve(__dirname, '../../.env'),
      path.resolve(__dirname, '../../../.env'),
    ];
    for (const envFile of candidateEnvFiles) {
      if (fs.existsSync(envFile)) {
        (process as any).loadEnvFile(envFile);
        break;
      }
    }
  }
} catch {
  // Silent fallback
}

import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import { ingestRouter } from './routes/ingest';
import { queueRouter } from './routes/queue';
import { fingerprintsRouter } from './routes/fingerprints';
import { rulesRouter } from './routes/rules';
import { analyticsRouter } from './routes/analytics';
import { simulateRouter } from './routes/simulate';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AbuseShield Anti-Abuse Server',
    version: '1.0.0',
    dbEngine: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
    timestamp: Date.now(),
  });
});

// Serve SDK script directly for easy client integration
const sdkDistDir = path.resolve(__dirname, '../../sdk/dist');
if (fs.existsSync(sdkDistDir)) {
  app.use('/sdk', express.static(sdkDistDir, {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'public, max-age=3600');
    },
  }));
}

// Serve Demo SaaS Landing Page
const demoHtmlPath = [
  path.resolve(__dirname, '../../../demo-saas/index.html'),
  path.resolve(__dirname, '../../demo-saas/index.html'),
  path.resolve(process.cwd(), 'demo-saas/index.html'),
].find((p) => p && fs.existsSync(p));

if (demoHtmlPath) {
  app.get('/demo', (req, res) => {
    res.sendFile(demoHtmlPath);
  });
}

// Serve Dashboard UI
const dashboardDistDir = path.resolve(__dirname, '../../dashboard/dist');
if (fs.existsSync(dashboardDistDir)) {
  app.use(express.static(dashboardDistDir));
}

// API Routes
app.use('/api/v1', ingestRouter);
app.use('/api/v1', queueRouter);
app.use('/api/v1', fingerprintsRouter);
app.use('/api/v1', rulesRouter);
app.use('/api/v1', analyticsRouter);
app.use('/api/v1', simulateRouter);

// SPA fallback for Dashboard
if (fs.existsSync(dashboardDistDir)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/sdk')) {
      return next();
    }
    res.sendFile(path.join(dashboardDistDir, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[AbuseShield Server Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function startServer() {
  try {
    await initDatabase();

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`🛡️  AbuseShield Server running at http://localhost:${PORT}`);
        console.log(`📦 SDK script available at http://localhost:${PORT}/sdk/abuse-shield.min.js`);
        console.log(`📊 API endpoints at http://localhost:${PORT}/api/v1`);
        console.log(`🗄️  Database Engine: ${process.env.DATABASE_URL ? 'PostgreSQL (Production-Tuned)' : 'SQLite'}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start AbuseShield server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
