<script setup lang="ts">
defineEmits<{
  save: []
}>()
</script>

<template>
  <div class="bg-white border rounded-lg p-4 flex items-center justify-between">
    <span class="text-sm text-gray-500">
      Keyboard: <kbd class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Ctrl/Cmd + Enter</kbd> Save &amp; Complete
    </span>
    <button
      class="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
      @click="$emit('save')"
    >
      Save &amp; Mark Completed
    </button>
  </div>
</template>
