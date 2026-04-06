📋é📊🔄📁é📝⚙️éimport { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>📋 Marchés</h1>
          <p className="user-name">{profile?.nom || 'Utilisateur'}</p>
          <span className="role-badge">{profile?.role || 'commercial'}</span>
        </div>
        <nav>
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/pipeline" className={({isActive}) => isActive ? 'active' : ''}>
            🔄 Pipeline
          </NavLink>
          <NavLink to="/marches" className={({isActive}) => isActive ? 'active' : ''}>
            📁 Marchés
          </NavLink>
          <NavLink to="/audit" className={({isActive}) => isActive ? 'active' : ''}>
            📝 Journal
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleSignOut} className="btn-signout">Déconnexion</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
