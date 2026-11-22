import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import FormateurCoursDetail from '../views/FormateurCoursDetail.vue'
import * as coursesModule from '../composables/useTrainerCourses'

const reorderModulesMutateAsync = vi.fn()
const reorderChaptersMutateAsync = vi.fn()

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ params: { courseKey: 'crs_test' } }),
}))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../components/CourseAssessmentsEditor.vue', () => ({
  default: { template: '<div data-test="assessments-editor" />' },
}))

const mockCourse = {
  id: 1,
  key: 'crs_test',
  slug: 'crs_test',
  title: 'Cours Réseau',
  summary: null,
  description: null,
  level: 'beginner' as const,
  language: 'fr',
  visibility: 'public',
  status: 'draft' as const,
  pathway: { id: 1, key: 'it', code: 'IT', name: 'IT', slug: 'it' },
  created_at: '2026-11-20T10:00:00Z',
  updated_at: '2026-11-20T10:00:00Z',
}

const mockModules = [
  {
    id: 1,
    key: 'mod_1',
    title: 'Module 1',
    summary: null,
    position: 1,
    chapters: [
      {
        id: 1,
        key: 'chap_1',
        title: 'Chapitre 1.1',
        type: 'lesson' as const,
        body: null,
        duration_seconds: 100,
        preview_enabled: false,
        position: 1,
        resources: [],
      },
      {
        id: 2,
        key: 'chap_2',
        title: 'Chapitre 1.2',
        type: 'lesson' as const,
        body: null,
        duration_seconds: 100,
        preview_enabled: false,
        position: 2,
        resources: [],
      },
    ],
  },
  {
    id: 2,
    key: 'mod_2',
    title: 'Module 2',
    summary: null,
    position: 2,
    chapters: [],
  },
]

vi.mock('../composables/useTrainerCourses', async (importOriginal) => {
  const actual = await importOriginal<typeof coursesModule>()
  return {
    ...actual,
    useTrainerCourse: vi.fn(() => ({
      data: ref(mockCourse),
      isPending: ref(false),
      isError: ref(false),
    })),
    useCourseModules: vi.fn(() => ({
      data: ref(mockModules),
      isPending: ref(false),
      isError: ref(false),
    })),
    useSubmitCourse: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useRevertCourseToDraft: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useCreateModule: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useCreateChapter: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useCreateResource: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useUpdateStructureNode: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useDeleteStructureNode: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useUpdateCourse: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useAddDocumentResource: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: ref(false) })),
    useReorderModules: vi.fn(() => ({
      mutateAsync: reorderModulesMutateAsync,
      isPending: ref(false),
    })),
    useReorderChapters: vi.fn(() => ({
      mutateAsync: reorderChaptersMutateAsync,
      isPending: ref(false),
    })),
  }
})

describe('FormateurCoursDetail reordering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    reorderModulesMutateAsync.mockResolvedValue({})
    reorderChaptersMutateAsync.mockResolvedValue({})
  })

  function mountView() {
    return mount(FormateurCoursDetail, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })
  }

  it('renders reorder buttons with correct disabled states for modules', () => {
    const wrapper = mountView()
    const moveUpButtons = wrapper.findAll('[data-test="move-module-up"]')
    const moveDownButtons = wrapper.findAll('[data-test="move-module-down"]')

    expect(moveUpButtons).toHaveLength(2)
    expect(moveDownButtons).toHaveLength(2)

    // First module cannot move up
    expect(moveUpButtons[0]!.attributes('disabled')).toBeDefined()
    expect(moveDownButtons[0]!.attributes('disabled')).toBeUndefined()

    // Second module cannot move down
    expect(moveUpButtons[1]!.attributes('disabled')).toBeUndefined()
    expect(moveDownButtons[1]!.attributes('disabled')).toBeDefined()
  })

  it('triggers module reordering when move-down is clicked', async () => {
    const wrapper = mountView()
    const moveDownButtons = wrapper.findAll('[data-test="move-module-down"]')

    await moveDownButtons[0]!.trigger('click')
    await flushPromises()

    expect(reorderModulesMutateAsync).toHaveBeenCalledWith(['mod_2', 'mod_1'])
  })

  it('triggers chapter reordering when move-down is clicked on chapter 1', async () => {
    const wrapper = mountView()
    const chapterDownButtons = wrapper.findAll('[data-test="move-chapter-down"]')

    expect(chapterDownButtons).toHaveLength(2)
    await chapterDownButtons[0]!.trigger('click')
    await flushPromises()

    expect(reorderChaptersMutateAsync).toHaveBeenCalledWith({
      moduleKey: 'mod_1',
      chapterKeys: ['chap_2', 'chap_1'],
    })
  })
})
