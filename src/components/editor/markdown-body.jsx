import { memo, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown body, loaded lazily by `preview.jsx`.
 *
 * Styling comes from `.prose-markdown` and the design tokens, so it follows the
 * active theme rather than hardcoded colours.
 */

/** Flattens React children to plain text, used for heading anchors. */
function textOf(children) {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(textOf).join('')
  if (children?.props?.children) return textOf(children.props.children)
  return ''
}

/** GitHub-flavoured slug: strips accents and punctuation, then hyphenates. */
function slugify(value) {
  return (
    String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'seccion'
  )
}

/** Copy-to-clipboard button revealed on hover or keyboard focus. */
const CopyButton = memo(function CopyButton({ getText }) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText())
    } catch {
      /* permission denied; the code stays selectable by hand */
    }
  }, [getText])

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute right-2 top-7 z-10 rounded-md border border-border bg-surface/90 px-2 py-1
                 text-[11px] font-medium text-muted-foreground opacity-0 backdrop-blur
                 transition-opacity hover:text-foreground focus-visible:opacity-100
                 group-hover:opacity-100"
    >
      Copiar
      <span className="visually-hidden"> código</span>
    </button>
  )
})

/**
 * Heading with a self-link, so a section can be referenced by URL.
 *
 * The tag is passed as `as`, not `level`: react-markdown v8 already supplies its
 * own numeric `level` prop on headings, and spreading it over a string tag
 * renders `undefined` and blanks the whole tree.
 */
function Heading({ as: Tag, children, ...props }) {
  const label = textOf(children)
  const id = slugify(label.replace(/[*_`~]/g, ''))

  return (
    <Tag id={id} className="group" {...props}>
      {children}
      {/* Visibility is styled in globals.css so it out-specifies `.prose-markdown a`. */}
      <a href={`#${id}`} aria-label={`Enlace a esta sección: ${label}`}>
        #
      </a>
    </Tag>
  )
}

/**
 * Dependency-free tokeniser for code blocks.
 *
 * Replaces `react-syntax-highlighter`, which shipped all ~300 Prism grammars
 * (637kB raw) to highlight the handful of languages a markdown document uses in
 * practice. Comments, strings, numbers, keywords and punctuation are enough for
 * readable code, and it renders identically in either theme via CSS variables.
 */
const KEYWORDS = new Set([
  'abstract','as','async','await','base','bool','boolean','break','byte','case','catch','char',
  'class','const','constructor','continue','crate','debugger','declare','def','default','delete',
  'do','double','elif','else','enum','export','extends','extern','false','final','finally','float',
  'fn','for','foreach','from','func','function','global','goto','if','impl','implements','import',
  'in','instanceof','int','interface','is','lambda','let','loop','match','mod','module','move','mut',
  'namespace','new','nil','none','not','null','nullptr','or','package','pass','private','protected',
  'pub','public','raise','readonly','record','ref','require','return','sealed','select','self',
  'short','signed','sizeof','static','struct','super','switch','synchronized','template','then',
  'this','throw','throws','trait','true','try','type','typedef','typealias','typeof','union',
  'unsafe','unsigned','until','use','using','var','virtual','void','volatile','when','where','while',
  'with','yield',
])

const LITERALS = new Set(['true', 'false', 'null', 'none', 'nil', 'undefined', 'NaN', 'Infinity'])

/**
 * Ordered so that comments and strings win over the number/identifier rules,
 * which is what makes `// 1` a comment rather than a number.
 */
const RULES = [
  { name: 'comment', re: /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|<!--[\s\S]*?-->/ },
  { name: 'string', re: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/ },
  { name: 'number', re: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ },
  { name: 'function', re: /\b[A-Za-z_$][\w$]*(?=\s*\()/ },
  { name: 'property', re: /\b[A-Za-z_$][\w$]*(?=\s*:)/ },
  { name: 'identifier', re: /\b[A-Za-z_$][\w$]*\b/ },
  { name: 'operator', re: /[+\-*/%=<>!&|^~?:]+/ },
  { name: 'punctuation', re: /[{}[\]();,.]/ },
]

const TOKEN_CLASS = {
  comment: 'text-muted-foreground italic',
  string: 'text-[hsl(152_55%_38%)] dark:text-[hsl(150_55%_62%)]',
  number: 'text-[hsl(28_80%_42%)] dark:text-[hsl(30_85%_66%)]',
  keyword: 'text-[hsl(268_60%_48%)] dark:text-[hsl(270_75%_76%)]',
  literal: 'text-[hsl(208_75%_45%)] dark:text-[hsl(205_80%_68%)]',
  function: 'text-[hsl(190_70%_34%)] dark:text-[hsl(188_65%_62%)]',
  property: 'text-[hsl(222_30%_40%)] dark:text-[hsl(220_25%_74%)]',
  operator: 'text-[hsl(4_60%_46%)] dark:text-[hsl(6_70%_68%)]',
  punctuation: 'text-muted-foreground',
}

/** Splits code into styled spans. Pure string work, memoised per code block. */
function highlight(code) {
  const out = []
  let index = 0

  outer: while (index < code.length) {
    const rest = code.slice(index)

    for (const rule of RULES) {
      const match = rule.re.exec(rest)
      // Only accept matches anchored at the current position.
      if (!match || match.index !== 0) continue

      const token = match[0]
      let kind = rule.name

      if (rule.name === 'identifier') {
        if (KEYWORDS.has(token)) kind = 'keyword'
        else if (LITERALS.has(token)) kind = 'literal'
      }

      out.push(
        <span key={index} className={TOKEN_CLASS[kind]}>
          {token}
        </span>,
      )
      index += token.length
      continue outer
    }

    // Whitespace and anything unmatched passes through untouched.
    const char = code[index]
    if (!/\s/.test(char)) {
      out.push(char)
    } else {
      out.push(char)
    }
    index += 1
  }

  return out
}

/** Memoised wrapper so re-renders don't re-tokenise unchanged code. */
const CodeBlock = memo(function CodeBlock({ className, children }) {
  const code = String(children).replace(/\n$/, '')
  const tokens = useMemo(() => highlight(code), [code])
  const language = /language-([\w-]+)/.exec(className ?? '')?.[1]

  return (
    <div className="group relative">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {language ?? 'texto'}
        </span>
      </div>
      <CopyButton getText={() => code} />
      <pre className="scroll-area overflow-x-auto rounded-lg border border-border bg-surface-muted p-4 text-[0.875em] leading-relaxed">
        <code className="bg-transparent p-0 font-mono">{tokens}</code>
      </pre>
    </div>
  )
})

function MarkdownBody({ markdown }) {
  const components = useMemo(
    () => ({
      h1: ({ children, ...props }) => (
        <Heading as="h1" {...props}>
          {children}
        </Heading>
      ),
      h2: ({ children, ...props }) => (
        <Heading as="h2" {...props}>
          {children}
        </Heading>
      ),
      h3: ({ children, ...props }) => (
        <Heading as="h3" {...props}>
          {children}
        </Heading>
      ),
      h4: ({ children, ...props }) => (
        <Heading as="h4" {...props}>
          {children}
        </Heading>
      ),

      // External links open in a new tab; the change is announced, not silent.
      a: ({ children, href, ...props }) => {
        if (!href || href.startsWith('#')) {
          return (
            <a href={href} {...props}>
              {children}
            </a>
          )
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow" {...props}>
            {children}
            <span className="visually-hidden"> (se abre en una pestaña nueva)</span>
          </a>
        )
      },

      code({ inline, className: codeClass, children, ...props }) {
        if (inline) {
          return (
            <code className={codeClass} {...props}>
              {children}
            </code>
          )
        }
        return <CodeBlock className={codeClass}>{children}</CodeBlock>
      },

      // Task-list checkboxes display state only; the markdown source is truth.
      input: (props) => <input {...props} disabled readOnly />,

      table: ({ children, ...props }) => (
        <div className="-mx-1 my-5 overflow-x-auto px-1">
          <table {...props}>{children}</table>
        </div>
      ),

      img: ({ alt, ...props }) => (
        // Decorative images get an empty alt, per the a11y guidelines.
        <img alt={alt ?? ''} loading="lazy" decoding="async" {...props} />
      ),
    }),
    [],
  )

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {markdown}
    </ReactMarkdown>
  )
}

export default MarkdownBody