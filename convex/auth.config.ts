/**
 * Convex authentication providers.
 *
 * Without this file, `ctx.auth.getUserIdentity()` always returns null and
 * every request is anonymous. Set CLERK_JWT_ISSUER_DOMAIN on the Convex
 * deployment (`npx convex env set CLERK_JWT_ISSUER_DOMAIN https://...`) to
 * the Frontend API URL of your Clerk instance, and create a JWT template
 * named "convex" in the Clerk dashboard (see docs/integrations.md).
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
