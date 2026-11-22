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
        <div class="flex items-center gap-2">
          <button
            class="app-action-primary text-xs"
            data-test="open-attendance-btn"
            @click="openAttendanceFor(cohort)"
          >
            Émargement / Présences
          </button>
          <button
            class="app-action-secondary"
            :aria-expanded="openCohort === cohort.key"
            @click="openCohort = openCohort === cohort.key ? null : cohort.key"
          >
            {{ openCohort === cohort.key ? 'Masquer les apprenants' : 'Voir les apprenants' }}
          </button>
        </div>
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
          <table class="w-full min-w-[36rem] text-left text-sm">
            <thead class="bg-canvas text-xs uppercase tracking-wide text-quiet">
              <tr>
                <th class="px-3 py-2">Apprenant</th>
                <th class="px-3 py-2">Cours</th>
                <th class="px-3 py-2">Progression</th>
                <th class="px-3 py-2">Assiduité</th>
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
                  <div
                    v-if="
                      enrollment.progress_rate !== null && enrollment.progress_rate !== undefined
                    "
                    class="flex items-center gap-2"
                  >
                    <div class="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                      <div
                        class="h-full rounded-full bg-primary"
                        :style="{ width: `${enrollment.progress_rate * 100}%` }"
                      />
                    </div>
                    <span class="text-xs font-semibold tabular-nums text-ink">
                      {{ Math.round(enrollment.progress_rate * 100) }}%
                    </span>
                  </div>
                  <span v-else class="text-xs text-quiet">—</span>
                </td>
                <td class="px-3 py-2">
                  <span
                    v-if="
                      enrollment.attendance_rate !== null &&
                      enrollment.attendance_rate !== undefined
                    "
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                    :class="
                      enrollment.attendance_rate >= 0.8
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : enrollment.attendance_rate >= 0.5
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                    "
                  >
                    {{ Math.round(enrollment.attendance_rate * 100) }}%
                  </span>
                  <span v-else class="text-xs text-quiet">—</span>
                </td>
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

    <CohortAttendanceModal
      v-if="attendanceOpen"
      :open="attendanceOpen"
      :cohort-key="attendanceCohortKey"
      :cohort-name="attendanceCohortName"
      @close="attendanceOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { http } from '@/api/http'
import type { Cohort } from '@/features/admin/composables/useCohorts'
import CohortAttendanceModal from '@/features/cohorts/components/CohortAttendanceModal.vue'
import { apiErrorMessage } from '../composables/useTrainerCourses'

interface CohortEnrollment {
  key: string
  status: string
  user?: { key: string; name: string; email: string }
  course?: { key: string; title: string }
  attendance_rate?: number | null
  progress_rate?: number | null
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

const attendanceOpen = ref(false)
const attendanceCohortKey = ref('')
const attendanceCohortName = ref('')

function openAttendanceFor(cohort: Cohort) {
  attendanceCohortKey.value = cohort.key
  attendanceCohortName.value = cohort.name
  attendanceOpen.value = true
}
</script>
