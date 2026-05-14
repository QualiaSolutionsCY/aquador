import type { CSSProperties } from "react";

/**
 * /design-system — internal v3.0 token showcase.
 *
 * Visual proof that the OKLCH palette, fluid type scale, 8px spacing, motion
 * timings, and tinted shadow elevations from src/styles/tokens.css render as
 * DESIGN.md describes. Not linked from production navigation. Not crawled
 * (robots: noindex/nofollow in metadata).
 *
 * Built to QA Phase 1 of the v3.0 reset. Every later phase consults this
 * route to confirm a token still reads correctly after refactors.
 *
 * Routing: lives at /design-system (a regular App Router route). The original
 * plan named the folder `_design` expecting Next.js to leave it routable but
 * unlinked — but in Next 14 App Router an underscore prefix marks a PRIVATE
 * folder that is never routable. Renamed to `design-system` so the URL is
 * reachable in dev for QA. The route is intentionally NOT linked from any
 * nav surface, and `robots: noindex/nofollow` keeps it out of search engines.
 */

export const metadata = {
  title: "Design System — Aquad'or v3.0 (internal)",
  robots: { index: false, follow: false },
};

// ----------------------------------------------------------------------------
// Section 1 — Swatch grid data
// ----------------------------------------------------------------------------

type Swatch = {
  name: string;
  cssVar: string;
  oklch: string;
  group: "Semantic" | "Anchor" | "Neutral";
};

const SWATCHES: Swatch[] = [
  // Semantic roles
  { name: "bg",            cssVar: "--bg",            oklch: "oklch(0.97 0.008 80)",  group: "Semantic" },
  { name: "bg-alt",        cssVar: "--bg-alt",        oklch: "oklch(0.91 0.024 78)",  group: "Semantic" },
  { name: "fg",            cssVar: "--fg",            oklch: "oklch(0.16 0.018 80)",  group: "Semantic" },
  { name: "fg-muted",      cssVar: "--fg-muted",      oklch: "oklch(0.55 0.013 80)",  group: "Semantic" },
  { name: "accent",        cssVar: "--accent",        oklch: "oklch(0.72 0.135 82)",  group: "Semantic" },
  { name: "accent-deep",   cssVar: "--accent-deep",   oklch: "oklch(0.58 0.130 78)",  group: "Semantic" },
  { name: "critical",      cssVar: "--critical",      oklch: "oklch(0.40 0.140 25)",  group: "Semantic" },
  { name: "border",        cssVar: "--border",        oklch: "oklch(0.90 0.008 80)",  group: "Semantic" },
  { name: "border-strong", cssVar: "--border-strong", oklch: "oklch(0.82 0.010 80)",  group: "Semantic" },

  // Anchor families
  { name: "ink",           cssVar: "--color-ink",        oklch: "oklch(0.16 0.018 80)",  group: "Anchor" },
  { name: "ink-soft",      cssVar: "--color-ink-soft",   oklch: "oklch(0.22 0.020 80)",  group: "Anchor" },
  { name: "ink-rich",      cssVar: "--color-ink-rich",   oklch: "oklch(0.10 0.015 80)",  group: "Anchor" },
  { name: "bone",          cssVar: "--color-bone",       oklch: "oklch(0.97 0.008 80)",  group: "Anchor" },
  { name: "bone-soft",     cssVar: "--color-bone-soft",  oklch: "oklch(0.94 0.012 80)",  group: "Anchor" },
  { name: "parchment",     cssVar: "--color-parchment",  oklch: "oklch(0.91 0.024 78)",  group: "Anchor" },
  { name: "gold",          cssVar: "--color-gold",       oklch: "oklch(0.72 0.135 82)",  group: "Anchor" },
  { name: "gold-soft",     cssVar: "--color-gold-soft",  oklch: "oklch(0.82 0.090 82)",  group: "Anchor" },
  { name: "gold-deep",     cssVar: "--color-gold-deep",  oklch: "oklch(0.58 0.130 78)",  group: "Anchor" },
  { name: "oxblood",       cssVar: "--color-oxblood",      oklch: "oklch(0.40 0.140 25)",  group: "Anchor" },
  { name: "oxblood-soft",  cssVar: "--color-oxblood-soft", oklch: "oklch(0.55 0.110 25)",  group: "Anchor" },

  // Neutral scale 50-900
  { name: "neutral-50",  cssVar: "--color-neutral-50",  oklch: "oklch(0.98 0.005 80)",  group: "Neutral" },
  { name: "neutral-100", cssVar: "--color-neutral-100", oklch: "oklch(0.95 0.006 80)",  group: "Neutral" },
  { name: "neutral-200", cssVar: "--color-neutral-200", oklch: "oklch(0.90 0.008 80)",  group: "Neutral" },
  { name: "neutral-300", cssVar: "--color-neutral-300", oklch: "oklch(0.82 0.010 80)",  group: "Neutral" },
  { name: "neutral-400", cssVar: "--color-neutral-400", oklch: "oklch(0.70 0.012 80)",  group: "Neutral" },
  { name: "neutral-500", cssVar: "--color-neutral-500", oklch: "oklch(0.55 0.013 80)",  group: "Neutral" },
  { name: "neutral-600", cssVar: "--color-neutral-600", oklch: "oklch(0.42 0.014 80)",  group: "Neutral" },
  { name: "neutral-700", cssVar: "--color-neutral-700", oklch: "oklch(0.32 0.012 80)",  group: "Neutral" },
  { name: "neutral-800", cssVar: "--color-neutral-800", oklch: "oklch(0.22 0.010 80)",  group: "Neutral" },
  { name: "neutral-900", cssVar: "--color-neutral-900", oklch: "oklch(0.14 0.008 80)",  group: "Neutral" },
];

// ----------------------------------------------------------------------------
// Section 3 — Spacing ruler data
// ----------------------------------------------------------------------------

const SPACING_STEPS: Array<{ token: string; rem: string; px: string }> = [
  { token: "space-1",  rem: "0.25rem", px: "4px"   },
  { token: "space-2",  rem: "0.5rem",  px: "8px"   },
  { token: "space-3",  rem: "0.75rem", px: "12px"  },
  { token: "space-4",  rem: "1rem",    px: "16px"  },
  { token: "space-6",  rem: "1.5rem",  px: "24px"  },
  { token: "space-8",  rem: "2rem",    px: "32px"  },
  { token: "space-12", rem: "3rem",    px: "48px"  },
  { token: "space-16", rem: "4rem",    px: "64px"  },
  { token: "space-24", rem: "6rem",    px: "96px"  },
  { token: "space-32", rem: "8rem",    px: "128px" },
];

// ----------------------------------------------------------------------------
// Shared style fragments
// ----------------------------------------------------------------------------

const microLabel: CSSProperties = {
  fontFamily: "var(--font-micro)",
  fontSize: "var(--font-micro)",
  fontWeight: 500,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
};

const captionBody: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--font-body-sm)",
  color: "var(--fg-muted)",
  lineHeight: 1.5,
};

const sectionEyebrow: CSSProperties = {
  ...microLabel,
  fontSize: "var(--font-micro)",
  color: "var(--accent-deep)",
  letterSpacing: "0.08em",
  marginBottom: "var(--space-3)",
};

const sectionHeading: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--font-display-xl)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
  color: "var(--fg)",
  margin: 0,
};

const sectionLead: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--font-body-lg)",
  color: "var(--fg-muted)",
  lineHeight: 1.5,
  maxWidth: "56ch",
  margin: "var(--space-3) 0 0 0",
};

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function DesignShowcasePage() {
  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        padding: "var(--page-py) var(--page-px)",
        minHeight: "100vh",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Page-scoped hover + focus rules. Kept tiny on purpose — only the two
          interactions the page itself can't express purely inline. */}
      <style>{`
        .design-motion-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-2);
        }
        .design-motion-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }
      `}</style>
      <div style={{ maxWidth: "var(--container-full)", margin: "0 auto" }}>
        {/* ─────────────────────────────────────────────────────── Masthead */}
        <header
          style={{
            marginBottom: "var(--space-16)",
            paddingBottom: "var(--space-8)",
            borderBottom: "2px solid var(--accent)",
          }}
        >
          <p style={sectionEyebrow}>Aquad&apos;or v3.0 — internal</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--font-display-3xl)",
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            Design system, rendered
          </h1>
          <p style={sectionLead}>
            Every token in <code>src/styles/tokens.css</code>, on a single page. If a swatch reads
            cold or a heading prints in the wrong serif, the substrate, not the consumer, is the
            problem. This route is not linked from production navigation.
          </p>
        </header>

        {/* ═════════════════════════════════════════════════════════════════
            Section 1 — Swatch grid
            ═════════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="section-swatches"
          style={{ marginBottom: "var(--space-24)" }}
        >
          <SectionHeader id="section-swatches" eyebrow="01 — Color" title="Swatch grid" />
          <p style={sectionLead}>
            Semantic roles, anchor families, and the tinted neutral scale. Hue 80 leans toward the
            signature gold so neutrals never read cool. Chroma stays between 0.005 and 0.024 on
            non-accent tones; restraint is the point.
          </p>

          {(["Semantic", "Anchor", "Neutral"] as const).map((group) => (
            <div key={group} style={{ marginTop: "var(--space-12)" }}>
              <p style={{ ...microLabel, marginBottom: "var(--space-4)" }}>
                {group === "Semantic" ? "Semantic roles" : group === "Anchor" ? "Anchor palette" : "Tinted neutrals"}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "var(--space-4)",
                }}
              >
                {SWATCHES.filter((s) => s.group === group).map((s) => (
                  <SwatchTile key={s.cssVar} swatch={s} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ═════════════════════════════════════════════════════════════════
            Section 2 — Type specimen
            ═════════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="section-type"
          style={{ marginBottom: "var(--space-24)" }}
        >
          <SectionHeader id="section-type" eyebrow="02 — Typography" title="Type specimen" />
          <p style={sectionLead}>
            Display: Cormorant Garamond, weights 400 / 500, italic for ornament. Body: Newsreader,
            serif by commitment. Micro: Geist, uppercase, tracking 0.05em — the only sans-serif in
            the system.
          </p>

          <div style={{ marginTop: "var(--space-12)", display: "grid", gap: "var(--space-8)" }}>
            <TypeRow
              label="display-3xl · hero"
              clampLiteral="clamp(2.5rem, 5vw + 1rem, 5rem)"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--font-display-3xl)",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Reading a perfume&apos;s page
            </TypeRow>

            <TypeRow
              label="display-2xl · section opener"
              clampLiteral="clamp(2rem, 4vw + 0.5rem, 3.5rem)"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--font-display-2xl)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Like opening a letter from someone who knows scent
            </TypeRow>

            <TypeRow
              label="display-xl · editorial heading"
              clampLiteral="clamp(1.75rem, 3vw + 0.5rem, 2.5rem)"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--font-display-xl)",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Notes settle best after the first wear
            </TypeRow>

            <TypeRow
              label="h1 · page title"
              clampLiteral="clamp(2rem, 3vw + 0.5rem, 3rem)"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--font-h1)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              The Lattafa Collection
            </TypeRow>

            <TypeRow
              label="h2 · subsection"
              clampLiteral="clamp(1.5rem, 2vw + 0.5rem, 2.25rem)"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--font-h2)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
              }}
            >
              Notes pyramid
            </TypeRow>

            <TypeRow
              label="h3 · card title"
              clampLiteral="clamp(1.25rem, 1.5vw + 0.5rem, 1.75rem)"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--font-h3)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Khamrah by Lattafa
            </TypeRow>

            <TypeRow
              label="body-lg · editorial paragraph"
              clampLiteral="clamp(1.125rem, 0.5vw + 1rem, 1.25rem)"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-body-lg)",
                lineHeight: 1.6,
                maxWidth: "65ch",
              }}
            >
              It&apos;s ours to send now. You&apos;ll have it in three days, maybe four. The notes
              settle best after the first wear; let it find its skin.
            </TypeRow>

            <TypeRow
              label="body · default copy"
              clampLiteral="1rem (16px floor)"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-body)",
                lineHeight: 1.6,
                maxWidth: "65ch",
              }}
            >
              Top notes give the first impression, heart notes carry the character, base notes set
              how long it stays. A well-composed perfume keeps all three coherent across an
              afternoon.
            </TypeRow>

            <TypeRow
              label="body-sm · caption"
              clampLiteral="0.875rem (14px)"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-body-sm)",
                lineHeight: 1.55,
                color: "var(--fg-muted)",
                maxWidth: "60ch",
              }}
            >
              Cypriot import, hand-packed in Nicosia. Allow two to three business days for
              delivery on the island.
            </TypeRow>

            <TypeRow
              label="micro · UPPERCASE label (Geist)"
              clampLiteral="0.75rem (12px) · tracking 0.05em"
              style={{
                fontFamily: "var(--font-micro)",
                fontSize: "var(--font-micro)",
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Add to bag
            </TypeRow>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════
            Section 3 — Spacing ruler
            ═════════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="section-spacing"
          style={{ marginBottom: "var(--space-24)" }}
        >
          <SectionHeader id="section-spacing" eyebrow="03 — Spacing" title="8px grid ruler" />
          <p style={sectionLead}>
            Ten steps from 4px to 128px. Components must reference these tokens, never a magic px.
            Tight within groups, generous between sections — rhythm beats uniformity.
          </p>

          <div style={{ marginTop: "var(--space-12)", display: "grid", gap: "var(--space-4)" }}>
            {SPACING_STEPS.map((step) => (
              <div
                key={step.token}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(140px, 180px) 1fr minmax(160px, 200px)",
                  alignItems: "center",
                  gap: "var(--space-4)",
                  paddingBlock: "var(--space-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={microLabel}>{step.token}</span>
                <div
                  aria-hidden="true"
                  style={{
                    width: `var(--${step.token})`,
                    height: "24px",
                    background: "var(--accent)",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
                <span style={captionBody}>
                  {step.rem} · {step.px}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════
            Section 4 — Motion preview
            ═════════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="section-motion"
          style={{ marginBottom: "var(--space-24)" }}
        >
          <SectionHeader id="section-motion" eyebrow="04 — Motion" title="Three speeds, one curve" />
          <p style={sectionLead}>
            Hover any card to preview its duration with <code>cubic-bezier(0.16, 1, 0.3, 1)</code>{" "}
            (ease-out-expo). No bounce, no scale-pop. Reduced-motion users see no movement at all —
            the global media query in <code>tokens.css</code> collapses every transition.
          </p>

          <div
            style={{
              marginTop: "var(--space-12)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "var(--space-6)",
            }}
          >
            <MotionCard label="Fast" duration="150ms" durationToken="var(--duration-fast)" />
            <MotionCard label="Base" duration="250ms" durationToken="var(--duration-base)" />
            <MotionCard label="Slow" duration="400ms" durationToken="var(--duration-slow)" />
          </div>

          <div
            style={{
              marginTop: "var(--space-6)",
              padding: "var(--space-4) var(--space-6)",
              background: "var(--bg-alt)",
              borderRadius: "var(--radius-md)",
              maxWidth: "var(--container-prose)",
            }}
          >
            <p style={{ ...microLabel, color: "var(--accent-deep)", marginBottom: "var(--space-2)" }}>
              prefers-reduced-motion
            </p>
            <p style={captionBody}>
              When a visitor has reduced-motion enabled at the OS level, every transition collapses
              to 0.001ms. The cards above still respond to interaction; they just stop moving.
              Verify by toggling Reduce Motion in System Settings and hovering again.
            </p>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════
            Section 5 — Shadow elevation
            ═════════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="section-shadow"
          style={{ marginBottom: "var(--space-16)" }}
        >
          <SectionHeader
            id="section-shadow"
            eyebrow="05 — Depth"
            title="Tinted shadows, not gray"
          />
          <p style={sectionLead}>
            Each shadow uses <code>oklch(0.20 0.010 80 / α)</code> — warm-toned, never neutral
            black. Read on the parchment surface below to see the temperature carry through.
          </p>

          <div
            style={{
              marginTop: "var(--space-12)",
              padding: "var(--space-12) var(--space-8)",
              background: "var(--bg-alt)",
              borderRadius: "var(--radius-lg)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "var(--space-8)",
            }}
          >
            <ShadowCard level="1" boxShadow="var(--shadow-1)" usage="Interactive hover" />
            <ShadowCard level="2" boxShadow="var(--shadow-2)" usage="Card in motion" />
            <ShadowCard level="3" boxShadow="var(--shadow-3)" usage="Drawer / Dialog overlay" />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────── Footer */}
        <footer
          style={{
            marginTop: "var(--space-16)",
            paddingTop: "var(--space-8)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <p style={microLabel}>
            internal route · not indexed · src/styles/tokens.css is the source of truth
          </p>
        </footer>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function SectionHeader({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <p style={sectionEyebrow}>{eyebrow}</p>
      <h2 id={id} style={sectionHeading}>
        {title}
      </h2>
    </div>
  );
}

function SwatchTile({ swatch }: { swatch: Swatch }) {
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div
        aria-hidden="true"
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          minHeight: "96px",
          background: `var(${swatch.cssVar})`,
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
        }}
      />
      <figcaption style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--font-body-sm)",
            fontWeight: 500,
            color: "var(--fg)",
            letterSpacing: "-0.005em",
          }}
        >
          {swatch.name}
        </span>
        <span style={{ ...microLabel, fontSize: "var(--font-micro)" }}>{swatch.cssVar}</span>
        <span
          style={{
            ...microLabel,
            color: "var(--fg-muted)",
            letterSpacing: "0.04em",
            textTransform: "none",
          }}
        >
          {swatch.oklch}
        </span>
      </figcaption>
    </figure>
  );
}

function TypeRow({
  label,
  clampLiteral,
  style,
  children,
}: {
  label: string;
  clampLiteral: string;
  style: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-3)",
        paddingBottom: "var(--space-6)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <span style={microLabel}>{label}</span>
        <span style={{ ...microLabel, color: "var(--accent-deep)", letterSpacing: "0.04em" }}>
          {clampLiteral}
        </span>
      </div>
      <p style={{ ...style, margin: 0, color: style.color ?? "var(--fg)" }}>{children}</p>
    </div>
  );
}

function MotionCard({
  label,
  duration,
  durationToken,
}: {
  label: string;
  duration: string;
  durationToken: string;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} motion sample, ${duration}`}
      className="design-motion-card"
      style={{
        appearance: "none",
        textAlign: "left",
        cursor: "pointer",
        background: "var(--bg-alt)",
        color: "var(--fg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-8) var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        transitionProperty: "transform, box-shadow",
        transitionDuration: durationToken,
        transitionTimingFunction: "var(--ease-out-expo)",
        transform: "translateY(0)",
        boxShadow: "var(--shadow-1)",
        fontFamily: "var(--font-body)",
      }}
    >
      <span style={microLabel}>{`${label} · ${duration}`}</span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--font-h3)",
          fontStyle: "italic",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
        }}
      >
        Hover to translate
      </span>
      <span style={captionBody}>{`transform: translateY(-8px) over ${duration} · ease-out-expo`}</span>
    </button>
  );
}

function ShadowCard({
  level,
  boxShadow,
  usage,
}: {
  level: string;
  boxShadow: string;
  usage: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-8) var(--space-6)",
        boxShadow,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        minHeight: "180px",
      }}
    >
      <span style={microLabel}>shadow-{level}</span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--font-h2)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
        }}
      >
        Elevation {level}
      </span>
      <span style={captionBody}>{usage}</span>
    </div>
  );
}
