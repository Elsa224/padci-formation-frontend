<template>
  <WorkspaceShell
    workspace="Supervision"
    title="Gouvernance EMSP"
    home="/superadmin/dashboard"
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
  Award as AwardIcon,
  BarChart3 as BarChartIcon,
  BookOpenCheck as BookOpenCheckIcon,
  ClipboardList as EnrollIcon,
  Library as CatalogueIcon,
  ScrollText as AuditIcon,
  Settings as SettingsIcon,
  CalendarDays as CalendarIcon,
  Landmark as FinanceIcon,
  LayoutDashboard as LayoutDashboardIcon,
  ShieldCheck as GovernanceIcon,
  UsersRound as UsersIcon,
} from '@lucide/vue'
import WorkspaceShell, {
  type WorkspaceNavGroup,
} from '@/features/shared/components/WorkspaceShell.vue'

const navigation: WorkspaceNavGroup[] = [
  {
    label: 'Supervision',
    items: [
      { label: 'Tableau de bord', to: '/superadmin/dashboard', icon: LayoutDashboardIcon },
      { label: 'Utilisateurs & Accès', to: '/superadmin/utilisateurs', icon: UsersIcon },
      { label: 'Cohortes', to: '/superadmin/cohortes', icon: CalendarIcon },
      { label: 'Inscriptions', to: '/superadmin/inscriptions', icon: EnrollIcon },
    ],
  },
  {
    label: 'Pédagogie',
    items: [
      { label: 'Catalogue', to: '/superadmin/catalogue', icon: CatalogueIcon },
      {
        label: 'Modération des cours',
        to: '/superadmin/moderation-cours',
        icon: BookOpenCheckIcon,
      },
      { label: 'Attestations', to: '/superadmin/attestations', icon: AwardIcon },
    ],
  },
  {
    label: 'Gouvernance',
    items: [
      { label: 'Finances', to: '/superadmin/finance', icon: FinanceIcon },
      { label: 'Demandes ANO', to: '/superadmin/ano', icon: GovernanceIcon },
      { label: 'Rapports', to: '/superadmin/rapports', icon: BarChartIcon },
      { label: "Journal d'audit", to: '/superadmin/audit', icon: AuditIcon },
      { label: 'Paramètres', to: '/superadmin/parametres', icon: SettingsIcon },
    ],
  },
]
</script>
