import { useEffect, useMemo, useRef, useState } from 'react'
import { ListTree, Clock, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Outline } from './outline'
import { RecentFiles, SidebarSection } from './recent-files'
import { AiInstructionsCta } from './ai-instructions'
import { useSettings } from '@/context/settingsContext'
import { extractOutline } from '@/lib/markdownActions'
import { storage, STORAGE_KEYS } from '@/lib/storage'

/**
 * Sidebar with the document outline and recent files.
 *
 * The panel is a resizable, collapsible column on wide screens and an overlay
 * drawer below `lg`; that presentation is chosen by `ResizableSidebar`, not by
 * measuring the window here.
 *
 * This returns only the panel's *content*. The chrome — width, border, clipping,
 * rounding — belongs to the `<aside>` in `ResizableSidebar`, so nothing is
 * nested inside the box the user drags.
 */
export function Sidebar({
  markdown,
  fileName,
  activeHeadingId,
  onNavigateOutline,
  onOpenRecent,
  onRenameRecent,
  onDeleteRecent,
  onOpenInstructions,
}) {
  const { update } = useSettings()
  const [query, setQuery] = useState('')
  const [recentCount, setRecentCount] = useState(0)
  const searchRef = useRef(null)

  const headingCount = useMemo(() => extractOutline(markdown).length, [markdown])

  // The recent list lives in storage; the count tracks it so the section badge
  // stays correct without threading state through the child.
  useEffect(() => {
    const read = () => {
      const list = storage.get(STORAGE_KEYS.recent, [])
      setRecentCount(Array.isArray(list) ? list.length : 0)
    }
    read()
    const onStorage = (event) => {
      if (event.key?.startsWith('marky:')) read()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [fileName])

  return (
    <>
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2
                         text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor="sidebar-search" className="visually-hidden">
              Filtrar títulos y documentos
            </label>
            <input
              id="sidebar-search"
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.preventDefault()
                  setQuery('')
                }
              }}
              placeholder="Filtrar…"
              className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2
                         text-[13px] outline-none transition-colors
                         focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25
                         [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            // Only meaningful in the overlay presentation on small screens.
            className="lg:hidden"
            onClick={() => update({ showSidebar: false })}
            aria-label="Cerrar panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-area">
        <SidebarSection
          title="Esquema"
          icon={ListTree}
          count={headingCount || undefined}
          defaultOpen={!query}
        >
          <Outline
            markdown={markdown}
            onNavigate={onNavigateOutline}
            activeId={activeHeadingId}
            query={query}
          />
        </SidebarSection>

        <SidebarSection
          title="Recientes"
          icon={Clock}
          count={recentCount || undefined}
          defaultOpen={!query}
        >
          <RecentFiles
            activeName={fileName}
            onOpen={onOpenRecent}
            onRename={onRenameRecent}
            onDelete={onDeleteRecent}
            query={query}
          />
        </SidebarSection>

      </div>

      {/* Sits below the scroll area rather than inside it: it is an entry point
          to a modal, not a panel whose contents you read in place. */}
      <AiInstructionsCta onOpen={onOpenInstructions} />
    </>
  )
}
