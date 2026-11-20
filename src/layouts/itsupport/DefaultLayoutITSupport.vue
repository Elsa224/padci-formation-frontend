<template>
  <div class="flex h-screen bg-gray-50 font-sans overflow-hidden">

    <!-- ================= SIDEBAR IT SUPPORT ================= -->
    <SidebarITSupport
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
    />

    <!-- ================= CONTENU PRINCIPAL ================= -->
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">

      <!-- HEADER FIXE -->
      <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-10 shrink-0">
        <div class="flex items-center gap-4">
          <!-- Bouton Hamburger Mobile -->
          <button
            @click="isSidebarOpen = true"
            class="lg:hidden text-gray-500 hover:text-slate-800 focus:outline-none transition p-1"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 class="text-lg font-bold text-gray-800 hidden sm:block">Espace IT Support</h1>
        </div>

        <!-- Actions Header (Notifications + Profil rapide) -->
        <div class="flex items-center gap-4">
          <button class="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <!-- Avatar simple -->
          <div class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            JK
          </div>
        </div>
      </header>

      <!-- ZONE DE CONTENU (Router View) -->
      <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SidebarITSupport from '@/components/itsupport/SidebarITSupport.vue'

// État pour gérer l'ouverture de la sidebar sur mobile
const isSidebarOpen = ref(false)
</script>

<style scoped>
/* Animation de transition entre les pages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
