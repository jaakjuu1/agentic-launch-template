import { api } from "@launch/convex/_generated/api";
import type { Id } from "@launch/convex/_generated/dataModel";
import {
  AppScreen,
  PrimaryButton,
  SectionCard,
  StatusPill,
} from "@launch/ui-native";
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { startTransition, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

import { FileRow } from "@/components/file-row";
import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText, LoadingCard } from "@/components/status-blocks";
import { TargetFileRow } from "@/components/target-file-row";
import { UploadRow } from "@/components/upload-row";
import { useAppMode } from "@/lib/app-mode";
import { getErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/file-helpers";
import {
  type PickedLaunchFile,
  pickDocumentUpload,
  pickImageUpload,
} from "@/lib/file-picker";
import { referenceThread } from "@/lib/reference-data";
import { useFileUpload } from "@/lib/use-file-upload";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

type ThreadMessagesResult = FunctionReturnType<
  typeof api.agent.listThreadUiMessages
>;
type UiMessage = ThreadMessagesResult["page"][number];

/**
 * Messages come from @convex-dev/agent's listUIMessages. `text` is the
 * flattened convenience field; fall back to text parts and stay
 * defensive about shapes we do not model.
 */
function extractMessageText(message: UiMessage): string {
  if (typeof message.text === "string" && message.text.trim().length > 0) {
    return message.text;
  }

  const parts: ReadonlyArray<unknown> = Array.isArray(message.parts)
    ? message.parts
    : [];

  return parts
    .map((part) => {
      if (part !== null && typeof part === "object" && "type" in part) {
        const candidate = part as { text?: unknown; type?: unknown };
        if (candidate.type === "text" && typeof candidate.text === "string") {
          return candidate.text;
        }
      }
      return "";
    })
    .filter((text) => text.length > 0)
    .join("\n");
}

function MessageBubble({
  author,
  status,
  text,
}: {
  author: string;
  status?: string;
  text: string;
}) {
  return (
    <View
      className={`rounded-[20px] p-4 ${
        author === "assistant" ? "bg-[#fff3eb]" : "bg-white"
      }`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-xs uppercase tracking-[1.6px] text-[#5f6772]">
          {author}
        </Text>
        {status ? (
          <Text className="text-[11px] uppercase tracking-[1.4px] text-[#b85c00]">
            {status}
          </Text>
        ) : null}
      </View>
      <Text className="mt-2 text-base leading-7 text-[#16202a]">{text}</Text>
    </View>
  );
}

function LiveAssistant() {
  const enabled = useLiveQueriesEnabled();
  const [createdThreadId, setCreatedThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [pendingFileIds, setPendingFileIds] = useState<Array<Id<"files">>>([]);

  const createThread = useMutation(api.agent.createThread);
  const sendPrompt = useAction(api.agent.sendPrompt);
  const { removeUpload, uploadFile, uploads } = useFileUpload();

  const threads = useQuery(
    api.agent.listThreads,
    enabled ? { paginationOpts: { cursor: null, numItems: 1 } } : "skip",
  );
  const newestThread = threads?.page[0];
  const threadId = createdThreadId ?? newestThread?._id ?? null;

  const messagesPager = usePaginatedQuery(
    api.agent.listThreadUiMessages,
    enabled && threadId !== null ? { threadId } : "skip",
    { initialNumItems: 50 },
  );
  const threadFiles = useQuery(
    api.storage.listForTarget,
    enabled && threadId !== null
      ? { targetId: threadId, targetType: "agent_message" }
      : "skip",
  );

  if (!enabled || threads === undefined) {
    return <LoadingCard title="Assistant" />;
  }

  const messages = [...messagesPager.results].sort(
    (left, right) =>
      left.order - right.order || left.stepOrder - right.stepOrder,
  );

  const filesById = new Map(
    (threadFiles ?? []).map((file) => [file._id, file]),
  );
  const pendingFiles = pendingFileIds.flatMap((fileId) => {
    const file = filesById.get(fileId);
    return file === undefined ? [] : [file];
  });
  const stillProcessingCount = pendingFiles.filter(
    (file) => file.status !== "ready",
  ).length;
  const inFlightUploads = uploads.filter((upload) => upload.status !== "ready");

  const ensureThreadId = async (): Promise<string> => {
    if (threadId !== null) {
      return threadId;
    }
    const created = await createThread({ title: "Mobile conversation" });
    setCreatedThreadId(created.threadId);
    return created.threadId;
  };

  const attach = async (
    picker: () => Promise<PickedLaunchFile | null>,
  ): Promise<void> => {
    setAttachError(null);
    try {
      const picked = await picker();
      if (picked === null) {
        return;
      }
      const targetThreadId = await ensureThreadId();
      const fileId = await uploadFile(picked, {
        purpose: "assistant_attachment",
        targetId: targetThreadId,
        targetType: "agent_message",
      });
      if (fileId !== null) {
        setPendingFileIds((current) => [...current, fileId]);
      }
    } catch (error) {
      setAttachError(getErrorMessage(error));
    }
  };

  const onSend = async () => {
    const prompt = draft.trim();
    if (prompt.length === 0 || sending) {
      return;
    }

    setSending(true);
    setSendError(null);
    setPendingPrompt(prompt);
    try {
      const targetThreadId = await ensureThreadId();
      const readyIds = pendingFiles
        .filter((file) => file.status === "ready")
        .map((file) => file._id);
      await sendPrompt({
        attachmentFileIds: readyIds.length > 0 ? readyIds : undefined,
        prompt,
        threadId: targetThreadId,
      });
      setDraft("");
      setPendingFileIds((current) =>
        current.filter((fileId) => !readyIds.includes(fileId)),
      );
    } catch (error) {
      setSendError(getErrorMessage(error));
    } finally {
      setSending(false);
      setPendingPrompt(null);
    }
  };

  return (
    <SectionCard
      eyebrow="Persistent thread"
      title={newestThread?.title ?? "New conversation"}
    >
      <Text className="text-base leading-7 text-[#5f6772]">
        {newestThread?.summary ??
          "Durable Convex Agent thread — messages, files, and approvals persist across devices."}
      </Text>

      {messagesPager.status === "CanLoadMore" ? (
        <PrimaryButton
          label="Load earlier messages"
          onPress={() => messagesPager.loadMore(50)}
        />
      ) : null}

      <View className="gap-3">
        {threadId !== null && messagesPager.status === "LoadingFirstPage" ? (
          <View className="flex-row items-center gap-3 py-2">
            <ActivityIndicator color="#ff6b35" />
            <Text className="text-sm text-[#5f6772]">Loading messages…</Text>
          </View>
        ) : messages.length === 0 && pendingPrompt === null ? (
          <EmptyText message="No messages yet — ask for a plan, a draft, or an approval-gated workflow." />
        ) : (
          messages
            .filter((message) => message.role !== "system")
            .map((message) => {
              const text = extractMessageText(message);
              if (text.length === 0) {
                return null;
              }
              return (
                <MessageBubble
                  author={message.role}
                  key={message.key}
                  status={message.status === "failed" ? "failed" : undefined}
                  text={text}
                />
              );
            })
        )}
        {pendingPrompt !== null ? (
          <MessageBubble author="user" status="sending…" text={pendingPrompt} />
        ) : null}
        {sending ? (
          <View className="flex-row items-center gap-3 rounded-[20px] bg-[#fff3eb] p-4">
            <ActivityIndicator color="#ff6b35" />
            <Text className="text-sm text-[#5f6772]">
              Assistant is thinking…
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-3">
        {pendingFiles.map((file) => (
          <TargetFileRow file={file} key={file._id} />
        ))}
        {inFlightUploads.map((upload) => (
          <UploadRow key={upload.key} onRemove={removeUpload} upload={upload} />
        ))}
        {stillProcessingCount > 0 ? (
          <Text className="text-sm leading-6 text-[#b85c00]">
            {stillProcessingCount} attachment
            {stillProcessingCount === 1 ? " is" : "s are"} still processing and
            will be skipped until ready.
          </Text>
        ) : null}
        <ErrorText message={attachError} />
        <View className="flex-row flex-wrap gap-3">
          <PrimaryButton
            label="Add document"
            onPress={() => void attach(pickDocumentUpload)}
          />
          <PrimaryButton
            label="Add image"
            onPress={() => void attach(pickImageUpload)}
          />
        </View>
      </View>

      <View className="gap-3">
        <TextInput
          className="min-h-[96px] rounded-[20px] border border-[#16202a]/10 bg-white px-4 py-4 text-base text-[#16202a]"
          editable={!sending}
          multiline
          onChangeText={setDraft}
          placeholder="Queue a prompt, draft a brief, or request an approval-aware workflow"
          placeholderTextColor="#7b838e"
          textAlignVertical="top"
          value={draft}
        />
        <PrimaryButton
          label={sending ? "Sending…" : "Send"}
          onPress={() => void onSend()}
        />
        <ErrorText message={sendError} />
      </View>
    </SectionCard>
  );
}

/**
 * Offline fallback: the original clearly-simulated conversation. Nothing
 * here touches the network; the top banner marks the whole app as an
 * offline demo.
 */
function OfflineAssistant() {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<
    Array<(typeof referenceThread.attachments)[number]>
  >([...referenceThread.attachments]);
  const [messages, setMessages] = useState(referenceThread.messages);

  const simulateAttachment = (file: PickedLaunchFile, detail: string) => {
    startTransition(() => {
      setAttachments((current) => [
        ...current,
        {
          detail,
          fileName: file.fileName,
          id: `assistant_upload_${current.length}`,
          sizeBytes: file.sizeBytes,
          status: "Queued (simulated)",
        },
      ]);
    });
  };

  return (
    <SectionCard eyebrow="Offline demo thread" title={referenceThread.title}>
      <Text className="text-base leading-7 text-[#5f6772]">
        {referenceThread.summary}
      </Text>
      <StatusPill label="Simulated — no backend connected" tone="warning" />
      <View className="gap-3">
        {attachments.map((attachment) => (
          <FileRow
            key={attachment.id}
            detail={`${attachment.detail} · ${formatFileSize(
              attachment.sizeBytes,
            )}`}
            label={attachment.fileName}
            status={attachment.status}
          />
        ))}
      </View>
      <View className="gap-3">
        {messages.map((message) => (
          <MessageBubble
            author={message.role}
            key={message.id}
            text={message.content}
          />
        ))}
      </View>
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-3">
          <PrimaryButton
            label="Add document"
            onPress={() => {
              void pickDocumentUpload().then((file) => {
                if (file) {
                  simulateAttachment(file, "Assistant attachment · simulated");
                }
              });
            }}
          />
          <PrimaryButton
            label="Add image"
            onPress={() => {
              void pickImageUpload().then((file) => {
                if (file) {
                  simulateAttachment(file, "Assistant image · simulated");
                }
              });
            }}
          />
        </View>
        <TextInput
          className="min-h-[96px] rounded-[20px] border border-[#16202a]/10 bg-white px-4 py-4 text-base text-[#16202a]"
          multiline
          onChangeText={setDraft}
          placeholder="Queue a prompt, draft a brief, or request an approval-aware workflow"
          placeholderTextColor="#7b838e"
          textAlignVertical="top"
          value={draft}
        />
        <PrimaryButton
          label="Simulate send"
          onPress={() => {
            const prompt = draft.trim();
            if (prompt.length === 0) {
              return;
            }

            startTransition(() => {
              setMessages((current) => [
                ...current,
                {
                  id: `message_user_${current.length}`,
                  role: "user",
                  content: prompt,
                },
                {
                  id: `message_assistant_${current.length}`,
                  role: "assistant",
                  content: `Simulated reply. Set EXPO_PUBLIC_CONVEX_URL to persist this prompt to Convex, attach ${attachments.length} files, and get real model responses.`,
                },
              ]);
              setDraft("");
            });
          }}
        />
      </View>
    </SectionCard>
  );
}

export default function AssistantScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      {mode === "offline" ? (
        <OfflineAssistant />
      ) : (
        <ScreenBoundary>
          <LiveAssistant />
        </ScreenBoundary>
      )}
    </AppScreen>
  );
}
