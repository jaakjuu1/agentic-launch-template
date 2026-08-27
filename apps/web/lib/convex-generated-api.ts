/**
 * Typed facade for `@launch/convex/_generated/api`, wired up via the
 * tsconfig `paths` entry for that specifier.
 *
 * Why: the generated `api.d.ts` type-imports the entire Convex backend
 * source tree (`../agent.js`, `../schema.js`, …). Pulling those .ts files
 * into this app's TypeScript program drags the backend's own dependency
 * types (@convex-dev/agent, pdf-parse ambient declarations, a second copy
 * of convex) into the web typecheck, which breaks — and the backend
 * already typechecks under its own tsconfig.
 *
 * Runtime stays identical no matter how the bundler resolves the
 * specifier: the generated `api.js` is literally `export const api =
 * anyApi`, and that is exactly what this module exports. Only the types
 * are narrowed, hand-mirrored from `convex/operator.ts`.
 *
 * TODO: if the operator API grows, extend `WebVisibleApi` alongside it
 * (or replace this facade with generated types once the backend and web
 * dependency graphs are reconciled).
 */
import { anyApi, type FunctionReference } from "convex/server";

/** Structurally identical to Convex's `Id<"supportRequests">`. */
export type SupportRequestId = string & { __tableName: "supportRequests" };

export type SupportRequestStatus = "open" | "triaged" | "resolved";

export type OperatorOverview = {
  counts: {
    failedWorkflows: number;
    openSupportRequests: number;
    pendingApprovals: number;
    profiles: number;
  };
  recentFiles: Array<{
    _id: string;
    createdAt: string;
    fileName: string;
    mimeType: string;
    purpose: string;
    sizeBytes: number;
    status: string;
  }>;
  recentWorkflows: Array<{
    _id: string;
    createdAt: string;
    kind: string;
    lastError?: string;
    status: string;
  }>;
  supportQueue: Array<{
    _id: SupportRequestId;
    createdAt: string;
    status: SupportRequestStatus;
    subject: string;
  }>;
};

type WebVisibleApi = {
  operator: {
    overview: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      OperatorOverview
    >;
    updateSupportRequestStatus: FunctionReference<
      "mutation",
      "public",
      { status: SupportRequestStatus; supportRequestId: SupportRequestId },
      unknown
    >;
  };
};

export const api = anyApi as unknown as WebVisibleApi;
