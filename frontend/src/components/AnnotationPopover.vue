<script setup lang="ts">
import { ref } from 'vue'
import type { AnnotationType } from '@/types'

defineProps<{
  word: string
  startOffset: number
  endOffset: number
}>()

const emit = defineEmits<{
  save: [data: { type: AnnotationType; attributes: Record<string, unknown> }]
  close: []
}>()

const selectedType = ref<'number' | 'crud' | 'medical'>('number')

// NUMBER fields
const rendering = ref<'digits' | 'words'>('digits')
const normalizedValue = ref('')

// CRUD fields
const crudMode = ref<'update' | 'delete'>('update')
const newText = ref('')

// MEDICAL_TERM fields
const medicalCategory = ref<string>('drug')
const medicalNote = ref('')

const medicalCategories = [
  { value: 'anatomy', label: 'Anatomy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'drug', label: 'Drug' },
  { value: 'device', label: 'Device' },
]

function handleSave() {
  if (selectedType.value === 'number') {
    const val = rendering.value === 'digits'
      ? Number(normalizedValue.value)
      : normalizedValue.value
    if (rendering.value === 'digits' && isNaN(val as number)) return
    emit('save', {
      type: 'NUMBER',
      attributes: { rendering: rendering.value, normalizedValue: val },
    })
  } else if (selectedType.value === 'medical') {
    emit('save', {
      type: 'MEDICAL_TERM',
      attributes: { category: medicalCategory.value, note: medicalNote.value.trim() },
    })
  } else {
    if (crudMode.value === 'delete') {
      emit('save', { type: 'CRUD', attributes: { mode: 'delete' } })
    } else {
      if (!newText.value.trim()) return
      emit('save', {
        type: 'CRUD',
        attributes: { mode: 'update', normalizedValue: newText.value.trim() },
      })
    }
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50" @click.self="emit('close')">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border p-6 w-96">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">Annotate Word</h3>
        <button class="text-gray-400 hover:text-gray-600" @click="emit('close')">&#10005;</button>
      </div>
      <div class="text-sm text-gray-500 mb-4">
        Selected: <span class="font-medium text-gray-700">"{{ word }}"</span>
      </div>
      <div class="space-y-4">
        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-2 text-sm rounded-md border transition-colors"
            :class="selectedType === 'number' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            @click="selectedType = 'number'"
          >NUMBER</button>
          <button
            class="flex-1 px-3 py-2 text-sm rounded-md border transition-colors"
            :class="selectedType === 'crud' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            @click="selectedType = 'crud'"
          >CRUD</button>
          <button
            class="flex-1 px-3 py-2 text-sm rounded-md border transition-colors"
            :class="selectedType === 'medical' ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            @click="selectedType = 'medical'"
          >MEDICAL</button>
        </div>

        <template v-if="selectedType === 'number'">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rendering</label>
            <select v-model="rendering" class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="digits">Digits</option>
              <option value="words">Words</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Normalized Value</label>
            <input v-model="normalizedValue" :type="rendering === 'digits' ? 'number' : 'text'" class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="rendering === 'digits' ? 'e.g. 12' : 'e.g. zwoelf'" />
          </div>
        </template>

        <template v-if="selectedType === 'crud'">
          <div class="flex gap-2">
            <button
              class="flex-1 px-3 py-2 text-sm rounded-md border transition-colors"
              :class="crudMode === 'update' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              @click="crudMode = 'update'"
            >Update</button>
            <button
              class="flex-1 px-3 py-2 text-sm rounded-md border transition-colors"
              :class="crudMode === 'delete' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              @click="crudMode = 'delete'"
            >Delete</button>
          </div>
          <template v-if="crudMode === 'update'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Text</label>
              <input v-model="newText" class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" :placeholder="`Replace '${word}\' with...`" />
            </div>
          </template>
          <template v-if="crudMode === 'delete'">
            <div class="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              This word will be marked as deleted in the corrected text.
            </div>
          </template>
        </template>

        <template v-if="selectedType === 'medical'">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="medicalCategory" class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option v-for="cat in medicalCategories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input v-model="medicalNote" class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Additional context..." />
          </div>
        </template>

        <div class="flex justify-end gap-2 pt-2">
          <button class="px-4 py-2 text-sm border rounded-md hover:bg-gray-50" @click="emit('close')">Cancel</button>
          <button class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700" @click="handleSave">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>
