import { ProductCard } from '@/components/ProductCard';
import { COMPONENT_CATEGORIES } from '@/lib/types';
import { getProducts } from '@/lib/store';

export default async function DashboardPage() {
  const products = await getProducts();
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Tracked products" value={products.length} />
        <Stat label="Great/Good deals" value={products.filter((p) => ['Great deal', 'Good deal'].includes(p.metrics?.deal_rating ?? '')).length} />
        <Stat label="GPU priority" value={products.filter((p) => p.category === 'GPU').length} />
        <Stat label="Mock fallback" value={process.env.KEEPA_API_KEY ? 'Off' : 'On'} />
      </section>
      {COMPONENT_CATEGORIES.map((category) => {
        const categoryProducts = products.filter((product) => product.category === category);
        if (!categoryProducts.length) return null;
        return (
          <section key={category}>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-2xl font-bold text-white">{category}</h2>
              <span className="text-sm text-slate-400">{categoryProducts.length} tracked</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {categoryProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-white">{value}</p></div>;
}
