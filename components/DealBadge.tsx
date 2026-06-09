import { cn } from '@/lib/utils';
import type { DealRating } from '@/lib/types';

const styles: Record<DealRating | 'Wait', string> = {
  'Great deal': 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/30',
  'Good deal': 'bg-lime-400/15 text-lime-200 ring-lime-400/30',
  'Normal price': 'bg-sky-400/15 text-sky-200 ring-sky-400/30',
  Wait: 'bg-amber-400/15 text-amber-200 ring-amber-400/30',
  Avoid: 'bg-rose-400/15 text-rose-200 ring-rose-400/30',
  'Fake sale': 'bg-orange-400/15 text-orange-200 ring-orange-400/30'
};

export function DealBadge({ rating }: { rating?: DealRating | 'Wait' }) {
  const value = rating ?? 'Wait';
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1', styles[value])}>{value}</span>;
}
