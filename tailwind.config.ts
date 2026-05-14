import type { Config } from "tailwindcss";

/**
 * Aquad'or v3.0 Tailwind theme.
 *
 * Every color, font, gradient, and animation token in this file resolves to
 * either a CSS custom property defined in `src/styles/tokens.css` (the
 * OKLCH-only substrate from M1.1 Task 1) or to an OKLCH literal that matches
 * one of those tokens verbatim. No hex, no rgb/rgba.
 *
 * Why the mix:
 *   - Semantic roles (`bg`, `fg`, `accent`, …) reference `var(--*)` so a
 *     future theme swap (e.g. `[data-theme="dark"]`) propagates in one place.
 *   - Legacy aliases that callers opacity-modify (`bg-gold/10`, `border-gold/20`,
 *     `text-gray-500/50`) are written with the `<alpha-value>` placeholder so
 *     Tailwind 3.4's opacity-modifier syntax keeps working. The OKLCH triple
 *     IS the same triple tokens.css uses — they are the same color.
 *
 * Legacy class names (`bg-gold`, `text-dark`, `font-playfair`, etc.) are kept
 * as aliases so existing markup keeps compiling while the live site
 * color-shifts to v3.0 in one commit.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ----- v3.0 semantic roles (preferred for new code) -----
        bg: "var(--bg)",
        "bg-alt": "var(--bg-alt)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        accent: {
          DEFAULT: "var(--accent)",
          deep: "var(--accent-deep)",
        },
        critical: "var(--critical)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },

        // ----- v3.0 tinted neutral scale -----
        // OKLCH triples mirror src/styles/tokens.css §2 verbatim. The
        // `<alpha-value>` placeholder enables `text-neutral-500/60` etc.
        neutral: {
          50: "oklch(0.98 0.005 80 / <alpha-value>)",
          100: "oklch(0.95 0.006 80 / <alpha-value>)",
          200: "oklch(0.90 0.008 80 / <alpha-value>)",
          300: "oklch(0.82 0.010 80 / <alpha-value>)",
          400: "oklch(0.70 0.012 80 / <alpha-value>)",
          500: "oklch(0.55 0.013 80 / <alpha-value>)",
          600: "oklch(0.42 0.014 80 / <alpha-value>)",
          700: "oklch(0.32 0.012 80 / <alpha-value>)",
          800: "oklch(0.22 0.010 80 / <alpha-value>)",
          900: "oklch(0.14 0.008 80 / <alpha-value>)",
        },

        // ----- legacy aliases (resolve to the v3.0 aged-gold palette) -----
        // OKLCH triples are the SAME values tokens.css §2 commits to. Using
        // literals (rather than var(--accent)) so callers can opacity-modify
        // via Tailwind's `/N` syntax — `border-gold/20`, `bg-gold/10`, …
        // Without `<alpha-value>` Tailwind 3.4 cannot slice a `var()` color.
        gold: {
          // --color-gold = oklch(0.72 0.135 82)
          DEFAULT: "oklch(0.72 0.135 82 / <alpha-value>)",
          // --color-gold-soft = oklch(0.82 0.090 82)
          light: "oklch(0.82 0.090 82 / <alpha-value>)",
          // --color-gold-deep = oklch(0.58 0.130 78)
          dark: "oklch(0.58 0.130 78 / <alpha-value>)",
          50: "oklch(0.98 0.005 80 / <alpha-value>)",
          100: "oklch(0.95 0.006 80 / <alpha-value>)",
          200: "oklch(0.90 0.008 80 / <alpha-value>)",
          300: "oklch(0.82 0.090 82 / <alpha-value>)",
          400: "oklch(0.82 0.090 82 / <alpha-value>)",
          500: "oklch(0.72 0.135 82 / <alpha-value>)",
          600: "oklch(0.58 0.130 78 / <alpha-value>)",
          700: "oklch(0.58 0.130 78 / <alpha-value>)",
          // --color-ink-soft = oklch(0.22 0.020 80)
          800: "oklch(0.22 0.020 80 / <alpha-value>)",
          // --color-ink = oklch(0.16 0.018 80)
          900: "oklch(0.16 0.018 80 / <alpha-value>)",
        },
        // `bg-dark`, `bg-dark-light`, `bg-dark-lighter` — legacy "dark"
        // surface family. v3.0 maps to bone / parchment / soft neutral
        // (the light luxury surface stack).
        dark: {
          // --color-bone = oklch(0.97 0.008 80) (== --bg)
          DEFAULT: "oklch(0.97 0.008 80 / <alpha-value>)",
          // --color-parchment = oklch(0.91 0.024 78) (== --bg-alt)
          light: "oklch(0.91 0.024 78 / <alpha-value>)",
          // --color-neutral-100 = oklch(0.95 0.006 80)
          lighter: "oklch(0.95 0.006 80 / <alpha-value>)",
        },
        // Legacy `text-gray-N` / `bg-gray-N` — drop onto the tinted neutral
        // scale. Same OKLCH values as `neutral.*` above.
        gray: {
          50: "oklch(0.98 0.005 80 / <alpha-value>)",
          100: "oklch(0.95 0.006 80 / <alpha-value>)",
          200: "oklch(0.90 0.008 80 / <alpha-value>)",
          300: "oklch(0.82 0.010 80 / <alpha-value>)",
          400: "oklch(0.70 0.012 80 / <alpha-value>)",
          500: "oklch(0.55 0.013 80 / <alpha-value>)",
        },

        // ----- legacy named roles -----
        background: "var(--bg)",
        foreground: "var(--fg)",
        muted: {
          DEFAULT: "var(--bg-alt)",
          foreground: "var(--fg-muted)",
        },
      },
      fontFamily: {
        // The `--font-display` / `--font-body` / `--font-micro` variables are
        // bound on <body> by next/font in src/app/layout.tsx — those bindings
        // win on the body subtree (where all rendered content lives). Fallbacks
        // mirror the chains in tokens.css for the pre-hydration paint.
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        micro: ["var(--font-micro)", "system-ui", "sans-serif"],
        // Legacy aliases — `font-playfair` and `font-poppins` keep compiling.
        playfair: ["var(--font-display)", "Georgia", "serif"],
        poppins: ["var(--font-body)", "Georgia", "serif"],
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        gradient: "gradient 8s ease infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-gold": {
          "0%, 100%": {
            boxShadow: "0 0 20px oklch(0.72 0.135 82 / 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px oklch(0.72 0.135 82 / 0.6)",
          },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-soft) 50%, var(--accent) 100%)",
        "dark-gradient":
          "linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 50%, var(--bg) 100%)",
        "light-gradient":
          "linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 50%, var(--bg) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
