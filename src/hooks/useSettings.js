import { useState, useEffect } from 'react'
import { safeStorage, safeJSONParse, safeJSONStringify } from '@/lib/security'

export function useSettings() {
  const [settings, setSettings] = useState({
    isDark: false,
    autoSave: true,
    fontSize: 'medium'
  })

  useEffect(() => {
    const saved = safeStorage.get('marky-settings')
    if (saved) {
      setSettings(saved)
      
      // Apply theme if saved
      if (saved.isDark) {
        document.documentElement.classList.add('dark')
      }
      
      // Apply font size if saved
      applyFontSize(saved.fontSize)
    }
  }, [])

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    safeStorage.set('marky-settings', updatedSettings)
    
    // Apply changes immediately
    if ('isDark' in newSettings) {
      if (newSettings.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    if ('fontSize' in newSettings) {
      applyFontSize(newSettings.fontSize)
    }
  }

  const resetSettings = () => {
    const defaultSettings = {
      isDark: false,
      autoSave: true,
      fontSize: 'medium'
    }
    setSettings(defaultSettings)
    safeStorage.remove('marky-settings')
    
    // Reset UI
    document.documentElement.classList.remove('dark')
    applyFontSize('medium')
  }

  return {
    settings,
    updateSettings,
    resetSettings
  }
}

function applyFontSize(size) {
  const root = document.documentElement
  const sizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px'
  }
  root.style.fontSize = sizeMap[size] || '16px'
}
