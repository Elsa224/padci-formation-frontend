<template>
  <section class="app-page" aria-labelledby="applications-title">
    <!-- EN-TÊTE -->
    <header class="app-page-header">
      <div>
        <h1 id="applications-title" class="app-page-title">Mes candidatures</h1>
        <p class="app-page-copy">
          Consultez le statut de vos candidatures aux différentes sessions de formation.
        </p>
      </div>
      <div>
        <router-link to="/catalogue" class="app-action-primary">
          Découvrir d'autres filières &rarr;
        </router-link>
      </div>
    </header>

    <!-- ÉTATS DE CHARGEMENT / ERREUR -->
    <div v-if="isPending" class="space-y-4">
      <div v-for="index in 3" :key="index" class="app-panel space-y-4">
        <div class="app-skeleton h-5 w-1/4" />
        <div class="app-skeleton h-7 w-1/2" />
        <div class="app-skeleton h-4 w-3/4" />
      </div>
    </div>
    <div v-else-if="isError" class="app-panel py-12 text-center">
      <p class="font-semibold text-danger-ink">Vos candidatures ne sont pas disponibles.</p>
      <p class="mt-2 text-sm text-quiet">
        {{ (error as ApiError)?.message ?? 'Réessayez dans quelques instants.' }}
      </p>
    </div>
    <div v-else-if="applications.length === 0" class="app-panel p-8 text-center sm:p-12">
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 class="mt-5 text-lg font-bold text-ink">Aucune candidature déposée</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-quiet">
        Vous n'avez pas encore postulé à une formation. Consultez notre catalogue et choisissez une
        session ouverte.
      </p>
      <div class="pt-5">
        <router-link to="/catalogue" class="app-action-primary inline-flex">
          Consulter le catalogue
        </router-link>
      </div>
    </div>

    <!-- LISTE DES CANDIDATURES -->
    <div v-else class="grid gap-4">
      <div
        v-for="app in applications"
        :key="app.key"
        class="app-panel flex flex-col p-5 sm:p-6 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-bold"
              :class="statusClass(app.status)"
            >
              {{ statusLabel(app.status) }}
            </span>
            <span class="text-xs font-semibold text-quiet">{{ app.pathway?.code }}</span>
            <span class="text-xs text-quiet"
              >Soumise le {{ formatDate(app.submitted_at || app.created_at) }}</span
            >
          </div>

          <div>
            <h2 class="text-xl font-bold text-ink">{{ app.pathway?.name }}</h2>
            <p v-if="app.cohort" class="mt-1 text-sm text-quiet">
              Session sélectionnée : <strong class="text-ink">{{ app.cohort.name }}</strong>
              <span class="text-xs">
                du {{ formatDate(app.cohort.starts_at) }} au
                {{ formatDate(app.cohort.ends_at) }}</span
              >
              >
            </p>
          </div>

          <div v-if="app.equipment_review?.declaration" class="space-y-0.5 text-xs text-quiet">
            <p class="font-semibold text-ink">Équipement déclaré</p>
            <p>
              {{
                app.equipment_review.declaration.device_type === 'laptop'
                  ? 'Ordinateur portable'
                  : 'Ordinateur de bureau'
              }}
              · {{ app.equipment_review.declaration.cpu_model }} ·
              {{ app.equipment_review.declaration.ram_gb }} Go RAM
            </p>
          </div>

          <div
            v-if="app.equipment_review"
            class="rounded-xl border border-line bg-canvas px-3.5 py-3 text-xs"
          >
            <p class="font-semibold text-ink">Validation du matériel</p>
            <p :class="equipmentReviewClass(app.equipment_review.status)">
              {{ equipmentReviewLabel(app.equipment_review.status) }}
            </p>
            <p v-if="app.equipment_review.reason" class="mt-1 text-quiet">
              {{ app.equipment_review.reason }}
            </p>
          </div>

          <form
            v-if="app.equipment_review?.status === 'needs_info' && editingEquipmentKey === app.key"
            class="space-y-3 rounded-xl border border-warning-line bg-warning-soft p-4"
            @submit.prevent="respondToEquipment(app)"
          >
            <div>
              <h3 class="text-sm font-bold text-ink">Compléter ma déclaration</h3>
              <p class="mt-1 text-xs text-quiet">
                Mettez à jour les informations demandées puis renvoyez-les à l'équipe de revue.
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="text-xs font-medium text-ink"
                >Type d'appareil
                <select v-model="equipmentForm.device_type" class="app-input mt-1">
                  <option value="laptop">Ordinateur portable</option>
                  <option value="desktop">Ordinateur de bureau</option>
                </select>
              </label>
              <label class="text-xs font-medium text-ink"
                >Processeur
                <input v-model.trim="equipmentForm.cpu_model" required class="app-input mt-1" />
              </label>
              <label class="text-xs font-medium text-ink"
                >RAM (Go)
                <input
                  v-model.number="equipmentForm.ram_gb"
                  required
                  min="1"
                  type="number"
                  class="app-input mt-1"
                />
              </label>
              <label class="text-xs font-medium text-ink"
                >Stockage total (Go)
                <input
                  v-model.number="equipmentForm.storage_total_gb"
                  required
                  min="1"
                  type="number"
                  class="app-input mt-1"
                />
              </label>
              <label class="text-xs font-medium text-ink sm:col-span-2"
                >Système d'exploitation
                <input v-model.trim="equipmentForm.os_name" required class="app-input mt-1" />
              </label>
            </div>
            <p v-if="equipmentResponseError" class="text-xs text-danger-ink" role="alert">
              {{ equipmentResponseError }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                :disabled="equipmentResponseMutation.isPending.value"
                class="app-action-primary text-xs disabled:opacity-60"
              >
                {{
                  equipmentResponseMutation.isPending.value ? 'Envoi…' : 'Renvoyer mes informations'
                }}
              </button>
              <button
                type="button"
                class="app-action-secondary text-xs"
                @click="editingEquipmentKey = null"
              >
                Annuler
              </button>
            </div>
          </form>

          <p
            v-if="app.status === 'rejected' && app.reason"
            class="text-xs font-medium text-danger-ink"
          >
            Motif : {{ app.reason }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3">
          <button
            v-if="app.equipment_review?.status === 'needs_info' && editingEquipmentKey !== app.key"
            class="w-full rounded-xl border border-warning-line px-4 py-2 text-xs font-semibold text-warning-ink transition hover:bg-warning-soft sm:w-auto"
            @click="startEquipmentResponse(app)"
          >
            Compléter les informations
          </button>
          <ConfirmButton
            v-if="
              app.status === 'submitted' || app.status === 'in_review' || app.status === 'standby'
            "
            label="Retirer ma candidature"
            confirm="Confirmer le retrait de votre candidature ?"
            button-class="w-full rounded-xl border border-danger-line px-4 py-2 text-xs font-semibold text-danger-ink transition hover:bg-danger-soft disabled:opacity-50 sm:w-auto"
            @confirm="withdraw(app)"
          />
          <div
            v-if="app.status === 'standby'"
            class="rounded-xl border border-info-line bg-info-soft/70 p-3 text-xs text-info-ink sm:max-w-xs"
          >
            <p class="font-semibold text-info-ink">Liste prioritaire (Standby)</p>
            <p class="mt-1 text-info-ink leading-relaxed">
              Dossier validé avec succès ! Vous êtes sur la liste prioritaire (Standby) et serez
              automatiquement affecté dès l'ouverture de la prochaine session.
            </p>
          </div>
          <p
            v-if="app.status === 'accepted'"
            class="max-w-xs text-center text-xs font-medium text-primary"
          >
            Admission confirmée. Les modalités d'accès à la formation vous seront communiquées par
            l'équipe PADCI.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmButton from '@/features/admin/components/ConfirmButton.vue'
import type { ApiError } from '@/api/http'
import {
  type EquipmentDeclaration,
  useLearnerApplications,
  useRespondToEquipmentReview,
  useWithdrawApplication,
  type LearnerApplication,
} from '../composables/useLearnerApplications'

const { data, isPending, isError, error } = useLearnerApplications()
const applications = computed(() => data.value?.items ?? [])
const editingEquipmentKey = ref<string | null>(null)
const equipmentResponseError = ref<string | null>(null)
const equipmentForm = ref<EquipmentDeclaration>({
  device_type: 'laptop',
  cpu_model: '',
  ram_gb: 8,
  storage_total_gb: 256,
  os_name: '',
})
const equipmentResponseMutation = useRespondToEquipmentReview()

const statusMap: Record<string, { label: string; class: string }> = {
  submitted: { label: 'Soumise, en attente d’examen', class: 'bg-info-soft text-info-ink' },
  in_review: { label: 'En cours d’examen', class: 'bg-warning-soft text-warning-ink' },
  accepted: { label: 'Candidature acceptée', class: 'bg-primary/10 text-primary' },
  standby: {
    label: 'En attente de cohorte (Standby)',
    class: 'bg-info-soft text-info-ink border border-info-line',
  },
  waitlisted: { label: 'Sur liste d’attente', class: 'bg-forest-soft text-forest' },
  rejected: { label: 'Non retenue', class: 'bg-danger-soft text-danger-ink' },
  withdrawn: { label: 'Candidature retirée', class: 'bg-canvas text-body' },
}

function statusLabel(status: string): string {
  return statusMap[status]?.label ?? status
}

function statusClass(status: string): string {
  return statusMap[status]?.class ?? 'bg-canvas text-body'
}

function equipmentReviewLabel(status: string): string {
  const labels: Record<string, string> = {
    not_required: 'Aucune validation matérielle requise',
    pending: 'Déclaration en attente de validation',
    needs_info: 'Informations complémentaires demandées',
    approved: 'Matériel validé',
    rejected: 'Matériel non validé',
  }
  return labels[status] ?? status
}

function equipmentReviewClass(status: string): string {
  const classes: Record<string, string> = {
    not_required: 'text-quiet',
    pending: 'text-warning-ink',
    needs_info: 'text-warning-ink',
    approved: 'text-primary-shade',
    rejected: 'text-danger-ink',
  }
  return classes[status] ?? 'text-quiet'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'date à confirmer'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const withdrawMutation = useWithdrawApplication()

function startEquipmentResponse(application: LearnerApplication) {
  const declaration = application.equipment_review?.declaration
  if (!declaration) return

  equipmentForm.value = { ...declaration }
  equipmentResponseError.value = null
  editingEquipmentKey.value = application.key
}

function respondToEquipment(application: LearnerApplication) {
  equipmentResponseError.value = null
  equipmentResponseMutation.mutate(
    { applicationKey: application.key, equipment: equipmentForm.value },
    {
      onSuccess: () => {
        editingEquipmentKey.value = null
      },
      onError: (error) => {
        equipmentResponseError.value = (error as ApiError).displayMessage
      },
    },
  )
}

function withdraw(app: LearnerApplication) {
  withdrawMutation.mutate(app.key)
}
</script>
