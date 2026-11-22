<template>
  <nav
    v-if="lastPage > 1"
    class="flex items-center justify-between text-sm"
    aria-label="Pagination"
  >
    <button
      class="app-action-secondary"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
    >
      Précédent
    </button>
    <span class="text-quiet">Page {{ page }} sur {{ lastPage }}</span>
    <button
      class="app-action-secondary"
      :disabled="page >= lastPage"
      @click="emit('update:page', page + 1)"
    >
      Suivant
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ page: number; lastPage: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()
</script>
