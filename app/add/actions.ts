'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addProduct } from '@/lib/store';
import { COMPONENT_CATEGORIES } from '@/lib/types';

const schema = z.object({
  input: z.string().min(1),
  category: z.enum(COMPONENT_CATEGORIES),
  upgradePriority: z.coerce.number().int().min(1).max(10),
  notes: z.string().optional()
});

export async function addProductAction(formData: FormData) {
  const parsed = schema.safeParse({
    input: formData.get('input'),
    category: formData.get('category'),
    upgradePriority: formData.get('upgradePriority'),
    notes: formData.get('notes')
  });
  if (!parsed.success) redirect('/add?error=invalid-input');
  let product: Awaited<ReturnType<typeof addProduct>>;
  try {
    product = await addProduct(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? encodeURIComponent(error.message) : 'unknown-error';
    redirect(`/add?error=${message}`);
  }
  redirect(`/product/${product.id}`);
}
