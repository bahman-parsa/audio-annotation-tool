import { ref } from 'vue'
import type { Annotation } from '@/types'

export function useAnnotations() {
  const annotations = ref<Annotation[]>([])

  function setAnnotations(newAnnotations: Annotation[]) {
    annotations.value = newAnnotations
  }

  function addAnnotation(annotation: Annotation) {
    annotations.value.push(annotation)
  }

  function updateAnnotation(updated: Annotation) {
    const idx = annotations.value.findIndex((a) => a.id === updated.id)
    if (idx !== -1) annotations.value[idx] = updated
  }

  function removeAnnotation(id: string) {
    annotations.value = annotations.value.filter((a) => a.id !== id)
  }

  return {
    annotations,
    setAnnotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
  }
}
