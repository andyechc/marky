import { useCallback, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

const supportsClosedBy = () =>
  typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype

/**
 * Modal built on the native <dialog> element.
 *
 * Native dialogs give us the top layer, focus containment, inertness of the
 * page behind, and Escape handling for free. `closedby="any"` adds
 * light-dismiss declaratively where supported; the effect below is the
 * documented fallback for engines without it (notably Safari).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Escape + light-dismiss fallback for browsers without `closedby`.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return undefined
    if (supportsClosedBy()) return undefined

    const handleClick = (event) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inside) onClose()
    }
    dialog.addEventListener('click', handleClick)
    return () => dialog.removeEventListener('click', handleClick)
  }, [open, onClose])

  const handleCancel = useCallback(() => onClose(), [onClose])

  return (
    <dialog
      ref={ref}
      onCancel={handleCancel}
      onClose={onClose}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      {...(supportsClosedBy() ? { closedby: 'any' } : {})}
        className={cn(
          'w-[min(34rem,calc(100vw-2rem))]',
          // `flex` here is load-bearing: it is what lets the body scroll inside
          // the max height instead of the dialog growing past it. It also beats
          // the user-agent `dialog:not([open]) { display: none }`, which is why
          // globals.css carries an unlayered copy of that rule. Keep them in sync.
          'flex flex-col',
          // Sits in the area *below* the fixed header, not centred in the
          // viewport. Centring on a short window pushed the top of the dialog,
          // and with it the close button, underneath the 3.5rem header bar.
          'mt-[calc(3.5rem+0.75rem)] mb-[0.75rem]',
          'max-h-[calc(100dvh-3.5rem-1.5rem)]',
          'rounded-xl border border-border bg-surface p-0 text-foreground shadow-lg',
          'open:animate-dialog-in',
          'mx-auto',
          className,
        )}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1 text-[13px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/*
        A flex column with a scrolling body, so a long form scrolls inside the
        dialog instead of growing past its max height and clipping.

        `overflow-x-clip` is the load-bearing half: an element with a scrolling
        `overflow-y` has its `overflow-x` computed to `auto`, so without this a
        single wide child anywhere in the body — a horizontal rail, a long
        unbroken string — silently turns the whole dialog into a sideways
        scroller. `clip` cannot be scrolled at all, only cropped.
      */}
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overflow-x-clip px-5 py-4',
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-muted/50 px-5 py-3.5">
          {footer}
        </div>
      )}
    </dialog>
  )
}