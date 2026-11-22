import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown'

describe('renderMarkdown', () => {
  it('renders the formatting trainers use in course chapters', () => {
    const html = renderMarkdown(
      [
        '## 1. Comment fonctionne une décision de routage',
        '',
        'Le routeur consulte sa table (`show ip route`) avec le **masque le plus long**.',
        '',
        '### Distance administrative',
        '- Directement connecté : **0**',
        '- OSPF : **110**',
        '',
        '```',
        'Router(config)# router ospf 1',
        '```',
      ].join('\n'),
    )
    expect(html).toContain('<h3>1. Comment fonctionne une décision de routage</h3>')
    expect(html).toContain('<code>show ip route</code>')
    expect(html).toContain('<strong>masque le plus long</strong>')
    expect(html).toContain('<h4>Distance administrative</h4>')
    expect(html).toContain('<ul><li>Directement connecté : <strong>0</strong></li>')
    expect(html).toContain('<pre><code>Router(config)# router ospf 1</code></pre>')
  })

  it('never lets HTML or scripts from the source through', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n**<b>x</b>**',
    )
    expect(html).not.toMatch(/<script|<img|<b>/)
    expect(html).toContain('&lt;script&gt;')
  })

  it('only links to http(s) URLs', () => {
    expect(renderMarkdown('[doc](https://cisco.com/a)')).toContain(
      '<a href="https://cisco.com/a" target="_blank" rel="noopener noreferrer">doc</a>',
    )
    const bad = renderMarkdown('[clic](javascript:alert(1))')
    expect(bad).not.toContain('<a ')
    expect(bad).not.toContain('href')
  })

  it('does not format inside inline code', () => {
    expect(renderMarkdown('`**pas en gras**`')).toContain('<code>**pas en gras**</code>')
  })

  it('returns an empty string for empty content', () => {
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown('')).toBe('')
  })
})
