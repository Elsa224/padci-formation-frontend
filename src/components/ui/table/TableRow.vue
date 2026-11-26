<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from 'cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tr
    data-slot="table-row"
    :class="
      cn(
        'hover:bg-mint/40 data-[state=selected]:bg-mint border-b border-line transition-colors has-aria-expanded:bg-muted/50',
        props.class,
      )
    "
  >
    <slot />
  </tr>
</template>
