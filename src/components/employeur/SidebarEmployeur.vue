<template>
  <!-- OVERLAY MOBILE -->
  <div v-if="isOpen" @click="$emit('close')" class="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"></div>

  <!-- SIDEBAR -->
  <aside
    class="fixed left-0 top-0 h-screen w-64 bg-white shadow-xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- LOGO -->
    <div class="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
      <router-link to="/" class="flex-1 flex justify-center lg:justify-start">
        <img :src="padciLogo" alt="PADCI" class="h-16 lg:h-20 w-auto object-contain" />
      </router-link>
      <button @click="$emit('close')" class="lg:hidden text-gray-500 hover:text-red-500 p-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <!-- MENU -->
    <nav class="flex-1 overflow-y-auto py-4 custom-scrollbar">
      <div class="px-3 mb-4">
        <router-link to="/employeur/dashboard" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/employeur/dashboard') ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'" @click="$emit('close')">
          <i class='bx bxs-dashboard text-xl'></i>
          <span>Tableau de bord</span>
        </router-link>
      </div>

      <div class="mb-2 px-4">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestion</p>
      </div>

      <div class="space-y-1 px-3">
        <router-link to="/employeur/candidatures" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/employeur/candidatures') ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'" @click="$emit('close')">
          <i class='bx bx-folder-open text-xl'></i>
          <span>Dossiers Candidats</span>
        </router-link>

        <router-link to="/employeur/formateurs" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/employeur/formateurs') ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'" @click="$emit('close')">
          <i class='bx bx-user-check text-xl'></i>
          <span>Suivi Formateurs</span>
        </router-link>
      </div>

      <!-- RETOUR -->
      <div class="border-t border-gray-100 my-4"></div>
      <div class="px-3">
        <router-link to="/" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100 transition-all" @click="$emit('close')">
          <i class='bx bx-exit text-xl'></i>
          <span>Déconnexion</span>
        </router-link>
      </div>
    </nav>

    <!-- PROFIL -->
    <div class="p-4 border-t border-gray-100 shrink-0">
      <div class="bg-indigo-50 rounded-lg p-3 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">EM</div>
        <div>
          <p class="text-xs font-bold text-gray-800">Employeur PADCI</p>
          <p class="text-[10px] text-gray-500">Ressources Humaines</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import padciLogo from '@/assets/images/logodepadci.png'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close'])
const route = useRoute()
const isActive = (path: string) => route.path === path
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
</style>
