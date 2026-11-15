<template>
  <WorkspaceShell
    workspace="Espace apprenant"
    title="Mon espace de formation"
    home="/formations/dashboard"
    :navigation="navigation"
  >
    <template #sidebar-extra>
      <section v-if="activeCourseKey && courseOutline" class="border-t border-slate-100 pt-5">
        <p class="px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          Formation en cours
        </p>
        <p class="px-3 pb-2 pt-1 text-xs font-semibold text-slate-800">{{ courseOutline.title }}</p>
        <RouterLink
          v-for="module in courseOutline.modules"
          :key="module.key"
          :to="`/formations/${activeCourseKey}`"
          class="mx-1 mb-1 block rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
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
  Compass as CompassIcon,
  FileText as FileTextIcon,
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
