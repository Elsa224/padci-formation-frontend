<template>
  <span class="inline-flex flex-wrap items-center gap-2">
    <button
      v-if="!asking"
      type="button"
      :class="buttonClass"
      data-test="confirm-button"
      @click="asking = true"
    >
      {{ label }}
    </button>
    <span
      v-else
      class="inline-flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-800"
      role="alert"
    >
      {{ confirm }}
      <button type="button" class="font-semibold underline" @click="asking = false">Annuler</button>
      <button
        type="button"
        class="font-semibold"
        data-test="confirm-yes"
        @click="
          () => {
            asking = false
            emit('confirm')
          }
        "
      >
        Confirmer
      </button>
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{ label: string; confirm: string; buttonClass?: string }>(), {
  buttonClass: 'text-red-700',
})
const emit = defineEmits<{ confirm: [] }>()
const asking = ref(false)
</script>
