import { useQuery } from '@tanstack/vue-query'
import { http } from '@/api/http'
import type { components } from '@/api/schema'

export type LearnerAttendance = components['schemas']['LearnerAttendanceResource']
export type LearnerAttendanceItem = components['schemas']['LearnerAttendanceItemResource']

export function useLearnerAttendance() {
  return useQuery<LearnerAttendance>({
    queryKey: ['learner-attendance'],
    queryFn: async () => {
      const response = await http.get<LearnerAttendance>('/learning/attendance')
      return response.data
    },
  })
}
