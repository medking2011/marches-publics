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
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

  const isAdmin = profile?.role === 'admin'

  useEffect(() => { loadFields() }, [])

  async function loadFields() {
        const { data } = await supabase.from('custom_fields').select('*').order('ordre')
        if (data) setFields(data)
  }

  function handleChange(e) {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
        e.preventDefault()
        if (!isAdmin) return
        setLoading(true)
        setError('')
        setSuccess('')
        const payload = { ...form, ordre: Number(form.ordre) || 0 }
        if (editId) {
                const { error: err } = await supabase.from('custom_fields').update(payload).eq('id', editId)
                if (err) { setError(err.message); setLoading(false); return }
                setSuccess('Champ mis à jour avec succès')
        } else {
                const { error: err } = await supabase.from('custom_fields').insert(payload)
                if (err) { setError(err.message); setLoading(false); return }
                setSuccess('Champ créé avec succès')
        }
        setForm(EMPTY_FIELD)
        setEditId(null)
        setLoading(false)
        loadFields()
  }

  function handleEdit(field) {
        setEditId(field.id)
        setForm({ label: field.label, type_champ: field.type_champ, options: field.options || '', requis: field.requis, actif: field.actif, ordre: field.ordre })
        setError('')
        setSuccess('')
  }

  async function handleToggle(field) {
        if (!isAdmin) return
        await supabase.from('custom_fields').update({ actif: !field.actif }).eq('id', field.id)
        loadFields()
  }

  async function handleDelete(id) {
        if (!isAdmin) return
        if (!window.confirm('Supprimer ce champ personnalisé ?')) return
        await supabase.from('custom_fields').delete().eq('id', id)
        loadFields()
  }

  function cancelEdit() {
        setEditId(null)
        setForm(EMPTY_FIELD)
        setError('')
        setSuccess('')
  }

  if (!isAdmin) {
        return (
                <div className="page">
                        <div className="page-header"><h1>Accès refusé</h1>h1></div>div>
                        <p>Cette page est réservée aux administrateurs.</p>p>
                </div>div>
              )
  }
  
    return (
          <div className="page">
                <div className="page-header">
                        <h1>Champs personnalisés</h1>h1>
                        <p style={{color:'#aaa', marginTop:'4px'}}>Ajoutez vos propres paramètres aux marchés</p>p>
                </div>div>
          
            {error && <div className="error-msg">{error}</div>div>}
            {success && <div className="success-msg">{success}</div>div>}
          
                <div className="form-grid" style={{marginBottom:'2rem'}}>
                        <div className="form-section">
                                  <h3>{editId ? 'Modifier le champ' : 'Nouveau champ personnalisé'}</h3>h3>
                                  <form onSubmit={handleSubmit}>
                                              <div className="form-row">
                                                            <div className="form-group">
                                                                            <label>Libellé *</label>label>
                                                                            <input name="label" value={form.label} onChange={handleChange} required placeholder="Ex: Numéro de commande" />
                                                            </div>div>
                                                            <div className="form-group">
                                                                            <label>Type</label>label>
                                                                            <select name="type_champ" value={form.type_champ} onChange={handleChange}>
                                                                              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>option>)}
                                                                            </select>select>
                                                            </div>div>
                                              </div>div>
                                    {form.type_champ === 'select' && (
                          <div className="form-group">
                                          <label>Options (séparées par virgule)</label>label>
                                          <input name="options" value={form.options} onChange={handleChange} placeholder="Option1, Option2, Option3" />
                          </div>div>
                                              )}
                                              <div className="form-row">
                                                            <div className="form-group">
                                                                            <label>Ordre d&apos;affichage</label>label>
                                                                            <input type="number" name="ordre" value={form.ordre} onChange={handleChange} min="0" />
                                                            </div>div>
                                                            <div className="form-group" style={{display:'flex', alignItems:'center', gap:'1rem', paddingTop:'1.5rem'}}>
                                                                            <label className="checkbox-label">
                                                                                              <input type="checkbox" name="requis" checked={form.requis} onChange={handleChange} />
                                                                                              Requis
                                                                            </label>label>
                                                                            <label className="checkbox-label">
                                                                                              <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange} />
                                                                                              Actif
                                                                            </label>label>
                                                            </div>div>
                                              </div>div>
                                              <div className="form-actions" style={{justifyContent:'flex-start', gap:'1rem'}}>
                                                            <button type="submit" disabled={loading} className="btn-primary">
                                                              {loading ? 'Enregistrement...' : (editId ? 'Mettre à jour' : 'Ajouter le champ')}
                                                            </button>button>
                                                {editId && <button type="button" onClick={cancelEdit} className="btn-secondary">Annuler</button>button>}
                                              </div>div>
                                  </form>form>
                        </div>div>
                </div>div>
          
                <div className="form-section">
                        <h3>Champs existants ({fields.length})</h3>h3>
                  {fields.length === 0 ? (
                      <p style={{color:'#aaa'}}>Aucun champ personnalisé pour l&apos;instant.</p>p>
                    ) : (
                      <table style={{width:'100%', borderCollapse:'collapse'}}>
                                  <thead>
                                                <tr style={{borderBottom:'1px solid #333'}}>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Libellé</th>th>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Type</th>th>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Options</th>th>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Ordre</th>th>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Requis</th>th>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Statut</th>th>
                                                                <th style={{textAlign:'left', padding:'8px', color:'#7c6af7'}}>Actions</th>th>
                                                </tr>tr>
                                  </thead>thead>
                                  <tbody>
                                    {fields.map(f => (
                                        <tr key={f.id} style={{borderBottom:'1px solid #222', opacity: f.actif ? 1 : 0.5}}>
                                                          <td style={{padding:'8px'}}>{f.label}</td>td>
                                                          <td style={{padding:'8px'}}>{TYPES.find(t => t.value === f.type_champ)?.label || f.type_champ}</td>td>
                                                          <td style={{padding:'8px', color:'#aaa', fontSize:'0.85em'}}>{f.options || '-'}</td>td>
                                                          <td style={{padding:'8px'}}>{f.ordre}</td>td>
                                                          <td style={{padding:'8px'}}>{f.requis ? '✓' : '-'}</td>td>
                                                          <td style={{padding:'8px'}}>
                                                                              <span style={{color: f.actif ? '#22c55e' : '#ef4444'}}>{f.actif ? 'Actif' : 'Inactif'}</span>span>
                                                          </td>td>
                                                          <td style={{padding:'8px', display:'flex', gap:'0.5rem'}}>
                                                                              <button onClick={() => handleEdit(f)} className="btn-secondary" style={{padding:'4px 10px', fontSize:'0.8em'}}>Éditer</button>button>
                                                                              <button onClick={() => handleToggle(f)} className="btn-secondary" style={{padding:'4px 10px', fontSize:'0.8em'}}>
                                                                                {f.actif ? 'Désactiver' : 'Activer'}
                                                                              </button>button>
                                                                              <button onClick={() => handleDelete(f.id)} style={{padding:'4px 10px', fontSize:'0.8em', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>Supprimer</button>button>
                                                          </td>td>
                                        </tr>tr>
                                      ))}
                                  </tbody>tbody>
                      </table>table>
                        )}
                </div>div>
          </div>div>
        )
}</div>
