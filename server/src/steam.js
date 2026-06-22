const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

const ICON_BASE = 'https://community.cloudflare.steamstatic.com/economy/image/';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function fetchMarketCards() {
  const url = 'https://steamcommunity.com/market/search/render/?query=SabeRLighT&count=100&norender=1&search_descriptions=0';
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.warn(`[steam] market search returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data.results?.length) {
      console.warn('[steam] market search returned 0 results');
      return [];
    }
    return data.results.map(r => ({
      hash_name: r.hash_name,
      name: r.name,
      appid: r.asset_description?.appid ?? 0,
      icon_url: r.asset_description?.icon_url ? ICON_BASE + r.asset_description.icon_url : '',
      sell_price: r.sell_price ?? 0,
      sell_price_text: r.sell_price_text ?? '',
      sell_listings: r.sell_listings ?? 0,
    }));
  } catch (err) {
    console.error('[steam] fetchMarketCards error:', err.message);
    return [];
  }
}

let _steam64Cache = null;

export async function fetchSteam64Id(vanityUrl = 'just_ns') {
  if (_steam64Cache) return _steam64Cache;
  try {
    const res = await fetch(`https://steamcommunity.com/id/${vanityUrl}/?xml=1`, { headers: HEADERS });
    if (!res.ok) {
      console.warn(`[steam] profile XML returned ${res.status}`);
      return null;
    }
    const text = await res.text();
    const match = text.match(/<steamID64>(\d+)<\/steamID64>/);
    if (!match) {
      console.warn('[steam] steamID64 not found in XML');
      return null;
    }
    _steam64Cache = match[1];
    console.log(`[steam] Resolved just_ns → ${_steam64Cache}`);
    return _steam64Cache;
  } catch (err) {
    console.error('[steam] fetchSteam64Id error:', err.message);
    return null;
  }
}

export async function fetchInventory(steam64id, appid, contextid, knownHashNames) {
  const PAGE_SIZE = 2000;
  const allCounts = new Map();
  let startAssetId = null;
  let page = 0;

  while (true) {
    page++;
    let url = `https://steamcommunity.com/inventory/${steam64id}/${appid}/${contextid}?l=english&count=${PAGE_SIZE}`;
    if (startAssetId) url += `&start_assetid=${startAssetId}`;

    try {
      await sleep(1000);
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 403) {
        console.warn(`[steam] inventory ${appid}/${contextid} is private`);
        break;
      }
      if (!res.ok) {
        console.warn(`[steam] inventory ${appid}/${contextid} page ${page} returned ${res.status}`);
        break;
      }
      const data = await res.json();
      if (!data.assets || !data.descriptions) break;

      const descMap = new Map();
      for (const d of data.descriptions) {
        descMap.set(`${d.classid}_${d.instanceid}`, d.market_hash_name);
      }

      for (const asset of data.assets) {
        const key = `${asset.classid}_${asset.instanceid}`;
        const hashName = descMap.get(key);
        if (!hashName) continue;
        // Only track items we know about from the market
        if (knownHashNames && !knownHashNames.has(hashName)) continue;
        allCounts.set(hashName, (allCounts.get(hashName) ?? 0) + Number(asset.amount));
      }

      console.log(`[steam] inventory ${appid}/${contextid} page ${page}: ${data.assets.length} assets`);

      if (!data.more_items) break;
      startAssetId = data.last_assetid;
    } catch (err) {
      console.error(`[steam] fetchInventory ${appid}/${contextid} page ${page} error:`, err.message);
      break;
    }
  }

  return Array.from(allCounts.entries()).map(([hash_name, quantity]) => ({ hash_name, quantity }));
}

export async function fetchPriceHistory(hashName, appid) {
  const cookie = process.env.STEAM_COOKIE;
  if (!cookie) return [];

  const url = `https://steamcommunity.com/market/pricehistory/?country=US&currency=1&appid=${appid}&market_hash_name=${encodeURIComponent(hashName)}`;
  try {
    await sleep(1500);
    const res = await fetch(url, {
      headers: { ...HEADERS, Cookie: cookie },
    });
    if (!res.ok) {
      console.warn(`[steam] pricehistory ${hashName} returned ${res.status} (check STEAM_COOKIE)`);
      return [];
    }
    const data = await res.json();
    if (!data.success || !Array.isArray(data.prices)) return [];

    const rows = [];
    for (const [dateStr, price] of data.prices) {
      const captured_at = parseSteamDate(dateStr);
      if (!captured_at) continue;
      const sell_price = Math.round(parseFloat(price) * 100);
      rows.push({ captured_at, sell_price, sell_listings: 0 });
    }
    return rows;
  } catch (err) {
    console.error(`[steam] fetchPriceHistory ${hashName} error:`, err.message);
    return [];
  }
}

function parseSteamDate(str) {
  // Format: "Jun 01 2024 01: +0" → parse to unix ms
  try {
    const cleaned = str.replace(/:\s*\+0$/, ':00 GMT+0000').trim();
    const ts = new Date(cleaned).getTime();
    return isNaN(ts) ? null : ts;
  } catch {
    return null;
  }
}

export { sleep };
