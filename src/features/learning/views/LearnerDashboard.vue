<template>
  <section class="app-page" aria-labelledby="dashboard-title">
    <header class="app-page-header">
      <div>
        <h1 id="dashboard-title" class="app-page-title">Ma formation</h1>
        <p class="app-page-copy">Vos cours, votre session et votre assiduité, au même endroit.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <router-link to="/mes-candidatures" class="app-action-secondary">
          Mes candidatures
        </router-link>
        <router-link to="/catalogue" class="app-action-secondary">Catalogue</router-link>
      </div>
    </header>

    <!-- Liste prioritaire (standby) -->
    <div
      v-if="hasStandbyApplication"
      data-testid="standby-banner"
      class="flex flex-col gap-4 rounded-[18px] border border-savane/30 bg-savane-soft p-5 sm:flex-row sm:items-start"
    >
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-savane text-forest"
        aria-hidden="true"
      >
        <HourglassIcon :size="20" />
      </span>
      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="app-chip bg-white text-savane-ink">En attente de cohorte (Standby)</span>
          <span v-if="standbyApplication?.pathway" class="text-sm font-medium text-body">
            {{ standbyApplication.pathway.name }}
          </span>
        </div>
        <p class="font-semibold text-ink">
          Dossier validé avec succès ! Vous êtes sur la liste prioritaire (Standby) et serez
          automatiquement affecté dès l'ouverture de la prochaine session.
        </p>
        <p class="text-sm text-body">
          Dès qu'une place se libère ou qu'une nouvelle session s'ouvre, vous recevrez une
          confirmation d'affectation dans votre cohorte.
        </p>
      </div>
      <router-link
        to="/mes-candidatures"
        class="shrink-0 text-sm font-semibold text-savane-ink hover:underline"
      >
        Voir le détail
      </router-link>
    </div>

    <!-- Bloc signature : reprendre le cours -->
    <ResumeCourseHero
      v-if="primaryEnrollment?.course"
      :course-key="primaryEnrollment.course.key"
      :fallback-title="primaryEnrollment.course.title"
    />

    <!-- Affectation à une cohorte -->
    <div
      v-if="assignedCohort"
      data-testid="cohort-status-card"
      class="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-start gap-4">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-primary-shade"
          aria-hidden="true"
        >
          <CalendarCheckIcon :size="20" />
        </span>
        <div class="min-w-0 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="app-chip app-chip-leaf">Affectation confirmée</span>
            <span v-if="assignedCohort.code" class="text-xs font-medium text-quiet">
              {{ assignedCohort.code }}
            </span>
          </div>
          <h2 class="font-semibold text-ink">
            Inscrit à la Cohorte {{ assignedCohort.name }} — Rentrée le
            {{ formatCohortDate(assignedCohort.starts_at) }}
          </h2>
          <p class="text-sm text-quiet">
            Les modules pédagogiques s'activeront à l'ouverture de votre session.
          </p>
        </div>
      </div>
      <router-link to="/mes-candidatures" class="app-action-secondary shrink-0">
        Voir mon dossier
      </router-link>
    </div>

    <!-- Chargement / erreur -->
    <div v-if="isPending" class="space-y-3">
      <div v-for="index in 3" :key="index" class="app-skeleton h-20" />
    </div>
    <div v-else-if="isError" class="app-panel">
      <EmptyState
        title="Vos formations ne sont pas disponibles."
        :description="(error as ApiError)?.message ?? 'Réessayez dans quelques instants.'"
      />
    </div>

    <!-- Aucune formation -->
    <div v-else-if="enrollments.length === 0" class="app-panel">
      <EmptyState
        v-if="assignedCohort"
        title="Votre rentrée approche"
        :description="`Vous êtes inscrit à la session ${assignedCohort.name}. Vos cours et supports seront mis en ligne dès le lancement des enseignements.`"
      >
        <template #icon><BookOpenIcon :size="22" /></template>
      </EmptyState>
      <EmptyState
        v-else-if="hasStandbyApplication"
        title="Candidature validée en attente de session"
        description="Votre dossier est accepté sur liste prioritaire (Standby). Vos formations apparaîtront dès qu'une cohorte vous sera attribuée."
      >
        <template #icon><HourglassIcon :size="22" /></template>
      </EmptyState>
      <EmptyState
        v-else
        title="Aucune formation active pour l'instant"
        description="Consultez le catalogue des filières et déposez votre candidature pour rejoindre une session."
      >
        <template #icon><CompassIcon :size="22" /></template>
        <router-link to="/catalogue" class="app-action-primary">Découvrir le catalogue</router-link>
      </EmptyState>
    </div>

    <!-- Mes cours -->
    <section v-else class="space-y-3" aria-labelledby="courses-title">
      <div class="flex items-baseline justify-between gap-3">
        <h2 id="courses-title" class="text-lg font-bold text-ink">Mes cours</h2>
        <span class="text-sm text-quiet">{{ enrollments.length }} cours</span>
      </div>
      <ul
        class="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-white shadow-panel"
      >
        <li v-for="enrollment in enrollments" :key="enrollment.key">
          <router-link
            v-if="enrollment.course"
            :to="`/formations/${enrollment.course.key}`"
            class="group flex items-center gap-4 px-5 py-4 transition hover:bg-mint/50"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest text-sm font-bold text-white"
              aria-hidden="true"
              >{{ initialsOf(enrollment.course.title) }}</span
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-ink group-hover:text-primary-shade">
                {{ enrollment.course.title }}
              </span>
              <span v-if="enrollment.cohort" class="block truncate text-sm text-quiet">
                {{ enrollment.cohort.name }}
              </span>
            </span>
            <span
              class="app-chip"
              :class="enrollment.status === 'active' ? 'app-chip-leaf' : 'app-chip-neutral'"
            >
              {{ enrollment.status === 'active' ? 'En cours' : enrollment.status }}
            </span>
            <ChevronRightIcon
              :size="18"
              class="shrink-0 text-quiet transition group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </router-link>
          <div v-else class="flex items-center gap-4 px-5 py-4 text-sm text-quiet">
            Contenu en cours de publication
          </div>
        </li>
      </ul>
    </section>

    <!-- Mon assiduité -->
    <section
      data-test="learner-attendance-section"
      data-testid="learner-attendance-section"
      class="app-panel space-y-5"
      aria-labelledby="attendance-section-title"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="attendance-section-title" class="text-lg font-bold text-ink">Mon assiduité</h2>
          <p class="text-sm text-quiet">Votre présence aux séances en présentiel et ateliers.</p>
        </div>
        <span
          v-if="attendanceSummary && attendanceItems.length > 0"
          class="app-chip"
          :class="
            attendanceSummary.rate >= 80
              ? 'app-chip-leaf'
              : attendanceSummary.rate >= 50
                ? 'app-chip-savane'
                : 'app-chip-danger'
          "
          data-test="attendance-rate-badge"
        >
          Taux d'assiduité : {{ attendanceSummary.rate }}%
        </span>
      </div>

      <div v-if="isAttendancePending" class="space-y-3">
        <div class="app-skeleton h-16 w-full" />
        <div class="app-skeleton h-24 w-full" />
      </div>

      <p v-else-if="isAttendanceError" class="text-sm text-danger-ink">
        Votre assiduité n'est pas disponible pour le moment. Rechargez la page.
      </p>

      <div v-else-if="attendanceItems.length > 0" class="space-y-6">
        <div
          class="grid gap-6 rounded-2xl bg-canvas p-5 sm:grid-cols-[auto_1fr] sm:items-center"
          data-test="attendance-summary-cards"
        >
          <ProgressRing
            :value="(attendanceSummary?.rate ?? 0) / 100"
            :size="88"
            :stroke="8"
            label="Taux d'assiduité"
          />
          <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
            <div>
              <dt class="text-sm text-quiet">Séances</dt>
              <dd class="mt-0.5 text-xl font-bold text-ink tabular-nums" data-test="summary-total">
                {{ attendanceSummary?.total ?? 0 }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 text-sm text-quiet">
                <span class="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />Présences
              </dt>
              <dd
                class="mt-0.5 text-xl font-bold text-ink tabular-nums"
                data-test="summary-present"
              >
                {{ attendanceSummary?.present ?? 0 }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 text-sm text-quiet">
                <span class="h-2 w-2 rounded-full bg-savane" aria-hidden="true" />Retards
              </dt>
              <dd class="mt-0.5 text-xl font-bold text-ink tabular-nums" data-test="summary-late">
                {{ attendanceSummary?.late ?? 0 }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 text-sm text-quiet">
                <span class="h-2 w-2 rounded-full bg-sky-600" aria-hidden="true" />Excusées
              </dt>
              <dd
                class="mt-0.5 text-xl font-bold text-ink tabular-nums"
                data-test="summary-excused"
              >
                {{ attendanceSummary?.excused ?? 0 }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 text-sm text-quiet">
                <span class="h-2 w-2 rounded-full bg-danger-ink" aria-hidden="true" />Absences
              </dt>
              <dd class="mt-0.5 text-xl font-bold text-ink tabular-nums" data-test="summary-absent">
                {{ attendanceSummary?.absent ?? 0 }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="space-y-2">
          <h3 class="app-label">Séances récentes</h3>
          <ul class="divide-y divide-line">
            <li
              v-for="item in attendanceItems"
              :key="item.key"
              class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              data-test="attendance-item"
            >
              <div class="min-w-0 space-y-0.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-semibold text-ink">
                    {{ item.session.title || 'Séance de cours' }}
                  </span>
                  <span v-if="item.session.cohort_name" class="app-chip app-chip-neutral">
                    {{ item.session.cohort_name }}
                  </span>
                </div>
                <p class="text-sm text-quiet">
                  {{ formatSessionDate(item.session.date) }}
                  <template v-if="item.session.starts_at_time">
                    · {{ item.session.starts_at_time
                    }}{{ item.session.ends_at_time ? ' - ' + item.session.ends_at_time : '' }}
                  </template>
                  <span v-if="item.note" class="italic"> ({{ item.note }})</span>
                </p>
              </div>
              <span
                class="app-chip shrink-0"
                :class="getAttendanceStatusBadgeClass(item.status)"
                data-test="attendance-status-badge"
              >
                {{ item.status_label || getAttendanceStatusLabel(item.status) }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div v-else data-test="attendance-empty-state">
        <EmptyState
          framed
          title="Aucune séance d'émargement enregistrée pour le moment"
          description="Vos présences apparaîtront ici dès que vos séances en présentiel ou ateliers débuteront."
        >
          <template #icon><CalendarCheckIcon :size="22" /></template>
        </EmptyState>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BookOpen as BookOpenIcon,
  CalendarCheck as CalendarCheckIcon,
  ChevronRight as ChevronRightIcon,
  Compass as CompassIcon,
  Hourglass as HourglassIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import EmptyState from '@/components/app/EmptyState.vue'
import ProgressRing from '@/components/app/ProgressRing.vue'
import ResumeCourseHero from '../components/ResumeCourseHero.vue'
import { useEnrollments } from '../composables/useEnrollments'
import { useLearnerAttendance } from '../composables/useLearnerAttendance'
import { useLearnerApplications } from '@/features/admissions/composables/useLearnerApplications'

const { data, isPending, isError, error } = useEnrollments()
const enrollments = computed(() => data.value?.items ?? [])
/** The course the "Reprendre" block points at: the first active enrollment with content. */
const primaryEnrollment = computed(
  () => enrollments.value.find((e) => e.status === 'active' && e.course) ?? null,
)

function initialsOf(title: string): string {
  return title
    .split(/[\s&—-]+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

const {
  data: attendanceData,
  isPending: isAttendancePending,
  isError: isAttendanceError,
} = useLearnerAttendance()
const attendanceSummary = computed(() => attendanceData.value?.summary ?? null)
const attendanceItems = computed(() => attendanceData.value?.items ?? [])

const { data: applicationsData } = useLearnerApplications()
const applications = computed(() => applicationsData?.value?.items ?? [])

const standbyApplication = computed(() => {
  return applications.value.find((app) => app.status === 'standby') ?? null
})

const hasStandbyApplication = computed(() => !!standbyApplication.value)

const assignedCohortFromApp = computed(() => {
  const accepted = applications.value.find((app) => app.status === 'accepted' && app.cohort)
  return accepted?.cohort ?? null
})

const assignedCohortFromEnrollment = computed(() => {
  const enrolled = enrollments.value.find((e) => e.cohort)
  return enrolled?.cohort ?? null
})

const assignedCohort = computed(() => {
  const fromApp = assignedCohortFromApp.value
  const fromEnrollment = assignedCohortFromEnrollment.value

  if (fromApp) {
    return {
      name: fromApp.name,
      code: fromApp.code,
      starts_at: fromApp.starts_at,
      ends_at: fromApp.ends_at,
      session: fromApp.session,
    }
  }
  if (fromEnrollment) {
    return {
      name: fromEnrollment.name,
      code: fromEnrollment.code,
      starts_at: fromEnrollment.starts_at ?? null,
      ends_at: fromEnrollment.ends_at ?? null,
      session: fromEnrollment.session,
    }
  }
  return null
})

function formatCohortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'date à confirmer'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatSessionDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getAttendanceStatusBadgeClass(status: string): string {
  switch (status) {
    case 'present':
      return 'app-chip-leaf'
    case 'late':
      return 'bg-savane-soft text-amber-700'
    case 'absent':
      return 'app-chip-danger'
    case 'excused':
      return 'bg-sky-50 text-sky-700'
    default:
      return 'app-chip-neutral'
  }
}

function getAttendanceStatusLabel(status: string): string {
  switch (status) {
    case 'present':
      return 'Présent'
    case 'late':
      return 'En retard'
    case 'absent':
      return 'Absent'
    case 'excused':
      return 'Excusé'
    default:
      return status
  }
}
</script>
