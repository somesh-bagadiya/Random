import { DealBadge } from '@/components/DealBadge';
import { COMPONENT_CATEGORIES } from '@/lib/types';
import { getProducts } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export default async function ComparisonPage({ searchParams }: { searchParams: { category?: string } }) {
  const products = await getProducts();
  const category = COMPONENT_CATEGORIES.includes(searchParams.category as any) ? searchParams.category : 'CPU';
  const filtered = products.filter((product) => product.category === category);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-2xl font-bold text-white">Compare components</h2><p className="mt-2 text-slate-300">Compare products in the same category using metrics derived from Keepa history.</p></div>
        <form><select name="category" defaultValue={category} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white">{COMPONENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><button className="ml-2 rounded-2xl bg-violet-500 px-4 py-3 font-semibold">Compare</button></form>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-white/5 text-slate-300"><tr><th className="p-4">Product</th><th>Current</th><th>90d avg</th><th>90d low</th><th>All-time low</th><th>Buy trigger</th><th>Volatility</th><th>Sale freq.</th><th>Rating</th><th>Priority</th></tr></thead>
          <tbody>
            {filtered.map((product) => <tr key={product.id} className="border-t border-white/10"><td className="p-4 font-semibold text-white">{product.title}</td><td>{formatCurrency(product.metrics?.current_price)}</td><td>{formatCurrency(product.metrics?.average_90d)}</td><td>{formatCurrency(product.metrics?.low_90d)}</td><td>{formatCurrency(product.metrics?.all_time_low)}</td><td>{formatCurrency(product.metrics?.buy_trigger_price)}</td><td>{product.metrics?.volatility_score ?? '—'}</td><td>{product.metrics?.sale_frequency_score ?? '—'}</td><td><DealBadge rating={product.metrics?.deal_rating} /></td><td>{product.upgrade_priority}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
