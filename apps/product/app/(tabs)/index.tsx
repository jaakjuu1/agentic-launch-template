import { api } from "@launch/convex/_generated/api";
import { colors } from "@launch/design-tokens";
import { seedPreview } from "@launch/domain";
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
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { MetricCard } from "@/components/metric-card";
import { ScreenBoundary } from "@/components/screen-boundary";
import {
  EmptyText,
  ErrorText,
  LoadingCard,
  StatusBadge,
} from "@/components/status-blocks";
import { useAppMode } from "@/lib/app-mode";
import { resolveActiveTier } from "@/lib/entitlements";
import { getErrorMessage } from "@/lib/errors";
import { dashboardStats, referenceEntitlements } from "@/lib/reference-data";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

type DashboardData = FunctionReturnType<typeof api.bootstrap.dashboard>;
type ApprovalDoc = DashboardData["approvals"][number];

function HeroCard() {
  const router = useRouter();

  return (
    <View className="rounded-[32px] bg-foreground px-6 py-7">
      <Text className="text-xs uppercase tracking-[2px] text-secondary">
        Launch template
      </Text>
      <Text className="mt-3 text-4xl font-semibold leading-[44px] text-primary-foreground">
        Agentic productivity, built for app-store launch.
      </Text>
      <Text className="mt-3 text-base leading-7 text-background">
        Shared mobile + web foundation, durable agent workflows, approvals,
        billing, and operator tooling from day one.
      </Text>
      <View className="mt-5 flex-row flex-wrap gap-3">
        <Button
          className="rounded-full"
          onPress={() => router.push("/paywall")}
        >
          <Text>Open premium flow</Text>
        </Button>
      </View>
    </View>
  );
}

function EntitlementCard({ activeTier }: { activeTier: string }) {
  const router = useRouter();

  return (
    <Card className="gap-3 rounded-3xl py-5">
      <CardHeader className="gap-3 px-5">
        <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
          Revenue
        </Text>
        <CardTitle className="text-[28px] leading-tight">
          Entitlements stay canonical in Convex
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-3 px-5">
        <CardDescription className="text-base leading-7">
          Web checkout and mobile purchases reconcile into one durable
          entitlement model.
        </CardDescription>
        <View className="flex-row items-center justify-between rounded-2xl bg-secondary/40 px-4 py-3">
          <Text className="text-sm font-medium text-foreground">
            Active tier
          </Text>
          <Text className="text-base font-semibold uppercase tracking-[1.4px] text-primary">
            {activeTier}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-3">
          <Button
            className="rounded-full"
            onPress={() => router.push("/settings")}
            variant="outline"
          >
            <Text>Settings</Text>
          </Button>
          <Button
            className="rounded-full"
            onPress={() => router.push("/support")}
            variant="outline"
          >
            <Text>Support</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}

function ApprovalRow({ approval }: { approval: ApprovalDoc }) {
  const decideApproval = useMutation(api.approvals.decideApproval);
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: "approved" | "rejected") => {
    if (busy !== null) {
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      await decideApproval({ approvalId: approval._id, decision });
    } catch (decisionError) {
      setError(getErrorMessage(decisionError));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="gap-3 rounded-2xl bg-popover/80 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-lg font-semibold text-foreground">
          {approval.title}
        </Text>
        <StatusBadge
          label={`${approval.riskLevel} risk`}
          tone={approval.riskLevel === "low" ? "neutral" : "warning"}
        />
      </View>
      <Text className="text-sm leading-6 text-muted-foreground">
        {approval.description}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        <Button
          className="rounded-full"
          onPress={() => void decide("approved")}
        >
          <Text>{busy === "approved" ? "Approving…" : "Approve"}</Text>
        </Button>
        <Button
          className="rounded-full"
          disabled={busy !== null}
          onPress={() => void decide("rejected")}
          variant="outline"
        >
          <Text>{busy === "rejected" ? "Rejecting…" : "Reject"}</Text>
        </Button>
      </View>
      <ErrorText message={error} />
    </Card>
  );
}

const goalPriorities = ["low", "medium", "high"] as const;
type GoalPriority = (typeof goalPriorities)[number];

function GoalQuickForm() {
  const createGoal = useMutation(api.goals.createGoal);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const submit = async () => {
    const value = title.trim();
    if (value.length === 0 || pending) {
      return;
    }
    setPending(true);
    setError(null);
    setCreated(null);
    try {
      await createGoal({ priority, title: value });
      setCreated(value);
      setTitle("");
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setPending(false);
    }
  };

  return (
    <View className="gap-3">
      <Input
        className="rounded-2xl"
        editable={!pending}
        onChangeText={setTitle}
        onSubmitEditing={() => void submit()}
        placeholder="New goal title"
        value={title}
      />
      <View className="flex-row gap-2">
        {goalPriorities.map((option) => (
          <Pressable
            key={option}
            className={`rounded-full px-4 py-2 ${
              priority === option ? "bg-foreground" : "bg-muted"
            }`}
            onPress={() => setPriority(option)}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-[1.4px] ${
                priority === option
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button className="rounded-full" onPress={() => void submit()}>
        <Text>{pending ? "Creating…" : "Create goal"}</Text>
      </Button>
      {created !== null ? (
        <Text className="text-sm leading-6 text-success">
          Goal “{created}” created.
        </Text>
      ) : null}
      <ErrorText message={error} />
    </View>
  );
}

function LiveDashboard() {
  const enabled = useLiveQueriesEnabled();
  const dashboard = useQuery(api.bootstrap.dashboard, enabled ? {} : "skip");
  const entitlements = useQuery(
    api.billing.listEntitlements,
    enabled ? {} : "skip",
  );

  if (dashboard === undefined) {
    return <LoadingCard title="Production posture" />;
  }

  const pendingApprovals = dashboard.approvals.filter(
    (approval) => approval.status === "pending",
  );
  const stats = [
    {
      label: "Active goals",
      value: dashboard.goals.filter((goal) => goal.status === "active").length,
    },
    { label: "Projects", value: dashboard.projects.length },
    {
      label: "Artifacts ready",
      value: dashboard.artifacts.filter(
        (artifact) => artifact.status === "ready",
      ).length,
    },
    { label: "Pending approvals", value: pendingApprovals.length },
  ];

  return (
    <>
      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            {`Welcome, ${dashboard.profile?.firstName ?? "there"}`}
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Production posture
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          <View className="flex-row flex-wrap gap-3">
            {stats.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={String(item.value)}
              />
            ))}
          </View>
          {dashboard.profile === null ? (
            <View className="flex-row items-center gap-3">
              <ActivityIndicator color={colors.accent} />
              <Text className="text-sm leading-6 text-muted-foreground">
                Setting up your workspace…
              </Text>
            </View>
          ) : null}
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Approvals
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Human-in-the-loop queue
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          {pendingApprovals.length === 0 ? (
            <EmptyText message="No pending approvals — risky agent actions will wait here for your decision." />
          ) : (
            <View className="gap-3">
              {pendingApprovals.map((approval) => (
                <ApprovalRow approval={approval} key={approval._id} />
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Quick actions
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Capture the next goal
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          <GoalQuickForm />
        </CardContent>
      </Card>

      <EntitlementCard activeTier={resolveActiveTier(entitlements ?? [])} />
    </>
  );
}

function OfflineDashboard() {
  return (
    <>
      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            {`Welcome, ${seedPreview.profile.firstName}`}
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Production posture
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          <View className="flex-row flex-wrap gap-3">
            {dashboardStats.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </CardContent>
      </Card>
      <EntitlementCard activeTier={referenceEntitlements.activeTier} />
    </>
  );
}

export default function HomeScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      <View className="gap-6">
        <HeroCard />
        {mode === "offline" ? (
          <OfflineDashboard />
        ) : (
          <ScreenBoundary>
            <LiveDashboard />
          </ScreenBoundary>
        )}
      </View>
    </AppScreen>
  );
}
