<script setup lang="ts">
import { ref, computed } from 'vue'
import { TranscriptAnnotator } from '@/lib/transcript-annotator'
import type { Annotation } from '@/types'

const props = defineProps<{
  originalText: string
  annotations: Annotation[]
}>()

const emit = defineEmits<{
  'annotate': [data: { text: string; startOffset: number; endOffset: number }]
  'delete-annotation': [id: string]
}>()

const originalPanel = ref<HTMLDivElement>()
const correctedPanel = ref<HTMLDivElement>()
let isSyncing = false

function syncScroll(source: 'original' | 'corrected') {
  if (isSyncing) return
  isSyncing = true

  const from = source === 'original' ? originalPanel.value! : correctedPanel.value!
  const to = source === 'original' ? correctedPanel.value! : originalPanel.value!

  const scrollPercent = from.scrollTop / (from.scrollHeight - from.clientHeight || 1)
  to.scrollTop = scrollPercent * (to.scrollHeight - to.clientHeight)

  requestAnimationFrame(() => { isSyncing = false })
}

const annotator = computed(() =>
  new TranscriptAnnotator(props.originalText, props.annotations)
)

const renderedHTML = computed(() => annotator.value.renderAnnotatedHTML())

function findAnnotatedWord(target: HTMLElement): { id?: string; start?: number; end?: number } {
  let el: HTMLElement | null = target
  while (el && correctedPanel.value && !el.classList?.contains('word')) {
    if (el === correctedPanel.value) return {}
    el = el.parentElement
  }
  if (!el) return {}
  const id = el.getAttribute('data-id') ?? undefined
  const start = parseInt(el.getAttribute('data-start') ?? '-1', 10)
  return { id, start }
}

function handleWordDblClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const { start } = findAnnotatedWord(target)
  if (start < 0) return

  const word = target.textContent?.trim() ?? ''
  if (!word) return

  emit('annotate', {
    text: word,
    startOffset: start,
    endOffset: start + word.length,
  })
}

function handleWordClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const { id } = findAnnotatedWord(target)
  if (id) {
    emit('delete-annotation', id)
  }
}
</script>

<template>
  <div class="bg-white border rounded-lg">
    <h3 class="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Transcript Editing &amp; Annotation</h3>
    <div class="transcript-panels">
      <div
        ref="originalPanel"
        class="transcript-panel"
        @scroll="syncScroll('original')"
      >
        <div class="panel-header">AI Original (Immutable)</div>
        <div class="panel-content original-content">{{ originalText }}</div>
      </div>
      <div
        ref="correctedPanel"
        class="transcript-panel"
        @scroll="syncScroll('corrected')"
      >
        <div class="panel-header">Corrected (Editable + Annotatable)</div>
        <div
          class="panel-content corrected-content"
          v-html="renderedHTML"
          @dblclick="handleWordDblClick"
          @click="handleWordClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.transcript-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #e2e8f0;
  height: 320px;
}

.transcript-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  font-weight: 600;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.panel-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  line-height: 1.75;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9rem;
}

.original-content {
  background: #f8fafc;
  color: #64748b;
  cursor: default;
}

.corrected-content {
  background: white;
  outline: none;
  cursor: text;
}

:deep(.word) {
  position: relative;
  cursor: pointer;
}

:deep(.word--deleted s) {
  color: #dc2626;
  text-decoration: line-through;
}

:deep(.word--updated s) {
  color: #9ca3af;
  text-decoration: line-through;
}

:deep(.word--new) {
  color: #059669;
  font-weight: 600;
}

:deep(.word--number) {
  background: #dbeafe;
  border-bottom: 2px solid #3b82f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>
