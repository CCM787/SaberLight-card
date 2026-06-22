import { Router } from 'express';
import { pollMarket } from '../poller.js';

const router = Router();
let lastManualRefresh = 0;
const COOLDOWN_MS = 60 * 1000;

router.post('/', async (req, res) => {
  const now = Date.now();
  if (now - lastManualRefresh < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - lastManualRefresh)) / 1000);
    return res.status(429).json({ error: `Rate limited. Wait ${waitSec}s.` });
  }
  lastManualRefresh = now;

  try {
    await pollMarket();
    res.json({ success: true, updated_at: Date.now() });
  } catch (err) {
    console.error('[/api/refresh]', err);
    res.status(500).json({ error: 'Poll failed' });
  }
});

export default router;
