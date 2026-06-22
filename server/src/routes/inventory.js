import { Router } from 'express';
import { getLatestInventory, getAllItems } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const inventoryMap = getLatestInventory();
    const items = getAllItems();

    const itemsByHash = new Map(items.map(i => [i.hash_name, i]));

    const ownedCards = [];
    for (const [hash_name, quantity] of inventoryMap.entries()) {
      const item = itemsByHash.get(hash_name);
      if (item) {
        ownedCards.push({
          hash_name,
          name: item.name,
          icon_url: item.icon_url,
          quantity,
        });
      }
    }

    ownedCards.sort((a, b) => b.quantity - a.quantity);

    res.json({
      profile_url: 'https://steamcommunity.com/id/just_ns/',
      owned_cards: ownedCards,
      total_unique: ownedCards.length,
    });
  } catch (err) {
    console.error('[/api/inventory]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
