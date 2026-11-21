<template>
  <section class="app-page space-y-6" aria-labelledby="dashboard-title">
    <!-- EN-TÊTE DU TABLEAU DE BORD -->
    <header class="app-page-header">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Espace apprenant</p>
        <h1 id="dashboard-title" class="app-page-title mt-2">Ma formation</h1>
        <p class="app-page-copy">
          Retrouvez vos cours actifs, vos sessions et le suivi de vos admissions.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <router-link to="/mes-candidatures" class="app-action-secondary text-xs">
          Suivi de mes candidatures
        </router-link>
        <router-link to="/catalogue" class="app-action-primary text-xs">
          Catalogue &rarr;
        </router-link>
      </div>
    </header>

    <!-- BANNIÈRE STANDBY / LISTE PRIORITAIRE -->
    <div
      v-if="hasStandbyApplication"
      data-testid="standby-banner"
      class="app-panel border-blue-200 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/70 p-5 shadow-sm sm:p-6"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200"
            >
              En attente de cohorte (Standby)
            </span>
            <span v-if="standbyApplication?.pathway" class="text-xs font-semibold text-slate-600">
              {{ standbyApplication.pathway.name }}
            </span>
          </div>
          <p class="text-sm font-semibold text-slate-900 sm:text-base">
            Dossier validé avec succès ! Vous êtes sur la liste prioritaire (Standby) et serez
            automatiquement affecté dès l'ouverture de la prochaine session.
          </p>
          <p class="text-xs text-slate-600">
            Dès qu'une place se libère ou qu'une nouvelle session s'ouvre, vous recevrez une
            confirmation d'affectation dans votre cohorte.
          </p>
        </div>
        <router-link
          to="/mes-candidatures"
          class="hidden text-xs font-semibold text-blue-700 hover:text-blue-900 sm:inline-flex items-center gap-1"
        >
          Détails &rarr;
        </router-link>
      </div>
    </div>

    <!-- CARTE D'AFFECTATION À UNE COHORTE -->
    <div
      v-if="assignedCohort"
      data-testid="cohort-status-card"
      class="app-panel border-primary/25 bg-gradient-to-r from-primary/10 via-emerald-50/40 to-canvas p-5 shadow-sm sm:p-6"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-4">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                Affectation confirmée
              </span>
              <span v-if="assignedCohort.code" class="text-xs font-semibold text-quiet">
                {{ assignedCohort.code }}
              </span>
            </div>
            <h2 class="text-base font-bold text-ink sm:text-lg">
              Inscrit à la Cohorte {{ assignedCohort.name }} — Rentrée le
              {{ formatCohortDate(assignedCohort.starts_at) }}
            </h2>
            <p class="text-xs font-medium text-quiet sm:text-sm">
              Les modules pédagogiques s'activeront à l'ouverture de votre session.
            </p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <router-link to="/mes-candidatures" class="app-action-secondary text-xs">
            Voir mon dossier
          </router-link>
        </div>
      </div>
    </div>

    <!-- ÉTAT DE CHARGEMENT / ERREUR -->
    <div v-if="isPending" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 3" :key="index" class="app-panel space-y-5">
        <div class="app-skeleton h-5 w-1/3" />
        <div class="app-skeleton h-7 w-3/4" />
        <div class="app-skeleton h-11 w-full" />
      </div>
    </div>
    <div v-else-if="isError" class="app-panel py-12 text-center">
      <p class="font-semibold text-danger-ink">Vos formations ne sont pas disponibles.</p>
      <p class="mt-2 text-sm text-quiet">
        {{ (error as ApiError)?.message ?? 'Réessayez dans quelques instants.' }}
      </p>
    </div>

    <!-- AUCUNE FORMATION DIRECTEMENT ACTIVE -->
    <div v-else-if="enrollments.length === 0" class="app-panel p-8 text-center sm:p-10">
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <template v-if="assignedCohort">
        <h2 class="mt-5 text-lg font-bold text-ink">Votre rentrée approche</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-quiet">
          Vous êtes inscrit à la session <strong class="text-ink">{{ assignedCohort.name }}</strong
          >. Vos cours et supports seront mis en ligne dès le lancement officiel des enseignements.
        </p>
      </template>
      <template v-else-if="hasStandbyApplication">
        <h2 class="mt-5 text-lg font-bold text-ink">Candidature validée en attente de session</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-quiet">
          Votre dossier est accepté sur liste prioritaire (Standby). Vos formations apparaîtront
          automatiquement dès qu'une cohorte vous sera attribuée.
        </p>
      </template>
      <template v-else>
        <h2 class="mt-5 text-lg font-bold text-ink">Aucune formation active pour l'instant</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-quiet">
          Vous n'êtes pas encore inscrit à une cohorte active. Consultez le catalogue des filières
          et déposez votre candidature pour rejoindre une session.
        </p>
        <div class="pt-5">
          <router-link to="/catalogue" class="app-action-primary inline-flex">
            Découvrir le catalogue des sessions
          </router-link>
        </div>
      </template>
    </div>

    <!-- GRILLE DES FORMATIONS ACTIVES -->
    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="enrollment in enrollments"
          :key="enrollment.key"
          class="app-panel flex flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                :class="
                  enrollment.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-quiet'
                "
              >
                {{ enrollment.status === 'active' ? 'En cours' : enrollment.status }}
              </span>
              <span v-if="enrollment.cohort" class="text-xs font-medium text-quiet">
                {{ enrollment.cohort.session }}
              </span>
            </div>

            <div>
              <h2 class="line-clamp-2 text-lg font-bold text-ink">
                {{ enrollment.course?.title || 'Formation en ligne' }}
              </h2>
              <p v-if="enrollment.cohort" class="mt-1 text-xs text-quiet">
                Cohorte : <strong class="text-ink">{{ enrollment.cohort.name }}</strong>
              </p>
            </div>
          </div>

          <div class="mt-5 border-t border-line pt-5">
            <router-link
              v-if="enrollment.course"
              :to="`/formations/${enrollment.course.key}`"
              class="app-action-primary w-full justify-center text-xs"
            >
              Accéder au cours &rarr;
            </router-link>
            <span v-else class="block text-center text-xs text-quiet">
              Contenu en cours de publication
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApiError } from '@/api/http'
import { useEnrollments } from '../composables/useEnrollments'
import { useLearnerApplications } from '@/features/admissions/composables/useLearnerApplications'

const { data, isPending, isError, error } = useEnrollments()
const enrollments = computed(() => data.value?.items ?? [])

const { data: applicationsData } = useLearnerApplications()
const applications = computed(() => applicationsData?.value?.items ?? [])

const standbyApplication = computed(() => {
  return applications.value.find((app) => app.status === 'standby') ?? null
})

const hasStandbyApplication = computed(() => !!standbyApplication.value)

const assignedCohortFromApp = computed(() => {
  const accepted = applications.value.find((app) => app.status === 'accepted' && app.cohort)
  return accepted?.cohort ?? null
})

const assignedCohortFromEnrollment = computed(() => {
  const enrolled = enrollments.value.find((e) => e.cohort)
  return enrolled?.cohort ?? null
})

const assignedCohort = computed(() => {
  const fromApp = assignedCohortFromApp.value
  const fromEnrollment = assignedCohortFromEnrollment.value

  if (fromApp) {
    return {
      name: fromApp.name,
      code: fromApp.code,
      starts_at: fromApp.starts_at,
      ends_at: fromApp.ends_at,
      session: fromApp.session,
    }
  }
  if (fromEnrollment) {
    return {
      name: fromEnrollment.name,
      code: fromEnrollment.code,
      starts_at: fromEnrollment.starts_at ?? null,
      ends_at: fromEnrollment.ends_at ?? null,
      session: fromEnrollment.session,
    }
  }
  return null
})

function formatCohortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'date à confirmer'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
