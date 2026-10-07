/**
 * Tests for the pure markdown transforms used by the toolbar and shortcuts.
 * These are the highest-risk pure functions in the app: a wrong offset silently
 * corrupts the user's document.
 */
import * as md from '../src/lib/markdownActions.js'

let passed = 0
let failed = 0

const check = (name, actual, expected) => {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) passed += 1
  else {
    failed += 1
    console.log(`FAIL  ${name}\n  expected: ${e}\n  actual:   ${a}`)
  }
}

const truthy = (name, value) => {
  if (value) passed += 1
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

// --- Wrap / unwrap ---------------------------------------------------------
check('wrap selection', md.toggleWrap('hola', 0, 4, '**', 'x'), {
  text: '**hola**',
  start: 2,
  end: 6,
})
check('wrap empty selection inserts placeholder', md.toggleWrap('', 0, 0, '**', 'texto'), {
  text: '**texto**',
  start: 2,
  end: 7,
})
check('unwraps already wrapped text', md.toggleWrap('**hola**', 2, 6, '**', 'x'), {
  text: 'hola',
  start: 0,
  end: 4,
})
check('inline code wrap', md.toggleWrap('a', 0, 1, '`', 'code'), {
  text: '`a`',
  start: 1,
  end: 2,
})

// --- Link ------------------------------------------------------------------
check('link with selection', md.toggleLink('texto', 0, 5), {
  text: '[texto](https://)',
  start: 8,
  end: 16,
})
check('link without selection selects url', md.toggleLink('', 0, 0), {
  text: '[texto](https://)',
  start: 8,
  end: 16,
})
// Selecting the label of an existing link unwraps it.
check('unwrap existing link', md.toggleLink('[a](https://x)', 1, 2), {
  text: 'a',
  start: 0,
  end: 1,
})

// --- Line prefixes ---------------------------------------------------------
check(
  'bullet list added to plain lines',
  md.toggleList('a\nb', 0, 3, false),
  { text: '- a\n- b', start: 0, end: 7 },
)
check(
  'bullet list toggles back off',
  md.toggleList('- a\n- b', 0, 5, false),
  { text: 'a\nb', start: 0, end: 3 },
)
check(
  'preserves indentation when adding',
  md.toggleQuote('  cita', 0, 6),
  { text: '  > cita', start: 0, end: 8 },
)
check('headings across multiple lines', md.setHeading('uno\ndos', 0, 7, 2), {
  text: '## uno\n## dos',
  start: 0,
  end: 13,
})
check('detects heading level', md.currentHeadingLevel('### Sub', 4), 3)
check('detects no heading', md.currentHeadingLevel('texto', 2), 0)
// setHeading(0) strips the heading; the "toggle off" behaviour lives in the
// command layer, which passes 0 when the caret is already at that level.
check('setHeading 0 removes the heading', md.setHeading('## x', 0, 4, 0), {
  text: 'x',
  start: 0,
  end: 1,
})
check('setHeading replaces an existing level', md.setHeading('## x', 0, 4, 3), {
  text: '### x',
  start: 0,
  end: 5,
})

// --- Task lists ------------------------------------------------------------
check('converts bullets to tasks', md.toggleTaskList('- a', 0, 3), {
  text: '- [ ] a',
  start: 0,
  end: 7,
})
check('reverts tasks to bullets', md.toggleTaskList('- [ ] a', 0, 6), {
  text: '- a',
  start: 0,
  end: 3,
})
truthy(
  'reverting a full task list clears every marker',
  md.toggleTaskList('- [x] a\n- [ ] b', 0, 15).text === '- a\n- b',
)

// --- Comments --------------------------------------------------------------
truthy('comment wraps line', md.toggleComment('hola', 0, 4).text.includes('<!--'))
truthy('uncomment strips markers', md.toggleComment('<!-- hola -->', 0, 13).text.trim() === 'hola')

// --- Indentation -----------------------------------------------------------
check('indent adds two spaces', md.indentLines('a', 0, 1), { text: '  a', start: 0, end: 3 })
check('outdent removes up to two spaces', md.indentLines('  a', 0, 3, 2, true), {
  text: 'a',
  start: 0,
  end: 1,
})
check('leaves empty lines alone', md.indentLines('a\n\nb', 0, 4).text, '  a\n\n  b')

// --- Blocks ----------------------------------------------------------------
check('code block wraps selection', md.toggleCodeBlock('const a = 1', 0, 11), {
  text: '```\nconst a = 1\n```',
  start: 0,
  end: 19,
})
check(
  'code block toggles off',
  md.toggleCodeBlock('```\ncode\n```', 0, 10).text,
  'code',
)
truthy('table insert produces a table', md.insertTable('', 0, 0).text.includes('| Columna 1 |'))
check('rule insert on empty doc', md.insertRule('', 0, 0).text, '\n---\n')
check('image insert selects alt text', md.insertImage('', 0, 0), {
  text: '![alt text](https://)',
  start: 2,
  end: 10,
})

// --- Case transforms -------------------------------------------------------
check('uppercase lines', md.transformLines('hola', 0, 4, (v) => v.toUpperCase()), {
  text: 'HOLA',
  start: 0,
  end: 4,
})
check('lowercase lines', md.transformLines('HOLA', 0, 4, (v) => v.toLowerCase()), {
  text: 'hola',
  start: 0,
  end: 4,
})

// --- Outline ---------------------------------------------------------------
const outline = md.extractOutline('# Uno\ntexto\n## Dos\n### Tres\n## Dos')
check('outline entries', outline.length, 4)
check('outline levels', outline.map((o) => o.level), [1, 2, 3, 2])
check('outline labels', outline.map((o) => o.label), ['Uno', 'Dos', 'Tres', 'Dos'])
check('outline dedupes ids', outline.map((o) => o.id), ['uno', 'dos', 'tres', 'dos-1'])
check('outline strips emphasis', md.extractOutline('## **Negrita**').map((o) => o.label), ['Negrita'])
check('outline line numbers', md.extractOutline('a\n# H').map((o) => o.line), [2])

// --- Heading navigation ----------------------------------------------------
const doc = '# One\ntexto\n## Two\n## Three'
check('finds next heading', md.findHeading(doc, 0, 1)?.line, 3)
check('finds previous heading', md.findHeading(doc, doc.length - 1, -1)?.line, 3)
check('returns null at the end', md.findHeading('# Only', 0, 1), null)
check('returns null with no headings', md.findHeading('texto', 0, 1), null)

// --- Selection helpers -----------------------------------------------------
check('expands to whole lines', md.expandToLines('a\nbc\nd', 2, 3), { start: 2, end: 4 })

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)