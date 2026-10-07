/**
 * Instruction documents for AI coding agents (`AGENT.md`, `CLAUDE.md`, …).
 *
 * A markdown editor is already the right tool for this: these files are plain
 * markdown, they live in the repo root, and the whole point is that the user
 * reads and rewrites them. So nothing here calls a model. `composeAgentDoc`
 * assembles a draft from nine factors, that draft lands in the editor, and the
 * user changes whatever they need.
 *
 * The composer is deliberately dumb — no inference, no defaults invented on the
 * user's behalf. A section is either what they typed or it is not there.
 */

/** Output language for the *document*, independent of the app's own UI. */
export const OUTPUT_LANGUAGES = {
  es: { id: 'es', label: 'Español' },
  en: { id: 'en', label: 'English' },
}

/**
 * The factors the generator asks about.
 *
 * `tone` and `conventions` are what make a template feel like a template rather
 * than a form; `commands` and `boundaries` are the two that change results most,
 * because an agent that cannot verify its own work, or that does not know where
 * the fences are, produces plausible nonsense.
 */
export const FACTORS = [
  {
    id: 'projectName',
    label: 'Nombre y propósito',
    hint: 'Una frase. Qué es esto y qué problema resuelve.',
    placeholder: 'Marky — editor de markdown local-first para redactar con un agente de IA al lado.',
    rows: 2,
    advanced: false,
  },
  {
    id: 'tone',
    label: 'Temperamento',
    hint: 'Cómo quieres que hable y cómo se comporte.',
    placeholder: 'Directo y concreto. Explica el porqué de cada decisión, no solo el qué.',
    rows: 3,
    advanced: false,
  },
  {
    id: 'stack',
    label: 'Stack y versiones',
    hint: 'Lenguajes, frameworks y runtimes, con versión cuando importe.',
    placeholder: 'JavaScript + React 18, Vite 4, Tailwind 3, Bun como package manager.',
    rows: 3,
    advanced: false,
  },
  {
    id: 'commands',
    label: 'Comandos',
    hint: 'Sin esto el agente no sabe verificar lo que toca.',
    placeholder: 'instalar: bun install\nverificar: bun run verify\ndesarrollo: bun run dev',
    rows: 5,
    advanced: false,
  },
  {
    id: 'structure',
    label: 'Estructura del repo',
    hint: 'Qué vive en cada carpeta importante.',
    placeholder: 'src/components → UI React\nsrc/lib → lógica pura\nsrc/context → estado global',
    rows: 4,
    advanced: false,
  },
  {
    id: 'conventions',
    label: 'Convenciones',
    hint: 'Estilo, naming, formato, mensajes de commit.',
    placeholder: 'ESLint + Prettier. Funciones en camelCase, componentes en PascalCase. Commits en imperativo.',
    rows: 4,
    advanced: false,
  },
  {
    id: 'boundaries',
    label: 'Reglas duras',
    hint: 'Qué NO debe hacer. Es la sección más importante del documento.',
    placeholder: 'No añadas dependencias sin preguntar.\nNo toques src/lib/markdownActions.js sin un test que lo cubra.',
    rows: 4,
    advanced: false,
  },
  {
    id: 'workflow',
    label: 'Flujo de trabajo',
    hint: 'Cómo debe trabajar y entregar.',
    placeholder: 'Planifica antes de editar. Diff pequeños. Ejecuta los comandos de verificación antes de dar nada por terminado.',
    rows: 4,
    advanced: true,
  },
  {
    id: 'context',
    label: 'Documentos de referencia',
    hint: 'Qué leer primero para entender el proyecto.',
    placeholder: 'Lee README.md y docs/arquitectura.md antes de tocar nada.',
    rows: 2,
    advanced: true,
  },
  {
    id: 'outputLanguage',
    label: 'Idioma de las respuestas',
    hint: 'Idioma en el que el agente debe escribir y responderte.',
    placeholder: '',
    rows: 0,
    advanced: true,
    choice: 'outputLanguage',
  },
]

export const FACTOR_BY_ID = Object.fromEntries(FACTORS.map((f) => [f.id, f]))

/** Section headings, per output language. Stable order, so diffs stay readable. */
const SECTION_HEADINGS = {
  es: {
    tone: 'Temperamento',
    stack: 'Stack',
    commands: 'Comandos',
    structure: 'Estructura',
    conventions: 'Convenciones',
    boundaries: 'Reglas',
    workflow: 'Flujo de trabajo',
    context: 'Contexto',
    outputLanguage: 'Idioma',
  },
  en: {
    tone: 'Tone',
    stack: 'Stack',
    commands: 'Commands',
    structure: 'Layout',
    conventions: 'Conventions',
    boundaries: 'Hard rules',
    workflow: 'Workflow',
    context: 'Context',
    outputLanguage: 'Language',
  },
}

/** The instruction line for each output language. */
const LANGUAGE_LINES = {
  es: 'Responde siempre en español.',
  en: 'Always respond in English.',
}

/**
 * Tidy a factor value without changing its meaning.
 *
 * Values are markdown on purpose — the user pastes a shell block or a bullet
 * list — so nothing is escaped. Only line endings and blank runs are
 * normalised, because that is what the textarea and the clipboard disagree on.
 */
export function normalizeFactorValue(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Coerces arbitrary stored data into a factor map of strings. */
export function normalizeFactors(factors) {
  const source = factors && typeof factors === 'object' ? factors : {}
  const out = {}
  for (const factor of FACTORS) out[factor.id] = normalizeFactorValue(source[factor.id])
  return out
}

/** A fresh, empty factor set for a brand new draft. */
export function blankFactors() {
  return normalizeFactors({})
}

/**
 * Assemble the instruction document.
 *
 * Sections appear in a fixed order and an empty factor emits no heading at all —
 * a `## Convenciones` followed by nothing reads like an oversight, which is
 * worse than the section simply not being there. The filename is deliberately
 * not part of the output: it is metadata for the download, not document content.
 */
export function composeAgentDoc(factors) {
  const f = normalizeFactors(factors)
  const lang = f.outputLanguage === 'en' ? 'en' : 'es'
  const headings = SECTION_HEADINGS[lang]
  const blocks = []

  const title = f.projectName.split('\n')[0].trim()
  if (title) blocks.push(`# ${title}`)

  for (const factor of FACTORS) {
    if (factor.id === 'projectName' || factor.id === 'outputLanguage') continue
    const value = f[factor.id]
    if (!value) continue
    blocks.push(`## ${headings[factor.id]}\n\n${value}`)
  }

  // Only when chosen. Defaulting to Spanish here would put a section in every
  // document, which is exactly the dangling-heading problem the other factors
  // avoid — and it would be wrong for anyone writing for an English-speaking
  // agent without touching this one field.
  if (f.outputLanguage === 'es' || f.outputLanguage === 'en') {
    blocks.push(`## ${headings.outputLanguage}\n\n${LANGUAGE_LINES[f.outputLanguage]}`)
  }

  if (blocks.length === 0) return ''
  return `${blocks.join('\n\n')}\n`
}

/**
 * Filenames the common agents read.
 *
 * Presets, not a fixed list: the field stays editable, so an unusual agent — or
 * a monorepo carrying several of these files — is not boxed in.
 */
export const TARGET_FILES = [
  'AGENT.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.cursorrules',
  '.windsurfrules',
  'copilot-instructions.md',
]

/**
 * Preset templates.
 *
 * A template is a starting point, not a mode: it fills the factors and
 * suggests a filename, and every field stays editable afterwards. Nothing in the
 * app can produce a document from a template alone.
 */
export const TEMPLATE_CATALOG = [
  {
    id: 'blank',
    name: 'En blanco',
    temperature: 'Sin preajustar',
    characteristics: ['Empiezas de cero', 'Nada se da por supuesto'],
    useCase: 'Cuando ya sabes exactamente qué necesitas',
    fileName: 'AGENT.md',
    factors: {},
  },
  {
    id: 'new-project',
    name: 'Proyecto nuevo',
    temperature: 'Colaborador directo',
    characteristics: ['Documentación por delante', 'Decisiones explícitas'],
    useCase: 'Un repo que empieza hoy y se leerá dentro de seis meses',
    fileName: 'AGENT.md',
    factors: {
      tone: 'Compañero de equipo, no un formalista. Explica el porqué detrás de cada decisión de estructura para que la siguiente persona entienda el tradeoff.',
      structure: 'Rellena con las carpetas que crees. Si aún no existen, describe la estructura que quieres que tenga.',
      conventions: 'Define naming, formato y mensajes de commit desde el principio: es más barato fijarlos ahora que imponerlos después.',
      workflow: 'Planifica antes de escribir código. Propón la estructura primero y espera a que la apruebes.\n\nCuando propongas una dependencia nueva, justifica qué problema resuelve.',
    },
  },
  {
    id: 'legacy',
    name: 'Legacy',
    temperature: 'Prudente',
    characteristics: ['No toca lo que no entiende', 'Pruebas antes que opinion'],
    useCase: 'Código heredado sin dueño, o un monolito que hay que Steady-State',
    fileName: 'AGENT.md',
    factors: {
      tone: 'Prudente. Ante la duda, pregunta en lugar de asumir. No propongas reescrituras sin que te lo pidan.',
      conventions: 'Sigue el estilo que ya existe en cada archivo, aunque te parezca feo. La consistencia del repo gana a tu preferencia personal.',
      boundaries: 'No refactorices código que no tenga a su alrededor pruebas. Si un módulo es legacy y no lo entiendes del todo, déjalo y dilo.',
      workflow: 'Lee antes de escribir. Localiza dónde vive el comportamiento actual y confirma que lo has encontrado antes de cambiarlo.\n\nUn cambio de comportamiento, un commit. El refactor no viaja mezclado con la funcionalidad nueva.',
    },
  },
  {
    id: 'frontend',
    name: 'Frontend',
    temperature: 'Diseño sensible',
    characteristics: ['Accesibilidad por defecto', 'Estados explícitos'],
    useCase: 'Interfaces React, Svelte o lo que toque, con estado real de carga y error',
    fileName: 'AGENT.md',
    factors: {
      stack: 'React 18 con hooks, sin librería de estado externa mientras el tamaño lo permita. Tailwind para estilos. Accesibilidad con las herramientas nativas del navegador.',
      conventions: 'Accesibilidad no es opcional: todo control interactivo es un elemento con nombre accesible, todo campo tiene etiqueta, todo estado de carga y error se renderiza.\n\nEstados vacíos, de carga y de error se diseñan junto con el resto, no al final.',
      boundaries: 'No añadas una librería para algo que el navegador ya hace. Antes de crear un hook, comprueba si el caso ya existe en el repo.',
      workflow: 'Verifica en móvil. Un cambio de layout se mira en el viewport estrecho antes de darse por terminado.',
    },
  },
  {
    id: 'backend',
    name: 'Backend / API',
    temperature: 'Cauteloso',
    characteristics: ['La migración va antes que el endpoint', 'Los errores se hablan'],
    useCase: 'Servicios con base de datos, donde un cambio a medias rompe producción',
    fileName: 'AGENT.md',
    factors: {
      conventions: 'Toda validación vive en la capa que corresponde, no en el controlador.\n\nLos errores se traducen a un mensaje que una persona pueda actuar, no a una traza.',
      boundaries: 'Ninguna migración destructiva sin plan de vuelta atrás. Si el cambio no es reversible, dilo antes de escribirlo.\n\nNunca registres secretos ni datos personales en los logs.',
      workflow: 'Una migración y su rollback en el mismo commit. El esquema se despliega antes que el código que lo usa.',
    },
  },
  {
    id: 'docs',
    name: 'Documentación',
    temperature: 'Didáctico',
    characteristics: ['Ejemplos ejecutables', 'Nada de jerga sin definir'],
    useCase: 'Cuando escribes para quien llega después que tú',
    fileName: 'AGENT.md',
    factors: {
      tone: 'Didáctico. Das por supuesto nada: cada término técnico aparece con una frase que lo explica la primera vez.',
      conventions: 'Cada ejemplo de código tiene que funcionar tal cual está escrito. Si no lo has ejecutado, no lo publiques.',
      workflow: 'Antes de documentar una función, léela. Una documentación escrita de memoria acaba mintiendo.',
    },
  },
]

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATE_CATALOG.map((t) => [t.id, t]))

/**
 * Applies a template on top of a base set of factors.
 *
 * Only *empty* fields are filled. Re-picking a template to peek at its tone
 * should not throw away what you already wrote, and the factors you filled in
 * yourself are the ones with the most context behind them.
 */
export function applyTemplate(templateId, base = {}) {
  const template = TEMPLATE_BY_ID[templateId]
  const current = normalizeFactors(base)
  if (!template) return { factors: current, fileName: '' }

  const merged = { ...current }
  for (const factor of FACTORS) {
    if (!current[factor.id] && template.factors[factor.id]) merged[factor.id] = template.factors[factor.id]
  }

  return { factors: normalizeFactors(merged), fileName: template.fileName || '' }
}

/** Validates a user-supplied file name before it becomes a download. */
export function sanitizeFileName(name, fallback = 'AGENT.md') {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  const base = trimmed
    .replace(/[/\\]/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/[<>:"|?*]/g, '')
    // C0 controls, stripped by code point rather than a regex range so lint
    // does not read it as an escape hatch; these can only come from a paste.
    .replaceAll(/[\p{Cc}]/gu, '')
    .trim()
    .replace(/^\.+/, '')
  if (!base) return fallback
  return base.toLowerCase().endsWith('.md') ? base : `${base}.md`
}
