# AI PC Deal Tracker

A Vercel-compatible full-stack Next.js App Router application for tracking Amazon PC component price history, calculating Prime Day buy triggers, and ranking AI workstation upgrades.

## Features

- Add an Amazon product URL or ASIN; the app extracts the ASIN and never scrapes Amazon pages.
- Fetches product data and historical prices through the Keepa API when `KEEPA_API_KEY` is set.
- Falls back to deterministic mock product and price-history data when Keepa or Supabase credentials are missing.
- Calculates 30-day, 90-day, 365-day, and all-time lows, average 90-day price, sale frequency, volatility, buy trigger, deal rating, and a buy recommendation.
- Dashboard cards grouped by CPU, GPU, Motherboard, RAM, SSD, PSU, Case, and CPU cooler.
- Product detail chart powered by Recharts with a raw Keepa preview for debugging.
- Prime Day Watchlist sorted by deal quality, upgrade priority, and category importance.
- Same-category comparison table for CPUs, GPUs, and every other component category.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Recharts
- Keepa API
- Vercel-compatible server actions and API routes

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

```bash
KEEPA_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- `KEEPA_API_KEY`: optional. If missing, the app uses mock Keepa-style data.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: optional for local demo mode. If missing, the app uses in-memory seed products.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: included for future browser-side Supabase usage.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Optionally run `supabase/seed.sql` to seed category rules.
4. Add Supabase environment variables to `.env.local` and Vercel.

## Keepa behavior

The app calls `https://api.keepa.com/product` with `domain=1`, `history=1`, `stats=365`, and `buybox=1`. It normalizes Keepa integer cent prices into USD with `normalizeKeepaPrice`. Missing API keys, invalid ASINs, empty history, and failed API responses are surfaced as clean form or JSON errors.

## Seed data

The mock dataset includes Ryzen 7 7700, Ryzen 5 7600, Ryzen 5 7600X, Ryzen 7 9700X, Ryzen 9 7900, RTX 5060 Ti 16GB, RTX 4060 Ti 16GB, RTX 4070 Ti Super, RTX 3090, RTX 4080 Super, MSI B650 Tomahawk WiFi, Gigabyte B650 Aorus Elite AX, G.Skill Flare X5 64GB DDR5-6000 CL30, Samsung 990 Pro 2TB, WD Black SN850X 2TB, Corsair RM850e, Lian Li Lancool 216, and Thermalright Phantom Spirit 120 SE.

Run this to print mock seed metadata:

```bash
npm run seed:mock
```

## Deployment

Deploy to Vercel and configure the environment variables above. The application can deploy without Keepa and Supabase variables for a mock-data demo, then automatically switches to live Keepa/Supabase behavior when the variables are present.
