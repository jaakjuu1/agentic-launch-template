import { describe, expect, it } from "vitest";

import { colors, gradients, radii, spacing, typography } from "./index";

describe("design tokens", () => {
  it("defines the launch palette and gradients", () => {
    expect(colors.accent).toBe("#ff6b35");
    expect(gradients.hero).toContain("#ffd4c7");
  });

  it("exposes spacing, radii, and typography for shared UI packages", () => {
    expect(spacing.xl).toBeGreaterThan(spacing.md);
    expect(radii.pill).toBeGreaterThan(radii.lg);
    expect(typography.display).toBe("Space Grotesk");
  });
});
