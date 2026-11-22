<template>
  <WorkspaceShell
    workspace="Espace formateur"
    title="Pédagogie"
    home="/formateur/dashboard"
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
  BookOpen as BookOpenIcon,
  Compass as CompassIcon,
  LayoutDashboard as LayoutDashboardIcon,
} from '@lucide/vue'
import WorkspaceShell, {
  type WorkspaceNavGroup,
} from '@/features/shared/components/WorkspaceShell.vue'

const navigation: WorkspaceNavGroup[] = [
  {
    label: 'Enseignement',
    items: [
      { label: 'Tableau de bord', to: '/formateur/dashboard', icon: LayoutDashboardIcon },
      { label: 'Mes cours', to: '/formateur/cours', icon: BookOpenIcon },
      { label: 'Catalogue', to: '/catalogue', icon: CompassIcon },
    ],
  },
]
</script>
