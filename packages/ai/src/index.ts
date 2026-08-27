import { openai } from "@ai-sdk/openai";
import type { FlexibleSchema } from "@ai-sdk/provider-utils";
import { productConfig } from "@launch/config/product";
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

/**
 * Server-side AI helpers shared outside the Convex runtime (scripts,
 * Next.js route handlers). The Convex backend has its own thin wrapper
 * in convex/lib/ai.ts so it can read deployment env vars — keep model
 * defaults in sync by resolving through the product config here too.
 */

export const toolRequestMetadataKeys = [
  "name",
  "description",
  "sideEffect",
] as const;

export type ToolRequest = {
  name: string;
  description: string;
  /**
   * Marks a tool whose execution changes the outside world. Callers must
   * route such tools through the approvals flow (see convex/agent.ts
   * riskyApprovalTool) rather than executing directly.
   */
  sideEffect: boolean;
};

export type UiChatContext = {
  model?: string;
  systemPrompt: string;
  messages: Pick<AgentMessage, "role" | "content">[];
};

export function resolveModelId(model?: string): string {
  return model ?? process.env.AI_MODEL ?? productConfig.agent.defaultModel;
}

export function resolveBaseModel(model?: string): LanguageModel {
  return openai.chat(resolveModelId(model));
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

/**
 * Wrap an execute function as an AI SDK tool with a real zod schema.
 * `definition.sideEffect` is metadata for the caller: side-effectful
 * tools belong behind an approval gate.
 */
export function createAuditedTool<Input>(
  definition: ToolRequest,
  inputSchema: FlexibleSchema<Input>,
  execute: (input: Input) => Promise<unknown>,
) {
  return tool({
    description: definition.description,
    inputSchema,
    execute,
  });
}

export async function runOrchestratedTask(input: {
  instructions: string;
  handoffAgentName?: string;
  model?: string;
}) {
  const agent = new Agent({
    instructions: input.instructions,
    model: resolveModelId(input.model),
    name: input.handoffAgentName ?? "planner",
  });

  return run(agent, input.instructions);
}

export function toAuditTrail(toolRuns: readonly ToolRun[]) {
  return toolRuns.map((toolRun) => ({
    id: toolRun.id,
    status: toolRunStatusSchema.parse(toolRun.status),
    summary: `${toolRun.toolName}: ${toolRun.description}`,
  }));
}
