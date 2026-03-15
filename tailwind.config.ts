import type { Config } from "tailwindcss";

export default {
  content: [
    "./apps/product/app/**/*.{ts,tsx}",
    "./apps/product/components/**/*.{ts,tsx}",
    "./apps/product/providers/**/*.{ts,tsx}",
    "./packages/ui-native/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
