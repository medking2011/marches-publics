import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ETAT_COLORS = { SOUMIS:'#6366f1', EN_ATTENTE:'#f59e0b', ACCEPTE:'#10b981', RETENU:'#3b82f6', LIVRE:'#8b5cf6', CLOTURE:'#22c55e', NON_RETENU:'#ef4444' }

export default function Marches() {
  const [marches, setMarches] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterEtat, setFilterEtat] = useState('')
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const today = new Date()

  useEffect(() => { loadMarches() }, [])
  
  useEffect(() => {
    let result = marches
    if (search) result = result.filter(m => 
      (m.titre||'').toLowerCase().includes(search.toLowerCase()) ||
      (m.ref||'').toLowerCase().includes(search.toLowerCase()) ||
      (m.societe||'').toLowerCase().includes(search.toLowerCase())
    )
    if (filterEtat) result = result.filter(m => m.etat === filterEtat)
    setFiltered(result)
  }, [marches, search, filterEtat])

  async function loadMarches() {
    const { data } = await supabase.from('marches').select('*').order('created_at', { ascending: false })
    setMarches(data || [])
    setLoading(false)
  }

  async function deleteMarche(id) {
    if (!confirm('Supprimer ce marché ?')) return
    await supabase.from('marches').delete().eq('id', id)
    setMarches(prev => prev.filter(m => m.id !== id))
  }

  function exportCSV() {
    const headers = ['ref','titre','lot','type_marche','societe','ville','estimation','etat','delai_cd','delai_livraison']
    const rows = filtered.map(m => headers.map(h => m[h] || '').join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'marches.csv'; a.click()
  }

  function isDeadlineSoon(dateStr) {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const diff = (d - today) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 20
  }

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <div className="page marches">
      <div className="page-header">
        <h1>Marchés ({filtered.length})</h1>
        <div className="header-actions">
          <button onClick={exportCSV} className="btn-secondary">📥 Export CSV</button>
          <Link to="/marches/new" className="btn-primary">+ Nouveau</Link>
        </div>
      </div>

      <div className="filters">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
        <select value={filterEtat} onChange={e => setFilterEtat(e.target.value)} className="filter-select">
          <option value="">Tous les états</option>
          {Object.keys(ETAT_COLORS).map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="marches-table">
          <thead>
            <tr>
              <th>Réf.</th><th>Titre</th><th>Société</th><th>Ville</th>
              <th>Estimation</th><th>État</th><th>Délai CD</th><th>Livraison</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td><strong>{m.ref}</strong></td>
                <td>{m.titre}</td>
                <td>{m.societe}</td>
                <td>{m.ville}</td>
                <td>{m.estimation ? m.estimation.toLocaleString() + ' DH' : '-'}</td>
                <td><span className="badge" style={{background: ETAT_COLORS[m.etat]}}>{m.etat}</span></td>
                <td className={isDeadlineSoon(m.delai_cd) ? 'deadline-warning' : ''}>{m.delai_cd ? new Date(m.delai_cd).toLocaleDateString('fr-FR') : '-'}</td>
                <td className={isDeadlineSoon(m.delai_livraison) ? 'deadline-warning' : ''}>{m.delai_livraison ? new Date(m.delai_livraison).toLocaleDateString('fr-FR') : '-'}</td>
                <td>
                  <Link to={`/marches/${m.id}/edit`} className="btn-sm">✏️</Link>
                  {profile?.role === 'admin' && <button onClick={() => deleteMarche(m.id)} className="btn-sm btn-danger">🗑️</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">Aucun marché trouvé</div>}
      </div>
    </div>
  )
}