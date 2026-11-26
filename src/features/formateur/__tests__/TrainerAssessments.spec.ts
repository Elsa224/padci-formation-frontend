import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { emptyQuestion, toPayload, validateQuestions } from '../composables/useTrainerAssessments'
import * as assessmentsModule from '../composables/useTrainerAssessments'
import { http } from '@/api/http'
import FormateurCorrections from '../views/FormateurCorrections.vue'
import CourseAssessmentsEditor from '../components/CourseAssessmentsEditor.vue'
import StructureNodeTitle from '../components/StructureNodeTitle.vue'

const gradeMutate = vi.fn()
const createMutate = vi.fn()
const updateMutate = vi.fn()
const mutation = (fn = vi.fn()) => ({ mutateAsync: fn, isPending: ref(false) })

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiMeta: vi.fn(),
  ApiError: class extends Error {},
}))

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('../composables/useTrainerAssessments', async (importOriginal) => {
  const actual = await importOriginal<typeof assessmentsModule>()
  return {
    ...actual,
    usePendingAttempts: vi.fn(),
    useGradeAnswer: vi.fn(() => mutation(gradeMutate)),
    useCourseAssessmentsAdmin: vi.fn(),
    useCreateAssessment: vi.fn(() => mutation(createMutate)),
    useUpdateAssessment: vi.fn(() => mutation(updateMutate)),
    usePublishAssessment: vi.fn(() => mutation()),
    useDeleteAssessment: vi.fn(() => mutation()),
    useScheduleExam: vi.fn(() => mutation()),
    usePublishSchedule: vi.fn(() => mutation()),
  }
})

describe('quiz validation (mirrors AssessmentAuthoring)', () => {
  it('accepts a well-formed quiz and builds the API payload', () => {
    const single = emptyQuestion('single_choice')
    single.prompt = 'Couche IP ?'
    single.options = [
      { body: '3', is_correct: true },
      { body: '4', is_correct: false },
      { body: '  ', is_correct: false }, // blank options are dropped
    ]
    const open = emptyQuestion('free_text')
    open.prompt = 'Expliquez DNS.'
    open.points = 3

    expect(validateQuestions([single, open])).toEqual([])
    const payload = toPayload(' Quiz 1 ', 20, 2, [single, open])
    expect(payload.title).toBe('Quiz 1')
    expect(payload.settings).toEqual({ duration_minutes: 20, max_attempts: 2 })
    expect(payload.questions[0]!.options).toHaveLength(2)
    expect(payload.questions[1]).not.toHaveProperty('options')
  })

  it('reports the server rules before sending', () => {
    const noCorrect = emptyQuestion('single_choice')
    noCorrect.prompt = 'Q'
    noCorrect.options = [
      { body: 'a', is_correct: false },
      { body: 'b', is_correct: false },
    ]
    const twoCorrect = emptyQuestion('true_false')
    twoCorrect.prompt = 'Q'
    twoCorrect.options.forEach((option) => (option.is_correct = true))
    const empty = emptyQuestion('multiple_choice')

    const errors = validateQuestions([noCorrect, twoCorrect, empty])
    expect(errors).toContain('Question 1 : indiquez la bonne réponse.')
    expect(errors).toContain('Question 2 : une seule bonne réponse pour ce type.')
    expect(errors).toContain("Question 3 : l'énoncé est vide.")
    expect(validateQuestions([])).toContain('Ajoutez au moins une question.')
  })
})

describe('FormateurCorrections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assessmentsModule.usePendingAttempts).mockReturnValue({
      data: ref({
        items: [
          {
            key: 'att_1',
            status: 'pending_grading',
            submitted_at: '2026-11-22T10:00:00Z',
            assessment: { key: 'asm_1', title: 'Quiz réseau' },
            course: { key: 'crs_1', title: 'IT Support' },
            learner: { key: 'usr_1', name: 'Aya Diomandé' },
            pending_answers: [
              {
                answer_key: 'ans_1',
                question_key: 'q_1',
                question_prompt: 'Expliquez DNS.',
                question_points: 5,
                question_position: 1,
                response: 'Résolution de noms.',
              },
            ],
          },
        ],
        total: 1,
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)
  })

  it('shows the question and the learner response, then grades it', async () => {
    gradeMutate.mockResolvedValue({})
    const wrapper = mount(FormateurCorrections)
    expect(wrapper.text()).toContain('Expliquez DNS.')
    expect(wrapper.find('[data-test="learner-response"]').text()).toBe('Résolution de noms.')

    await wrapper.find('#points-ans_1').setValue(4)
    await wrapper.find('#note-ans_1').setValue('Bien.')
    await wrapper.find('[data-test="pending-answer"]').trigger('submit')
    await flushPromises()
    expect(gradeMutate).toHaveBeenCalledWith({
      attemptKey: 'att_1',
      answerKey: 'ans_1',
      awarded_points: 4,
      note: 'Bien.',
    })
  })

  it('refuses more points than the question is worth', async () => {
    const wrapper = mount(FormateurCorrections)
    await wrapper.find('#points-ans_1').setValue(9)
    await wrapper.find('[data-test="pending-answer"]').trigger('submit')
    await flushPromises()
    expect(gradeMutate).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('entre 0 et 5')
  })
})

describe('CourseAssessmentsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assessmentsModule.useCourseAssessmentsAdmin).mockReturnValue({
      data: ref([]),
      isPending: ref(false),
    } as never)
  })

  it('builds a quiz and creates it as a draft', async () => {
    createMutate.mockResolvedValue({ key: 'asm_new' })
    const wrapper = mount(CourseAssessmentsEditor, {
      props: { courseKey: 'crs_1', editable: true },
    })
    await wrapper.find('[data-test="open-builder"]').trigger('click')
    await wrapper.find('#quiz-title').setValue('Quiz 1')
    await wrapper.find('#q-0-prompt').setValue('Couche IP ?')
    await wrapper.find('#q-0-o-0').setValue('3')
    await wrapper.find('#q-0-o-1').setValue('4')
    await wrapper.find('[data-test="assessment-builder"]').trigger('submit')
    await flushPromises()

    expect(createMutate).toHaveBeenCalledOnce()
    const payload = createMutate.mock.calls[0]![0]
    expect(payload.title).toBe('Quiz 1')
    expect(payload.questions[0].options).toEqual([
      { body: '3', is_correct: true },
      { body: '4', is_correct: false },
    ])
  })

  it('blocks an invalid quiz with the reasons', async () => {
    const wrapper = mount(CourseAssessmentsEditor, {
      props: { courseKey: 'crs_1', editable: true },
    })
    await wrapper.find('[data-test="open-builder"]').trigger('click')
    await wrapper.find('[data-test="assessment-builder"]').trigger('submit')
    await flushPromises()
    expect(createMutate).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="draft-errors"]').text()).toContain('Donnez un titre')
  })

  it('offers no quiz creation once the course is published', () => {
    const wrapper = mount(CourseAssessmentsEditor, {
      props: { courseKey: 'crs_1', editable: false },
    })
    expect(wrapper.find('[data-test="open-builder"]').exists()).toBe(false)
  })

  it('opens builder with loaded data when Modifier is clicked on a draft quiz and submits update', async () => {
    vi.mocked(assessmentsModule.useCourseAssessmentsAdmin).mockReturnValue({
      data: ref([
        {
          key: 'asm_1',
          title: 'Quiz Réseau Ancien',
          version: 1,
          status: 'draft',
          settings: { duration_minutes: 25, max_attempts: 2 },
          scheduled_at: null,
          delivery_mode: 'online',
          location: null,
          schedule_published_at: null,
          questions_count: 1,
        },
      ]),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as unknown as ReturnType<typeof assessmentsModule.useCourseAssessmentsAdmin>)

    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        key: 'asm_1',
        title: 'Quiz Réseau Ancien',
        version: 1,
        status: 'draft',
        settings: { duration_minutes: 25, max_attempts: 2 },
        scheduled_at: null,
        delivery_mode: 'online',
        location: null,
        schedule_published_at: null,
        questions: [
          {
            key: 'q_1',
            type: 'single_choice',
            prompt: 'Protocole web ?',
            points: 2,
            explanation: 'HTTP est le protocole.',
            position: 1,
            options: [
              { key: 'o_1', body: 'HTTP', is_correct: true, position: 1 },
              { key: 'o_2', body: 'FTP', is_correct: false, position: 2 },
            ],
          },
        ],
      },
    })

    const wrapper = mount(CourseAssessmentsEditor, {
      props: { courseKey: 'crs_1', editable: true },
    })

    const editBtn = wrapper.find('[data-test="edit-assessment"]')
    expect(editBtn.exists()).toBe(true)

    await editBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="assessment-builder"]').exists()).toBe(true)
    expect((wrapper.find('#quiz-title').element as HTMLInputElement).value).toBe(
      'Quiz Réseau Ancien',
    )
    expect((wrapper.find('#q-0-prompt').element as HTMLInputElement).value).toBe('Protocole web ?')

    await wrapper.find('#quiz-title').setValue('Quiz Réseau Mis à jour')
    await wrapper.find('[data-test="assessment-builder"]').trigger('submit')
    await flushPromises()

    expect(updateMutate).toHaveBeenCalledOnce()
    const callArgs = updateMutate.mock.calls[0]![0]
    expect(callArgs.assessmentKey).toBe('asm_1')
    expect(callArgs.title).toBe('Quiz Réseau Mis à jour')
    expect(callArgs.settings).toEqual({ duration_minutes: 25, max_attempts: 2 })
  })
})

describe('StructureNodeTitle', () => {
  it('renames inline and deletes only after an in-page confirmation', async () => {
    const wrapper = mount(StructureNodeTitle, {
      props: { nodeKey: 'mod_1', title: 'Module 1', editable: true },
    })
    await wrapper.find('[data-test="rename"]').trigger('click')
    await wrapper.find('#rename-mod_1').setValue('Introduction')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('rename')).toEqual([['Introduction']])

    await wrapper.find('[data-test="delete"]').trigger('click')
    expect(wrapper.emitted('delete')).toBeUndefined()
    await wrapper.find('[data-test="confirm-delete"]').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('shows no controls when the course is not editable', () => {
    const wrapper = mount(StructureNodeTitle, {
      props: { nodeKey: 'mod_1', title: 'Module 1', editable: false },
    })
    expect(wrapper.find('[data-test="rename"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(false)
  })
})
