import { openai } from "@ai-sdk/openai";
import { productConfig } from "@launch/config/product";
import type { EmbeddingModel, LanguageModel } from "ai";
import { resolveEmbeddingModelId } from "./env";

/**
 * Model selection for the backend. The chat model can be overridden per
 * deployment with `npx convex env set AI_MODEL <model-id>`; the default
 * lives in the product config so clones change it in one place.
 *
 * Swapping providers: replace the `openai` provider import with another
 * Vercel AI SDK provider (e.g. `@ai-sdk/anthropic`) here and in
 * storageNode.ts embeddings — the rest of the backend only sees the
 * LanguageModel interface.
 */
export function resolveChatModelId(): string {
  return process.env.AI_MODEL ?? productConfig.agent.defaultModel;
}

export function resolveChatModel(): LanguageModel {
  return openai.chat(resolveChatModelId());
}

export function resolveEmbeddingModel(): EmbeddingModel<string> {
  return openai.textEmbeddingModel(resolveEmbeddingModelId());
}

export function hasModelApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
