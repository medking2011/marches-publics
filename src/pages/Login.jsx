import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    let err
    if (isSignUp) {
      err = await signUp(email, password, nom)
      if (!err) {
        setError('Vérifiez votre email pour confirmer votre inscription.')
        setLoading(false)
        return
      }
    } else {
      err = await signIn(email, password)
    }
    
    if (err) {
      setError(err.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>📋 Suivi Marchés Publics</h1>
        <h2>{isSignUp ? 'Créer un compte' : 'Connexion'}</h2>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Nom complet</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Chargement...' : (isSignUp ? 'Créer le compte' : 'Se connecter')}
          </button>
        </form>
        
        <p className="toggle-auth">
          {isSignUp ? 'Déjà un compte ?' : 'Pas de compte ?'}
          <button onClick={() => setIsSignUp(!isSignUp)} className="btn-link">
            {isSignUp ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </div>
    </div>
  )
}