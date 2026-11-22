<template>
  <div class="app-page">
    <RouterLink
      to="/formations/dashboard"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-quiet transition hover:text-primary-shade"
    >
      <ChevronLeftIcon :size="16" aria-hidden="true" />
      Mon tableau de bord
    </RouterLink>

    <div v-if="isPending" class="space-y-4">
      <div class="app-skeleton h-40" />
      <div class="app-skeleton h-72" />
    </div>
    <div v-else-if="isError" class="app-panel">
      <EmptyState
        title="Ce cours n'est pas disponible."
        :description="(error as ApiError)?.message ?? 'Réessayez dans quelques instants.'"
      />
    </div>

    <template v-else-if="course">
      <!-- En-tête du cours -->
      <header class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div class="min-w-0 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="app-chip app-chip-leaf">{{ levelLabel(course.level) }}</span>
            <span v-if="course.pathway" class="text-sm text-quiet">
              Filière {{ course.pathway.name }}
            </span>
          </div>
          <h1 class="app-page-title max-w-[26ch]">{{ course.title }}</h1>
          <p v-if="course.summary" class="app-page-copy">{{ course.summary }}</p>
        </div>

        <div
          v-if="course.has_access"
          class="flex items-center gap-5 rounded-[18px] border border-line bg-white p-5 shadow-panel"
        >
          <ProgressRing
            :value="progress.ratio"
            :size="84"
            :stroke="8"
            label="Progression du cours"
          />
          <div class="space-y-3">
            <p class="text-sm text-quiet">
              <span class="font-semibold text-ink tabular-nums">{{ progress.completed }}</span>
              sur {{ progress.total }} chapitres terminés
            </p>
            <RouterLink
              v-if="progress.next"
              :to="`/formations/${course.key}/chapitres/${progress.next.key}`"
              class="app-action-primary"
            >
              {{ progress.completed > 0 ? 'Continuer' : 'Commencer le cours' }}
            </RouterLink>
          </div>
        </div>
      </header>

      <!-- Parcours : modules et chapitres en séquence -->
      <section class="space-y-8" aria-labelledby="syllabus-title">
        <h2 id="syllabus-title" class="text-lg font-bold text-ink">Parcours du cours</h2>

        <EmptyState
          v-if="course.modules.length === 0"
          framed
          title="Aucun module publié pour l'instant"
          description="Le contenu apparaîtra ici dès sa publication par votre formateur."
        />

        <section
          v-for="module in course.modules"
          :key="module.key"
          class="grid gap-4 md:grid-cols-[13rem_1fr]"
          :aria-label="`Module ${module.position} : ${module.title}`"
        >
          <div class="md:pt-3">
            <p class="text-sm font-medium text-savane-ink">Module {{ module.position }}</p>
            <h3 class="mt-1 text-lg leading-snug font-bold text-ink">{{ module.title }}</h3>
            <p class="mt-1 text-sm text-quiet">
              {{ moduleDone(module) }} / {{ module.chapters.length }} terminés
            </p>
          </div>

          <ol class="relative rounded-[18px] border border-line bg-white p-2 shadow-panel">
            <li v-for="(chapter, index) in module.chapters" :key="chapter.key" class="relative">
              <!-- Rail reliant les jalons -->
              <span
                v-if="index < module.chapters.length - 1"
                class="absolute top-10 bottom-[-0.5rem] left-[1.9rem] w-px"
                :class="chapter.progress?.status === 'completed' ? 'bg-primary/40' : 'bg-line'"
                aria-hidden="true"
              />
              <component
                :is="chapter.locked ? 'div' : RouterLink"
                v-bind="
                  chapter.locked ? {} : { to: `/formations/${course.key}/chapitres/${chapter.key}` }
                "
                class="group relative flex items-center gap-4 rounded-xl px-3 py-3"
                :class="chapter.locked ? 'cursor-not-allowed' : 'transition hover:bg-mint/60'"
              >
                <span
                  class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white"
                  :class="nodeClass(chapter)"
                  aria-hidden="true"
                >
                  <CheckIcon
                    v-if="chapter.progress?.status === 'completed'"
                    :size="15"
                    :stroke-width="3"
                  />
                  <LockIcon v-else-if="chapter.locked" :size="13" />
                  <template v-else>{{ chapter.position }}</template>
                </span>
                <span class="min-w-0 flex-1">
                  <span
                    class="block font-semibold"
                    :class="
                      chapter.locked ? 'text-quiet' : 'text-ink group-hover:text-primary-shade'
                    "
                    >{{ chapter.title }}</span
                  >
                  <span class="block text-sm text-quiet">
                    {{ chapterTypeLabel(chapter.type) }}
                    <template v-if="chapter.duration_seconds">
                      · {{ Math.round(chapter.duration_seconds / 60) }} min</template
                    >
                  </span>
                </span>
                <span
                  v-if="progress.next?.key === chapter.key && !chapter.locked"
                  class="app-chip app-chip-savane"
                  >À suivre</span
                >
                <span v-else-if="chapter.progress?.status === 'completed'" class="sr-only">
                  Terminé
                </span>
                <span v-else-if="chapter.locked" class="text-sm text-quiet">Verrouillé</span>
                <ChevronRightIcon
                  v-if="!chapter.locked"
                  :size="18"
                  class="shrink-0 text-quiet transition group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </component>
            </li>
          </ol>
        </section>
      </section>

      <!-- Évaluations et attestation (accès inscrit uniquement) -->
      <CourseAssessmentsPanel v-if="course.has_access" :course-key="course.key" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import EmptyState from '@/components/app/EmptyState.vue'
import ProgressRing from '@/components/app/ProgressRing.vue'
import { courseProgress } from '@/components/app/courseProgress'
import {
  useCourseOutline,
  type OutlineChapter,
  type OutlineModule,
} from '../composables/useLearningCourse'
import CourseAssessmentsPanel from '../components/CourseAssessmentsPanel.vue'

const route = useRoute()
const courseKey = computed(() => String(route.params.courseKey ?? ''))

const { data: course, isPending, isError, error } = useCourseOutline(courseKey)
const progress = computed(() => courseProgress(course.value))

function moduleDone(module: OutlineModule): number {
  return module.chapters.filter((chapter) => chapter.progress?.status === 'completed').length
}

function nodeClass(chapter: OutlineChapter): string {
  if (chapter.progress?.status === 'completed') return 'bg-primary text-white'
  if (chapter.locked) return 'border border-line bg-canvas text-quiet'
  if (progress.value.next?.key === chapter.key) return 'bg-savane text-forest'
  return 'border-2 border-line-strong bg-white text-body'
}

function levelLabel(level: string): string {
  return { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' }[level] ?? level
}

function chapterTypeLabel(type: string): string {
  switch (type) {
    case 'video':
      return 'Vidéo'
    case 'quiz':
      return 'Quiz d’évaluation'
    case 'assignment':
      return 'Devoir pratique'
    default:
      return 'Leçon'
  }
}
</script>
