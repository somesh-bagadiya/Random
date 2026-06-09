import { addProductAction } from './actions';
import { COMPONENT_CATEGORIES } from '@/lib/types';

export default function AddProductPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-white">Add Amazon product</h2>
      <p className="mt-2 text-slate-300">Paste an Amazon URL or ASIN. The server extracts the ASIN, uses Keepa when configured, and falls back to mock data without scraping Amazon.</p>
      {searchParams.error ? <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">{decodeURIComponent(searchParams.error)}</div> : null}
      <form action={addProductAction} className="mt-8 grid gap-5">
        <label className="grid gap-2"><span className="text-sm font-medium text-slate-200">Amazon URL or ASIN</span><input name="input" required placeholder="https://www.amazon.com/dp/B0BMQJWBDM" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400" /></label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2"><span className="text-sm font-medium text-slate-200">Category</span><select name="category" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white">{COMPONENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="grid gap-2"><span className="text-sm font-medium text-slate-200">Upgrade priority (1-10)</span><input name="upgradePriority" type="number" min="1" max="10" defaultValue="7" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" /></label>
        </div>
        <label className="grid gap-2"><span className="text-sm font-medium text-slate-200">Notes</span><textarea name="notes" rows={5} placeholder="Compatibility notes, target specs, bundle constraints..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400" /></label>
        <button className="rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400">Fetch price history and save</button>
      </form>
    </div>
  );
}
