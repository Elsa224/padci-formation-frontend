<template>
  <section class="app-page max-w-6xl">
    <header class="app-page-header">
      <div>
        <p class="app-eyebrow">Pilotage</p>
        <h1 class="app-page-title mt-2">Rapports et indicateurs</h1>
        <p class="app-page-copy">
          Inscriptions, achèvement et attestations, calculés en direct par la plateforme.
        </p>
      </div>
    </header>

    <!-- Indicateurs globaux -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <article v-for="kpi in kpis" :key="kpi.label" class="app-panel" data-test="report-kpi">
        <div v-if="overview.isPending.value" class="app-skeleton h-14" />
        <template v-else>
          <p class="text-sm font-medium text-quiet">{{ kpi.label }}</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-ink">{{ kpi.value }}</p>
        </template>
      </article>
    </div>
    <p v-if="overview.isError.value" class="text-sm text-red-700" role="alert">
      {{ apiMessage(overview.error.value, 'Impossible de charger les indicateurs.') }}
    </p>

    <!-- Par filière -->
    <section class="app-panel space-y-4" aria-labelledby="by-pathway">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="by-pathway" class="text-lg font-bold text-ink">Par filière</h2>
        <button
          class="app-action-secondary"
          :disabled="!pathways.data.value?.length"
          @click="exportPathways"
        >
          Exporter (CSV)
        </button>
      </div>
      <ReportTable
        :loading="pathways.isPending.value"
        :rows="pathwayRows"
        first-column="Filière"
        empty="Aucune inscription pour le moment."
      />
    </section>

    <!-- Par cohorte -->
    <section class="app-panel space-y-4" aria-labelledby="by-cohort">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="by-cohort" class="text-lg font-bold text-ink">Par cohorte</h2>
        <button
          class="app-action-secondary"
          :disabled="!cohorts.data.value?.length"
          @click="exportCohorts"
        >
          Exporter (CSV)
        </button>
      </div>
      <ReportTable
        :loading="cohorts.isPending.value"
        :rows="cohortRows"
        first-column="Cohorte"
        empty="Aucune cohorte pour le moment."
        :show-attendance="true"
      />
    </section>

    <p class="app-panel-muted text-sm text-quiet">
      Les indicateurs demandés par le bailleur qui ne sont pas encore collectés (répartition
      femmes/hommes, insertion professionnelle) n'apparaissent pas ici : ils demandent d'abord de
      définir et de collecter ces données.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardByPathway, useDashboardOverview } from '../composables/useDashboard'
import {
  apiMessage,
  formatPercent,
  percentNumber,
  useDashboardByCohort,
} from '../composables/useAdminOperations'
import ReportTable, { type ReportRow } from '../components/ReportTable.vue'

const overview = useDashboardOverview()
const pathways = useDashboardByPathway()
const cohorts = useDashboardByCohort()

const number = new Intl.NumberFormat('fr-FR')

const kpis = computed(() => {
  const data = overview.data.value
  return [
    { label: 'Apprenants', value: data ? number.format(data.learners_total) : '—' },
    { label: 'Cohortes actives', value: data ? number.format(data.active_cohorts_total) : '—' },
    { label: 'Cours publiés', value: data ? number.format(data.published_courses_total) : '—' },
    { label: "Taux d'achèvement", value: data ? formatPercent(data.completion_rate) : '—' },
    { label: 'Attestations', value: data ? number.format(data.certificates_issued_total) : '—' },
  ]
})

const pathwayRows = computed<ReportRow[]>(() =>
  (pathways.data.value ?? []).map((row) => ({
    key: row.pathway_key,
    label: row.name,
    sublabel: null,
    enrolled: row.enrolled_count,
    completed: row.completed_count,
    rate: row.completion_rate,
    certificates: row.certificates_issued,
  })),
)

const cohortRows = computed<ReportRow[]>(() =>
  (cohorts.data.value ?? []).map((row) => ({
    key: row.cohort_key,
    label: row.name,
    sublabel: [row.code, row.pathway_name].filter(Boolean).join(' · '),
    enrolled: row.enrolled_count,
    completed: row.completed_count,
    rate: row.completion_rate,
    certificates: row.certificates_issued,
    attendance_rate: row.attendance_rate,
    attendance_sessions_count: row.attendance_sessions_count,
  })),
)

/** CSV with ';' (French Excel default) and a BOM so accents open correctly. */
function downloadCsv(filename: string, header: string[], lines: Array<Array<string | number>>) {
  const escape = (value: string | number) => {
    const text = String(value)
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const body = [header, ...lines].map((line) => line.map(escape).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const today = () => new Date().toISOString().slice(0, 10)

function exportPathways() {
  downloadCsv(
    `rapport-filieres-${today()}.csv`,
    ['Filière', 'Inscrits', 'Terminés', "Taux d'achèvement (%)", 'Attestations'],
    pathwayRows.value.map((row) => [
      row.label,
      row.enrolled,
      row.completed,
      percentNumber(row.rate),
      row.certificates,
    ]),
  )
}

function exportCohorts() {
  downloadCsv(
    `rapport-cohortes-${today()}.csv`,
    [
      'Cohorte',
      'Code et filière',
      'Inscrits',
      'Terminés',
      "Taux d'achèvement (%)",
      'Attestations',
      "Taux d'assiduité (%)",
      'Séances de présence',
    ],
    cohortRows.value.map((row) => [
      row.label,
      row.sublabel ?? '',
      row.enrolled,
      row.completed,
      percentNumber(row.rate),
      row.certificates,
      row.attendance_rate !== null && row.attendance_rate !== undefined
        ? percentNumber(row.attendance_rate)
        : '—',
      row.attendance_sessions_count ?? 0,
    ]),
  )
}
</script>
