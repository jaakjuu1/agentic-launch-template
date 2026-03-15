import { z } from "zod";

const emptyToUndefined = (value: string | undefined) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
};

const publicBoolean = z
  .string()
  .optional()
  .transform((value) => value === "true");

export const productEnvSchema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_CONVEX_URL: z.string().url().optional(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
  EXPO_PUBLIC_REVENUECAT_APPLE_KEY: z.string().optional(),
  EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: z.string().optional(),
  EXPO_PUBLIC_ENABLE_MOCKS: publicBoolean.optional(),
});

export const webEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const convexEnvSchema = z.object({
  CLERK_JWT_ISSUER_DOMAIN: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  POSTHOG_PROJECT_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export function parseProductEnv(env: Record<string, string | undefined>) {
  return productEnvSchema.parse({
    ...env,
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: emptyToUndefined(
      env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    EXPO_PUBLIC_CONVEX_URL: emptyToUndefined(env.EXPO_PUBLIC_CONVEX_URL),
    EXPO_PUBLIC_POSTHOG_KEY: emptyToUndefined(env.EXPO_PUBLIC_POSTHOG_KEY),
    EXPO_PUBLIC_REVENUECAT_APPLE_KEY: emptyToUndefined(
      env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
    ),
    EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: emptyToUndefined(
      env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
    ),
    EXPO_PUBLIC_SENTRY_DSN: emptyToUndefined(env.EXPO_PUBLIC_SENTRY_DSN),
  });
}

export function parseWebEnv(env: Record<string, string | undefined>) {
  return webEnvSchema.parse({
    ...env,
    CLERK_SECRET_KEY: emptyToUndefined(env.CLERK_SECRET_KEY),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: emptyToUndefined(
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    NEXT_PUBLIC_CONVEX_URL: emptyToUndefined(env.NEXT_PUBLIC_CONVEX_URL),
    NEXT_PUBLIC_POSTHOG_KEY: emptyToUndefined(env.NEXT_PUBLIC_POSTHOG_KEY),
    RESEND_API_KEY: emptyToUndefined(env.RESEND_API_KEY),
    SENTRY_DSN: emptyToUndefined(env.SENTRY_DSN),
    STRIPE_SECRET_KEY: emptyToUndefined(env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: emptyToUndefined(env.STRIPE_WEBHOOK_SECRET),
  });
}

export function parseConvexEnv(env: Record<string, string | undefined>) {
  return convexEnvSchema.parse({
    ...env,
    CLERK_JWT_ISSUER_DOMAIN: emptyToUndefined(env.CLERK_JWT_ISSUER_DOMAIN),
    CLERK_WEBHOOK_SECRET: emptyToUndefined(env.CLERK_WEBHOOK_SECRET),
    OPENAI_API_KEY: emptyToUndefined(env.OPENAI_API_KEY),
    POSTHOG_PROJECT_API_KEY: emptyToUndefined(env.POSTHOG_PROJECT_API_KEY),
    RESEND_API_KEY: emptyToUndefined(env.RESEND_API_KEY),
    REVENUECAT_WEBHOOK_SECRET: emptyToUndefined(env.REVENUECAT_WEBHOOK_SECRET),
    SENTRY_DSN: emptyToUndefined(env.SENTRY_DSN),
    STRIPE_SECRET_KEY: emptyToUndefined(env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: emptyToUndefined(env.STRIPE_WEBHOOK_SECRET),
  });
}
