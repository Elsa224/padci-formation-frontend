/**
 * Minimal, safe Markdown → HTML for course content written by trainers.
 *
 * Safety by construction: the whole source is HTML-escaped FIRST, then a
 * small subset of Markdown is turned into a fixed set of tags. No raw HTML
 * from the source can survive, and links are only emitted for http(s) URLs.
 * Supported: #-#### headings, paragraphs, line breaks, **bold**, *italic*,
 * `inline code`, ``` fenced code ```, - / * / 1. lists, > quotes, --- rules,
 * [text](https://…) links.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

/** Inline formatting on an already-escaped line. */
function inline(escaped: string): string {
  const codes: string[] = []
  // Protect inline code first so its content is not formatted.
  let out = escaped.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code)
    return `\uE000${codes.length - 1}\uE000`
  })
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
  return out.replace(/\uE000(\d+)\uE000/g, (_m, i: string) => `<code>${codes[Number(i)]}</code>`)
}

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return ''
  const lines = escapeHtml(source.replace(/\r\n?/g, '\n')).split('\n')
  const html: string[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let quote: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map(inline).join('<br>')}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (list) {
      const tag = list.ordered ? 'ol' : 'ul'
      html.push(`<${tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`)
    }
    list = null
  }
  const flushQuote = () => {
    if (quote.length) html.push(`<blockquote>${quote.map(inline).join('<br>')}</blockquote>`)
    quote = []
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
    flushQuote()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''

    if (line.trim().startsWith('```')) {
      flushAll()
      const code: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        code.push(lines[i] ?? '')
        i++
      }
      html.push(`<pre><code>${code.join('\n')}</code></pre>`)
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      // Course headings start at h2: the chapter title is the page's h1.
      const level = Math.min(heading[1]!.length + 1, 5)
      html.push(`<h${level}>${inline(heading[2] ?? '')}</h${level}>`)
      continue
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushAll()
      html.push('<hr>')
      continue
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (bullet || numbered) {
      flushParagraph()
      flushQuote()
      const ordered = Boolean(numbered)
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push((bullet ?? numbered)![1] ?? '')
      continue
    }

    const quoted = /^&gt;\s?(.*)$/.exec(line)
    if (quoted) {
      flushParagraph()
      flushList()
      quote.push(quoted[1] ?? '')
      continue
    }

    if (line.trim() === '') {
      flushAll()
      continue
    }

    flushList()
    flushQuote()
    paragraph.push(line.trim())
  }
  flushAll()
  return html.join('\n')
}
