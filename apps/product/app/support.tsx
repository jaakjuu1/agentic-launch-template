import { AppScreen, PrimaryButton, SectionCard } from "@launch/ui-native";
import { startTransition, useState } from "react";
import { Text, View } from "react-native";

import { FileRow } from "@/components/file-row";
import { formatFileSize } from "@/lib/file-helpers";
import { pickDocumentUpload, pickImageUpload } from "@/lib/file-picker";
import { referenceSupportFiles } from "@/lib/reference-data";

export default function SupportScreen() {
  const [files, setFiles] = useState<
    Array<(typeof referenceSupportFiles)[number]>
  >([...referenceSupportFiles]);

  return (
    <AppScreen>
      <SectionCard
        eyebrow="Support"
        title="Operator-ready support request flow"
      >
        <Text className="text-base leading-7 text-[#5f6772]">
          Support requests become first-class Convex records, can trigger email
          acknowledgements, and can be escalated to operators without leaking
          internal controls into prompts.
        </Text>
        <View className="rounded-[20px] bg-white/80 p-4">
          <Text className="text-lg font-semibold text-[#16202a]">
            Suggested templates
          </Text>
          <Text className="mt-2 text-base leading-7 text-[#5f6772]">
            Billing issue, account recovery, notification mismatch, or approval
            escalation.
          </Text>
        </View>
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-3">
            <PrimaryButton
              label="Attach document"
              onPress={() => {
                void pickDocumentUpload().then((file) => {
                  if (!file) {
                    return;
                  }

                  startTransition(() => {
                    setFiles((current) => [
                      ...current,
                      {
                        detail: "Support attachment · signed PUT queued",
                        fileName: file.fileName,
                        id: `support_document_${current.length}`,
                        sizeBytes: file.sizeBytes,
                        status: "Queued",
                      },
                    ]);
                  });
                });
              }}
            />
            <PrimaryButton
              label="Attach screenshot"
              onPress={() => {
                void pickImageUpload().then((file) => {
                  if (!file) {
                    return;
                  }

                  startTransition(() => {
                    setFiles((current) => [
                      ...current,
                      {
                        detail: "Support attachment · screenshot",
                        fileName: file.fileName,
                        id: `support_image_${current.length}`,
                        sizeBytes: file.sizeBytes,
                        status: "Queued",
                      },
                    ]);
                  });
                });
              }}
            />
          </View>
          {files.map((file) => (
            <FileRow
              key={file.id}
              detail={`${file.detail} · ${formatFileSize(file.sizeBytes)}`}
              label={file.fileName}
              status={file.status}
            />
          ))}
        </View>
        <PrimaryButton label="Create support request action" />
      </SectionCard>
    </AppScreen>
  );
}
