import useTheme from "/src/hooks/useTheme"
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
      Dark Theme
      <input type="checkbox" checked={isDark} onChange={handleTheme}/>
    </label>
  )
}

export default ThemeCheckbox;