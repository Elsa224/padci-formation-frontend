<template>
  <WorkspaceShell
    workspace="Administration"
    title="Pilotage EMSP"
    home="/admin/dashboard"
    :navigation="navigation"
  >
    <slot>
      <router-view v-slot="{ Component }"
        ><transition name="workspace-page" mode="out-in"><component :is="Component" /></transition
      ></router-view>
    </slot>
  </WorkspaceShell>
</template>

<script setup lang="ts">
import {
  BarChart3 as BarChartIcon,
  CalendarDays as CalendarIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Settings as SettingsIcon,
  UsersRound as UsersIcon,
  UserCheck as CandidaturesIcon,
} from '@lucide/vue'
import WorkspaceShell, {
  type WorkspaceNavGroup,
} from '@/features/shared/components/WorkspaceShell.vue'

const navigation: WorkspaceNavGroup[] = [
  {
    label: 'Admissions',
    items: [
      { label: 'Tableau de bord', to: '/admin/dashboard', icon: LayoutDashboardIcon },
      { label: 'Candidatures', to: '/admin/candidatures', icon: CandidaturesIcon },
      { label: 'Cohortes', to: '/admin/cohortes', icon: CalendarIcon },
    ],
  },
  {
    label: 'Gestion & Équipe',
    items: [
      { label: 'Utilisateurs & Accès', to: '/admin/utilisateurs', icon: UsersIcon },
      { label: 'Rapports', to: '/admin/rapports', icon: BarChartIcon },
      { label: 'Paramètres', to: '/admin/parametres', icon: SettingsIcon },
    ],
  },
]
</script>
