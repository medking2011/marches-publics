import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

const COLUMNS = [
  { id: 'SOUMIS', label: '📤 Soumis', color: '#6366f1' },
  { id: 'EN_ATTENTE', label: '⏳ En attente', color: '#f59e0b' },
  { id: 'ACCEPTE', label: '✅ Accepté', color: '#10b981' },
  { id: 'RETENU', label: '⭐ Retenu', color: '#3b82f6' },
  { id: 'LIVRE', label: '📦 Livré', color: '#8b5cf6' },
  { id: 'CLOTURE', label: '🏁 Clôturé', color: '#22c55e' },
  { id: 'NON_RETENU', label: '❌ Non retenu', color: '#ef4444' },
]

export default function Pipeline() {
  const [marches, setMarches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadMarches() }, [])

  async function loadMarches() {
    const { data } = await supabase.from('marches').select('*').order('created_at', { ascending: false })
    setMarches(data || [])
    setLoading(false)
  }

  async function changeEtat(marche, newEtat) {
    await supabase.from('marches').update({ etat: newEtat }).eq('id', marche.id)
    setMarches(prev => prev.map(m => m.id === marche.id ? {...m, etat: newEtat} : m))
  }

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <div className="page pipeline">
      <div className="page-header">
        <h1>Pipeline Kanban</h1>
        <Link to="/marches/new" className="btn-primary">+ Nouveau marché</Link>
      </div>
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colMarches = marches.filter(m => m.etat === col.id)
          return (
            <div key={col.id} className="kanban-column" style={{ borderTop: `3px solid ${col.color}` }}>
              <div className="kanban-header" style={{ color: col.color }}>
                {col.label}
                <span className="kanban-count">{colMarches.length}</span>
              </div>
              <div className="kanban-cards">
                {colMarches.map(m => (
                  <div key={m.id} className="kanban-card">
                    <div className="card-ref">{m.ref}</div>
                    <div className="card-title">{m.titre}</div>
                    {m.societe && <div className="card-societe">🏢 {m.societe}</div>}
                    {m.estimation > 0 && <div className="card-estimation">{m.estimation.toLocaleString()} DH</div>}
                    <div className="card-actions">
                      <Link to={`/marches/${m.id}/edit`} className="btn-edit">✏️</Link>
                      <select value={m.etat} onChange={e => changeEtat(m, e.target.value)} className="select-etat">
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                <Link to="/marches/new" className="kanban-add">+ Ajouter</Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}