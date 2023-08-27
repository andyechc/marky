import { useState, useEffect } from "react"

export default function useTheme () {
  const [ isDark, setIsDark ] = useState(false)
  
  useEffect(() => {
    const cacheTheme = JSON.parse(localStorage.getItem('theme'))
    
    if (cacheTheme === true) {
      setIsDark(cacheTheme)
      document.querySelector(":root").classList.toggle('dark')
    }
  }, []);
  
  return { isDark, setIsDark }
}