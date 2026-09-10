<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TopBar from '@/components/TopBar.vue';
import WorkQueue from '@/components/WorkQueue.vue';
import RecordingMetadata from '@/components/RecordingMetadata.vue';
import AudioPlayer from '@/components/AudioPlayer.vue';
import TranscriptEditor from '@/components/TranscriptEditor.vue';
import UploadModal from '@/components/UploadModal.vue';
import AnnotationPopover from '@/components/AnnotationPopover.vue';
import StatusModal from '@/components/StatusModal.vue';
import { useWorkQueue } from '@/composables/useWorkQueue';
import { useWordTimestamps } from '@/composables/useWordTimestamps';
import { TranscriptAnnotator } from '@/lib/transcript-annotator';
import type { Annotation, AnnotationType, AudioItem } from '@/types';
import { api } from '@/services/api';

const { filteredItems, selectedItem, selectedId, selectItem, setItems, updateItem } =
  useWorkQueue();
const { estimate } = useWordTimestamps();

const showUploadModal = ref(false);
const showAnnotationPopover = ref(false);
const popoverWord = ref('');
const popoverStartOffset = ref(0);
const popoverEndOffset = ref(0);
const currentTime = ref(0);
const wordTimings = ref<ReturnType<typeof estimate>>([]);

const annotator = ref<TranscriptAnnotator | null>(null);
const annotations = ref<Annotation[]>([]);
const statusModalMessage = ref('');
const statusModalError = ref(false);

function showStatus(message: string, isError = false) {
  statusModalMessage.value = message;
  statusModalError.value = isError;
}

onMounted(async () => {
  try {
    const data = await api.get<{ items: unknown[] }>('/api/items');
    setItems(data.items as any[]);
  } catch {
    setItems([]);
  }
});

function selectQueueItem(id: string) {
  selectItem(id);
  const item = selectedItem.value;

  annotator.value = null;
  annotations.value = [];
  wordTimings.value = [];

  if (item?.transcript) {
    annotator.value = new TranscriptAnnotator(
      item.transcript.originalLabel,
      item.transcript.annotations as Annotation[],
    );
    annotations.value = annotator.value.getAnnotations();
    wordTimings.value = estimate(item.transcript.originalLabel, item.duration);
  }
}

function onTimeUpdate(time: number) {
  currentTime.value = time;
}

function openAnnotationPopover(data: {
  text: string;
  startOffset: number;
  endOffset: number;
}) {
  popoverWord.value = data.text;
  popoverStartOffset.value = data.startOffset;
  popoverEndOffset.value = data.endOffset;
  showAnnotationPopover.value = true;
}

function createAnnotation(data: {
  type: AnnotationType;
  attributes: Record<string, unknown>;
}) {
  if (!annotator.value) return;
  annotator.value.addAnnotation({
    text: popoverWord.value,
    startOffset: popoverStartOffset.value,
    endOffset: popoverEndOffset.value,
    type: data.type,
    attributes: data.attributes,
  });
  annotations.value = annotator.value.getAnnotations();
  showAnnotationPopover.value = false;
}

function removeAnnotation(id: string) {
  if (!annotator.value) return;
  annotator.value.removeAnnotation(id);
  annotations.value = annotator.value.getAnnotations();
}

async function handleSave() {
  if (!selectedItem.value?.transcript || !annotator.value) return;
  try {
    const result = await api.put<{ item: AudioItem }>(`/api/items/${selectedItem.value.id}/transcript`, {
      correctedText: annotator.value.getCorrectedText(),
      annotations: annotator.value.getAnnotations(),
    });
    updateItem(result.item);
    showStatus('Saved.');
  } catch (err) {
    showStatus('Save failed.', true);
    console.error('Save failed:', err);
  }
}

async function handleExport() {
  try {
    const blob = await fetch('/api/export').then((r) => r.blob());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    a.download = `export_${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed:', err);
  }
}

async function refreshItems() {
  try {
    const data = await api.get<{ items: unknown[] }>('/api/items');
    setItems(data.items as any[]);
  } catch {
    // keep current items
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <TopBar @upload="showUploadModal = true" @export="handleExport" />
    <div class="flex flex-1 overflow-hidden">
      <WorkQueue
        :items="filteredItems"
        :selected-id="selectedId"
        @select="selectQueueItem"
        @status="showStatus($event.message, $event.isError)"
      />
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="selectedItem" class="max-w-6xl mx-auto space-y-4">
          <RecordingMetadata :item="selectedItem" />
          <AudioPlayer
            :src="`/uploads/${selectedItem.filename}`"
            @time-update="onTimeUpdate"
          />
          <TranscriptEditor
            :original-text="selectedItem.transcript?.originalLabel ?? ''"
            :annotations="annotations"
            @annotate="openAnnotationPopover"
            @delete-annotation="removeAnnotation"
            @save="handleSave"
          />
        </div>
        <div
          v-else
          class="flex items-center justify-center h-full text-gray-400"
        >
          <div class="text-center">
            <p class="text-xl mb-2">No item selected</p>
            <p class="text-sm">
              Select an item from the queue or upload new files.
            </p>
          </div>
        </div>
      </main>
    </div>
    <UploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="refreshItems"
      @status="showStatus($event.message, $event.isError)"
    />
    <AnnotationPopover
      v-if="showAnnotationPopover"
      :word="popoverWord"
      :start-offset="popoverStartOffset"
      :end-offset="popoverEndOffset"
      @save="createAnnotation"
      @close="showAnnotationPopover = false"
    />
    <StatusModal
      v-if="statusModalMessage"
      :message="statusModalMessage"
      :is-error="statusModalError"
      @close="statusModalMessage = ''"
    />
  </div>
</template>
