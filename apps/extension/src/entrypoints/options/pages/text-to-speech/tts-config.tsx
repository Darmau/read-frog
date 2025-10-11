import type { TTSModel, TTSVoice } from '@/types/config/tts'
import { i18n } from '#imports'
import { Badge } from '@repo/ui/components/badge'
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
import { useMutation } from '@tanstack/react-query'
import { experimental_generateSpeech as generateSpeech } from 'ai'
import { useAtom, useAtomValue } from 'jotai'
import { toast } from 'sonner'
import ValidatedInput from '@/components/ui/validated-input'
import { MAX_TTS_SPEED, MIN_TTS_SPEED, TTS_MODELS, TTS_VOICES, ttsSpeedSchema } from '@/types/config/tts'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { ttsProviderConfigAtom } from '@/utils/atoms/provider'
import { getTTSProvidersConfig } from '@/utils/config/helpers'
import { TTS_VOICES_ITEMS } from '@/utils/constants/tts'
import { getTTSProviderById } from '@/utils/providers/model'
import { ConfigCard } from '../../components/config-card'
import { FieldWithLabel } from '../../components/field-with-label'
import { SetApiKeyWarning } from '../../components/set-api-key-warning'

export function TtsConfig() {
  const ttsConfig = useAtomValue(configFieldsAtomMap.tts)
  return (
    <ConfigCard
      title={(
        <div className="flex gap-2">
          {i18n.t('options.config.tts.title')}
          <Badge variant="secondary">Public Beta</Badge>
        </div>
      )}
      description={i18n.t('options.config.tts.description')}
    >
      <div className="space-y-4">
        <TtsProviderField />
        {ttsConfig.providerId && (
          <>
            <TtsModelField />
            <TtsVoiceField />
            <TtsSpeedField />
          </>
        )}
      </div>
    </ConfigCard>
  )
}

function TtsProviderField() {
  const [ttsConfig, setTtsConfig] = useAtom(configFieldsAtomMap.tts)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const ttsProviderConfig = useAtomValue(ttsProviderConfigAtom)
  const ttsProvidersConfig = getTTSProvidersConfig(providersConfig)

  return (
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
  )
}

function TtsModelField() {
  const [ttsConfig, setTtsConfig] = useAtom(configFieldsAtomMap.tts)

  return (
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
  )
}

function TtsVoiceField() {
  const [ttsConfig, setTtsConfig] = useAtom(configFieldsAtomMap.tts)

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!ttsConfig.providerId) {
        throw new Error(i18n.t('options.config.tts.provider.noProvider'))
      }

      const provider = await getTTSProviderById(ttsConfig.providerId)

      const result = await generateSpeech({
        model: provider.speech(ttsConfig.model),
        text: i18n.t('options.config.tts.voice.previewSample'),
        voice: ttsConfig.voice,
        speed: ttsConfig.speed,
      })

      const audioBlob = new Blob([result.audio.uint8Array], {
        type: 'audio/mpeg',
      })

      return audioBlob
    },
    onSuccess: async (audioBlob) => {
      let audioContext: AudioContext | null = null
      let source: AudioBufferSourceNode | null = null

      try {
        audioContext = new AudioContext()

        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)

        source.onended = () => {
          void audioContext?.close()
        }

        source.start(0)
      }
      catch (error) {
        console.error('Error playing audio:', error)
        toast.error('Failed to play audio')
        // Clean up on error
        void audioContext?.close()
      }
    },
  })

  return (
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
          className="sm:w-auto h-9"
          onClick={() => {
            previewMutation.mutate()
          }}
          disabled={previewMutation.isPending || !ttsConfig.providerId}
        >
          {previewMutation.isPending ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconPlayerPlayFilled className="mr-2 size-4" />}
          {i18n.t('options.config.tts.voice.preview')}
        </Button>
      </div>
    </FieldWithLabel>
  )
}

function TtsSpeedField() {
  const [ttsConfig, setTtsConfig] = useAtom(configFieldsAtomMap.tts)

  return (
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
  )
}
