/** @type {import('tailwindcss').Config} */
module.exports = {
  // Semantic colors (bg-background, text-primary, ...) come from the
  // shared design-token preset — keep screens on those classes instead
  // of raw hex values.
  presets: [
    require("nativewind/preset"),
    require("@launch/design-tokens/tailwind-preset"),
  ],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "../../packages/ui-native/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  // Web-side enter/exit animations used by the dialog/overlay components.
  plugins: [require("tailwindcss-animate")],
};
