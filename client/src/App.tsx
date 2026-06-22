import { useCallback, useEffect, useState } from 'react';
import type { Card, OwnedCard } from './types';
import { fetchCards, fetchInventory } from './api';
import StatsBar from './components/StatsBar';
import CardGrid from './components/CardGrid';
import InventoryPanel from './components/InventoryPanel';
import RefreshButton from './components/RefreshButton';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [nextRefreshAt, setNextRefreshAt] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [cardsData, invData] = await Promise.all([fetchCards(), fetchInventory()]);
      setCards(cardsData.cards);
      setLastUpdated(cardsData.last_updated);
      setNextRefreshAt(cardsData.next_refresh_at);
      setOwnedCards(invData.owned_cards);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [loadData]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cyber-bg)' }}>
      <header style={{ background: 'var(--cyber-card)', borderBottom: '1px solid var(--cyber-border)' }}
        className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl m-0" style={{ color: 'var(--cyber-accent)', letterSpacing: 2 }}>
              SABERLIGHT<span style={{ color: 'var(--cyber-neon)' }}>.MARKET</span>
            </h1>
            <div className="text-xs mt-0.5" style={{ color: 'var(--cyber-muted)' }}>
              Трекер цен карточек Steam
            </div>
          </div>
          <RefreshButton nextRefreshAt={nextRefreshAt} onRefreshed={loadData} />
        </div>
      </header>

      {!loading && cards.length > 0 && (
        <StatsBar cards={cards} lastUpdated={lastUpdated} nextRefreshAt={nextRefreshAt} />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-24">
            <div style={{ color: 'var(--cyber-accent)', fontSize: 48, marginBottom: 16 }}>⟳</div>
            <div style={{ color: 'var(--cyber-neon)', fontFamily: 'Orbitron', fontSize: 14 }}>
              ИНИЦИАЛИЗАЦИЯ...
            </div>
            <div className="mt-3 text-sm" style={{ color: 'var(--cyber-muted)' }}>
              Собираем первый снимок данных со Steam Market
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-24">
            <div style={{ color: 'var(--cyber-muted)', fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: 'var(--cyber-neon)', fontFamily: 'Orbitron', fontSize: 14 }}>
              НЕТ ДАННЫХ
            </div>
            <div className="mt-3 text-sm" style={{ color: 'var(--cyber-muted)' }}>
              Сервер ещё не получил данные от Steam. Подождите 30–60 секунд.
            </div>
          </div>
        ) : (
          <>
            <InventoryPanel ownedCards={ownedCards} cards={cards} />
            <CardGrid cards={cards} />
          </>
        )}
      </main>
    </div>
  );
}
