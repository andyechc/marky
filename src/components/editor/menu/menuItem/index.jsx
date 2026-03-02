function MenuItem({ label, onClick, children }) {
  return (
    <li className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer" onClick={onClick}>
      {children}
      <p className="text-sm">{label}</p>
    </li>
  )
}

export default MenuItem