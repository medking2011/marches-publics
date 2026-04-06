import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">MP</div>
          <span className="sidebar-title">Marches Publics</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/pipeline" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            Pipeline
          </NavLink>
          <NavLink to="/marches" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            Marches
          </NavLink>
          <NavLink to="/audit-log" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            Journal
          </NavLink>
          {isAdmin && (
            <NavLink to="/custom-fields" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              Champs perso.
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="user-name">{profile?.full_name || profile?.email}</span>
          <button onClick={handleSignOut} className="signout-btn">Deconnexion</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
