<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Bonjour, {{ firstName }}</h1>
        <p class="app-page-copy">Vos cours, vos copies à corriger et vos prochaines sessions.</p>
      </div>
      <RouterLink to="/formateur/cours" class="app-action-primary">
        <PlusIcon :size="18" /> Nouveau cours
      </RouterLink>
    </header>

    <!-- À faire : n'apparaît que s'il y a vraiment quelque chose à faire -->
    <section
      v-if="todo.length"
      class="app-panel-forest space-y-4"
      aria-labelledby="todo-title"
      data-test="trainer-todo"
    >
      <h2 id="todo-title" class="text-sm font-semibold text-savane">À faire</h2>
      <ul class="space-y-3">
        <li
          v-for="item in todo"
          :key="item.key"
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="text-xl font-bold text-white">{{ item.title }}</p>
            <p class="mt-0.5 text-sm text-forest-muted">{{ item.text }}</p>
          </div>
          <RouterLink
            :to="item.to"
            :class="item.primary ? 'app-action-accent' : 'app-action-secondary'"
            class="shrink-0"
          >
            {{ item.action }}
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- Indicateurs : chaque chiffre mène à la liste correspondante -->
    <section
      class="grid grid-cols-2 gap-x-6 gap-y-7 rounded-[18px] border border-line bg-white p-6 shadow-panel lg:grid-cols-4 lg:divide-x lg:divide-line"
      aria-label="Indicateurs"
    >
      <RouterLink
        v-for="(kpi, index) in kpis"
        :key="kpi.label"
        :to="kpi.to"
        class="transition hover:opacity-80 focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
        :class="index > 0 ? 'lg:pl-6' : ''"
        data-test="kpi"
      >
        <StatTile
          :label="kpi.label"
          :value="kpi.value ?? '—'"
          :loading="kpi.loading"
          :tone="kpi.tone"
        />
      </RouterLink>
    </section>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Derniers cours -->
      <section class="app-panel space-y-3" aria-labelledby="latest-courses">
        <div class="flex items-center justify-between gap-3">
          <h2 id="latest-courses" class="text-lg font-bold text-ink">Mes derniers cours</h2>
          <RouterLink to="/formateur/cours" class="text-sm font-semibold text-primary">
            Tout voir
          </RouterLink>
        </div>
        <div v-if="courses.isPending.value" class="space-y-2">
          <div v-for="n in 3" :key="n" class="app-skeleton h-14" />
        </div>
        <p v-else-if="courses.isError.value" class="app-alert app-alert-danger" role="alert">
          {{ apiErrorMessage(courses.error.value, 'Impossible de charger vos cours.') }}
        </p>
        <EmptyState
          v-else-if="!latestCourses.length"
          title="Pas encore de cours"
          description="Créez un cours, ajoutez vos modules et chapitres, puis soumettez-le à validation."
        >
          <RouterLink to="/formateur/cours" class="app-action-primary">Créer un cours</RouterLink>
        </EmptyState>
        <ul v-else class="-mx-2 divide-y divide-line">
          <li v-for="course in latestCourses" :key="course.key">
            <RouterLink
              :to="`/formateur/cours/${course.key}`"
              class="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-mint/50"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-ink">{{ course.title }}</p>
                <p class="truncate text-xs text-quiet">{{ course.pathway?.name ?? 'Filière' }}</p>
              </div>
              <CourseStatusBadge :status="course.status" />
              <ChevronRightIcon class="size-4 shrink-0 text-quiet" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Prochaines sessions -->
      <section class="app-panel space-y-3" aria-labelledby="next-sessions">
        <h2 id="next-sessions" class="text-lg font-bold text-ink">Prochaines sessions</h2>
        <div v-if="cohorts.isPending.value" class="space-y-2">
          <div v-for="n in 3" :key="n" class="app-skeleton h-14" />
        </div>
        <p v-else-if="cohorts.isError.value" class="app-alert app-alert-danger" role="alert">
          {{ apiErrorMessage(cohorts.error.value, 'Impossible de charger les sessions.') }}
        </p>
        <EmptyState
          v-else-if="!cohorts.data.value?.length"
          title="Aucune session à venir"
          description="Les cohortes qui vous sont confiées apparaîtront ici avant leur rentrée."
        />
        <ul v-else class="space-y-2">
          <li
            v-for="cohort in cohorts.data.value"
            :key="cohort.key"
            class="flex items-center gap-4 rounded-xl border border-line p-3"
          >
            <div
              class="flex w-12 shrink-0 flex-col items-center rounded-lg bg-mint py-1.5 text-primary-shade"
              aria-hidden="true"
            >
              <span class="text-lg leading-none font-bold">{{ day(cohort.starts_at) }}</span>
              <span class="text-xs font-medium">{{ month(cohort.starts_at) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-ink">{{ cohort.name }}</p>
              <p class="truncate text-xs text-quiet">{{ cohort.pathway?.name ?? cohort.code }}</p>
            </div>
            <span class="app-chip app-chip-neutral">{{ fromNow(cohort.starts_at) }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight as ChevronRightIcon, Plus as PlusIcon } from '@lucide/vue'
import EmptyState from '@/components/app/EmptyState.vue'
import StatTile from '@/components/app/StatTile.vue'
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
const rejectedCount = useTrainerCourseCount(['rejected'])
const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? 'formateur')

// The API lists courses by creation order (latest id first).
const latestCourses = computed(() => (courses.data.value?.items ?? []).slice(0, 5))

type Tone = 'neutral' | 'leaf' | 'savane'
function countKpi(
  label: string,
  query: ReturnType<typeof useTrainerCourseCount>,
  to: string,
  tone: (n: number) => Tone = () => 'neutral',
) {
  const value = query.isError.value ? null : (query.data.value ?? 0)
  return { label, value, loading: query.isPending.value, to, tone: tone(value ?? 0) }
}

const gradingTotal = computed(() =>
  grading.isError.value ? null : (grading.data.value?.total ?? 0),
)

const kpis = computed(() => [
  countKpi('Mes cours', totalCount, '/formateur/cours'),
  countKpi('Publiés', publishedCount, '/formateur/cours?statut=published', (n) =>
    n > 0 ? 'leaf' : 'neutral',
  ),
  countKpi('En validation', pendingCount, '/formateur/cours?statut=submitted'),
  {
    label: 'Copies à corriger',
    value: gradingTotal.value,
    loading: grading.isPending.value,
    to: '/formateur/corrections',
    tone: (gradingTotal.value ?? 0) > 0 ? ('savane' as const) : ('neutral' as const),
  },
])

const todo = computed(() => {
  const items = []
  const copies = gradingTotal.value ?? 0
  if (copies > 0) {
    const learners = new Set(grading.data.value?.items.map((a) => a.learner?.key)).size
    items.push({
      key: 'grading',
      title: copies === 1 ? '1 copie à corriger' : `${copies} copies à corriger`,
      text:
        learners > 1
          ? `Réponses libres de ${learners} apprenants, en attente de votre note.`
          : 'Réponses libres en attente de votre note.',
      action: 'Corriger les copies',
      to: '/formateur/corrections',
      primary: true,
    })
  }
  const rejected = rejectedCount.data.value ?? 0
  if (rejected > 0) {
    items.push({
      key: 'rejected',
      title: rejected === 1 ? '1 cours à reprendre' : `${rejected} cours à reprendre`,
      text: 'La modération a demandé des corrections avant publication.',
      action: 'Voir les corrections demandées',
      to: '/formateur/cours?statut=rejected',
      primary: copies === 0,
    })
  }
  return items
})

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
function month(date: string | null) {
  return date ? monthFormatter.format(new Date(date)) : ''
}
function day(date: string | null) {
  return date ? new Date(date).getDate() : ''
}
const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })
function fromNow(date: string | null) {
  if (!date) return 'Date à confirmer'
  const days = Math.round(
    (new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  )
  return relative.format(days, 'day')
}
</script>
