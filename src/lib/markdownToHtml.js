/**
 * Standalone HTML/PDF export.
 *
 * The previous implementation interpolated raw markdown into <body> and
 * replaced newlines with <br>, so "Export as HTML" produced a file that
 * displayed literal `#` characters. This renders real HTML covering the GFM
 * surface the editor exposes, then inlines self-contained styles.
 *
 * Deliberately dependency-free (no React) so it can be unit-tested in Node
 * and imported by the export dialog without pulling in the renderer.
 */
import { escapeHtml } from './storage.js'

/** Sentinel that survives inline formatting and can't appear in the source. */
const CODE_TOKEN = '\u0091MARKYCODE\u0091'

/** Inline elements: escaped first, then formatted with code spans protected. */
function renderInline(text) {
  let out = escapeHtml(text)

  // Protect code spans before any other rule touches the text.
  const codeSpans = []
  out = out.replace(/`([^`\n]+)`/g, (_, code) => {
    codeSpans.push(code)
    return `${CODE_TOKEN}${codeSpans.length - 1}${CODE_TOKEN}`
  })

  out = out
    .replace(
      /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
      (_, alt, src, title) =>
        `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy" decoding="async">`,
    )
    .replace(
      /\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
      (_, label, href, title) =>
        `<a href="${href}"${title ? ` title="${title}"` : ''}>${label}</a>`,
    )
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|\s)_([^_\n]+)_(?=$|[\s.,!?;:])/g, '$1<em>$2</em>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
    .replace(/==([^=\n]+)==/g, '<mark>$1</mark>')

  // Bare URLs become links, as GFM does.
  out = out.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    (_, prefix, url) => `${prefix}<a href="${url}">${url}</a>`,
  )

  return out.replace(
    new RegExp(`${CODE_TOKEN}(\\d+)${CODE_TOKEN}`, 'g'),
    (_, index) => `<code>${codeSpans[Number(index)]}</code>`,
  )
}

/** Splits a markdown table row into trimmed cells. */
const splitRow = (line) =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim())

/** True for the `| --- | :--: |` separator row under a table header. */
const isTableDivider = (line) => line.includes('-') && /^[|\s:-]+$/.test(line)

/** True for `---`, `***` or `___`. */
const isThematicBreak = (line) => /^([-*_])[ \t]*(\1[ \t]*){2,}$/.test(line)

/** True for lines that start a new block and so end an open paragraph. */
const startsBlock = (line) =>
  /^#{1,6}\s/.test(line) ||
  /^\s*>/.test(line) ||
  /^\s*([-*+]|\d+[.)])\s/.test(line) ||
  /^\s*(`{3,}|~{3,})/.test(line) ||
  isThematicBreak(line)

/**
 * GitHub-flavoured slug: strips accents and punctuation, lowercases and
 * hyphenates, so `## Título` anchors as `titulo`.
 */
function slugify(value) {
  return (
    String(value)
      .normalize('NFD')
      // Drop the combining marks left behind by NFD.
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'seccion'
  )
}

/** Converts markdown into an HTML fragment. */
export function markdownToHtml(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n')
  const out = []
  const usedSlugs = new Map()

  /**
   * Which list container is currently open, if any.
   *
   * Tracked explicitly rather than by inspecting the last emitted string:
   * after an <li> is pushed the tail is `</li>`, so a naive tail check would
   * start a fresh list for every item and nest them.
   */
  let openList = null

  /** Closes the open list container, if there is one. */
  const closeLists = () => {
    if (!openList) return
    out.push(`</${openList}>`)
    openList = null
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    // Fenced code block. Its contents are never parsed as markdown.
    const fence = line.match(/^\s*(`{3,}|~{3,})\s*([\w-]*)\s*$/)
    if (fence) {
      closeLists()
      const marker = fence[1][0]
      const language = fence[2]
      const body = []
      i += 1
      while (i < lines.length && !new RegExp(`^\\s*\\${marker}{3,}\\s*$`).test(lines[i])) {
        body.push(lines[i])
        i += 1
      }
      const classAttr = language ? ` class="language-${escapeHtml(language)}"` : ''
      out.push(`<pre><code${classAttr}>${escapeHtml(body.join('\n'))}</code></pre>`)
      continue
    }

    if (!line.trim()) {
      closeLists()
      continue
    }

    if (isThematicBreak(line)) {
      closeLists()
      out.push('<hr>')
      continue
    }

    // ATX heading, with a deduplicated slug for the anchor.
    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/)
    if (heading) {
      closeLists()
      const level = heading[1].length
      const label = heading[2]
      const base = slugify(label.replace(/[*_`~]/g, ''))
      const seen = usedSlugs.get(base) ?? 0
      usedSlugs.set(base, seen + 1)
      const id = seen === 0 ? base : `${base}-${seen}`
      out.push(`<h${level} id="${escapeHtml(id)}">${renderInline(label)}</h${level}>`)
      continue
    }

    // GFM table: header row plus a divider row.
    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      closeLists()
      const header = splitRow(line)
      const alignments = splitRow(lines[i + 1]).map((cell) => {
        const left = cell.startsWith(':')
        const right = cell.endsWith(':')
        if (left && right) return 'center'
        if (right) return 'right'
        if (left) return 'left'
        return ''
      })

      i += 2
      const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]))
        i += 1
      }
      i -= 1

      const head = header
        .map((cell, index) => {
          const align = alignments[index] ? ` style="text-align:${alignments[index]}"` : ''
          return `<th${align}>${renderInline(cell)}</th>`
        })
        .join('')

      const body = rows
        .map((row) => {
          const cells = header
            .map((_, index) => {
              const align = alignments[index] ? ` style="text-align:${alignments[index]}"` : ''
              return `<td${align}>${renderInline(row[index] ?? '')}</td>`
            })
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')

      out.push(
        `<table><thead><tr>${head}</tr></thead>${rows.length ? `<tbody>${body}</tbody>` : ''}</table>`,
      )
      continue
    }

    // Blockquote, gathering continuation lines and recursing.
    if (/^\s*>\s?/.test(line)) {
      closeLists()
      const quoted = [line.replace(/^\s*>\s?/, '')]
      while (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) {
        quoted.push(lines[i + 1].replace(/^\s*>\s?/, ''))
        i += 1
      }
      out.push(`<blockquote>${markdownToHtml(quoted.join('\n'))}</blockquote>`)
      continue
    }

    // GFM task-list item.
    const task = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/)
    if (task) {
      const [, , mark, rest] = task
      if (openList !== 'ul') {
        closeLists()
        out.push('<ul class="task-list">')
        openList = 'ul'
      }
      const checked = mark.toLowerCase() === 'x' ? ' checked' : ''
      out.push(
        `<li class="task-item"><input type="checkbox" disabled${checked}> ${renderInline(rest)}</li>`,
      )
      continue
    }

    // Unordered or ordered list item.
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/)
    const ordered = line.match(/^\s*(\d+)[.)]\s+(.*)$/)
    if (bullet || ordered) {
      const tag = bullet ? 'ul' : 'ol'
      // Switching between bullet and numbered starts a separate list.
      if (openList !== tag) {
        closeLists()
        out.push(`<${tag}>`)
        openList = tag
      }
      out.push(`<li>${renderInline((bullet ? bullet[1] : ordered[2]).trim())}</li>`)
      continue
    }

    closeLists()

    // Paragraph: consume lines until a blank line or a new block start.
    const paragraph = [line]
    while (i + 1 < lines.length && lines[i + 1].trim() && !startsBlock(lines[i + 1])) {
      paragraph.push(lines[i + 1])
      i += 1
    }
    // Soft line breaks inside a paragraph are preserved as newlines, which
    // HTML collapses to a space, matching GFM's default rendering.
    out.push(`<p>${renderInline(paragraph.join('\n'))}</p>`)
  }

  closeLists()
  return out.join('\n')
}

const EXPORT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: clamp(1.25rem, 5vw, 4rem) clamp(1rem, 5vw, 2rem);
    background: #ffffff;
    color: #16181d;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 "Helvetica Neue", Arial, sans-serif;
    font-size: 17px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 72ch; margin: 0 auto; }
  h1, h2, h3, h4, h5, h6 {
    color: #16181d;
    font-weight: 650;
    line-height: 1.25;
    letter-spacing: -0.015em;
    margin: 2em 0 0.6em;
    text-wrap: balance;
  }
  h1 { font-size: 2em; margin-top: 0; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.22em; }
  h4 { font-size: 1.05em; }
  p, ul, ol, blockquote, pre, table { margin: 0 0 1.1em; }
  a { color: #c2262f; text-underline-offset: 3px; }
  a:hover { text-decoration: underline; }
  strong { font-weight: 650; }
  ul, ol { padding-left: 1.5em; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  li { margin: 0.3em 0; }
  li > ul, li > ol { margin: 0.3em 0; }
  ul.task-list { list-style: none; padding-left: 0; }
  li.task-item { display: flex; gap: 0.5em; align-items: baseline; }
  blockquote {
    margin-left: 0;
    padding: 0.2em 0 0.2em 1.1em;
    border-left: 3px solid #c2262f;
    color: #55595f;
    font-style: italic;
  }
  blockquote > :last-child { margin-bottom: 0; }
  code {
    background: #f2f3f5;
    border: 1px solid #e3e5e9;
    border-radius: 4px;
    padding: 0.15em 0.35em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.87em;
  }
  pre {
    background: #f7f8fa;
    border: 1px solid #e3e5e9;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    line-height: 1.55;
  }
  pre code { background: none; border: 0; padding: 0; font-size: 0.875em; }
  hr { border: 0; border-top: 1px solid #e3e5e9; margin: 2.5em 0; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  mark { background: #fff3bf; color: inherit; padding: 0.1em 0.2em; border-radius: 3px; }
  del { color: #6b7078; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.4em 0;
    font-size: 0.94em;
    display: block;
    overflow-x: auto;
  }
  th, td { border: 1px solid #e3e5e9; padding: 0.55em 0.75em; text-align: left; }
  th { background: #f7f8fa; font-weight: 650; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  input[type="checkbox"] { margin: 0; }

  @media (prefers-color-scheme: dark) {
    body { background: #16181d; color: #e8eaed; }
    h1, h2, h3, h4, h5, h6 { color: #f2f4f7; }
    a { color: #ff8a80; }
    blockquote { color: #a8adb6; border-left-color: #ff8a80; }
    code { background: #22262e; border-color: #333842; }
    pre { background: #1b1f26; border-color: #333842; }
    hr { border-top-color: #333842; }
    mark { background: #4a3f14; color: #ffe9a8; }
    del { color: #9aa0a8; }
    th, td { border-color: #333842; }
    th { background: #1b1f26; }
    tbody tr:nth-child(even) { background: #1a1e24; }
  }

  @media print {
    body { padding: 0; background: #fff; color: #000; font-size: 12pt; }
    pre, code, th, td, blockquote { border-color: #ccc; background: #fafafa; }
    a { color: #000; }
    img { break-inside: avoid; }
    h1, h2, h3 { break-after: avoid; }
  }
`

/** Builds a complete, standalone HTML document: no external requests, no scripts. */
export function buildStandaloneHtml(markdown, fileName) {
  const title = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Documento'

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Marky">
<title>${escapeHtml(title)}</title>
<style>${EXPORT_STYLES}</style>
</head>
<body>
<main>
${markdownToHtml(markdown)}
</main>
</body>
</html>`
}

/** Strips markdown syntax down to readable plain text. */
export function markdownToPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, ''),
    )
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*\|.*\|\s*$/gm, (row) =>
      row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').join('  '),
    )
    .replace(/^\s*[-:| ]+\s*$/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^---$/gm, '---')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}