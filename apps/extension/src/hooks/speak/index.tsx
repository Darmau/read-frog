import type { TTSModel } from '@/types/config/tts'
import { i18n } from '#imports'
import { IconVolume } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { audioCache } from '@/entrypoints/selection.content/selection-toolbar/audio-cache'
import { playTextWithTTS } from '@/entrypoints/selection.content/selection-toolbar/audio-manager'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { getProviderApiKey, getProviderBaseURL } from '@/utils/config/helpers'
import { DEFAULT_CONFIG } from '@/utils/constants/config'

interface SpeakMutationVariables {
  apiKey: string
  baseURL?: string
  text: string
  model: TTSModel
  voice: string
  speed: number
}

/**
 * Custom hook for text-to-speech functionality
 * Encapsulates TTS mutation logic and provider checks
 */
export function useSpeakText() {
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const ttsConfig = useAtomValue(configFieldsAtomMap.tts)
  const betaExperienceConfig = useAtomValue(configFieldsAtomMap.betaExperience)

  const openaiProvider = useMemo(
    () => providersConfig.find(p => p.provider === 'openai' && p.enabled),
    [providersConfig],
  )

  const isBetaEnabled = Boolean(betaExperienceConfig.enabled)
  const hasApiKey = Boolean(openaiProvider && getProviderApiKey(providersConfig, openaiProvider.id))

  const speakMutation = useMutation<void, Error, SpeakMutationVariables & { toastId?: string | number }>({
    mutationFn: async ({ text, apiKey, baseURL, model, voice, speed, toastId }) => {
      const onPlayStart = () => {
        // Update toast when audio starts playing with success state and volume icon
        if (toastId) {
          toast.success(i18n.t('speak.playingAudio'), {
            id: toastId,
            icon: <IconVolume className="size-5 animate-pulse" />,
            duration: Number.POSITIVE_INFINITY, // Keep showing until manually dismissed
          })
        }
      }
      await playTextWithTTS(text, apiKey, baseURL, model, voice, speed, audioCache, onPlayStart)

      // Dismiss toast after playback completes
      if (toastId) {
        toast.dismiss(toastId)
      }
    },
    onError: (error, variables) => {
      if (variables.toastId) {
        toast.dismiss(variables.toastId)
      }
      console.error('TTS error:', error)
      toast.error(error.message || i18n.t('speak.failedToGenerateSpeech'))
    },
  })

  /**
   * Speak the given text using TTS
   * Handles all validation and error cases
   */
  const speak = useCallback(
    (text: string) => {
      if (!text) {
        toast.error(i18n.t('speak.noTextSelected'))
        return
      }

      if (!isBetaEnabled) {
        return
      }

      if (!openaiProvider) {
        toast.error(i18n.t('speak.openaiNotConfigured'))
        return
      }

      const apiKey = getProviderApiKey(providersConfig, openaiProvider.id)
      if (!apiKey) {
        toast.error(i18n.t('speak.openaiApiKeyNotConfigured'))
        return
      }

      const baseURL = getProviderBaseURL(providersConfig, openaiProvider.id)
      const { model, voice, speed } = betaExperienceConfig.enabled ? ttsConfig : DEFAULT_CONFIG.tts

      const toastId = toast.loading(i18n.t('speak.fetchingAudio'))

      speakMutation.mutate({
        apiKey,
        baseURL,
        text,
        model,
        voice,
        speed,
        toastId,
      })
    },
    [isBetaEnabled, openaiProvider, providersConfig, betaExperienceConfig, ttsConfig, speakMutation],
  )

  return {
    speak,
    isPending: speakMutation.isPending,
    isBetaEnabled,
    hasApiKey,
    canSpeak: isBetaEnabled && hasApiKey,
  }
}
