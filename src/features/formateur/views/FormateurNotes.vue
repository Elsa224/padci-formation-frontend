<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Notes</h1>
        <p class="app-page-copy">
          Saisissez une note sur 20 et une appréciation par apprenant, pour chaque cours.
        </p>
      </div>
    </header>

    <div v-if="cohorts.isPending.value" class="app-skeleton h-24" />
    <EmptyState
      v-else-if="!cohorts.data.value?.length"
      title="Aucune cohorte encadrée"
      description="Les notes se saisissent pour les cohortes qui vous sont confiées."
      framed
    />
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
        <label class="block text-sm font-semibold text-ink">
          Cohorte
          <select v-model="cohortKey" class="app-input mt-1" data-test="grade-cohort">
            <option v-for="cohort in cohorts.data.value" :key="cohort.key" :value="cohort.key">
              {{ cohort.name }}
            </option>
          </select>
        </label>
        <label class="block text-sm font-semibold text-ink">
          Cours
          <select v-model="courseKey" class="app-input mt-1" data-test="grade-course">
            <option v-for="course in courses" :key="course.key" :value="course.key">
              {{ course.title }}
            </option>
          </select>
        </label>
      </div>

      <form
        class="app-panel space-y-4 overflow-hidden"
        data-test="grades-form"
        @submit.prevent="save"
      >
        <div v-if="!courseKey" class="text-sm text-quiet">
          Aucun cours publié pour la filière de cette cohorte.
        </div>
        <div v-else-if="grades.isPending.value" class="app-skeleton h-32" />
        <EmptyState
          v-else-if="!rows.length"
          title="Aucun apprenant inscrit à ce cours"
          description="Les apprenants apparaissent ici dès leur inscription dans la cohorte."
        />
        <div v-else class="-mx-6 -mt-6 overflow-x-auto border-b border-line">
          <table class="w-full min-w-[40rem] text-left text-sm">
            <thead class="app-thead">
              <tr>
                <th class="py-3 pr-3 pl-6">Apprenant</th>
                <th class="w-32 px-3 py-3">Note / 20</th>
                <th class="py-3 pr-6 pl-3">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.learner.key"
                class="border-t border-line align-top"
                data-test="grade-row"
              >
                <td class="py-3 pr-3 pl-6">
                  <p class="font-semibold text-ink">{{ row.learner.name }}</p>
                  <p class="text-xs text-quiet">{{ row.learner.email }}</p>
                </td>
                <td class="px-3 py-3">
                  <input
                    v-model="draft[row.learner.key]!.score"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    max="20"
                    step="0.25"
                    class="app-input tabular-nums"
                    :aria-label="`Note de ${row.learner.name} sur 20`"
                  />
                </td>
                <td class="py-3 pr-6 pl-3">
                  <input
                    v-model.trim="draft[row.learner.key]!.appreciation"
                    class="app-input"
                    maxlength="1000"
                    placeholder="Ex. : Très bonne progression"
                    :aria-label="`Appréciation pour ${row.learner.name}`"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="error" class="app-alert app-alert-danger" role="alert">{{ error }}</p>
        <div v-if="rows.length" class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-quiet">
            Laissez la note vide pour effacer celle d'un apprenant. Les apprenants voient leurs
            notes dans leur espace.
          </p>
          <button
            type="submit"
            class="app-action-primary"
            :disabled="saveGrades.isPending.value || !dirty"
            :aria-busy="saveGrades.isPending.value"
          >
            {{ saveGrades.isPending.value ? 'Enregistrement…' : 'Enregistrer les notes' }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { ApiError, http } from '@/api/http'
import EmptyState from '@/components/app/EmptyState.vue'
import type { Cohort } from '@/features/admin/composables/useCohorts'
import { usePathwayCourses } from '@/features/catalog/composables/useCatalog'
import {
  useCohortGrades,
  useSaveGrades,
  type GradeInput,
} from '@/features/cohorts/composables/useCourseGrades'

const cohorts = useQuery({
  queryKey: ['trainer-cohorts'],
  queryFn: async () =>
    (await http.get<Cohort[]>('/admin/cohorts', { params: { per_page: 100 } })).data,
})
const cohortKey = ref('')
watch(
  () => cohorts.data.value,
  (list) => {
    if (!cohortKey.value && list?.length) cohortKey.value = list[0]!.key
  },
  { immediate: true },
)
const cohort = computed(() => cohorts.data.value?.find((c) => c.key === cohortKey.value))

// Cours publiés de la filière de la cohorte.
const pathwayCourses = usePathwayCourses(computed(() => cohort.value?.pathway?.key ?? ''))
const courses = computed(() => pathwayCourses.data.value?.items ?? [])
const courseKey = ref('')
watch(
  courses,
  (list) => {
    if (!list.some((c) => c.key === courseKey.value)) courseKey.value = list[0]?.key ?? ''
  },
  { immediate: true },
)

const grades = useCohortGrades(cohortKey, courseKey)
const saveGrades = useSaveGrades(cohortKey, courseKey)
const rows = computed(() => grades.data.value ?? [])

// Brouillon éditable, réinitialisé à chaque chargement des notes.
type Draft = { score: string | number; appreciation: string }
const draft = reactive<Record<string, Draft>>({})
const initial = ref('')
watch(
  rows,
  (list) => {
    for (const key of Object.keys(draft)) delete draft[key]
    for (const row of list) {
      draft[row.learner.key] = {
        score: row.grade ? row.grade.score : '',
        appreciation: row.grade?.appreciation ?? '',
      }
    }
    initial.value = JSON.stringify(draft)
  },
  { immediate: true },
)
const dirty = computed(() => JSON.stringify(draft) !== initial.value)
const error = ref('')

async function save() {
  error.value = ''
  const payload: GradeInput[] = []
  for (const row of rows.value) {
    const entry = draft[row.learner.key]!
    const raw = entry.score === '' || entry.score === null ? null : Number(entry.score)
    if (raw !== null && (Number.isNaN(raw) || raw < 0 || raw > 20)) {
      error.value = `La note de ${row.learner.name} doit être comprise entre 0 et 20.`
      return
    }
    payload.push({
      learner_key: row.learner.key,
      score: raw,
      appreciation: entry.appreciation || null,
    })
  }
  try {
    await saveGrades.mutateAsync(payload)
    toast.success('Notes enregistrées.')
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.displayMessage : 'Les notes n’ont pas pu être enregistrées.'
  }
}
</script>
