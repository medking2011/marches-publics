import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ACTION_COLORS = { CREATION: '#10b981', MODIFICATION: '#f59e0b', SUPPRESSION: '#ef4444' }

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data || [])
    setLoading(false)
  }

  const filtered = logs.filter(l =>
    !search || 
    (l.marche_ref||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.user_nom||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.champ||'').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <div className="page audit">
      <div className="page-header">
        <h1>Journal des modifications</h1>
        <button onClick={loadLogs} className="btn-secondary">🔄 Actualiser</button>
      </div>

      <input 
        type="text" 
        placeholder="Rechercher par marché, utilisateur, champ..."
        value={search} 
        onChange={e => setSearch(e.target.value)}
        className="search-input"
        style={{marginBottom:'1rem', width:'100%'}}
      />

      <div className="table-container">
        <table className="marches-table">
          <thead>
            <tr><th>Date</th><th>Utilisateur</th><th>Marché</th><th>Action</th><th>Champ</th><th>Avant</th><th>Après</th></tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                <td><strong>{log.user_nom}</strong></td>
                <td>{log.marche_ref}</td>
                <td><span className="badge" style={{background: ACTION_COLORS[log.action]}}>{log.action}</span></td>
                <td>{log.champ}</td>
                <td className="old-val">{log.ancienne_valeur}</td>
                <td className="new-val">{log.nouvelle_valeur}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">Aucun journal trouvé</div>}
      </div>
    </div>
  )
}