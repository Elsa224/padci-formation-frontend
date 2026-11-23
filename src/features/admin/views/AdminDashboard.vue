<template>
  <div class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Tableau de bord</h1>
        <p class="app-page-copy">
          Apprenants, cohortes, cours et attestations du programme, en temps réel.
        </p>
      </div>
      <RouterLink to="/admin/rapports" class="app-action-secondary">Voir les rapports</RouterLink>
    </header>

    <!-- À traiter : n'apparaît que si une décision attend l'administration -->
    <section
      v-if="todo.length"
      class="app-panel-forest"
      aria-labelledby="admin-todo-title"
      data-test="admin-todo"
    >
      <h2 id="admin-todo-title" class="text-sm font-semibold text-savane">À traiter</h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="item in todo" :key="item.key">
          <RouterLink
            :to="item.to"
            class="group flex items-center justify-between gap-4 rounded-xl bg-forest-raised p-4 transition hover:bg-forest-line/60"
          >
            <div class="min-w-0">
              <p class="text-[1.9rem] leading-none font-bold text-white tabular-nums">
                {{ item.count }}
              </p>
              <p class="mt-1.5 text-sm text-forest-muted">{{ item.label }}</p>
            </div>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-savane">
              {{ item.action }}
              <ChevronRightIcon
                class="size-4 transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- Indicateurs principaux : une seule bande, lue d'un coup d'œil -->
    <p
      v-if="isOverviewError"
      class="rounded-[18px] bg-danger-soft p-4 text-sm text-danger-ink"
      role="alert"
    >
      {{ (overviewError as ApiError)?.message ?? 'Indicateurs indisponibles. Rechargez la page.' }}
    </p>
    <section
      v-else
      class="grid grid-cols-2 gap-x-6 gap-y-7 rounded-[18px] border border-line bg-white p-6 shadow-panel lg:grid-cols-4 lg:divide-x lg:divide-line"
      aria-label="Indicateurs principaux"
    >
      <StatTile
        label="Apprenants"
        :value="overview?.learners_total ?? '-'"
        :loading="isOverviewPending"
      />
      <StatTile
        class="lg:pl-6"
        label="Cohortes actives"
        :value="overview?.active_cohorts_total ?? '-'"
        :loading="isOverviewPending"
      />
      <StatTile
        class="lg:pl-6"
        label="Taux d'achèvement"
        tone="leaf"
        :value="overview ? `${Math.round(overview.completion_rate * 100)} %` : '-'"
        :loading="isOverviewPending"
      />
      <StatTile
        class="lg:pl-6"
        label="Attestations délivrées"
        tone="savane"
        :value="overview?.certificates_issued_total ?? '-'"
        :loading="isOverviewPending"
      />
    </section>

    <!-- ================= GRAPHIQUES ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Répartition par filière (réel, GET /admin/dashboard/reports/pathways) -->
      <div class="lg:col-span-2 app-panel">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-ink">Inscrits par filière</h3>
        </div>
        <div
          v-if="isPathwaysPending"
          class="h-64 flex items-center justify-center text-sm text-quiet"
        >
          Chargement…
        </div>
        <div
          v-else-if="isPathwaysError"
          class="h-64 flex items-center justify-center text-sm text-danger-ink"
        >
          Impossible de charger.
        </div>
        <div v-else-if="pathwayMetrics && pathwayMetrics.length > 0" class="h-64">
          <Bar :data="pathwayChartData" :options="chartOptions" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-sm text-quiet">
          Aucune filière à afficher.
        </div>
      </div>

      <!-- Statut des candidatures (réel, totaux par statut via GET /admin/applications) -->
      <div class="app-panel">
        <h3 class="text-lg font-bold text-ink mb-4">Statut des candidatures</h3>
        <div
          v-if="isStatusCountsPending"
          class="h-64 flex items-center justify-center text-sm text-quiet"
        >
          Chargement…
        </div>
        <div
          v-else-if="isStatusCountsError"
          class="h-64 flex items-center justify-center text-sm text-danger-ink"
        >
          Impossible de charger.
        </div>
        <div v-else-if="statusCounts && totalApplications > 0" class="h-64">
          <Doughnut :data="statusChartData" :options="doughnutOptions" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-sm text-quiet">
          Aucune candidature pour l'instant.
        </div>
      </div>
    </div>

    <!-- ================= DERNIÈRES CANDIDATURES ACCEPTÉES (réel) ================= -->
    <div class="overflow-hidden rounded-[18px] border border-line bg-white shadow-panel">
      <div class="px-6 py-4 border-b border-line flex items-center justify-between">
        <h3 class="text-lg font-bold text-ink">Dernières candidatures acceptées</h3>
        <router-link
          to="/admin/candidatures"
          class="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Tout voir
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="app-thead">
              <th class="py-3 px-6">Candidat</th>
              <th class="py-3 px-6">Filière</th>
              <th class="py-3 px-6">Session</th>
              <th class="py-3 px-6">Date de décision</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line text-sm">
            <tr v-if="isRecentPending">
              <td colspan="4" class="py-8 text-center text-quiet">Chargement…</td>
            </tr>
            <tr v-else-if="recentAccepted.length === 0">
              <td colspan="4" class="py-8 text-center text-quiet">
                Aucune candidature acceptée pour l'instant.
              </td>
            </tr>
            <tr
              v-for="application in recentAccepted"
              :key="application.key"
              class="hover:bg-canvas transition"
            >
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs"
                  >
                    {{ initialsOf(application.user?.name) }}
                  </div>
                  <div>
                    <p class="font-medium text-ink">{{ application.user?.name ?? '-' }}</p>
                    <p class="text-xs text-quiet">{{ application.user?.email ?? '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-quiet">{{ application.pathway?.name ?? '-' }}</td>
              <td class="py-4 px-6 text-quiet">{{ application.cohort?.code ?? '-' }}</td>
              <td class="py-4 px-6 text-quiet">{{ formatDate(application.decided_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js'
import type { ApiError } from '@/api/http'
import { ChevronRight as ChevronRightIcon } from '@lucide/vue'
import StatTile from '@/components/app/StatTile.vue'
import { useCourseStatusCounts } from '@/features/moderation/composables/useModerationQueues'
import { usePendingReportCount } from '@/features/cohorts/composables/useTrainerReports'
import { useApplications } from '../composables/useApplications'
import {
  useApplicationStatusCounts,
  useDashboardByPathway,
  useDashboardOverview,
} from '../composables/useDashboard'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)
// Graphiques dans la police et les couleurs de texte de l'application.
ChartJS.defaults.font.family = getComputedStyle(document.body).fontFamily
ChartJS.defaults.color = '#56645d'

// ==================== KPIs ====================
const {
  data: overview,
  isPending: isOverviewPending,
  isError: isOverviewError,
  error: overviewError,
} = useDashboardOverview()

// ==================== RÉPARTITION PAR FILIÈRE ====================
const {
  data: pathwayMetrics,
  isPending: isPathwaysPending,
  isError: isPathwaysError,
} = useDashboardByPathway()

const pathwayChartData = computed(() => ({
  labels: (pathwayMetrics.value ?? []).map((pathway) => pathway.name),
  datasets: [
    {
      label: 'Inscrits',
      data: (pathwayMetrics.value ?? []).map((pathway) => pathway.enrolled_count),
      backgroundColor: 'rgba(25, 131, 65, 0.85)',
      borderRadius: 6,
      borderWidth: 0,
    },
    {
      label: 'Complétés',
      data: (pathwayMetrics.value ?? []).map((pathway) => pathway.completed_count),
      backgroundColor: 'rgba(25, 131, 65, 0.35)',
      borderRadius: 6,
      borderWidth: 0,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { usePointStyle: true, padding: 20 },
    },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#dde5df' } },
    x: { grid: { display: false } },
  },
}

// ==================== STATUT DES CANDIDATURES ====================
const {
  data: statusCounts,
  isPending: isStatusCountsPending,
  isError: isStatusCountsError,
} = useApplicationStatusCounts()

const statusLabels: Record<string, string> = {
  submitted: 'Soumises',
  in_review: 'En revue',
  accepted: 'Acceptées',
  waitlisted: 'Liste d’attente',
  rejected: 'Rejetées',
  withdrawn: 'Retirées',
}

const totalApplications = computed(() =>
  Object.values(statusCounts.value ?? {}).reduce(
    (sum: number, count) => sum + (count as number),
    0,
  ),
)

const statusChartData = computed(() => {
  const counts = statusCounts.value ?? {}
  const entries = (Object.entries(counts) as [string, number][]).filter(([, count]) => count > 0)

  return {
    labels: entries.map(([status]) => statusLabels[status] ?? status),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        // Chart.js n'accepte pas de classes Tailwind ; --color-primary pour
        // "Acceptées", le reste des couleurs de statut justifiées (voir 02).
        backgroundColor: entries.map(([status]) => {
          switch (status) {
            case 'accepted':
              return '#198341' // primary
            case 'in_review':
              return '#1f6f9f' // info
            case 'waitlisted':
              return '#e8761e' // savane
            case 'rejected':
              return '#d92d20' // danger
            default:
              return '#9db8aa' // forest-muted : soumises, retirées
          }
        }),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 15 } },
  },
  cutout: '75%',
}

// ==================== À TRAITER ====================
const courseCounts = useCourseStatusCounts(['submitted', 'in_review'])
const pendingReports = usePendingReportCount()
const todo = computed(() => {
  const items = []
  const counts = statusCounts.value as Record<string, number> | undefined
  const applications = (counts?.submitted ?? 0) + (counts?.in_review ?? 0)
  if (applications > 0) {
    items.push({
      key: 'applications',
      count: applications,
      label: applications === 1 ? 'candidature à décider' : 'candidatures à décider',
      action: 'Examiner',
      to: '/admin/candidatures?statut=submitted',
    })
  }
  const c = courseCounts.data.value
  const courses = (c?.submitted ?? 0) + (c?.in_review ?? 0)
  if (courses > 0) {
    items.push({
      key: 'courses',
      count: courses,
      label: courses === 1 ? 'cours à valider' : 'cours à valider',
      action: 'Modérer',
      to: '/admin/moderation-cours',
    })
  }
  const reports = pendingReports.data.value ?? 0
  if (reports > 0) {
    items.push({
      key: 'reports',
      count: reports,
      label: reports === 1 ? 'rapport de formateur à valider' : 'rapports de formateurs à valider',
      action: 'Valider',
      to: '/admin/rapports-formateurs',
    })
  }
  return items
})

// ==================== DERNIÈRES CANDIDATURES ACCEPTÉES ====================
const { data: recentData, isPending: isRecentPending } = useApplications(
  computed(() => ({ status: 'accepted', page: 1 })),
)
const recentAccepted = computed(() => (recentData.value?.items ?? []).slice(0, 5))

function initialsOf(name: string | undefined): string {
  if (!name) return '-'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}
</script>

<style scoped>
/* Optionnel : Personnalisation de la scrollbar */
</style>
