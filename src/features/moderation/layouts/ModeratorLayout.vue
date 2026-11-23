<template>
  <WorkspaceShell
    workspace="Modération"
    title="Espace modérateur"
    home="/moderation/tableau-de-bord"
    :navigation="navigation"
  >
    <slot><router-view /></slot>
  </WorkspaceShell>
</template>
<script setup lang="ts">
import { MonitorCheck, BookOpenCheck, Compass, LayoutDashboard } from '@lucide/vue'
import WorkspaceShell, {
  type WorkspaceNavGroup,
} from '@/features/shared/components/WorkspaceShell.vue'
const navigation: WorkspaceNavGroup[] = [
  {
    label: 'Modération',
    items: [
      { label: 'Tableau de bord', to: '/moderation/tableau-de-bord', icon: LayoutDashboard },
      { label: 'Matériel des candidats', to: '/moderation/materiel', icon: MonitorCheck },
      { label: 'Cours', to: '/moderation/cours', icon: BookOpenCheck },
      { label: 'Catalogue', to: '/catalogue', icon: Compass },
    ],
  },
]
</script>
