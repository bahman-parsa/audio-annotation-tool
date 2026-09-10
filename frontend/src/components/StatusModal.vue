<script setup lang="ts">
defineProps<{
  message: string;
  isError?: boolean;
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" @click.self="emit('close')">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-6 text-center">
        <p class="text-sm" :class="isError ? 'text-red-700' : 'text-gray-700'">{{ message }}</p>
      </div>
      <div class="px-6 pb-6">
        <button
          class="w-full px-4 py-2 text-white rounded-md transition-colors"
          :class="isError ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
          @click="emit('close')"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>
