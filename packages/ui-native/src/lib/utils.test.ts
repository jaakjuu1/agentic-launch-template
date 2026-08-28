import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind classes with last-wins semantics", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("bg-primary", "bg-destructive")).toBe("bg-destructive");
  });

  it("drops falsy segments and keeps conditional classes", () => {
    expect(cn("base", false && "hidden", undefined, "text-sm")).toBe(
      "base text-sm",
    );
  });
});
