import { mockProducts } from '../lib/mock-data';

console.log(JSON.stringify({ products: mockProducts.length, asins: mockProducts.map((product) => product.asin) }, null, 2));
