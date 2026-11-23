<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Bienvenue, {{ auth.user?.name ?? 'formateur' }}</h1>
        <p class="app-page-copy">
          Préparez vos cours, suivez leur validation et repérez les copies à corriger.
        </p>
      </div>
      <RouterLink to="/formateur/cours" class="app-action-primary">
        <PlusIcon :size="18" /> Nouveau cours
      </RouterLink>
    </header>

    <!-- Indicateurs : uniquement des valeurs fournies par l'API -->
    <section
      class="grid grid-cols-2 gap-x-6 gap-y-7 rounded-[18px] border border-line bg-white p-6 shadow-panel lg:grid-cols-4 lg:divide-x lg:divide-line"
      aria-label="Indicateurs"
    >
      <article v-for="(kpi, index) in kpis" :key="kpi.label" :class="index > 0 ? 'lg:pl-6' : ''">
        <p class="text-sm font-medium text-quiet">{{ kpi.label }}</p>
        <div v-if="kpi.loading" class="app-skeleton mt-2 h-8 w-16" />
        <p
          v-else
          class="mt-1.5 text-[1.9rem] leading-none font-bold text-ink tabular-nums"
          data-test="kpi-value"
        >
          {{ kpi.value ?? '—' }}
        </p>
      </article>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Derniers cours créés -->
      <section class="app-panel space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-bold text-ink">Derniers cours créés</h2>
          <RouterLink to="/formateur/cours" class="text-sm font-semibold text-primary">
            Tout voir
          </RouterLink>
        </div>
        <div v-if="courses.isPending.value" class="space-y-3">
          <div v-for="n in 3" :key="n" class="app-skeleton h-14" />
        </div>
        <p v-else-if="courses.isError.value" class="text-sm text-red-700" role="alert">
          {{ apiErrorMessage(courses.error.value, 'Impossible de charger vos cours.') }}
        </p>
        <p v-else-if="!latestCourses.length" class="rounded-xl bg-canvas p-6 text-sm text-quiet">
          Vous n'avez pas encore de cours. Créez-en un pour y déposer vos supports.
        </p>
        <ul v-else class="divide-y divide-line">
          <li v-for="course in latestCourses" :key="course.key">
            <RouterLink
              :to="`/formateur/cours/${course.key}`"
              class="flex items-center justify-between gap-3 py-3 hover:text-primary"
            >
              <div class="min-w-0">
                <p class="truncate font-semibold text-ink">{{ course.title }}</p>
                <p class="text-xs text-quiet">{{ course.pathway?.name ?? 'Filière' }}</p>
              </div>
              <CourseStatusBadge :status="course.status" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Prochaines sessions -->
      <section class="app-panel space-y-4">
        <div>
          <h2 class="text-lg font-bold text-ink">Prochaines sessions</h2>
          <p class="text-xs text-quiet">Vos cohortes ouvertes ou planifiées.</p>
        </div>
        <div v-if="cohorts.isPending.value" class="space-y-3">
          <div v-for="n in 3" :key="n" class="app-skeleton h-14" />
        </div>
        <p v-else-if="cohorts.isError.value" class="text-sm text-red-700" role="alert">
          {{ apiErrorMessage(cohorts.error.value, 'Impossible de charger les sessions.') }}
        </p>
        <p
          v-else-if="!cohorts.data.value?.length"
          class="rounded-xl bg-canvas p-6 text-sm text-quiet"
        >
          Aucune session à venir pour le moment.
        </p>
        <ul v-else class="space-y-3">
          <li
            v-for="cohort in cohorts.data.value"
            :key="cohort.key"
            class="flex items-center gap-4 rounded-xl border border-line p-3"
          >
            <div
              class="flex w-12 shrink-0 flex-col items-center rounded-lg bg-primary/10 py-1 text-primary"
            >
              <span class="text-[10px] font-bold uppercase">{{ month(cohort.starts_at) }}</span>
              <span class="text-lg font-bold leading-none">{{ day(cohort.starts_at) }}</span>
            </div>
            <div class="min-w-0">
              <p class="truncate font-semibold text-ink">{{ cohort.name }}</p>
              <p class="text-xs text-quiet">{{ cohort.pathway?.name ?? cohort.code }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Copies en attente de correction -->
    <section v-if="grading.data.value?.items.length" class="app-panel space-y-4">
      <div>
        <h2 class="text-lg font-bold text-ink">Copies en attente de correction</h2>
        <p class="text-xs text-quiet">Réponses libres soumises par les apprenants de vos cours.</p>
      </div>
      <RouterLink to="/formateur/corrections" class="app-action-primary w-fit">
        Corriger les copies
      </RouterLink>
      <ul class="divide-y divide-line text-sm">
        <li
          v-for="attempt in grading.data.value.items"
          :key="attempt.key"
          class="flex flex-wrap justify-between gap-2 py-3"
        >
          <span class="font-semibold text-ink">{{ attempt.learner?.name ?? 'Apprenant' }}</span>
          <span class="text-quiet">
            {{ attempt.assessment?.title }} · {{ attempt.course?.title }} ·
            {{ attempt.pending_answers.length }} réponse(s)
          </span>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus as PlusIcon } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import CourseStatusBadge from '../components/CourseStatusBadge.vue'
import {
  apiErrorMessage,
  useTrainerCourseCount,
  useTrainerCourses,
} from '../composables/useTrainerCourses'
import { usePendingGrading, useUpcomingCohorts } from '../composables/useTrainerOverview'

const auth = useAuthStore()
// Same normalized key as page 1 of "Mes cours": one cached request for both.
const courses = useTrainerCourses()
const totalCount = useTrainerCourseCount(['all'])
const publishedCount = useTrainerCourseCount(['published'])
const pendingCount = useTrainerCourseCount(['submitted', 'in_review'])
const grading = usePendingGrading()
const cohorts = useUpcomingCohorts()

// The API lists courses by creation order (latest id first).
const latestCourses = computed(() => (courses.data.value?.items ?? []).slice(0, 5))

function countKpi(label: string, query: ReturnType<typeof useTrainerCourseCount>) {
  return {
    label,
    value: query.isError.value ? null : (query.data.value ?? 0),
    loading: query.isPending.value,
  }
}

const kpis = computed(() => [
  countKpi('Mes cours', totalCount),
  countKpi('Cours publiés', publishedCount),
  countKpi('En attente de validation', pendingCount),
  {
    label: 'Copies à corriger',
    value: grading.isError.value ? null : (grading.data.value?.total ?? 0),
    loading: grading.isPending.value,
  },
])

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
function month(date: string | null) {
  return date ? monthFormatter.format(new Date(date)).replace('.', '') : ''
}
function day(date: string | null) {
  return date ? new Date(date).getDate() : ''
}
</script>
