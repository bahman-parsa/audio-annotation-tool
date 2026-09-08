import { ref, shallowRef } from 'vue'
import type WaveSurfer from 'wavesurfer.js'

export function useAudioPlayer() {
  const ws = shallowRef<WaveSurfer | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const playbackRate = ref(1)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  function setInstance(instance: WaveSurfer) {
    ws.value = instance

    instance.on('play', () => { isPlaying.value = true })
    instance.on('pause', () => { isPlaying.value = false })
    instance.on('timeupdate', (t) => { currentTime.value = t })
    instance.on('decode', (d) => { duration.value = d })
    instance.on('finish', () => { isPlaying.value = false })
  }

  function playPause() { ws.value?.playPause() }
  function seekTo(time: number) {
    if (!ws.value) return
    const dur = ws.value.getDuration()
    if (dur > 0) ws.value.seekTo(time / dur)
  }
  function jumpBackward(seconds = 5) {
    if (!ws.value) return
    ws.value.setTime(Math.max(0, ws.value.getCurrentTime() - seconds))
  }
  function jumpForward(seconds = 5) {
    if (!ws.value) return
    ws.value.setTime(Math.min(ws.value.getDuration(), ws.value.getCurrentTime() + seconds))
  }
  function setSpeed(rate: number) {
    playbackRate.value = rate
    ws.value?.setPlaybackRate(rate)
  }
  function cycleSpeed() {
    const idx = speeds.indexOf(playbackRate.value)
    const next = speeds[(idx + 1) % speeds.length]
    setSpeed(next)
  }
  function setVolume(vol: number) { ws.value?.setVolume(vol) }
  function toggleMute() { ws.value?.setMuted(!ws.value.getMuted()) }

  return {
    ws,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    speeds,
    setInstance,
    playPause,
    seekTo,
    jumpBackward,
    jumpForward,
    setSpeed,
    cycleSpeed,
    setVolume,
    toggleMute,
  }
}
