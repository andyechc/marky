import { useState, useEffect, useContext } from "react"
import { FileContext } from '/src/context/fileContext'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileText, Clock, Hash, Zap } from 'lucide-react'

function Footer() {
  const { text, fileName } = useContext(FileContext)
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    lines: 0,
    readingTime: 0,
    size: '0 bytes'
  })

  useEffect(() => {
    if (text) {
      const characters = text.length
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const lines = text.split('\n').length
      const readingTime = Math.ceil(words / 200) // Average reading speed
      
      let size
      if (characters >= 1024 * 1024) {
        size = `${(characters / (1024 * 1024)).toFixed(2)} MB`
      } else if (characters >= 1024) {
        size = `${(characters / 1024).toFixed(1)} KB`
      } else {
        size = `${characters} bytes`
      }

      setStats({
        characters,
        words,
        lines,
        readingTime,
        size
      })
    } else {
      setStats({
        characters: 0,
        words: 0,
        lines: 0,
        readingTime: 0,
        size: '0 bytes'
      })
    }
  }, [text])

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-10 items-center px-4">
        <div className="flex flex-1 items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>{fileName}</span>
            </div>
            
            <Separator orientation="vertical" className="h-4" />
            
            <div className="flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span>{stats.words} words</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>{stats.characters} chars</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>{stats.lines} lines</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{stats.readingTime} min read</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>{stats.size}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer