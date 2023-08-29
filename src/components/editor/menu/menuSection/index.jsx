import './menuSection.css'

function MenuSection ({ header, children }) {
  return (
    <section className="menu-section">
      <header>
        <strong>{ header }</strong>
      </header>
      
      <ul>
        { children }
      </ul>
    </section>
  )
}

export default MenuSection;