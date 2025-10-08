import { LRUCache } from '@/utils/data-structure/rlu'

interface CachedAudio {
  url: string
  blob: Blob
}

/**
 * - Caches up to 10 audio files to avoid redundant API calls
 * - Automatically evicts least recently used items when cache is full
 * - Stores both Blob and URL for efficient reuse
 */
export class AudioCache {
  private cache = new LRUCache<string, CachedAudio>(10)

  get(key: string): CachedAudio | undefined {
    return this.cache.get(key)
  }

  set(key: string, value: CachedAudio): void {
    // LRU cache handles eviction internally; only need to store the new value
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const audioCache = new AudioCache()
