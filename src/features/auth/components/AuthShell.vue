<template>
  <!-- Cadre commun des écrans d'accès (connexion, inscription, mot de passe,
       invitation) : formulaire sur fond blanc, panneau forêt qui dit ce
       qu'est la plateforme. Mêmes couleurs que l'espace connecté. -->
  <div class="flex min-h-[100dvh] flex-col bg-white md:flex-row">
    <!-- Bandeau compact sur téléphone -->
    <div class="flex items-center gap-3 bg-forest px-5 py-4 text-white md:hidden">
      <span class="rounded-lg bg-white px-2 py-1">
        <img :src="logo" alt="" class="h-7 w-auto" />
      </span>
      <p class="font-bold">PADCI Formation</p>
    </div>

    <main class="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 md:w-1/2">
      <div class="w-full max-w-md">
        <slot />
        <p class="mt-10 text-center text-xs text-quiet">
          PADCI Formation · EMSP Abidjan © {{ year }}
        </p>
      </div>
    </main>

    <aside
      class="relative hidden overflow-hidden bg-forest text-white md:flex md:w-1/2 md:flex-col md:justify-between md:p-12 lg:p-16"
      aria-label="PADCI Formation"
    >
      <!-- Tracé discret : un réseau de lignes, rappel des filières numériques -->
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full text-forest-line"
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M300 -20 V120 L380 200 V340" />
          <path d="M520 -20 V80 L440 160 V260 L520 340" />
        </g>
        <g fill="currentColor">
          <circle cx="380" cy="340" r="5" />
          <circle cx="520" cy="340" r="5" />
        </g>
      </svg>

      <div class="relative flex items-center gap-3">
        <span class="rounded-xl bg-white px-3 py-2">
          <img :src="logo" alt="EMSP" class="h-11 w-auto" />
        </span>
        <div>
          <p class="text-lg font-bold">PADCI Formation</p>
          <p class="text-sm text-forest-muted">École Multinationale Supérieure des Postes</p>
        </div>
      </div>

      <div class="relative max-w-md">
        <h2 class="text-[2.5rem] leading-[1.05] font-bold text-balance">{{ title }}</h2>
        <p class="mt-4 text-lg text-forest-muted">{{ text }}</p>
        <ul v-if="points.length" class="mt-10 space-y-4 border-t border-forest-line pt-8">
          <li v-for="point in points" :key="point" class="flex gap-3">
            <span class="mt-2 size-2 shrink-0 rounded-full bg-savane" aria-hidden="true" />
            <span class="text-white/90">{{ point }}</span>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/images/logoemsp.png'

withDefaults(defineProps<{ title: string; text: string; points?: string[] }>(), {
  points: () => [],
})

const year = new Date().getFullYear()
</script>
