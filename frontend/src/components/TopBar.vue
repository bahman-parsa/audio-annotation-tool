<script setup lang="ts">
defineEmits<{
  upload: []
  export: []
}>()
</script>

<template>
  <header class="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-2">
      <h1 class="text-lg font-semibold">IKIM Annotation Tool</h1>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        @click="$emit('upload')"
      >
        + Upload Files / JSON
      </button>
      <button
        class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        @click="$emit('export')"
      >
        Export Gold Standard (JSONL)
      </button>
    </div>
  </header>
</template>
