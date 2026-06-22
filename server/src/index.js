import { readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually (no dotenv dependency needed)
try {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env not found — that's fine */ }

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { pollMarket } from './poller.js';
import cardsRouter from './routes/cards.js';
import snapshotsRouter from './routes/snapshots.js';
import inventoryRouter from './routes/inventory.js';
import refreshRouter from './routes/refresh.js';

const PORT = process.env.PORT || 4000;

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/cards', cardsRouter);
app.use('/api/snapshots', snapshotsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/refresh', refreshRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  if (process.env.STEAM_COOKIE) {
    console.log('[server] STEAM_COOKIE loaded — price history will be seeded from Steam');
  } else {
    console.log('[server] No STEAM_COOKIE — charts will build from polling data over time');
    console.log('[server] To enable full history: add STEAM_COOKIE to server/.env');
  }

  // First poll immediately on startup
  pollMarket().catch(err => console.error('[startup poll]', err));

  // Then every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    pollMarket().catch(err => console.error('[cron poll]', err));
  });
});
