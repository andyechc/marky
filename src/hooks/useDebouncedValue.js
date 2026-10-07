import { useEffect, useState } from 'react'

/**
 * Returns `value` only after it has stopped changing for `delay` ms.
 *
 * Used for the markdown preview: re-parsing and rendering a long document on
 * every keystroke dominated the editor's frame budget, while the preview only
 * needs to be current, not instantaneous. The editor keeps the live value, so
 * typing never waits on it.
 */
export function useDebouncedValue(value, delay = 140) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    // Anything already queued is superseded by this change.
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}