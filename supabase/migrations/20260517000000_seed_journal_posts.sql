-- M4 Phase 2 Task 4: Seed three editorial journal posts.
--
-- Idempotent via ON CONFLICT (slug) DO NOTHING so re-running the migration
-- is safe and leaves any later admin edits in place. The three slugs are:
--   - how-to-read-a-fragrance-pyramid
--   - why-we-curate-lattafa-originals
--   - layering-perfume-cyprus-heat
--
-- Each row follows the blog_posts schema declared in src/lib/supabase/types.ts
-- (id, slug, title, content, excerpt, category, status, cover_image,
-- author_name, author_role, published_at, read_time, tags).
--
-- Product slugs referenced inside content (yara-by-lattafa-perfumes,
-- khamrah-qahwa-by-lattafa-perfumes, raghba-by-lattafa-perfumes) were
-- verified live against the products table on 2026-05-17.
--
-- Cover images point at the existing blog/ Supabase Storage bucket
-- (HTTP 200 verified for both URLs at build time).

INSERT INTO public.blog_posts (
  id,
  slug,
  title,
  excerpt,
  content,
  category,
  status,
  cover_image,
  author_name,
  author_role,
  published_at,
  read_time,
  tags,
  featured
)
VALUES
  (
    gen_random_uuid(),
    'how-to-read-a-fragrance-pyramid',
    'How to read a fragrance pyramid',
    'A short guide to top, heart, and base notes, and what they actually mean once the bottle is on your skin.',
    $md$Every perfume on the site lists three rows of notes. Top, heart, base. The pyramid is a convention, not a marketing flourish, and once you learn to read it the way a perfumer does, you can predict, more or less, how a fragrance will wear for you across the afternoon.

## The top notes

These are what you smell in the first ten minutes. Bergamot, lemon, pink pepper, mandarin, mint. They are the high, volatile molecules that lift off the skin first. They are also the most evaporative, which is why a perfume rarely smells the same at noon as it did at ten in the morning. If you ever spray a bottle at the counter and decide ten seconds later, you are deciding on the top notes alone, which is a thin reading of the perfume. Wait the ten minutes.

## The heart notes

These take over once the top fades. Rose, jasmine, neroli, saffron, cardamom. They are the body of the fragrance, the part you will smell on yourself through the afternoon and the part the people sitting next to you will smell. A well composed heart reads as one note, not five. When you smell a perfume thirty minutes in and it still smells of several distinct things, the composition is rough.

## The base notes

These are the wood, the resin, the amber, the musk. Oud, sandalwood, vanilla, vetiver, ambroxan. They hold the perfume on your skin from the second hour onwards and they are what the perfume leaves on the cotton of your shirt the next morning. The base is what the perfume is, in the long term. Everything before it is the introduction.

## A worked example

Take Yara, from Lattafa. The top is tuberose and orchid, the heart is gourmand vanilla and orris, the base is sandalwood and musk. In practice, the first ten minutes are floral and sweet. The next two hours soften into a vanilla cream. The next six hours are sandalwood and musk on the skin, with the vanilla as a thread through them. You can buy [Yara by Lattafa Perfumes](/products/yara-by-lattafa-perfumes) on the site, spray it once at the wrist, and watch the pyramid play out in real time.

## How to use this on the site

Every product page lists the three rows. If a perfume is described as oud forward and the base reads as agarwood and amber, the description is honest. If it is described as oud and the base is amber and musk only, treat the oud claim with some scepticism. The pyramid is the truth check.

The shortest version: read the base notes first. If you like the base, you will live with the perfume. Top and heart are the introduction; the base is who you spend the day with.$md$,
    'Fragrance education',
    'published',
    'https://hznpuxplqgszbacxzbhv.supabase.co/storage/v1/object/public/blog/lattafa-originals.jpg',
    'Aquad''or editorial',
    'The desk',
    NOW(),
    5,
    ARRAY['fragrance education', 'notes', 'beginner'],
    false
  ),
  (
    gen_random_uuid(),
    'why-we-curate-lattafa-originals',
    'Why we curate Lattafa originals',
    'A Levantine house that bottles density per euro most niche brands cannot match, and the reasoning behind giving it its own shelf.',
    $md$Lattafa is a house out of the United Arab Emirates that has, over the last decade, built a reputation for fragrances that wear above their price. We carry the originals as a dedicated section of the shop, not as part of a generic men or women aisle, and the reason is worth explaining.

## Density per euro

A perfume is, mechanically, a concentration of perfume oil suspended in alcohol. The higher the concentration, the longer the wear and the louder the sillage. European designer perfumes typically run between eight and fifteen percent oil. Lattafa Eau de Parfums run between fifteen and twenty percent, sometimes higher on their Khamrah and Yara lines, and the ingredient quality on the amber and oud accords is unusual at the price.

This is not a discount play. It is an industry placement. Lattafa sources from Indian agarwood plantations and from the same Grasse and Bulgarian rose growers that supply the larger French houses, and the bottling is done in the UAE at a cost structure that does not include a Parisian flagship store rent.

## Who Lattafa suits

If you wear Maison Francis Kurkdjian Baccarat Rouge 540, [Khamrah Qahwa by Lattafa Perfumes](/products/khamrah-qahwa-by-lattafa-perfumes) is the warm, coffee shifted cousin you will recognise immediately. If you wear Tom Ford Tobacco Vanille, the Khamrah line is your nearest landing. If you have never met a Lattafa, [Raghba by Lattafa Perfumes](/products/raghba-by-lattafa-perfumes) is the easiest entry: a smoky vanilla and oud accord that reads luxurious without being assertive.

These are not dupes. The compositions are independent. They sit in the same olfactive neighbourhood as the European reference points because that neighbourhood happens to be in fashion globally, and Lattafa is a confident interpreter of it.

## Why a dedicated section

We separated Lattafa originals from the general catalogue for two reasons. The first is provenance. When you shop in the Lattafa section, you know the bottle came direct from the house, in the bottle they bottle, with the batch code and the seal. There is no ambiguity. The second is editorial. The Lattafa olfactive vocabulary is its own thing, and treating it as part of a generic perfume index would flatten what makes it interesting. A house deserves a shelf.

## A short list to start with

Yara for the floral gourmand. Khamrah for the spiced amber. Raghba for the smoky oud. Asad if you want the louder, sweeter Khamrah brother. Pure Musk if you want a clean second skin. Any of these is a fair introduction to what the house does well, and at thirty to forty five euros, the cost of the introduction is reasonable.$md$,
    'House notes',
    'published',
    'https://hznpuxplqgszbacxzbhv.supabase.co/storage/v1/object/public/blog/lattafa-originals.jpg',
    'Aquad''or editorial',
    'The desk',
    NOW(),
    4,
    ARRAY['lattafa', 'curation', 'levant'],
    false
  ),
  (
    gen_random_uuid(),
    'layering-perfume-cyprus-heat',
    'Layering perfume: three notes that work in Cyprus heat',
    'Practical guidance for wearing fragrance from June to September, when the wrong base note turns syrupy by noon.',
    $md$From mid June to early October, the heat in Cyprus does specific things to a fragrance. Volatile top notes burn off in minutes. Heavy oriental bases turn from luxurious to oppressive between the office and the car. The amber that read as warm and inviting in March reads as too much by August. The solution is not to give up perfume for the summer, it is to layer differently. Three notes carry well in the heat, and a few combinations of them carry beautifully.

## One: citrus over musk

Citrus alone evaporates inside the hour. The trick is to anchor it with a clean white musk that holds the freshness on the skin without adding sweetness. Spray a citrus eau de cologne (a basic bergamot, lemon, neroli) on the wrists, then mist a musk-forward perfume across the chest. The citrus reads first, the musk holds it through the afternoon. This is the lightest combination and the one that survives a beach in Limassol without turning loud.

## Two: rose over sandalwood

Rose can read heavy in the cold and feel cooler in the heat, which is counterintuitive but holds true. Pair a translucent rose (Bulgarian rose absolute, not damask attar) with a dry sandalwood base. The rose carries clean, the sandalwood adds depth without adding sugar. This combination reads as quiet luxury rather than as obvious perfume, which matters in an office where the air conditioning concentrates anything sweet.

## Three: cardamom over vetiver

For evenings, when the heat drops and you want a more present scent without going into oud territory, cardamom over vetiver is the move. Cardamom is spicy and slightly sweet, vetiver is green and earthy, and they balance each other in a way that is unmistakably summer in the Mediterranean. Spray the cardamom-forward perfume first, then a single mist of a vetiver. The composition reads as one note, not two.

## What to avoid

Heavy ouds turn cloying in the heat. Big tobacco notes read as smoke rather than as warmth. Sweet gourmands, vanilla and caramel led, become sickly by lunch. None of these are bad perfumes, they are wrong perfumes for the season. Save them for October.

## A practical note on application

Spray on skin, not on clothes. Skin warms the perfume and lets it bloom. Cotton holds the top notes flat and never lets the base develop. Two sprays at most. The instinct in the heat is to over apply because the perfume seems to disappear, and the result is an interior that you can smell from across a room. The base note will arrive. Wait for it.

## The take away

Cyprus heat is a constraint, but it is also a clarifier. The perfumes that wear well from June to September are the ones with honest construction: a real citrus over a real musk, a real rose over a real sandalwood, a real spice over a real green base. The same logic the Levant has used for centuries. Lean into it.$md$,
    'How to wear it',
    'published',
    'https://hznpuxplqgszbacxzbhv.supabase.co/storage/v1/object/public/blog/victorias-secret-originals.jpg',
    'Aquad''or editorial',
    'The desk',
    NOW(),
    5,
    ARRAY['layering', 'cyprus', 'summer', 'mediterranean'],
    false
  )
ON CONFLICT (slug) DO NOTHING;
