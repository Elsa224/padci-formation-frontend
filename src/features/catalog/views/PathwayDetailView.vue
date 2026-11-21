<template>
  <section class="app-page max-w-6xl" aria-labelledby="pathway-title">
    <router-link
      to="/catalogue"
      class="inline-flex items-center gap-2 text-sm font-semibold text-quiet transition hover:text-primary"
    >
      <ArrowLeftIcon :size="17" aria-hidden="true" /> Retour au catalogue
    </router-link>

    <div v-if="isPathwayPending" class="space-y-5" aria-label="Chargement de la filière">
      <div class="app-panel space-y-4">
        <div class="app-skeleton h-5 w-24" />
        <div class="app-skeleton h-10 w-2/3" />
        <div class="app-skeleton h-5 w-full" />
        <div class="app-skeleton h-5 w-4/5" />
      </div>
      <div class="app-panel">
        <div class="app-skeleton h-7 w-1/3" />
        <div class="mt-5 app-skeleton h-28 w-full" />
      </div>
    </div>

    <div v-else-if="isPathwayError" class="app-panel mx-auto max-w-xl py-12 text-center">
      <p class="text-sm font-semibold text-danger-ink">Cette filière est introuvable.</p>
      <p class="mt-2 text-sm text-quiet">
        {{ (pathwayError as ApiError)?.message ?? 'Elle a peut-être été retirée du catalogue.' }}
      </p>
    </div>

    <template v-else-if="pathway">
      <header class="app-panel overflow-hidden p-0">
        <div
          class="border-b border-line bg-gradient-to-br from-primary/[0.09] via-white to-canvas px-6 py-8 sm:px-8 sm:py-10"
        >
          <div class="flex flex-wrap items-center gap-2.5">
            <span
              class="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold tracking-wide text-white"
              >{{ pathway.code }}</span
            >
            <span v-if="pathway.programme" class="text-xs font-semibold text-quiet"
              >Programme {{ pathway.programme.name }}</span
            >
          </div>
          <h1
            id="pathway-title"
            class="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl"
          >
            {{ pathway.name }}
          </h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-quiet sm:text-base">
            {{
              pathway.description ||
              'Formation professionnelle intensive préparant aux métiers de spécialité.'
            }}
          </p>
        </div>

        <div
          v-if="pathway.equipment_requirements"
          class="m-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:m-8 sm:items-start"
        >
          <MonitorIcon class="mt-0.5 shrink-0 text-amber-700" :size="20" aria-hidden="true" />
          <div>
            <h2 class="font-bold text-amber-950">Équipement à prévoir</h2>
            <p class="mt-1 text-sm leading-6 text-amber-900">
              Cette formation comprend des travaux pratiques. Vérifiez que votre matériel répond aux
              critères ci-dessous avant de candidater.
            </p>
            <ul class="mt-3 grid gap-1 text-sm text-amber-950 sm:grid-cols-3">
              <li v-if="pathway.equipment_requirements.min_cpu">
                <span class="font-semibold">Processeur :</span>
                {{ pathway.equipment_requirements.min_cpu }}
              </li>
              <li v-if="pathway.equipment_requirements.min_ram_gb">
                <span class="font-semibold">Mémoire :</span>
                {{ pathway.equipment_requirements.min_ram_gb }} Go
              </li>
              <li v-if="pathway.equipment_requirements.min_storage_gb">
                <span class="font-semibold">Stockage :</span>
                {{ pathway.equipment_requirements.min_storage_gb }} Go
              </li>
            </ul>
            <p
              v-if="pathway.equipment_requirements.notes"
              class="mt-3 text-xs leading-5 text-amber-900"
            >
              {{ pathway.equipment_requirements.notes }}
            </p>
          </div>
        </div>
      </header>

      <section class="app-panel" aria-labelledby="sessions-title">
        <div
          class="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-end"
        >
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Admissions</p>
            <h2 id="sessions-title" class="mt-1 text-2xl font-bold text-ink">
              Choisissez votre session
            </h2>
            <p class="mt-1 text-sm text-quiet">
              Les candidatures ne sont possibles que pour les sessions ouvertes.
            </p>
          </div>
          <span
            class="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
            ><CalendarIcon :size="14" aria-hidden="true" />{{ availableCohorts }} ouverte{{
              availableCohorts > 1 ? 's' : ''
            }}</span
          >
        </div>

        <div v-if="isCohortsPending" class="mt-5 space-y-3">
          <div v-for="index in 2" :key="index" class="app-skeleton h-28 w-full" />
        </div>
        <div v-else-if="cohorts.length === 0" class="py-10 text-center">
          <CalendarIcon class="mx-auto text-quiet" :size="28" aria-hidden="true" />
          <p class="mt-3 text-sm font-semibold text-ink">Aucune session planifiée</p>
          <p class="mt-1 text-sm text-quiet">
            Revenez prochainement pour consulter les nouvelles ouvertures.
          </p>
        </div>
        <div v-else class="mt-5 space-y-4">
          <article
            v-for="cohort in cohorts"
            :key="cohort.key"
            class="flex flex-col gap-4 rounded-xl border p-5 transition sm:p-6"
            :class="
              isCohortFull(cohort)
                ? 'border-amber-200 bg-amber-50/20'
                : cohort.available
                  ? 'border-primary/25 bg-primary/[0.02]'
                  : 'border-line bg-canvas'
            "
          >
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full border px-2.5 py-0.5 text-xs font-bold"
                    :class="getCohortStatusBadge(cohort).class"
                  >
                    {{ getCohortStatusBadge(cohort).label }}
                  </span>
                  <span
                    v-if="cohort.session"
                    class="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-quiet"
                  >
                    Session {{ cohort.session }}
                  </span>
                  <span class="text-xs font-medium text-quiet">{{ cohort.code }}</span>
                </div>
                <h3 class="mt-3 text-lg font-bold text-ink">{{ cohort.name }}</h3>
                <p class="mt-1 flex items-center gap-1.5 text-sm text-quiet">
                  <CalendarIcon :size="14" class="shrink-0 text-quiet" aria-hidden="true" />
                  Du {{ formatDate(cohort.starts_at) }} au {{ formatDate(cohort.ends_at) }}
                </p>
              </div>

              <div class="shrink-0 pt-1 sm:pt-0">
                <button
                  v-if="isCohortFull(cohort)"
                  type="button"
                  class="app-action-secondary flex w-full items-center justify-center gap-2 border-amber-300 text-amber-900 hover:bg-amber-100/50 sm:w-auto"
                  @click="goToCandidature(cohort)"
                >
                  Postuler à cette formation <ArrowRightIcon :size="16" aria-hidden="true" />
                </button>
                <button
                  v-else-if="cohort.available || cohort.status === 'open'"
                  type="button"
                  class="app-action-primary flex w-full items-center justify-center gap-2 sm:w-auto"
                  @click="goToCandidature(cohort)"
                >
                  Postuler à cette formation <ArrowRightIcon :size="16" aria-hidden="true" />
                </button>
                <span
                  v-else
                  class="inline-flex w-full items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-quiet sm:w-auto"
                >
                  Inscriptions fermées
                </span>
              </div>
            </div>

            <!-- Seat availability gauge -->
            <div class="mt-1 border-t border-line/60 pt-4">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="font-medium text-quiet">
                  <span class="font-semibold text-ink">{{ getEnrolledCount(cohort) }}</span> /
                  {{ cohort.capacity }} réservées
                  <span
                    class="font-semibold"
                    :class="isCohortFull(cohort) ? 'text-amber-800' : 'text-primary'"
                  >
                    ({{ formatSeatsText(cohort.available_seats) }})
                  </span>
                </span>
                <span
                  class="font-semibold"
                  :class="isCohortFull(cohort) ? 'text-amber-700' : 'text-primary'"
                >
                  {{ getOccupancyPercent(cohort) }}% remplie
                </span>
              </div>

              <div
                class="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                role="progressbar"
                :aria-valuenow="getEnrolledCount(cohort)"
                :aria-valuemin="0"
                :aria-valuemax="cohort.capacity"
              >
                <div
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  :class="isCohortFull(cohort) ? 'bg-amber-500' : 'bg-primary'"
                  :style="{ width: `${getOccupancyPercent(cohort)}%` }"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="app-panel" aria-labelledby="courses-title">
        <div class="border-b border-line pb-5">
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Programme</p>
          <h2 id="courses-title" class="mt-1 text-2xl font-bold text-ink">Cours du parcours</h2>
        </div>
        <div v-if="isCoursesPending" class="mt-5 grid gap-3 sm:grid-cols-2">
          <div v-for="index in 4" :key="index" class="app-skeleton h-28" />
        </div>
        <p v-else-if="courses.length === 0" class="py-8 text-sm text-quiet">
          Les contenus pédagogiques sont en cours de finalisation.
        </p>
        <div v-else class="mt-5 grid gap-3 sm:grid-cols-2">
          <article
            v-for="course in courses"
            :key="course.key"
            class="rounded-xl border border-line bg-canvas p-4"
          >
            <div class="flex items-center gap-2 text-xs font-bold text-primary">
              <BookOpenIcon :size="15" aria-hidden="true" />{{ course.level }}
            </div>
            <h3 class="mt-3 font-bold text-ink">{{ course.title }}</h3>
            <p class="mt-1.5 line-clamp-2 text-sm leading-5 text-quiet">
              {{ course.summary || 'Module théorique et pratique du parcours.' }}
            </p>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  BookOpen as BookOpenIcon,
  Calendar as CalendarIcon,
  Monitor as MonitorIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import {
  usePathway,
  usePathwayCohorts,
  usePathwayCourses,
  type PublicCohort,
} from '../composables/useCatalog'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const pathwayKey = computed(() => String(route.params.key ?? ''))
const {
  data: pathway,
  isPending: isPathwayPending,
  isError: isPathwayError,
  error: pathwayError,
} = usePathway(pathwayKey)
const { data: cohortsData, isPending: isCohortsPending } = usePathwayCohorts(pathwayKey)
const cohorts = computed(() => cohortsData.value ?? [])
const availableCohorts = computed(() => cohorts.value.filter((cohort) => cohort.available).length)
const { data: coursesData, isPending: isCoursesPending } = usePathwayCourses(pathwayKey)
const courses = computed(() => coursesData.value?.items ?? [])

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'date à confirmer'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isCohortFull(cohort: PublicCohort): boolean {
  return Boolean(
    cohort.is_full || (cohort.available_seats !== undefined && cohort.available_seats <= 0),
  )
}

function getCohortStatusBadge(cohort: PublicCohort): {
  label: 'Ouverte' | 'Complète' | 'Planifiée'
  class: string
} {
  if (isCohortFull(cohort)) {
    return {
      label: 'Complète',
      class: 'border-amber-200 bg-amber-100 text-amber-800',
    }
  }
  if (cohort.available || cohort.status === 'open') {
    return {
      label: 'Ouverte',
      class: 'border-primary/20 bg-primary/10 text-primary',
    }
  }
  return {
    label: 'Planifiée',
    class: 'border-slate-200 bg-slate-100 text-slate-700',
  }
}

function getEnrolledCount(cohort: PublicCohort): number {
  if (typeof cohort.enrolled_count === 'number') {
    return cohort.enrolled_count
  }
  if (typeof cohort.capacity === 'number' && typeof cohort.available_seats === 'number') {
    return Math.max(0, cohort.capacity - cohort.available_seats)
  }
  return 0
}

function getOccupancyPercent(cohort: PublicCohort): number {
  const capacity = cohort.capacity || 100
  const enrolled = getEnrolledCount(cohort)
  return Math.min(100, Math.max(0, Math.round((enrolled / capacity) * 100)))
}

function formatSeatsText(seats: number | undefined): string {
  const count = seats ?? 0
  if (count <= 1) {
    return `${count} place disponible`
  }
  return `${count} places disponibles`
}

function goToCandidature(cohort: PublicCohort) {
  const target = `/candidature?pathway=${pathwayKey.value}&cohort=${cohort.key}`
  router.push(auth.token ? target : `/connexion?redirect=${encodeURIComponent(target)}`)
}
</script>
