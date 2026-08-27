import { api } from "@launch/convex/_generated/api";
import {
  AppScreen,
  PrimaryButton,
  SectionCard,
  StatusPill,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText, LoadingCard } from "@/components/status-blocks";
import { useAppMode } from "@/lib/app-mode";
import { getErrorMessage } from "@/lib/errors";
import { referenceNotifications } from "@/lib/reference-data";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

type NotificationDoc = FunctionReturnType<
  typeof api.notifications.listNotifications
>[number];

function NotificationRow({ notification }: { notification: NotificationDoc }) {
  const markNotificationRead = useMutation(
    api.notifications.markNotificationRead,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unread = notification.readAt === undefined;

  const markRead = async () => {
    if (pending || !unread) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await markNotificationRead({ notificationId: notification._id });
    } catch (markError) {
      setError(getErrorMessage(markError));
    } finally {
      setPending(false);
    }
  };

  return (
    <View
      className={`rounded-[20px] border p-4 ${
        unread
          ? "border-[#ff6b35]/40 bg-white"
          : "border-[#16202a]/10 bg-white/60"
      }`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className={`flex-1 text-lg text-[#16202a] ${
            unread ? "font-semibold" : "font-medium"
          }`}
        >
          {notification.title}
        </Text>
        <StatusPill
          label={unread ? "unread" : notification.channel}
          tone={unread ? "warning" : "neutral"}
        />
      </View>
      <Text className="mt-2 text-base leading-7 text-[#5f6772]">
        {notification.body}
      </Text>
      {unread ? (
        <Pressable
          className="mt-3"
          disabled={pending}
          onPress={() => void markRead()}
        >
          <Text className="text-sm font-semibold text-[#16202a]">
            {pending ? "Marking…" : "Mark as read"}
          </Text>
        </Pressable>
      ) : null}
      <ErrorText message={error} />
    </View>
  );
}

function LiveNotifications() {
  const enabled = useLiveQueriesEnabled();
  const notifications = useQuery(
    api.notifications.listNotifications,
    enabled ? {} : "skip",
  );
  const markAllNotificationsRead = useMutation(
    api.notifications.markAllNotificationsRead,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (notifications === undefined) {
    return <LoadingCard title="Inbox" />;
  }

  const sorted = [...notifications].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const unreadCount = sorted.filter(
    (notification) => notification.readAt === undefined,
  ).length;

  const markAll = async () => {
    if (pending || unreadCount === 0) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await markAllNotificationsRead({});
    } catch (markError) {
      setError(getErrorMessage(markError));
    } finally {
      setPending(false);
    }
  };

  return (
    <SectionCard
      eyebrow="Inbox"
      title={
        unreadCount === 0
          ? "You're all caught up"
          : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
      }
    >
      {unreadCount > 0 ? (
        <PrimaryButton
          label={pending ? "Marking all…" : "Mark all read"}
          onPress={() => void markAll()}
        />
      ) : null}
      <ErrorText message={error} />
      {sorted.length === 0 ? (
        <EmptyText message="No notifications yet — workflow completions and approvals will land here." />
      ) : (
        <View className="gap-3">
          {sorted.map((notification) => (
            <NotificationRow
              key={notification._id}
              notification={notification}
            />
          ))}
        </View>
      )}
    </SectionCard>
  );
}

function OfflineNotifications() {
  return (
    <SectionCard
      eyebrow="Inbox"
      title="Push, email, and in-app state stay aligned"
    >
      <View className="gap-3">
        {referenceNotifications.map((notification) => (
          <View
            key={notification.id}
            className="rounded-[20px] border border-[#16202a]/10 bg-white/80 p-4"
          >
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-lg font-semibold text-[#16202a]">
                {notification.title}
              </Text>
              <StatusPill label={notification.tone} tone={notification.tone} />
            </View>
            <Text className="mt-2 text-base leading-7 text-[#5f6772]">
              {notification.body}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

export default function NotificationsScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      {mode === "offline" ? (
        <OfflineNotifications />
      ) : (
        <ScreenBoundary>
          <LiveNotifications />
        </ScreenBoundary>
      )}
    </AppScreen>
  );
}
