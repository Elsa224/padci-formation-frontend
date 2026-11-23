<template>
  <div class="app-page">
    <!-- EN-TÊTE -->
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Gestion des Accès</h1>
        <p class="app-page-copy">Rôles, permissions et invitations de la plateforme.</p>
      </div>

      <div class="flex items-center gap-3">
        <button type="button" @click="showInviteModal = true" class="app-action-primary">
          <UserPlusIcon class="w-4 h-4" />
          <span>Inviter un collaborateur</span>
        </button>
      </div>
    </header>

    <!-- ONGLETS DE NAVIGATION -->
    <div class="flex items-center gap-2 border-b border-line pb-px">
      <button
        type="button"
        @click="activeTab = 'users'"
        class="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors -mb-px cursor-pointer"
        :class="
          activeTab === 'users'
            ? 'border-primary text-primary'
            : 'border-transparent text-quiet hover:text-ink'
        "
      >
        <UsersRoundIcon class="w-4 h-4" />
        <span>Comptes Actifs</span>
        <span
          v-if="pagination?.total !== undefined"
          class="px-2 py-0.5 rounded-full text-[11px]"
          :class="activeTab === 'users' ? 'bg-primary/10 text-primary' : 'bg-canvas text-quiet'"
        >
          {{ pagination.total }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'invitations'"
        class="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors -mb-px cursor-pointer"
        :class="
          activeTab === 'invitations'
            ? 'border-primary text-primary'
            : 'border-transparent text-quiet hover:text-ink'
        "
      >
        <MailIcon class="w-4 h-4" />
        <span>Invitations en attente</span>
        <span
          v-if="pendingInvitations.length > 0"
          class="px-2 py-0.5 rounded-full text-[11px] font-bold"
          :class="
            activeTab === 'invitations' ? 'bg-primary text-white' : 'bg-savane-soft text-savane-ink'
          "
        >
          {{ pendingInvitations.length }}
        </span>
      </button>
    </div>

    <!-- ── VUE 1 : UTILISATEURS ACTIFS ─────────────────────────────────── -->
    <div v-if="activeTab === 'users'" class="space-y-6">
      <!-- FILTRES -->
      <div class="bg-white rounded-xl shadow-sm border border-line p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <SearchIcon class="w-5 h-5 text-quiet absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un nom, un email..."
              class="app-input w-full pl-10 pr-4"
            />
          </div>
          <select v-model="filterRole" class="app-input md:w-56">
            <option value="">Tous les rôles</option>
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
              {{ role.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- TABLEAU DES UTILISATEURS -->
      <div class="overflow-hidden rounded-[18px] border border-line bg-white shadow-panel">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="app-thead border-b border-line">
                <th class="py-4 px-6">Utilisateur</th>
                <th class="py-4 px-6">Rôle</th>
                <th class="py-4 px-6">Statut</th>
                <th class="py-4 px-6">Dernière connexion</th>
                <th class="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line text-sm">
              <tr v-if="isPending">
                <td colspan="5" class="py-10 text-center text-quiet">
                  Chargement des utilisateurs…
                </td>
              </tr>
              <tr v-else-if="isError">
                <td colspan="5" class="py-10 text-center text-danger-ink">
                  {{ (error as ApiError)?.message ?? 'Impossible de charger les utilisateurs.' }}
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="5" class="py-10 text-center text-quiet">
                  Aucun utilisateur ne correspond à vos critères.
                </td>
              </tr>

              <tr v-for="user in users" :key="user.key" class="hover:bg-canvas transition">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
                      :class="roleColors(primaryRole(user)).bg"
                    >
                      <span :class="roleColors(primaryRole(user)).text">{{
                        initialsOf(user.name)
                      }}</span>
                    </div>
                    <div>
                      <p class="font-bold text-ink">{{ user.name }}</p>
                      <p class="text-xs text-quiet">{{ user.email }}</p>
                    </div>
                  </div>
                </td>

                <td class="py-4 px-6">
                  <select
                    :value="primaryRole(user)"
                    :disabled="isSelf(user) || rowMutating(user.key)"
                    @change="
                      changeRole(user, ($event.target as HTMLSelectElement).value as AppRole)
                    "
                    class="px-2.5 py-1.5 rounded-md text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    :class="[roleColors(primaryRole(user)).bg, roleColors(primaryRole(user)).text]"
                  >
                    <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                      {{ role.label }}
                    </option>
                  </select>
                </td>

                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    :class="user.is_active ? 'bg-mint text-primary-shade' : 'bg-canvas text-quiet'"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="user.is_active ? 'bg-primary' : 'bg-quiet'"
                    ></span>
                    {{ user.is_active ? 'Actif' : 'Désactivé' }}
                  </span>
                </td>

                <td class="py-4 px-6 text-quiet">{{ formatDate(user.last_login_at) }}</td>

                <td class="py-4 px-6 text-center">
                  <span v-if="isSelf(user)" class="text-xs italic text-quiet">(C'est vous)</span>
                  <button
                    v-else
                    @click="toggleActive(user)"
                    :disabled="rowMutating(user.key)"
                    class="text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    :class="
                      user.is_active
                        ? 'text-danger-ink hover:bg-danger-soft'
                        : 'text-primary hover:bg-primary/10'
                    "
                  >
                    {{ user.is_active ? 'Désactiver' : 'Réactiver' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="pagination"
          class="bg-canvas px-6 py-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <span class="text-sm text-quiet">
            Affichage de <span class="font-semibold text-ink">{{ pagination.from ?? 0 }}</span> à
            <span class="font-semibold text-ink">{{ pagination.to ?? 0 }}</span> sur
            <span class="font-semibold text-ink">{{ pagination.total ?? 0 }}</span> utilisateurs
          </span>
          <nav class="inline-flex rounded-md shadow-sm -space-x-px">
            <button
              @click="page > 1 && page--"
              :disabled="page === 1"
              class="px-3 py-2 border border-line bg-white text-quiet rounded-l-md hover:bg-canvas disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeftIcon class="w-5 h-5" />
            </button>
            <span
              class="px-4 py-2 border-t border-b border-line bg-white text-sm font-medium text-ink"
            >
              {{ pagination.current_page }} / {{ pagination.last_page ?? 1 }}
            </span>
            <button
              @click="page < (pagination.last_page ?? 1) && page++"
              :disabled="page === (pagination.last_page ?? 1)"
              class="px-3 py-2 border border-line bg-white text-quiet rounded-r-md hover:bg-canvas disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRightIcon class="w-5 h-5" />
            </button>
          </nav>
        </div>
        <p v-if="actionError" class="px-6 py-3 text-sm text-danger-ink border-t border-line">
          {{ actionError }}
        </p>
      </div>
    </div>

    <!-- ── VUE 2 : INVITATIONS EN ATTENTE ──────────────────────────────── -->
    <div v-else class="space-y-6">
      <div class="overflow-hidden rounded-[18px] border border-line bg-white shadow-panel">
        <div
          class="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h2 class="text-base font-bold text-ink">Invitations en cours de validation</h2>
            <p class="text-xs text-quiet mt-0.5">
              Ces collaborateurs ont reçu un lien valable 72 heures pour configurer leur compte.
            </p>
          </div>
          <button
            type="button"
            @click="showInviteModal = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <UserPlusIcon class="w-3.5 h-3.5" />
            <span>Nouvelle invitation</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="app-thead border-b border-line">
                <th class="py-4 px-6">Destinataire</th>
                <th class="py-4 px-6">Rôle</th>
                <th class="py-4 px-6">Émis par</th>
                <th class="py-4 px-6">Expire dans</th>
                <th class="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line text-sm">
              <tr v-if="isLoadingInvitations">
                <td colspan="5" class="py-10 text-center text-quiet">
                  Chargement des invitations…
                </td>
              </tr>
              <tr v-else-if="pendingInvitations.length === 0">
                <td colspan="5" class="py-12 text-center text-quiet">
                  <div class="flex flex-col items-center justify-center space-y-2">
                    <MailIcon class="w-8 h-8 text-line-strong" />
                    <p class="font-medium text-ink">Aucune invitation en attente</p>
                    <p class="text-xs text-quiet max-w-sm">
                      Tous les collaborateurs invités ont activé leur compte ou aucune invitation
                      n'est active.
                    </p>
                  </div>
                </td>
              </tr>

              <tr
                v-for="inv in pendingInvitations"
                :key="inv.key"
                class="hover:bg-canvas transition"
              >
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-8 h-8 rounded-full bg-canvas flex items-center justify-center text-quiet"
                    >
                      <MailIcon class="w-4 h-4" />
                    </div>
                    <div>
                      <p class="font-bold text-ink">{{ inv.email }}</p>
                      <p class="text-xs text-quiet">
                        Envoyé le {{ formatShortDate(inv.created_at) }}
                      </p>
                    </div>
                  </div>
                </td>

                <td class="py-4 px-6">
                  <span
                    class="px-2.5 py-1 rounded-md text-xs font-bold"
                    :class="[
                      roleColors(inv.role as AppRole).bg,
                      roleColors(inv.role as AppRole).text,
                    ]"
                  >
                    {{ inv.role_label }}
                  </span>
                </td>

                <td class="py-4 px-6 text-quiet text-xs">
                  <span v-if="inv.invited_by" class="font-medium text-ink">
                    {{ inv.invited_by.name }}
                  </span>
                  <span v-else class="italic">Système (CLI)</span>
                </td>

                <td class="py-4 px-6">
                  <span class="app-chip app-chip-warning">
                    <ClockIcon class="w-3 h-3 text-warning" />
                    <span>{{ formatRelativeExpiration(inv.expires_at) }}</span>
                  </span>
                </td>

                <td class="py-4 px-6 text-center">
                  <ConfirmButton
                    label="Révoquer"
                    confirm="Révoquer l'invitation ?"
                    button-class="text-xs font-semibold px-3 py-1.5 rounded-lg text-danger-ink hover:bg-danger-soft transition disabled:opacity-50 cursor-pointer"
                    @confirm="handleRevoke(inv)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL D'INVITATION -->
    <InviteUserModal
      :open="showInviteModal"
      @close="showInviteModal = false"
      @invited="activeTab = 'invitations'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmButton from '@/features/admin/components/ConfirmButton.vue'
import {
  UsersRound as UsersRoundIcon,
  UserPlus as UserPlusIcon,
  Mail as MailIcon,
  Search as SearchIcon,
  Clock as ClockIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import {
  useAdminUsers,
  useUpdateAdminUser,
  type AdminUser,
  type AdminUserListFilters,
  type AppRole,
} from '../composables/useAdminUsers'
import {
  useAdminInvitations,
  useRevokeAdminInvitation,
  type AdminInvitation,
} from '../composables/useAdminInvitations'
import InviteUserModal from '../components/InviteUserModal.vue'

const auth = useAuthStore()

const activeTab = ref<'users' | 'invitations'>('users')
const showInviteModal = ref(false)

const searchQuery = ref('')
const filterRole = ref<AppRole | ''>('')
const page = ref(1)

const filters = computed<AdminUserListFilters>(() => ({
  q: searchQuery.value || undefined,
  role: filterRole.value || undefined,
  page: page.value,
}))

const { data, isPending, isError, error } = useAdminUsers(filters)
const users = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? null)

// Pending invitations query
const statusFilter = ref('pending')
const { data: invitationsData, isPending: isLoadingInvitations } = useAdminInvitations(statusFilter)
const pendingInvitations = computed(() => invitationsData.value?.items ?? [])

const revokeMutation = useRevokeAdminInvitation()
const revokingKey = ref<string | null>(null)

async function handleRevoke(inv: AdminInvitation) {
  revokingKey.value = inv.key
  try {
    await revokeMutation.mutateAsync(inv.key)
  } finally {
    revokingKey.value = null
  }
}

const roleOptions: { value: AppRole; label: string }[] = [
  { value: 'super_admin', label: 'Super administrateur' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'moderateur', label: 'Modérateur' },
  { value: 'formateur', label: 'Formateur' },
  { value: 'apprenant', label: 'Apprenant' },
]

function primaryRole(user: AdminUser): AppRole {
  return user.roles[0] ?? 'apprenant'
}

function roleColors(role: AppRole): { bg: string; text: string } {
  switch (role) {
    case 'super_admin':
      return { bg: 'bg-savane-soft', text: 'text-savane-ink' }
    case 'admin':
      return { bg: 'bg-info-soft', text: 'text-info-ink' }
    case 'moderateur':
      return { bg: 'bg-forest-soft', text: 'text-forest' }
    case 'formateur':
      return { bg: 'bg-mint', text: 'text-primary-shade' }
    default:
      return { bg: 'bg-canvas', text: 'text-quiet' }
  }
}

function isSelf(user: AdminUser): boolean {
  return user.key === auth.user?.key
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(value: string | null): string {
  if (!value) return 'Jamais connecté'
  return new Date(value).toLocaleString('fr-FR')
}

function formatShortDate(value: string): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeExpiration(iso: string): string {
  if (!iso) return ''
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Expirée'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `dans ${days}j ${remainingHours}h`
  }
  return `dans ${hours}h`
}

const updateMutation = useUpdateAdminUser()
const mutatingKey = ref<string | null>(null)
const actionError = ref<string | null>(null)

function rowMutating(key: string): boolean {
  return mutatingKey.value === key
}

function changeRole(user: AdminUser, role: AppRole) {
  if (role === primaryRole(user)) return
  actionError.value = null
  mutatingKey.value = user.key
  updateMutation.mutate(
    { key: user.key, role },
    {
      onError: (mutationError) => {
        actionError.value = (mutationError as ApiError).displayMessage
      },
      onSettled: () => {
        mutatingKey.value = null
      },
    },
  )
}

function toggleActive(user: AdminUser) {
  actionError.value = null
  mutatingKey.value = user.key
  updateMutation.mutate(
    { key: user.key, is_active: !user.is_active },
    {
      onError: (mutationError) => {
        actionError.value = (mutationError as ApiError).displayMessage
      },
      onSettled: () => {
        mutatingKey.value = null
      },
    },
  )
}
</script>
