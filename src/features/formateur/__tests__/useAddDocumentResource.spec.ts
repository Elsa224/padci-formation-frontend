import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http } from '@/api/http'
import { useAddDocumentResource } from '../composables/useTrainerCourses'

vi.mock('@/api/http', () => ({
  http: { post: vi.fn(), get: vi.fn() },
  apiMeta: vi.fn(),
  ApiError: class extends Error {},
}))

describe('useAddDocumentResource', () => {
  it('uploads the file privately, then attaches it as a document resource', async () => {
    vi.mocked(http.post)
      .mockResolvedValueOnce({ data: { key: 'med_123' } })
      .mockResolvedValueOnce({ data: { key: 'res_1', type: 'document' } })

    let mutation!: ReturnType<typeof useAddDocumentResource>
    mount(
      defineComponent({
        setup() {
          mutation = useAddDocumentResource('crs_1')
          return () => null
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] } },
    )

    const file = new File(['%PDF-1.4'], 'jour1.pdf', { type: 'application/pdf' })
    await mutation.mutateAsync({ moduleKey: 'mod_1', chapterKey: 'cha_1', title: 'Jour 1', file })

    const [uploadUrl, uploadBody] = vi.mocked(http.post).mock.calls[0]!
    expect(uploadUrl).toBe('/media')
    expect((uploadBody as FormData).get('file')).toBe(file)

    expect(vi.mocked(http.post).mock.calls[1]).toEqual([
      '/admin/courses/crs_1/modules/mod_1/chapters/cha_1/resources',
      { title: 'Jour 1', type: 'document', media_key: 'med_123' },
    ])
  })
})
