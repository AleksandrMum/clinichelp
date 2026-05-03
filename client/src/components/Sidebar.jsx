import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { NAVIGATION_BY_ROLE } from '../router/navigation'

export function Sidebar() {
  const { user } = useAuth()
  const links = user ? NAVIGATION_BY_ROLE[user.role] : []

  return (
    <aside className="sidebar">
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={Boolean(link.exact)}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
