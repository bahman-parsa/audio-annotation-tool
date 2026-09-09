<script setup lang="ts">
import { ref } from 'vue';
import type { AudioItem } from '@/types';
import { api } from '@/services/api';
import { useWorkQueue } from '@/composables/useWorkQueue';

const props = defineProps<{
  item: AudioItem;
  isSelected: boolean;
}>();

const { updateItem } = useWorkQueue();

const showModal = ref(false);
const transcriptText = ref('');
const statusMessage = ref('');
const submitting = ref(false);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    UNTOUCHED: 'bg-blue-100 text-blue-800',
    READY: 'bg-green-100 text-green-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}

function statusIcon(status: string) {
  const icons: Record<string, string> = {
    PENDING: '\u25CB',
    UNTOUCHED: '\u25C9',
    READY: '\u25CF',
  };
  return icons[status] ?? '?';
}

function openModal() {
  transcriptText.value = '';
  statusMessage.value = '';
  submitting.value = false;
  showModal.value = true;
}

async function handleSubmit() {
  if (!transcriptText.value.trim() || submitting.value) return;

  submitting.value = true;
  statusMessage.value = 'Saving...';

  try {
    const result = await api.post<{ transcript: AudioItem['transcript'] }>(
      `/api/items/${props.item.id}/transcript`,
      { originalLabel: transcriptText.value, rawPath: props.item.filename },
    );
    updateItem({ ...props.item, transcript: result.transcript });
    showModal.value = false;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    statusMessage.value = `Failed: ${message}`;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors"
    :class="{ 'bg-blue-50 border-l-2 border-l-blue-500': isSelected }"
  >
    <div class="flex items-center justify-between mb-1">
      <span class="text-sm font-medium truncate">{{ item.filename }}</span>
      <span
        class="text-xs whitespace-nowrap ml-2"
        :class="statusColor(item.status)"
      >
        {{ statusIcon(item.status) }} {{ item.status.replace('_', ' ') }}
      </span>
    </div>
    <div class="text-xs text-gray-500">
      {{ formatDuration(item.duration) }}
      <span v-if="item.annotator" class="ml-2"
        >&middot; {{ item.annotator }}</span
      >
    </div>
    <div v-if="!item.transcript" class="mt-2 flex items-center gap-2">
      <span class="text-xs text-amber-600">No transcript</span>
      <button
        class="text-xs px-2 py-0.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
        @click.stop="openModal"
      >
        Add Transcript
      </button>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      @click.self="showModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">Add Transcript</h2>
          <button
            class="text-gray-400 hover:text-gray-600 text-xl"
            @click="showModal = false"
          >&#10005;</button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Transcript Text</label>
            <textarea
              v-model="transcriptText"
              rows="6"
              class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter transcript text..."
            />
          </div>
          <button
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            :disabled="!transcriptText.trim() || submitting"
            @click="handleSubmit"
          >
            {{ submitting ? 'Saving...' : 'Save Transcript' }}
          </button>
          <div v-if="statusMessage" class="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
            {{ statusMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
