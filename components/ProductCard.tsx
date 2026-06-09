import Image from 'next/image';
import Link from 'next/link';
import { DealBadge } from './DealBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProductWithMetrics } from '@/lib/types';

export function ProductCard({ product }: { product: ProductWithMetrics }) {
  const metrics = product.metrics;
  return (
    <Link href={`/product/${product.id}`} className="group rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20 hover:border-violet-400/60">
      <div className="flex gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-800">
          {product.image_url ? <Image src={product.image_url} alt={product.title ?? product.asin} fill className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 font-semibold text-white group-hover:text-violet-200">{product.title}</p>
            <DealBadge rating={metrics?.deal_rating ?? 'Wait'} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{product.category} · Priority {product.upgrade_priority}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 lg:grid-cols-3">
            <Metric label="Current" value={formatCurrency(metrics?.current_price)} />
            <Metric label="30d low" value={formatCurrency(metrics?.low_30d)} />
            <Metric label="90d low" value={formatCurrency(metrics?.low_90d)} />
            <Metric label="1y low" value={formatCurrency(metrics?.low_365d)} />
            <Metric label="All-time" value={formatCurrency(metrics?.all_time_low)} />
            <Metric label="Buy trigger" value={formatCurrency(metrics?.buy_trigger_price)} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Last updated {formatDate(metrics?.updated_at ?? product.updated_at)}</p>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <span className="rounded-xl bg-white/5 p-2"><span className="block text-slate-500">{label}</span><b className="text-slate-100">{value}</b></span>;
}
