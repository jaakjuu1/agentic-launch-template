import {
  isClerkAPIResponseError,
  useAuth,
  useSignIn,
  useSignUp,
} from "@clerk/clerk-expo";
import {
  AppScreen,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Text,
} from "@launch/ui-native";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ErrorText } from "@/components/status-blocks";
import { useAppMode } from "@/lib/app-mode";
import { getErrorMessage } from "@/lib/errors";

function clerkErrorMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors[0];
    return first?.longMessage ?? first?.message ?? getErrorMessage(error);
  }

  return getErrorMessage(error);
}

function isUnknownIdentifier(error: unknown): boolean {
  return (
    isClerkAPIResponseError(error) &&
    error.errors.some((item) => item.code === "form_identifier_not_found")
  );
}

/**
 * Single-screen Clerk email + verification-code flow. Tries sign-in
 * first; unknown addresses transparently fall back to sign-up. Both
 * paths use the standard email_code strategy.
 */
function ClerkSignIn() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, setActive, signIn } = useSignIn();
  const {
    isLoaded: signUpLoaded,
    setActive: setSignUpActive,
    signUp,
  } = useSignUp();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const clerkReady = signInLoaded && signUpLoaded && signIn && signUp;

  const requestCode = async () => {
    const address = email.trim().toLowerCase();
    if (address.length === 0 || pending || !clerkReady) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      try {
        const attempt = await signIn.create({ identifier: address });
        const factor = attempt.supportedFirstFactors?.find(
          (candidate) => candidate.strategy === "email_code",
        );
        if (!factor) {
          throw new Error(
            "Email code sign-in is not enabled for this Clerk instance.",
          );
        }
        await signIn.prepareFirstFactor({
          emailAddressId: factor.emailAddressId,
          strategy: "email_code",
        });
        setFlow("signIn");
      } catch (signInError) {
        if (!isUnknownIdentifier(signInError)) {
          throw signInError;
        }
        // No account for this address yet — create one instead.
        await signUp.create({ emailAddress: address });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setFlow("signUp");
      }
      setCode("");
      setStep("code");
    } catch (requestError) {
      setError(clerkErrorMessage(requestError));
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async () => {
    const value = code.trim();
    if (value.length === 0 || pending || !clerkReady) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      if (flow === "signIn") {
        const result = await signIn.attemptFirstFactor({
          code: value,
          strategy: "email_code",
        });
        if (result.status !== "complete") {
          throw new Error(
            `Sign-in needs another step (${result.status ?? "unknown"}).`,
          );
        }
        await setActive({ session: result.createdSessionId });
      } else {
        const result = await signUp.attemptEmailAddressVerification({
          code: value,
        });
        if (result.status !== "complete") {
          throw new Error(
            `Sign-up needs another step (${result.status ?? "unknown"}).`,
          );
        }
        await setSignUpActive({ session: result.createdSessionId });
      }
      router.replace("/(tabs)");
    } catch (verifyError) {
      setError(clerkErrorMessage(verifyError));
    } finally {
      setPending(false);
    }
  };

  return (
    <AppScreen>
      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Sign in
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Continue with your email
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          <CardDescription className="text-base leading-7">
            {step === "email"
              ? "We will email you a one-time code. New addresses get an account automatically."
              : `Enter the 6-digit code we sent to ${email.trim().toLowerCase()}.`}
          </CardDescription>

          {step === "email" ? (
            <View className="gap-3">
              <Input
                autoCapitalize="none"
                autoComplete="email"
                className="rounded-2xl"
                editable={!pending}
                inputMode="email"
                onChangeText={setEmail}
                onSubmitEditing={() => void requestCode()}
                placeholder="you@example.com"
                value={email}
              />
              <Button
                className="rounded-full"
                onPress={() => void requestCode()}
              >
                <Text>
                  {pending
                    ? "Sending code…"
                    : clerkReady
                      ? "Email me a code"
                      : "Loading sign-in…"}
                </Text>
              </Button>
            </View>
          ) : (
            <View className="gap-3">
              <Input
                autoCapitalize="none"
                autoComplete="one-time-code"
                className="rounded-2xl"
                editable={!pending}
                inputMode="numeric"
                onChangeText={setCode}
                onSubmitEditing={() => void verifyCode()}
                placeholder="123456"
                value={code}
              />
              <Button
                className="rounded-full"
                onPress={() => void verifyCode()}
              >
                <Text>{pending ? "Verifying…" : "Verify and continue"}</Text>
              </Button>
              <View className="flex-row justify-between">
                <Pressable disabled={pending} onPress={() => setStep("email")}>
                  <Text className="text-sm font-semibold text-foreground">
                    Use a different email
                  </Text>
                </Pressable>
                <Pressable
                  disabled={pending}
                  onPress={() => void requestCode()}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    Resend code
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <ErrorText message={error} />
        </CardContent>
      </Card>
    </AppScreen>
  );
}

export default function SignInScreen() {
  const mode = useAppMode();

  // Sign-in only exists in Clerk mode; other modes have no accounts.
  if (mode !== "clerk") {
    return <Redirect href="/(tabs)" />;
  }

  return <ClerkSignIn />;
}
