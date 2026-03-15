import { describe, expect, it } from "vitest";

import { Eyebrow, HeroButton, Stat, SurfaceCard } from "./index";

describe("ui-web exports", () => {
  it("exposes the shared web primitives", () => {
    expect(typeof SurfaceCard).toBe("function");
    expect(typeof Eyebrow).toBe("function");
    expect(typeof HeroButton).toBe("function");
    expect(typeof Stat).toBe("function");
  });
});
