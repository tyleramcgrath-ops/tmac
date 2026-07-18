import { createGatewayProvider } from '@ai-sdk/gateway'
import { withHeadroom } from 'headroom-ai/vercel-ai'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV3 } from '@ai-sdk/provider'

const gateway = createGatewayProvider({
  baseURL: process.env.AI_GATEWAY_BASE_URL,
})

// Headroom compresses tool outputs/context before they reach the model. It
// talks to a proxy (local `headroom proxy` for dev, or Headroom Cloud), so it
// only gets wrapped in when a target is actually configured — otherwise every
// request would eat a connect-timeout against the unconfigured localhost
// default before falling back to uncompressed.
const headroomConfigured = Boolean(
  process.env.HEADROOM_BASE_URL || process.env.HEADROOM_API_KEY
)

function withOptionalHeadroom(model: LanguageModelV3, modelId: string) {
  if (!headroomConfigured) return model
  return withHeadroom(model, { model: modelId }) as LanguageModelV3
}

export interface ModelOptions {
  model: LanguageModelV3
  providerOptions?: Record<string, Record<string, JSONValue>>
  headers?: Record<string, string>
}

export function getModelOptions(
  modelId: string,
  options?: { reasoningEffort?: 'low' | 'medium' | 'high' }
): ModelOptions {
  if (modelId === Models.OpenAIGPT53Codex) {
    return {
      model: withOptionalHeadroom(gateway(modelId), modelId),
      providerOptions: {
        openai: {
          include: ['reasoning.encrypted_content'],
          reasoningEffort: options?.reasoningEffort ?? 'low',
          reasoningSummary: 'auto',
          serviceTier: 'priority',
        } satisfies OpenAIResponsesProviderOptions,
      },
    }
  }

  if (
    modelId === Models.AnthropicClaudeSonnet46 ||
    modelId === Models.AnthropicClaudeOpus46
  ) {
    return {
      model: withOptionalHeadroom(gateway(modelId), modelId),
      headers: { 'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14' },
      providerOptions: {
        anthropic: {
          cacheControl: { type: 'ephemeral' },
        },
      },
    }
  }

  return {
    model: withOptionalHeadroom(gateway(modelId), modelId),
  }
}
