import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

/**
 * Splits vendor code out of the app chunk so a change to application code
 * doesn't invalidate ~1MB of cached vendor JS. The preview's syntax highlighter
 * is the single heaviest dependency and is only needed when a preview renders,
 * so it sits behind its own long-term cache entry.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // Markdown rendering: a stable cache entry separate from app code.
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('unified') ||
            id.includes('property-information') ||
            id.includes('space-separated') ||
            id.includes('comma-separated') ||
            id.includes('zwitch') ||
            id.includes('longest-streak') ||
            id.includes('ccount') ||
            id.includes('escape-string-regexp') ||
            id.includes('markdown-table') ||
            id.includes('trim-lines') ||
            id.includes('unist-util')
          ) {
            return 'markdown'
          }
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'react'
          }
          if (id.includes('lucide-react')) return 'icons'
          return 'vendor'
        },
      },
    },
  },
})