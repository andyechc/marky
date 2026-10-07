import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Horizontally scrolling rail for cards and chips.
 *
 * Three things it has to get right, all of them learned from a bug:
 *
 * 1. Nothing above it may scroll sideways. Any ancestor with a scrolling
 *    `overflow-y` has its `overflow-x` computed to `auto`, so one stray wide
 *    child silently turns the whole dialog into a sideways scroller instead of
 *    this rail. Hence `min-w-0` on every wrapper and `overflow-x-clip` on the
 *    dialog body.
 * 2. `<fieldset>` carries a user-agent `min-inline-size: min-content`, which
 *    makes it grow to its content's full width and silently disables any inner
 *    scroller. `min-w-0` on the wrapper is what defeats it.
 * 3. The arrows sit in the header row, not floating over the rail. Overlaying
 *    them is the usual carousel trick, but it puts an opaque control on top of
 *    whatever card happens to be half-visible — and the edge fade alone reads as
 *    a rendering glitch rather than as "there is more this way".
 *
 * Chrome is progressive: with nothing off-screen there are no arrows and no
 * mask, so a short list is an ordinary row.
 */
export function ScrollRail({
  children,
  header,
  label,
  step = 'item',
  className,
  headerClassName,
  controls = true,
}) {
  const ref = useRef(null)
  const [state, setState] = useState({ scrollable: false, atStart: true, atEnd: true })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    // One-pixel tolerance: fractional layout widths otherwise leave an arrow
    // permanently lit on a list that already fits.
    const scrollable = max > 1
    setState({ scrollable, atStart: el.scrollLeft <= 1, atEnd: el.scrollLeft >= max - 1 })
  }, [])

  useLayoutEffect(() => {
    measure()
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Webfonts and card widths settle after mount, so the first measure can lie.
    const settle = setTimeout(measure, 120)
    return () => {
      observer.disconnect()
      clearTimeout(settle)
    }
  }, [measure])

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    el.addEventListener('scroll', measure, { passive: true })
    return () => el.removeEventListener('scroll', measure)
  }, [measure])

  /** One card at a time, or a chunk of the viewport for chip rows. */
  const nudge = useCallback(
    (direction) => {
      const el = ref.current
      if (!el) return
      const first = el.firstElementChild
      const amount =
        step === 'item' && first
          ? first.getBoundingClientRect().width + 12
          : Math.max(120, el.clientWidth * 0.6)
      el.scrollBy({ left: direction * amount, behavior: 'smooth' })
    },
    [step],
  )

  // Left/right page the rail while it holds focus, unless the focus is in a
  // field, where the arrows belong to the caret.
  const onKeyDown = useCallback(
    (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (event.target.closest('input, textarea, select')) return
      event.preventDefault()
      nudge(event.key === 'ArrowRight' ? 1 : -1)
    },
    [nudge],
  )

  const scrollable = state.scrollable && controls
  const compact = step === 'chip'
  const fade = compact ? '20px' : '36px'
  const mask = `linear-gradient(to right, transparent 0, black ${fade}, black calc(100% - ${fade}), transparent 100%)`

  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn('mb-1.5 flex items-center justify-between gap-2', headerClassName)}>
        {header}
        {scrollable && (
          <span className="flex shrink-0 items-center gap-0.5">
            <RailArrow side="left" disabled={state.atStart} onClick={() => nudge(-1)} compact={compact} />
            <RailArrow side="right" disabled={state.atEnd} onClick={() => nudge(1)} compact={compact} />
          </span>
        )}
      </div>

      <div
        ref={ref}
        role="group"
        aria-label={label}
        tabIndex={scrollable ? 0 : -1}
        onKeyDown={onKeyDown}
        className={cn(
          'flex min-w-0 gap-2 overflow-x-auto scroll-area overscroll-x-contain',
          // Snaps to card starts, but only *near* one: mandatory snapping fights
          // a trackpad drag and makes short lists feel sticky.
          'snap-x snap-proximity pb-1',
          scrollable && 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        )}
        style={scrollable ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

function RailArrow({ side, disabled, onClick, compact }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Anterior' : 'Siguiente'}
      // Absent rather than greyed, so an idle edge stays quiet.
      className={cn(
        'flex items-center justify-center rounded-md border border-border bg-surface',
        'text-muted-foreground transition-colors duration-150',
        'hover:bg-surface-muted hover:text-foreground',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-0',
        compact ? 'h-6 w-6' : 'h-7 w-7',
      )}
    >
      <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
    </button>
  )
}
