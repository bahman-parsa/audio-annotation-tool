<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AudioItem } from '@/types';
import { api } from '@/services/api';
import { useWorkQueue } from '@/composables/useWorkQueue';

const props = defineProps<{
  item: AudioItem;
  isSelected: boolean;
}>();

const { updateItem } = useWorkQueue();

const showModal = ref(false);
const modalMode = ref<'add' | 'update'>('add');
const transcriptText = ref('');
const submitting = ref(false);
const showConfirm = ref(false);
const showDeleteConfirm = ref(false);

const emit = defineEmits<{
  status: [data: { message: string; isError: boolean }]
}>();

const annotationCount = computed(() => props.item.transcript?.annotations.length ?? 0);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    NEW: 'bg-blue-100 text-blue-800',
    READY: 'bg-green-100 text-green-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}

function statusIcon(status: string) {
  const icons: Record<string, string> = {
    PENDING: '\u25CB',
    NEW: '\u25C9',
    READY: '\u25CF',
  };
  return icons[status] ?? '?';
}

function openAddModal() {
  modalMode.value = 'add';
  transcriptText.value = '';
  submitting.value = false;
  showConfirm.value = false;
  showModal.value = true;
}

function openUpdateModal() {
  modalMode.value = 'update';
  transcriptText.value = '';
  submitting.value = false;
  showConfirm.value = false;
  showModal.value = true;
}

function handleSubmit() {
  if (modalMode.value === 'update' && annotationCount.value > 0 && !showConfirm.value) {
    showConfirm.value = true;
    return;
  }
  doSubmit();
}

async function doSubmit() {
  if (!transcriptText.value.trim() || submitting.value) return;

  submitting.value = true;

  try {
    if (modalMode.value === 'add') {
      const result = await api.post<{ transcript: AudioItem['transcript'] }>(
        `/api/items/${props.item.id}/transcript`,
        { originalLabel: transcriptText.value, rawPath: props.item.filename },
      );
      updateItem({ ...props.item, status: 'NEW', transcript: result.transcript });
      emit('status', { message: 'Transcript added.', isError: false });
    } else {
      const result = await api.put<{ item: AudioItem }>(
        `/api/items/${props.item.id}/transcript/replace`,
        { originalLabel: transcriptText.value },
      );
      updateItem(result.item);
      emit('status', { message: 'Transcript replaced.', isError: false });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    emit('status', { message: `Failed: ${message}`, isError: true });
  } finally {
    submitting.value = false;
    showModal.value = false;
  }
}

async function handleDelete() {
  if (submitting.value) return;

  submitting.value = true;

  try {
    const result = await api.delete<{ item: AudioItem }>(
      `/api/items/${props.item.id}/transcript`,
    );
    updateItem(result.item);
    showDeleteConfirm.value = false;
    emit('status', { message: 'Transcript deleted.', isError: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    emit('status', { message: `Failed: ${message}`, isError: true });
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
        @click.stop="openAddModal"
      >
        Add Transcript
      </button>
    </div>
    <div v-else class="mt-2 flex items-center gap-2">
      <button
        class="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        @click.stop="openUpdateModal"
      >
        Update Transcript
      </button>
      <button
        class="text-xs px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        @click.stop="showDeleteConfirm = true"
      >
        Delete Transcript
      </button>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      @click.self="showModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">{{ modalMode === 'add' ? 'Add Transcript' : 'Update Transcript' }}</h2>
          <button
            class="text-gray-400 hover:text-gray-600 text-xl"
            @click="showModal = false"
          >&#10005;</button>
        </div>
        <div class="p-4 space-y-4">
          <div v-if="showConfirm" class="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            This transcript has {{ annotationCount }} annotation(s) that will be removed. Do you want to continue?
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Transcript Text</label>
            <textarea
              v-model="transcriptText"
              rows="6"
              class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter transcript text..."
            />
          </div>
          <div class="flex gap-2">
            <button
              v-if="showConfirm"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              @click="showConfirm = false"
            >
              Cancel
            </button>
            <button
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              :disabled="!transcriptText.trim() || submitting"
              @click="handleSubmit"
            >
              {{ submitting ? 'Saving...' : (modalMode === 'add' ? 'Save Transcript' : 'Replace Transcript') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-4 space-y-4">
        <h2 class="text-lg font-semibold">Delete Transcript?</h2>
        <p class="text-sm text-gray-600">
          This will remove the transcript and all {{ annotationCount }} annotation(s). This action cannot be undone.
        </p>
        <div class="flex gap-2">
          <button
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            :disabled="submitting"
            @click="handleDelete"
          >
            {{ submitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
