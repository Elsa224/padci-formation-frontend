<template>
  <WorkspaceShell
    workspace="Espace apprenant"
    title="Mon espace de formation"
    home="/formations/dashboard"
    :navigation="navigation"
  >
    <template #sidebar-extra>
      <section v-if="activeCourseKey && courseOutline" class="border-t border-forest-line pt-5">
        <p class="px-3 text-xs font-medium text-savane">Formation en cours</p>
        <p class="px-3 pt-1 pb-2 text-sm font-semibold text-white">{{ courseOutline.title }}</p>
        <RouterLink
          v-for="module in courseOutline.modules"
          :key="module.key"
          :to="`/formations/${activeCourseKey}`"
          class="mx-1 mb-1 block rounded-lg px-3 py-2 text-xs text-forest-muted hover:bg-forest-raised hover:text-white"
          >{{ module.title }}</RouterLink
        >
      </section>
    </template>
    <slot>
      <router-view v-slot="{ Component }"
        ><transition name="workspace-page" mode="out-in"><component :is="Component" /></transition
      ></router-view>
    </slot>
  </WorkspaceShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Award as AwardIcon,
  Compass as CompassIcon,
  FileText as FileTextIcon,
  GraduationCap as GraduationCapIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from '@lucide/vue'
import WorkspaceShell, {
  type WorkspaceNavGroup,
} from '@/features/shared/components/WorkspaceShell.vue'
import { useCourseOutline } from '../composables/useLearningCourse'

const route = useRoute()
const navigation: WorkspaceNavGroup[] = [
  {
    label: 'Apprentissage',
    items: [
      { label: 'Tableau de bord', to: '/formations/dashboard', icon: LayoutDashboardIcon },
      { label: 'Mes candidatures', to: '/mes-candidatures', icon: FileTextIcon },
      { label: 'Mes notes', to: '/formations/notes', icon: GraduationCapIcon },
      { label: 'Mes attestations', to: '/formations/attestations', icon: AwardIcon },
      { label: 'Catalogue', to: '/catalogue', icon: CompassIcon },
    ],
  },
  {
    label: 'Mon compte',
    items: [
      { label: 'Mon profil', to: '/profil', icon: UserIcon },
      { label: 'Paramètres', to: '/parametres', icon: SettingsIcon },
    ],
  },
]
const activeCourseKey = computed(() =>
  route.params.courseKey ? String(route.params.courseKey) : null,
)
const { data: courseOutline } = useCourseOutline(activeCourseKey)
</script>
