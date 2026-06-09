import { v5 as uuidv5 } from 'uuid';
import { calculatePriceMetrics, snapshotsFromHistory } from './deal-logic';
import type { ComponentCategory, ComponentRule, KeepaProductResult, Product, ProductWithMetrics } from './types';

const NS = '9e0f1299-86a6-4ef4-9cdf-1b7434e25f63';

type Seed = {
  asin: string;
  title: string;
  brand: string;
  category: ComponentCategory;
  price: number;
  low: number;
  priority: number;
};

export const seedProducts: Seed[] = [
  { asin: 'B0BMQJWBDM', title: 'AMD Ryzen 7 7700', brand: 'AMD', category: 'CPU', price: 259, low: 229, priority: 8 },
  { asin: 'B0BMQJWBD1', title: 'AMD Ryzen 5 7600', brand: 'AMD', category: 'CPU', price: 189, low: 169, priority: 6 },
  { asin: 'B0BBJDS62N', title: 'AMD Ryzen 5 7600X', brand: 'AMD', category: 'CPU', price: 199, low: 179, priority: 6 },
  { asin: 'B0D6NMDNNX', title: 'AMD Ryzen 7 9700X', brand: 'AMD', category: 'CPU', price: 329, low: 299, priority: 7 },
  { asin: 'B0BMQK718H', title: 'AMD Ryzen 9 7900', brand: 'AMD', category: 'CPU', price: 369, low: 339, priority: 8 },
  { asin: 'B0F5060TI6', title: 'NVIDIA GeForce RTX 5060 Ti 16GB', brand: 'NVIDIA', category: 'GPU', price: 449, low: 419, priority: 10 },
  { asin: 'B0C4F7G3VQ', title: 'NVIDIA GeForce RTX 4060 Ti 16GB', brand: 'NVIDIA', category: 'GPU', price: 429, low: 369, priority: 7 },
  { asin: 'B0CS6ZCVFJ', title: 'NVIDIA GeForce RTX 4070 Ti Super', brand: 'NVIDIA', category: 'GPU', price: 789, low: 749, priority: 9 },
  { asin: 'B08HR6ZBYJ', title: 'NVIDIA GeForce RTX 3090', brand: 'NVIDIA', category: 'GPU', price: 799, low: 699, priority: 8 },
  { asin: 'B0CS6Y6Y7M', title: 'NVIDIA GeForce RTX 4080 Super', brand: 'NVIDIA', category: 'GPU', price: 999, low: 949, priority: 9 },
  { asin: 'B0BHCCNSRH', title: 'MSI B650 Tomahawk WiFi', brand: 'MSI', category: 'Motherboard', price: 199, low: 169, priority: 8 },
  { asin: 'B0BH7GTY9C', title: 'Gigabyte B650 Aorus Elite AX', brand: 'Gigabyte', category: 'Motherboard', price: 189, low: 159, priority: 7 },
  { asin: 'B0C1TKSDKR', title: 'G.Skill Flare X5 64GB DDR5-6000 CL30', brand: 'G.Skill', category: 'RAM', price: 189, low: 169, priority: 9 },
  { asin: 'B0BHJJ9Y77', title: 'Samsung 990 Pro 2TB', brand: 'Samsung', category: 'SSD', price: 169, low: 129, priority: 7 },
  { asin: 'B0B7CMZ3QH', title: 'WD Black SN850X 2TB', brand: 'Western Digital', category: 'SSD', price: 149, low: 119, priority: 7 },
  { asin: 'B0BYQHWJXC', title: 'Corsair RM850e', brand: 'Corsair', category: 'PSU', price: 119, low: 99, priority: 8 },
  { asin: 'B0BN3SY5XW', title: 'Lian Li Lancool 216', brand: 'Lian Li', category: 'Case', price: 99, low: 89, priority: 5 },
  { asin: 'B0BNGVWL98', title: 'Thermalright Phantom Spirit 120 SE', brand: 'Thermalright', category: 'CPU cooler', price: 36, low: 32, priority: 5 }
];

export const componentRules: ComponentRule[] = [
  { id: 'rule-gpu', category: 'GPU', ideal_specs: { vram: '16GB+', encoder: 'modern NVENC/AV1' }, avoid_rules: { vram: '<12GB for AI workloads' }, upgrade_notes: 'VRAM is the primary constraint for local AI models.' },
  { id: 'rule-ram', category: 'RAM', ideal_specs: { capacity: '64GB', speed: 'DDR5-6000 CL30' }, avoid_rules: { capacity: '<32GB' }, upgrade_notes: 'Capacity and stability matter more than RGB.' },
  { id: 'rule-ssd', category: 'SSD', ideal_specs: { capacity: '2TB+', interface: 'PCIe 4.0 NVMe' }, avoid_rules: { dramless: 'only if deeply discounted' }, upgrade_notes: 'Model files and datasets fill drives quickly.' },
  { id: 'rule-psu', category: 'PSU', ideal_specs: { wattage: '850W+', standard: 'ATX 3.x' }, avoid_rules: { tier: 'unknown low-tier units' }, upgrade_notes: 'Leave transient headroom for GPUs.' },
  { id: 'rule-board', category: 'Motherboard', ideal_specs: { socket: 'AM5', wifi: true, m2Slots: '3+' }, avoid_rules: { vrm: 'weak VRM or missing BIOS flashback' }, upgrade_notes: 'AM5 provides a strong CPU upgrade path.' },
  { id: 'rule-cpu', category: 'CPU', ideal_specs: { platform: 'AM5', cores: '6-12' }, avoid_rules: { platform: 'dead-end platforms unless discounted' }, upgrade_notes: 'Balance cores with GPU budget.' },
  { id: 'rule-case', category: 'Case', ideal_specs: { airflow: 'mesh front', clearance: 'large GPUs' }, avoid_rules: { airflow: 'closed front panels' }, upgrade_notes: 'Cooling and build quality beat decorative features.' },
  { id: 'rule-cooler', category: 'CPU cooler', ideal_specs: { type: 'dual-tower air', noise: 'low' }, avoid_rules: { value: 'overpriced 120mm AIO' }, upgrade_notes: 'Excellent air coolers are often inexpensive.' }
];

export function makeMockHistory(current: number, low: number, days = 420) {
  const points: Array<{ date: string; price: number }> = [];
  const now = new Date();
  for (let i = days; i >= 0; i -= 7) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const seasonalDip = Math.sin(i / 23) * 0.07;
    const noise = Math.cos(i / 13) * 0.035;
    const baseline = current * (1.03 + seasonalDip + noise);
    const primeDayDip = i < 35 ? low * 1.04 : baseline;
    const price = Number(Math.max(low, Math.min(current * 1.22, primeDayDip)).toFixed(2));
    points.push({ date: date.toISOString(), price });
  }
  points[points.length - 1].price = current;
  return points;
}

export function mockKeepaProduct(asin: string): KeepaProductResult {
  const seed = seedProducts.find((item) => item.asin === asin) ?? seedProducts[Math.abs(hashCode(asin)) % seedProducts.length];
  const history = makeMockHistory(seed.price, seed.low);
  return {
    asin,
    title: seed.asin === asin ? seed.title : `Mock Amazon Product ${asin}`,
    brand: seed.brand,
    imageUrl: `https://placehold.co/480x480/111827/a78bfa?text=${encodeURIComponent(seed.category)}`,
    priceHistory: history,
    currentPrice: history[history.length - 1].price,
    raw: { mock: true, asin, generatedAt: new Date().toISOString(), reason: 'KEEPA_API_KEY is not configured or mock seed requested.' }
  };
}

function hashCode(value: string) {
  return value.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
}

export function buildMockProduct(seed: Seed): ProductWithMetrics {
  const id = uuidv5(seed.asin, NS);
  const now = new Date().toISOString();
  const history = makeMockHistory(seed.price, seed.low);
  const product: Product = {
    id,
    asin: seed.asin,
    title: seed.title,
    brand: seed.brand,
    category: seed.category,
    amazon_url: `https://www.amazon.com/dp/${seed.asin}`,
    image_url: `https://placehold.co/480x480/111827/a78bfa?text=${encodeURIComponent(seed.category)}`,
    notes: `${seed.title} tracked as a sample AI workstation component.`,
    upgrade_priority: seed.priority,
    created_at: now,
    updated_at: now,
    raw_keepa: { mock: true, seed: true }
  };
  const metrics = { ...calculatePriceMetrics(history, seed.category, id), id: uuidv5(`${seed.asin}-metrics`, NS) };
  return { ...product, metrics, snapshots: snapshotsFromHistory(id, history, 'mock') };
}

export const mockProducts = seedProducts.map(buildMockProduct);
