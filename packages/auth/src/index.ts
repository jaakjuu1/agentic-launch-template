import { type Profile, type Role, roleSchema } from "@launch/domain";
import { z } from "zod";

export const authBootstrapSchema = z.object({
  profile: z.custom<Profile>(),
  isAuthenticated: z.boolean(),
  isOperator: z.boolean(),
});

export const operatorClaimKey = "app:role";
export const adminEmailSuffixes = ["@launchops.internal", "@example.com"];

export function resolveRole(input: string | null | undefined): Role {
  return roleSchema.catch("consumer").parse(input ?? "consumer");
}

export function isOperatorRole(role: Role) {
  return role === "operator" || role === "admin";
}

export function isTrustedOperatorEmail(email: string) {
  return adminEmailSuffixes.some((suffix) => email.endsWith(suffix));
}

export function deriveRoleFromClaims(input: {
  clerkPublicMetadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const metadataRole = input.clerkPublicMetadata?.[operatorClaimKey];
  const role = resolveRole(
    typeof metadataRole === "string" ? metadataRole : undefined,
  );

  if (role !== "consumer") {
    return role;
  }

  return input.email && isTrustedOperatorEmail(input.email)
    ? "operator"
    : "consumer";
}
