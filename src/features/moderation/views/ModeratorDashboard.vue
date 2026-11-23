<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Bonjour, {{ firstName }}</h1>
        <p class="app-page-copy">{{ summary }}</p>
      </div>
    </header>

    <section
      class="grid grid-cols-1 gap-y-6 rounded-[18px] border border-line bg-white p-6 shadow-panel sm:grid-cols-3 sm:divide-x sm:divide-line"
      aria-label="Files d'attente"
    >
      <RouterLink
        v-for="(tile, index) in tiles"
        :key="tile.label"
        :to="tile.to"
        class="group transition focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
        :class="index > 0 ? 'sm:pl-6' : ''"
        :data-test="`tile-${tile.key}`"
      >
        <StatTile
          :label="tile.label"
          :value="tile.value"
          :loading="tile.loading"
          :tone="tile.value && Number(tile.value) > 0 ? 'savane' : 'neutral'"
        />
        <span
          class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-80 group-hover:opacity-100"
        >
          Ouvrir <ChevronRightIcon class="size-3.5" aria-hidden="true" />
        </span>
      </RouterLink>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="app-panel space-y-3" aria-labelledby="courses-queue">
        <div class="flex items-center justify-between gap-3">
          <h2 id="courses-queue" class="text-lg font-bold text-ink">Cours soumis</h2>
          <RouterLink to="/moderation/cours" class="text-sm font-semibold text-primary">
            Tout voir
          </RouterLink>
        </div>
        <div v-if="courseHead.isPending.value" class="space-y-2">
          <div v-for="n in 3" :key="n" class="app-skeleton h-14" />
        </div>
        <p v-else-if="courseHead.isError.value" class="app-alert app-alert-danger" role="alert">
          Impossible de charger les cours soumis.
        </p>
        <EmptyState
          v-else-if="!courseHead.data.value?.length"
          title="Aucun cours à examiner"
          description="Les cours que les formateurs soumettent à validation apparaîtront ici."
        >
          <template #icon><CheckIcon class="size-6" /></template>
        </EmptyState>
        <ul v-else class="-mx-2 divide-y divide-line">
          <li v-for="course in courseHead.data.value" :key="course.key">
            <RouterLink
              :to="{ path: '/moderation/cours', query: { statut: course.status, cle: course.key } }"
              class="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-mint/50"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-ink">{{ course.title }}</p>
                <p class="truncate text-xs text-quiet">
                  {{ course.pathway?.name ?? 'Filière' }} ·
                  {{ course.owner?.name ?? 'Formateur non précisé' }}
                </p>
              </div>
              <span v-if="course.status === 'in_review'" class="app-chip app-chip-info">
                En cours d'examen
              </span>
              <ChevronRightIcon class="size-4 shrink-0 text-quiet" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="app-panel space-y-3" aria-labelledby="equipment-queue">
        <div class="flex items-center justify-between gap-3">
          <h2 id="equipment-queue" class="text-lg font-bold text-ink">Matériel des candidats</h2>
          <RouterLink to="/moderation/materiel" class="text-sm font-semibold text-primary">
            Tout voir
          </RouterLink>
        </div>
        <div v-if="equipmentHead.isPending.value" class="space-y-2">
          <div v-for="n in 3" :key="n" class="app-skeleton h-14" />
        </div>
        <p v-else-if="equipmentHead.isError.value" class="app-alert app-alert-danger" role="alert">
          Impossible de charger les dossiers de matériel.
        </p>
        <EmptyState
          v-else-if="!equipmentHead.data.value?.length"
          title="Aucun dossier à examiner"
          description="Les équipements déclarés par les candidats apparaîtront ici."
        >
          <template #icon><CheckIcon class="size-6" /></template>
        </EmptyState>
        <ul v-else class="-mx-2 divide-y divide-line">
          <li v-for="review in equipmentHead.data.value" :key="review.key">
            <RouterLink
              :to="{ path: '/moderation/materiel', query: { statut: 'pending', cle: review.key } }"
              class="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-mint/50"
            >
              <span
                class="grid size-9 shrink-0 place-items-center rounded-full bg-forest-soft text-xs font-bold text-forest"
                aria-hidden="true"
                >{{ initials(review.application?.candidate?.name) }}</span
              >
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-ink">
                  {{ review.application?.candidate?.name ?? 'Candidat' }}
                </p>
                <p class="truncate text-xs text-quiet">{{ review.pathway?.name ?? 'Filière' }}</p>
              </div>
              <ChevronRightIcon class="size-4 shrink-0 text-quiet" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check as CheckIcon, ChevronRight as ChevronRightIcon } from '@lucide/vue'
import EmptyState from '@/components/app/EmptyState.vue'
import StatTile from '@/components/app/StatTile.vue'
import { useAuthStore } from '@/stores/auth'
import {
  useCourseQueueHead,
  useCourseStatusCounts,
  useEquipmentQueueHead,
  useEquipmentStatusCounts,
} from '../composables/useModerationQueues'

const auth = useAuthStore()
const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? 'modérateur')

const courseCounts = useCourseStatusCounts(['submitted', 'in_review'])
const equipmentCounts = useEquipmentStatusCounts(['pending', 'needs_info'])
const courseHead = useCourseQueueHead()
const equipmentHead = useEquipmentQueueHead()

const coursesWaiting = computed(() => {
  const c = courseCounts.data.value
  return c ? (c.submitted ?? 0) + (c.in_review ?? 0) : null
})

const tiles = computed(() => [
  {
    key: 'courses',
    label: 'Cours à examiner',
    value: coursesWaiting.value ?? '—',
    loading: courseCounts.isPending.value,
    to: '/moderation/cours',
  },
  {
    key: 'equipment',
    label: 'Matériel à vérifier',
    value: equipmentCounts.data.value?.pending ?? '—',
    loading: equipmentCounts.isPending.value,
    to: '/moderation/materiel',
  },
  {
    key: 'needs-info',
    label: 'Compléments demandés',
    value: equipmentCounts.data.value?.needs_info ?? '—',
    loading: equipmentCounts.isPending.value,
    to: { path: '/moderation/materiel', query: { statut: 'needs_info' } },
  },
])

const summary = computed(() => {
  const courses = coursesWaiting.value
  const equipment = equipmentCounts.data.value?.pending
  if (courses === null || equipment === undefined) return 'Ce qui attend votre examen.'
  const total = courses + equipment
  if (total === 0) return 'Rien ne vous attend pour le moment.'
  return total === 1
    ? 'Un élément attend votre examen.'
    : `${total} éléments attendent votre examen.`
})

function initials(name?: string) {
  return (name ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
</script>
