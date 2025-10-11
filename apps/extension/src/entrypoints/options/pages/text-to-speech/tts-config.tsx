import type { TTSModel, TTSVoice } from '@/types/config/tts'
import { i18n } from '#imports'
import { Button } from '@repo/ui/components/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { IconLoader2, IconPlayerPlayFilled } from '@tabler/icons-react'
import { useAtom, useAtomValue } from 'jotai'
import ValidatedInput from '@/components/ui/validated-input'
import { MAX_TTS_SPEED, MIN_TTS_SPEED, TTS_MODELS, TTS_VOICES, ttsSpeedSchema } from '@/types/config/tts'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { ttsProviderConfigAtom } from '@/utils/atoms/provider'
import { getTTSProvidersConfig } from '@/utils/config/helpers'
import { TTS_VOICES_ITEMS } from '@/utils/constants/tts'
import { ConfigCard } from '../../components/config-card'
import { FieldWithLabel } from '../../components/field-with-label'
import { SetApiKeyWarning } from '../../components/set-api-key-warning'

export function TtsConfig() {
  const [ttsConfig, setTtsConfig] = useAtom(configFieldsAtomMap.tts)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const ttsProviderConfig = useAtomValue(ttsProviderConfigAtom)
  const ttsProvidersConfig = getTTSProvidersConfig(providersConfig)

  // const apiKey = useMemo(() => openaiProviderId ? getProviderApiKey(providersConfig, openaiProviderId) : undefined, [providersConfig, openaiProviderId])

  // const baseURL = useMemo(() => {
  //   if (!openaiProviderId) {
  //     return DEFAULT_OPENAI_BASE_URL
  //   }
  //   const configuredBaseUrl = getProviderBaseURL(providersConfig, openaiProviderId)
  //   return configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : DEFAULT_OPENAI_BASE_URL
  // }, [providersConfig, openaiProviderId])

  // const voiceOptions = useMemo<Array<{ id: string, name: string }>>(() => {
  //   const availableVoices = Object.entries(TTS_VOICES_ITEMS).map(([id, { name }]) => ({ id, name }))

  //   if (!ttsConfig.voice) {
  //     return availableVoices
  //   }
  //   const exists = availableVoices.some(voice => voice.id === ttsConfig.voice)
  //   if (exists) {
  //     return availableVoices
  //   }
  //   return [...availableVoices, { id: ttsConfig.voice, name: ttsConfig.voice }]
  // }, [ttsConfig.voice])

  // const hasApiKey = Boolean(apiKey)
  // const voiceSelectDisabled = !isBetaEnabled

  // const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  // const previewObjectUrlRef = useRef<string | null>(null)
  // const [isPreviewing, setIsPreviewing] = useState(false)

  // const cleanupPreviewAudio = useCallback(() => {
  //   if (previewAudioRef.current) {
  //     previewAudioRef.current.pause()
  //     previewAudioRef.current.currentTime = 0
  //     previewAudioRef.current = null
  //   }
  //   if (previewObjectUrlRef.current) {
  //     URL.revokeObjectURL(previewObjectUrlRef.current)
  //     previewObjectUrlRef.current = null
  //   }
  // }, [])

  // useEffect(() => () => {
  //   cleanupPreviewAudio()
  // }, [cleanupPreviewAudio])

  // const handleVoiceChange = useCallback((value: string) => {
  //   if (!isBetaEnabled) {
  //     return
  //   }
  //   void setTtsConfig({ voice: value })
  // }, [isBetaEnabled, setTtsConfig])

  // const handlePreviewVoice = useCallback(async () => {
  //   if (!isBetaEnabled) {
  //     return
  //   }
  //   if (!ttsConfig.voice) {
  //     toast.error(i18n.t('options.config.tts.voice.selectVoiceFirst'))
  //     return
  //   }
  //   if (!apiKey) {
  //     toast.error(i18n.t('speak.openaiApiKeyNotConfigured'))
  //     return
  //   }

  //   setIsPreviewing(true)
  //   cleanupPreviewAudio()

  //   try {
  //     const normalizedBaseURL = baseURL.replace(/\/$/, '')
  //     const previewText = i18n.t('options.config.tts.voice.previewSample')

  //     const response = await fetch(`${normalizedBaseURL}/audio/speech`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${apiKey}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         model: ttsConfig.model,
  //         input: previewText,
  //         voice: ttsConfig.voice,
  //         speed: ttsConfig.speed,
  //       }),
  //     })

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({}))
  //       throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  //     }

  //     const blob = await response.blob()
  //     const audioUrl = URL.createObjectURL(blob)
  //     previewObjectUrlRef.current = audioUrl

  //     const audio = new Audio(audioUrl)
  //     previewAudioRef.current = audio

  //     audio.onended = () => {
  //       cleanupPreviewAudio()
  //     }

  //     audio.onerror = () => {
  //       cleanupPreviewAudio()
  //       toast.error(i18n.t('options.config.tts.voice.previewError'))
  //     }

  //     await audio.play()
  //   }
  //   catch (error) {
  //     cleanupPreviewAudio()
  //     const message = error instanceof Error && error.message ? error.message : i18n.t('options.config.tts.voice.previewError')
  //     toast.error(message)
  //   }
  //   finally {
  //     setIsPreviewing(false)
  //   }
  // }, [apiKey, baseURL, cleanupPreviewAudio, isBetaEnabled, ttsConfig.model, ttsConfig.speed, ttsConfig.voice])

  return (
    <ConfigCard title={i18n.t('options.config.tts.title')} description={i18n.t('options.config.tts.description')}>
      <div className="space-y-4">
        <FieldWithLabel
          id="ttsProvider"
          label={(
            <div className="flex gap-2">
              {i18n.t('options.config.tts.provider.label')}
              {ttsProviderConfig && !ttsProviderConfig.apiKey && <SetApiKeyWarning />}
            </div>
          )}
        >
          <Select
            value={ttsConfig.providerId || undefined}
            onValueChange={(value: string) => {
              void setTtsConfig({ providerId: value })
            }}
            disabled={ttsProvidersConfig.length === 0}
          >
            <SelectTrigger className="w-full">
              {ttsProvidersConfig.length === 0 ? <SelectValue placeholder={i18n.t('options.config.tts.provider.noProvider')} /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ttsProvidersConfig.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldWithLabel>
        <FieldWithLabel
          id="ttsModel"
          label={i18n.t('options.config.tts.model.label')}
        >
          <Select
            value={ttsConfig.model}
            onValueChange={(value: TTSModel) => {
              void setTtsConfig({ model: value })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TTS_MODELS.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldWithLabel>
        <FieldWithLabel id="ttsVoice" label={i18n.t('options.config.tts.voice.label')}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Select
                value={ttsConfig.voice}
                onValueChange={(value: TTSVoice) => {
                  void setTtsConfig({ voice: value })
                }}
              >
                <SelectTrigger
                  id="ttsVoice"
                  className="w-full"
                >
                  <SelectValue placeholder={i18n.t('options.config.tts.voice.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TTS_VOICES.map(voice => (
                      <SelectItem key={voice} value={voice}>
                        {TTS_VOICES_ITEMS[voice].name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="sm:w-auto"
              onClick={() => {
                void setTtsConfig({ voice: ttsConfig.voice })
              }}
            >
              {true ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconPlayerPlayFilled className="mr-2 size-4" />}
              {i18n.t('options.config.tts.voice.preview')}
            </Button>
          </div>
        </FieldWithLabel>
        <FieldWithLabel id="ttsSpeed" label={i18n.t('options.config.tts.speed.label')}>
          <ValidatedInput
            id="ttsSpeed"
            type="number"
            step="0.05"
            min={MIN_TTS_SPEED}
            max={MAX_TTS_SPEED}
            value={ttsConfig.speed}
            schema={ttsSpeedSchema}
            onChange={(event) => {
              void setTtsConfig({ speed: Number(event.target.value) })
            }}
          />
          <p className="text-xs text-muted-foreground">
            {i18n.t('options.config.tts.speed.hint')}
          </p>
        </FieldWithLabel>
      </div>
    </ConfigCard>
  )
}
