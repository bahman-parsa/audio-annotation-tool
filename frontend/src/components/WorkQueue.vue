<script setup lang="ts">
import QueueItem from '@/components/QueueItem.vue';
import type { AudioItem } from '@/types';
import { useWorkQueue } from '@/composables/useWorkQueue';

defineProps<{
  items: AudioItem[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const { searchQuery, statusFilter, sortBy } = useWorkQueue();

const statuses = ['ALL', 'PENDING', 'NEW', 'READY'] as const;
const sortOptions = [
  { value: 'default', label: 'Default Order' },
  { value: 'duration-asc', label: 'Duration ↑' },
  { value: 'duration-desc', label: 'Duration ↓' },
] as const;
</script>

<template>
  <aside class="w-72 border-r bg-white flex flex-col shrink-0">
    <div class="p-3 border-b space-y-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search..."
        class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        v-model="statusFilter"
        class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="s in statuses" :key="s" :value="s">
          {{ s === 'ALL' ? 'All Statuses' : s.replace('_', ' ') }}
        </option>
      </select>
      <select
        v-model="sortBy"
        class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div
        v-if="items.length === 0"
        class="p-4 text-sm text-gray-400 text-center"
      >
        No items found
      </div>
      <QueueItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :is-selected="item.id === selectedId"
        @click="emit('select', item.id)"
      />
    </div>
  </aside>
</template>
