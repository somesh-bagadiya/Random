import { NextResponse } from 'next/server';
import { addProduct, getProducts } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ products: await getProducts() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await addProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
