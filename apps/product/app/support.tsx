import { productConfig } from "@launch/config/product";
import { api } from "@launch/convex/_generated/api";
import type { Id } from "@launch/convex/_generated/dataModel";
import {
  AppScreen,
  PrimaryButton,
  SectionCard,
  StatusPill,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText } from "@/components/status-blocks";
import { TargetFileRow } from "@/components/target-file-row";
import { UploadRow } from "@/components/upload-row";
import { useAppMode } from "@/lib/app-mode";
import { getErrorMessage } from "@/lib/errors";
import {
  type PickedLaunchFile,
  pickDocumentUpload,
  pickImageUpload,
} from "@/lib/file-picker";
import { useFileUpload } from "@/lib/use-file-upload";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

const inputClassName =
  "rounded-[18px] border border-[#16202a]/10 bg-white px-4 py-3 text-base text-[#16202a]";

/** Attachment manager for a support request that already exists. */
function SupportAttachments({
  requestId,
}: {
  requestId: Id<"supportRequests">;
}) {
  const enabled = useLiveQueriesEnabled();
  const files = useQuery(
    api.storage.listForTarget,
    enabled ? { targetId: requestId, targetType: "support_request" } : "skip",
  );
  const { removeUpload, uploadFile, uploads } = useFileUpload();
  const [attachError, setAttachError] = useState<string | null>(null);

  const attach = async (picker: () => Promise<PickedLaunchFile | null>) => {
    setAttachError(null);
    try {
      const picked = await picker();
      if (picked === null) {
        return;
      }
      await uploadFile(picked, {
        purpose: "support_attachment",
        targetId: requestId,
        targetType: "support_request",
      });
    } catch (error) {
      setAttachError(getErrorMessage(error));
    }
  };

  const inFlightUploads = uploads.filter((upload) => upload.status !== "ready");

  return (
    <View className="gap-3">
      <Text className="text-sm leading-6 text-[#5f6772]">
        Add screenshots or documents so operators can reproduce the issue.
      </Text>
      <View className="flex-row flex-wrap gap-3">
        <PrimaryButton
          label="Attach document"
          onPress={() => void attach(pickDocumentUpload)}
        />
        <PrimaryButton
          label="Attach screenshot"
          onPress={() => void attach(pickImageUpload)}
        />
      </View>
      <ErrorText message={attachError} />
      {inFlightUploads.map((upload) => (
        <UploadRow key={upload.key} onRemove={removeUpload} upload={upload} />
      ))}
      {(files ?? []).map((file) => (
        <TargetFileRow file={file} key={file._id} />
      ))}
    </View>
  );
}

function LiveSupport() {
  const createSupportRequest = useMutation(api.support.createSupportRequest);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<Id<"supportRequests"> | null>(
    null,
  );

  const submit = async () => {
    const subjectValue = subject.trim();
    const bodyValue = body.trim();
    if (pending) {
      return;
    }
    if (subjectValue.length === 0 || bodyValue.length === 0) {
      setError("Add a subject and a description before submitting.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const created = await createSupportRequest({
        body: bodyValue,
        subject: subjectValue,
      });
      setRequestId(created);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setPending(false);
    }
  };

  if (requestId !== null) {
    return (
      <>
        <StatusPill label="Request received" tone="success" />
        <Text className="text-base leading-7 text-[#5f6772]">
          Thanks — your request is now with our operators and you will get an
          email acknowledgement. You can attach files below to add context.
        </Text>
        <SupportAttachments requestId={requestId} />
        <PrimaryButton
          label="Start another request"
          onPress={() => {
            setRequestId(null);
            setSubject("");
            setBody("");
          }}
        />
      </>
    );
  }

  return (
    <>
      <Text className="text-base leading-7 text-[#5f6772]">
        Describe the problem and we will route it to an operator. Attachments
        can be added right after the request is created.
      </Text>
      <TextInput
        className={inputClassName}
        editable={!pending}
        onChangeText={setSubject}
        placeholder="Subject (e.g. Billing issue)"
        placeholderTextColor="#7b838e"
        value={subject}
      />
      <TextInput
        className="min-h-[120px] rounded-[18px] border border-[#16202a]/10 bg-white px-4 py-3 text-base text-[#16202a]"
        editable={!pending}
        multiline
        onChangeText={setBody}
        placeholder="What happened? What did you expect?"
        placeholderTextColor="#7b838e"
        textAlignVertical="top"
        value={body}
      />
      <PrimaryButton
        label={pending ? "Submitting…" : "Submit support request"}
        onPress={() => void submit()}
      />
      <ErrorText message={error} />
    </>
  );
}

function OfflineSupport() {
  return (
    <>
      <Text className="text-base leading-7 text-[#5f6772]">
        Support requests become first-class Convex records with email
        acknowledgements and operator routing.
      </Text>
      <EmptyText message="Offline demo — connect a Convex deployment to submit a real request." />
      <Text className="text-sm leading-6 text-[#5f6772]">
        You can always reach us directly at {productConfig.company.supportEmail}
        .
      </Text>
    </>
  );
}

export default function SupportScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      <SectionCard eyebrow="Support" title="Get help from an operator">
        {mode === "offline" ? (
          <OfflineSupport />
        ) : (
          <ScreenBoundary>
            <LiveSupport />
          </ScreenBoundary>
        )}
      </SectionCard>
    </AppScreen>
  );
}
