import { useMemo } from 'react'
import { ListTree } from 'lucide-react'
import { extractOutline } from '@/lib/markdownActions'
import { cn } from '@/lib/utils'

/**
 * Document outline built from the markdown headings. Clicking an entry reveals
 * it in the editor and moves the caret there.
 *
 * `activeId` tracks the heading currently under the preview's reading position,
 * so the outline doubles as a progress indicator while scrolling.
 */
export function Outline({ markdown, onNavigate, activeId, query }) {
  const all = useMemo(() => extractOutline(markdown), [markdown])

  // Filtering keeps every ancestor of a match, so a match on a subheading still
  // shows the parent sections that give it context.
  const outline = useMemo(() => {
    const term = query?.trim().toLowerCase()
    if (!term) return all

    const direct = all.filter((item) => item.label.toLowerCase().includes(term))
    const ids = new Set(direct.map((item) => item.id))

    return all.filter((item) => {
      if (ids.has(item.id)) return true
      // Keep lower-level sections whose ancestors match.
      for (let level = item.level - 1; level >= 1; level -= 1) {
        const ancestor = all.find(
          (candidate) => candidate.level === level && candidate.line < item.line,
        )
        if (ancestor && ids.has(ancestor.id)) return true
      }
      return false
    })
  }, [all, query])

  if (all.length === 0) {
    return (
      <div className="px-4 py-5 text-center">
        <ListTree className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Añade títulos con{' '}
          <code className="rounded bg-surface-muted px-1 font-mono text-xs">#</code> para ver el
          esquema aquí.
        </p>
      </div>
    )
  }

  if (outline.length === 0) {
    return (
      <p className="px-4 py-5 text-[13px] text-muted-foreground">
        Ningún título coincide con «{query.trim()}».
      </p>
    )
  }

  return (
    <nav aria-label="Esquema del documento">
      {/*
        `px-2` insets the row backgrounds from the panel edge; the per-level
        indent below is then measured from that inset, so level 1 aligns with
        the recent-files rows instead of hugging the border.
      */}
      <ul className="space-y-0.5 px-2">
        {outline.map((item) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item)}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'block w-full truncate rounded-md py-1.5 pr-2 text-left text-[13px]',
                  'transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted',
                  isActive
                    ? 'bg-surface-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                // A left rule marks the active heading's depth without shifting text.
                style={{ paddingLeft: `${0.5 + (item.level - 1) * 0.75}rem` }}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}