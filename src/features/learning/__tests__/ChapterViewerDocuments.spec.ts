import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ChapterViewer from '../views/ChapterViewer.vue'
import * as learningModule from '../composables/useLearningCourse'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { courseKey: 'crs_1', chapterKey: 'cha_1' } })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('../composables/useLearningCourse', () => ({
  useCourseOutline: vi.fn(),
  useChapterContent: vi.fn(),
  useRecordProgress: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
}))

const pdf = (url: string | null, locked = false) => ({
  id: 1,
  key: 'res_pdf',
  title: 'Journée 1',
  type: 'document',
  visibility: 'enrolled',
  position: 1,
  locked,
  body: null,
  external_url: null,
  media: locked
    ? null
    : {
        key: 'med_1',
        original_name: 'ITSupport_Jour1.pdf',
        mime: 'application/pdf',
        size_bytes: 465901,
        scan_status: 'clean',
        url,
      },
})

const chapter = (resources: unknown[]) => ({
  id: 1,
  key: 'cha_1',
  title: 'Journée 1',
  type: 'lesson',
  body: 'Contenu',
  duration_seconds: null,
  position: 1,
  resources,
})

describe('ChapterViewer documents', () => {
  const refetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(learningModule.useCourseOutline).mockReturnValue({
      data: ref({ modules: [] }),
    } as never)
  })

  function mockChapter(resources: unknown[]) {
    vi.mocked(learningModule.useChapterContent).mockReturnValue({
      data: ref(chapter(resources)),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch,
    } as never)
  }

  it('opens the PDF inline with a freshly signed URL, not the one from page load', async () => {
    mockChapter([pdf('https://api.test/media/med_1/content?signature=old')])
    refetch.mockResolvedValue({
      data: chapter([pdf('https://api.test/media/med_1/content?signature=fresh')]),
    })

    const wrapper = mount(ChapterViewer)
    expect(wrapper.find('[data-test="pdf-viewer"]').exists()).toBe(false)

    await wrapper.find('[data-test="toggle-pdf"]').trigger('click')
    await flushPromises()

    expect(refetch).toHaveBeenCalled()
    const viewer = wrapper.find('[data-test="pdf-viewer"]')
    expect(viewer.exists()).toBe(true)
    expect(viewer.attributes('src')).toContain('signature=fresh')
  })

  it('shows a locked document without any file link', () => {
    mockChapter([pdf(null, true)])
    const wrapper = mount(ChapterViewer)
    const resource = wrapper.find('[data-test="chapter-resource"]')
    expect(resource.text()).toContain('Verrouillé')
    expect(wrapper.find('[data-test="toggle-pdf"]').exists()).toBe(false)
  })

  it('never renders a javascript: link', () => {
    mockChapter([
      {
        ...pdf(null, false),
        type: 'link',
        media: null,
        external_url: 'javascript:alert(1)',
      },
    ])
    const wrapper = mount(ChapterViewer)
    expect(wrapper.find('a[href^="javascript"]').exists()).toBe(false)
  })
})
