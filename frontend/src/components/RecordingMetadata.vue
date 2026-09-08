<script setup lang="ts">
import type { AudioItem } from '@/types'

defineProps<{ item: AudioItem }>()

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}s`
}
</script>

<template>
  <div class="bg-white border rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Recording Metadata</h3>
    <div class="flex flex-wrap gap-6 text-sm">
      <div>
        <span class="text-gray-500">Duration:</span>
        <span class="ml-1 font-medium">{{ formatDuration(item.duration) }}</span>
      </div>
      <div v-if="item.sampleRate">
        <span class="text-gray-500">Sample Rate:</span>
        <span class="ml-1 font-medium">{{ (item.sampleRate / 1000).toFixed(1) }}kHz</span>
      </div>
      <div v-if="item.channels">
        <span class="text-gray-500">Channels:</span>
        <span class="ml-1 font-medium">{{ item.channels === 1 ? 'Mono' : 'Stereo' }}</span>
      </div>
      <div v-if="item.bitDepth">
        <span class="text-gray-500">Bit Depth:</span>
        <span class="ml-1 font-medium">{{ item.bitDepth }}-bit</span>
      </div>
      <div v-if="item.wordsPerMinute">
        <span class="text-gray-500">WPM:</span>
        <span class="ml-1 font-medium">{{ Math.round(item.wordsPerMinute) }}</span>
      </div>
      <div v-if="item.distanceEstimate">
        <span class="text-gray-500">Distance Est.:</span>
        <span class="ml-1 font-medium">{{ item.distanceEstimate }}</span>
      </div>
    </div>
  </div>
</template>
