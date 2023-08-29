import useTheme from "/src/hooks/useTheme"
import { MoonIcon } from "/src/components/icons"
import './themeCheckbox.css'

const ThemeCheckbox = () => {
  const { isDark, setIsDark } = useTheme()
  
  const handleTheme = () => {
    document.querySelector(":root").classList.toggle('dark')
    setIsDark(!isDark)
    localStorage.setItem('theme', JSON.stringify(!isDark))
  }
  
  return (
    <label className="theme-checkbox">
      <MoonIcon size="1.4em" className={ isDark ? "moon-dark" : null } />
      Dark Theme
      
      <input type="checkbox" hidden={true} checked={isDark} onChange={handleTheme}/>
    </label>
  )
}

export default ThemeCheckbox;