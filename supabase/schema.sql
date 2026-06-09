create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  asin text unique not null,
  title text,
  brand text,
  category text,
  amazon_url text,
  image_url text,
  notes text,
  upgrade_priority integer,
  raw_keepa jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  source text,
  price numeric,
  condition text,
  merchant_type text,
  is_lightning_deal boolean default false,
  captured_at timestamp with time zone default now()
);

create table if not exists price_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  current_price numeric,
  low_30d numeric,
  low_90d numeric,
  low_365d numeric,
  all_time_low numeric,
  average_90d numeric,
  sale_frequency_score numeric,
  volatility_score numeric,
  buy_trigger_price numeric,
  deal_rating text,
  updated_at timestamp with time zone default now()
);

create table if not exists component_rules (
  id uuid primary key default gen_random_uuid(),
  category text,
  ideal_specs jsonb,
  avoid_rules jsonb,
  upgrade_notes text
);

create index if not exists price_snapshots_product_captured_idx on price_snapshots(product_id, captured_at);
create index if not exists price_metrics_product_idx on price_metrics(product_id);
