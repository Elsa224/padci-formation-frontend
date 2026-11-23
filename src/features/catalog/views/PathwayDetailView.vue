<template>
  <section class="app-page" aria-labelledby="pathway-title">
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
            <span v-if="pathway.programme" class="text-xs font-semibold text-quiet">{{
              pathway.programme.name
            }}</span>
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
          class="m-6 flex gap-3 rounded-xl border border-warning-line bg-warning-soft p-4 text-sm sm:m-8 sm:items-start"
        >
          <MonitorIcon class="mt-0.5 shrink-0 text-warning-ink" :size="20" aria-hidden="true" />
          <div>
            <h2 class="font-bold text-warning-ink">Équipement à prévoir</h2>
            <p class="mt-1 text-sm leading-6 text-warning-ink">
              Cette formation comprend des travaux pratiques. Vérifiez que votre matériel répond aux
              critères ci-dessous avant de candidater.
            </p>
            <ul class="mt-3 grid gap-1 text-sm text-warning-ink sm:grid-cols-3">
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
              class="mt-3 text-xs leading-5 text-warning-ink"
            >
              {{ pathway.equipment_requirements.notes }}
            </p>
          </div>
        </div>
      </header>

      <!-- Candidature : on candidate à une FILIÈRE, jamais à une session.
           À l'acceptation (admin), l'API affecte l'apprenant à la première
           cohorte ouverte qui a des places, par ordre d'arrivée (FIFO), ou
           le place en liste d'attente (CohortAssignmentService). -->
      <section class="app-panel space-y-5" aria-labelledby="apply-title">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div class="max-w-2xl">
            <h2 id="apply-title" class="text-2xl font-bold text-ink">Rejoindre cette filière</h2>
            <p class="mt-2 text-sm leading-relaxed text-body">
              Vous candidatez à la filière, pas à une session. Une fois votre candidature acceptée,
              vous êtes inscrit automatiquement dans la prochaine session qui a des places, dans
              l'ordre d'arrivée des candidatures.
            </p>
          </div>

          <div class="shrink-0">
            <span
              v-if="isStaffViewer"
              class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-quiet sm:w-auto"
              data-testid="apply-learners-only"
            >
              <LockIcon :size="14" aria-hidden="true" /> Réservé aux apprenants
            </span>
            <div
              v-else-if="activeFormationName"
              class="flex flex-col items-stretch gap-1 sm:items-end"
            >
              <button
                type="button"
                disabled
                class="app-action-secondary w-full sm:w-auto"
                data-testid="btn-already-enrolled"
              >
                Vous suivez déjà {{ activeFormationName }}
              </button>
              <router-link
                to="/mes-candidatures"
                class="text-center text-xs font-semibold text-primary hover:underline sm:text-right"
                data-testid="link-to-candidatures"
              >
                Mes candidatures
                <ArrowRightIcon class="inline size-4 align-[-0.2em]" aria-hidden="true" />
              </router-link>
            </div>
            <button
              v-else
              type="button"
              class="app-action-primary w-full sm:w-auto"
              data-testid="btn-apply-pathway"
              @click="goToCandidature()"
            >
              Participer à cette formation <ArrowRightIcon :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p
          v-if="isStaffViewer"
          class="app-alert app-alert-info flex items-center gap-2"
          data-testid="staff-cannot-apply"
        >
          <InfoIcon :size="16" class="shrink-0" aria-hidden="true" />
          Vous consultez cette filière avec un compte de l'équipe : seuls les apprenants peuvent
          candidater.
        </p>
        <template v-else-if="!isCohortsPending">
          <p
            v-if="hasOpenSeat"
            class="app-alert app-alert-success flex items-center gap-2"
            data-testid="seats-available"
          >
            <CalendarIcon :size="16" class="shrink-0" aria-hidden="true" />
            Des places sont disponibles dans la prochaine session.
          </p>
          <p
            v-else
            class="app-alert app-alert-info flex items-start gap-2"
            data-testid="waitlist-note"
          >
            <InfoIcon :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
            Aucune place libre pour le moment. Vous pouvez candidater : si votre candidature est
            acceptée, vous serez placé en liste d'attente et inscrit dès qu'une session s'ouvre.
          </p>
        </template>
      </section>

      <section class="app-panel" aria-labelledby="courses-title">
        <div class="border-b border-line pb-5">
          <p class="app-eyebrow">Programme</p>
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
  Info as InfoIcon,
  Lock as LockIcon,
  Monitor as MonitorIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import { useLearnerApplications } from '@/features/admissions/composables/useLearnerApplications'
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

const { data: myAppsData } = useLearnerApplications()
const activeFormation = computed(() => {
  if (!auth.token) return null
  const items = myAppsData.value?.items ?? []
  return (
    items.find((a) =>
      ['submitted', 'in_review', 'waitlisted', 'standby', 'accepted'].includes(a.status),
    ) ?? null
  )
})
const activeFormationName = computed(() => activeFormation.value?.pathway?.name ?? null)
// Seuls les apprenants candidatent (ApplicationPolicy::create côté API). Un
// visiteur non connecté garde le bouton : il sera invité à se connecter.
const isStaffViewer = computed(() => !!auth.token && !!auth.user && !auth.hasRole('apprenant'))
const {
  data: pathway,
  isPending: isPathwayPending,
  isError: isPathwayError,
  error: pathwayError,
} = usePathway(pathwayKey)
const { data: cohortsData, isPending: isCohortsPending } = usePathwayCohorts(pathwayKey)
const cohorts = computed(() => cohortsData.value ?? [])
// Seul indicateur montré à l'apprenant : reste-t-il une place quelque part ?
const hasOpenSeat = computed(() =>
  cohorts.value.some(
    (cohort) => (cohort.available || cohort.status === 'open') && !isCohortFull(cohort),
  ),
)
const { data: coursesData, isPending: isCoursesPending } = usePathwayCourses(pathwayKey)
const courses = computed(() => coursesData.value?.items ?? [])

function isCohortFull(cohort: PublicCohort): boolean {
  return Boolean(
    cohort.is_full || (cohort.available_seats !== undefined && cohort.available_seats <= 0),
  )
}

function goToCandidature(cohort?: PublicCohort) {
  void cohort
  const target = `/candidature?pathway=${pathwayKey.value}`
  router.push(auth.token ? target : `/connexion?redirect=${encodeURIComponent(target)}`)
}
</script>
