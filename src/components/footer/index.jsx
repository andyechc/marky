import { useState, useEffect, useContext } from "react";
import { FileContext } from '/src/context/fileContext'
import './footer.css'

function Footer () {
  const { text } = useContext( FileContext )
  const [ space, setSpace ] = useState(null)
  
  useEffect(() => {
    if (text) {
      if (text.length.toLocaleString().length >= 5){ 
        setSpace(Math.floor((text.length / 1024)) + " klb")
      }
      else{
        setSpace(text.length + " b")
      }
    }
    
  }, [text]);
  
  return (
    <footer className="footer">
      <p>Length: { text.length || 0 }</p>
      <p>Space: { space || 0 }</p>
    </footer>
  )
}

export default Footer;