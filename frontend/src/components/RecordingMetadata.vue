<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AudioItem } from '@/types'

const props = defineProps<{ item: AudioItem }>()
const emit = defineEmits<{ 'update-distance': [value: number] }>()

const editing = ref(false)
const input = ref('')

watch(() => props.item.distanceEstimate, (val) => {
  input.value = val != null ? String(val) : ''
}, { immediate: true })

function startEdit() {
  input.value = props.item.distanceEstimate != null ? String(props.item.distanceEstimate) : ''
  editing.value = true
}

function commit() {
  editing.value = false
  const num = parseFloat(input.value)
  if (!isNaN(num)) {
    emit('update-distance', num)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    commit()
  } else if (e.key === 'Escape') {
    editing.value = false
  }
}

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
      <div v-if="item.distanceEstimate != null">
        <span class="text-gray-500" title="RMS-based estimate (0=far, 1=close). Click value to override.">Distance Est.:</span>
        <span
          v-if="item.isConditionOverridden"
          class="ml-1 inline-block w-2 h-2 rounded-full bg-orange-400 align-middle"
          title="Manually overridden"
        />
        <template v-if="!editing">
          <span class="ml-1 font-medium cursor-pointer hover:underline" @click="startEdit" title="Click to override">
            {{ item.distanceEstimate.toFixed(2) }}
          </span>
        </template>
        <template v-else>
          <input
            v-model="input"
            class="ml-1 w-20 px-1 border rounded text-sm"
            type="number"
            step="0.01"
            min="0"
            max="1"
            @blur="commit"
            @keydown="handleKeydown"
          />
        </template>
      </div>
    </div>
  </div>
</template>
