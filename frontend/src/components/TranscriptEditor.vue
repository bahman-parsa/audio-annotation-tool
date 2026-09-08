<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Annotation, WordTiming, TextSelection } from '@/types'

const props = defineProps<{
  original: string
  corrected: string
  annotations: Annotation[]
  currentTime: number
  wordTimings: WordTiming[]
}>()

const emit = defineEmits<{
  'update:corrected': [text: string]
  'annotate': [selection: TextSelection]
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

interface Segment {
  text: string
  startOffset: number
  endOffset: number
  annotationIds: string[]
  annotationTypes: string[]
}

const renderedCorrected = computed(() => {
  if (props.annotations.length === 0) return escapeHtml(props.corrected)

  const boundaries = new Set<number>()
  boundaries.add(0)
  boundaries.add(props.corrected.length)
  for (const ann of props.annotations) {
    boundaries.add(ann.startOffset)
    boundaries.add(ann.endOffset)
  }
  const sorted = Array.from(boundaries).sort((a, b) => a - b)

  const segments: Segment[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (start === end) continue
    const covering = props.annotations.filter(a => a.startOffset <= start && a.endOffset >= end)
    segments.push({
      text: props.corrected.slice(start, end),
      startOffset: start,
      endOffset: end,
      annotationIds: covering.map(a => a.id),
      annotationTypes: covering.map(a => a.type),
    })
  }

  return segments.map(seg => {
    const escaped = escapeHtml(seg.text)
    if (seg.annotationIds.length === 0) return escaped
    const classes = seg.annotationTypes.map(t => `annotation-${t.toLowerCase()}`).join(' ')
    return `<span class="annotation ${classes}" data-id="${seg.annotationIds.join(',')}">${escaped}</span>`
  }).join('')
})

function handleTextSelection() {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const text = selection.toString().trim()
  if (!text) return

  const range = selection.getRangeAt(0)
  const correctedDiv = correctedPanel.value
  if (!correctedDiv) return

  const preRange = document.createRange()
  preRange.selectNodeContents(correctedDiv)
  preRange.setEnd(range.startContainer, range.startOffset)
  const preText = preRange.toString()

  emit('annotate', {
    text,
    startOffset: preText.length,
    endOffset: preText.length + text.length,
  })

  selection.removeAllRanges()
}

function handleInput(e: Event) {
  const div = e.target as HTMLDivElement
  emit('update:corrected', div.textContent ?? '')
}

function handleAnnotationClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const span = target.closest('.annotation')
  if (!span) return
  const id = span.getAttribute('data-id')
  if (id) {
    id.split(',').forEach(annotationId => emit('delete-annotation', annotationId))
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
        <div class="panel-content original-content">{{ original }}</div>
      </div>
      <div
        ref="correctedPanel"
        class="transcript-panel"
        @scroll="syncScroll('corrected')"
      >
        <div class="panel-header">Corrected (Editable + Annotatable)</div>
        <div
          class="panel-content corrected-content"
          contenteditable="true"
          @mouseup="handleTextSelection"
          @input="handleInput"
          @click="handleAnnotationClick"
          v-html="renderedCorrected"
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

:deep(.annotation) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  position: relative;
  border-bottom: 2px solid;
}

:deep(.annotation-number) { background: #dbeafe; border-color: #3b82f6; }
:deep(.annotation-formatting_command) { background: #e0e7ff; border-color: #6366f1; }
:deep(.annotation-medical_term) { background: #fce7f3; border-color: #ec4899; }
:deep(.annotation-measurement) { background: #d1fae5; border-color: #10b981; }
</style>
