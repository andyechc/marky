import { useState } from 'react'
import { Moon } from 'lucide-react'

const ThemeCheckbox = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'true'
  })

  const handleTheme = () => {
    const newTheme = !isDark
    document.documentElement.classList.toggle('dark')
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme.toString())
  }

  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <Moon className="h-4 w-4" />
      <span className="text-sm">Dark Theme</span>
      <input type="checkbox" hidden checked={isDark} onChange={handleTheme} />
    </label>
  )
}

export default ThemeCheckbox