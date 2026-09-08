<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopBar from '@/components/TopBar.vue'
import WorkQueue from '@/components/WorkQueue.vue'
import RecordingMetadata from '@/components/RecordingMetadata.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import TranscriptEditor from '@/components/TranscriptEditor.vue'
import ActionFooter from '@/components/ActionFooter.vue'
import UploadModal from '@/components/UploadModal.vue'
import AnnotationPopover from '@/components/AnnotationPopover.vue'
import { useWorkQueue } from '@/composables/useWorkQueue'
import { useAnnotations } from '@/composables/useAnnotations'
import { useWordTimestamps } from '@/composables/useWordTimestamps'
import type { TextSelection, Annotation, AnnotationType } from '@/types'
import { api } from '@/services/api'

const { filteredItems, selectedItem, selectedId, selectItem, setItems } = useWorkQueue()
const { annotations, setAnnotations, addAnnotation, removeAnnotation } = useAnnotations()
const { estimate } = useWordTimestamps()

const showUploadModal = ref(false)
const showAnnotationPopover = ref(false)
const textSelection = ref<TextSelection | null>(null)
const currentTime = ref(0)
const correctedText = ref('')
const wordTimings = ref<ReturnType<typeof estimate>>([])

onMounted(async () => {
  try {
    const data = await api.get<{ items: unknown[] }>('/api/items')
    setItems(data.items as any[])
  } catch {
    setItems([])
  }
})

function selectQueueItem(id: string) {
  selectItem(id)
  const item = selectedItem.value
  if (item?.transcript) {
    correctedText.value = item.transcript.correctedText || item.transcript.originalLabel
    setAnnotations(item.transcript.annotations)
    wordTimings.value = estimate(correctedText.value, item.duration)
  }
}

function onTimeUpdate(time: number) {
  currentTime.value = time
}

function onCorrectedUpdate(text: string) {
  correctedText.value = text
}

function openAnnotationPopover(selection: TextSelection) {
  textSelection.value = selection
  showAnnotationPopover.value = true
}

function createAnnotation(data: { type: AnnotationType; attributes: Record<string, unknown> }) {
  if (!textSelection.value || !selectedItem.value?.transcript) return
  const ann: Annotation = {
    id: crypto.randomUUID(),
    transcriptId: selectedItem.value.transcript.id,
    startOffset: textSelection.value.startOffset,
    endOffset: textSelection.value.endOffset,
    text: textSelection.value.text,
    type: data.type,
    attributes: data.attributes,
  }
  addAnnotation(ann)
  showAnnotationPopover.value = false
  textSelection.value = null
}

async function handleSave() {
  if (!selectedItem.value?.transcript) return
  try {
    await api.put(`/api/items/${selectedItem.value.id}/transcript`, {
      correctedText: correctedText.value,
      annotations: annotations.value,
    })
  } catch (err) {
    console.error('Save failed:', err)
  }
}

async function handleExport() {
  try {
    const blob = await fetch('/api/export').then((r) => r.blob())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gold-standard.jsonl'
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export failed:', err)
  }
}

async function refreshItems() {
  try {
    const data = await api.get<{ items: unknown[] }>('/api/items')
    setItems(data.items as any[])
  } catch {
    // keep current items
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <TopBar
      @upload="showUploadModal = true"
      @export="handleExport"
    />
    <div class="flex flex-1 overflow-hidden">
      <WorkQueue
        :items="filteredItems"
        :selected-id="selectedId"
        @select="selectQueueItem"
      />
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="selectedItem" class="max-w-6xl mx-auto space-y-4">
          <RecordingMetadata :item="selectedItem" />
          <AudioPlayer
            :src="`/uploads/${selectedItem.filename}`"
            @time-update="onTimeUpdate"
          />
          <TranscriptEditor
            :original="selectedItem.transcript?.originalLabel ?? ''"
            :corrected="correctedText"
            :annotations="annotations"
            :current-time="currentTime"
            :word-timings="wordTimings"
            @update:corrected="onCorrectedUpdate"
            @annotate="openAnnotationPopover"
            @delete-annotation="removeAnnotation"
          />
          <ActionFooter @save="handleSave" />
        </div>
        <div v-else class="flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
            <p class="text-xl mb-2">No item selected</p>
            <p class="text-sm">Select an item from the queue or upload new files.</p>
          </div>
        </div>
      </main>
    </div>
    <UploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="refreshItems"
    />
    <AnnotationPopover
      v-if="showAnnotationPopover && textSelection"
      :selection="textSelection"
      @save="createAnnotation"
      @close="showAnnotationPopover = false"
    />
  </div>
</template>
