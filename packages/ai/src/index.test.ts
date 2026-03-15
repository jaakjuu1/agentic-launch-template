import { describe, expect, it } from "vitest";

import { toAuditTrail } from "./index";

describe("ai helpers", () => {
  it("maps tool runs into lightweight audit summaries", () => {
    const trail = toAuditTrail([
      {
        id: "tool_run_1",
        threadId: "thread_1",
        toolName: "send_email",
        description: "Send the launch reminder email.",
        status: "completed",
        args: {},
        createdAt: "2026-03-15T10:00:00.000Z",
        updatedAt: "2026-03-15T10:00:00.000Z",
      },
      {
        id: "tool_run_2",
        threadId: "thread_1",
        toolName: "publish_release",
        description: "Wait for human approval before publishing.",
        status: "requires_approval",
        args: {},
        createdAt: "2026-03-15T10:01:00.000Z",
        updatedAt: "2026-03-15T10:01:00.000Z",
      },
    ]);

    expect(trail).toEqual([
      {
        id: "tool_run_1",
        status: "completed",
        summary: "send_email: Send the launch reminder email.",
      },
      {
        id: "tool_run_2",
        status: "requires_approval",
        summary: "publish_release: Wait for human approval before publishing.",
      },
    ]);
  });
});
