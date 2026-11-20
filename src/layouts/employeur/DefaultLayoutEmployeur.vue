<template>
  <div class="min-h-screen bg-gray-50 flex overflow-hidden">
    <SidebarEmployeur :is-open="isSidebarOpen" @close="isSidebarOpen = false" />

    <div class="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:pl-64 w-full">
      <!-- HEADER -->
      <header class="bg-white shadow-sm sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = true" class="lg:hidden text-gray-600 hover:text-indigo-600 p-2 rounded-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h2 class="text-lg font-bold text-gray-800 hidden sm:block">Espace Employeur</h2>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>

      <footer class="py-4 px-6 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        <p>&copy; 2024 PADCI Formation - Espace Employeur. Tous droits réservés.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SidebarEmployeur from '@/components/employeur/SidebarEmployeur.vue'
const isSidebarOpen = ref(false)
</script>
