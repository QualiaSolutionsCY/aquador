/**
 * noteIcons: per-note Lucide icon map for the create-perfume builder.
 *
 * Each FragranceNote in src/lib/perfume/notes.ts maps to a lucide-react icon
 * that visually anchors the note in the picker UI. Falls back to a
 * category-default icon for any note name not explicitly listed (defensive —
 * the catalogue is finite and overrides cover every current entry).
 *
 * Tokens-only: icons take the parent's currentColor. No raw colour fills.
 */

import {
  type LucideIcon,
  Apple,
  Cake,
  Cherry,
  Citrus,
  Cloud,
  Coffee,
  Croissant,
  Cookie,
  Donut,
  Flame,
  FlameKindling,
  Flower,
  Flower2,
  Grape,
  IceCream,
  Leaf,
  Sparkles,
  Sprout,
  Sun,
  TreeDeciduous,
  TreePine,
  Trees,
  Wheat,
  Wind,
} from 'lucide-react';
import type { FragranceCategory, FragranceNote } from '@/lib/perfume/types';

const BY_NAME: Record<string, LucideIcon> = {
  // Floral
  Rose: Flower2,
  Jasmine: Flower,
  'Ylang-Ylang': Flower,
  Tuberose: Flower,
  Violet: Flower2,
  Peony: Flower2,
  'Orange Blossom': Flower,
  Lily: Flower,

  // Fruity
  Bergamot: Citrus,
  Lemon: Citrus,
  Apple: Apple,
  Peach: Cherry,
  Blackcurrant: Grape,
  Pineapple: Sun,
  Pear: Apple,
  Mandarin: Citrus,

  // Woody
  Sandalwood: TreeDeciduous,
  Cedar: TreePine,
  Vetiver: Wheat,
  Patchouli: Leaf,
  Oakmoss: Sprout,
  Pine: TreePine,

  // Oriental
  Oud: Trees,
  Amber: Sun,
  Incense: FlameKindling,
  Saffron: Sparkles,
  Cardamom: Sprout,
  Cinnamon: Flame,

  // Gourmand
  Vanilla: IceCream,
  Chocolate: Cookie,
  Coffee: Coffee,
  Caramel: Donut,
  Honey: Sun,
  Almond: Croissant,
};

const CATEGORY_DEFAULT: Record<FragranceCategory, LucideIcon> = {
  floral: Flower2,
  fruity: Citrus,
  woody: TreePine,
  oriental: Flame,
  gourmand: Cake,
};

export function iconForNote(note: FragranceNote): LucideIcon {
  return BY_NAME[note.name] ?? CATEGORY_DEFAULT[note.category] ?? Cloud ?? Wind;
}
