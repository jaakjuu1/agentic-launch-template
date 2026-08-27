const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/**
 * Extract a human-readable message from an unknown error. Convex server
 * errors arrive as
 * `[CONVEX ...] [Request ID: ...] Server Error Uncaught Error: <message>
 *  at handler (...)` — strip the envelope so users see the actual reason.
 */
export function getErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : FALLBACK_MESSAGE;

  const marker = "Uncaught Error:";
  const markerIndex = raw.lastIndexOf(marker);
  const unwrapped =
    markerIndex >= 0 ? raw.slice(markerIndex + marker.length) : raw;
  const withoutStack = unwrapped.replace(/\n\s*at .*$/s, "");
  const trimmed = withoutStack.trim();

  return trimmed.length > 0 ? trimmed : FALLBACK_MESSAGE;
}
