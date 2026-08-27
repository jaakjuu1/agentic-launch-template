import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { colors, radii, spacing } from "./index";

const stylesCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "styles.css"),
  "utf8",
);

function toKebab(value: string) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

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
