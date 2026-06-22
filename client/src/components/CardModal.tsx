import { useEffect } from 'react';
import type { Card } from '../types';
import PriceChart from './PriceChart';

interface Props {
  card: Card;
  onClose: () => void;
}

function priceChangeLabel(change: number | null): JSX.Element | null {
  if (change === null) return null;
  const cents = change;
  const sign = cents >= 0 ? '+' : '';
  const arrow = cents >= 0 ? '↑' : '↓';
  const color = cents >= 0 ? 'var(--cyber-up)' : 'var(--cyber-down)';
  return (
    <span style={{ color, fontSize: 14 }}>
      {arrow} {sign}${(Math.abs(cents) / 100).toFixed(2)} за 24ч
    </span>
  );
}

export default function CardModal({ card, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-2xl rounded-lg p-6 overflow-y-auto max-h-[90vh]"
        style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)' }}>

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded flex items-center justify-center text-lg transition-colors"
          style={{ color: 'var(--cyber-muted)', background: 'var(--cyber-border)', border: 'none', cursor: 'pointer' }}>
          ✕
        </button>

        <div className="flex gap-5 mb-5">
          {card.icon_url && (
            <img src={card.icon_url} alt={card.name}
              className="rounded" style={{ width: 96, height: 96, objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div>
            <h2 className="text-lg mb-2" style={{ color: 'var(--cyber-text)', fontFamily: 'Orbitron, monospace' }}>
              {card.name}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <div style={{ color: 'var(--cyber-muted)' }}>Цена</div>
                <div style={{ color: 'var(--cyber-neon)', fontSize: 22, fontFamily: 'Share Tech Mono' }}>
                  {card.sell_price_text ?? '—'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--cyber-muted)' }}>Лотов</div>
                <div style={{ color: 'var(--cyber-text)', fontSize: 18 }}>
                  {card.sell_listings?.toLocaleString() ?? '—'}
                </div>
              </div>
              {card.last_sale_price !== null && (
                <div>
                  <div style={{ color: 'var(--cyber-muted)' }}>Посл. продажа</div>
                  <div style={{
                    fontSize: 18, fontFamily: 'Share Tech Mono',
                    color: card.sell_price !== null && card.sell_price > card.last_sale_price
                      ? 'var(--cyber-down)' : 'var(--cyber-up)',
                  }}>
                    ${(card.last_sale_price / 100).toFixed(2)}
                  </div>
                  {card.last_sale_at && (
                    <div className="text-xs" style={{ color: 'var(--cyber-muted)' }}>
                      {new Date(card.last_sale_at).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              )}
              {card.owned_quantity > 0 && (
                <div>
                  <div style={{ color: 'var(--cyber-muted)' }}>У НС</div>
                  <div style={{ color: 'var(--cyber-neon)', fontSize: 18 }}>
                    {card.owned_quantity} шт
                  </div>
                </div>
              )}
            </div>
            {card.price_change_24h !== null && (
              <div className="mt-2">{priceChangeLabel(card.price_change_24h)}</div>
            )}
            <div className="mt-2">
              <a href={`https://steamcommunity.com/market/listings/${card.appid}/${encodeURIComponent(card.hash_name)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: 'var(--cyber-accent)' }}>
                Открыть на Steam Market →
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--cyber-border)', paddingTop: 16 }}>
          <div className="text-sm mb-3" style={{ color: 'var(--cyber-muted)', fontFamily: 'Orbitron' }}>
            ДИНАМИКА ЦЕНЫ
          </div>
          <PriceChart hashName={card.hash_name} />
        </div>
      </div>
    </div>
  );
}
