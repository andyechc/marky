import { useState, useCallback } from 'react'
import { PanelLeft } from 'lucide-react'
import Menu from './menu'
import Writer from './writer'
import View from './view'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { SplitViewIcon, EditorIcon, PreviewIcon } from '../layout-icons'

function Editor() {
  const [showMenu, setShowMenu] = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [layout, setLayout] = useState('split') // 'split', 'editor', 'preview'

  const toggleLayout = useCallback(() => {
    setLayout(prev => {
      if (prev === 'split') return 'editor'
      if (prev === 'editor') return 'preview'
      return 'split'
    })
  }, [])

  return (
    <main className="flex flex-1 overflow-hidden">
      {showMenu && (
        <aside className="w-64 border-r bg-muted/30 hidden md:block">
          <Menu />
        </aside>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {(layout === 'split' || layout === 'editor') && (
          <div className={layout === 'split' ? 'flex-1 border-r' : 'flex-1'}>
            <Writer />
          </div>
        )}
        
        {(layout === 'split' || layout === 'preview') && (
          <div className={layout === 'split' ? 'flex-1' : 'flex-1'}>
            <View />
          </div>
        )}
      </div>
      
      <div className="fixed bottom-20 right-4 flex items-center gap-2 bg-background border rounded-lg p-1 shadow-lg z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="md:hidden"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        
        <Toggle
          pressed={layout === 'split'}
          onPressedChange={() => layout !== 'split' && setLayout('split')}
          size="sm"
        >
          <SplitViewIcon />
        </Toggle>
        
        <Toggle
          pressed={layout === 'editor'}
          onPressedChange={() => layout !== 'editor' && setLayout('editor')}
          size="sm"
        >
          <EditorIcon />
        </Toggle>
        
        <Toggle
          pressed={layout === 'preview'}
          onPressedChange={() => layout !== 'preview' && setLayout('preview')}
          size="sm"
        >
          <PreviewIcon />
        </Toggle>
      </div>
    </main>
  )
}

export default Editor