import { useState, useEffect } from "react";
import './footer.css'

const Footer = ({ length }) => {
  const [ space, setSpace ] = useState(null)
  
  useEffect(() => {
    if (length) {
      if (length.toLocaleString().length >= 5){ 
        setSpace(Math.floor((length / 1024)) + " klb")
      }
      else{
        setSpace(length + " b")
      }
    }
    
  }, [length]);
  
  return (
    <footer className="footer">
      <p>Length: { length || 0 }</p>
      <p>Space: { space || 0 }</p>
    </footer>
  )
}

export default Footer;