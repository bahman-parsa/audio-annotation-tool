import { ref, computed } from 'vue'
import type { AudioItem, Status } from '@/types'

export type SortBy = 'default' | 'duration-asc' | 'duration-desc'

const items = ref<AudioItem[]>([])
const searchQuery = ref('')
const statusFilter = ref<Status | 'ALL'>('ALL')
const sortBy = ref<SortBy>('default')
const selectedId = ref<string | null>(null)

const filteredItems = computed(() => {
  let result = items.value
  if (statusFilter.value !== 'ALL') {
    result = result.filter((item) => item.status === statusFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((item) => item.filename.toLowerCase().includes(q))
  }
  if (sortBy.value === 'duration-asc') {
    result = [...result].sort((a, b) => a.duration - b.duration)
  } else if (sortBy.value === 'duration-desc') {
    result = [...result].sort((a, b) => b.duration - a.duration)
  }
  return result
})

const selectedItem = computed(() =>
  items.value.find((item) => item.id === selectedId.value) ?? null
)

export function useWorkQueue() {
  function selectItem(id: string) { selectedId.value = id }
  function setItems(newItems: AudioItem[]) { items.value = newItems }
  function updateItem(updated: AudioItem) {
    const idx = items.value.findIndex((i) => i.id === updated.id)
    if (idx !== -1) items.value[idx] = updated
  }

  return {
    items,
    searchQuery,
    statusFilter,
    sortBy,
    selectedId,
    filteredItems,
    selectedItem,
    selectItem,
    setItems,
    updateItem,
  }
}
