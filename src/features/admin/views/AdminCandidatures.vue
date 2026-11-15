<template>
  <section class="app-page" aria-labelledby="admin-applications-title">
    <!-- ================= EN-TÊTE ================= -->
    <header class="app-page-header">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Admissions</p>
        <h1 id="admin-applications-title" class="app-page-title mt-2">File de candidatures</h1>
        <p class="app-page-copy">
          File d'admission : revue et décision sur les candidatures soumises par les apprenants.
        </p>
      </div>
    </header>

    <!-- ================= BARRE D'OUTILS (Filtres) ================= -->
    <div class="app-panel p-4 sm:p-5">
      <div class="flex flex-col gap-3 md:flex-row">
        <!-- Recherche -->
        <div class="relative flex-1">
          <svg
            class="w-5 h-5 text-quiet absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un nom, un email..."
            class="app-input pl-10"
          />
        </div>

        <!-- Filtre Filière (filières réelles du catalogue) -->
        <select
          v-model="filterPathwayKey"
          class="app-input min-w-[200px]"
        >
          <option value="">Toutes les filières</option>
          <option v-for="pathway in pathways" :key="pathway.key" :value="pathway.key">
            {{ pathway.name }}
          </option>
        </select>

        <!-- Filtre Statut -->
        <select
          v-model="filterStatus"
          class="app-input min-w-[170px]"
        >
          <option value="">Tous les statuts</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- ================= TABLEAU DES CANDIDATURES ================= -->
    <div class="app-panel overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="border-b border-line bg-canvas text-xs font-semibold uppercase tracking-[0.1em] text-quiet"
            >
              <th class="py-4 px-6">Candidat</th>
              <th class="py-4 px-6">Filière</th>
              <th class="py-4 px-6">Session</th>
              <th class="py-4 px-6">Date de dépôt</th>
              <th class="py-4 px-6">Statut</th>
              <th class="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line text-sm">
            <tr v-if="isPending">
              <td colspan="6" class="py-10 text-center text-quiet">
                Chargement des candidatures…
              </td>
            </tr>

            <tr v-else-if="isError">
              <td colspan="6" class="py-10 text-center text-danger-ink">
                {{ (error as ApiError)?.message ?? 'Impossible de charger les candidatures.' }}
              </td>
            </tr>

            <tr v-else-if="applications.length === 0">
              <td colspan="6" class="py-10 text-center text-quiet">
                Aucune candidature ne correspond à vos critères.
              </td>
            </tr>

            <tr
              v-for="application in applications"
              :key="application.key"
              class="transition hover:bg-primary/[0.025]"
            >
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary"
                  >
                    {{ initialsOf(application.user?.name) }}
                  </div>
                  <div>
                    <p class="font-bold text-ink">{{ application.user?.name ?? '-' }}</p>
                    <p class="text-xs text-quiet">{{ application.user?.email ?? '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-medium text-ink">
                {{ application.pathway?.name ?? '-' }}
              </td>
              <td class="px-6 py-4 text-quiet">
                {{ application.cohort?.code ?? '-' }}
              </td>
              <td class="px-6 py-4 text-quiet">
                {{ formatDate(application.submitted_at) }}
              </td>
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  :class="statusBadgeClass(application.status)"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="statusDotClass(application.status)"
                  ></span>
                  {{ statusLabel(application.status) }}
                </span>
                <p
                  v-if="application.equipment_review && !equipmentAllowsAdmission(application.equipment_review.status)"
                  class="mt-1 text-xs font-medium text-warning-ink"
                >
                  Matériel : {{ equipmentReviewLabel(application.equipment_review.status) }}
                </p>
              </td>
              <td class="py-4 px-6 text-center">
                <button
                  @click="openModal(application.key)"
                  class="rounded-lg p-2 text-primary transition hover:bg-primary/10"
                  title="Voir le dossier"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION (réelle, meta.pagination du backend) -->
      <div
        v-if="pagination"
        class="flex flex-col items-center justify-between gap-4 border-t border-line bg-canvas px-6 py-4 sm:flex-row"
      >
        <span class="text-sm text-quiet">
          Affichage de <span class="font-semibold text-ink">{{ pagination.from ?? 0 }}</span> à
          <span class="font-semibold text-ink">{{ pagination.to ?? 0 }}</span> sur
          <span class="font-semibold text-ink">{{ pagination.total ?? 0 }}</span> candidatures
        </span>
        <nav class="inline-flex rounded-md shadow-sm -space-x-px">
          <button
            @click="page > 1 && page--"
            :disabled="page === 1"
            class="rounded-l-lg border border-line bg-white px-3 py-2 text-quiet transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span
            class="border-y border-line bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            {{ pagination.current_page }} / {{ pagination.last_page ?? 1 }}
          </span>
          <button
            @click="page < (pagination.last_page ?? 1) && page++"
            :disabled="page === (pagination.last_page ?? 1)"
            class="rounded-r-lg border border-line bg-white px-3 py-2 text-quiet transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>

    <!-- ================= MODALE DE DÉTAIL CANDIDAT ================= -->
    <div
      v-if="selectedKey"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl animate-modal">
        <!-- En-tête Modale -->
        <div
          class="flex items-center justify-between border-b border-line bg-canvas px-6 py-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-md"
            >
              {{ initialsOf(detail?.user?.name) }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-ink">{{ detail?.user?.name ?? '-' }}</h3>
              <p class="text-sm text-quiet">{{ detail?.user?.email ?? '-' }}</p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="text-quiet hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Contenu Modale -->
        <div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div v-if="isDetailPending" class="text-sm text-quiet text-center py-6">
            Chargement du dossier…
          </div>
          <div v-else-if="isDetailError" class="text-sm text-red-600 text-center py-6">
            {{ (detailError as ApiError)?.message ?? 'Impossible de charger ce dossier.' }}
          </div>

          <template v-else-if="detail">
            <!-- Statut actuel -->
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                :class="statusBadgeClass(detail.status)"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="statusDotClass(detail.status)"
                ></span>
                {{ statusLabel(detail.status) }}
              </span>
              <span class="text-xs text-quiet"
                >Déposée le {{ formatDate(detail.submitted_at) }}</span
              >
            </div>

            <!-- Filière et session -->
            <div>
              <h4 class="text-sm font-bold text-ink uppercase tracking-wide mb-3">
                Filière &amp; session
              </h4>
              <div class="grid grid-cols-2 gap-4 bg-canvas p-4 rounded-xl text-sm">
                <div>
                  <span class="text-quiet">Filière :</span>
                  <span class="font-medium text-ink">{{ detail.pathway?.name ?? '-' }}</span>
                </div>
                <div>
                  <span class="text-quiet">Session :</span>
                  <span class="font-medium text-ink">{{ detail.cohort?.code ?? '-' }}</span>
                </div>
                <div v-if="detail.cohort">
                  <span class="text-quiet">Dates :</span>
                  <span class="font-medium text-ink"
                    >{{ formatDate(detail.cohort.starts_at) }} →
                    {{ formatDate(detail.cohort.ends_at) }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Motivation -->
            <div v-if="detail.motivation">
              <h4 class="text-sm font-bold text-ink uppercase tracking-wide mb-3">
                Motivation
              </h4>
              <p class="bg-canvas p-4 rounded-xl text-sm text-ink whitespace-pre-wrap">
                {{ detail.motivation }}
              </p>
            </div>

            <div v-if="detail.equipment_review">
              <h4 class="text-sm font-bold text-ink uppercase tracking-wide mb-3">Éligibilité matériel</h4>
              <div class="rounded-xl border border-line bg-canvas p-4 text-sm space-y-2">
                <p :class="equipmentAllowsAdmission(detail.equipment_review.status) ? 'text-green-700' : 'text-amber-700'" class="font-semibold">
                  {{ equipmentReviewLabel(detail.equipment_review.status) }}
                </p>
                <p v-if="detail.equipment_review.reason" class="text-ink">Motif : {{ detail.equipment_review.reason }}</p>
                <p v-if="!equipmentAllowsAdmission(detail.equipment_review.status)" class="text-xs text-quiet">
                  L'acceptation est bloquée tant que cette revue n'est pas approuvée. Vous pouvez néanmoins classer ou rejeter le dossier.
                </p>
              </div>
            </div>

            <!-- Payload libre (équipement, disponibilité...) -->
            <div v-if="detail.payload && Object.keys(detail.payload).length > 0">
              <h4 class="text-sm font-bold text-ink uppercase tracking-wide mb-3">
                Informations complémentaires
              </h4>
              <div class="bg-canvas p-4 rounded-xl text-sm space-y-1.5">
                <div
                  v-for="(value, key) in detail.payload"
                  :key="key"
                  class="flex justify-between gap-4"
                >
                  <span class="text-quiet">{{ key }}</span>
                  <span class="font-medium text-ink text-right">{{
                    formatPayloadValue(value)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Décision déjà prise -->
            <div v-if="detail.decided_at" class="bg-canvas p-4 rounded-xl text-sm space-y-1">
              <p>
                <span class="text-quiet">Décidée par :</span>
                <span class="font-medium text-ink">{{ detail.decided_by?.name ?? '-' }}</span>
                le {{ formatDate(detail.decided_at) }}
              </p>
              <p v-if="detail.reason">
                <span class="text-quiet">Motif :</span>
                <span class="font-medium text-ink">{{ detail.reason }}</span>
              </p>
            </div>

            <!-- Saisie du motif de rejet -->
            <div v-if="pendingDecision === 'rejected'">
              <label class="text-sm font-medium text-ink mb-1 block"
                >Motif du rejet (obligatoire)</label
              >
              <textarea
                v-model="rejectReason"
                rows="3"
                class="w-full border border-line rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              ></textarea>
              <p v-if="decideError" class="text-xs text-red-600 mt-1">{{ decideError }}</p>
            </div>
          </template>
        </div>

        <!-- Pied de Modale (Actions) -->
        <div
          v-if="detail"
          class="bg-canvas px-6 py-4 border-t border-line flex flex-wrap justify-end gap-3"
        >
          <button
            v-if="detail.status === 'submitted'"
            @click="startReview"
            :disabled="startReviewMutation.isPending.value"
            class="px-5 py-2.5 bg-white border border-line text-ink rounded-xl font-semibold hover:bg-gray-100 transition text-sm disabled:opacity-50"
          >
            Démarrer la revue
          </button>

          <template v-if="canDecide">
            <button
              v-if="pendingDecision !== 'rejected'"
              @click="pendingDecision = 'rejected'"
              class="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition text-sm"
            >
              Rejeter
            </button>
            <button
              v-else
              @click="confirmReject"
              :disabled="decideMutation.isPending.value"
              class="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition text-sm disabled:opacity-50"
            >
              Confirmer le rejet
            </button>
            <button
              @click="decide('waitlisted')"
              :disabled="decideMutation.isPending.value"
              class="px-5 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition text-sm disabled:opacity-50"
            >
              Liste d'attente
            </button>
            <button
              @click="decide('accepted')"
              :disabled="decideMutation.isPending.value || !canAccept"
              :title="canAccept ? 'Accepter la candidature' : 'La revue matériel doit être approuvée avant l’admission'"
              class="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-shade transition shadow-md shadow-primary/30 text-sm disabled:opacity-50"
            >
              Accepter
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { ApiError } from '@/api/http'
import { useCatalogPathways } from '@/features/public/composables/useCatalogPathways'
import {
  useApplication,
  useApplications,
  useDecideApplication,
  useStartApplicationReview,
  type ApplicationListFilters,
} from '../composables/useApplications'

// ==================== FILTRES (server-side) ====================
const searchQuery = ref('')
const searchQueryDebounced = refDebounced(searchQuery, 350)
const filterPathwayKey = ref('')
const filterStatus = ref('')
const page = ref(1)

watch([filterPathwayKey, filterStatus, searchQueryDebounced], () => {
  page.value = 1
})

const filters = computed<ApplicationListFilters>(() => ({
  q: searchQueryDebounced.value || undefined,
  pathwayKey: filterPathwayKey.value || undefined,
  status: filterStatus.value || undefined,
  page: page.value,
}))

const { data, isPending, isError, error } = useApplications(filters)
const applications = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? null)

const { data: pathways } = useCatalogPathways()

const statusOptions = [
  { value: 'submitted', label: 'Soumise' },
  { value: 'in_review', label: 'En revue' },
  { value: 'accepted', label: 'Acceptée' },
  { value: 'waitlisted', label: 'Liste d’attente' },
  { value: 'rejected', label: 'Rejetée' },
  { value: 'withdrawn', label: 'Retirée' },
]

function statusLabel(status: string): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-primary/10 text-primary'
    case 'in_review':
    case 'waitlisted':
      return 'bg-amber-100 text-amber-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-ink'
  }
}

function statusDotClass(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-primary'
    case 'in_review':
    case 'waitlisted':
      return 'bg-amber-500'
    case 'rejected':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

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

function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ==================== MODALE DE DÉTAIL ====================
const selectedKey = ref<string | null>(null)
const pendingDecision = ref<'rejected' | null>(null)
const rejectReason = ref('')
const decideError = ref<string | null>(null)

const {
  data: detail,
  isPending: isDetailPending,
  isError: isDetailError,
  error: detailError,
} = useApplication(computed(() => selectedKey.value))

const canDecide = computed(
  () =>
    detail.value !== undefined &&
    detail.value !== null &&
    ['submitted', 'in_review', 'waitlisted'].includes(detail.value.status),
)

const canAccept = computed(() =>
  detail.value !== undefined &&
  detail.value !== null &&
  (detail.value.equipment_review === undefined ||
    detail.value.equipment_review === null ||
    equipmentAllowsAdmission(detail.value.equipment_review.status)),
)

function equipmentAllowsAdmission(status: string): boolean {
  return status === 'not_required' || status === 'approved'
}

function equipmentReviewLabel(status: string): string {
  const labels: Record<string, string> = {
    not_required: 'Aucune revue nécessaire',
    pending: 'Revue matériel en attente',
    needs_info: 'Informations complémentaires demandées',
    approved: 'Matériel validé',
    rejected: 'Matériel non validé',
  }
  return labels[status] ?? status
}

function openModal(key: string) {
  selectedKey.value = key
  pendingDecision.value = null
  rejectReason.value = ''
  decideError.value = null
}

function closeModal() {
  selectedKey.value = null
  pendingDecision.value = null
  rejectReason.value = ''
  decideError.value = null
}

const startReviewMutation = useStartApplicationReview()
function startReview() {
  if (!selectedKey.value) return
  startReviewMutation.mutate(selectedKey.value)
}

const decideMutation = useDecideApplication()

function decide(decision: 'accepted' | 'waitlisted') {
  if (!selectedKey.value) return
  decideError.value = null
  decideMutation.mutate(
    { key: selectedKey.value, decision },
    {
      onError: (mutationError) => {
        decideError.value = (mutationError as ApiError).displayMessage
      },
    },
  )
}

function confirmReject() {
  if (!selectedKey.value) return
  if (!rejectReason.value.trim()) {
    decideError.value = 'Le motif du rejet est obligatoire.'
    return
  }
  decideError.value = null
  decideMutation.mutate(
    { key: selectedKey.value, decision: 'rejected', reason: rejectReason.value.trim() },
    {
      onSuccess: () => {
        pendingDecision.value = null
      },
      onError: (mutationError) => {
        decideError.value = (mutationError as ApiError).displayMessage
      },
    },
  )
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  /* --border : variable shadcn CSS réelle (équivalent de l'ancien #e5e7eb). */
  background: var(--border);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-modal {
  animation: modalIn 0.25s ease-out both;
}
</style>
