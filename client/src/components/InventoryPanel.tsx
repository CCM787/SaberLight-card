import { useState } from 'react';
import type { Card, OwnedCard } from '../types';

interface Props {
  ownedCards: OwnedCard[];
  cards: Card[];
}

export default function InventoryPanel({ ownedCards, cards }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (ownedCards.length === 0) return null;

  const priceMap = new Map(cards.map(c => [c.hash_name, c.sell_price]));
  const totalValue = ownedCards.reduce((sum, c) => {
    const price = priceMap.get(c.hash_name) ?? 0;
    return sum + price * c.quantity;
  }, 0);
  const totalCards = ownedCards.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="rounded-lg mb-6"
      style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-neon)', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--cyber-border)' }}>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--cyber-neon)', fontFamily: 'Orbitron', fontSize: 13 }}>
            КОЛЛЕКЦИЯ НС
          </span>
          <a href="https://steamcommunity.com/id/just_ns/" target="_blank" rel="noopener noreferrer"
            className="text-xs underline" style={{ color: 'var(--cyber-muted)' }}
            onClick={e => e.stopPropagation()}>
            just_ns →
          </a>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: 'var(--cyber-muted)' }}>
            {ownedCards.length} видов, {totalCards} шт
          </span>
          <span style={{ color: 'var(--cyber-up)', fontFamily: 'Share Tech Mono' }}>
            ≈ ${(totalValue / 100).toFixed(2)}
          </span>
          <span style={{ color: 'var(--cyber-muted)' }}>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-wrap gap-3">
          {ownedCards.map(card => (
            <div key={card.hash_name} className="flex items-center gap-2 rounded px-3 py-2"
              style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)' }}>
              {card.icon_url && (
                <img src={card.icon_url} alt={card.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
              )}
              <div>
                <div className="text-xs" style={{ color: 'var(--cyber-text)' }}>{card.name}</div>
                <div className="text-xs" style={{ color: 'var(--cyber-neon)' }}>× {card.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
