import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, LineChart, Legend
} from 'recharts';
import { fetchSnapshots } from '../api';
import type { PriceSnapshot } from '../types';

interface Props {
  hashName: string;
}

const RANGES = [
  { label: '24ч', hours: 24 },
  { label: '7д', hours: 168 },
  { label: '30д', hours: 720 },
  { label: 'Всё', hours: 99999 },
];

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(cents: number) {
  return '$' + (cents / 100).toFixed(2);
}

export default function PriceChart({ hashName }: Props) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [hours, setHours] = useState(168);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSnapshots(hashName, hours)
      .then(r => setSnapshots(r.snapshots))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hashName, hours]);

  const data = snapshots.map(s => ({
    time: s.captured_at,
    price: s.sell_price,
    listings: s.sell_listings,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48"
        style={{ color: 'var(--cyber-muted)' }}>
        Загрузка графика...
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-center"
        style={{ color: 'var(--cyber-muted)' }}>
        <div>
          <div style={{ fontSize: 32 }}>📊</div>
          <div>Собираем данные...</div>
          <div className="text-xs mt-1">График появится после нескольких опросов</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {RANGES.map(r => (
          <button key={r.hours} onClick={() => setHours(r.hours)}
            className="px-3 py-1 rounded text-xs transition-colors"
            style={{
              background: hours === r.hours ? 'var(--cyber-accent)' : 'var(--cyber-border)',
              color: hours === r.hours ? '#fff' : 'var(--cyber-muted)',
              border: 'none',
              cursor: 'pointer',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7b2fff" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#7b2fff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
          <XAxis dataKey="time" tickFormatter={formatDate}
            tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
          <YAxis tickFormatter={v => '$' + (v / 100).toFixed(2)}
            tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={55} />
          <Tooltip
            contentStyle={{ background: '#0f0f1e', border: '1px solid #1e1e3f', borderRadius: 4 }}
            labelStyle={{ color: '#64748b', fontSize: 11 }}
            labelFormatter={v => formatDate(Number(v))}
            formatter={(value: number, name: string) =>
              name === 'price' ? [formatPrice(value), 'Цена'] : [value, 'Лотов']
            }
          />
          <Area type="monotone" dataKey="price" stroke="#7b2fff" strokeWidth={2}
            fill="url(#priceGradient)" dot={false} activeDot={{ r: 4, fill: '#00f5ff' }} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3">
        <div className="text-xs mb-1" style={{ color: 'var(--cyber-muted)' }}>Лотов на площадке</div>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
            <XAxis dataKey="time" hide />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: '#0f0f1e', border: '1px solid #1e1e3f', borderRadius: 4 }}
              labelFormatter={v => formatDate(Number(v))}
              formatter={(v: number) => [v, 'Лотов']}
            />
            <Line type="monotone" dataKey="listings" stroke="#ff6b35" strokeWidth={1.5}
              dot={false} activeDot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
