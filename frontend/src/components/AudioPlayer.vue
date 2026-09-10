<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import { useAudioPlayer } from '@/composables/useAudioPlayer'

const props = defineProps<{ src: string }>()
const emit = defineEmits<{
  'time-update': [time: number]
}>()

const waveformRef = ref<HTMLDivElement>()
const {
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  speeds,
  setInstance,
  playPause,
  jumpBackward,
  jumpForward,
  cycleSpeed,
  toggleMute,
} = useAudioPlayer()

let ws: WaveSurfer | null = null

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if ((e.target as HTMLElement).isContentEditable) return
  switch (e.key) {
    case ' ':
      e.preventDefault()
      playPause()
      break
    case 'ArrowLeft':
      e.preventDefault()
      jumpBackward(5)
      break
    case 'ArrowRight':
      e.preventDefault()
      jumpForward(5)
      break
    case '[':
      e.preventDefault()
      cycleSpeed(-1)
      break
    case ']':
      e.preventDefault()
      cycleSpeed(1)
      break
  }
}

watch(() => props.src, () => {
  if (ws) {
    playbackRate.value = 1
    ws.setPlaybackRate(1)
    ws.load(props.src)
    ws.once('ready', () => {
      ws?.setTime(0)
    })
  }
})

onMounted(() => {
  if (!waveformRef.value) return
  ws = WaveSurfer.create({
    container: waveformRef.value,
    waveColor: '#cbd5e1',
    progressColor: '#3b82f6',
    cursorColor: '#1e40af',
    height: 80,
    barWidth: 2,
    barGap: 1,
    dragToSeek: true,
    url: props.src,
  })
  setInstance(ws)
  ws.on('timeupdate', (t) => emit('time-update', t))
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  ws?.destroy()
})
</script>

<template>
  <div class="bg-white border rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Audio Player</h3>
    <div ref="waveformRef" class="mb-3"></div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          @click="jumpBackward(5)"
        >
          &#9664; 5s
        </button>
        <button
          class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          @click="playPause"
        >
          {{ isPlaying ? '\u275A\u275A Pause' : '\u25B6 Play' }}
        </button>
        <button
          class="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          @click="jumpForward(5)"
        >
          5s &#9654;
        </button>
        <button
          class="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          @click="cycleSpeed()"
        >
          {{ playbackRate }}x
        </button>
        <button
          class="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          @click="toggleMute"
        >
          &#128266;
        </button>
      </div>
      <div class="text-sm text-gray-500">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        <span class="ml-3 text-xs text-gray-400">
          [Space] Play &middot; [&larr;&rarr;] &plusmn;5s &middot; [ ] Speed
        </span>
      </div>
    </div>
  </div>
</template>
