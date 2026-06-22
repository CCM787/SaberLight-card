import { useEffect, useState } from 'react';
import { triggerRefresh } from '../api';

interface Props {
  nextRefreshAt: number;
  onRefreshed: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RefreshButton({ nextRefreshAt, onRefreshed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setRemaining(nextRefreshAt - Date.now());
    const id = setInterval(() => {
      setRemaining(nextRefreshAt - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [nextRefreshAt]);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      await triggerRefresh();
      onRefreshed();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button onClick={handleRefresh} disabled={loading}
        className="px-4 py-1.5 rounded text-sm transition-all"
        style={{
          background: loading ? 'var(--cyber-border)' : 'rgba(123,47,255,0.2)',
          border: '1px solid var(--cyber-accent)',
          color: 'var(--cyber-accent)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Share Tech Mono',
          opacity: loading ? 0.6 : 1,
        }}>
        {loading ? '⟳ Обновляем...' : '⟳ Обновить'}
      </button>

      {remaining > 0 && (
        <div className="text-xs" style={{ color: 'var(--cyber-muted)' }}>
          Авто через {formatCountdown(remaining)}
        </div>
      )}

      {error && (
        <div className="text-xs" style={{ color: 'var(--cyber-down)' }}>{error}</div>
      )}
    </div>
  );
}
