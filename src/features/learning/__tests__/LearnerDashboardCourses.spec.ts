import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LearnerDashboard from '../views/LearnerDashboard.vue'
import * as useEnrollmentsModule from '../composables/useEnrollments'
import * as useLearnerApplicationsModule from '@/features/admissions/composables/useLearnerApplications'

vi.mock('../components/ResumeCourseHero.vue', () => ({
  default: { template: '<div data-test="resume-hero-stub" />' },
}))
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({})),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('../composables/useEnrollments', () => ({ useEnrollments: vi.fn() }))
vi.mock('../composables/useLearnerAttendance', () => ({
  useLearnerAttendance: vi.fn(() => ({
    data: ref({ summary: null, items: [] }),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
  })),
}))
vi.mock('@/features/admissions/composables/useLearnerApplications', () => ({
  useLearnerApplications: vi.fn(),
}))

const cyber = {
  id: 1,
  key: 'cht_cyber',
  code: 'CY-1',
  name: 'Cohorte Cyber 2026-1',
  session: 'Mars 2026',
  status: 'running',
  starts_at: null,
}
const netspec = {
  id: 2,
  key: 'cht_net',
  code: 'NS-1',
  name: 'Network Specialist — Session 1',
  session: 'Session 1',
  status: 'running',
  starts_at: null,
}

function enrollment(key: string, title: string, cohort: typeof cyber, status = 'active') {
  return {
    id: key.length,
    key,
    status,
    cohort,
    course: { id: key.length, key: `crs_${key}`, slug: key, title, status: 'published' },
    created_at: '2026-11-01T10:00:00Z',
  }
}

function mountWith(items: unknown[]) {
  vi.mocked(useEnrollmentsModule.useEnrollments).mockReturnValue({
    data: ref({ items }),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
  } as never)
  vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
    data: ref({ items: [] }),
  } as never)
  return mount(LearnerDashboard)
}

describe('LearnerDashboard — Mes cours', () => {
  beforeEach(() => vi.clearAllMocks())

  it('groups courses by cohort and names each cohort only once', () => {
    const wrapper = mountWith([
      enrollment('a', 'Sécurité des Réseaux et Cryptographie', cyber),
      enrollment('b', 'Introduction à la Cybersécurité', cyber),
      enrollment('c', 'Protocoles de Routage IP', netspec),
    ])
    const groups = wrapper.findAll('[data-test="course-group"]')
    expect(groups).toHaveLength(2)
    expect(groups[0]!.text()).toContain('Cohorte Cyber 2026-1')
    expect(groups[0]!.findAll('li')).toHaveLength(2)
    expect(groups[1]!.text()).toContain('Network Specialist — Session 1')
    const text = wrapper.find('#courses-title').element.parentElement!.textContent ?? ''
    expect(text.split('Cohorte Cyber 2026-1')).toHaveLength(2)
  })

  it('drops the noise: no « En cours », no session label, no « Cohorte : » prefix', () => {
    const wrapper = mountWith([enrollment('a', 'Introduction à la Cybersécurité', cyber)])
    const courses = wrapper.find('[data-test="course-group"]').text()
    expect(courses).not.toContain('En cours')
    expect(courses).not.toContain('Mars 2026')
    expect(courses).not.toContain('Cohorte :')
  })

  it('still flags an unusual status', () => {
    const wrapper = mountWith([
      enrollment('a', 'Introduction à la Cybersécurité', cyber, 'suspended'),
    ])
    expect(wrapper.find('[data-test="course-group"]').text()).toContain('Suspendu')
  })

  it('hides the « Rentrée le » card once courses are open', () => {
    const wrapper = mountWith([enrollment('a', 'Introduction à la Cybersécurité', cyber)])
    expect(wrapper.find('[data-testid="cohort-status-card"]').exists()).toBe(false)
  })
})
