<template>
  <section class="app-page max-w-5xl">
    <header class="app-page-header">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">Enseignement</p>
        <h1 class="app-page-title mt-2">Mes cohortes</h1>
        <p class="app-page-copy">Les cohortes où vous enseignez et leurs apprenants inscrits.</p>
      </div>
    </header>

    <div v-if="cohorts.isPending.value" class="space-y-3">
      <div v-for="n in 2" :key="n" class="app-skeleton h-24" />
    </div>
    <div
      v-else-if="cohorts.isError.value"
      class="rounded-xl bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      {{ apiErrorMessage(cohorts.error.value, 'Impossible de charger vos cohortes.') }}
    </div>
    <p
      v-else-if="!cohorts.data.value?.length"
      class="app-panel text-sm text-quiet"
      data-test="no-cohorts"
    >
      Vous n'êtes rattaché à aucune cohorte pour le moment. L'administration vous ajoute comme
      formateur d'une cohorte depuis son espace.
    </p>

    <article
      v-for="cohort in cohorts.data.value ?? []"
      :key="cohort.key"
      class="app-panel space-y-3"
      data-test="cohort"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-bold text-ink">{{ cohort.name }}</p>
          <p class="text-xs text-quiet">
            {{ cohort.pathway?.name ?? cohort.code }}
            <template v-if="cohort.starts_at">
              · du {{ formatDate(cohort.starts_at) }}
              <template v-if="cohort.ends_at"> au {{ formatDate(cohort.ends_at) }}</template>
            </template>
          </p>
        </div>
        <button
          class="app-action-secondary"
          :aria-expanded="openCohort === cohort.key"
          @click="openCohort = openCohort === cohort.key ? null : cohort.key"
        >
          {{ openCohort === cohort.key ? 'Masquer les apprenants' : 'Voir les apprenants' }}
        </button>
      </div>

      <div v-if="openCohort === cohort.key">
        <div v-if="enrollments.isPending.value" class="app-skeleton h-16" />
        <p
          v-else-if="!enrollments.data.value?.length"
          class="rounded-xl bg-canvas p-4 text-sm text-quiet"
        >
          Aucun apprenant inscrit dans cette cohorte.
        </p>
        <div v-else class="overflow-x-auto rounded-xl border border-line">
          <table class="w-full min-w-[32rem] text-left text-sm">
            <thead class="bg-canvas text-xs uppercase tracking-wide text-quiet">
              <tr>
                <th class="px-3 py-2">Apprenant</th>
                <th class="px-3 py-2">Cours</th>
                <th class="px-3 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="enrollment in enrollments.data.value"
                :key="enrollment.key"
                class="border-t border-line"
                data-test="enrollment-row"
              >
                <td class="px-3 py-2">
                  <p class="font-semibold text-ink">{{ enrollment.user?.name }}</p>
                  <p class="text-xs text-quiet">{{ enrollment.user?.email }}</p>
                </td>
                <td class="px-3 py-2 text-ink">{{ enrollment.course?.title ?? '—' }}</td>
                <td class="px-3 py-2">
                  <span class="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-quiet">
                    {{ enrollmentStatusLabels[enrollment.status] ?? enrollment.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { http } from '@/api/http'
import type { Cohort } from '@/features/admin/composables/useCohorts'
import { apiErrorMessage } from '../composables/useTrainerCourses'

interface CohortEnrollment {
  key: string
  status: string
  user?: { key: string; name: string; email: string }
  course?: { key: string; title: string }
}

const enrollmentStatusLabels: Record<string, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  completed: 'Terminé',
  revoked: 'Révoqué',
}

// Both endpoints are scoped server-side to the cohorts the trainer teaches
// (Cohort::scopeVisibleTo, EnrollmentController): nothing is filtered here.
const cohorts = useQuery({
  queryKey: ['trainer-cohorts'],
  queryFn: async () =>
    (await http.get<Cohort[]>('/admin/cohorts', { params: { per_page: 100 } })).data,
})

const openCohort = ref<string | null>(null)
const enrollments = useQuery({
  queryKey: computed(() => ['trainer-cohort-enrollments', openCohort.value]),
  enabled: computed(() => openCohort.value !== null),
  queryFn: async () =>
    (
      await http.get<CohortEnrollment[]>('/admin/enrollments', {
        params: { cohort_key: openCohort.value, per_page: 100 },
      })
    ).data,
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
</script>
