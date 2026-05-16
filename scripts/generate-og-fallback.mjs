#!/usr/bin/env node
/**
 * One-shot OG fallback image generator (M4 P2 T1).
 *
 * Renders three flat 1200x630 JPEGs into public/og/ using sharp + an inline
 * SVG. No external assets required. Re-run if the brand tokens change:
 *
 *   node scripts/generate-og-fallback.mjs
 *
 * Tokens mirrored from DESIGN.md §10b:
 *   bone background  #F5F2EC
 *   ink foreground   #1A1814
 *   hairline rule    rgba(26, 24, 20, 0.18)
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'og');

const WIDTH = 1200;
const HEIGHT = 630;
const BONE = '#F5F2EC';
const INK = '#1A1814';
const HAIRLINE = 'rgba(26, 24, 20, 0.18)';

/** Build an inline SVG sized to the OG card and rasterize it via sharp. */
function svgFor({ eyebrow, wordmark, tag }) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="${BONE}"/>
      <line x1="120" y1="120" x2="280" y2="120" stroke="${HAIRLINE}" stroke-width="1"/>
      <text x="120" y="160"
            font-family="'Geist', 'Inter', system-ui, sans-serif"
            font-size="14" letter-spacing="2"
            fill="${INK}" fill-opacity="0.6"
            text-transform="uppercase">${eyebrow}</text>
      <text x="120" y="350"
            font-family="'Cormorant Garamond', 'Playfair Display', Georgia, serif"
            font-size="144" font-weight="400" font-style="italic"
            fill="${INK}">${wordmark}</text>
      <line x1="120" y1="410" x2="320" y2="410" stroke="${INK}" stroke-width="1"/>
      <text x="120" y="470"
            font-family="'Newsreader', 'Georgia', serif"
            font-size="28" font-style="italic"
            fill="${INK}" fill-opacity="0.7">${tag}</text>
      <text x="120" y="560"
            font-family="'Geist', 'Inter', system-ui, sans-serif"
            font-size="14" letter-spacing="2"
            fill="${INK}" fill-opacity="0.5">NICOSIA, CYPRUS</text>
    </svg>`;
}

const cards = [
  {
    file: 'default.jpg',
    eyebrow: 'AQUAD&#8217;OR',
    wordmark: "Aquad&#8217;or",
    tag: 'A curated table of fragrance.',
  },
  {
    file: 'home.jpg',
    eyebrow: 'EST. 2024',
    wordmark: "Aquad&#8217;or",
    tag: 'Niche and original fragrance, plainly shown.',
  },
  {
    file: 'shop.jpg',
    eyebrow: 'THE COLLECTION',
    wordmark: "Aquad&#8217;or",
    tag: 'Women, men, niche, and originals.',
  },
];

for (const card of cards) {
  const svg = svgFor(card);
  const buf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  const out = join(OUT_DIR, card.file);
  await writeFile(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
}
