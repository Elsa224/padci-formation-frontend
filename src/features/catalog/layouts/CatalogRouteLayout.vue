<template>
  <div v-if="isBootstrapping" class="min-h-screen bg-canvas px-4 py-8 sm:px-7">
    <div class="mx-auto max-w-[1440px] space-y-7">
      <div class="app-skeleton h-12 w-56" />
      <div class="grid gap-5 md:grid-cols-2">
        <div class="app-skeleton h-64" />
        <div class="app-skeleton h-64" />
      </div>
    </div>
  </div>
  <component :is="layout" v-else>
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PublicLayout from '@/features/public/layouts/PublicLayout.vue'
import LearnerLayout from '@/features/learning/layouts/LearnerLayout.vue'
import AdminLayout from '@/features/admin/layouts/DefaultLayoutAdmin.vue'
import SuperAdminLayout from '@/features/superadmin/layouts/DefaultLayoutSuperAdmin.vue'
import ModeratorLayout from '@/features/moderation/layouts/ModeratorLayout.vue'
import FormateurLayout from '@/features/formateur/layouts/FormateurLayout.vue'
import { bootstrapAuth } from '@/features/auth/composables/useBootstrapAuth'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isBootstrapping = ref(auth.token !== null && auth.user === null)

const layout = computed(() => {
  if (auth.hasRole('super_admin')) return SuperAdminLayout
  if (auth.hasRole('admin')) return AdminLayout
  if (auth.hasRole('moderateur')) return ModeratorLayout
  if (auth.hasRole('formateur')) return FormateurLayout
  if (auth.user !== null) return LearnerLayout
  return PublicLayout
})

onMounted(async () => {
  if (!isBootstrapping.value) return
  try {
    await bootstrapAuth()
  } finally {
    isBootstrapping.value = false
  }
})
</script>
