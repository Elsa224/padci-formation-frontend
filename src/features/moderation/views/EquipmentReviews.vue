<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Vérification du matériel</h1>
        <p class="app-page-copy">
          Examinez les équipements déclarés au regard des exigences de la filière.
        </p>
      </div>
    </header>
    <div class="app-panel space-y-5">
      <QueueTabs v-model="status" :tabs="tabs" label="Statut des dossiers" />
      <p class="text-sm text-quiet">
        Vous vérifiez le matériel. La décision d'admission reste réservée à l'administration.
      </p>
      <div v-if="query.isPending.value" class="space-y-3" aria-label="Chargement">
        <div v-for="n in 3" :key="n" class="app-skeleton h-24" />
      </div>
      <div v-else-if="query.isError.value" class="app-alert app-alert-danger" role="alert">
        {{ message(query.error.value) }}
        <button class="underline" @click="query.refetch()">Réessayer</button>
      </div>
      <EmptyState
        v-else-if="!query.data.value?.items.length"
        :title="emptyTitle"
        description="Les dossiers apparaissent ici quand un candidat déclare son matériel."
      />
      <div v-else class="space-y-3">
        <article
          v-for="review in query.data.value?.items"
          :key="review.key"
          class="rounded-xl border p-4 transition sm:p-5"
          :class="selected?.key === review.key ? 'border-primary/40 bg-mint/30' : 'border-line'"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold text-primary">
                {{ review.pathway?.name ?? 'Filière' }}
              </p>
              <h3 class="mt-1 font-bold text-ink">
                {{ review.application?.candidate?.name ?? 'Candidat' }}
              </h3>
              <span class="app-chip mt-2" :class="chipClass(review.status)">{{
                label(review.status)
              }}</span>
            </div>
            <button class="app-action-secondary" @click="select(review)">
              {{ selected?.key === review.key ? 'Fermer' : 'Examiner' }}
            </button>
          </div>
          <div v-if="selected?.key === review.key" class="mt-5 space-y-5 border-t border-line pt-5">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl bg-canvas p-4">
                <h4 class="font-bold text-ink">Matériel déclaré</h4>
                <dl class="mt-3 space-y-2 text-sm">
                  <div
                    v-for="field in declarationFields"
                    :key="field.key"
                    class="flex justify-between gap-3"
                  >
                    <dt class="text-quiet">{{ field.label }}</dt>
                    <dd class="text-right font-medium text-ink">
                      {{ display(review.declaration?.[field.key]) }}
                    </dd>
                  </div>
                </dl>
              </div>
              <div class="rounded-xl bg-canvas p-4">
                <h4 class="font-bold text-ink">Exigences de la filière</h4>
                <dl class="mt-3 space-y-2 text-sm">
                  <div
                    v-for="field in requirementFields"
                    :key="field.key"
                    class="flex justify-between gap-3"
                  >
                    <dt class="text-quiet">{{ field.label }}</dt>
                    <dd class="text-right font-medium text-ink">
                      {{ display(review.requirements_snapshot?.[field.key]) }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <p v-if="review.reason" class="text-sm text-quiet">Motif : {{ review.reason }}</p>
            <form
              v-if="review.status === 'pending'"
              class="sticky bottom-4 z-10 space-y-3 rounded-xl border border-line bg-white p-4 shadow-raised"
              @submit.prevent="decide(review, 'approved')"
            >
              <label class="block text-sm font-semibold text-ink" :for="`reason-${review.key}`">
                Message au candidat
                <span class="font-normal text-quiet">(obligatoire sauf validation)</span>
              </label>
              <textarea
                :id="`reason-${review.key}`"
                v-model.trim="reason"
                class="app-input"
                rows="3"
                maxlength="2000"
                placeholder="Ex. : la RAM déclarée est inférieure au minimum de la filière."
              />
              <p v-if="actionError" role="alert" class="text-sm text-danger-ink">
                {{ actionError }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="submit"
                  class="app-action-primary"
                  :disabled="mutation.isPending.value"
                >
                  {{ pending === 'approved' ? 'Validation…' : 'Valider le matériel' }}
                </button>
                <button
                  type="button"
                  class="app-action-secondary"
                  :disabled="mutation.isPending.value"
                  @click="decide(review, 'needs_info')"
                >
                  {{ pending === 'needs_info' ? 'Envoi…' : 'Demander un complément' }}
                </button>
                <button
                  type="button"
                  class="app-action-secondary text-danger-ink hover:border-danger-line hover:bg-danger-soft"
                  :disabled="mutation.isPending.value"
                  @click="decide(review, 'rejected')"
                >
                  {{ pending === 'rejected' ? 'Refus…' : 'Refuser' }}
                </button>
              </div>
            </form>
          </div>
        </article>
      </div>
      <nav
        v-if="query.data.value?.pagination && (query.data.value.pagination.last_page ?? 1) > 1"
        class="flex items-center justify-end gap-3"
        aria-label="Pagination"
      >
        <button class="app-action-secondary" :disabled="page <= 1" @click="page--">Précédent</button
        ><span class="text-sm text-quiet"
          >{{ page }} / {{ query.data.value.pagination.last_page }}</span
        ><button
          class="app-action-secondary"
          :disabled="page >= (query.data.value.pagination.last_page ?? 1)"
          @click="page++"
        >
          Suivant
        </button>
      </nav>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/app/EmptyState.vue'
import QueueTabs from '@/components/app/QueueTabs.vue'
import { useEquipmentStatusCounts } from '../composables/useModerationQueues'
import { apiMeta, ApiError, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'
interface Review {
  key: string
  status: string
  reason: string | null
  declaration: Record<string, unknown> | null
  requirements_snapshot: Record<string, unknown> | null
  application?: { candidate?: { name: string } }
  pathway?: { name: string }
}
type Decision = 'approved' | 'needs_info' | 'rejected'
const STATUSES = [
  { value: 'pending', label: 'À examiner', empty: 'Aucun dossier à examiner', urgent: true },
  { value: 'needs_info', label: 'Complément demandé', empty: 'Aucun complément en attente' },
  { value: 'approved', label: 'Validés', empty: 'Aucun dossier validé' },
  { value: 'rejected', label: 'Refusés', empty: 'Aucun dossier refusé' },
] as const
const route = useRoute()
const router = useRouter()
const initialStatus = String(route.query.statut ?? '')
const status = ref<string>(
  STATUSES.some((s) => s.value === initialStatus) ? initialStatus : 'pending',
)
const page = ref(1)
const selected = ref<Review | null>(null)
const reason = ref('')
const actionError = ref('')
const pending = ref<Decision | null>(null)
const client = useQueryClient()
const counts = useEquipmentStatusCounts(STATUSES.map((s) => s.value))
const tabs = computed(() =>
  STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
    count: counts.data.value?.[s.value] ?? null,
    urgent: 'urgent' in s && s.urgent,
  })),
)
const emptyTitle = computed(
  () => STATUSES.find((s) => s.value === status.value)?.empty ?? 'Aucun dossier',
)
watch(status, (value) => {
  page.value = 1
  selected.value = null
  void router.replace({ query: { ...route.query, statut: value, cle: undefined } })
})
const query = useQuery({
  queryKey: computed(() => ['moderation-equipment', status.value, page.value]),
  queryFn: async () => {
    const response = await http.get<Review[]>('/moderation/equipment-reviews', {
      params: { status: status.value || undefined, page: page.value },
    })
    return {
      items: response.data,
      pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
    }
  },
})
// Arrivée depuis le tableau de bord (?cle=…) : ouvrir directement ce dossier.
watch(
  () => query.data.value?.items,
  (items) => {
    const key = route.query.cle
    if (!key || selected.value) return
    const match = items?.find((review) => review.key === key)
    if (match) select(match)
  },
  { immediate: true },
)
const mutation = useMutation({
  mutationFn: async ({ review, decision }: { review: Review; decision: Decision }) =>
    http.post(`/moderation/equipment-reviews/${review.key}/decide`, {
      decision,
      reason: reason.value || null,
    }),
  onSuccess: (_data, { review, decision }) => {
    const who = review.application?.candidate?.name ?? 'Le candidat'
    toast.success(
      decision === 'approved'
        ? `Matériel de ${who} validé.`
        : decision === 'needs_info'
          ? `Complément demandé à ${who}.`
          : `Matériel de ${who} refusé.`,
    )
    selected.value = null
    reason.value = ''
    void client.invalidateQueries({ queryKey: ['moderation-equipment'] })
  },
  onSettled: () => {
    pending.value = null
  },
})
function select(review: Review) {
  selected.value = selected.value?.key === review.key ? null : review
  reason.value = ''
  actionError.value = ''
}
function decide(review: Review, decision: Decision) {
  actionError.value = ''
  if (decision !== 'approved' && !reason.value) {
    actionError.value = 'Expliquez au candidat ce qui manque ou ne convient pas.'
    return
  }
  pending.value = decision
  mutation.mutate(
    { review, decision },
    {
      onError: (error) => {
        actionError.value = message(error)
      },
    },
  )
}
function chipClass(value: string) {
  return (
    (
      {
        pending: 'app-chip-savane',
        needs_info: 'app-chip-info',
        approved: 'app-chip-leaf',
        rejected: 'app-chip-danger',
      } as Record<string, string>
    )[value] ?? 'app-chip-neutral'
  )
}
function message(error: unknown) {
  return error instanceof ApiError
    ? error.displayMessage
    : 'Impossible de charger les informations.'
}
function label(value: string) {
  return (
    (
      {
        pending: 'À examiner',
        needs_info: 'Complément demandé',
        approved: 'Validé',
        rejected: 'Refusé',
        not_required: 'Non requis',
      } as Record<string, string>
    )[value] ?? value
  )
}
function display(value: unknown) {
  return value === null || value === undefined || value === ''
    ? 'Non précisé'
    : typeof value === 'boolean'
      ? value
        ? 'Oui'
        : 'Non'
      : String(value)
}
const declarationFields = [
  { key: 'device_type', label: 'Appareil' },
  { key: 'cpu_model', label: 'Processeur' },
  { key: 'ram_gb', label: 'RAM (Go)' },
  { key: 'storage_total_gb', label: 'Stockage (Go)' },
  { key: 'os_name', label: 'Système' },
  { key: 'virtualization_supported', label: 'Virtualisation' },
  { key: 'notes', label: 'Notes' },
]
const requirementFields = [
  { key: 'min_cpu', label: 'Processeur' },
  { key: 'min_ram_gb', label: 'RAM minimale (Go)' },
  { key: 'min_storage_gb', label: 'Stockage minimal (Go)' },
  { key: 'notes', label: 'Notes' },
]
</script>
