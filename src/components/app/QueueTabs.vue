<template>
  <!-- Filtre de file d'attente : un onglet par statut, avec son compteur.
       Remplace une liste déroulante : chaque état est visible d'un coup d'œil. -->
  <div
    role="tablist"
    :aria-label="label"
    class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="tab.value === modelValue"
      class="inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
      :class="
        tab.value === modelValue ? 'bg-forest text-white' : 'text-body hover:bg-mint hover:text-ink'
      "
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        class="min-w-6 rounded-full px-1.5 py-px text-center text-xs tabular-nums"
        :class="
          tab.value === modelValue
            ? 'bg-white/15 text-white'
            : tab.urgent && tab.count > 0
              ? 'bg-savane-soft text-savane-ink'
              : 'bg-canvas text-quiet'
        "
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
export interface QueueTab {
  value: string
  label: string
  count?: number | null
  /** Highlight a non-zero count: this queue is waiting on the viewer. */
  urgent?: boolean
}

defineProps<{ modelValue: string; tabs: QueueTab[]; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
