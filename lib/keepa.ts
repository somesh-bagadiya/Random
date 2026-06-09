import { normalizeKeepaPrice } from './deal-logic';
import { mockKeepaProduct } from './mock-data';
import type { KeepaProductResult } from './types';

const KEEPA_MINUTE_ZERO = Date.UTC(2011, 0, 1, 0, 0, 0);

function keepaMinutesToIso(minutes: number) {
  return new Date(KEEPA_MINUTE_ZERO + minutes * 60_000).toISOString();
}

export async function fetchKeepaProduct(asin: string): Promise<KeepaProductResult> {
  const apiKey = process.env.KEEPA_API_KEY;
  if (!apiKey) return mockKeepaProduct(asin);

  const url = new URL('https://api.keepa.com/product');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('domain', '1');
  url.searchParams.set('asin', asin);
  url.searchParams.set('history', '1');
  url.searchParams.set('stats', '365');
  url.searchParams.set('buybox', '1');

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Keepa API request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const product = payload.products?.[0];
  if (!product) throw new Error(`Keepa returned no product data for ASIN ${asin}.`);

  const csv: number[] | undefined = product.csv?.[0] ?? product.csv?.[1] ?? product.csv?.[18];
  const priceHistory: Array<{ date: string; price: number }> = [];
  if (Array.isArray(csv)) {
    for (let i = 0; i < csv.length - 1; i += 2) {
      const keepaTime = csv[i];
      const rawPrice = csv[i + 1];
      const price = normalizeKeepaPrice(rawPrice);
      if (keepaTime > 0 && price > 0) priceHistory.push({ date: keepaMinutesToIso(keepaTime), price });
    }
  }

  if (priceHistory.length === 0) throw new Error(`Keepa returned no usable Amazon price history for ASIN ${asin}.`);

  const imageName = product.imagesCSV?.split(',')?.[0];
  return {
    asin,
    title: product.title ?? `Amazon product ${asin}`,
    brand: product.brand ?? null,
    imageUrl: imageName ? `https://images-na.ssl-images-amazon.com/images/I/${imageName}` : null,
    priceHistory,
    currentPrice: priceHistory[priceHistory.length - 1].price,
    raw: payload
  };
}
