<script setup lang="ts">
import { ref, computed } from 'vue';
import { TranscriptAnnotator } from '@/lib/transcript-annotator';
import type { Annotation, WordTiming } from '@/types';

const props = defineProps<{
  originalText: string;
  annotations: Annotation[];
  wordTimings: WordTiming[];
}>();

const emit = defineEmits<{
  annotate: [data: { text: string; startOffset: number; endOffset: number }];
  'delete-annotation': [id: string];
  save: [];
  seek: [time: number];
}>();

const originalPanel = ref<HTMLDivElement>();
const correctedPanel = ref<HTMLDivElement>();
let isSyncing = false;

function syncScroll(source: 'original' | 'corrected') {
  if (isSyncing) return;
  isSyncing = true;

  const from =
    source === 'original' ? originalPanel.value! : correctedPanel.value!;
  const to =
    source === 'original' ? correctedPanel.value! : originalPanel.value!;

  const scrollPercent =
    from.scrollTop / (from.scrollHeight - from.clientHeight || 1);
  to.scrollTop = scrollPercent * (to.scrollHeight - to.clientHeight);

  requestAnimationFrame(() => {
    isSyncing = false;
  });
}

const annotator = computed(
  () => new TranscriptAnnotator(props.originalText, props.annotations),
);

const renderedHTML = computed(() => annotator.value.renderAnnotatedHTML());

function findAnnotatedWord(target: HTMLElement): {
  id?: string;
  start?: number;
  end?: number;
} {
  let el: HTMLElement | null = target;
  while (el && correctedPanel.value && !el.classList?.contains('word')) {
    if (el === correctedPanel.value) return {};
    el = el.parentElement;
  }
  if (!el) return {};
  const id = el.getAttribute('data-id') ?? undefined;
  const start = parseInt(el.getAttribute('data-start') ?? '-1', 10);
  return { id, start };
}

function handleWordDblClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const { start } = findAnnotatedWord(target);
  if (start < 0) return;

  const word = target.textContent?.trim() ?? '';
  if (!word) return;

  emit('annotate', {
    text: word,
    startOffset: start,
    endOffset: start + word.length,
  });
}

function handleWordClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const { id } = findAnnotatedWord(target);
  if (id) {
    emit('delete-annotation', id);
  }
}

const originalWordSpans = computed(() => {
  const words = props.originalText.split(/(\s+)/);
  let wordIndex = 0;
  return words
    .map((segment) => {
      if (/^\s+$/.test(segment)) {
        return `<span>${escapeHtml(segment)}</span>`;
      }
      const escaped = escapeHtml(segment);
      const span = `<span class="word" data-word-index="${wordIndex}">${escaped}</span>`;
      wordIndex++;
      return span;
    })
    .join('');
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function handleOriginalClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.classList?.contains('word')) return;

  const index = parseInt(target.getAttribute('data-word-index') ?? '-1', 10);
  if (index < 0 || index >= props.wordTimings.length) return;

  emit('seek', Math.max(0, props.wordTimings[index].startTime - 2));
}
</script>

<template>
  <div class="bg-white border rounded-lg">
    <h3 class="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">
      Transcript Editing &amp; Annotation
    </h3>
    <div class="transcript-panels">
      <div
        ref="originalPanel"
        class="transcript-panel"
        @scroll="syncScroll('original')"
      >
        <div class="panel-header">
          AI Original (Immutable)
          <span class="font-normal text-xs ml-2 normal-case"
            >click a word to seek audio</span
          >
        </div>
        <div
          class="panel-content original-content"
          :class="{ 'cursor-pointer': originalText.trim() }"
          v-html="originalWordSpans"
          @click="handleOriginalClick"
        />
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
        <div class="panel-footer">
          <button
            class="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!originalText.trim()"
            @click="emit('save')"
          >
            Save &amp; Mark Ready
          </button>
        </div>
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

.panel-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: white;
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

:deep(.word--medical) {
  background: #ede9fe;
  border-bottom: 2px solid #8b5cf6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:deep(.word--medical-label) {
  font-size: 0.7em;
  font-weight: 600;
  background: #ddd6fe;
  color: #7c3aed;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  margin-right: 0.25rem;
}

:deep(.word--measurement) {
  background: #ccfbf1;
  border-bottom: 2px solid #14b8a6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:deep(.word--measurement-label) {
  font-size: 0.7em;
  font-weight: 600;
  background: #99f6e4;
  color: #0d9488;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  margin-right: 0.25rem;
}

:deep(.word--entity-human) {
  background: #dbeafe;
  border-bottom: 2px solid #3b82f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:deep(.word--entity-organisation) {
  background: #e0e7ff;
  border-bottom: 2px solid #6366f1;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:deep(.word--entity-place) {
  background: #d1fae5;
  border-bottom: 2px solid #10b981;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:deep(.word--entity-date) {
  background: #fce7f3;
  border-bottom: 2px solid #ec4899;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:deep(.word--entity-label) {
  font-size: 0.7em;
  font-weight: 600;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  margin-right: 0.25rem;
}

:deep(.word--entity-human .word--entity-label) {
  background: #bfdbfe;
  color: #1d4ed8;
}

:deep(.word--entity-organisation .word--entity-label) {
  background: #c7d2fe;
  color: #4338ca;
}

:deep(.word--entity-place .word--entity-label) {
  background: #a7f3d0;
  color: #047857;
}

:deep(.word--entity-date .word--entity-label) {
  background: #fbcfe8;
  color: #be185d;
}
</style>
