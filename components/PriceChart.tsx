'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { PriceSnapshot } from '@/lib/types';

export function PriceChart({ snapshots }: { snapshots: PriceSnapshot[] }) {
  const data = snapshots.map((snapshot) => ({ date: new Date(snapshot.captured_at).toLocaleDateString(), price: snapshot.price }));
  return (
    <div className="h-96 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 12, right: 24, top: 18, bottom: 12 }}>
          <defs>
            <linearGradient id="price" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" minTickGap={36} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value}`} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value))} />
          <Area type="monotone" dataKey="price" stroke="#a78bfa" fill="url(#price)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
