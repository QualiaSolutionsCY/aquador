const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../old-website-pages/products_Jan-20_09-43-10AM.csv');
const ENV_PATHS = ['.env.local', '.env.production'];

const TYPE_TO_DB = {
  Perfume: 'perfume',
  'Essence Oil': 'essence-oil',
  'Body Lotion': 'body-lotion',
};

function parseEnv() {
  const env = { ...process.env };
  for (const envPath of ENV_PATHS) {
    const fullPath = path.join(process.cwd(), envPath);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, 'utf8').split(/\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1).replace(/^"|"$/g, '').replace(/\\n/g, '').trim();
      if (!env[key]) env[key] = value;
    }
  }
  return env;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function cleanDescription(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function categoryFrom(categories) {
  const lower = categories.toLowerCase();
  if (lower.includes('/niche')) return 'niche';
  if (lower.includes('/women')) return 'women';
  if (lower.includes('/men')) return 'men';
  return 'niche';
}

function genderFrom(categories) {
  const lower = categories.toLowerCase();
  const hasMen = lower.includes('/men');
  const hasWomen = lower.includes('/women');
  if (hasMen && hasWomen) return 'unisex';
  if (hasMen) return 'men';
  if (hasWomen) return 'women';
  return 'unisex';
}

function variantId(baseId, type, size) {
  if (type === 'perfume' && size === '50ml') return baseId;
  if (type === 'perfume' && size === '100ml') return `${baseId}-100ml`;
  if (type === 'essence-oil') return `${baseId}-essence-oil`;
  if (type === 'body-lotion') return `${baseId}-body-lotion`;
  return `${baseId}-${type}-${size.toLowerCase()}`;
}

function variantName(title, type, size) {
  if (type === 'perfume' && size === '50ml') return title;
  if (type === 'perfume' && size === '100ml') return `${title} (100ml)`;
  if (type === 'essence-oil') return `${title} (Essence Oil)`;
  if (type === 'body-lotion') return `${title} (Body Lotion)`;
  return `${title} (${size})`;
}

function variantCategory(baseCategory, type) {
  if (type === 'essence-oil') return 'essence-oil';
  if (type === 'body-lotion') return 'body-lotion';
  return baseCategory;
}

function readProducts() {
  const lines = fs.readFileSync(CSV_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
  const products = [];
  let currentProduct = null;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const productId = row[0];
    if (productId) {
      if (currentProduct) products.push(currentProduct);
      currentProduct = {
        title: row[5],
        description: cleanDescription(row[6]),
        categories: row[24],
        visible: row[30],
        image: row[31],
        variants: [],
      };
    }
    if (!currentProduct) continue;
    currentProduct.variants.push({
      type: row[9],
      size: row[11],
      price: Number(row[20]),
      stock: row[23],
    });
  }
  if (currentProduct) products.push(currentProduct);
  return products;
}

function buildRows() {
  const rows = [];
  for (const product of readProducts()) {
    if (product.visible !== 'Yes') continue;
    const baseId = slugify(product.title);
    const baseCategory = categoryFrom(product.categories);
    const gender = genderFrom(product.categories);

    for (const variant of product.variants) {
      const productType = TYPE_TO_DB[variant.type];
      if (!productType || !variant.size || !Number.isFinite(variant.price)) continue;
      rows.push({
        id: variantId(baseId, productType, variant.size),
        name: variantName(product.title, productType, variant.size),
        description: product.description,
        brand: "Aquad'or",
        category: variantCategory(baseCategory, productType),
        product_type: productType,
        gender,
        size: variant.size,
        price: variant.price,
        sale_price: null,
        image: product.image,
        images: [],
        in_stock: variant.stock === 'Unlimited',
        is_active: true,
        tags: null,
      });
    }
  }
  return rows;
}

async function upsertRows(rows, env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const response = await fetch(`${url}/rest/v1/products?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    if (!response.ok) {
      throw new Error(`Upsert failed (${response.status}): ${await response.text()}`);
    }
    console.log(`Upserted ${Math.min(i + chunk.length, rows.length)} / ${rows.length}`);
  }
}

async function main() {
  const rows = buildRows();
  const dryRun = process.argv.includes('--dry-run');
  const counts = rows.reduce((acc, row) => {
    const key = `${row.product_type}:${row.size}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Prepared ${rows.length} Aquad'or variant rows`);
  console.log(JSON.stringify(counts, null, 2));
  if (dryRun) return;

  await upsertRows(rows, parseEnv());
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
