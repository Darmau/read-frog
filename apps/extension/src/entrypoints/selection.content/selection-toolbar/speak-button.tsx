import type { TTSModel } from '@/types/config/tts'

import { i18n } from '#imports'
import { IconLoader2, IconVolume } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { getProviderApiKey, getProviderBaseURL } from '@/utils/config/helpers'
import { DEFAULT_CONFIG } from '@/utils/constants/config'
import { isTooltipVisibleAtom, selectionContentAtom } from './atom'
import { audioCache } from './audio-cache'
import { playTextWithTTS } from './audio-manager'

interface SpeakMutationVariables {
  apiKey: string
  baseURL: string
  selectionContent: string
  model: TTSModel
  voice: string
  speed: number
}

export function SpeakButton() {
  const selectionContent = useAtomValue(selectionContentAtom)
  const setIsTooltipVisible = useSetAtom(isTooltipVisibleAtom)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const ttsConfig = useAtomValue(configFieldsAtomMap.tts)
  const betaExperienceConfig = useAtomValue(configFieldsAtomMap.betaExperience)

  const openaiProvider = providersConfig.find(p => p.provider === 'openai' && p.enabled)

  const speakMutation = useMutation<void, Error, SpeakMutationVariables, { toastId: string | number }>({
    mutationFn: async ({ selectionContent, apiKey, baseURL, model, voice, speed }) => {
      // Use the shared playTextWithTTS function which handles chunking and caching
      await playTextWithTTS(selectionContent, apiKey, baseURL, model, voice, speed, audioCache)
    },
    onMutate: () => {
      setIsTooltipVisible(false)
      const toastId = toast.loading(i18n.t('speak.fetchingAudio'))
      return { toastId }
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) {
        toast.success(i18n.t('speak.playingAudio'), { id: context.toastId })
      }
    },
    onError: (error, _variables, context) => {
      if (context?.toastId) {
        toast.dismiss(context.toastId)
      }
      console.error('TTS error:', error)
      toast.error(error.message || i18n.t('speak.failedToGenerateSpeech'))
    },
  })

  const { mutate, isPending } = speakMutation

  const handleClick = useCallback(() => {
    if (!selectionContent) {
      toast.error(i18n.t('speak.noTextSelected'))
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

    const baseURL = getProviderBaseURL(providersConfig, openaiProvider.id) || 'https://api.openai.com/v1'

    const { model, voice, speed } = betaExperienceConfig.enabled ? ttsConfig : DEFAULT_CONFIG.tts

    mutate({
      apiKey,
      baseURL,
      selectionContent,
      model,
      voice,
      speed,
    })
  }, [selectionContent, providersConfig, openaiProvider, mutate, ttsConfig, betaExperienceConfig])

  // Don't render the button if OpenAI is not configured
  const isBetaEnabled = Boolean(betaExperienceConfig.enabled)
  const hasApiKey = Boolean(openaiProvider && getProviderApiKey(providersConfig, openaiProvider.id))

  if (!isBetaEnabled || !hasApiKey) {
    return null
  }

  return (
    <button
      type="button"
      className="size-6 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleClick}
      disabled={isPending}
      title="Speak selected text"
    >
      {isPending
        ? (
            <IconLoader2 className="size-4 animate-spin" strokeWidth={1.6} />
          )
        : (
            <IconVolume className="size-4" strokeWidth={1.6} />
          )}
    </button>
  )
}
