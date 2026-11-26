<template>
  <div
    class="relative inline-grid shrink-0 place-items-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`${label ?? 'Progression'} : ${percent} %`"
  >
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="-rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
        :class="onDark ? 'stroke-white/12' : 'stroke-line/80'"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        class="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        :class="tone === 'savane' ? 'stroke-savane' : 'stroke-primary'"
      />
    </svg>
    <span
      class="absolute font-bold tabular-nums"
      :class="[
        onDark ? 'text-white' : 'text-ink',
        size >= 96 ? 'text-2xl' : size >= 72 ? 'text-lg' : 'text-sm',
      ]"
      aria-hidden="true"
      >{{ percent }}<span class="text-[0.6em] font-semibold">%</span></span
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0..1 */
    value: number
    size?: number
    stroke?: number
    label?: string
    tone?: 'leaf' | 'savane'
    onDark?: boolean
  }>(),
  { size: 96, stroke: 8, label: undefined, tone: 'leaf', onDark: false },
)

const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.value || 0)) * 100))
const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - percent.value / 100))
</script>
