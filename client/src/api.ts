import type { CardsResponse, SnapshotsResponse, InventoryResponse } from './types';

const BASE = '/api';

export async function fetchCards(): Promise<CardsResponse> {
  const res = await fetch(`${BASE}/cards`);
  if (!res.ok) throw new Error(`/api/cards: ${res.status}`);
  return res.json();
}

export async function fetchSnapshots(hashName: string, hours = 168): Promise<SnapshotsResponse> {
  const params = new URLSearchParams({ hash_name: hashName, hours: String(hours) });
  const res = await fetch(`${BASE}/snapshots?${params}`);
  if (!res.ok) throw new Error(`/api/snapshots: ${res.status}`);
  return res.json();
}

export async function fetchInventory(): Promise<InventoryResponse> {
  const res = await fetch(`${BASE}/inventory`);
  if (!res.ok) throw new Error(`/api/inventory: ${res.status}`);
  return res.json();
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${BASE}/refresh`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `refresh failed: ${res.status}`);
  }
}
