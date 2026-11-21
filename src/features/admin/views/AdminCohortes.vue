<template>
  <div class="space-y-6">
    <!-- ================= EN-TÊTE ================= -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-ink">Gestion des Cohortes</h1>
        <p class="text-sm text-quiet mt-1">Sessions par filière : effectifs, statut et dates.</p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary-shade"
          data-testid="btn-open-create-cohort"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouvelle cohorte
        </button>
      </div>
    </div>

    <!-- ================= NOTIFICATION DE DRAINAGE STANDBY ================= -->
    <div
      v-if="drainedNotification"
      class="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-semibold text-primary shadow-sm"
      data-testid="cohort-drained-notification"
    >
      <div class="flex items-center gap-3">
        <svg
          class="h-5 w-5 text-primary shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ drainedNotification }}</span>
      </div>
      <button
        @click="drainedNotification = null"
        class="text-primary hover:text-ink transition p-1"
        title="Fermer"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- ================= FILTRES ================= -->
    <div class="bg-white rounded-xl shadow-sm border border-line p-4">
      <div class="flex flex-col md:flex-row gap-4">
        <select
          v-model="filterPathwayKey"
          class="px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-ink bg-white min-w-[200px]"
        >
          <option value="">Toutes les filières</option>
          <option v-for="pathway in pathways" :key="pathway.key" :value="pathway.key">
            {{ pathway.name }}
          </option>
        </select>
        <select
          v-model="filterStatus"
          class="px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-ink bg-white min-w-[170px]"
        >
          <option value="">Tous les statuts</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- ================= RÉSUMÉ GLOBAL (calculé depuis les cohortes réellement chargées) ================= -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-5 border border-line flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm text-quiet font-medium">Total inscrits</p>
          <p class="text-2xl font-bold text-ink">{{ totalEnrolled }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5 border border-line flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm text-quiet font-medium">Sessions actives</p>
          <p class="text-2xl font-bold text-primary">
            {{ activeCount }}
            <span class="text-sm text-quiet font-normal">/ {{ cohorts.length }}</span>
          </p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5 border border-line flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm text-quiet font-medium">Sessions terminées</p>
          <p class="text-2xl font-bold text-ink">
            {{ completedCount }}
            <span class="text-sm text-quiet font-normal">/ {{ cohorts.length }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- ================= ÉTATS ================= -->
    <div v-if="isPending" class="text-center text-quiet py-10">Chargement des cohortes…</div>
    <div v-else-if="isError" class="text-center text-red-600 py-10">
      {{ (error as ApiError)?.message ?? 'Impossible de charger les cohortes.' }}
    </div>
    <div v-else-if="cohorts.length === 0" class="text-center text-quiet py-10">
      Aucune cohorte ne correspond à vos critères.
    </div>

    <!-- ================= CARTES DES COHORTES ================= -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="cohort in cohorts"
        :key="cohort.key"
        class="bg-white rounded-xl shadow-sm border border-line overflow-hidden hover:shadow-md transition flex flex-col"
      >
        <!-- En-tête de la carte -->
        <div class="p-5 border-b border-line flex justify-between items-start bg-canvas/50">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
            >
              {{ cohort.code.slice(0, 4) }}
            </div>
            <div>
              <h3 class="font-bold text-ink">{{ cohort.pathway?.name ?? '-' }}</h3>
              <p class="text-xs text-quiet">{{ cohort.session ?? cohort.code }}</p>
            </div>
          </div>
          <span
            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
            :class="statusBadgeClass(cohort.status)"
          >
            {{ statusLabel(cohort.status) }}
          </span>
        </div>

        <!-- Corps de la carte (Effectif, Capacité & Places disponibles) -->
        <div class="p-5 flex-1 space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-quiet font-medium">Effectif / Capacité</span>
              <span class="font-bold text-ink">
                {{ enrolledCount(cohort) }} /
                {{
                  cohort.capacity !== null && cohort.capacity !== undefined
                    ? cohort.capacity
                    : 'Illimitée'
                }}
              </span>
            </div>

            <!-- Jauge de remplissage -->
            <div v-if="cohort.capacity" class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{
                  width: Math.min(100, (enrolledCount(cohort) / cohort.capacity) * 100) + '%',
                }"
              ></div>
            </div>

            <!-- Indicateur places disponibles -->
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-quiet">Places disponibles</span>
              <span
                v-if="availableSeats(cohort) !== null"
                class="font-bold rounded-md px-2 py-0.5"
                :class="
                  (availableSeats(cohort) ?? 0) > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-red-100 text-red-700'
                "
              >
                {{
                  (availableSeats(cohort) ?? 0) > 0 ? `${availableSeats(cohort)} places` : 'Complet'
                }}
              </span>
              <span v-else class="font-bold rounded-md px-2 py-0.5 bg-primary/10 text-primary">
                Illimitées
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-canvas p-2 rounded-lg">
              <p class="text-xs text-quiet mb-0.5">Début</p>
              <p class="font-medium text-ink">{{ formatDate(cohort.starts_at) }}</p>
            </div>
            <div class="bg-canvas p-2 rounded-lg">
              <p class="text-xs text-quiet mb-0.5">Fin</p>
              <p class="font-medium text-ink">{{ formatDate(cohort.ends_at) }}</p>
            </div>
          </div>

          <!-- Phase présentielle tag -->
          <div
            v-if="cohort.offline_starts_at"
            class="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            data-testid="cohort-offline-tag"
          >
            <svg
              class="h-4 w-4 text-emerald-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>Présentiel : dès le {{ formatDate(cohort.offline_starts_at) }}</span>
          </div>
        </div>

        <!-- Pied de la carte -->
        <div
          class="p-4 border-t border-line bg-canvas text-xs text-quiet flex items-center justify-between"
        >
          <span
            >Code : <strong class="font-medium text-ink">{{ cohort.code }}</strong></span
          >
          <span v-if="cohort.name" class="truncate max-w-[150px]">{{ cohort.name }}</span>
        </div>
      </div>
    </div>

    <!-- ================= MODALE CRÉATION DE COHORTE ================= -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      data-testid="create-cohort-modal"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 class="text-lg font-bold text-ink">Créer une nouvelle cohorte</h3>
            <p class="text-xs text-quiet mt-0.5">
              Paramétrez la nouvelle promotion et sa capacité.
            </p>
          </div>
          <button
            @click="closeCreateModal"
            class="rounded-lg p-1.5 text-quiet transition hover:bg-gray-100 hover:text-ink"
            title="Fermer"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submitCreateCohort" class="space-y-4">
          <div
            v-if="createError"
            class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600"
          >
            {{ createError }}
          </div>

          <!-- Filière -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
              Filière *
            </label>
            <select
              v-model="createForm.pathway_key"
              required
              class="app-input w-full"
              data-testid="cohort-pathway-select"
            >
              <option value="" disabled>Sélectionner une filière</option>
              <option v-for="pathway in pathways" :key="pathway.key" :value="pathway.key">
                {{ pathway.name }} ({{ pathway.code }})
              </option>
            </select>
          </div>

          <!-- Code & Nom -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
                Code Cohorte *
              </label>
              <input
                v-model="createForm.code"
                type="text"
                required
                placeholder="Ex : DW-2026-P2"
                class="app-input w-full"
                data-testid="cohort-code-input"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
                Nom de la cohorte *
              </label>
              <input
                v-model="createForm.name"
                type="text"
                required
                placeholder="Ex : Promo Mars 2026"
                class="app-input w-full"
                data-testid="cohort-name-input"
              />
            </div>
          </div>

          <!-- Capacité d'accueil (défaut 100) -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
              Capacité d'accueil *
            </label>
            <input
              v-model.number="createForm.capacity"
              type="number"
              min="1"
              max="100000"
              required
              class="app-input w-full"
              data-testid="cohort-capacity-input"
            />
            <p class="text-[11px] text-quiet mt-1">Pré-rempli à 100 places par défaut.</p>
          </div>

          <!-- Dates en ligne (obligatoires) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
                Date de début (en ligne) *
              </label>
              <input
                v-model="createForm.starts_at"
                type="date"
                required
                class="app-input w-full"
                data-testid="cohort-starts-at-input"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
                Date de fin (en ligne) *
              </label>
              <input
                v-model="createForm.ends_at"
                type="date"
                required
                class="app-input w-full"
                data-testid="cohort-ends-at-input"
              />
            </div>
          </div>

          <!-- Phase présentielle / Ateliers (optionnel) -->
          <div class="rounded-xl border border-line bg-canvas/40 p-3.5 space-y-3">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-ink">
                Phase présentielle / Ateliers (optionnel)
              </h4>
              <p class="text-[11px] text-quiet mt-0.5">
                Généralement après les cours en ligne pour les ateliers pratiques.
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-quiet mb-1">
                  Début cours présentiels
                </label>
                <input
                  v-model="createForm.offline_starts_at"
                  type="date"
                  class="app-input w-full"
                  data-testid="cohort-offline-starts-at-input"
                />
                <p class="text-[10px] text-quiet mt-1">Généralement après les cours en ligne.</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-quiet mb-1">
                  Fin cours présentiels
                </label>
                <input
                  v-model="createForm.offline_ends_at"
                  type="date"
                  class="app-input w-full"
                  data-testid="cohort-offline-ends-at-input"
                />
                <p class="text-[10px] text-quiet mt-1">Non obligatoire.</p>
              </div>
            </div>
          </div>

          <!-- Statut -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-quiet mb-1">
              Statut initial
            </label>
            <select
              v-model="createForm.status"
              class="app-input w-full"
              data-testid="cohort-status-select"
            >
              <option value="open">Ouverte (accepte les inscriptions et draine le standby)</option>
              <option value="planned">Planifiée</option>
            </select>
          </div>

          <!-- Boutons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              @click="closeCreateModal"
              class="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="createMutation.isPending.value"
              class="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary-shade disabled:opacity-50"
              data-testid="btn-submit-create-cohort"
            >
              Créer la cohorte
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { ApiError } from '@/api/http'
import { useCatalogPathways } from '@/features/public/composables/useCatalogPathways'
import {
  useCohorts,
  useCreateCohort,
  type Cohort,
  type CohortListFilters,
} from '../composables/useCohorts'

const filterPathwayKey = ref('')
const filterStatus = ref('')

const filters = computed<CohortListFilters>(() => ({
  pathwayKey: filterPathwayKey.value || undefined,
  status: filterStatus.value || undefined,
}))

const { data, isPending, isError, error } = useCohorts(filters)
const cohorts = computed(() => data.value?.items ?? [])

const { data: pathways } = useCatalogPathways()

const statusOptions = [
  { value: 'planned', label: 'Planifiée' },
  { value: 'open', label: 'Ouverte' },
  { value: 'running', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
]

function statusLabel(status: string): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-primary/10 text-primary'
    case 'open':
    case 'running':
      return 'bg-blue-100 text-blue-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-quiet'
  }
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function enrolledCount(cohort: Cohort): number {
  return cohort.enrolled_count ?? cohort.enrollments_count ?? 0
}

function availableSeats(cohort: Cohort): number | null {
  if (cohort.available_seats !== undefined && cohort.available_seats !== null) {
    return cohort.available_seats
  }
  if (cohort.capacity === null || cohort.capacity === undefined) {
    return null
  }
  return Math.max(0, cohort.capacity - enrolledCount(cohort))
}

const totalEnrolled = computed(() =>
  cohorts.value.reduce((sum, cohort) => sum + enrolledCount(cohort), 0),
)
const activeCount = computed(
  () =>
    cohorts.value.filter((cohort) => cohort.status === 'open' || cohort.status === 'running')
      .length,
)
const completedCount = computed(
  () => cohorts.value.filter((cohort) => cohort.status === 'completed').length,
)

// ==================== CRÉATION DE COHORTE ====================
const isCreateModalOpen = ref(false)
const createError = ref<string | null>(null)
const drainedNotification = ref<string | null>(null)

const createForm = reactive({
  pathway_key: '',
  code: '',
  name: '',
  capacity: 100, // Pre-filled with 100 by default
  starts_at: '',
  ends_at: '',
  offline_starts_at: '',
  offline_ends_at: '',
  status: 'open',
})

const createMutation = useCreateCohort()

watch(
  () => createForm.pathway_key,
  (newPathwayKey) => {
    if (!newPathwayKey) return
    const pathway = pathways.value?.find((p) => p.key === newPathwayKey)
    if (!pathway) return

    const currentYear = new Date().getFullYear()
    const existingCount = cohorts.value.filter((c) => {
      const matchesPathway = c.pathway?.key === newPathwayKey || c.pathway?.code === pathway.code
      if (!matchesPathway) return false

      const yearFromStart = c.starts_at ? new Date(c.starts_at).getFullYear() : null
      const yearFromCreated = c.created_at ? new Date(c.created_at).getFullYear() : null
      const yearInCode = c.code ? c.code.includes(`-${currentYear}-`) : false
      return yearFromStart === currentYear || yearFromCreated === currentYear || yearInCode
    }).length

    const sequence = existingCount + 1
    createForm.code = `${pathway.code}-${currentYear}-C${sequence}`
    createForm.name = `${pathway.name} — Cohorte ${sequence}`
  },
)

function openCreateModal() {
  createForm.pathway_key = ''
  createForm.code = ''
  createForm.name = ''
  createForm.capacity = 100
  createForm.starts_at = ''
  createForm.ends_at = ''
  createForm.offline_starts_at = ''
  createForm.offline_ends_at = ''
  createForm.status = 'open'
  createError.value = null
  isCreateModalOpen.value = true
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  createError.value = null
}

async function submitCreateCohort() {
  if (!createForm.pathway_key || !createForm.code || !createForm.name) {
    createError.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }

  if (
    createForm.capacity === null ||
    createForm.capacity === undefined ||
    isNaN(Number(createForm.capacity)) ||
    Number(createForm.capacity) < 1
  ) {
    createError.value = "La capacité doit être d'au moins 1 place."
    return
  }

  if (!createForm.starts_at || !createForm.ends_at) {
    createError.value = 'Veuillez renseigner les dates de début et de fin en ligne.'
    return
  }

  if (createForm.ends_at < createForm.starts_at) {
    createError.value = 'La date de fin doit être postérieure ou égale à la date de début.'
    return
  }

  if (createForm.offline_starts_at && createForm.offline_starts_at < createForm.starts_at) {
    createError.value =
      'La date de début du présentiel doit être postérieure ou égale à la date de début de la cohorte.'
    return
  }

  if (createForm.offline_ends_at) {
    if (!createForm.offline_starts_at) {
      createError.value =
        'Veuillez renseigner une date de début du présentiel avant la date de fin.'
      return
    }
    if (createForm.offline_ends_at < createForm.offline_starts_at) {
      createError.value =
        'La date de fin du présentiel doit être postérieure ou égale à la date de début du présentiel.'
      return
    }
  }

  createError.value = null

  try {
    const result = await createMutation.mutateAsync({
      pathway_key: createForm.pathway_key,
      code: createForm.code,
      name: createForm.name,
      capacity: createForm.capacity ?? 100,
      starts_at: createForm.starts_at,
      ends_at: createForm.ends_at,
      offline_starts_at: createForm.offline_starts_at || undefined,
      offline_ends_at: createForm.offline_ends_at || undefined,
      status: createForm.status,
    })

    const drained = result.drained_standby_count ?? 0
    drainedNotification.value = `Cohorte créée. ${drained} apprenant(s) en standby ont été automatiquement intégrés.`

    closeCreateModal()
  } catch (err) {
    createError.value = (err as ApiError).displayMessage || 'Impossible de créer la cohorte.'
  }
}
</script>

<style scoped>
/* Tailwind handles the styling */
</style>
