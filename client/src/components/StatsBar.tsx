import type { Card } from '../types';

interface Props {
  cards: Card[];
  lastUpdated: number;
  nextRefreshAt: number;
}

function timeAgo(ms: number): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  return `${h} ч назад`;
}

export default function StatsBar({ cards, lastUpdated, nextRefreshAt }: Props) {
  const priced = cards.filter(c => c.sell_price !== null && c.sell_price > 0);
  const cheapest = priced.length ? priced.reduce((a, b) => (a.sell_price! < b.sell_price! ? a : b)) : null;
  const priciest = priced.length ? priced.reduce((a, b) => (a.sell_price! > b.sell_price! ? a : b)) : null;
  const totalListings = cards.reduce((sum, c) => sum + (c.sell_listings ?? 0), 0);
  const ownedCount = cards.filter(c => c.owned_quantity > 0).length;

  const isFresh = lastUpdated > 0 && Date.now() - lastUpdated < 35 * 60 * 1000;

  return (
    <div style={{ background: 'var(--cyber-card)', borderBottom: '1px solid var(--cyber-border)' }}
      className="px-6 py-3 flex flex-wrap gap-6 items-center text-sm">

      <div className="flex items-center gap-2">
        <span className="pulse-dot w-2 h-2 rounded-full inline-block"
          style={{ background: isFresh ? 'var(--cyber-up)' : 'var(--cyber-muted)' }} />
        <span style={{ color: 'var(--cyber-muted)' }}>Обновлено:</span>
        <span style={{ color: 'var(--cyber-neon)' }}>{timeAgo(lastUpdated)}</span>
      </div>

      <div>
        <span style={{ color: 'var(--cyber-muted)' }}>Карточек: </span>
        <span style={{ color: 'var(--cyber-text)' }}>{cards.length}</span>
      </div>

      <div>
        <span style={{ color: 'var(--cyber-muted)' }}>Всего лотов: </span>
        <span style={{ color: 'var(--cyber-text)' }}>{totalListings.toLocaleString()}</span>
      </div>

      {cheapest && (
        <div>
          <span style={{ color: 'var(--cyber-muted)' }}>Дешевле всего: </span>
          <span style={{ color: 'var(--cyber-up)' }}>{cheapest.sell_price_text}</span>
          <span style={{ color: 'var(--cyber-muted)' }}> {cheapest.name}</span>
        </div>
      )}

      {priciest && (
        <div>
          <span style={{ color: 'var(--cyber-muted)' }}>Дороже всего: </span>
          <span style={{ color: 'var(--cyber-down)' }}>{priciest.sell_price_text}</span>
          <span style={{ color: 'var(--cyber-muted)' }}> {priciest.name}</span>
        </div>
      )}

      {ownedCount > 0 && (
        <div>
          <span style={{ color: 'var(--cyber-muted)' }}>У НС: </span>
          <span style={{ color: 'var(--cyber-neon)' }}>{ownedCount} видов</span>
        </div>
      )}
    </div>
  );
}
