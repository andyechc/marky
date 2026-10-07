import { lazy, Suspense, memo, useEffect } from 'react'
import { useSettings, FONT_SIZES } from '@/context/settingsContext'
import { cn } from '@/lib/utils'

/**
 * Markdown preview.
 *
 * The renderer and syntax highlighter together are the heaviest dependencies in
 * the app (~780kB raw), so they load lazily: the editor is usable as soon as
 * the shell paints, and a preview-only error can't take the page down.
 */
const MarkdownBody = lazy(() =>
  import('./markdown-body').then((module) => ({ default: module.default })),
)

function Preview({ markdown, className, onRendered }) {
  const { settings } = useSettings()
  const previewSize = FONT_SIZES.find((f) => f.id === settings.previewFontSize)?.px ?? 16
  const hasContent = markdown.trim().length > 0

  // Fires once the lazily loaded body has committed its headings, so the
  // outline can be positioned before the first scroll.
  useEffect(() => {
    if (hasContent) onRendered?.()
  }, [hasContent, onRendered])

  if (!hasContent) {
    return (
      <div className={cn('flex h-full items-center justify-center p-8', className)}>
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-foreground">Nada que previsualizar todavía</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Empieza a escribir markdown y el resultado aparecerá aquí al instante.
          </p>
        </div>
      </div>
    )
  }

  return (
    <article
      className={cn('prose-markdown px-6 py-6 sm:px-8', className)}
      style={{ '--preview-font-size': `${previewSize}px` }}
    >
      <Suspense
        fallback={
          <p className="text-[13px] text-muted-foreground" role="status">
            Preparando la vista previa…
          </p>
        }
      >
        <MarkdownBody markdown={markdown} />
      </Suspense>
    </article>
  )
}

export default memo(Preview)