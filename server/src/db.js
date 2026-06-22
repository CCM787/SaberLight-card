import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'market.db');

let _db = null;

export function getDb() {
  if (_db) return _db;
  mkdirSync(DATA_DIR, { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  initSchema(_db);
  return _db;
}

function initSchema(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      hash_name  TEXT    NOT NULL UNIQUE,
      name       TEXT    NOT NULL,
      appid      INTEGER NOT NULL,
      icon_url   TEXT    NOT NULL,
      first_seen INTEGER NOT NULL,
      last_seen  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_snapshots (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id       INTEGER NOT NULL REFERENCES items(id),
      captured_at   INTEGER NOT NULL,
      sell_price    INTEGER NOT NULL,
      sell_listings INTEGER NOT NULL,
      is_historical INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_snap
      ON price_snapshots(item_id, captured_at DESC);

    CREATE TABLE IF NOT EXISTS inventory_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id     INTEGER NOT NULL REFERENCES items(id),
      captured_at INTEGER NOT NULL,
      quantity    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inv_snap
      ON inventory_snapshots(item_id, captured_at DESC);
  `);

  // Migration: add is_historical column to existing DBs that don't have it
  try {
    db.exec(`ALTER TABLE price_snapshots ADD COLUMN is_historical INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // Column already exists — ignore
  }
}

export function upsertItem(item) {
  const db = getDb();
  const now = Date.now();
  const existing = db.prepare('SELECT id FROM items WHERE hash_name = ?').get(item.hash_name);
  if (existing) {
    db.prepare('UPDATE items SET name=?, appid=?, icon_url=?, last_seen=? WHERE id=?')
      .run(item.name, item.appid, item.icon_url, now, existing.id);
    return existing.id;
  }
  const result = db.prepare(
    'INSERT INTO items (hash_name, name, appid, icon_url, first_seen, last_seen) VALUES (?,?,?,?,?,?)'
  ).run(item.hash_name, item.name, item.appid, item.icon_url, now, now);
  return Number(result.lastInsertRowid);
}

export function insertSnapshot(itemId, sellPrice, sellListings, isHistorical = 0) {
  getDb().prepare(
    'INSERT INTO price_snapshots (item_id, captured_at, sell_price, sell_listings, is_historical) VALUES (?,?,?,?,?)'
  ).run(itemId, Date.now(), sellPrice, sellListings, isHistorical);
}

export function insertInventorySnapshot(itemId, quantity) {
  getDb().prepare(
    'INSERT INTO inventory_snapshots (item_id, captured_at, quantity) VALUES (?,?,?)'
  ).run(itemId, Date.now(), quantity);
}

export function hasHistoricalData(itemId) {
  const row = getDb().prepare(
    'SELECT COUNT(*) as cnt FROM price_snapshots WHERE item_id=? AND is_historical=1'
  ).get(itemId);
  return (row?.cnt ?? 0) > 0;
}

export function bulkInsertHistoricalSnapshots(itemId, rows) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO price_snapshots (item_id, captured_at, sell_price, sell_listings, is_historical) VALUES (?,?,?,?,1)'
  );
  // Use a unique index workaround: skip exact duplicate timestamps for same item
  db.exec('BEGIN');
  try {
    for (const row of rows) {
      stmt.run(itemId, row.captured_at, row.sell_price, row.sell_listings);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getLastSaleSnapshot(itemId) {
  return getDb().prepare(
    'SELECT captured_at, sell_price, sell_listings FROM price_snapshots WHERE item_id=? AND is_historical=1 ORDER BY captured_at DESC LIMIT 1'
  ).get(itemId);
}

export function getAllItems() {
  return getDb().prepare('SELECT * FROM items ORDER BY name').all();
}

export function getLatestSnapshot(itemId) {
  return getDb().prepare(
    'SELECT * FROM price_snapshots WHERE item_id=? ORDER BY captured_at DESC LIMIT 1'
  ).get(itemId);
}

export function getSnapshotBefore(itemId, beforeMs) {
  return getDb().prepare(
    'SELECT * FROM price_snapshots WHERE item_id=? AND captured_at <= ? ORDER BY captured_at DESC LIMIT 1'
  ).get(itemId, beforeMs);
}

export function getSnapshots(itemId, sinceMs) {
  return getDb().prepare(
    'SELECT captured_at, sell_price, sell_listings, is_historical FROM price_snapshots WHERE item_id=? AND captured_at >= ? ORDER BY captured_at ASC'
  ).all(itemId, sinceMs);
}

export function getLatestInventory() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT i.hash_name, inv.quantity
    FROM inventory_snapshots inv
    JOIN items i ON i.id = inv.item_id
    WHERE inv.id IN (
      SELECT MAX(id) FROM inventory_snapshots GROUP BY item_id
    )
  `).all();
  const map = new Map();
  for (const row of rows) map.set(row.hash_name, row.quantity);
  return map;
}

export function getItemByHashName(hashName) {
  return getDb().prepare('SELECT * FROM items WHERE hash_name=?').get(hashName);
}

export function getLastPollTime() {
  const db = getDb();
  const row = db.prepare('SELECT MAX(captured_at) as t FROM price_snapshots WHERE is_historical=0').get();
  return row?.t ?? 0;
}
