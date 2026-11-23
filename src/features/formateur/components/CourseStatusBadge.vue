<template>
  <span
    class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="tone"
  >
    {{ courseStatusLabels[status] ?? status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { courseStatusLabels, type CourseStatus } from '../composables/useTrainerCourses'

const props = defineProps<{ status: CourseStatus }>()

const tone = computed(() => {
  switch (props.status) {
    case 'published':
    case 'approved':
      return 'bg-primary/10 text-primary'
    case 'submitted':
    case 'in_review':
      return 'bg-warning-soft text-warning-ink'
    case 'rejected':
    case 'suspended':
      return 'bg-danger-soft text-danger-ink'
    default:
      return 'bg-canvas text-quiet'
  }
})
</script>
