import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Subscribes to a CSS media query.
 *
 * Layout decisions that need a boolean (drawer vs column) read from here rather
 * than from `window.innerWidth` during render, which caused layout thrash and
 * hydration mismatches.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Matches Tailwind's `lg` breakpoint, where the layout stops being a drawer. */
export function useIsOverlaySidebar() {
  return !useMediaQuery('(min-width: 1024px)')
}

/** Debounces a rapidly changing value, e.g. a drag position. */
export function useDebouncedCallback(callback, delay) {
  const [timer, setTimer] = useState(null)

  useEffect(() => () => timer && clearTimeout(timer), [timer])

  return useCallback(
    (...args) => {
      if (timer) clearTimeout(timer)
      setTimer(setTimeout(() => callback(...args), delay))
    },
    [callback, delay, timer],
  )
}

export { useMemo }