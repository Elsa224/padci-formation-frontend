import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import FormateurCours from '../views/FormateurCours.vue'
import * as coursesModule from '../composables/useTrainerCourses'
import * as pathwaysModule from '@/features/public/composables/useCatalogPathways'

const push = vi.fn()
const createMutateAsync = vi.fn()
const submitMutateAsync = vi.fn()

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('@/features/public/composables/useCatalogPathways', () => ({
  useCatalogPathways: vi.fn(),
}))
vi.mock('../composables/useTrainerCourses', async (importOriginal) => {
  const actual = await importOriginal<typeof coursesModule>()
  return {
    ...actual,
    useTrainerCourses: vi.fn(),
    useCreateCourse: vi.fn(() => ({ mutateAsync: createMutateAsync, isPending: ref(false) })),
    useSubmitCourse: vi.fn(() => ({ mutateAsync: submitMutateAsync, isPending: ref(false) })),
  }
})

const course = (key: string, status: coursesModule.CourseStatus) => ({
  id: 1,
  key,
  slug: key,
  title: `Cours ${key}`,
  summary: null,
  description: null,
  level: 'beginner' as const,
  language: 'fr',
  visibility: 'public',
  status,
  pathway: { id: 1, key: 'it-support', code: 'ITS', name: 'IT Support', slug: 'it-support' },
  created_at: '2026-11-20T10:00:00Z',
  updated_at: '2026-11-20T10:00:00Z',
})

function mountView() {
  return mount(FormateurCours, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('FormateurCours', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pathwaysModule.useCatalogPathways).mockReturnValue({
      data: ref([{ key: 'it-support', name: 'IT Support' }]),
    } as never)
    vi.mocked(coursesModule.useTrainerCourses).mockReturnValue({
      data: ref({
        items: [course('crs_a', 'draft'), course('crs_b', 'published')],
        pagination: null,
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    } as never)
  })

  it('lists the trainer courses with their status and offers submit only when editable', async () => {
    const wrapper = mountView()
    await flushPromises()

    const cards = wrapper.findAll('[data-test="course-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.text()).toContain('Brouillon')
    expect(cards[0]!.text()).toContain('Soumettre')
    expect(cards[1]!.text()).toContain('Publié')
    expect(cards[1]!.text()).not.toContain('Soumettre')
  })

  it('creates a draft course and opens its editor', async () => {
    createMutateAsync.mockResolvedValue(course('crs_new', 'draft'))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('button.app-action-primary').trigger('click')
    await wrapper.find('input[required]').setValue('Réseaux de base')
    await wrapper.find('select[required]').setValue('it-support')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Réseaux de base', pathway_key: 'it-support' }),
    )
    expect(push).toHaveBeenCalledWith('/formateur/cours/crs_new')
  })
})
