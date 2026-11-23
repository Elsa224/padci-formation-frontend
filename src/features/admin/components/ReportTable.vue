<template>
  <div v-if="loading" class="app-skeleton h-32" />
  <p v-else-if="!rows.length" class="rounded-xl bg-canvas p-6 text-sm text-quiet">{{ empty }}</p>
  <div v-else class="overflow-x-auto rounded-xl border border-line">
    <table class="w-full min-w-[40rem] text-left text-sm">
      <thead class="app-thead">
        <tr>
          <th class="px-3 py-2">{{ firstColumn }}</th>
          <th class="px-3 py-2 text-right">Inscrits</th>
          <th class="px-3 py-2 text-right">Terminés</th>
          <th class="px-3 py-2">Achèvement</th>
          <th class="px-3 py-2 text-right">Attestations</th>
          <th v-if="showAttendance" class="px-3 py-2 text-right">Assiduité</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" class="border-t border-line" data-test="report-row">
          <td class="px-3 py-2">
            <p class="font-semibold text-ink">{{ row.label }}</p>
            <p v-if="row.sublabel" class="text-xs text-quiet">{{ row.sublabel }}</p>
          </td>
          <td class="px-3 py-2 text-right tabular-nums">{{ row.enrolled }}</td>
          <td class="px-3 py-2 text-right tabular-nums">{{ row.completed }}</td>
          <td class="px-3 py-2">
            <div class="flex items-center gap-2">
              <div
                class="h-2 w-24 overflow-hidden rounded-full bg-canvas"
                role="meter"
                :aria-valuenow="Math.round(row.rate * 100)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Achèvement ${formatPercent(row.rate)}`"
              >
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: `${row.rate * 100}%` }"
                />
              </div>
              <span class="tabular-nums text-ink">{{ formatPercent(row.rate) }}</span>
            </div>
          </td>
          <td class="px-3 py-2 text-right tabular-nums">{{ row.certificates }}</td>
          <td
            v-if="showAttendance"
            class="px-3 py-2 text-right tabular-nums"
            data-test="attendance-rate-cell"
          >
            <span
              v-if="row.attendance_rate !== null && row.attendance_rate !== undefined"
              class="font-semibold"
              :class="
                row.attendance_rate >= 0.8
                  ? 'text-primary-shade'
                  : row.attendance_rate >= 0.5
                    ? 'text-warning-ink'
                    : 'text-danger-ink'
              "
            >
              {{ formatPercent(row.attendance_rate) }}
            </span>
            <span v-else class="text-quiet text-xs">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { formatPercent } from '../composables/useAdminOperations'

export interface ReportRow {
  key: string
  label: string
  sublabel: string | null
  enrolled: number
  completed: number
  /** 0..1 */
  rate: number
  certificates: number
  attendance_rate?: number | null
  attendance_sessions_count?: number
}

defineProps<{
  loading: boolean
  rows: ReportRow[]
  firstColumn: string
  empty: string
  showAttendance?: boolean
}>()
</script>
