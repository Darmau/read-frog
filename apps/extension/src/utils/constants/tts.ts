// This is a list of voices available for the OpenAI API

import type { TTSConfig, TTSVoice } from '@/types/config/tts'

// https://www.openai.fm/
// export interface OpenAIVoice {
//   id: string
//   name: string
// }

// export const AVAILABLE_OPENAI_VOICES: ReadonlyArray<OpenAIVoice> = [
//   { id: 'alloy', name: 'Alloy' },
//   { id: 'ash', name: 'Ash' },
//   { id: 'ballad', name: 'Ballad' },
//   { id: 'coral', name: 'Coral' },
//   { id: 'echo', name: 'Echo' },
//   { id: 'fable', name: 'Fable' },
//   { id: 'nova', name: 'Nova' },
//   { id: 'onyx', name: 'Onyx' },
//   { id: 'sage', name: 'Sage' },
//   { id: 'shimmer', name: 'Shimmer' },
//   { id: 'verse', name: 'Verse' },
// ]

// https://www.openai.fm/
export const TTS_VOICES_ITEMS: Record<TTSVoice, { name: string }> = {
  alloy: { name: 'Alloy' },
  ash: { name: 'Ash' },
  ballad: { name: 'Ballad' },
  coral: { name: 'Coral' },
  echo: { name: 'Echo' },
  fable: { name: 'Fable' },
  nova: { name: 'Nova' },
  onyx: { name: 'Onyx' },
  sage: { name: 'Sage' },
  shimmer: { name: 'Shimmer' },
  verse: { name: 'Verse' },
}

export const DEFAULT_TTS_CONFIG: TTSConfig = {
  providerId: 'openai-default',
  model: 'tts-1',
  voice: 'alloy',
  speed: 1,
}
