<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Journal d'audit</h1>
        <p class="app-page-copy">
          Actions sensibles et connexions, en lecture seule. Les entrées ne peuvent être ni
          modifiées ni supprimées.
        </p>
      </div>
    </header>

    <div class="flex gap-2" role="tablist" aria-label="Type de journal">
      <button
        v-for="item in tabs"
        :key="item.id"
        role="tab"
        :aria-selected="tab === item.id"
        class="rounded-xl px-4 py-2 text-sm font-semibold"
        :class="tab === item.id ? 'bg-primary text-white' : 'bg-white text-quiet hover:text-ink'"
        :data-test="`tab-${item.id}`"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- Actions -->
    <div v-if="tab === 'audit'" class="app-panel space-y-4" role="tabpanel">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="auditFilters.page = 1">
        <label class="text-sm font-semibold text-ink">
          Action
          <input
            id="audit-action"
            v-model.trim="auditDraft.action"
            class="app-input mt-1"
            placeholder="Ex : course.published"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Du
          <input id="audit-from" v-model="auditDraft.from" class="app-input mt-1" type="date" />
        </label>
        <label class="text-sm font-semibold text-ink">
          Au
          <input id="audit-to" v-model="auditDraft.to" class="app-input mt-1" type="date" />
        </label>
        <button
          class="app-action-secondary"
          @click="Object.assign(auditFilters, auditDraft, { page: 1 })"
        >
          Filtrer
        </button>
      </form>
      <div v-if="audit.isPending.value" class="app-skeleton h-40" />
      <p v-else-if="audit.isError.value" class="text-sm text-red-700" role="alert">
        {{ apiMessage(audit.error.value, 'Journal indisponible pour votre compte.') }}
      </p>
      <p
        v-else-if="!audit.data.value?.items.length"
        class="rounded-xl bg-canvas p-5 text-sm text-quiet"
      >
        Aucune entrée pour ces critères.
      </p>
      <div v-else class="overflow-x-auto rounded-xl border border-line">
        <table class="w-full min-w-[48rem] text-left text-sm">
          <thead class="app-thead">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Action</th>
              <th class="px-3 py-2">Par</th>
              <th class="px-3 py-2">Cible</th>
              <th class="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in audit.data.value.items"
              :key="entry.key"
              class="border-t border-line"
              data-test="audit-row"
            >
              <td class="whitespace-nowrap px-3 py-2 tabular-nums">
                {{ formatDateTime(entry.created_at) }}
              </td>
              <td class="px-3 py-2 font-mono text-xs">{{ entry.action }}</td>
              <td class="px-3 py-2">{{ entry.actor?.name ?? 'Système' }}</td>
              <td class="px-3 py-2 text-xs text-quiet">
                {{ entry.target_type ?? '' }}
                <span class="font-mono">{{ entry.target_key ?? '' }}</span>
              </td>
              <td class="px-3 py-2 font-mono text-xs text-quiet">{{ entry.ip ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationNav
        v-model:page="auditFilters.page"
        :last-page="audit.data.value?.pagination?.last_page ?? 1"
      />
    </div>

    <!-- Connexions -->
    <div v-else class="app-panel space-y-4" role="tabpanel">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent>
        <label class="text-sm font-semibold text-ink">
          E-mail
          <input id="auth-email" v-model.trim="authDraft.email" class="app-input mt-1" />
        </label>
        <label class="text-sm font-semibold text-ink">
          Événement
          <input
            id="auth-event"
            v-model.trim="authDraft.event"
            class="app-input mt-1"
            placeholder="Ex : login_failed"
          />
        </label>
        <button
          class="app-action-secondary"
          @click="Object.assign(authFilters, authDraft, { page: 1 })"
        >
          Filtrer
        </button>
      </form>
      <div v-if="auth.isPending.value" class="app-skeleton h-40" />
      <p v-else-if="auth.isError.value" class="text-sm text-red-700" role="alert">
        {{ apiMessage(auth.error.value, 'Journal indisponible pour votre compte.') }}
      </p>
      <p
        v-else-if="!auth.data.value?.items.length"
        class="rounded-xl bg-canvas p-5 text-sm text-quiet"
      >
        Aucun événement pour ces critères.
      </p>
      <div v-else class="overflow-x-auto rounded-xl border border-line">
        <table class="w-full min-w-[44rem] text-left text-sm">
          <thead class="app-thead">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Événement</th>
              <th class="px-3 py-2">E-mail</th>
              <th class="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in auth.data.value.items"
              :key="entry.key"
              class="border-t border-line"
              data-test="auth-row"
            >
              <td class="whitespace-nowrap px-3 py-2 tabular-nums">
                {{ formatDateTime(entry.created_at) }}
              </td>
              <td class="px-3 py-2 font-mono text-xs">{{ entry.event }}</td>
              <td class="px-3 py-2">{{ entry.email ?? '—' }}</td>
              <td class="px-3 py-2 font-mono text-xs text-quiet">{{ entry.ip ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationNav
        v-model:page="authFilters.page"
        :last-page="auth.data.value?.pagination?.last_page ?? 1"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PaginationNav from '../components/PaginationNav.vue'
import {
  apiMessage,
  formatDateTime,
  useAuditLogs,
  useAuthEvents,
} from '../composables/useAdminOperations'

const tabs = [
  { id: 'audit', label: 'Actions' },
  { id: 'auth', label: 'Connexions' },
] as const
const tab = ref<'audit' | 'auth'>('audit')

const auditDraft = reactive({ action: '', from: '', to: '' })
const auditFilters = reactive({ action: '', from: '', to: '', page: 1 })
const audit = useAuditLogs(computed(() => ({ ...auditFilters })))

const authDraft = reactive({ email: '', event: '' })
const authFilters = reactive({ email: '', event: '', page: 1 })
const auth = useAuthEvents(computed(() => ({ ...authFilters })))
</script>
