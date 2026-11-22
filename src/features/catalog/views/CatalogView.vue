<template>
  <section class="app-page" aria-labelledby="catalogue-title">
    <header class="app-page-header">
      <div class="max-w-2xl">
        <h1 id="catalogue-title" class="app-page-title">Trouvez votre parcours</h1>
        <p class="app-page-copy">
          Consultez les filières, leurs prérequis et les sessions ouvertes avant de déposer votre
          candidature.
        </p>
      </div>
      <p v-if="pathways.length" class="text-sm text-quiet">
        <span class="font-semibold text-ink tabular-nums">{{ pathways.length }}</span> filières
        disponibles
      </p>
    </header>

    <div
      v-if="activeFormationName"
      class="flex flex-col items-start justify-between gap-3 rounded-[18px] border border-savane/30 bg-savane-soft p-4 text-sm text-ink sm:flex-row sm:items-center"
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
        class="shrink-0 text-sm font-semibold text-savane-ink hover:underline"
      >
        Voir mes candidatures
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
        class="group relative flex flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-panel transition duration-200 focus-within:ring-2 focus-within:ring-primary hover:-translate-y-0.5 hover:shadow-raised motion-reduce:hover:translate-y-0"
      >
        <!-- Bandeau d'identité de la filière -->
        <div
          class="relative flex h-28 items-end justify-between overflow-hidden bg-forest px-5 pb-4"
        >
          <svg
            class="pointer-events-none absolute -top-4 -right-6 h-40 w-56 text-white/[0.07]"
            viewBox="0 0 224 160"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 120h64l24-24h72l24 24h40M40 64h56l20-20h80M120 160v-40M184 96v64"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle cx="64" cy="120" r="4" fill="currentColor" />
            <circle cx="196" cy="44" r="4" fill="currentColor" />
          </svg>
          <span
            class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-savane ring-1 ring-white/15"
            aria-hidden="true"
          >
            <component :is="pathwayIcon(pathway.code)" :size="24" :stroke-width="1.8" />
          </span>
          <span class="relative text-sm font-semibold text-forest-muted">{{ pathway.code }}</span>
        </div>

        <div class="flex flex-1 flex-col p-5">
          <h2 class="text-xl leading-snug font-bold text-ink group-hover:text-primary-shade">
            {{ pathway.name }}
          </h2>
          <p v-if="pathway.description" class="mt-2 line-clamp-3 text-sm leading-6 text-body">
            {{ pathway.description }}
          </p>

          <dl class="mt-4 space-y-2 text-sm">
            <div v-if="pathway.open_cohorts_count !== undefined" class="flex items-center gap-2">
              <dt class="sr-only">Sessions</dt>
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :class="pathway.open_cohorts_count > 0 ? 'bg-primary' : 'bg-line-strong'"
                aria-hidden="true"
              />
              <dd :class="pathway.open_cohorts_count > 0 ? 'font-semibold text-ink' : 'text-quiet'">
                {{
                  pathway.open_cohorts_count > 0
                    ? `${pathway.open_cohorts_count} session(s) ouverte(s)`
                    : 'Aucune session ouverte'
                }}
              </dd>
            </div>
            <div v-if="pathway.courses_count" class="flex items-center gap-2 text-quiet">
              <dt class="sr-only">Cours</dt>
              <BookOpenIcon :size="15" aria-hidden="true" />
              <dd>{{ pathway.courses_count }} cours</dd>
            </div>
            <div v-if="pathway.equipment_requirements" class="flex items-start gap-2 text-quiet">
              <dt class="sr-only">Équipement à prévoir</dt>
              <MonitorIcon :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
              <dd>
                {{
                  equipmentSummary(
                    pathway.equipment_requirements.min_cpu,
                    pathway.equipment_requirements.min_ram_gb,
                    pathway.equipment_requirements.min_storage_gb,
                  )
                }}
              </dd>
            </div>
          </dl>

          <div class="mt-auto flex items-center justify-between pt-5">
            <!-- Le lien couvre toute la carte (::after), sans liens imbriqués -->
            <router-link
              :to="`/catalogue/${pathway.key}`"
              class="text-sm font-semibold text-primary-shade after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              Voir le parcours
            </router-link>
            <ArrowRightIcon
              :size="18"
              class="text-quiet transition group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden="true"
            />
          </div>
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
  BrainCircuit as BrainCircuitIcon,
  ChartColumn as ChartIcon,
  GraduationCap as GraduationCapIcon,
  Headset as HeadsetIcon,
  Monitor as MonitorIcon,
  Network as NetworkIcon,
  ShieldCheck as ShieldCheckIcon,
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

/** One recognisable mark per trade; unknown codes fall back to a cap. */
function pathwayIcon(code: string) {
  const c = code.toUpperCase()
  if (c.startsWith('AI') || c.includes('IA')) return BrainCircuitIcon
  if (c.includes('CYBER') || c.includes('SEC')) return ShieldCheckIcon
  if (c.includes('DATA')) return ChartIcon
  if (c.includes('NET') || c.includes('RES')) return NetworkIcon
  if (c.includes('SUP') || c.includes('IT')) return HeadsetIcon
  return GraduationCapIcon
}

function equipmentSummary(cpu?: string, ram?: number, storage?: number): string {
  return (
    [cpu, ram ? `${ram} Go de RAM` : null, storage ? `${storage} Go de stockage` : null]
      .filter(Boolean)
      .join(' · ') || 'Configuration détaillée dans le parcours.'
  )
}
</script>
