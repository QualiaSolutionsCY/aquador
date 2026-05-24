import { catalogueProducts, type CatalogueProduct } from '@/lib/ai/catalogue-data';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizePerfumeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 180);
}

function scoreProduct(product: CatalogueProduct, query: string): number {
  const haystack = [
    product.name,
    product.brand,
    product.gender,
    product.type,
    ...(product.searchTerms ?? []),
  ].join(' ').toLowerCase();
  const terms = query.split(' ').filter(Boolean);
  let score = 0;
  for (const term of terms) {
    if (product.name.toLowerCase().includes(term)) score += 4;
    if (product.brand.toLowerCase().includes(term)) score += 3;
    if (haystack.includes(term)) score += 1;
  }
  return score;
}

export function findCatalogueMatches(query: string, limit = 14) {
  const normalized = normalizePerfumeName(query);
  return catalogueProducts
    .map((product) => ({
      ...product,
      slug: toSlug(product.name),
      score: scoreProduct(product, normalized),
    }))
    .filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function serializeCatalogueMatches(query: string): string {
  const matches = findCatalogueMatches(query, 18);
  if (matches.length === 0) {
    return 'No direct Aquador catalogue matches were found. Recommend by accord family and customer intent.';
  }
  return matches
    .map((product) => (
      `- ${product.name} by ${product.brand}. Gender ${product.gender}. Type ${product.type}. Path /products/${product.slug}.`
    ))
    .join('\n');
}
