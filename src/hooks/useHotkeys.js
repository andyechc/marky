import { useCallback, useEffect, useRef } from 'react'

const isEditableTarget = (node) =>
  node instanceof HTMLElement &&
  (node.tagName === 'INPUT' ||
    node.tagName === 'TEXTAREA' ||
    node.tagName === 'SELECT' ||
    node.isContentEditable)

/**
 * Registers a map of keyboard shortcuts on a single window listener.
 *
 * `handlers` is read through a ref, so callers can pass an inline object
 * without re-binding the listener on every render; pass `deps` to control when
 * that ref is refreshed.
 *
 * The previous implementation advertised ~15 shortcuts in a help modal while
 * wiring up only five, and `Cmd+S` dispatched an event nobody handled.
 * Shortcut names are normalised to `Mod+Shift+key`, where `Mod` is Cmd on macOS
 * and Ctrl elsewhere.
 */
export function useHotkeys(handlers, deps = []) {
  const ref = useRef(handlers)

  useEffect(() => {
    ref.current = handlers
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented) return

      const mod = event.metaKey || event.ctrlKey
      const key = event.key
      const lower = key.length === 1 ? key.toLowerCase() : key

      // Leave the browser's own reload chord alone.
      if (mod && lower === 'r' && !event.shiftKey) return

      if (key === 'Escape') {
        ref.current.Escape?.(event)
        return
      }

      // Unmodified keys belong to whatever field has focus.
      if (!mod && isEditableTarget(event.target)) return

      const combo = [
        event.altKey ? 'Alt' : '',
        event.shiftKey ? 'Shift' : '',
        mod ? 'Mod' : '',
        lower,
      ]
        .filter(Boolean)
        .join('+')

      ref.current[combo]?.(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

/** Builds the modifier-prefixed name used as a shortcut map key. */
export function combo({ mod = true, shift = false, alt = false, key }) {
  return [alt ? 'Alt' : '', shift ? 'Shift' : '', mod ? 'Mod' : '', key].filter(Boolean).join('+')
}

/** True when the platform's primary modifier is held (Cmd on macOS, Ctrl elsewhere). */
export function isMod(event) {
  return event.metaKey || event.ctrlKey
}

/** Detects the platform so shortcut labels can show ⌘ vs Ctrl. */
export function usePlatform() {
  const get = useCallback(() => {
    if (typeof navigator === 'undefined') return 'mac'
    return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? 'mac' : 'other'
  }, [])

  const platform = get()
  return {
    platform,
    modKey: platform === 'mac' ? '⌘' : 'Ctrl',
    // The shortcut overlay always shows the symbol, with the word in the title.
    isMac: platform === 'mac',
  }
}