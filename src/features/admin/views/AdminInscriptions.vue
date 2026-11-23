<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Inscriptions</h1>
        <p class="app-page-copy">
          Suspendre, rétablir, révoquer ou clôturer l'accès d'un apprenant à un cours. Chaque action
          est tracée dans le journal d'audit.
        </p>
      </div>
    </header>

    <div class="app-panel space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <QueueTabs v-model="filters.status" :tabs="statusTabs" label="Statut des inscriptions" />
        <label class="relative block lg:w-72">
          <span class="sr-only">Rechercher un apprenant</span>
          <SearchIcon
            class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-quiet"
            aria-hidden="true"
          />
          <input
            id="enrollment-search"
            v-model.trim="search"
            type="search"
            class="app-input pl-9"
            placeholder="Nom ou e-mail"
          />
        </label>
      </div>

      <p v-if="error" class="app-alert app-alert-danger" role="alert">
        {{ error }}
      </p>

      <div v-if="enrollments.isPending.value" class="app-skeleton h-40" />
      <EmptyState
        v-else-if="!enrollments.data.value?.items.length"
        title="Aucune inscription"
        :description="
          filters.q || filters.status
            ? 'Aucune inscription ne correspond à ces critères.'
            : 'Les inscriptions apparaissent quand une candidature est acceptée.'
        "
      />
      <div v-else class="-mx-6 overflow-x-auto border-t border-line">
        <table class="w-full min-w-[52rem] text-left text-sm">
          <thead class="app-thead">
            <tr>
              <th class="py-3 pr-3 pl-6">Apprenant</th>
              <th class="px-3 py-3">Cours</th>
              <th class="px-3 py-3">Cohorte</th>
              <th class="px-3 py-3">Statut</th>
              <th class="py-3 pr-6 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="enrollment in enrollments.data.value.items"
              :key="enrollment.key"
              class="border-t border-line align-top"
              data-test="enrollment-row"
            >
              <td class="py-3 pr-3 pl-6">
                <p class="font-semibold text-ink">{{ enrollment.user?.name }}</p>
                <p class="text-xs text-quiet">{{ enrollment.user?.email }}</p>
              </td>
              <td class="px-3 py-3">{{ enrollment.course?.title ?? '-' }}</td>
              <td class="px-3 py-3">{{ enrollment.cohort?.name ?? '-' }}</td>
              <td class="px-3 py-3">
                <span class="app-chip" :class="tone(enrollment.status)">
                  {{ enrollmentStatusLabels[enrollment.status] ?? enrollment.status }}
                </span>
              </td>
              <td class="py-3 pr-6 pl-3 text-right">
                <form
                  v-if="pending?.key === enrollment.key"
                  class="ml-auto flex max-w-sm flex-col gap-2"
                  data-test="action-form"
                  @submit.prevent="confirmAction"
                >
                  <input
                    v-if="needsReason(pending.action)"
                    :id="`reason-${enrollment.key}`"
                    v-model.trim="reason"
                    class="app-input"
                    :placeholder="
                      pending.action === 'revoke' ? 'Motif de la révocation' : 'Motif (facultatif)'
                    "
                    :required="pending.action === 'revoke'"
                  />
                  <span class="flex justify-end gap-2">
                    <button type="button" class="app-action-secondary" @click="pending = null">
                      Annuler
                    </button>
                    <button
                      class="app-action-primary"
                      :disabled="action.isPending.value"
                      :aria-busy="action.isPending.value"
                      data-test="confirm-action"
                    >
                      {{ actionLabels[pending.action] }}
                    </button>
                  </span>
                </form>
                <span v-else class="flex flex-wrap justify-end gap-1.5">
                  <button
                    v-for="available in actionsFor(enrollment.status)"
                    :key="available"
                    type="button"
                    class="rounded-lg border px-2.5 py-1 text-xs font-semibold transition"
                    :class="
                      available === 'revoke'
                        ? 'border-danger-line text-danger-ink hover:bg-danger-soft'
                        : 'border-line-strong text-ink hover:border-primary/40 hover:bg-mint'
                    "
                    :data-test="`action-${available}`"
                    @click="ask(enrollment.key, available)"
                  >
                    {{ actionLabels[available] }}
                  </button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav
        v-if="lastPage > 1"
        class="flex items-center justify-between text-sm"
        aria-label="Pagination des inscriptions"
      >
        <button class="app-action-secondary" :disabled="filters.page <= 1" @click="filters.page--">
          Précédent
        </button>
        <span class="text-quiet">Page {{ filters.page }} sur {{ lastPage }}</span>
        <button
          class="app-action-secondary"
          :disabled="filters.page >= lastPage"
          @click="filters.page++"
        >
          Suivant
        </button>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { Search as SearchIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/app/EmptyState.vue'
import QueueTabs from '@/components/app/QueueTabs.vue'
import {
  apiMessage,
  enrollmentStatusLabels,
  useAdminEnrollments,
  useEnrollmentAction,
  type EnrollmentAction,
  type EnrollmentStatus,
} from '../composables/useAdminOperations'

const filters = reactive({ status: '', q: '', page: 1 })
const search = ref('')
const enrollments = useAdminEnrollments(computed(() => ({ ...filters })))
const action = useEnrollmentAction()
const lastPage = computed(() => enrollments.data.value?.pagination?.last_page ?? 1)
watch(
  () => filters.status,
  () => {
    filters.page = 1
  },
)

// Recherche en direct (sans bouton « Filtrer »), après une courte pause de frappe.
const searchDebounced = refDebounced(search, 350)
watch(searchDebounced, (value) => {
  filters.q = value
  filters.page = 1
})

const statusTabs = [
  { value: '', label: 'Toutes' },
  { value: 'active', label: 'Actives' },
  { value: 'suspended', label: 'Suspendues' },
  { value: 'completed', label: 'Terminées' },
  { value: 'revoked', label: 'Révoquées' },
]

const actionLabels: Record<EnrollmentAction, string> = {
  suspend: 'Suspendre',
  reinstate: 'Rétablir',
  revoke: 'Révoquer',
  complete: 'Marquer terminée',
}

/** Transitions allowed by EnrollmentWorkflow. */
function actionsFor(status: EnrollmentStatus): EnrollmentAction[] {
  if (status === 'active') return ['complete', 'suspend', 'revoke']
  if (status === 'suspended') return ['reinstate', 'revoke']
  return []
}

function needsReason(value: EnrollmentAction) {
  return value === 'suspend' || value === 'revoke'
}

function tone(status: EnrollmentStatus) {
  return status === 'active'
    ? 'app-chip-leaf'
    : status === 'suspended'
      ? 'app-chip-warning'
      : status === 'revoked'
        ? 'app-chip-danger'
        : 'app-chip-neutral'
}

const pending = ref<{ key: string; action: EnrollmentAction } | null>(null)
const reason = ref('')
const error = ref('')

function ask(key: string, value: EnrollmentAction) {
  pending.value = { key, action: value }
  reason.value = ''
  error.value = ''
}

async function confirmAction() {
  const current = pending.value
  if (!current) return
  try {
    await action.mutateAsync({ key: current.key, action: current.action, reason: reason.value })
    toast.success('Inscription mise à jour.')
    pending.value = null
  } catch (err) {
    error.value = apiMessage(err, "L'action n'a pas pu être appliquée.")
  }
}
</script>
