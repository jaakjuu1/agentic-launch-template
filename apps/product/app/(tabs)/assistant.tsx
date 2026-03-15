import {
  AppScreen,
  PrimaryButton,
  SectionCard,
  StatusPill,
} from "@launch/ui-native";
import { startTransition, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { referenceThread } from "@/lib/reference-data";

export default function AssistantScreen() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(referenceThread.messages);

  return (
    <AppScreen>
      <SectionCard eyebrow="Persistent thread" title={referenceThread.title}>
        <Text className="text-base leading-7 text-[#5f6772]">
          {referenceThread.summary}
        </Text>
        <StatusPill label="Convex Agent-ready" tone="success" />
        <View className="gap-3">
          {messages.map((message) => (
            <View
              key={message.id}
              className={`rounded-[20px] p-4 ${
                message.role === "assistant" ? "bg-[#fff3eb]" : "bg-white"
              }`}
            >
              <Text className="text-xs uppercase tracking-[1.6px] text-[#5f6772]">
                {message.role}
              </Text>
              <Text className="mt-2 text-base leading-7 text-[#16202a]">
                {message.content}
              </Text>
            </View>
          ))}
        </View>
        <View className="gap-3">
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
                    content:
                      "Queued. In the full stack this prompt would persist to Convex, stream with the AI SDK, and route risky side effects through approvals.",
                  },
                ]);
                setDraft("");
              });
            }}
          />
        </View>
      </SectionCard>
    </AppScreen>
  );
}
