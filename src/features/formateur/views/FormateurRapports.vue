<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Rapports d'avancement</h1>
        <p class="app-page-copy">
          Déposez vos rapports en PDF pour l'administration et suivez leur validation.
        </p>
      </div>
    </header>

    <div v-if="cohorts.isPending.value" class="app-skeleton h-24" />
    <EmptyState
      v-else-if="!cohorts.data.value?.length"
      title="Aucune cohorte encadrée"
      description="Les rapports se déposent pour une cohorte qui vous est confiée."
      framed
    />
    <template v-else>
      <label class="block max-w-md text-sm font-semibold text-ink">
        Cohorte
        <select v-model="cohortKey" class="app-input mt-1" data-test="report-cohort">
          <option v-for="cohort in cohorts.data.value" :key="cohort.key" :value="cohort.key">
            {{ cohort.name }}
          </option>
        </select>
      </label>

      <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section class="app-panel space-y-3" aria-labelledby="reports-list">
          <h2 id="reports-list" class="text-lg font-bold text-ink">Rapports déposés</h2>
          <div v-if="reports.isPending.value" class="app-skeleton h-20" />
          <EmptyState
            v-else-if="!reports.data.value?.length"
            title="Aucun rapport pour cette cohorte"
            description="Déposez votre premier rapport avec le formulaire."
          />
          <ul v-else class="-mx-2 divide-y divide-line">
            <li
              v-for="report in reports.data.value"
              :key="report.key"
              class="space-y-1.5 px-2 py-3"
              data-test="report-row"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-semibold text-ink">{{ report.title }}</p>
                <span class="app-chip" :class="reportStatusChip[report.status]">
                  {{ reportStatusLabels[report.status] }}
                </span>
              </div>
              <p class="text-xs text-quiet">
                <span v-if="report.period_label">{{ report.period_label }} · </span>
                Déposé le {{ formatDate(report.created_at) }}
              </p>
              <p
                v-if="report.status === 'rejected' && report.review_note"
                class="app-alert app-alert-danger"
              >
                {{ report.review_note }}
              </p>
              <a
                v-if="report.media?.download_url"
                :href="report.media.download_url"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <FileTextIcon class="size-4" aria-hidden="true" /> Ouvrir le PDF
              </a>
            </li>
          </ul>
        </section>

        <form
          class="app-panel h-fit space-y-3"
          aria-labelledby="new-report"
          data-test="report-form"
          @submit.prevent="submit"
        >
          <h2 id="new-report" class="text-lg font-bold text-ink">Déposer un rapport</h2>
          <label class="block text-sm font-semibold text-ink">
            Titre
            <input
              v-model.trim="form.title"
              class="app-input mt-1"
              maxlength="180"
              required
              placeholder="Ex. : Bilan du module 1"
            />
          </label>
          <label class="block text-sm font-semibold text-ink">
            Module ou période <span class="font-normal text-quiet">(facultatif)</span>
            <input
              v-model.trim="form.period_label"
              class="app-input mt-1"
              maxlength="120"
              placeholder="Ex. : Semaine 3"
            />
          </label>
          <label class="block text-sm font-semibold text-ink">
            Résumé <span class="font-normal text-quiet">(facultatif)</span>
            <textarea
              v-model.trim="form.summary"
              class="app-input mt-1"
              rows="3"
              maxlength="5000"
            />
          </label>
          <label class="block text-sm font-semibold text-ink">
            Fichier PDF
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf"
              required
              class="mt-1 block w-full text-sm text-body file:mr-3 file:rounded-lg file:border-0 file:bg-mint file:px-3 file:py-2 file:font-semibold file:text-primary-shade"
              data-test="report-file"
              @change="pickFile"
            />
          </label>
          <p v-if="error" class="app-alert app-alert-danger" role="alert">{{ error }}</p>
          <button
            type="submit"
            class="app-action-primary w-full"
            :disabled="submitReport.isPending.value"
            :aria-busy="submitReport.isPending.value"
          >
            {{ submitReport.isPending.value ? 'Envoi…' : 'Déposer le rapport' }}
          </button>
        </form>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { FileText as FileTextIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { ApiError, http } from '@/api/http'
import EmptyState from '@/components/app/EmptyState.vue'
import type { Cohort } from '@/features/admin/composables/useCohorts'
import {
  reportStatusChip,
  reportStatusLabels,
  useCohortReports,
  useSubmitReport,
} from '@/features/cohorts/composables/useTrainerReports'

// Côté API, la liste est limitée aux cohortes que le formateur encadre.
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

const reports = useCohortReports(cohortKey)
const submitReport = useSubmitReport(cohortKey)

const form = reactive({ title: '', period_label: '', summary: '' })
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')

function pickFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function submit() {
  error.value = ''
  if (!file.value || file.value.type !== 'application/pdf') {
    error.value = 'Choisissez un fichier PDF.'
    return
  }
  try {
    await submitReport.mutateAsync({ ...form, file: file.value })
    toast.success('Rapport déposé. L’administration va l’examiner.')
    Object.assign(form, { title: '', period_label: '', summary: '' })
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.displayMessage : 'Le rapport n’a pas pu être déposé.'
  }
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '-'
}
</script>
