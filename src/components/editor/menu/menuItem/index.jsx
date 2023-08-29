import './menuItem.css'

function MenuItem ({ label, onClick, children }) {
  return (
    <li className="file-system-item" onClick={ onClick }>
      { children }
      <p>{ label }</p>
    </li>
  )
}

export default MenuItem;