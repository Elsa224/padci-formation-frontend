import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import CohortAttendanceModal from '../components/CohortAttendanceModal.vue'
import * as attendanceModule from '@/features/admin/composables/useCohortAttendance'

vi.mock('@lucide/vue', () => ({
  Plus: { template: '<span data-test="plus-icon" />' },
  Trash2: { template: '<span data-test="trash-icon" />' },
  X: { template: '<span data-test="x-icon" />' },
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CohortAttendanceModal', () => {
  const mockSessions = [
    {
      key: 'ses-1',
      date: '2026-11-20',
      title: 'Séance 1 - Introduction aux réseaux',
      starts_at_time: '09:00',
      ends_at_time: '17:00',
      stats: {
        total: 2,
        present: 1,
        late: 1,
        absent: 0,
        excused: 0,
        rate: 100,
      },
    },
    {
      key: 'ses-2',
      date: '2026-11-20',
      title: 'Séance 2 - Pratique câblage',
      starts_at_time: '14:00',
      ends_at_time: null,
      stats: {
        total: 2,
        present: 2,
        late: 0,
        absent: 0,
        excused: 0,
        rate: 100,
      },
    },
  ]

  const mockSessionDetail = {
    key: 'ses-1',
    date: '2026-11-20',
    title: 'Séance 1 - Introduction aux réseaux',
    starts_at_time: '09:00',
    ends_at_time: '17:00',
    attendances: [
      {
        key: 'att-1',
        status: 'present',
        status_label: 'Présent',
        note: null,
        learner: {
          key: 'usr-1',
          name: 'Alice Martin',
          email: 'alice@example.com',
        },
      },
      {
        key: 'att-2',
        status: 'late',
        status_label: 'En retard',
        note: 'Train en retard',
        learner: {
          key: 'usr-2',
          name: 'Bob Dupont',
          email: 'bob@example.com',
        },
      },
    ],
  }

  const mockSummary = {
    cohort_key: 'cht-1',
    total_sessions: 2,
    learners: [
      {
        enrollment_key: 'enr-1',
        learner: {
          key: 'usr-1',
          name: 'Alice Martin',
          email: 'alice@example.com',
        },
        total_sessions: 2,
        present: 2,
        absent: 0,
        late: 0,
        excused: 0,
        rate: 100,
      },
      {
        enrollment_key: 'enr-2',
        learner: {
          key: 'usr-2',
          name: 'Bob Dupont',
          email: 'bob@example.com',
        },
        total_sessions: 2,
        present: 1,
        absent: 1,
        late: 0,
        excused: 0,
        rate: 50,
      },
    ],
  }

  const mockMutateCreate = vi.fn().mockResolvedValue({ key: 'ses-new' })
  const mockMutateUpdateBatch = vi.fn().mockResolvedValue({})
  const mockMutateDelete = vi.fn().mockResolvedValue({})

  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(attendanceModule, 'useCohortAttendanceSessions').mockReturnValue({
      data: ref(mockSessions),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof attendanceModule.useCohortAttendanceSessions>)

    vi.spyOn(attendanceModule, 'useCohortAttendanceSessionDetail').mockReturnValue({
      data: ref(mockSessionDetail),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof attendanceModule.useCohortAttendanceSessionDetail>)

    vi.spyOn(attendanceModule, 'useCohortAttendanceSummary').mockReturnValue({
      data: ref(mockSummary),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof attendanceModule.useCohortAttendanceSummary>)

    vi.spyOn(attendanceModule, 'useCreateAttendanceSession').mockReturnValue({
      mutateAsync: mockMutateCreate,
      isPending: ref(false),
    } as unknown as ReturnType<typeof attendanceModule.useCreateAttendanceSession>)

    vi.spyOn(attendanceModule, 'useUpdateAttendanceBatch').mockReturnValue({
      mutateAsync: mockMutateUpdateBatch,
      isPending: ref(false),
    } as unknown as ReturnType<typeof attendanceModule.useUpdateAttendanceBatch>)

    vi.spyOn(attendanceModule, 'useDeleteAttendanceSession').mockReturnValue({
      mutateAsync: mockMutateDelete,
      isPending: ref(false),
    } as unknown as ReturnType<typeof attendanceModule.useDeleteAttendanceSession>)
  })

  it('renders modal when open is true, hides when false', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    expect(wrapper.find('[data-test="attendance-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Feuille de présence — Promotion 2026 Network')

    await wrapper.setProps({ open: false })
    expect(wrapper.find('[data-test="attendance-modal"]').exists()).toBe(false)
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    const closeBtn = wrapper.find('[data-test="close-modal"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('switches between Sessions tab and Summary tab', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    // Initial tab is sessions
    const sessionItems = wrapper.findAll('[data-test="session-item"]')
    expect(sessionItems.length).toBe(2)
    expect(wrapper.text()).toContain('Séance 1 - Introduction aux réseaux')
    expect(wrapper.text()).toContain('Séance 2 - Pratique câblage')

    const times = wrapper.findAll('[data-test="session-time"]')
    expect(times[0]!.text()).toBe('09:00 - 17:00')
    expect(times[1]!.text()).toBe('14:00')

    // Switch to summary tab
    const summaryTab = wrapper.find('[data-test="tab-summary"]')
    await summaryTab.trigger('click')

    expect(wrapper.find('[data-test="attendance-summary-view"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("Taux d'assiduité")
    expect(wrapper.text()).toContain('Alice Martin')
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.text()).toContain('Bob Dupont')
    expect(wrapper.text()).toContain('50%')
  })

  it('opens new session form and creates session', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    const openCreateBtn = wrapper.find('[data-test="open-new-session-btn"]')
    await openCreateBtn.trigger('click')

    expect(wrapper.find('[data-test="new-session-form"]').exists()).toBe(true)

    const dateInput = wrapper.find('[data-test="new-session-date"]')
    await dateInput.setValue('2026-11-25')

    const titleInput = wrapper.find('[data-test="new-session-title"]')
    await titleInput.setValue('Atelier Pratique Routage')

    const form = wrapper.find('[data-test="new-session-form"] form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(mockMutateCreate).toHaveBeenCalledWith({
      date: '2026-11-25',
      title: 'Atelier Pratique Routage',
      starts_at_time: '09:00',
      ends_at_time: '17:00',
    })
  })

  it('fails validation when starts_at_time is empty in creation form', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    const openCreateBtn = wrapper.find('[data-test="open-new-session-btn"]')
    await openCreateBtn.trigger('click')

    const dateInput = wrapper.find('[data-test="new-session-date"]')
    await dateInput.setValue('2026-11-25')

    const startsAtInput = wrapper.find('[data-test="new-session-starts-at"]')
    await startsAtInput.setValue('')

    const form = wrapper.find('[data-test="new-session-form"] form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(mockMutateCreate).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain("L'horaire de début est obligatoire.")
  })

  it('opens attendance sheet, allows changing status and submitting batch', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    // Click on session pointage button
    const openSheetBtn = wrapper.find('[data-test="open-session-sheet-btn"]')
    await openSheetBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="attendance-sheet"]').exists()).toBe(true)
    const rows = wrapper.findAll('[data-test="attendance-row"]')
    expect(rows.length).toBe(2)

    // Check learner rows
    expect(wrapper.text()).toContain('Alice Martin')
    expect(wrapper.text()).toContain('Bob Dupont')

    // Change Alice status to late
    const lateBtnAlice = wrapper.find('[data-test="status-btn-late-att-1"]')
    await lateBtnAlice.trigger('click')

    // Submit batch
    const form = wrapper.find('[data-test="attendance-sheet"] form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(mockMutateUpdateBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        attendances: expect.arrayContaining([
          expect.objectContaining({
            key: 'att-1',
            status: 'late',
          }),
        ]),
      }),
    )
  })

  it('deletes a session only after clicking "Confirmer"', async () => {
    const wrapper = mount(CohortAttendanceModal, {
      props: {
        open: true,
        cohortKey: 'cht-1',
        cohortName: 'Promotion 2026 Network',
      },
    })

    const deleteBtn = wrapper.find('[data-test="delete-session-btn"]')
    expect(deleteBtn.exists()).toBe(true)

    // Click on initial delete button to reveal confirmation prompt
    await deleteBtn.find('[data-test="confirm-button"]').trigger('click')
    await flushPromises()

    // Deletion must NOT be called before clicking "Confirmer"
    expect(mockMutateDelete).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="confirm-yes"]').exists()).toBe(true)

    // Click confirm
    await wrapper.find('[data-test="confirm-yes"]').trigger('click')
    await flushPromises()

    expect(mockMutateDelete).toHaveBeenCalledWith('ses-1')
  })
})
