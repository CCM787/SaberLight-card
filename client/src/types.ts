export interface Card {
  id: number;
  hash_name: string;
  name: string;
  appid: number;
  icon_url: string;
  sell_price: number | null;
  sell_price_text: string | null;
  sell_listings: number | null;
  price_change_24h: number | null;
  owned_quantity: number;
  last_snapshot_at: number | null;
  last_sale_price: number | null;
  last_sale_at: number | null;
}

export interface PriceSnapshot {
  captured_at: number;
  sell_price: number;
  sell_listings: number;
}

export interface CardsResponse {
  cards: Card[];
  last_updated: number;
  next_refresh_at: number;
}

export interface SnapshotsResponse {
  hash_name: string;
  snapshots: PriceSnapshot[];
}

export interface OwnedCard {
  hash_name: string;
  name: string;
  icon_url: string;
  quantity: number;
}

export interface InventoryResponse {
  profile_url: string;
  owned_cards: OwnedCard[];
  total_unique: number;
}
