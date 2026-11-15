<template>
  <section class="app-page" aria-labelledby="dashboard-title">
    <!-- EN-TÊTE DU TABLEAU DE BORD -->
    <header class="app-page-header">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Espace apprenant</p>
        <h1 id="dashboard-title" class="app-page-title mt-2">Ma formation</h1>
        <p class="app-page-copy">
          Retrouvez vos cours actifs, vos sessions et le suivi de vos admissions.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <router-link to="/mes-candidatures" class="app-action-secondary text-xs">
          Suivi de mes candidatures
        </router-link>
        <router-link to="/catalogue" class="app-action-primary text-xs">
          Catalogue &rarr;
        </router-link>
      </div>
    </header>

    <!-- ÉTAT DE CHARGEMENT / ERREUR -->
    <div v-if="isPending" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 3" :key="index" class="app-panel space-y-5">
        <div class="app-skeleton h-5 w-1/3" />
        <div class="app-skeleton h-7 w-3/4" />
        <div class="app-skeleton h-11 w-full" />
      </div>
    </div>
    <div v-else-if="isError" class="app-panel py-12 text-center">
      <p class="font-semibold text-danger-ink">Vos formations ne sont pas disponibles.</p>
      <p class="mt-2 text-sm text-quiet">
        {{ (error as ApiError)?.message ?? 'Réessayez dans quelques instants.' }}
      </p>
    </div>

    <!-- AUCUNE FORMATION -->
    <div v-else-if="enrollments.length === 0" class="app-panel p-8 text-center sm:p-10">
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h2 class="mt-5 text-lg font-bold text-ink">Aucune formation active pour l'instant</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-quiet">
        Vous n'êtes pas encore inscrit à une cohorte active. Consultez le catalogue des filières et
        déposez votre candidature pour rejoindre une session.
      </p>
      <div class="pt-5">
        <router-link to="/catalogue" class="app-action-primary inline-flex">
          Découvrir le catalogue des sessions
        </router-link>
      </div>
    </div>

    <!-- GRILLE DES FORMATIONS ACTIVES -->
    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="enrollment in enrollments"
          :key="enrollment.key"
          class="app-panel flex flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                :class="
                  enrollment.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-quiet'
                "
              >
                {{ enrollment.status === 'active' ? 'En cours' : enrollment.status }}
              </span>
              <span v-if="enrollment.cohort" class="text-xs font-medium text-quiet">
                {{ enrollment.cohort.session }}
              </span>
            </div>

            <div>
              <h2 class="line-clamp-2 text-lg font-bold text-ink">
                {{ enrollment.course?.title || 'Formation en ligne' }}
              </h2>
              <p v-if="enrollment.cohort" class="mt-1 text-xs text-quiet">
                Cohorte : <strong class="text-ink">{{ enrollment.cohort.name }}</strong>
              </p>
            </div>
          </div>

          <div class="mt-5 border-t border-line pt-5">
            <router-link
              v-if="enrollment.course"
              :to="`/formations/${enrollment.course.key}`"
              class="app-action-primary w-full justify-center text-xs"
            >
              Accéder au cours &rarr;
            </router-link>
            <span v-else class="block text-center text-xs text-quiet">
              Contenu en cours de publication
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApiError } from '@/api/http'
import { useEnrollments } from '../composables/useEnrollments'

const { data, isPending, isError, error } = useEnrollments()
const enrollments = computed(() => data.value?.items ?? [])
</script>
