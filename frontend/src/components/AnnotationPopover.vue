<script setup lang="ts">
import { ref } from 'vue'
import type { AnnotationType, TextSelection } from '@/types'

defineProps<{ selection: TextSelection }>()

const emit = defineEmits<{
  save: [data: { type: AnnotationType; attributes: Record<string, unknown> }]
  close: []
}>()

const selectedType = ref<AnnotationType>('MEDICAL_TERM')
const attributes = ref<Record<string, unknown>>({})

const types: AnnotationType[] = [
  'NUMBER', 'FORMATTING_COMMAND', 'MEDICAL_TERM', 'MEASUREMENT',
]

function handleSave() {
  emit('save', { type: selectedType.value, attributes: { ...attributes.value } })
}
</script>

<template>
  <div class="fixed inset-0 z-50" @click.self="emit('close')">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border p-6 w-96">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">Add Annotation</h3>
        <button class="text-gray-400 hover:text-gray-600" @click="emit('close')">&#10005;</button>
      </div>
      <div class="text-sm text-gray-500 mb-4">
        Selected: <span class="font-medium text-gray-700">"{{ selection.text }}"</span>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            v-model="selectedType"
            class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="t in types" :key="t" :value="t">{{ t.replace('_', ' ') }}</option>
          </select>
        </div>

        <template v-if="selectedType === 'NUMBER'">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rendering</label>
            <select v-model="attributes.rendering" class="w-full px-3 py-2 border rounded-md text-sm">
              <option value="words">Words</option>
              <option value="digits">Digits</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Normalized Value</label>
            <input v-model="attributes.normalizedValue" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="e.g. 12" />
          </div>
        </template>

        <template v-if="selectedType === 'FORMATTING_COMMAND'">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Command</label>
            <select v-model="attributes.command" class="w-full px-3 py-2 border rounded-md text-sm">
              <option value="newline">Newline</option>
              <option value="paragraph">Paragraph</option>
              <option value="period">Period</option>
              <option value="comma">Comma</option>
              <option value="colon">Colon</option>
              <option value="dash">Dash</option>
              <option value="bracket_open">Bracket Open</option>
              <option value="bracket_close">Bracket Close</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Is Command?</label>
            <select v-model="attributes.isCommand" class="w-full px-3 py-2 border rounded-md text-sm">
              <option :value="true">Yes (spoken instruction)</option>
              <option :value="false">No (literal words)</option>
            </select>
          </div>
        </template>

        <template v-if="selectedType === 'MEDICAL_TERM'">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="attributes.category" class="w-full px-3 py-2 border rounded-md text-sm">
              <option value="anatomy">Anatomy</option>
              <option value="procedure">Procedure</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="drug">Drug</option>
              <option value="device">Device</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input v-model="attributes.note" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="Optional note" />
          </div>
        </template>

        <template v-if="selectedType === 'MEASUREMENT'">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <input v-model="attributes.value" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="e.g. 1500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select v-model="attributes.unit" class="w-full px-3 py-2 border rounded-md text-sm">
              <option value="g">g</option>
              <option value="mg">mg</option>
              <option value="ug">&#181;g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="mmHg">mmHg</option>
              <option value="IE">IE</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="Ch">Ch</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Normalized Value</label>
            <input v-model="attributes.normalizedValue" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="Base unit value" />
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
