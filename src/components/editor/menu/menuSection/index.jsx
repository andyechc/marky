function MenuSection({ header, children }) {
  return (
    <section className="mb-4">
      <header className="mb-2">
        <strong className="text-sm text-muted-foreground">{header}</strong>
      </header>
      
      <ul className="space-y-1">
        {children}
      </ul>
    </section>
  )
}

export default MenuSection