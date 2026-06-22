import { Router } from 'express';
import { getAllItems, getLatestSnapshot, getSnapshotBefore, getLatestInventory, getLastPollTime, getLastSaleSnapshot } from '../db.js';

const router = Router();
const POLL_INTERVAL_MS = 30 * 60 * 1000;

router.get('/', (req, res) => {
  try {
    const items = getAllItems();
    const inventoryMap = getLatestInventory();
    const now = Date.now();
    const ago24h = now - 24 * 60 * 60 * 1000;

    const cards = items.map(item => {
      const latest = getLatestSnapshot(item.id);
      const snap24h = getSnapshotBefore(item.id, ago24h);
      const lastSale = getLastSaleSnapshot(item.id);
      const priceChange24h = (latest && snap24h)
        ? latest.sell_price - snap24h.sell_price
        : null;

      return {
        id: item.id,
        hash_name: item.hash_name,
        name: item.name,
        appid: item.appid,
        icon_url: item.icon_url,
        sell_price: latest?.sell_price ?? null,
        sell_price_text: latest ? formatPrice(latest.sell_price) : null,
        sell_listings: latest?.sell_listings ?? null,
        price_change_24h: priceChange24h,
        owned_quantity: inventoryMap.get(item.hash_name) ?? 0,
        last_snapshot_at: latest?.captured_at ?? null,
        last_sale_price: lastSale?.sell_price ?? null,
        last_sale_at: lastSale?.captured_at ?? null,
      };
    });

    const lastUpdated = getLastPollTime();
    res.json({
      cards,
      last_updated: lastUpdated,
      next_refresh_at: lastUpdated + POLL_INTERVAL_MS,
    });
  } catch (err) {
    console.error('[/api/cards]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

export default router;
