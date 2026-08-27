import { api } from "@launch/convex/_generated/api";
import { seedPreview } from "@launch/domain";
import {
  AppScreen,
  PrimaryButton,
  SectionCard,
  StatusPill,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { MetricCard } from "@/components/metric-card";
import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText, LoadingCard } from "@/components/status-blocks";
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
    <View className="rounded-[32px] bg-[#16202a] px-6 py-7">
      <Text className="text-xs uppercase tracking-[2px] text-[#ffd4c7]">
        Launch template
      </Text>
      <Text className="mt-3 text-4xl font-semibold leading-[44px] text-[#fffaf4]">
        Agentic productivity, built for app-store launch.
      </Text>
      <Text className="mt-3 text-base leading-7 text-[#f3e9dc]">
        Shared mobile + web foundation, durable agent workflows, approvals,
        billing, and operator tooling from day one.
      </Text>
      <View className="mt-5 flex-row flex-wrap gap-3">
        <PrimaryButton
          label="Open premium flow"
          onPress={() => router.push("/paywall")}
        />
      </View>
    </View>
  );
}

function EntitlementCard({ activeTier }: { activeTier: string }) {
  const router = useRouter();

  return (
    <SectionCard
      eyebrow="Revenue"
      title="Entitlements stay canonical in Convex"
    >
      <Text className="text-base leading-7 text-[#5f6772]">
        Web checkout and mobile purchases reconcile into one durable entitlement
        model.
      </Text>
      <View className="flex-row items-center justify-between rounded-[20px] bg-[#fff3eb] px-4 py-3">
        <Text className="text-sm font-medium text-[#16202a]">Active tier</Text>
        <Text className="text-base font-semibold uppercase tracking-[1.4px] text-[#ff6b35]">
          {activeTier}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <PrimaryButton
          label="Settings"
          onPress={() => router.push("/settings")}
        />
        <PrimaryButton
          label="Support"
          onPress={() => router.push("/support")}
        />
      </View>
    </SectionCard>
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
    <View className="gap-3 rounded-[20px] border border-[#16202a]/10 bg-white/80 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-lg font-semibold text-[#16202a]">
          {approval.title}
        </Text>
        <StatusPill
          label={`${approval.riskLevel} risk`}
          tone={approval.riskLevel === "low" ? "neutral" : "warning"}
        />
      </View>
      <Text className="text-sm leading-6 text-[#5f6772]">
        {approval.description}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        <PrimaryButton
          label={busy === "approved" ? "Approving…" : "Approve"}
          onPress={() => void decide("approved")}
        />
        <Pressable
          className="rounded-full border border-[#16202a]/20 px-5 py-3"
          disabled={busy !== null}
          onPress={() => void decide("rejected")}
        >
          <Text className="text-center font-semibold text-[#16202a]">
            {busy === "rejected" ? "Rejecting…" : "Reject"}
          </Text>
        </Pressable>
      </View>
      <ErrorText message={error} />
    </View>
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
      <TextInput
        className="rounded-[18px] border border-[#16202a]/10 bg-white px-4 py-3 text-base text-[#16202a]"
        editable={!pending}
        onChangeText={setTitle}
        onSubmitEditing={() => void submit()}
        placeholder="New goal title"
        placeholderTextColor="#7b838e"
        value={title}
      />
      <View className="flex-row gap-2">
        {goalPriorities.map((option) => (
          <Pressable
            key={option}
            className={`rounded-full px-4 py-2 ${
              priority === option ? "bg-[#16202a]" : "bg-[#e6e1d8]"
            }`}
            onPress={() => setPriority(option)}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-[1.4px] ${
                priority === option ? "text-[#fffaf4]" : "text-[#5f6772]"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton
        label={pending ? "Creating…" : "Create goal"}
        onPress={() => void submit()}
      />
      {created !== null ? (
        <Text className="text-sm leading-6 text-[#1b7f5b]">
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
      <SectionCard
        eyebrow={`Welcome, ${dashboard.profile?.firstName ?? "there"}`}
        title="Production posture"
      >
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
            <ActivityIndicator color="#ff6b35" />
            <Text className="text-sm leading-6 text-[#5f6772]">
              Setting up your workspace…
            </Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="Approvals" title="Human-in-the-loop queue">
        {pendingApprovals.length === 0 ? (
          <EmptyText message="No pending approvals — risky agent actions will wait here for your decision." />
        ) : (
          <View className="gap-3">
            {pendingApprovals.map((approval) => (
              <ApprovalRow approval={approval} key={approval._id} />
            ))}
          </View>
        )}
      </SectionCard>

      <SectionCard eyebrow="Quick actions" title="Capture the next goal">
        <GoalQuickForm />
      </SectionCard>

      <EntitlementCard activeTier={resolveActiveTier(entitlements ?? [])} />
    </>
  );
}

function OfflineDashboard() {
  return (
    <>
      <SectionCard
        eyebrow={`Welcome, ${seedPreview.profile.firstName}`}
        title="Production posture"
      >
        <View className="flex-row flex-wrap gap-3">
          {dashboardStats.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
            />
          ))}
        </View>
      </SectionCard>
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
