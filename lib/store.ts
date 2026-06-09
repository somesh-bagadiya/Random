import { v4 as uuidv4 } from 'uuid';
import { calculatePriceMetrics, extractAsin, snapshotsFromHistory } from './deal-logic';
import { fetchKeepaProduct } from './keepa';
import { mockProducts } from './mock-data';
import { createSupabaseAdmin, hasSupabaseServerConfig } from './supabase';
import type { AddProductInput, ComponentCategory, PriceMetrics, Product, ProductWithMetrics } from './types';

let memoryProducts: ProductWithMetrics[] = [...mockProducts];

export async function getProducts(): Promise<ProductWithMetrics[]> {
  if (!hasSupabaseServerConfig()) return memoryProducts;
  const supabase = createSupabaseAdmin();
  if (!supabase) return memoryProducts;

  const { data: products, error } = await supabase.from('products').select('*').order('category').order('upgrade_priority', { ascending: false });
  if (error) throw new Error(error.message);
  if (!products?.length) return memoryProducts;

  const ids = products.map((product) => product.id);
  const [{ data: metrics }, { data: snapshots }] = await Promise.all([
    supabase.from('price_metrics').select('*').in('product_id', ids),
    supabase.from('price_snapshots').select('*').in('product_id', ids).order('captured_at')
  ]);

  return products.map((product) => ({
    ...(product as Product),
    metrics: metrics?.find((item) => item.product_id === product.id) as PriceMetrics | undefined,
    snapshots: snapshots?.filter((item) => item.product_id === product.id) ?? []
  }));
}

export async function getProduct(id: string): Promise<ProductWithMetrics | undefined> {
  const products = await getProducts();
  return products.find((product) => product.id === id || product.asin === id);
}

export async function addProduct(input: AddProductInput): Promise<ProductWithMetrics> {
  const asin = extractAsin(input.input);
  const keepa = await fetchKeepaProduct(asin);
  const now = new Date().toISOString();
  const id = uuidv4();
  const product: Product = {
    id,
    asin,
    title: keepa.title,
    brand: keepa.brand,
    category: input.category,
    amazon_url: `https://www.amazon.com/dp/${asin}`,
    image_url: keepa.imageUrl,
    notes: input.notes ?? null,
    upgrade_priority: input.upgradePriority,
    created_at: now,
    updated_at: now,
    raw_keepa: keepa.raw
  };
  const snapshots = snapshotsFromHistory(id, keepa.priceHistory, process.env.KEEPA_API_KEY ? 'keepa' : 'mock');
  const metrics = { ...calculatePriceMetrics(keepa.priceHistory, input.category, id), id: uuidv4() };
  const productWithMetrics = { ...product, metrics, snapshots };

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    memoryProducts = [productWithMetrics, ...memoryProducts.filter((item) => item.asin !== asin)];
    return productWithMetrics;
  }

  const { error: productError } = await supabase.from('products').upsert(product, { onConflict: 'asin' });
  if (productError) throw new Error(productError.message);

  const { data: savedProduct, error: lookupError } = await supabase.from('products').select('*').eq('asin', asin).single();
  if (lookupError) throw new Error(lookupError.message);
  const savedId = savedProduct.id as string;
  const savedSnapshots = snapshots.map((snapshot) => ({ ...snapshot, id: uuidv4(), product_id: savedId }));
  const savedMetrics = { ...metrics, id: uuidv4(), product_id: savedId };
  await supabase.from('price_snapshots').delete().eq('product_id', savedId);
  const { error: snapshotError } = await supabase.from('price_snapshots').insert(savedSnapshots);
  if (snapshotError) throw new Error(snapshotError.message);
  await supabase.from('price_metrics').delete().eq('product_id', savedId);
  const { error: metricsError } = await supabase.from('price_metrics').insert(savedMetrics);
  if (metricsError) throw new Error(metricsError.message);
  return { ...(savedProduct as Product), metrics: savedMetrics, snapshots: savedSnapshots };
}

export function categoryImportance(category: ComponentCategory) {
  return { GPU: 8, CPU: 7, RAM: 6, SSD: 5, Motherboard: 5, PSU: 4, Case: 2, 'CPU cooler': 2 }[category];
}
