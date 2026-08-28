import { api } from "@launch/convex/_generated/api";
import {
  AppScreen,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Text,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenBoundary } from "@/components/screen-boundary";
import {
  EmptyText,
  ErrorText,
  LoadingCard,
  StatusBadge,
} from "@/components/status-blocks";
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
    <Card
      className={cn(
        "gap-0 rounded-2xl p-4",
        unread ? "border-primary/40 bg-popover" : "bg-popover/60",
      )}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className={`flex-1 text-lg text-foreground ${
            unread ? "font-semibold" : "font-medium"
          }`}
        >
          {notification.title}
        </Text>
        <StatusBadge
          label={unread ? "unread" : notification.channel}
          tone={unread ? "warning" : "neutral"}
        />
      </View>
      <Text className="mt-2 text-base leading-7 text-muted-foreground">
        {notification.body}
      </Text>
      {unread ? (
        <Pressable
          className="mt-3"
          disabled={pending}
          onPress={() => void markRead()}
        >
          <Text className="text-sm font-semibold text-foreground">
            {pending ? "Marking…" : "Mark as read"}
          </Text>
        </Pressable>
      ) : null}
      <ErrorText message={error} />
    </Card>
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
    <Card className="gap-3 rounded-3xl py-5">
      <CardHeader className="gap-3 px-5">
        <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
          Inbox
        </Text>
        <CardTitle className="text-[28px] leading-tight">
          {unreadCount === 0
            ? "You're all caught up"
            : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-3 px-5">
        {unreadCount > 0 ? (
          <Button className="rounded-full" onPress={() => void markAll()}>
            <Text>{pending ? "Marking all…" : "Mark all read"}</Text>
          </Button>
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
      </CardContent>
    </Card>
  );
}

function OfflineNotifications() {
  return (
    <Card className="gap-3 rounded-3xl py-5">
      <CardHeader className="gap-3 px-5">
        <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
          Inbox
        </Text>
        <CardTitle className="text-[28px] leading-tight">
          Push, email, and in-app state stay aligned
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-3 px-5">
        <View className="gap-3">
          {referenceNotifications.map((notification) => (
            <Card
              key={notification.id}
              className="gap-0 rounded-2xl bg-popover/80 p-4"
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-lg font-semibold text-foreground">
                  {notification.title}
                </Text>
                <StatusBadge
                  label={notification.tone}
                  tone={notification.tone}
                />
              </View>
              <Text className="mt-2 text-base leading-7 text-muted-foreground">
                {notification.body}
              </Text>
            </Card>
          ))}
        </View>
      </CardContent>
    </Card>
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
