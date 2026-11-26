<template>
  <div class="min-h-screen bg-[#f6f8f7] text-ink">
    <header class="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur-xl">
      <div
        class="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10"
      >
        <RouterLink to="/catalogue" class="flex min-w-0 items-center gap-3">
          <img :src="padciLogo" alt="PADCI LMS" class="h-9 w-auto object-contain" />
          <div class="min-w-0">
            <p class="truncate text-[0.95rem] font-bold text-ink">PADCI Formation</p>
            <p class="hidden text-xs text-quiet sm:block">Plateforme de préinscription</p>
          </div>
        </RouterLink>

        <nav class="flex items-center gap-2">
          <RouterLink
            to="/catalogue"
            class="hidden rounded-lg px-3 py-2 text-sm font-semibold text-body transition hover:bg-canvas hover:text-ink sm:inline-flex"
            active-class="bg-primary/10 text-primary"
          >
            Catalogue
          </RouterLink>
          <template v-if="auth.user">
            <RouterLink
              :to="home"
              class="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-shade"
            >
              Mon espace
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/connexion"
              class="hidden rounded-xl px-3 py-2 text-sm font-semibold text-body transition hover:bg-canvas sm:inline-flex"
              >Se connecter</RouterLink
            >
            <RouterLink
              to="/inscription"
              class="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-shade"
              >Créer un compte</RouterLink
            >
          </template>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
      <slot><router-view /></slot>
    </main>

    <footer class="border-t border-line/80 bg-white">
      <div
        class="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-6 text-xs text-quiet sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10"
      >
        <p>
          © {{ new Date().getFullYear() }} PADCI Formation. Plateforme institutionnelle de
          formation.
        </p>
        <p>Les cours sont accessibles après admission et ouverture de votre cohorte.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import padciLogo from '@/assets/images/logodepadci.png'
import { homeFor } from '@/features/auth/utils/homeFor'

const auth = useAuthStore()
const home = computed(() => homeFor(auth.user?.roles ?? []))
</script>
