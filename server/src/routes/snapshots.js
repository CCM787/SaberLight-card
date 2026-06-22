import { Router } from 'express';
import { getItemByHashName, getSnapshots } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { hash_name, hours = '168' } = req.query;
  if (!hash_name) return res.status(400).json({ error: 'hash_name required' });

  try {
    const item = getItemByHashName(hash_name);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const sinceMs = Date.now() - Number(hours) * 60 * 60 * 1000;
    const snapshots = getSnapshots(item.id, sinceMs);

    res.json({ hash_name, snapshots });
  } catch (err) {
    console.error('[/api/snapshots]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
