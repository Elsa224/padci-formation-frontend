<template>
  <div class="min-w-0" :class="framed ? 'app-panel' : ''">
    <p class="flex items-center gap-2 text-sm font-medium text-quiet">
      <span
        v-if="tone !== 'neutral'"
        class="h-2 w-2 shrink-0 rounded-full"
        :class="dotClass"
        aria-hidden="true"
      />
      {{ label }}
    </p>
    <div v-if="loading" class="app-skeleton mt-2 h-8 w-20" />
    <p
      v-else
      class="mt-1.5 text-[1.9rem] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums"
    >
      {{ value }}
    </p>
    <p v-if="hint && !loading" class="mt-2 text-xs text-quiet">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    loading?: boolean
    framed?: boolean
    /** Colour dot carrying meaning (status), not decoration. */
    tone?: 'neutral' | 'leaf' | 'savane' | 'danger' | 'info'
  }>(),
  { hint: undefined, loading: false, framed: false, tone: 'neutral' },
)

const dotClass = computed(
  () =>
    ({
      neutral: '',
      leaf: 'bg-primary',
      savane: 'bg-savane',
      danger: 'bg-danger-ink',
      info: 'bg-info',
    })[props.tone],
)
</script>
