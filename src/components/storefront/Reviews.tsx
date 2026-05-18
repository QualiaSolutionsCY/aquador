/**
 * Reviews. Google Reviews proof section. Replaces the NotesStory pyramid on
 * the homepage. Renders a curated set of verbatim shop reviews as
 * hairline-bordered text containers, each anchored by a star rating, the
 * reviewer's name, and a "Verified from Google" badge.
 *
 * Voice rules (DESIGN.md §10b) apply to OUR copy only — the review bodies
 * are user-generated content quoted verbatim, so they may include
 * exclamation marks and other punctuation we would otherwise avoid.
 */

import Image from 'next/image';
import { Star } from 'lucide-react';
import FadeUp from './FadeUp';

type Review = {
  name: string;
  rating: 4 | 5;
  body: string;
};

// Curated from the Google Reviews feed. Verbatim quotes. English language,
// substantive content, balanced across product / service / atmosphere.
const REVIEWS: ReadonlyArray<Review> = [
  {
    name: 'Aleksandar Mihajlović',
    rating: 5,
    body: 'I just want to say thank you and give the biggest recognition on support, service and patience. There are no shops like this in Cyprus and it is a hidden gem for sure. Will come back for more, for sure.',
  },
  {
    name: 'Dunno',
    rating: 5,
    body: 'Amazing perfume shop. They have all the French perfume oils and also Arabic style oils like different types of ouds and musks. Their prices are very decent as well, when you consider import and export. They said soon they will have bakhoor too.',
  },
  {
    name: 'Katja Frommelt',
    rating: 5,
    body: 'So in love with this shop. Friendly staff, the owner is an expert, and our perfumes are fantastic. They were created for us. What we like, what is our type. Fantastic. We can highly recommend.',
  },
  {
    name: 'andrei-cosmin popa',
    rating: 5,
    body: "As a fragrance enthusiast, I would say Aquad'or is the best perfumery in Cyprus in regard to the quality, perfume oils concentration, ease of communication and customer experience.",
  },
  {
    name: 'Ahmet Guner',
    rating: 5,
    body: 'I got Lattafa Khanjar and it is original. I got Lattafa Atlas but I do not get any original so they make Atlas perfume for me and it is perfect.',
  },
  {
    name: 'Norm P.',
    rating: 4,
    body: 'The staff were very helpful during our recent visit. We spent quite some time trying to find the perfect fragrance and received the same level of service from start to finish. Terrific service, well done.',
  },
];

function Stars({ rating }: { rating: 4 | 5 }) {
  return (
    <p className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        return (
          <Star
            key={i}
            aria-hidden="true"
            strokeWidth={1.5}
            className={
              filled
                ? 'h-4 w-4 fill-accent-deep text-accent-deep'
                : 'h-4 w-4 text-fg-muted/50'
            }
          />
        );
      })}
    </p>
  );
}

export default function Reviews() {
  return (
    <section className="border-t border-border-dark bg-bg py-16 md:py-24 px-[var(--page-px)]">
      <FadeUp>
        <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <p className="font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
              From Google
            </p>
            <h2 className="mt-4 font-display text-fg leading-[1.05] tracking-[-0.02em] text-[length:var(--font-display-2xl)] max-w-[var(--container-prose)]">
              The desk, told back to us.
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Image
              src="/brand/google-reviews.webp"
              alt="Google Reviews"
              width={140}
              height={56}
              className="h-10 w-auto object-contain md:h-12"
            />
            <div className="font-micro uppercase tracking-[0.1em] text-[length:var(--font-size-micro)] text-fg-muted leading-relaxed">
              <p className="text-fg">45 reviews</p>
              <p>5 of 5 average</p>
            </div>
          </div>
        </div>
      </FadeUp>

      <ul className="mt-12 grid gap-px bg-border border border-border md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((review, index) => (
          <li key={index} className="flex flex-col gap-5 bg-bg p-8 md:p-10">
            <Stars rating={review.rating} />
            <blockquote className="font-body text-fg text-[length:var(--font-size-body)] leading-relaxed">
              {review.body}
            </blockquote>
            <div className="mt-auto pt-2">
              <p className="font-display text-fg text-[length:var(--font-h3)] leading-tight">
                {review.name}
              </p>
              <p className="mt-2 font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted">
                Verified from Google
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
