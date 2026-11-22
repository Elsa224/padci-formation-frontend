<template>
  <section class="app-page" aria-labelledby="catalogue-title">
    <header class="app-page-header">
      <div class="max-w-2xl">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Offre de formation</p>
        <h1 id="catalogue-title" class="app-page-title mt-2">Trouvez votre parcours</h1>
        <p class="app-page-copy">
          Consultez les filières, leurs prérequis et les sessions ouvertes avant de déposer votre
          candidature.
        </p>
      </div>
      <div
        class="hidden rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-right sm:block"
      >
        <p class="text-xs font-semibold text-quiet">Filières disponibles</p>
        <p class="mt-0.5 text-2xl font-bold text-ink">{{ pathways.length }}</p>
      </div>
    </header>

    <div
      v-if="activeFormationName"
      class="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-ink sm:flex-row sm:items-center"
      data-testid="banner-already-enrolled"
    >
      <div class="flex items-center gap-2 font-medium">
        <span>
          Vous suivez déjà <strong>{{ activeFormationName }}</strong
          >. Une seule formation est possible pour le moment.
        </span>
      </div>
      <router-link
        to="/mes-candidatures"
        class="shrink-0 text-xs font-semibold text-primary underline"
      >
        Voir mes candidatures →
      </router-link>
    </div>

    <div
      v-if="isPending"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Chargement du catalogue"
    >
      <div v-for="index in 6" :key="index" class="app-panel space-y-5">
        <div class="app-skeleton h-6 w-24" />
        <div class="app-skeleton h-7 w-3/4" />
        <div class="space-y-2">
          <div class="app-skeleton h-4 w-full" />
          <div class="app-skeleton h-4 w-5/6" />
        </div>
        <div class="app-skeleton h-12 w-full" />
      </div>
    </div>

    <div v-else-if="isError" class="app-panel mx-auto max-w-xl py-12 text-center">
      <p class="text-sm font-semibold text-danger-ink">Le catalogue n’est pas disponible.</p>
      <p class="mt-2 text-sm text-quiet">
        {{ (error as ApiError)?.message ?? 'Réessayez dans quelques instants.' }}
      </p>
    </div>

    <div v-else-if="pathways.length === 0" class="app-panel mx-auto max-w-xl py-12 text-center">
      <GraduationCapIcon class="mx-auto text-primary" :size="32" aria-hidden="true" />
      <h2 class="mt-4 text-lg font-bold text-ink">Les prochaines filières arrivent bientôt</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-quiet">
        Aucune filière n’est ouverte à la consultation pour le moment.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="pathway in pathways"
        :key="pathway.key"
        class="app-panel group flex min-h-80 flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-3">
          <span
            class="inline-flex rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold tracking-wide text-primary"
            >{{ pathway.code }}</span
          >
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span
              v-if="pathway.open_cohorts_count !== undefined"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                pathway.open_cohorts_count > 0
                  ? 'border border-primary/20 bg-primary/10 text-primary'
                  : 'border border-slate-200 bg-slate-100 text-quiet'
              "
            >
              <CalendarIcon :size="13" aria-hidden="true" />
              {{ pathway.open_cohorts_count }} session(s) ouverte(s)
            </span>
            <span
              v-if="pathway.courses_count"
              class="inline-flex items-center gap-1 text-xs font-medium text-quiet"
              ><BookOpenIcon :size="14" aria-hidden="true" />{{ pathway.courses_count }} cours</span
            >
          </div>
        </div>

        <div class="mt-6">
          <h2
            class="text-xl font-bold leading-snug text-ink transition-colors group-hover:text-primary"
          >
            {{ pathway.name }}
          </h2>
          <p class="mt-3 line-clamp-3 text-sm leading-6 text-quiet">
            {{
              pathway.description ||
              'Formation certifiante structurée en modules et en sessions intensives.'
            }}
          </p>
        </div>

        <div
          v-if="pathway.equipment_requirements"
          class="mt-5 rounded-xl border border-line bg-canvas px-3.5 py-3"
        >
          <p class="flex items-center gap-2 text-xs font-bold text-ink">
            <MonitorIcon :size="15" class="text-primary" aria-hidden="true" />Équipement à prévoir
          </p>
          <p class="mt-1.5 text-xs leading-5 text-quiet">
            {{
              equipmentSummary(
                pathway.equipment_requirements.min_cpu,
                pathway.equipment_requirements.min_ram_gb,
                pathway.equipment_requirements.min_storage_gb,
              )
            }}
          </p>
        </div>

        <div class="mt-auto pt-6">
          <router-link
            :to="`/catalogue/${pathway.key}`"
            class="app-action-secondary flex w-full items-center justify-between group-hover:border-primary/40 group-hover:text-primary"
          >
            Voir le parcours <ArrowRightIcon :size="17" aria-hidden="true" />
          </router-link>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowRight as ArrowRightIcon,
  BookOpen as BookOpenIcon,
  Calendar as CalendarIcon,
  GraduationCap as GraduationCapIcon,
  Monitor as MonitorIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import { usePathways } from '../composables/useCatalog'
import { useAuthStore } from '@/stores/auth'
import { useLearnerApplications } from '@/features/admissions/composables/useLearnerApplications'

const auth = useAuthStore()
const { data, isPending, isError, error } = usePathways()
const pathways = computed(() => data.value?.items ?? [])

const { data: myAppsData } = useLearnerApplications()
const activeFormation = computed(() => {
  if (!auth.token) return null
  const items = myAppsData.value?.items ?? []
  return (
    items.find((a) =>
      ['submitted', 'in_review', 'waitlisted', 'standby', 'accepted'].includes(a.status),
    ) ?? null
  )
})
const activeFormationName = computed(() => activeFormation.value?.pathway?.name ?? null)

function equipmentSummary(cpu?: string, ram?: number, storage?: number): string {
  return (
    [cpu, ram ? `${ram} Go de RAM` : null, storage ? `${storage} Go de stockage` : null]
      .filter(Boolean)
      .join(' · ') || 'Configuration détaillée dans le parcours.'
  )
}
</script>
