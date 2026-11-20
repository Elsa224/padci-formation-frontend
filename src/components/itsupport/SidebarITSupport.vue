<template>
  <!-- OVERLAY MOBILE -->
  <div v-if="isOpen" @click="$emit('close')" class="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"></div>

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
      <!-- Dashboard -->
      <div class="px-3 mb-4">
        <router-link to="/formations/itsupport/dashboard" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/formations/itsupport/dashboard') ? 'bg-slate-800 text-white font-semibold' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-800'" @click="$emit('close')">
          <i class='bx bxs-dashboard text-xl'></i>
          <span>Tableau de bord</span>
        </router-link>
      </div>

      <div class="mb-2 px-4">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Programme IT Support</p>
      </div>

      <div class="space-y-1 px-3">

        <!--  L'INTRODUCTION -->
        <router-link to="/formations/itsupport/introduction" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/formations/itsupport/introduction') ? 'bg-slate-800 text-white font-semibold' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-800'" @click="$emit('close')">
          <i class='bx bx-info-circle text-xl'></i>
          <div class="flex flex-col flex-1">
            <span class="truncate">Introduction</span>
            <span class="text-[10px] text-gray-400">Programme & Méthode</span>
          </div>
        </router-link>

        <!-- Jour 1 -->
        <router-link to="/formations/itsupport/jour1" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/formations/itsupport/jour1') ? 'bg-slate-800 text-white font-semibold' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-800'" @click="$emit('close')">
          <i class='bx bx-headphone text-xl'></i>
          <div class="flex flex-col flex-1">
            <span class="truncate">Jour 1 : Le métier</span>
            <span class="text-[10px] text-gray-400">S1 & S2</span>
          </div>
        </router-link>

        <!-- Jour 2 -->
        <router-link to="/formations/itsupport/jour2" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/formations/itsupport/jour2') ? 'bg-slate-800 text-white font-semibold' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-800'" @click="$emit('close')">
          <i class='bx bx-wrench text-xl'></i>
          <div class="flex flex-col flex-1">
            <span class="truncate">Jour 2 : Gestes techniques</span>
            <span class="text-[10px] text-gray-400">S3 & S4</span>
          </div>
        </router-link>

        <!-- Jour 3 -->
        <router-link to="/formations/itsupport/jour3" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/formations/itsupport/jour3') ? 'bg-slate-800 text-white font-semibold' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-800'" @click="$emit('close')">
          <i class='bx bx-network-chart text-xl'></i>
          <div class="flex flex-col flex-1">
            <span class="truncate">Jour 3 : Comptes & Réseau</span>
            <span class="text-[10px] text-gray-400">S5 & S6</span>
          </div>
        </router-link>

        <!-- Jour 4 -->
        <router-link to="/formations/itsupport/jour4" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all" :class="isActive('/formations/itsupport/jour4') ? 'bg-slate-800 text-white font-semibold' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-800'" @click="$emit('close')">
          <i class='bx bx-certification text-xl'></i>
          <div class="flex flex-col flex-1">
            <span class="truncate">Jour 4 : Transmission</span>
            <span class="text-[10px] text-gray-400">S7 & S8</span>
          </div>
        </router-link>
      </div>

      <!-- SECTION RESSOURCES -->
      <div class="border-t border-gray-100 my-4"></div>
     

      <!-- RETOUR -->
      <div class="border-t border-gray-100 my-4"></div>
      <div class="px-3">
        <router-link to="/" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100 transition-all" @click="$emit('close')">
          <i class='bx bx-exit text-xl'></i>
          <span>Retour à l'accueil</span>
        </router-link>
      </div>
    </nav>

    <!-- FOOTER -->
    <div class="p-4 border-t border-gray-100 shrink-0">
      <div class="bg-slate-100 rounded-lg p-3">
        <div class="flex justify-between items-center mb-1">
          <p class="text-xs font-bold text-gray-700">Progression IT Support</p>
          <p class="text-xs font-bold text-slate-800">0%</p>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-slate-800 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        <p class="text-[10px] text-center text-gray-500 mt-2">Prêt à commencer</p>
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
