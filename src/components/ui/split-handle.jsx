import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Drag handle for a resizable panel.
 *
 * Pointer drag reports an absolute ratio within the container; arrow keys nudge
 * by a relative delta, and Home resets. Keeping those separate avoids the
 * ambiguous "is this a ratio or a delta?" callback the two layouts shared before.
 *
 * Exposed as `role="separator"` with the ARIA value semantics screen readers
 * expect from a window splitter.
 */
export function SplitHandle({
  orientation = 'vertical',
  onDragTo,
  onNudge,
  onReset,
  ariaLabel = 'Ajustar tamaño del panel',
  ariaValueNow,
  ariaValueMin,
  ariaValueMax,
  className,
}) {
  const dragging = useRef(false)

  const onPointerDown = useCallback(
    (event) => {
      // Primary button only, so a right-click doesn't start a drag.
      if (event.button !== 0) return
      event.preventDefault()
      dragging.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [orientation],
  )

  const onPointerMove = useCallback(
    (event) => {
      if (!dragging.current || !onDragTo) return
      // The panel and the handle are siblings inside the workspace row, so the
      // handle's parent is the box the ratio is measured against.
      const container = event.currentTarget.parentElement
      if (!container) return
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const ratio =
        orientation === 'vertical'
          ? (event.clientX - rect.left) / rect.width
          : (event.clientY - rect.top) / rect.height
      onDragTo(ratio, orientation === 'vertical' ? rect.width : rect.height)
    },
    [onDragTo, orientation],
  )

  const endDrag = useCallback((event) => {
    if (!dragging.current) return
    dragging.current = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  const onKeyDown = useCallback(
    (event) => {
      const step = event.shiftKey ? 0.05 : 0.01
      const back = orientation === 'vertical' ? 'ArrowLeft' : 'ArrowUp'
      const fwd = orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown'

      if (event.key === back && onNudge) {
        event.preventDefault()
        onNudge(-step)
      } else if (event.key === fwd && onNudge) {
        event.preventDefault()
        onNudge(step)
      } else if (event.key === 'Home' && onReset) {
        event.preventDefault()
        onReset()
      } else if (event.key === 'Enter' && onReset) {
        // Enter is a natural "restore the default size" affordance.
        event.preventDefault()
        onReset()
      }
    },
    [onNudge, onReset, orientation],
  )

  const isVertical = orientation === 'vertical'

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      {...(ariaValueNow !== undefined
        ? {
            'aria-valuenow': Math.round(ariaValueNow),
            'aria-valuemin': Math.round(ariaValueMin ?? 0),
            'aria-valuemax': Math.round(ariaValueMax ?? 100),
          }
        : {})}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative z-10 flex shrink-0 items-center justify-center bg-border',
        'transition-colors hover:bg-primary/50 focus-visible:bg-primary',
        isVertical
          ? 'w-px cursor-col-resize'
          : 'h-px cursor-row-resize',
        className,
      )}
    >
      {/* Widens the grab target well past the 1px visual line. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute',
          isVertical ? '-inset-x-2 -inset-y-0' : '-inset-y-2 -inset-x-0',
        )}
      />
      {/* Visible on hover/focus, and always for touch, where there's no hover. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute h-8 w-1 rounded-full bg-primary opacity-0',
          'transition-opacity group-hover:opacity-60 group-focus-visible:opacity-100',
          '[@media(hover:none)]:opacity-40',
          isVertical ? '' : 'rotate-90',
        )}
      />
    </div>
  )
}