<template>
  <WorkspaceShell workspace="Supervision" title="Gouvernance PADCI" home="/superadmin/dashboard" :navigation="navigation">
    <slot>
      <router-view v-slot="{ Component }"><transition name="workspace-page" mode="out-in"><component :is="Component" /></transition></router-view>
    </slot>
  </WorkspaceShell>
</template>

<script setup lang="ts">
import { BarChart3 as BarChartIcon, CalendarDays as CalendarIcon, Landmark as FinanceIcon, LayoutDashboard as LayoutDashboardIcon, ShieldCheck as GovernanceIcon, UsersRound as UsersIcon } from '@lucide/vue'
import WorkspaceShell, { type WorkspaceNavGroup } from '@/features/shared/components/WorkspaceShell.vue'
const navigation: WorkspaceNavGroup[] = [
  { label: 'Supervision', items: [
    { label: 'Tableau de bord', to: '/superadmin/dashboard', icon: LayoutDashboardIcon },
    { label: 'Utilisateurs', to: '/superadmin/utilisateurs', icon: UsersIcon },
    { label: 'Cohortes', to: '/superadmin/cohortes', icon: CalendarIcon },
  ] },
  { label: 'Gouvernance', items: [
    { label: 'Finances', to: '/superadmin/finance', icon: FinanceIcon },
    { label: 'Demandes ANO', to: '/superadmin/ano', icon: GovernanceIcon },
    { label: 'Rapports', to: '/superadmin/rapports', icon: BarChartIcon },
  ] },
]
</script>
