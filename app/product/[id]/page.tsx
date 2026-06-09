import { notFound } from 'next/navigation';
import { DealBadge } from '@/components/DealBadge';
import { PriceChart } from '@/components/PriceChart';
import { getBuyRecommendation } from '@/lib/deal-logic';
import { getProduct } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();
  const metrics = product.metrics;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">{product.category} · {product.asin}</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{product.title}</h2>
            <p className="mt-3 max-w-3xl text-slate-300">{getBuyRecommendation(product, metrics)}</p>
          </div>
          <DealBadge rating={metrics?.deal_rating ?? 'Wait'} />
        </div>
      </div>
      <PriceChart snapshots={product.snapshots} />
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Current" value={formatCurrency(metrics?.current_price)} />
        <Metric label="30d low" value={formatCurrency(metrics?.low_30d)} />
        <Metric label="90d low" value={formatCurrency(metrics?.low_90d)} />
        <Metric label="1y low" value={formatCurrency(metrics?.low_365d)} />
        <Metric label="All-time low" value={formatCurrency(metrics?.all_time_low)} />
        <Metric label="Buy trigger" value={formatCurrency(metrics?.buy_trigger_price)} />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h3 className="text-xl font-bold">Notes</h3><p className="mt-3 whitespace-pre-wrap text-slate-300">{product.notes || 'No notes yet.'}</p></section>
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h3 className="text-xl font-bold">Raw Keepa data preview</h3><pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify(product.raw_keepa ?? { source: product.snapshots[0]?.source ?? 'unknown' }, null, 2).slice(0, 5000)}</pre></section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>;
}
