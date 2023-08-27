import Logo from '../logo'
import ThemeCheckbox from './themeCheckbox'
import './header.css'

const Header = () => {
  return (
    <header className="header">
      <Logo />
      <ThemeCheckbox />
    </header>
  )
}

export default Header;