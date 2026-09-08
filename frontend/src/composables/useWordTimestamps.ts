import type { WordTiming } from '@/types'

export function useWordTimestamps() {
  function estimate(transcript: string, duration: number): WordTiming[] {
    const words = transcript.split(/\s+/).filter(Boolean)
    if (words.length === 0 || duration <= 0) return []

    const wordDuration = duration / words.length
    return words.map((word, i) => ({
      word,
      startTime: i * wordDuration,
      endTime: (i + 1) * wordDuration,
      index: i,
    }))
  }

  function getCurrentWordIndex(wordTimings: WordTiming[], currentTime: number): number {
    return wordTimings.findIndex(
      (wt) => currentTime >= wt.startTime && currentTime < wt.endTime
    )
  }

  return { estimate, getCurrentWordIndex }
}
