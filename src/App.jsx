import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Marches from './pages/Marches'
import MarcheForm from './pages/MarcheForm'
import AuditLog from './pages/AuditLog'
import CustomFields from './pages/CustomFields'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Chargement...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="marches" element={<Marches />} />
            <Route path="marches/new" element={<MarcheForm />} />
            <Route path="marches/:id/edit" element={<MarcheForm />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="custom-fields" element={<CustomFields />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
