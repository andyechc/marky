import { useCallback, useEffect, useRef, useState } from 'react'
import { SplitHandle } from './split-handle'

const STORAGE_KEY = 'marky:split-ratio'

const MIN_RATIO = 0.2
const MAX_RATIO = 0.8

const clampRatio = (r) => Math.min(Math.max(r, MIN_RATIO), MAX_RATIO)

/**
 * Two-pane resizable layout for the editor and the preview.
 *
 * The ratio is remembered between visits and falls back to an even split when
 * the container is too narrow for the saved value to be useful.
 */
export function ResizableSplit({ first, second, ratio, onRatioChange }) {
  const containerRef = useRef(null)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleDragTo = useCallback(
    (dragged) => onRatioChange(clampRatio(dragged)),
    [onRatioChange],
  )

  const handleNudge = useCallback(
    (delta) => onRatioChange(clampRatio(ratio + delta)),
    [onRatioChange, ratio],
  )

  const handleReset = useCallback(() => onRatioChange(0.5), [onRatioChange])

  // Below ~640px two panes are unusable, so the handle is dropped and the split
  // falls back to an even share.
  const effective = isNarrow ? 0.5 : ratio

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full">
      <div
        className="h-full min-w-0 overflow-hidden"
        style={{ flexBasis: `${effective * 100}%`, flexGrow: 0, flexShrink: 1 }}
      >
        {first}
      </div>

      {!isNarrow && (
        <SplitHandle
          ariaLabel="Ajustar tamaño de los paneles"
          ariaValueNow={effective * 100}
          ariaValueMin={MIN_RATIO * 100}
          ariaValueMax={MAX_RATIO * 100}
          onDragTo={handleDragTo}
          onNudge={handleNudge}
          onReset={handleReset}
        />
      )}

      <div className="h-full min-w-0 flex-1 overflow-hidden">{second}</div>
    </div>
  )
}

/** Reads and persists the split ratio. */
export function useSplitRatio(storageKey = STORAGE_KEY, defaultRatio = 0.5) {
  const [ratio, setRatio] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(storageKey))
      return Number.isFinite(stored) && stored > 0 ? clampRatio(stored) : defaultRatio
    } catch {
      return defaultRatio
    }
  })

  const update = useCallback(
    (next) => {
      setRatio(next)
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {
        /* storage may be unavailable; the ratio just won't persist */
      }
    },
    [storageKey],
  )

  return [ratio, update]
}

export { MIN_RATIO, MAX_RATIO }