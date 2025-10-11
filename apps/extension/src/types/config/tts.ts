import { z } from 'zod'

export const TTS_MODELS = [
  'tts-1',
  'tts-1-hd',
  'gpt-4o-mini-tts',
] as const
export const ttsModelSchema = z.enum(TTS_MODELS)

export const TTS_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
] as const
export const ttsVoiceSchema = z.enum(TTS_VOICES)

export const MIN_TTS_SPEED = 0.25
export const MAX_TTS_SPEED = 4
export const ttsSpeedSchema = z.coerce.number().min(MIN_TTS_SPEED).max(MAX_TTS_SPEED)

export const ttsConfigSchema = z.object({
  providerId: z.string().nullable(),
  model: ttsModelSchema,
  voice: ttsVoiceSchema,
  speed: ttsSpeedSchema,
})

export type TTSVoice = z.infer<typeof ttsVoiceSchema>
export type TTSModel = z.infer<typeof ttsModelSchema>
export type TTSConfig = z.infer<typeof ttsConfigSchema>
