/**
 * Markdown text transforms used by the toolbar, keyboard shortcuts and the
 * command palette. Every function is pure: it takes the current text plus a
 * selection and returns the next text, the next selection and, optionally,
 * the text to scroll the caret into view.
 */

/** Clamp helper that tolerates out-of-range indices. */
const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

/** Expands [start, end] to cover whole lines. */
export function expandToLines(text, start, end) {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  let lineEnd = text.indexOf('\n', end)
  if (lineEnd === -1) lineEnd = text.length
  return { start: lineStart, end: lineEnd }
}

/** Returns the text of the lines touched by the selection. */
function selectedLines(text, start, end) {
  const { start: from, end: to } = expandToLines(text, start, end)
  return { from, to, value: text.slice(from, to) }
}

/**
 * Wraps or unwraps the selection in a marker such as `**` or `` ` ``.
 * With no selection, inserts the marker pair and places the caret between.
 */
export function toggleWrap(text, start, end, marker, placeholder = '') {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const alreadyWrapped =
    before.endsWith(marker) && after.startsWith(marker)

  if (alreadyWrapped) {
    return {
      text: before.slice(0, -marker.length) + selected + after.slice(marker.length),
      start: start - marker.length,
      end: end - marker.length,
    }
  }

  const inner = selected || placeholder
  return {
    text: `${before}${marker}${inner}${marker}${after}`,
    start: start + marker.length,
    end: start + marker.length + inner.length,
  }
}

/**
 * Prefixes every selected line, removing the prefix when all of the lines
 * already carry it (so pressing the same toolbar button twice is a no-op).
 */
export function toggleLinePrefix(text, start, end, prefix, { matchAll = true } = {}) {
  const { from, to, value } = selectedLines(text, start, end)
  const lines = value.split('\n')

  const allPrefixed = lines.every((line) => line.startsWith(prefix))
  const shouldRemove = allPrefixed || (!matchAll && lines.some((l) => l.startsWith(prefix)))

  const next = lines
    .map((line) => {
      if (shouldRemove) {
        return line.startsWith(prefix) ? line.slice(prefix.length) : line
      }
      // Preserve leading indentation when adding a prefix.
      const indent = line.match(/^\s*/)[0]
      return `${indent}${prefix}${line.slice(indent.length)}`
    })
    .join('\n')

  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length }
}

/** Prefixes only the lines that are actually part of the selection. */
export function toggleList(text, start, end, ordered) {
  return toggleLinePrefix(text, start, end, ordered ? '1. ' : '- ')
}

/** Replaces the fence language on a fenced code block, or inserts one. */
export function toggleCodeBlock(text, start, end) {
  const { from, to, value } = selectedLines(text, start, end)

  if (/^```[\w-]*\n[\s\S]*?\n?```$/.test(value.trim())) {
    const inner = value.trim().replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, '')
    return { text: text.slice(0, from) + inner + text.slice(to), start: from, end: from + inner.length }
  }

  const body = value || ''
  const block = `\`\`\`\n${body}\n\`\`\``
  return { text: text.slice(0, from) + block + text.slice(to), start: from, end: from + block.length }
}

/**
 * Sets an ATX heading level on the selected lines (0 removes the heading).
 */
export function setHeading(text, start, end, level) {
  const { from, to, value } = selectedLines(text, start, end)
  const prefix = '#'.repeat(level) + ' '
  const lines = value.split('\n').map((line) => {
    const stripped = line.replace(/^#{1,6}\s+/, '')
    return level === 0 ? stripped : prefix + stripped
  })
  const next = lines.join('\n')
  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length }
}

/** Detects the heading level already applied to the caret's line. */
export function currentHeadingLevel(text, caret) {
  const { value } = selectedLines(text, caret, caret)
  const match = value.match(/^(#{1,6})\s/)
  return match ? match[1].length : 0
}

/** Inserts a markdown table, pre-filled with a header row. */
export function insertTable(text, start, end) {
  const table = [
    '| Columna 1 | Columna 2 | Columna 3 |',
    '| --- | --- | --- |',
    '|   |   |   |',
  ].join('\n')
  return { text: text.slice(0, start) + table + text.slice(end), start, end: start + table.length }
}

/** Inserts an image with placeholder alt text and URL. */
export function insertImage(text, start, end) {
  const snippet = '![alt text](https://)'
  return {
    text: text.slice(0, start) + snippet + text.slice(end),
    start: start + 2,
    end: start + 'alt text'.length + 2,
  }
}

/** Inserts a horizontal rule on its own line. */
export function insertRule(text, start, end) {
  const needsLeadingBreak = start > 0 && text[start - 1] !== '\n'
  const needsTrailingBreak = end < text.length && text[end] !== '\n'
  const snippet = `${needsLeadingBreak ? '\n' : ''}\n---\n${needsTrailingBreak ? '\n' : ''}`
  return {
    text: text.slice(0, start) + snippet + text.slice(end),
    start: start + snippet.length,
    end: start + snippet.length,
  }
}

/** Indents or outdents the selected lines by `size` spaces. */
export function indentLines(text, start, end, size = 2, outdent = false) {
  const { from, to, value } = selectedLines(text, start, end)

  const next = value
    .split('\n')
    .map((line) => {
      if (outdent) {
        const removable = new RegExp(`^ {1,${size}}`)
        return line.replace(removable, '')
      }
      // Do not indent empty lines.
      return line.trim() === '' ? line : ' '.repeat(size) + line
    })
    .join('\n')

  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length }
}

/** Toggles `> ` on the selected lines. */
export function toggleQuote(text, start, end) {
  return toggleLinePrefix(text, start, end, '> ')
}

/** Toggles strikethrough. */
export function toggleStrike(text, start, end) {
  return toggleWrap(text, start, end, '~~')
}

/**
 * Turns the selection into link text, or inserts an empty link with the URL
 * selected so it can be typed straight in.
 */
export function toggleLink(text, start, end) {
  const selected = text.slice(start, end)

  // Already a link: unwrap it.
  const wrapped = text.slice(0, start).match(/\[([^\]]*)$/)
  if (wrapped && text.slice(end).match(/^\]\([^)]*\)/)) {
    const label = text.slice(start, end)
    const next = text.slice(0, start - 1) + label + text.slice(end).replace(/^\]\([^)]*\)/, '')
    return { text: next, start: start - 1, end: start - 1 + label.length }
  }

  if (!selected) {
    const snippet = '[texto](https://)'
    const next = text.slice(0, start) + snippet + text.slice(end)
    return {
      text: next,
      // Select the URL so typing replaces it.
      start: start + 8,
      end: start + 16,
    }
  }

  const snippet = `[${selected}](https://)`
  return {
    text: text.slice(0, start) + snippet + text.slice(end),
    start: start + selected.length + 3,
    end: start + selected.length + 11,
  }
}

/**
 * Toggles a GFM task-list marker on the selected lines, converting a plain
 * bullet list into a checkbox list and back.
 */
export function toggleTaskList(text, start, end) {
  const { from, to, value } = selectedLines(text, start, end)
  const lines = value.split('\n')

  // Already a task list on every line -> revert to plain bullets.
  const allTasks = lines.every((line) => /^\s*[-*+]\s+\[[ xX]\]\s/.test(line))

  const next = lines
    .map((line) => {
      if (allTasks) return line.replace(/^(\s*)[-*+]\s+\[[ xX]\]\s/, '$1- ')
      if (/^\s*[-*+]\s+/.test(line)) {
        return line.replace(/^(\s*)[-*+]\s+/, '$1- [ ] ')
      }
      if (line.trim() === '') return line
      const indent = line.match(/^\s*/)[0]
      return `${indent}- [ ] ${line.slice(indent.length)}`
    })
    .join('\n')

  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length }
}

/**
 * Comments or uncomments a line using HTML comments, which markdown renders as
 * invisible. Safer than `//` for prose documents.
 */
export function toggleComment(text, start, end) {
  const { from, to, value } = selectedLines(text, start, end)
  const lines = value.split('\n')
  const allCommented = lines.every((line) => /^\s*<!--.*-->$/.test(line))

  const next = lines
    .map((line) => {
      if (/^\s*<!--.*-->$/.test(line)) {
        return line.replace(/^(\s*)<!--\s?/, '$1').replace(/(\s?)-->$/, '')
      }
      if (line.trim() === '') return line
      return `<!-- ${line.replace(/--+>/g, '')} -->`
    })
    .join('\n')

  const result = { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length }
  return allCommented ? result : result
}

/** Applies `transform` to the selected text (or the whole current word). */
export function transformSelection(text, start, end, transform) {
  const selected = text.slice(start, end)
  if (selected) {
    const next = transform(selected)
    return { text: text.slice(0, start) + next + text.slice(end), start, end: start + next.length }
  }
  // No selection: operate on the word under the caret.
  const wordMatch = text.slice(start).match(/^\S+/)
  const wordEnd = start + (wordMatch ? wordMatch[0].length : 0)
  const word = text.slice(start, wordEnd)
  const next = word ? transform(word) : ''
  return { text: text.slice(0, start) + next + text.slice(wordEnd), start, end: start + next.length }
}

/** Applies a transformation to each selected line (e.g. upper/lower case). */
export function transformLines(text, start, end, transform) {
  const { from, to, value } = selectedLines(text, start, end)
  const next = transform(value)
  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length }
}

/**
 * Moves the caret to the next/previous heading, used by the outline and the
 * Cmd+Shift+Up/Down shortcuts.
 */
export function findHeading(text, from, direction) {
  const lines = text.split('\n')
  const offsets = []
  let acc = 0
  for (const line of lines) {
    offsets.push(acc)
    acc += line.length + 1
  }

  const headingIndexes = lines
    .map((line, i) => (/^#{1,6}\s/.test(line) ? i : -1))
    .filter((i) => i !== -1)

  if (headingIndexes.length === 0) return null

  const currentLine = text.slice(0, from).split('\n').length - 1

  const target =
    direction < 0
      ? [...headingIndexes].reverse().find((i) => i < currentLine)
      : headingIndexes.find((i) => i > currentLine)

  if (target === undefined) return null
  return { start: offsets[target], end: offsets[target] + lines[target].length, line: target + 1 }
}

/** Extracts the document outline (headings with their level and position). */
export function extractOutline(text) {
  const lines = text.split('\n')
  const outline = []
  let acc = 0
  const used = new Map()

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/)
    if (!match) {
      acc += line.length + 1
      return
    }
    const label = match[2].replace(/[*_`~[\]]/g, '').trim()
    const base = label
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || `seccion-${index + 1}`
    const count = used.get(base) ?? 0
    used.set(base, count + 1)

    outline.push({
      id: count === 0 ? base : `${base}-${count}`,
      label: label || `Sección ${index + 1}`,
      level: match[1].length,
      line: index + 1,
      start: acc,
    })
    acc += line.length + 1
  })

  return outline
}

export const _internal = { clamp, expandToLines, selectedLines }