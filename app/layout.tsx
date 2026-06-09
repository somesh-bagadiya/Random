import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI PC Deal Tracker',
  description: 'Track Amazon PC component price history with Keepa and Prime Day buy recommendations.'
};

const nav = [
  ['Dashboard', '/'],
  ['Add Product', '/add'],
  ['Prime Day Watchlist', '/watchlist'],
  ['Comparison', '/comparison']
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/20 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Prime Day ready</p>
              <h1 className="mt-2 text-3xl font-bold text-white">AI PC Deal Tracker</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Track Keepa price history for AI workstation components and decide what deserves your Prime Day budget.</p>
            </div>
            <nav className="flex flex-wrap gap-2">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:border-violet-400 hover:text-white">
                  {label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
