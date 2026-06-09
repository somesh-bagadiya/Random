import { differenceInCalendarDays } from 'date-fns';
import type { ComponentCategory, DealRating, PriceMetrics, PriceSnapshot, Product } from './types';

const CATEGORY_TRIGGER_MULTIPLIER: Record<ComponentCategory, number> = {
  GPU: 1.07,
  RAM: 1.04,
  SSD: 1.01,
  PSU: 1.06,
  Motherboard: 1.05,
  CPU: 1.04,
  Case: 1.03,
  'CPU cooler': 1.03
};

const CATEGORY_NOTES: Record<ComponentCategory, string> = {
  GPU: 'Prioritize VRAM, memory bus, and real generation uplift. Buy aggressively when near historic lows.',
  RAM: 'Prefer 64GB DDR5-6000 CL30 kits for AM5 AI workstation multitasking.',
  SSD: 'Buy only at or very near historical lows unless capacity is urgently needed.',
  PSU: 'Favor reputable ATX 3.x units and electrical quality over the absolute cheapest price.',
  Motherboard: 'Favor AM5 boards with good VRM, Wi-Fi, BIOS flashback, and enough M.2 slots.',
  CPU: 'Buy when pricing is near recurring sale lows and platform longevity is strong.',
  Case: 'Wait for airflow/value cases; aesthetics alone should not trigger a buy.',
  'CPU cooler': 'Air coolers are frequent sale items; buy only when value is excellent.'
};

export function extractAsin(input: string): string {
  const trimmed = input.trim();
  const direct = trimmed.match(/^[A-Z0-9]{10}$/i);
  if (direct) return direct[0].toUpperCase();

  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /(?:asin=|ASIN=)([A-Z0-9]{10})/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }

  throw new Error('Invalid ASIN or Amazon product URL. Enter a 10-character ASIN or a URL containing /dp/ASIN.');
}

export function normalizeKeepaPrice(rawPrice: number): number {
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return 0;
  return Number((rawPrice / 100).toFixed(2));
}

type HistoryPoint = { date: string; price: number };

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[index];
}

function pricesSince(history: HistoryPoint[], days: number) {
  const now = new Date();
  return history.filter((point) => differenceInCalendarDays(now, new Date(point.date)) <= days).map((point) => point.price);
}

export function calculatePriceMetrics(
  priceHistory: HistoryPoint[],
  category: ComponentCategory,
  productId = 'pending'
): Omit<PriceMetrics, 'id'> {
  const validPrices = priceHistory.map((point) => point.price).filter((price) => price > 0);
  if (validPrices.length === 0) throw new Error('No usable price history was returned for this product.');

  const current_price = validPrices[validPrices.length - 1];
  const last30 = pricesSince(priceHistory, 30);
  const last90 = pricesSince(priceHistory, 90);
  const last365 = pricesSince(priceHistory, 365);
  const average_90d = Number((last90.reduce((sum, price) => sum + price, 0) / Math.max(last90.length, 1)).toFixed(2));
  const all_time_low = Math.min(...validPrices);
  const low_90d = Math.min(...(last90.length ? last90 : validPrices));
  const nearDealCount = last90.filter((price) => price <= low_90d * 1.05).length;
  const sale_frequency_score = Number((nearDealCount / Math.max(last90.length, 1)).toFixed(2));
  const volatility_score = Number(((Math.max(...last90) - low_90d) / Math.max(average_90d, 1)).toFixed(2));
  const buy_trigger_price = Number((all_time_low * CATEGORY_TRIGGER_MULTIPLIER[category]).toFixed(2));
  const base = {
    product_id: productId,
    current_price,
    low_30d: Math.min(...(last30.length ? last30 : validPrices)),
    low_90d,
    low_365d: Math.min(...(last365.length ? last365 : validPrices)),
    all_time_low,
    average_90d,
    sale_frequency_score,
    volatility_score,
    buy_trigger_price,
    deal_rating: 'Wait' as DealRating,
    updated_at: new Date().toISOString()
  };
  return { ...base, deal_rating: calculateDealRating(base, category) };
}

export function calculateDealRating(
  metrics: Pick<PriceMetrics, 'current_price' | 'all_time_low' | 'low_90d' | 'average_90d'>,
  category: ComponentCategory,
  listingClaimsDiscount = false
): DealRating {
  if (metrics.current_price <= metrics.all_time_low * 1.05) return 'Great deal';
  if (metrics.current_price <= metrics.low_90d * 1.05) return 'Good deal';
  if (listingClaimsDiscount && metrics.current_price > metrics.average_90d) return 'Fake sale';
  if (metrics.current_price >= metrics.average_90d * (category === 'GPU' ? 1.2 : 1.15)) return 'Avoid';
  if (metrics.current_price <= percentile([metrics.average_90d, metrics.low_90d, metrics.all_time_low], 0.66) * 1.05) return 'Normal price';
  return 'Wait';
}

export function getBuyRecommendation(product: Product, metrics?: PriceMetrics): string {
  if (!metrics) return 'Add price history before deciding.';
  const note = CATEGORY_NOTES[product.category];
  if (metrics.deal_rating === 'Great deal') return `Buy now if it fits the build. ${note}`;
  if (metrics.deal_rating === 'Good deal') return `Strong candidate for Prime Day if budget allows. ${note}`;
  if (metrics.current_price <= metrics.buy_trigger_price * 1.05) return `Watch closely: it is within striking distance of the buy trigger. ${note}`;
  if (metrics.deal_rating === 'Fake sale') return `Skip the advertised discount; price is above the 90-day average. ${note}`;
  if (metrics.deal_rating === 'Avoid') return `Avoid for now unless there is a compatibility emergency. ${note}`;
  return `Wait for ${product.category} pricing to approach ${metrics.buy_trigger_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}. ${note}`;
}

export function snapshotsFromHistory(productId: string, history: HistoryPoint[], source: 'keepa' | 'mock'): PriceSnapshot[] {
  return history.map((point, index) => ({
    id: `${productId}-${index}`,
    product_id: productId,
    source,
    price: point.price,
    condition: 'new',
    merchant_type: 'amazon',
    is_lightning_deal: false,
    captured_at: point.date
  }));
}
