import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'select', label: 'Liste de choix' },
]

const EMPTY_FIELD = { label: '', type_champ: 'text', options: '', requis: false, actif: true, ordre: 0 }

export default function CustomFields() {
  const { profile } = useAuth()
  const [fields, setFields] = useState([])
  const [form, setForm] = useState(EMPTY_FIELD)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (profile?.role === 'admin') fetchFields()
  }, [profile])

  async function fetchFields() {
    const { data } = await supabase.from('custom_fields').select('*').order('ordre')
    if (data) setFields(data)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    if (editId) {
      await supabase.from('custom_fields').update(form).eq('id', editId)
      setMsg('Champ mis a jour!')
    } else {
      await supabase.from('custom_fields').insert([form])
      setMsg('Champ cree!')
    }
    setForm(EMPTY_FIELD)
    setEditId(null)
    setLoading(false)
    fetchFields()
  }

  function handleEdit(field) {
    setForm({
      label: field.label,
      type_champ: field.type_champ,
      options: field.options || '',
      requis: field.requis,
      actif: field.actif,
      ordre: field.ordre,
    })
    setEditId(field.id)
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce champ?')) return
    await supabase.from('custom_fields').delete().eq('id', id)
    fetchFields()
  }

  async function toggleActif(field) {
    await supabase.from('custom_fields').update({ actif: !field.actif }).eq('id', field.id)
    fetchFields()
  }

  if (profile?.role !== 'admin') {
    return <div className="page-container"><p>Acces refuse.</p></div>
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Gestion des champs personnalises</h1>
      {msg && <div className="success-msg">{msg}</div>}

      <div className="form-card">
        <h2>{editId ? 'Modifier le champ' : 'Ajouter un champ'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom du champ *</label>
              <input
                type="text"
                name="label"
                className="form-input"
                value={form.label}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="type_champ" className="form-input" value={form.type_champ} onChange={handleChange}>
                {TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.type_champ === 'select' && (
            <div className="form-group">
              <label>Options (separees par virgule)</label>
              <input
                type="text"
                name="options"
                className="form-input"
                placeholder="Option1,Option2,Option3"
                value={form.options}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Ordre d affichage</label>
              <input
                type="number"
                name="ordre"
                className="form-input"
                value={form.ordre}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{display:'flex', alignItems:'center', gap:'1rem', paddingTop:'1.5rem'}}>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer'}}>
                <input type="checkbox" name="requis" checked={form.requis} onChange={handleChange} />
                Obligatoire
              </label>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer'}}>
                <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange} />
                Actif
              </label>
            </div>
          </div>

          <div className="form-actions">
            {editId && (
              <button type="button" className="btn-secondary" onClick={() => { setForm(EMPTY_FIELD); setEditId(null) }}>
                Annuler
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : (editId ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>

      <div className="form-card" style={{marginTop:'2rem'}}>
        <h2>Champs existants ({fields.length})</h2>
        {fields.length === 0 ? (
          <p style={{color:'#888'}}>Aucun champ personnalise cree.</p>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid #e5e7eb'}}>
                <th style={{textAlign:'left', padding:'0.5rem'}}>Ordre</th>
                <th style={{textAlign:'left', padding:'0.5rem'}}>Nom</th>
                <th style={{textAlign:'left', padding:'0.5rem'}}>Type</th>
                <th style={{textAlign:'left', padding:'0.5rem'}}>Requis</th>
                <th style={{textAlign:'left', padding:'0.5rem'}}>Statut</th>
                <th style={{textAlign:'left', padding:'0.5rem'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(field => (
                <tr key={field.id} style={{borderBottom:'1px solid #e5e7eb'}}>
                  <td style={{padding:'0.5rem'}}>{field.ordre}</td>
                  <td style={{padding:'0.5rem'}}>{field.label}</td>
                  <td style={{padding:'0.5rem'}}>{TYPES.find(t => t.value === field.type_champ)?.label || field.type_champ}</td>
                  <td style={{padding:'0.5rem'}}>{field.requis ? 'Oui' : 'Non'}</td>
                  <td style={{padding:'0.5rem'}}>
                    <button
                      onClick={() => toggleActif(field)}
                      style={{
                        padding:'0.25rem 0.75rem',
                        borderRadius:'9999px',
                        border:'none',
                        cursor:'pointer',
                        background: field.actif ? '#d1fae5' : '#fee2e2',
                        color: field.actif ? '#065f46' : '#991b1b',
                      }}
                    >
                      {field.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td style={{padding:'0.5rem', display:'flex', gap:'0.5rem'}}>
                    <button onClick={() => handleEdit(field)} className="btn-secondary" style={{padding:'0.25rem 0.75rem', fontSize:'0.875rem'}}>
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(field.id)} style={{padding:'0.25rem 0.75rem', fontSize:'0.875rem', background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:'6px', cursor:'pointer'}}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
