<template>
  <div class="min-h-screen bg-[#f6f8f7] text-slate-900">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] lg:hidden" @click="isSidebarOpen = false" />

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 transition-transform duration-200 lg:translate-x-0 lg:shadow-none"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-[4.5rem] items-center justify-between border-b border-slate-100 px-5">
        <RouterLink :to="home" class="flex min-w-0 items-center gap-3" @click="isSidebarOpen = false">
          <img :src="padciLogo" alt="PADCI LMS" class="h-9 w-auto object-contain" />
          <span class="truncate text-sm font-bold tracking-tight text-slate-900">PADCI LMS</span>
        </RouterLink>
        <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Fermer le menu" @click="isSidebarOpen = false"><XIcon :size="20" /></button>
      </div>

      <nav class="flex-1 space-y-7 overflow-y-auto px-3 py-5">
        <section v-for="group in navigation" :key="group.label" class="space-y-1.5">
          <p class="px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{{ group.label }}</p>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
            @click="isSidebarOpen = false"
          >
            <component :is="item.icon" :size="18" :stroke-width="isActive(item.to) ? 2.4 : 2" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </section>
        <slot name="sidebar-extra" />
      </nav>

      <div class="m-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">{{ initials }}</div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-slate-800">{{ auth.user?.name ?? 'Utilisateur' }}</p>
          <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
        </div>
        <button type="button" class="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-red-700" aria-label="Se déconnecter" title="Se déconnecter" @click="handleLogout"><LogOutIcon :size="18" /></button>
      </div>
    </aside>

    <div class="min-h-screen lg:pl-64">
      <header class="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <div class="flex min-w-0 items-center gap-3">
          <button class="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Ouvrir le menu" @click="isSidebarOpen = true"><MenuIcon :size="21" /></button>
          <div class="min-w-0">
            <p class="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-primary sm:block">{{ workspace }}</p>
            <h1 class="truncate text-base font-bold text-slate-900 sm:text-lg">{{ title }}</h1>
          </div>
        </div>
        <div ref="toolbar" class="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
          <slot name="header-actions" />

          <button
            type="button"
            class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            :class="isNotificationsOpen ? 'bg-primary/10 text-primary' : ''"
            aria-label="Notifications"
            :aria-expanded="isNotificationsOpen"
            aria-haspopup="menu"
            @click="toggleNotifications"
          >
            <BellIcon :size="19" :stroke-width="2" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="inline-flex h-10 max-w-48 items-center gap-2 rounded-xl px-1.5 pr-2 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            :class="isProfileOpen ? 'bg-slate-100' : ''"
            :aria-expanded="isProfileOpen"
            aria-haspopup="menu"
            @click="toggleProfile"
          >
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-white">{{ initials }}</span>
            <span class="hidden min-w-0 sm:block"><span class="block truncate text-sm font-semibold text-slate-800">{{ firstName }}</span><span class="block truncate text-[11px] text-slate-500">{{ roleLabel }}</span></span>
            <ChevronDownIcon class="hidden shrink-0 text-slate-400 sm:block" :class="isProfileOpen ? 'rotate-180' : ''" :size="16" aria-hidden="true" />
          </button>

          <div v-if="isNotificationsOpen" class="absolute right-12 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10" role="menu" aria-label="Notifications">
            <div class="border-b border-slate-100 px-4 py-3"><p class="text-sm font-bold text-slate-900">Notifications</p></div>
            <div class="px-4 py-7 text-center"><BellIcon class="mx-auto text-primary" :size="22" aria-hidden="true" /><p class="mt-3 text-sm font-semibold text-slate-800">Aucune nouvelle notification</p><p class="mx-auto mt-1 max-w-60 text-xs leading-5 text-slate-500">Les informations liées à vos candidatures et formations apparaîtront ici.</p></div>
          </div>

          <div v-if="isProfileOpen" class="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10" role="menu" aria-label="Menu du profil">
            <div class="border-b border-slate-100 px-3 py-2.5"><p class="truncate text-sm font-bold text-slate-900">{{ auth.user?.name ?? 'Utilisateur' }}</p><p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p></div>
            <div class="py-1">
              <RouterLink v-if="profilePath" :to="profilePath" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" role="menuitem" @click="closeMenus"><UserRoundIcon :size="16" aria-hidden="true" />Mon compte</RouterLink>
              <RouterLink v-if="settingsPath" :to="settingsPath" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" role="menuitem" @click="closeMenus"><SettingsIcon :size="16" aria-hidden="true" />Paramètres</RouterLink>
            </div>
            <div class="border-t border-slate-100 pt-1"><button type="button" class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50" role="menuitem" @click="handleLogout"><LogOutIcon :size="16" aria-hidden="true" />Se déconnecter</button></div>
          </div>
        </div>
      </header>
      <main class="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10"><slot /></main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { Bell as BellIcon, ChevronDown as ChevronDownIcon, LogOut as LogOutIcon, Menu as MenuIcon, Settings as SettingsIcon, UserRound as UserRoundIcon, X as XIcon } from '@lucide/vue'
import padciLogo from '@/assets/images/logodepadci.png'
import { useAuthStore } from '@/stores/auth'
import { useLogout } from '@/features/auth/composables/useLogout'

export interface WorkspaceNavItem { label: string; to: string; icon: Component }
export interface WorkspaceNavGroup { label: string; items: WorkspaceNavItem[] }

defineProps<{ workspace: string; title: string; home: string; navigation: WorkspaceNavGroup[] }>()
const route = useRoute()
const auth = useAuthStore()
const logout = useLogout()
const isSidebarOpen = ref(false)
const isNotificationsOpen = ref(false)
const isProfileOpen = ref(false)
const toolbar = ref<HTMLElement | null>(null)
const initials = computed(() => (auth.user?.name ?? '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PD')
const firstName = computed(() => auth.user?.name.split(' ').filter(Boolean)[0] ?? 'Mon compte')
const roleLabel = computed(() => auth.hasRole('super_admin') ? 'Super-administration' : auth.hasRole('admin') ? 'Administration' : auth.hasRole('moderateur') ? 'Modérateur' : 'Apprenant')
const profilePath = computed<string | null>(() => auth.hasRole('apprenant') ? '/profil' : auth.hasRole('admin') ? '/admin/parametres' : null)
const settingsPath = computed<string | null>(() => auth.hasRole('apprenant') ? '/parametres' : auth.hasRole('admin') ? '/admin/parametres' : null)

function isActive(path: string): boolean { return route.path === path || route.path.startsWith(`${path}/`) }
function closeMenus(): void { isNotificationsOpen.value = false; isProfileOpen.value = false }
function toggleNotifications(): void { isNotificationsOpen.value = !isNotificationsOpen.value; isProfileOpen.value = false }
function toggleProfile(): void { isProfileOpen.value = !isProfileOpen.value; isNotificationsOpen.value = false }
async function handleLogout(): Promise<void> { closeMenus(); await logout() }
function onDocumentClick(event: MouseEvent): void { if (toolbar.value && !toolbar.value.contains(event.target as Node)) closeMenus() }
function onDocumentKeydown(event: KeyboardEvent): void { if (event.key === 'Escape') closeMenus() }
onMounted(() => { document.addEventListener('click', onDocumentClick); document.addEventListener('keydown', onDocumentKeydown) })
onBeforeUnmount(() => { document.removeEventListener('click', onDocumentClick); document.removeEventListener('keydown', onDocumentKeydown) })
</script>
