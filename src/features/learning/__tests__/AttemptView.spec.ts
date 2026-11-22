import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import AttemptView from '../views/AttemptView.vue'
import * as assessmentsModule from '../composables/useAssessments'
import type { Attempt } from '../composables/useAssessments'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ params: { courseKey: 'crs_1', attemptKey: 'att_1' } }),
}))

const saveMutate = vi.fn()
const submitMutate = vi.fn()

vi.mock('../composables/useAssessments', async (importOriginal) => {
  const actual = await importOriginal<typeof assessmentsModule>()
  return {
    ...actual,
    useAttempt: vi.fn(),
    useSaveAnswer: vi.fn(() => ({ mutateAsync: saveMutate })),
    useSubmitAttempt: vi.fn(() => ({ mutateAsync: submitMutate, isPending: ref(false) })),
  }
})

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    key: 'att_1',
    status: 'in_progress',
    assessment: { key: 'asm_1', title: 'Quiz réseau' },
    score: null,
    max_score: 3,
    started_at: '2026-11-22T10:00:00Z',
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    submitted_at: null,
    questions: [
      {
        key: 'q_single',
        type: 'single_choice',
        prompt: 'Couche du protocole IP ?',
        points: 1,
        position: 1,
        options: [
          { key: 'o_3', body: 'Couche 3', position: 1 },
          { key: 'o_4', body: 'Couche 4', position: 2 },
        ],
        selected_option_keys: [],
        free_text_response: null,
      },
      {
        key: 'q_multi',
        type: 'multiple_choice',
        prompt: 'Protocoles de transport ?',
        points: 2,
        position: 2,
        options: [
          { key: 'o_tcp', body: 'TCP', position: 1 },
          { key: 'o_udp', body: 'UDP', position: 2 },
        ],
        selected_option_keys: ['o_tcp'],
        free_text_response: null,
      },
    ],
    ...overrides,
  }
}

function mountWith(data: Attempt) {
  vi.mocked(assessmentsModule.useAttempt).mockReturnValue({
    data: ref(data),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  } as never)
  return mount(AttemptView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('AttemptView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveMutate.mockResolvedValue({})
    submitMutate.mockResolvedValue({})
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('saves a single-choice answer as soon as it is picked', async () => {
    const wrapper = mountWith(attempt())
    await wrapper.find('#option-o_3').trigger('change')
    await flushPromises()
    expect(saveMutate).toHaveBeenCalledWith({ questionKey: 'q_single', option_keys: ['o_3'] })
    expect(wrapper.text()).toContain('2 / 2 réponse(s)')
  })

  it('adds to an existing multiple-choice selection instead of replacing it', async () => {
    const wrapper = mountWith(attempt())
    await wrapper.find('#option-o_udp').trigger('change')
    await flushPromises()
    expect(saveMutate).toHaveBeenCalledWith({
      questionKey: 'q_multi',
      option_keys: ['o_tcp', 'o_udp'],
    })
  })

  it('asks for confirmation in the page before submitting', async () => {
    const wrapper = mountWith(attempt())
    await wrapper.find('[data-test="finish"]').trigger('click')
    expect(submitMutate).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('1 question(s) sans réponse')
    await wrapper.find('[data-test="confirm-finish"]').trigger('click')
    await flushPromises()
    expect(submitMutate).toHaveBeenCalledOnce()
  })

  it('submits automatically just before the server deadline', async () => {
    vi.useFakeTimers()
    mountWith(attempt({ expires_at: new Date(Date.now() + 8_000).toISOString() }))
    await vi.advanceTimersByTimeAsync(2_000)
    expect(submitMutate).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2_000)
    expect(submitMutate).toHaveBeenCalledOnce()
  })

  it('shows the score and per-question results once submitted', () => {
    const submitted = attempt({
      status: 'submitted',
      score: 1,
      submitted_at: '2026-11-22T10:20:00Z',
    })
    submitted.questions[0]!.selected_option_keys = ['o_4']
    submitted.questions[0]!.result = {
      correct_option_keys: ['o_3'],
      explanation: 'IP opère à la couche réseau.',
      awarded_points: 0,
      is_correct: false,
      grading_note: null,
    }
    const wrapper = mountWith(submitted)
    expect(wrapper.find('[data-test="score"]').text()).toBe('1 / 3')
    expect(wrapper.text()).toContain('Réponse incorrecte')
    expect(wrapper.text()).toContain('IP opère à la couche réseau.')
    expect(wrapper.find('[data-test="finish"]').exists()).toBe(false)
    expect(
      wrapper.find<HTMLInputElement>('#option-o_3').element.closest('fieldset')!.disabled,
    ).toBe(true)
  })

  it('explains a pending manual grading instead of showing a score', () => {
    const wrapper = mountWith(attempt({ status: 'pending_grading' }))
    expect(wrapper.find('[data-test="score"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('corrigées par votre formateur')
  })
})
