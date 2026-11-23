<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Mes notes</h1>
        <p class="app-page-copy">Les notes et appréciations de vos formateurs, par cours.</p>
      </div>
    </header>

    <div v-if="grades.isPending.value" class="app-skeleton h-32" />
    <p v-else-if="grades.isError.value" class="app-alert app-alert-danger" role="alert">
      Impossible de charger vos notes.
    </p>
    <EmptyState
      v-else-if="!grades.data.value?.length"
      title="Pas encore de note"
      description="Vos formateurs saisissent les notes au fil de la formation : elles apparaîtront ici."
      framed
    >
      <template #icon><GraduationCapIcon class="size-6" /></template>
    </EmptyState>
    <ul
      v-else
      class="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-white shadow-panel"
    >
      <li
        v-for="grade in grades.data.value"
        :key="grade.key"
        class="flex items-start gap-4 px-5 py-4"
        data-test="my-grade"
      >
        <div
          class="flex w-16 shrink-0 flex-col items-center rounded-xl py-2"
          :class="
            grade.score >= 10 ? 'bg-mint text-primary-shade' : 'bg-savane-soft text-savane-ink'
          "
        >
          <span class="text-xl leading-none font-bold tabular-nums">{{
            formatScore(grade.score)
          }}</span>
          <span class="text-xs">/ 20</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-ink">{{ grade.course?.title }}</p>
          <p v-if="grade.appreciation" class="mt-1 text-sm text-body">
            « {{ grade.appreciation }} »
          </p>
          <p class="mt-1 text-xs text-quiet">
            <span v-if="grade.grader">{{ grade.grader.name }} · </span>
            {{ grade.cohort?.name }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { GraduationCap as GraduationCapIcon } from '@lucide/vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { formatScore, useMyGrades } from '@/features/cohorts/composables/useCourseGrades'

const grades = useMyGrades()
</script>
