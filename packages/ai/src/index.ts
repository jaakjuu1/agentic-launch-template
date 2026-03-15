import { openai } from "@ai-sdk/openai";
import {
  type AgentMessage,
  type ToolRun,
  toolRunStatusSchema,
} from "@launch/domain";
import { Agent, run } from "@openai/agents";
import {
  generateText,
  type LanguageModel,
  type ModelMessage,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

export const toolRequestSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  inputSchema: z.record(z.string(), z.unknown()),
  sideEffect: z.boolean().default(false),
});

export type ToolRequest = z.infer<typeof toolRequestSchema>;

export type UiChatContext = {
  model?: string;
  systemPrompt: string;
  messages: Pick<AgentMessage, "role" | "content">[];
};

export function resolveBaseModel(model = "gpt-5-mini"): LanguageModel {
  return openai.chat(model);
}

function toModelMessages(messages: UiChatContext["messages"]): ModelMessage[] {
  const modelMessages: ModelMessage[] = [];

  for (const message of messages) {
    if (message.role === "tool") {
      continue;
    }

    if (message.role === "system") {
      modelMessages.push({ content: message.content, role: "system" });
      continue;
    }

    if (message.role === "user") {
      modelMessages.push({ content: message.content, role: "user" });
      continue;
    }

    modelMessages.push({ content: message.content, role: "assistant" });
  }

  return modelMessages;
}

export async function generateAssistantText(context: UiChatContext) {
  const result = await generateText({
    model: resolveBaseModel(context.model),
    system: context.systemPrompt,
    messages: toModelMessages(context.messages),
  });

  return result.text;
}

export function createStream(context: UiChatContext) {
  return streamText({
    model: resolveBaseModel(context.model),
    system: context.systemPrompt,
    messages: toModelMessages(context.messages),
  });
}

export function createAuditedTool(
  definition: ToolRequest,
  execute: (input: unknown) => Promise<unknown>,
) {
  return tool({
    description: definition.description,
    inputSchema: z.object(definition.inputSchema),
    execute,
  });
}

export async function runOrchestratedTask(input: {
  instructions: string;
  handoffAgentName?: string;
}) {
  const agent = new Agent({
    instructions: input.instructions,
    model: "gpt-5",
    name: input.handoffAgentName ?? "planner",
  });

  return run(agent, input.instructions);
}

export function toAuditTrail(toolRuns: readonly ToolRun[]) {
  return toolRuns.map((run) => ({
    id: run.id,
    status: toolRunStatusSchema.parse(run.status),
    summary: `${run.toolName}: ${run.description}`,
  }));
}
