import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

const MONO_STACK =
  '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

/**
 * Width of one character in the editor's monospace font, cached per font size.
 *
 * With a known character width we can tell which lines are too long to fit on a
 * single row without touching the DOM. That is what keeps re-measurement cheap
 * on large documents: short lines resolve arithmetically, and only genuinely
 * long lines are measured.
 */
const charWidthCache = new Map()

function getCharWidth(fontSize) {
  const cached = charWidthCache.get(fontSize)
  if (cached) return cached

  const probe = document.createElement('div')
  probe.style.cssText =
    `position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0;` +
    `font-family:${MONO_STACK};font-size:${fontSize}px`
  probe.textContent = 'x'.repeat(200)
  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width / 200
  probe.remove()

  if (width > 0) charWidthCache.set(fontSize, width)
  return width
}

/**
 * Rows each logical line occupies after soft wrapping.
 *
 * A textarea cannot be asked how tall a given line is, so long lines are
 * measured against a hidden mirror that shares the textarea's width, font and
 * wrapping rules.
 */
export function useWrappedRows({ value, mirrorRef, fontSize, lineHeight }) {
  const lines = useMemo(() => value.split('\n'), [value])

  /**
   * Mirror content width, held in state rather than read during render: on the
   * first pass the element has no layout yet, so a render-time read would always
   * be zero and no line would ever be measured.
   */
  const [contentWidth, setContentWidth] = useState(0)

  // Lines long enough to need a real measurement.
  const candidates = useMemo(() => {
    const charWidth = getCharWidth(fontSize)
    if (charWidth <= 0 || contentWidth <= 0) return []

    const charsPerRow = Math.floor(contentWidth / charWidth)
    if (!Number.isFinite(charsPerRow) || charsPerRow <= 0) return []

    const result = []
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].length > charsPerRow) result.push({ index: i, text: lines[i] })
    }
    return result
  }, [lines, fontSize, contentWidth])

  const [rows, setRows] = useState(() => lines.map(() => 1))

  // Track the mirror's usable width and re-measure on resize.
  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    if (!mirror) return undefined

    const readWidth = () => {
      const style = getComputedStyle(mirror)
      const width =
        mirror.clientWidth -
        parseFloat(style.paddingLeft || 0) -
        parseFloat(style.paddingRight || 0)
      setContentWidth((prev) => (Math.abs(prev - width) < 0.5 ? prev : width))
    }

    readWidth()
    const observer = new ResizeObserver(readWidth)
    observer.observe(mirror)
    return () => observer.disconnect()
  }, [mirrorRef])

  // Measure the candidate lines once they've been laid out.
  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    if (!mirror) return undefined

    const measure = () => {
      const elements = mirror.querySelectorAll('[data-line-index]')
      const next = lines.map(() => 1)

      for (const el of elements) {
        const index = Number(el.dataset.lineIndex)
        const height = el.getBoundingClientRect().height
        next[index] = Math.max(1, Math.round(height / lineHeight))
      }

      setRows((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
      )
    }

    // Wait a frame so the candidate elements have their final geometry.
    let frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [candidates, lines, lineHeight, mirrorRef])

  // The gutter only needs to react to width changes.
  useEffect(() => {
    const mirror = mirrorRef.current
    if (!mirror) return undefined
    const handler = () => {
      const elements = mirror.querySelectorAll('[data-line-index]')
      const next = lines.map(() => 1)
      for (const el of elements) {
        next[Number(el.dataset.lineIndex)] = Math.max(
          1,
          Math.round(el.getBoundingClientRect().height / lineHeight),
        )
      }
      setRows((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
      )
    }
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(handler)
    })
    observer.observe(mirror)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [lines, lineHeight, mirrorRef])

  return { rows, candidates }
}

/**
 * Hidden measurement surface. It renders only the lines that need measuring, and
 * must sit inside the same box as the textarea so its width — and therefore its
 * wrapping — matches exactly.
 */
export function WrapMirror({ mirrorRef, candidates, fontSize, lineHeight }) {
  return (
    <div
      ref={mirrorRef}
      aria-hidden="true"
      className="pointer-events-none invisible absolute overflow-hidden px-5 py-5 font-mono"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        inset: 0,
        zIndex: -1,
      }}
    >
      {candidates.map(({ index, text }) => (
        <div key={index} data-line-index={index}>
          {text}
        </div>
      ))}
    </div>
  )
}