<template>
  <div class="w-full">
    <div v-if="label || showValue" class="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
      <span v-if="label" :class="onDark ? 'text-forest-muted' : 'text-quiet'">{{ label }}</span>
      <span
        v-if="showValue"
        class="font-semibold tabular-nums"
        :class="onDark ? 'text-white' : 'text-ink'"
        >{{ percent }} %</span
      >
    </div>
    <div
      class="h-2 w-full overflow-hidden rounded-full"
      :class="onDark ? 'bg-white/12' : 'bg-line/70'"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label ?? 'Progression'"
    >
      <div
        class="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
        :class="tone === 'savane' ? 'bg-savane' : 'bg-primary'"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0..1 */
    value: number
    label?: string
    showValue?: boolean
    tone?: 'leaf' | 'savane'
    onDark?: boolean
  }>(),
  { label: undefined, showValue: false, tone: 'leaf', onDark: false },
)

const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.value || 0)) * 100))
</script>
