import Link from 'next/link';
import { DealBadge } from '@/components/DealBadge';
import { categoryImportance, getProducts } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

const quality: Record<string, number> = { 'Great deal': 5, 'Good deal': 4, 'Normal price': 2, Wait: 1, 'Fake sale': 0, Avoid: -1 };

export default async function WatchlistPage() {
  const products = (await getProducts())
    .filter((product) => {
      const metrics = product.metrics;
      if (!metrics) return false;
      return ['Great deal', 'Good deal'].includes(metrics.deal_rating) || metrics.current_price <= metrics.buy_trigger_price * 1.05;
    })
    .sort((a, b) => (quality[b.metrics?.deal_rating ?? 'Wait'] - quality[a.metrics?.deal_rating ?? 'Wait']) || (b.upgrade_priority - a.upgrade_priority) || (categoryImportance(b.category) - categoryImportance(a.category)));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Prime Day Watchlist</h2>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-white/5 text-slate-300"><tr><th className="p-4">Product</th><th>Category</th><th>Current</th><th>Buy trigger</th><th>Rating</th><th>Priority</th></tr></thead>
          <tbody>
            {products.map((product) => <tr key={product.id} className="border-t border-white/10"><td className="p-4"><Link className="font-semibold text-violet-200 hover:text-white" href={`/product/${product.id}`}>{product.title}</Link></td><td>{product.category}</td><td>{formatCurrency(product.metrics?.current_price)}</td><td>{formatCurrency(product.metrics?.buy_trigger_price)}</td><td><DealBadge rating={product.metrics?.deal_rating} /></td><td>{product.upgrade_priority}</td></tr>)}
          </tbody>
        </table>
        {!products.length ? <p className="p-6 text-slate-300">No products are within Prime Day buy range yet.</p> : null}
      </div>
    </div>
  );
}
