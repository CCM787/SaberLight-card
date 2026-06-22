import { useState } from 'react';
import type { Card } from '../types';
import CardTile from './CardTile';

interface Props {
  cards: Card[];
}

type SortKey = 'price_asc' | 'price_desc' | 'name' | 'owned' | 'listings';

function sortCards(cards: Card[], sort: SortKey, filter: 'all' | 'owned'): Card[] {
  let list = filter === 'owned' ? cards.filter(c => c.owned_quantity > 0) : [...cards];
  switch (sort) {
    case 'price_asc':  list.sort((a, b) => (a.sell_price ?? Infinity) - (b.sell_price ?? Infinity)); break;
    case 'price_desc': list.sort((a, b) => (b.sell_price ?? 0) - (a.sell_price ?? 0)); break;
    case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'owned':      list.sort((a, b) => b.owned_quantity - a.owned_quantity); break;
    case 'listings':   list.sort((a, b) => (b.sell_listings ?? 0) - (a.sell_listings ?? 0)); break;
  }
  return list;
}

export default function CardGrid({ cards }: Props) {
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [filter, setFilter] = useState<'all' | 'owned'>('all');

  const sorted = sortCards(cards, sort, filter);
  const ownedCount = cards.filter(c => c.owned_quantity > 0).length;

  const btnStyle = (active: boolean) => ({
    padding: '4px 12px',
    borderRadius: 4,
    border: `1px solid ${active ? 'var(--cyber-accent)' : 'var(--cyber-border)'}`,
    background: active ? 'rgba(123,47,255,0.2)' : 'transparent',
    color: active ? 'var(--cyber-accent)' : 'var(--cyber-muted)',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'Share Tech Mono',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex gap-2">
          <button style={btnStyle(filter === 'all')} onClick={() => setFilter('all')}>Все</button>
          <button style={btnStyle(filter === 'owned')} onClick={() => setFilter('owned')}>
            У НС ({ownedCount})
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {([
            ['price_asc', 'Цена ↑'],
            ['price_desc', 'Цена ↓'],
            ['name', 'Имя'],
            ['owned', 'Кол-во НС'],
            ['listings', 'Лотов'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} style={btnStyle(sort === key)} onClick={() => setSort(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--cyber-muted)' }}>
          Нет карточек
        </div>
      ) : (
        <div className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {sorted.map(card => <CardTile key={card.id} card={card} />)}
        </div>
      )}
    </div>
  );
}
