import type { TTSModel } from '@/types/config/tts'
import { createOpenAI } from '@ai-sdk/openai'
import { experimental_generateSpeech as generateSpeech } from 'ai'

/**
 * Shared audio manager for TTS playback
 * Ensures only one audio can play at a time across all components
 */

const MAX_TTS_CHARACTERS = 4096

// Keep track of the currently playing audio to prevent multiple audios playing at once
interface CurrentAudioSource {
  source: AudioBufferSourceNode
  context: AudioContext
}

let currentAudioSource: CurrentAudioSource | null = null

/**
 * Play audio using Web Audio API to bypass CSP restrictions
 * This avoids using blob: or data: URLs which may be blocked by strict CSP policies
 */
async function playAudioWithWebAudioAPI(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stop any currently playing audio first
    stopCurrentAudio()

    // Convert blob to ArrayBuffer
    audioBlob.arrayBuffer().then((arrayBuffer) => {
      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Decode audio data
      audioContext.decodeAudioData(arrayBuffer).then((audioBuffer) => {
        // Create source node
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)

        // Store reference for stopping
        currentAudioSource = { source, context: audioContext }

        // Handle playback end
        source.onended = () => {
          if (currentAudioSource && currentAudioSource.context === audioContext) {
            currentAudioSource = null
          }
          void audioContext.close()
          resolve()
        }

        // Start playback
        source.start(0)
      }).catch((error) => {
        reject(error)
      })
    }).catch((error) => {
      reject(error)
    })
  })
}

// Get the currently playing audio instance (kept for compatibility)
export function getCurrentAudio(): HTMLAudioElement | null {
  return null // Web Audio API doesn't use HTMLAudioElement
}

// Set the currently playing audio instance (kept for compatibility)
export function setCurrentAudio(_audio: HTMLAudioElement | null): void {
  // No-op for Web Audio API
}

// Stop the currently playing audio if any
export function stopCurrentAudio(): void {
  if (currentAudioSource) {
    try {
      currentAudioSource.source.stop()
      void currentAudioSource.context.close()
    }
    catch {
      // Already stopped or closed
    }
    currentAudioSource = null
  }
}

/**
 * Split text into chunks that fit within the TTS API character limit
 * Tries to split on sentence boundaries for better audio quality
 */
export function splitTextForTTS(text: string, maxChars: number = MAX_TTS_CHARACTERS): string[] {
  if (text.length <= maxChars) {
    return [text]
  }

  const chunks: string[] = []
  // Split by sentence boundaries (., !, ?, \n)
  const sentences = text.split(/([.!?\n]+\s*)/)
  let currentChunk = ''

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    if (!sentence)
      continue

    // If a single sentence is longer than maxChars, we need to split it further
    if (sentence.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      // Split long sentence by words
      const words = sentence.split(/(\s+)/)
      for (const word of words) {
        if (currentChunk.length + word.length > maxChars) {
          if (currentChunk) {
            chunks.push(currentChunk.trim())
          }
          currentChunk = word
        }
        else {
          currentChunk += word
        }
      }
    }
    else if (currentChunk.length + sentence.length > maxChars) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    }
    else {
      currentChunk += sentence
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Fetch audio from TTS API using Vercel AI SDK
 */
export async function fetchAudioFromAPI(
  text: string,
  apiKey: string,
  baseURL: string | undefined,
  model: TTSModel,
  voice: string,
  speed: number,
): Promise<Blob> {
  try {
    const openai = createOpenAI({
      ...(baseURL && { baseURL }),
      ...(apiKey && { apiKey }),
    })

    // TODO: Add support for other providers 2025-10-08
    const result = await generateSpeech({
      model: openai.speech(model),
      text,
      voice,
      speed,
    })

    const audioData = new Uint8Array(result.audio.uint8Array)
    return new Blob([audioData], { type: result.audio.mediaType || 'audio/mpeg' })
  }
  catch (error) {
    console.warn('AI SDK TTS failed:', error)
    throw error
  }
}

interface CachedAudio {
  url: string
  blob: Blob
}

interface AudioCacheInterface {
  get: (key: string) => CachedAudio | undefined
  set: (key: string, value: CachedAudio) => void
}

/**
 * Play text using TTS with automatic chunking for long texts
 * Supports caching to avoid redundant API calls
 */
export async function playTextWithTTS(
  text: string,
  apiKey: string,
  baseURL: string | undefined,
  model: TTSModel,
  voice: string,
  speed: number,
  audioCache: AudioCacheInterface,
  onPlayStart?: () => void,
): Promise<void> {
  // Stop any currently playing audio before starting new one
  stopCurrentAudio()

  // Split text into chunks if necessary
  const textChunks = splitTextForTTS(text)

  let hasCalledPlayStart = false

  // If text is split into multiple chunks, we need to play them sequentially
  if (textChunks.length > 1) {
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i]
      const cacheKey = JSON.stringify({ text: chunk, model, voice, speed })
      const cached = audioCache.get(cacheKey)
      let audioBlob: Blob

      if (cached) {
        audioBlob = cached.blob
      }
      else {
        audioBlob = await fetchAudioFromAPI(chunk, apiKey, baseURL, model, voice, speed)
        // Cache blob without URL (Web Audio API doesn't need URLs)
        audioCache.set(cacheKey, { url: '', blob: audioBlob })
      }

      // Call onPlayStart callback before first chunk plays
      if (!hasCalledPlayStart && onPlayStart) {
        onPlayStart()
        hasCalledPlayStart = true
      }

      // Play audio chunk using Web Audio API to bypass CSP restrictions
      await playAudioWithWebAudioAPI(audioBlob)
    }
  }
  else {
    // Single chunk - simpler logic
    const cacheKey = JSON.stringify({ text, model, voice, speed })
    const cached = audioCache.get(cacheKey)
    let audioBlob: Blob

    if (cached) {
      audioBlob = cached.blob
    }
    else {
      audioBlob = await fetchAudioFromAPI(text, apiKey, baseURL, model, voice, speed)
      // Cache blob without URL (Web Audio API doesn't need URLs)
      audioCache.set(cacheKey, { url: '', blob: audioBlob })
    }

    // Call onPlayStart callback before playing
    if (onPlayStart) {
      onPlayStart()
    }

    // Play audio using Web Audio API to bypass CSP restrictions
    await playAudioWithWebAudioAPI(audioBlob)
  }
}
