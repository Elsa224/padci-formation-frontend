<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Rapports des formateurs</h1>
        <p class="app-page-copy">
          Rapports d'avancement déposés par les formateurs : validez-les ou demandez une correction.
        </p>
      </div>
    </header>

    <QueueTabs v-model="status" :tabs="tabs" label="Statut des rapports" />

    <div class="app-panel">
      <div v-if="reports.isPending.value" class="app-skeleton h-32" />
      <p v-else-if="reports.isError.value" class="app-alert app-alert-danger" role="alert">
        Impossible de charger les rapports.
      </p>
      <EmptyState
        v-else-if="!items.length"
        :title="status === 'submitted' ? 'Aucun rapport à valider' : 'Aucun rapport'"
        description="Les rapports apparaissent ici dès qu'un formateur les dépose."
      />
      <ul v-else class="-mx-2 divide-y divide-line">
        <li
          v-for="report in items"
          :key="report.key"
          class="space-y-2 px-2 py-4"
          data-test="admin-report-row"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-ink">{{ report.title }}</p>
              <p class="text-xs text-quiet">
                {{ report.author?.name ?? 'Formateur' }} · {{ report.cohort?.name }}
                <span v-if="report.period_label"> · {{ report.period_label }}</span>
                · {{ formatDate(report.created_at) }}
              </p>
            </div>
            <span class="app-chip" :class="reportStatusChip[report.status]">
              {{ reportStatusLabels[report.status] }}
            </span>
          </div>
          <p v-if="report.summary" class="text-sm whitespace-pre-line text-body">
            {{ report.summary }}
          </p>
          <p v-if="report.review_note" class="text-sm text-quiet">
            Motif : {{ report.review_note }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <a
              v-if="report.media?.download_url"
              :href="report.media.download_url"
              target="_blank"
              rel="noopener"
              class="app-action-secondary min-h-9 px-3 py-1.5 text-xs"
            >
              <FileTextIcon class="size-4" aria-hidden="true" /> Ouvrir le PDF
            </a>
            <template v-if="report.status === 'submitted'">
              <button
                type="button"
                class="app-action-primary min-h-9 px-3 py-1.5 text-xs"
                :disabled="decide.isPending.value"
                :aria-busy="decide.isPending.value && pendingKey === report.key"
                data-test="approve-report"
                @click="approve(report.key)"
              >
                Valider
              </button>
              <button
                type="button"
                class="app-action-secondary min-h-9 px-3 py-1.5 text-xs text-danger-ink hover:border-danger-line hover:bg-danger-soft"
                data-test="reject-report"
                @click="rejecting = rejecting === report.key ? null : report.key"
              >
                Rejeter
              </button>
            </template>
          </div>
          <form
            v-if="rejecting === report.key"
            class="space-y-2 rounded-xl border border-line p-3"
            @submit.prevent="reject(report.key)"
          >
            <label class="block text-sm font-semibold text-ink" :for="`note-${report.key}`">
              Ce que le formateur doit corriger
            </label>
            <textarea
              :id="`note-${report.key}`"
              v-model.trim="note"
              class="app-input"
              rows="2"
              maxlength="2000"
              required
            />
            <button
              type="submit"
              class="app-action-primary min-h-9 px-3 py-1.5 text-xs"
              :disabled="decide.isPending.value || !note"
              :aria-busy="decide.isPending.value"
            >
              Confirmer le rejet
            </button>
          </form>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileText as FileTextIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { ApiError } from '@/api/http'
import EmptyState from '@/components/app/EmptyState.vue'
import QueueTabs from '@/components/app/QueueTabs.vue'
import {
  reportStatusChip,
  reportStatusLabels,
  useAllReports,
  useDecideReport,
  usePendingReportCount,
} from '@/features/cohorts/composables/useTrainerReports'

const status = ref('submitted')
const reports = useAllReports(status)
const items = computed(() => reports.data.value?.items ?? [])
const pendingCount = usePendingReportCount()
const tabs = computed(() => [
  { value: 'submitted', label: 'À valider', count: pendingCount.data.value ?? null, urgent: true },
  { value: 'approved', label: 'Validés' },
  { value: 'rejected', label: 'Rejetés' },
  { value: '', label: 'Tous' },
])

const decide = useDecideReport()
const rejecting = ref<string | null>(null)
const pendingKey = ref<string | null>(null)
const note = ref('')

async function run(key: string, decision: 'approved' | 'rejected') {
  pendingKey.value = key
  try {
    await decide.mutateAsync({ key, decision, note: note.value })
    toast.success(decision === 'approved' ? 'Rapport validé.' : 'Rapport rejeté.')
    rejecting.value = null
    note.value = ''
  } catch (err) {
    toast.error(
      err instanceof ApiError ? err.displayMessage : 'La décision n’a pas été enregistrée.',
    )
  } finally {
    pendingKey.value = null
  }
}
const approve = (key: string) => run(key, 'approved')
const reject = (key: string) => run(key, 'rejected')

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—'
}
</script>
