<template>
  <div class="app-page">
    <!-- EN-TÊTE -->
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Vue Globale PADCI</h1>
        <p class="app-page-copy">
          Pilotage du programme : apprentissage et gouvernance financière.
        </p>
      </div>
      <p class="text-sm text-quiet">Financement : Banque Mondiale (ADR-011)</p>
    </header>

    <!-- Budget du programme : surface signature (chiffres réels des lignes budgétaires) -->
    <section v-if="budgetTotals.length > 0" class="app-panel-forest space-y-6" aria-label="Budget">
      <div
        v-for="total in budgetTotals"
        :key="total.currency"
        class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p class="text-sm font-medium text-savane">Budget alloué ({{ total.currency }})</p>
          <p class="mt-1 text-[2.25rem] leading-none font-bold tabular-nums text-white">
            {{ formatAmount(total.allocated, total.currency) }}
          </p>
        </div>
        <div class="w-full md:w-72">
          <ProgressBar
            :value="total.consumedPercent / 100"
            label="Consommé"
            show-value
            tone="savane"
            on-dark
          />
        </div>
      </div>
    </section>

    <!-- Indicateurs clés : une bande, comme l'espace admin -->
    <section
      class="grid grid-cols-2 gap-x-6 gap-y-7 rounded-[18px] border border-line bg-white p-6 shadow-panel lg:grid-cols-4 lg:divide-x lg:divide-line"
      aria-label="Indicateurs clés"
    >
      <StatTile label="Apprenants" :value="overview?.learners_total ?? '—'" />
      <StatTile
        class="lg:pl-6"
        label="Taux d'achèvement"
        tone="leaf"
        :value="overview ? `${Math.round(overview.completion_rate * 100)} %` : '—'"
      />
      <StatTile
        class="lg:pl-6"
        label="Attestations délivrées"
        :value="overview?.certificates_issued_total ?? '—'"
      />
      <StatTile
        class="lg:pl-6"
        label="ANO en attente"
        :tone="pendingAnoCount > 0 ? 'savane' : 'neutral'"
        :value="pendingAnoCount"
        hint="Signature requise"
      />
    </section>

    <!-- GRAPHIQUE : lignes budgétaires réelles -->
    <div class="app-panel">
      <h3 class="text-lg font-bold text-ink mb-4">
        Allocation et consommation par ligne budgétaire
      </h3>
      <div v-if="isBudgetPending" class="h-64 flex items-center justify-center text-sm text-quiet">
        Chargement…
      </div>
      <div
        v-else-if="budgetLines.length === 0"
        class="h-64 flex items-center justify-center text-sm text-quiet"
      >
        Aucune ligne budgétaire créée pour l'instant.
      </div>
      <div v-else class="h-64"><Bar :data="budgetChartData" :options="chartOptions" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '@/components/app/ProgressBar.vue'
import StatTile from '@/components/app/StatTile.vue'
import { Bar } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { useDashboardOverview } from '@/features/admin/composables/useDashboard'
import { useAnoRequests } from '../composables/useAnoRequests'
import { useBudgetLines } from '../composables/useBudgetLines'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// ==================== KPIs (module Operations, partagé avec AdminDashboard) ====================
const { data: overview } = useDashboardOverview()

// ==================== ANO EN ATTENTE ====================
const anoFilters = computed(() => ({ status: 'pending' }))
const { data: anoData } = useAnoRequests(anoFilters)
const pendingAnoCount = computed(
  () => anoData.value?.pagination?.total ?? anoData.value?.items.length ?? 0,
)

// ==================== BUDGET (réel) ====================
const budgetFilters = computed(() => ({}))
const { data: budgetData, isPending: isBudgetPending } = useBudgetLines(budgetFilters)
const budgetLines = computed(() => budgetData.value?.items ?? [])

const budgetTotals = computed(() => {
  const byCurrency = new Map<string, { allocated: number; consumed: number }>()
  for (const line of budgetLines.value) {
    const entry = byCurrency.get(line.currency) ?? { allocated: 0, consumed: 0 }
    entry.allocated += line.allocated_amount_minor
    entry.consumed += line.consumed_amount_minor
    byCurrency.set(line.currency, entry)
  }
  return Array.from(byCurrency.entries()).map(([currency, totals]) => ({
    currency,
    allocated: totals.allocated,
    consumed: totals.consumed,
    consumedPercent:
      totals.allocated === 0 ? 0 : Math.round((totals.consumed / totals.allocated) * 100),
  }))
})

function formatAmount(amountMinor: number, currency: string): string {
  try {
    return (amountMinor / 100).toLocaleString('fr-FR', { style: 'currency', currency })
  } catch {
    return `${(amountMinor / 100).toLocaleString('fr-FR')} ${currency}`
  }
}

// Couleurs de séries Chart.js : les options de config n'acceptent pas de
// classes Tailwind - valeurs littérales calées sur la famille --color-primary.
const budgetChartData = computed(() => ({
  labels: budgetLines.value.map((line) => line.name),
  datasets: [
    {
      label: 'Alloué',
      data: budgetLines.value.map((line) => line.allocated_amount_minor / 100),
      backgroundColor: 'rgba(249, 115, 22, 0.85)',
      borderRadius: 6,
      borderWidth: 0,
    },
    {
      label: 'Consommé',
      data: budgetLines.value.map((line) => line.consumed_amount_minor / 100),
      backgroundColor: 'rgba(249, 115, 22, 0.35)',
      borderRadius: 6,
      borderWidth: 0,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { usePointStyle: true } } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
    x: { grid: { display: false } },
  },
}
</script>
