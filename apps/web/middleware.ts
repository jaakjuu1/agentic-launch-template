import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth middleware for the marketing + operator surface.
 *
 * The operator console is the only protected area of this app. Everything
 * else stays public and cacheable.
 *
 * IMPORTANT: this app must build and run with zero env vars (fresh template
 * clones, CI smoke builds). `clerkMiddleware` throws at request time when
 * Clerk keys are missing, so when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not
 * set we export a passthrough middleware instead. The /operator page then
 * renders its own setup card explaining which env vars to configure.
 */
const isProtectedRoute = createRouteMatcher(["/operator(.*)"]);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const authMiddleware = clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
  },
  { signInUrl: "/sign-in" },
);

function passthroughMiddleware(_request: NextRequest) {
  return NextResponse.next();
}

export default clerkConfigured ? authMiddleware : passthroughMiddleware;

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
