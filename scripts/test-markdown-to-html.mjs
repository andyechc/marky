import { markdownToHtml, buildStandaloneHtml, markdownToPlainText } from '../src/lib/markdownToHtml.js'

let passed = 0
let failed = 0

const check = (name, actual, expected) => {
  const ok = actual === expected
  if (ok) passed += 1
  else {
    failed += 1
    console.log(`FAIL  ${name}\n  expected: ${expected}\n  actual:   ${actual}`)
  }
}

const contains = (name, actual, needle) => {
  const ok = actual.includes(needle)
  if (ok) passed += 1
  else {
    failed += 1
    console.log(`FAIL  ${name}\n  missing: ${needle}\n  in:      ${actual}`)
  }
}

const omits = (name, actual, needle) => {
  const ok = !actual.includes(needle)
  if (ok) passed += 1
  else {
    failed += 1
    console.log(`FAIL  ${name}\n  should not contain: ${needle}\n  in: ${actual}`)
  }
}

// --- Headings -------------------------------------------------------------
check('h1', markdownToHtml('# Hola'), '<h1 id="hola">Hola</h1>')
check('h3', markdownToHtml('### Sub'), '<h3 id="sub">Sub</h3>')
check('closed h2', markdownToHtml('## Cerrado ##'), '<h2 id="cerrado">Cerrado</h2>')
check(
  'duplicate heading slugs',
  markdownToHtml('# Dup\n\n# Dup'),
  '<h1 id="dup">Dup</h1>\n<h1 id="dup-1">Dup</h1>',
)

// --- Paragraphs ------------------------------------------------------------
check('paragraph', markdownToHtml('Hola mundo'), '<p>Hola mundo</p>')
check(
  'soft wrap joins into one paragraph',
  markdownToHtml('uno\ndos'),
  '<p>uno\ndos</p>',
)

// --- Inline ----------------------------------------------------------------
check('bold', markdownToHtml('**fuerte**'), '<p><strong>fuerte</strong></p>')
check('italic', markdownToHtml('*cursiva*'), '<p><em>cursiva</em></p>')
check('underscore bold', markdownToHtml('__fuerte__'), '<p><strong>fuerte</strong></p>')
check('strike', markdownToHtml('~~tachado~~'), '<p><del>tachado</del></p>')
check('mark', markdownToHtml('==destacado=='), '<p><mark>destacado</mark></p>')
check(
  'link',
  markdownToHtml('[texto](https://ejemplo.com)'),
  '<p><a href="https://ejemplo.com">texto</a></p>',
)
contains('image', markdownToHtml('![alt](https://x.com/a.png)'), '<img src="https://x.com/a.png" alt="alt"')

// --- Code ------------------------------------------------------------------
check('inline code', markdownToHtml('`a()`'), '<p><code>a()</code></p>')
check(
  'code span contents are not formatted',
  markdownToHtml('`**not bold**`'),
  '<p><code>**not bold**</code></p>',
)
check(
  'fenced block with language',
  markdownToHtml('```js\nconst a = 1\n```'),
  '<pre><code class="language-js">const a = 1</code></pre>',
)
check('fenced block escapes html', markdownToHtml('```\n<b>x</b>\n```'), '<pre><code>&lt;b&gt;x&lt;/b&gt;</code></pre>')

// --- Lists -----------------------------------------------------------------
check(
  'unordered list',
  markdownToHtml('- a\n- b'),
  '<ul>\n<li>a</li>\n<li>b</li>\n</ul>',
)
check(
  'ordered list',
  markdownToHtml('1. a\n2. b'),
  '<ol>\n<li>a</li>\n<li>b</li>\n</ol>',
)
contains(
  'task list',
  markdownToHtml('- [x] hecho\n- [ ] pendiente'),
  '<input type="checkbox" disabled checked>',
)
contains(
  'task list unchecked',
  markdownToHtml('- [ ] pendiente'),
  '<input type="checkbox" disabled>',
)
omits('task list escapes literal brackets', markdownToHtml('texto [x] normal'), '<input')

// --- Blockquote ------------------------------------------------------------
check(
  'blockquote',
  markdownToHtml('> cita'),
  '<blockquote><p>cita</p></blockquote>',
)
check(
  'multi-line blockquote',
  markdownToHtml('> uno\n> dos'),
  '<blockquote><p>uno\ndos</p></blockquote>',
)

// --- Rules -----------------------------------------------------------------
check('thematic break', markdownToHtml('---'), '<hr>')
check('thematic break with spaces', markdownToHtml('- - -'), '<hr>')

// --- Tables ----------------------------------------------------------------
const table = markdownToHtml('| a | b |\n| --- | --- |\n| 1 | 2 |')
contains('table open', table, '<table><thead><tr><th>a</th><th>b</th></tr></thead>')
contains('table body', table, '<tbody><tr><td>1</td><td>2</td></tr></tbody>')
contains(
  'table alignment',
  markdownToHtml('| a | b | c |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |'),
  '<th style="text-align:left">a</th>',
)

// --- Escaping --------------------------------------------------------------
check('escapes raw html', markdownToHtml('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
check('escapes ampersands', markdownToHtml('a & b'), '<p>a &amp; b</p>')

// --- Standalone document ---------------------------------------------------
const doc = buildStandaloneHtml('# Título', 'mi <archivo>.md')
contains('doc has doctype', doc, '<!DOCTYPE html>')
contains('doc escapes title', doc, '<title>mi &lt;archivo&gt;</title>')
contains('doc has heading', doc, '<h1 id="titulo">Título</h1>')
contains('doc has styles', doc, 'prefers-color-scheme: dark')
contains('doc has print styles', doc, '@media print')

// --- Plain text ------------------------------------------------------------
check('plain text strips markers', markdownToPlainText('# T\n\n**b** and `c`'), 'T\n\nb and c')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)