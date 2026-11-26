import { describe, it, expect } from 'vitest'
import { selectUpcomingCohorts } from '../composables/useTrainerOverview'
import { safeHttpUrl } from '../composables/useTrainerCourses'
import type { Cohort } from '@/features/admin/composables/useCohorts'

const cohort = (key: string, starts_at: string | null, status: Cohort['status'] = 'open') =>
  ({ id: 1, key, code: key, name: key, starts_at, status }) as Cohort

describe('selectUpcomingCohorts', () => {
  const now = new Date(2026, 10, 22, 15, 0) // 22 Nov 2026, local time

  it('drops cohorts that already started and sorts the rest soonest first', () => {
    const result = selectUpcomingCohorts(
      [
        cohort('started-in-march', '2026-03-01'),
        cohort('next-year', '2027-01-10', 'planned'),
        cohort('today', '2026-11-22'),
        cohort('next-week', '2026-11-29T08:00:00+00:00', 'planned'),
        cohort('undated', null),
      ],
      now,
    )
    expect(result.map((c) => c.key)).toEqual(['today', 'next-week', 'next-year'])
  })

  it('keeps at most the requested number of sessions', () => {
    const many = Array.from({ length: 8 }, (_, i) => cohort(`c${i}`, `2026-12-0${i + 1}`))
    expect(selectUpcomingCohorts(many, now, 5)).toHaveLength(5)
  })
})

describe('safeHttpUrl', () => {
  it('accepts http and https links', () => {
    expect(safeHttpUrl('https://example.org/doc.pdf')).toBe('https://example.org/doc.pdf')
    expect(safeHttpUrl('http://example.org')).toBe('http://example.org/')
  })

  it('rejects script, data and malformed URLs', () => {
    expect(safeHttpUrl('javascript:alert(document.cookie)')).toBeNull()
    expect(safeHttpUrl('JaVaScRiPt:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHttpUrl('not a url')).toBeNull()
    expect(safeHttpUrl(null)).toBeNull()
  })
})
