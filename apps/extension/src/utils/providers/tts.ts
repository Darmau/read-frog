import type { Config } from '@/types/config/config'
import type { ProvidersConfig } from '@/types/config/provider'
import { storage } from '#imports'
import { createOpenAI } from '@ai-sdk/openai'
import { getProviderConfigById } from '../config/helpers'
import { CONFIG_STORAGE_KEY } from '../constants/config'

/**
 * Get TTS provider instance for the given provider ID
 * Currently only OpenAI supports TTS
 */
export async function getTTSProviderById(providerId: string) {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)

  if (!config) {
    throw new Error('Config not found')
  }

  const providerConfig = getProviderConfigById(config.providersConfig, providerId)
  if (!providerConfig) {
    throw new Error(`Provider ${providerId} not found`)
  }

  // Currently only OpenAI supports TTS
  if (providerConfig.provider !== 'openai') {
    throw new Error(`Provider ${providerConfig.provider} does not support TTS`)
  }

  return createOpenAI({
    ...(providerConfig.baseURL && { baseURL: providerConfig.baseURL }),
    ...(providerConfig.apiKey && { apiKey: providerConfig.apiKey }),
  })
}

// Get the OpenAI provider from the config
export function getOpenAIProviderFromConfig(providersConfig: ProvidersConfig) {
  return providersConfig.find(p => p.provider === 'openai' && p.enabled)
}
