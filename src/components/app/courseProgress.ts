import type {
  CourseOutline,
  OutlineChapter,
} from '@/features/learning/composables/useLearningCourse'

export interface CourseProgressSummary {
  completed: number
  total: number
  /** 0..1 */
  ratio: number
  /** Where "Continuer" should lead: the resume point, else the first unfinished chapter. */
  next: { key: string; title: string } | null
}

/** Progress of a course from its outline (chapters marked completed by the API). */
export function courseProgress(outline: CourseOutline | null | undefined): CourseProgressSummary {
  const chapters: OutlineChapter[] = outline?.modules.flatMap((module) => module.chapters) ?? []
  const completed = chapters.filter((chapter) => chapter.progress?.status === 'completed').length
  const total = chapters.length
  const resume = outline?.resume
  const firstOpen = chapters.find(
    (chapter) => !chapter.locked && chapter.progress?.status !== 'completed',
  )
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
    next: resume
      ? { key: resume.chapter_key, title: resume.chapter_title }
      : firstOpen
        ? { key: firstOpen.key, title: firstOpen.title }
        : null,
  }
}
