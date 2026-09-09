<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'

const emit = defineEmits<{
  close: []
  uploaded: []
}>()

const uploadStatus = ref('')
const selectedFiles = ref<File[]>([])
const transcriptFile = ref<File | null>(null)
const transcriptJson = ref('')
const transcriptError = ref('')
const audioInput = ref<HTMLInputElement | null>(null)
const transcriptInput = ref<HTMLInputElement | null>(null)

function triggerAudioInput() {
  audioInput.value?.click()
}

function triggerTranscriptInput() {
  transcriptInput.value?.click()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(input.files)]
  }
  input.value = ''
}

function removeFile(index: number) {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
}

function handleTranscriptFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  transcriptError.value = ''
  transcriptJson.value = ''

  const reader = new FileReader()
  reader.onload = () => {
    const text = reader.result as string
    try {
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : [parsed]

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item || typeof item !== 'object') {
          transcriptError.value = `Item at index ${i} is not an object`
          return
        }
        if (typeof item.path !== 'string' || !item.path) {
          transcriptError.value = `Item at index ${i} is missing or invalid "path"`
          return
        }
        if (typeof item.label !== 'string' || !item.label) {
          transcriptError.value = `Item at index ${i} is missing or invalid "label"`
          return
        }
      }

      transcriptFile.value = file
      transcriptJson.value = JSON.stringify(items)
    } catch {
      transcriptError.value = 'Invalid JSON file'
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function clearTranscript() {
  transcriptFile.value = null
  transcriptJson.value = ''
  transcriptError.value = ''
}

async function handleUpload() {
  if (selectedFiles.value.length === 0 && !transcriptJson.value) return

  uploadStatus.value = 'Uploading...'
  const formData = new FormData()

  for (const file of selectedFiles.value) {
    formData.append('files', file)
  }

  if (transcriptJson.value) {
    formData.append('transcripts', transcriptJson.value)
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
          <div class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer" @click="triggerAudioInput">
            <p class="text-gray-500 mb-2">Select .wav, .mp3, or .m4a files</p>
            <input ref="audioInput" type="file" multiple accept=".wav,.mp3,.m4a" @change="handleFileSelect" class="sr-only" />
          </div>
          <div v-if="selectedFiles.length > 0" class="mt-2 space-y-1">
            <div v-for="(file, index) in selectedFiles" :key="index" class="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
              <span class="truncate text-gray-700">{{ file.name }}</span>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <span class="text-gray-400 text-xs">{{ formatFileSize(file.size) }}</span>
                <button class="text-red-400 hover:text-red-600 text-xs" @click="removeFile(index)">&#10005;</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Transcript JSON File (optional)</label>
          <div class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer" @click="triggerTranscriptInput">
            <p class="text-gray-500 mb-2">Select a .json file</p>
            <input ref="transcriptInput" type="file" accept=".json" @change="handleTranscriptFileSelect" class="sr-only" />
          </div>
          <div v-if="transcriptFile" class="mt-2 flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
            <span class="truncate text-gray-700">{{ transcriptFile.name }}</span>
            <button class="text-red-400 hover:text-red-600 text-xs shrink-0 ml-2" @click="clearTranscript">&#10005;</button>
          </div>
          <div v-if="transcriptError" class="mt-2 text-sm text-red-600">
            {{ transcriptError }}
          </div>
        </div>

        <button
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          :disabled="selectedFiles.length === 0 && !transcriptJson"
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
