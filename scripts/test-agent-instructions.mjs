/**
 * Tests for the AI instruction document composer.
 *
 * The composer is the one place where the app turns user input into a file that
 * an autonomous agent will act on, so a silent bug here has outsized effects:
 * a stray heading, a lost rule or a corrupted list all read as instructions.
 */
import {
  applyTemplate,
  blankFactors,
  composeAgentDoc,
  normalizeFactorValue,
  normalizeFactors,
  sanitizeFileName,
  TEMPLATE_BY_ID,
  TEMPLATE_CATALOG,
} from '../src/lib/agentInstructions.js'

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

// --- Value normalisation ----------------------------------------------------
check('trims a value', normalizeFactorValue('  hola  '), 'hola')
check('collapses CRLF', normalizeFactorValue('a\r\nb'), 'a\nb')
check('collapses bare CR', normalizeFactorValue('a\rb'), 'a\nb')
check('collapses blank runs', normalizeFactorValue('a\n\n\n\nb'), 'a\n\nb')
check('keeps markdown intact', normalizeFactorValue('- uno\n\n```bash\nnpm test\n```'), '- uno\n\n```bash\nnpm test\n```')
check('non-strings become empty', normalizeFactorValue(null), '')
check('numbers are not coerced', normalizeFactorValue(42), '')

// --- Factor normalisation ---------------------------------------------------
const factors = normalizeFactors({ projectName: 'X', bogus: 'y', stack: 7 })
check('keeps known factors', factors.projectName, 'X')
check('drops unknown factors', factors.bogus, undefined)
check('coerces bad values to empty', factors.stack, '')
check('blank factors cover every field', Object.keys(blankFactors()).length, 10)

// --- Empty documents -------------------------------------------------------
check('all-empty composes to nothing', composeAgentDoc({}), '')
check('null composes to nothing', composeAgentDoc(null), '')
check('whitespace-only composes to nothing', composeAgentDoc({ stack: '   \n\n  ' }), '')

// --- Headings --------------------------------------------------------------
check(
  'title becomes the only H1',
  composeAgentDoc({ projectName: 'Mi proyecto', tone: 'Directo' }),
  '# Mi proyecto\n\n## Temperamento\n\nDirecto\n',
)
check(
  'a multi-line purpose uses only its first line as the title',
  composeAgentDoc({ projectName: 'Marky\nMás texto' }),
  '# Marky\n',
)
check('sections follow a fixed order regardless of key order', composeAgentDoc({
  boundaries: 'Regla',
  projectName: 'P',
  stack: 'JS',
}), '# P\n\n## Stack\n\nJS\n\n## Reglas\n\nRegla\n')

// --- Empty sections are omitted, not left dangling -------------------------
const sparse = composeAgentDoc({ projectName: 'P', stack: 'JS', conventions: '   ' })
truthy('no heading for an empty factor', !sparse.includes('Convenciones'))
truthy('no double blank line where a section was skipped', !/\n{3,}/.test(sparse))

// --- Markdown in values is preserved, never escaped ------------------------
const withCode = composeAgentDoc({
  projectName: 'P',
  commands: '```bash\nbun run verify\n```',
  boundaries: '- no dependencies\n- no secrets',
})
truthy('fenced code survives', withCode.includes('```bash\nbun run verify\n```'))
truthy('bulleted rules survive', withCode.includes('- no dependencies\n- no secrets'))
truthy('no backslash escapes are introduced', !withCode.includes('\\'))

// --- Output language -------------------------------------------------------
const spanish = composeAgentDoc({ projectName: 'P', stack: 'JS', outputLanguage: 'es' })
truthy('spanish headings by default', spanish.includes('## Stack'))
truthy('spanish language line', spanish.includes('Responde siempre en español.'))

const english = composeAgentDoc({
  projectName: 'P',
  stack: 'JS',
  tone: 'Plain',
  boundaries: 'No deps',
  outputLanguage: 'en',
})
truthy('english headings', english.includes('## Tone') && english.includes('## Hard rules'))
truthy('english language line', english.includes('Always respond in English.'))
truthy('no spanish headings leak', !english.includes('Temperamento') && !english.includes('Reglas'))

// A Spanish document may still tell an English-speaking agent to answer in
// English: the document language and the reply language are separate choices.
const mixed = composeAgentDoc({
  projectName: 'P',
  outputLanguage: 'es',
  stack: 'JS',
})
check(
  'spanish headings with a spanish reply line',
  mixed,
  '# P\n\n## Stack\n\nJS\n\n## Idioma\n\nResponde siempre en español.\n',
)

// Picking English writes the whole document in English, headings included, and
// tells the agent to answer in English.
const esDocEnglishAgent = composeAgentDoc({
  projectName: 'P',
  outputLanguage: 'en',
  stack: 'JS',
})
check(
  'english output language writes the whole document in english',
  esDocEnglishAgent,
  '# P\n\n## Stack\n\nJS\n\n## Language\n\nAlways respond in English.\n',
)

check('an unknown language is ignored entirely', composeAgentDoc({
  projectName: 'P',
  stack: 'JS',
  outputLanguage: 'klingon',
}), '# P\n\n## Stack\n\nJS\n')

check('leaving the language untouched emits no language section', composeAgentDoc({
  projectName: 'P',
  stack: 'JS',
}).includes('Idioma'), false)

// --- Trailing newline ------------------------------------------------------
truthy('document ends with exactly one newline', composeAgentDoc({ projectName: 'P' }).endsWith('P\n'))
truthy('no trailing blank line', !composeAgentDoc({ projectName: 'P' }).endsWith('\n\n'))

// --- Templates -------------------------------------------------------------
truthy('every template has a unique id', new Set(TEMPLATE_CATALOG.map((t) => t.id)).size === TEMPLATE_CATALOG.length)
truthy('every template has a markdown filename', TEMPLATE_CATALOG.every((t) => t.fileName.endsWith('.md')))
truthy('every template declares a temperature', TEMPLATE_CATALOG.every((t) => t.temperature))
truthy('every template declares characteristics', TEMPLATE_CATALOG.every((t) => t.characteristics?.length > 0))
truthy('every template declares a use case', TEMPLATE_CATALOG.every((t) => t.useCase))
truthy('every template factor is a known factor', TEMPLATE_CATALOG.every((t) =>
  Object.keys(t.factors).every((id) => normalizeFactors(t)[id] !== undefined && !(id in TEMPLATE_BY_ID && false)),
))

// A template alone must produce a real document, or the feature is decorative.
truthy('every template composes to something', TEMPLATE_CATALOG.every((t) =>
  t.id === 'blank' || composeAgentDoc(t.factors).length > 80,
))

const blank = applyTemplate('blank')
check('blank template keeps no factors', blank.factors.projectName, '')
check('blank template still names a file', blank.fileName, 'AGENT.md')

const applied = applyTemplate('legacy')
truthy('legacy template brings a tone', applied.factors.tone.length > 0)
truthy('legacy template brings boundaries', applied.factors.boundaries.length > 0)

const carried = applyTemplate('legacy', { projectName: 'Mi repo', boundaries: 'No toques X' })
check('applying a template preserves what you already typed', carried.factors.projectName, 'Mi repo')
check('but the template still fills its own empty slots', carried.factors.tone.length, TEMPLATE_BY_ID.legacy.factors.tone.length)
// The user's own rules are the most valuable thing in the form, so a template
// must never overwrite a field they already filled.
check('and never clobbers a field you filled yourself', carried.factors.boundaries, 'No toques X')

check('unknown template is a no-op', applyTemplate('nope', { projectName: 'X' }).factors.projectName, 'X')
check('unknown template names no file', applyTemplate('nope').fileName, '')

// --- Filenames -------------------------------------------------------------
check('adds the extension', sanitizeFileName('miAgente'), 'miAgente.md')
check('keeps an existing extension', sanitizeFileName('miAgente.md'), 'miAgente.md')
check('defaults when empty', sanitizeFileName('   '), 'AGENT.md')
check('defaults when null', sanitizeFileName(null), 'AGENT.md')
check('flattens path separators', sanitizeFileName('docs/AGENT.md'), 'docs-AGENT.md')
check('strips characters a filesystem rejects', sanitizeFileName('a<b>c:d*e?f'), 'abcdef.md')
check('never hides a file behind a leading dot', sanitizeFileName('..oculto.md'), 'oculto.md')
truthy('output is always safe to use as a download name', !sanitizeFileName('../../etc/passwd').includes('/'))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
