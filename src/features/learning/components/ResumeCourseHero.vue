<template>
  <section class="app-panel-forest" aria-labelledby="resume-title" data-test="resume-hero">
    <!-- Trame discrète : lignes de circuit, en rappel des filières numériques -->
    <svg
      class="pointer-events-none absolute -top-6 -right-10 h-64 w-96 text-white/[0.06]"
      viewBox="0 0 384 256"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 200h96l32-32h96l32 32h128M48 120h80l24-24h112M160 40h96l40 40h88M96 248v-48M256 200v56M224 96v72"
        stroke="currentColor"
        stroke-width="2"
      />
      <circle cx="96" cy="200" r="5" fill="currentColor" />
      <circle cx="264" cy="96" r="5" fill="currentColor" />
      <circle cx="296" cy="80" r="5" fill="currentColor" />
      <circle cx="224" cy="168" r="5" fill="currentColor" />
    </svg>

    <div class="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
      <div class="min-w-0 space-y-4">
        <p class="text-sm font-medium text-savane">
          {{ progress.completed > 0 ? 'Reprendre ma formation' : 'Commencer ma formation' }}
        </p>
        <h2
          id="resume-title"
          class="max-w-[24ch] text-2xl leading-tight font-bold text-balance text-white sm:text-[1.9rem]"
        >
          {{ title }}
        </h2>
        <p v-if="progress.next" class="text-[0.95rem] text-forest-muted">
          Prochain chapitre :
          <span class="font-semibold text-white">{{ progress.next.title }}</span>
        </p>
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <RouterLink
            v-if="progress.next"
            :to="`/formations/${courseKey}/chapitres/${progress.next.key}`"
            class="app-action-accent"
          >
            {{ progress.completed > 0 ? 'Continuer' : 'Commencer' }}
          </RouterLink>
          <RouterLink
            :to="`/formations/${courseKey}`"
            class="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10"
          >
            Voir le sommaire
          </RouterLink>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-5 md:flex-col md:items-end md:gap-2">
        <ProgressRing
          :value="progress.ratio"
          :size="112"
          :stroke="9"
          tone="savane"
          on-dark
          label="Progression du cours"
        />
        <p class="text-sm text-forest-muted">
          <span class="font-semibold text-white tabular-nums">{{ progress.completed }}</span>
          sur {{ progress.total }} chapitres terminés
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressRing from '@/components/app/ProgressRing.vue'
import { courseProgress } from '@/components/app/courseProgress'
import { useCourseOutline } from '../composables/useLearningCourse'

const props = defineProps<{ courseKey: string; fallbackTitle: string }>()

const { data: outline } = useCourseOutline(computed(() => props.courseKey))
const progress = computed(() => courseProgress(outline.value))
const title = computed(() => outline.value?.title ?? props.fallbackTitle)
</script>
