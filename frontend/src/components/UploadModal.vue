<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'

const emit = defineEmits<{
  close: []
  uploaded: []
}>()

const uploadStatus = ref('')
const jsonInput = ref('')
const selectedFiles = ref<File[]>([])

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    selectedFiles.value = Array.from(input.files)
  }
}

async function handleUpload() {
  if (selectedFiles.value.length === 0 && !jsonInput.value.trim()) return

  uploadStatus.value = 'Uploading...'
  const formData = new FormData()

  for (const file of selectedFiles.value) {
    formData.append('files', file)
  }

  if (jsonInput.value.trim()) {
    formData.append('transcripts', jsonInput.value)
  }

  try {
    const result = await api.upload<{
      uploaded: number
      matched: number
      errors: string[]
      unmatched: string[]
    }>('/api/upload', formData)

    const parts: string[] = []
    if (result.uploaded > 0) parts.push(`Uploaded ${result.uploaded} file(s)`)
    if (result.matched > 0) parts.push(`Matched ${result.matched} transcript(s)`)
    uploadStatus.value = parts.join('. ') + '.'

    if (result.errors.length > 0) {
      uploadStatus.value += ` Errors: ${result.errors.join(', ')}`
    }
    if (result.unmatched.length > 0) {
      uploadStatus.value += ` Unmatched transcripts: ${result.unmatched.join(', ')}`
    }

    if (result.uploaded > 0 || result.matched > 0) {
      emit('uploaded')
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    uploadStatus.value = `Upload failed: ${message}`
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" @click.self="emit('close')">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
      <div class="flex items-center justify-between p-4 border-b">
        <h2 class="text-lg font-semibold">Upload Audio & Transcripts</h2>
        <button class="text-gray-400 hover:text-gray-600 text-xl" @click="emit('close')">&#10005;</button>
      </div>
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Audio Files</label>
          <div class="border-2 border-dashed rounded-lg p-6 text-center">
            <p class="text-gray-500 mb-2">Select .wav, .mp3, or .m4a files</p>
            <input type="file" multiple accept=".wav,.mp3,.m4a" @change="handleFileSelect" class="block mx-auto" />
          </div>
          <div v-if="selectedFiles.length > 0" class="text-sm text-gray-600 mt-1">
            {{ selectedFiles.length }} file(s) selected
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Transcript JSON (optional)</label>
          <textarea
            v-model="jsonInput"
            rows="6"
            class="w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='[{"path": "audio/file.wav", "label": "Transcript text..."}]'
          />
        </div>

        <button
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          :disabled="selectedFiles.length === 0 && !jsonInput.trim()"
          @click="handleUpload"
        >
          Upload
        </button>

        <div v-if="uploadStatus" class="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
          {{ uploadStatus }}
        </div>
      </div>
    </div>
  </div>
</template>
