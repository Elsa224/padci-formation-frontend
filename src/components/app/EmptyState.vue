<template>
  <div
    class="flex flex-col items-center px-6 py-10 text-center"
    :class="framed ? 'rounded-[18px] border border-dashed border-line-strong bg-white/60' : ''"
  >
    <div
      v-if="$slots.icon"
      class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-primary-shade"
      aria-hidden="true"
    >
      <slot name="icon" />
    </div>
    <p class="text-base font-semibold text-ink">{{ title }}</p>
    <p v-if="description" class="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-quiet">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-5 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; framed?: boolean }>(), {
  description: undefined,
  framed: false,
})
</script>
