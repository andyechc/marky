import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Minimal toast system. Replaces the Radix-based shadcn toast, whose queue
 * used a ~11-day removal delay and a limit of one visible toast.
 */

const ToastContext = createContext(null)

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
}

const TONES = {
  info: 'border-border',
  success: 'border-success/40',
  error: 'border-destructive/50',
}

const ICON_TONES = {
  info: 'text-muted-foreground',
  success: 'text-success',
  error: 'text-destructive',
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }) => {
      const id = ++nextId
      setToasts((prev) => [...prev.slice(-2), { id, title, description, variant }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      // Polite so status updates never interrupt typing.
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end"
    >
      {toasts.map(({ id, title, description, variant }) => {
        const Icon = ICONS[variant] ?? ICONS.info
        return (
          <div
            key={id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg',
              'border bg-surface p-3.5 pr-2.5 shadow-md animate-toast-in',
              TONES[variant],
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', ICON_TONES[variant])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{title}</p>
              {description && (
                <p className="mt-0.5 break-words text-[13px] text-muted-foreground">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(id)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              aria-label="Descartar notificación"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}