import { useState, useEffect } from "react"

export default function useTheme () {
  const [ isDark, setIsDark ] = useState(false)
  
  useEffect(() => {
    const cacheTheme = JSON.parse(localStorage.getItem('theme'))
    
    if (cacheTheme) {
      document.querySelector(':root').classList.toggle('dark')
      setIsDark(cacheTheme)
    }
  }, []);
  
  return { isDark, setIsDark }
}
