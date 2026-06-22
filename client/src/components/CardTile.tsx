import { useState } from 'react';
import type { Card } from '../types';
import CardModal from './CardModal';

interface Props {
  card: Card;
}

function PriceChange({ change }: { change: number | null }) {
  if (change === null) return null;
  const arrow = change >= 0 ? '↑' : '↓';
  const color = change >= 0 ? 'var(--cyber-up)' : 'var(--cyber-down)';
  const sign = change >= 0 ? '+' : '';
  return (
    <div className="text-xs mt-0.5" style={{ color }}>
      {arrow} {sign}${(Math.abs(change) / 100).toFixed(2)}
    </div>
  );
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}м назад`;
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  return `${d}д назад`;
}

export default function CardTile({ card }: Props) {
  const [open, setOpen] = useState(false);
  const isOwned = card.owned_quantity > 0;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`rounded-lg p-3 cursor-pointer relative flex flex-col items-center text-center card-glow ${isOwned ? 'card-owned' : ''}`}
        style={{
          background: 'var(--cyber-card)',
          border: `1px solid ${isOwned ? 'var(--cyber-neon)' : 'var(--cyber-border)'}`,
        }}
      >
        {isOwned && (
          <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,245,255,0.15)', color: 'var(--cyber-neon)', border: '1px solid var(--cyber-neon)' }}>
            У НС: {card.owned_quantity}
          </div>
        )}

        {card.icon_url ? (
          <img src={card.icon_url} alt={card.name}
            className="mt-4 mb-2 rounded"
            style={{ width: 80, height: 80, objectFit: 'contain' }} />
        ) : (
          <div className="mt-4 mb-2 w-20 h-20 rounded flex items-center justify-center"
            style={{ background: 'var(--cyber-border)', color: 'var(--cyber-muted)', fontSize: 28 }}>
            🃏
          </div>
        )}

        <div className="text-xs leading-tight mb-2 line-clamp-2"
          style={{ color: 'var(--cyber-text)', minHeight: 32 }}>
          {card.name}
        </div>

        <div style={{ color: 'var(--cyber-neon)', fontFamily: 'Share Tech Mono', fontSize: 16, fontWeight: 'bold' }}>
          {card.sell_price_text ?? '—'}
        </div>

        <PriceChange change={card.price_change_24h} />

        {card.last_sale_price !== null && (
          <div className="text-xs mt-1" style={{
            color: card.sell_price !== null && card.sell_price > card.last_sale_price
              ? 'var(--cyber-down)'
              : 'var(--cyber-up)',
          }}>
            посл. ${(card.last_sale_price / 100).toFixed(2)}
            {card.last_sale_at ? ` · ${timeAgo(card.last_sale_at)}` : ''}
          </div>
        )}

        <div className="text-xs mt-1" style={{ color: 'var(--cyber-muted)' }}>
          {card.sell_listings !== null ? `${card.sell_listings} лотов` : ''}
        </div>
      </div>

      {open && <CardModal card={card} onClose={() => setOpen(false)} />}
    </>
  );
}
