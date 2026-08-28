import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { colors, radii, spacing } from "./index";

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const stylesCss = readFileSync(path.join(packageRoot, "styles.css"), "utf8");

const require = createRequire(import.meta.url);
const preset = require(
  path.join(packageRoot, "tailwind-preset.cjs"),
) as {
  theme: { extend: { colors: Record<string, unknown> } };
};

function toKebab(value: string) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function hslStringToHex(value: string): string {
  const match = value.match(/hsl\((\d+) (\d+)% (\d+)%/);
  if (!match) {
    throw new Error(`Unparsable hsl value: ${value}`);
  }
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  const hueToRgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) =>
    Math.round(hueToRgb(p, q, t) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(h + 1 / 3)}${channel(h)}${channel(h - 1 / 3)}`;
}

function hexDistance(a: string, b: string): number {
  let max = 0;
  for (const offset of [1, 3, 5]) {
    max = Math.max(
      max,
      Math.abs(
        Number.parseInt(a.slice(offset, offset + 2), 16) -
          Number.parseInt(b.slice(offset, offset + 2), 16),
      ),
    );
  }
  return max;
}

function presetColor(key: string): string {
  const entry = preset.theme.extend.colors[key];
  const raw =
    typeof entry === "string"
      ? entry
      : (entry as Record<string, string>).DEFAULT;
  return hslStringToHex(raw);
}

/** Semantic preset name → token the value must equal. */
const semanticToToken: Record<string, keyof typeof colors> = {
  accent: "accentSoft",
  background: "background",
  border: "border",
  card: "card",
  destructive: "danger",
  foreground: "ink",
  input: "border",
  muted: "surfaceMuted",
  popover: "surface",
  primary: "accent",
  ring: "accent",
  secondary: "accentSoft",
  success: "success",
  warning: "warning",
};

describe("design tokens", () => {
  it("keeps styles.css color variables in sync with the TS palette", () => {
    for (const [name, hex] of Object.entries(colors)) {
      const variable = `--launch-color-${toKebab(name)}`;
      const match = stylesCss.match(
        new RegExp(`${variable}:\\s*(#[0-9a-fA-F]{3,8})`),
      );
      expect(match?.[1]?.toLowerCase(), `${variable} missing or drifted`).toBe(
        hex.toLowerCase(),
      );
    }
  });

  it("keeps the Tailwind preset's semantic colors in sync with the palette", () => {
    for (const [semantic, token] of Object.entries(semanticToToken)) {
      const fromPreset = presetColor(semantic);
      const fromTokens = colors[token];
      expect(
        hexDistance(fromPreset, fromTokens),
        `${semantic} (${fromPreset}) drifted from ${String(token)} (${fromTokens})`,
      ).toBeLessThanOrEqual(2);
    }
  });

  it("keeps styles.css radius variables in sync", () => {
    for (const [name, value] of Object.entries(radii)) {
      if (name === "sm") {
        continue; // sm radius is TS-only today
      }
      expect(stylesCss).toContain(`--launch-radius-${name}: ${value}px`);
    }
  });

  it("exposes a sane spacing scale", () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
    expect(spacing.lg).toBeLessThan(spacing.xl);
  });
});
