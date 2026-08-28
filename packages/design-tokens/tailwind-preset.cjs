/**
 * Shared Tailwind preset: maps the design-token palette
 * (packages/design-tokens/src/index.ts) onto the semantic color names the
 * shadcn-style component kit in @launch/ui-native expects
 * (bg-background, text-foreground, bg-primary, ...).
 *
 * Values are literal `hsl(H S% L% / <alpha-value>)` strings so opacity
 * modifiers (bg-primary/90) work on native and web without CSS-variable
 * indirection. The HSL values MUST stay in sync with the hex palette —
 * `packages/design-tokens/src/index.test.ts` fails the build if they
 * drift. Dark mode: switch these to `hsl(var(--...))` CSS variables per
 * the react-native-reusables theming docs when you need it.
 *
 * Dependency-free on purpose: consumed with
 * `presets: [require("@launch/design-tokens/tailwind-preset")]`.
 */

// hex → "H S% L%" reference (validated by the sync test):
//   background   #f5efe6  36 43% 93%
//   foreground   #16202a  210 31% 13%   (ink)
//   card         #fffaf4  33 100% 98%
//   popover      #fffdf9  40 100% 99%   (surface)
//   primary      #ff6b35  16 100% 60%   (accent)
//   secondary    #ffd4c7  14 100% 89%   (accentSoft)
//   muted        #ece4d8  36 34% 89%    (surfaceMuted)
//   muted-fg     #5f6772  215 9% 41%    (muted)
//   destructive  #b3261e  3 71% 41%     (danger)
//   border/input #e3dcd0  38 25% 85%    (border)
//   success      #1b7f5b  158 65% 30%
//   warning      #b85c00  30 100% 36%

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "hsl(36 43% 93% / <alpha-value>)",
        foreground: "hsl(210 31% 13% / <alpha-value>)",
        card: {
          DEFAULT: "hsl(33 100% 98% / <alpha-value>)",
          foreground: "hsl(210 31% 13% / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(40 100% 99% / <alpha-value>)",
          foreground: "hsl(210 31% 13% / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(16 100% 60% / <alpha-value>)",
          foreground: "hsl(33 100% 98% / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(14 100% 89% / <alpha-value>)",
          foreground: "hsl(210 31% 13% / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(36 34% 89% / <alpha-value>)",
          foreground: "hsl(215 9% 41% / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(14 100% 89% / <alpha-value>)",
          foreground: "hsl(210 31% 13% / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(3 71% 41% / <alpha-value>)",
          foreground: "hsl(33 100% 98% / <alpha-value>)",
        },
        border: "hsl(38 25% 85% / <alpha-value>)",
        input: "hsl(38 25% 85% / <alpha-value>)",
        ring: "hsl(16 100% 60% / <alpha-value>)",
        success: "hsl(158 65% 30% / <alpha-value>)",
        warning: "hsl(30 100% 36% / <alpha-value>)",
      },
    },
  },
};
