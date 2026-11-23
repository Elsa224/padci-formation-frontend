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
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="filters.page = 1">
        <label class="text-sm font-semibold text-ink">
          Rechercher
          <input
            id="enrollment-search"
            v-model.trim="search"
            class="app-input mt-1"
            placeholder="Nom ou e-mail"
            @keyup.enter="applySearch"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Statut
          <select id="enrollment-status" v-model="filters.status" class="app-input mt-1">
            <option value="">Tous</option>
            <option v-for="(label, value) in enrollmentStatusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
        <button type="button" class="app-action-secondary" @click="applySearch">Filtrer</button>
      </form>

      <p v-if="error" class="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink" role="alert">
        {{ error }}
      </p>

      <div v-if="enrollments.isPending.value" class="app-skeleton h-40" />
      <p
        v-else-if="!enrollments.data.value?.items.length"
        class="rounded-xl bg-canvas p-6 text-sm text-quiet"
      >
        Aucune inscription pour ces critères.
      </p>
      <div v-else class="overflow-x-auto rounded-xl border border-line">
        <table class="w-full min-w-[52rem] text-left text-sm">
          <thead class="app-thead">
            <tr>
              <th class="px-3 py-2">Apprenant</th>
              <th class="px-3 py-2">Cours</th>
              <th class="px-3 py-2">Cohorte</th>
              <th class="px-3 py-2">Statut</th>
              <th class="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="enrollment in enrollments.data.value.items"
              :key="enrollment.key"
              class="border-t border-line align-top"
              data-test="enrollment-row"
            >
              <td class="px-3 py-2">
                <p class="font-semibold text-ink">{{ enrollment.user?.name }}</p>
                <p class="text-xs text-quiet">{{ enrollment.user?.email }}</p>
              </td>
              <td class="px-3 py-2">{{ enrollment.course?.title ?? '—' }}</td>
              <td class="px-3 py-2">{{ enrollment.cohort?.name ?? '—' }}</td>
              <td class="px-3 py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="tone(enrollment.status)"
                >
                  {{ enrollmentStatusLabels[enrollment.status] ?? enrollment.status }}
                </span>
              </td>
              <td class="px-3 py-2 text-right">
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
                <span v-else class="flex flex-wrap justify-end gap-3 text-xs font-semibold">
                  <button
                    v-for="available in actionsFor(enrollment.status)"
                    :key="available"
                    :class="available === 'revoke' ? 'text-danger-ink' : 'text-primary'"
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
import { toast } from 'vue-sonner'
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

function applySearch() {
  filters.q = search.value
  filters.page = 1
}

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
    ? 'bg-primary/10 text-primary'
    : status === 'suspended'
      ? 'bg-warning-soft text-warning-ink'
      : status === 'revoked'
        ? 'bg-danger-soft text-danger-ink'
        : 'bg-canvas text-quiet'
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
