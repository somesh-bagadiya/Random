export const COMPONENT_CATEGORIES = [
  'CPU',
  'GPU',
  'Motherboard',
  'RAM',
  'SSD',
  'PSU',
  'Case',
  'CPU cooler'
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];
export type DealRating = 'Great deal' | 'Good deal' | 'Wait' | 'Avoid' | 'Fake sale' | 'Normal price';

export interface Product {
  id: string;
  asin: string;
  title: string | null;
  brand: string | null;
  category: ComponentCategory;
  amazon_url: string;
  image_url: string | null;
  notes: string | null;
  upgrade_priority: number;
  created_at: string;
  updated_at: string;
  raw_keepa?: unknown;
}

export interface PriceSnapshot {
  id: string;
  product_id: string;
  source: 'keepa' | 'mock';
  price: number;
  condition: 'new' | 'used' | 'warehouse';
  merchant_type: 'amazon' | 'third_party' | 'used';
  is_lightning_deal: boolean;
  captured_at: string;
}

export interface PriceMetrics {
  id: string;
  product_id: string;
  current_price: number;
  low_30d: number;
  low_90d: number;
  low_365d: number;
  all_time_low: number;
  average_90d: number;
  sale_frequency_score: number;
  volatility_score: number;
  buy_trigger_price: number;
  deal_rating: DealRating;
  updated_at: string;
}

export interface ComponentRule {
  id: string;
  category: ComponentCategory;
  ideal_specs: Record<string, unknown>;
  avoid_rules: Record<string, unknown>;
  upgrade_notes: string;
}

export interface ProductWithMetrics extends Product {
  metrics?: PriceMetrics;
  snapshots: PriceSnapshot[];
}

export interface KeepaProductResult {
  asin: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  priceHistory: Array<{ date: string; price: number }>;
  currentPrice: number;
  raw: unknown;
}

export interface AddProductInput {
  input: string;
  category: ComponentCategory;
  upgradePriority: number;
  notes?: string;
}
