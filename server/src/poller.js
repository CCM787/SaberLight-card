import { fetchMarketCards, fetchSteam64Id, fetchInventory, fetchPriceHistory, sleep } from './steam.js';
import {
  upsertItem, insertSnapshot, insertInventorySnapshot,
  getAllItems, getItemByHashName, hasHistoricalData, bulkInsertHistoricalSnapshots
} from './db.js';

let isPolling = false;

export async function pollMarket() {
  if (isPolling) {
    console.log('[poller] Already running, skipping');
    return;
  }
  isPolling = true;
  console.log('[poller] Starting poll cycle...');

  try {
    // 1. Fetch current market state
    const cards = await fetchMarketCards();
    console.log(`[poller] Got ${cards.length} cards from market`);

    // 2. Store items + price snapshots + seed history on first encounter
    for (const card of cards) {
      const itemId = upsertItem(card);
      insertSnapshot(itemId, card.sell_price, card.sell_listings);

      if (process.env.STEAM_COOKIE && !hasHistoricalData(itemId)) {
        console.log(`[poller] Seeding price history for ${card.name}...`);
        await sleep(1200);
        const history = await fetchPriceHistory(card.hash_name, card.appid);
        if (history.length > 0) {
          bulkInsertHistoricalSnapshots(itemId, history);
          console.log(`[poller] Seeded ${history.length} historical points for ${card.name}`);
        }
      }
    }

    // 3. Fetch NS inventory
    const steam64id = await fetchSteam64Id('just_ns');
    if (!steam64id) {
      console.warn('[poller] Could not resolve Steam64 ID, skipping inventory');
      return;
    }

    // 4. Get unique appids from stored items + build known hash names set for filtering
    const items = getAllItems();
    const appids = [...new Set(items.map(i => i.appid).filter(Boolean))];
    const knownHashNames = new Set(items.map(i => i.hash_name));
    console.log(`[poller] Fetching inventory for appids: ${appids.join(', ')}, tracking ${knownHashNames.size} items`);

    // 5. Fetch inventory for each appid (contextid=2 for Dota2/Steam items)
    const inventoryMap = new Map();
    for (const appid of appids) {
      const invItems = await fetchInventory(steam64id, appid, 2, knownHashNames);
      for (const { hash_name, quantity } of invItems) {
        inventoryMap.set(hash_name, (inventoryMap.get(hash_name) ?? 0) + quantity);
      }
    }

    // 6. Save inventory snapshots (only for cards that exist in our items table)
    const now = Date.now();
    for (const [hashName, quantity] of inventoryMap.entries()) {
      const item = getItemByHashName(hashName);
      if (item) {
        insertInventorySnapshot(item.id, quantity);
      }
    }

    console.log(`[poller] Poll complete. NS owns ${inventoryMap.size} unique card types.`);
  } catch (err) {
    console.error('[poller] Unhandled error:', err.message);
  } finally {
    isPolling = false;
  }
}
