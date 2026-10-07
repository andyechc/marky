import { useCallback, useEffect, useState } from 'react'
import { SplitHandle } from './split-handle'
import { useIsOverlaySidebar } from '@/hooks/useMediaQuery'

const STORAGE_KEY = 'marky:sidebar-width'

export const SIDEBAR_MIN = 200
export const SIDEBAR_MAX = 480
export const SIDEBAR_DEFAULT = 296

/** Below this viewport the sidebar becomes a drawer instead of a column. */
export const SIDEBAR_BREAKPOINT = '(min-width: 1024px)'

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

function loadWidth() {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0
      ? clamp(stored, SIDEBAR_MIN, SIDEBAR_MAX)
      : SIDEBAR_DEFAULT
  } catch {
    return SIDEBAR_DEFAULT
  }
}

/**
 * Resizable, collapsible sidebar.
 *
 * The width is clamped rather than free: below the minimum the outline becomes
 * unreadable, above the maximum it crowds out the editor. Double-clicking the
 * handle, or pressing Enter on it, restores the default.
 *
 * Under the breakpoint this renders as a fixed-width overlay drawer, where a
 * drag handle would be meaningless, so resizing is disabled there.
 *
 * The `<aside>` *is* the panel: it carries the width, the border and the
 * clipping, and `children` is only the panel's inner content. A nested wrapper
 * would put a second box between the drag surface and what the user resizes.
 */
export function ResizableSidebar({ open, onOpenChange, children }) {
  const isOverlay = useIsOverlaySidebar()
  const [width, setWidth] = useState(loadWidth)

  // Never let the panel leave the editor with too little room.
  useEffect(() => {
    if (isOverlay) return undefined
    const onResize = () => {
      const available = window.innerWidth
      const max = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, available - 360))
      setWidth((prev) => clamp(prev, SIDEBAR_MIN, max))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isOverlay])

  const persist = useCallback((next) => {
    setWidth(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* storage unavailable; the width just won't persist */
    }
  }, [])

  /** Receives the pointer ratio and the container width the handle measured. */
  const handleDragTo = useCallback(
    (ratio, containerWidth) => {
      const max = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, containerWidth - 360))
      persist(clamp(ratio * containerWidth, SIDEBAR_MIN, max))
    },
    [persist],
  )

  const handleNudge = useCallback(
    (delta) => {
      const containerWidth = window.innerWidth
      const max = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, containerWidth - 360))
      persist(clamp(width + delta * containerWidth, SIDEBAR_MIN, max))
    },
    [persist, width],
  )

  const handleReset = useCallback(() => persist(SIDEBAR_DEFAULT), [persist])

  if (!open) return null

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-40">
        <button
          type="button"
          aria-label="Cerrar panel lateral"
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 animate-fade-in bg-foreground/25 backdrop-blur-[1px]"
        />
        {/*
          Inset with margins rather than padding, so the rounded border hugs the
          panel instead of floating inside a larger transparent box.
        */}
        <aside
          className="absolute inset-y-0 left-0 my-2 ms-2 flex w-[min(21rem,86vw)]
                     animate-slide-in-left flex-col overflow-hidden rounded-xl
                     border border-border bg-surface shadow-lg"
          aria-label="Panel lateral"
        >
          {children}
        </aside>
      </div>
    )
  }

  // A fragment, not a wrapper: the drag handle measures its own parent, and a
  // `display: contents` wrapper would have no box to measure.
  return (
    <>
      {/*
        Flush with the header and the editor, so the column is a plain
        `border-r` divider rather than a floating card.
      */}
      <aside
        className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-surface"
        style={{ width: `${width}px` }}
        aria-label="Panel lateral"
      >
        {children}
      </aside>

      <SplitHandle
        ariaLabel="Ajustar ancho del panel lateral"
        ariaValueNow={width}
        ariaValueMin={SIDEBAR_MIN}
        ariaValueMax={SIDEBAR_MAX}
        onDragTo={handleDragTo}
        onNudge={handleNudge}
        onReset={handleReset}
      />
    </>
  )
}