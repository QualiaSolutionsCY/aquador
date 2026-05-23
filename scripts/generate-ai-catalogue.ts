#!/usr/bin/env tsx
/**
 * Generate AI catalogue data from Supabase products
 * Run during build: npm run prebuild
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠ Missing Supabase credentials — skipping catalogue generation');
  console.warn('  Using existing catalogue-data.ts (if available)');
  console.warn('  Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to generate fresh data');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateCatalogue() {
  console.log('🔍 Fetching products from Supabase...');

  // Query all products with fields needed for AI matching
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, gender, product_type, tags')
    .order('id');

  if (error) {
    console.warn('⚠ Failed to fetch products:', error.message);
    console.warn('  Using existing catalogue-data.ts (if available)');
    process.exit(0);
  }

  if (!products || products.length === 0) {
    console.warn('⚠ No products found in database');
    console.warn('  Using existing catalogue-data.ts (if available)');
    process.exit(0);
  }

  console.log(`✓ Fetched ${products.length} products`);

  // Capitalize first letter for TypeScript enum compatibility
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  // Transform to CatalogueProduct format
  const catalogueProducts = products.map((p, index) => ({
    number: String(index + 1),
    name: p.name,
    brand: p.brand || 'Unknown',
    gender: capitalize(p.gender || 'unisex') as 'Men' | 'Women' | 'Unisex',
    type: (p.product_type || 'perfume') as 'perfume' | 'essence-oil' | 'body-lotion',
    searchTerms: p.tags || [],
  }));

  // Generate TypeScript file content
  const fileContent = `/**
 * Aquador Catalogue Data
 * Generated from Supabase products table
 * Last updated: ${new Date().toISOString()}
 * Total products: ${catalogueProducts.length}
 *
 * DO NOT EDIT MANUALLY - run 'npm run generate:catalogue' to update
 */

export interface CatalogueProduct {
  number: string;
  name: string;
  brand: string;
  gender: 'Men' | 'Women' | 'Unisex';
  type: 'perfume' | 'essence-oil' | 'body-lotion';
  searchTerms?: string[];
}

export const catalogueProducts: CatalogueProduct[] = ${JSON.stringify(catalogueProducts, null, 2)};

/**
 * Search catalogue by keyword
 * Used for AI product matching
 */
export function searchCatalogue(keyword: string): CatalogueProduct[] {
  const lowerKeyword = keyword.toLowerCase();
  return catalogueProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.brand.toLowerCase().includes(lowerKeyword) ||
      p.searchTerms?.some((term) => term.toLowerCase().includes(lowerKeyword))
  );
}
`;

  // Write to src/lib/ai/catalogue-data.ts
  const outputPath = path.join(process.cwd(), 'src/lib/ai/catalogue-data.ts');
  await fs.writeFile(outputPath, fileContent, 'utf-8');

  console.log(`✓ Generated ${outputPath}`);
  console.log(`✓ ${catalogueProducts.length} products exported`);
  console.log('✨ AI catalogue generation complete');
}

generateCatalogue().catch((err) => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
