import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ETATS = ['SOUMIS','EN_ATTENTE','ACCEPTE','RETENU','LIVRE','CLOTURE','NON_RETENU']

const EMPTY = {
  ref:'', titre:'', lot:'', type_marche:'fournitures', societe:'', ville:'', etablissement:'',
  estimation:0, ouverture_date:'', etat:'SOUMIS', echantillon:'',
  delai_cd:'', delai_livraison:'', livre:false, payment:false, note:''
}

export default function MarcheForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) loadMarche()
  }, [id])

  async function loadMarche() {
    const { data } = await supabase.from('marches').select('*').eq('id', id).single()
    if (data) {
      const clean = Object.fromEntries(Object.entries(data).map(([k,v]) => [k, v === null ? (typeof EMPTY[k] === 'boolean' ? false : '') : v]))
      setForm(clean)
      setOriginal(clean)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = { ...form, estimation: Number(form.estimation) || 0, updated_by: user?.id }
    
    // Clean empty dates
    ;['ouverture_date','delai_cd','delai_livraison','cd_realise'].forEach(f => { if (!payload[f]) payload[f] = null })

    let marcheId = id
    if (isEdit) {
      const { error: err } = await supabase.from('marches').update(payload).eq('id', id)
      if (err) { setError(err.message); setLoading(false); return }
      
      // Audit log - record changes
      if (original) {
        const changes = Object.keys(EMPTY).filter(k => form[k] !== original[k])
        for (const champ of changes) {
          await supabase.from('audit_log').insert({
            marche_id: id, marche_ref: form.ref, user_id: user?.id,
            user_nom: profile?.nom || user?.email, action: 'MODIFICATION',
            champ, ancienne_valeur: String(original[champ] ?? ''), nouvelle_valeur: String(form[champ] ?? '')
          })
        }
      }
    } else {
      payload.created_by = user?.id
      const { data, error: err } = await supabase.from('marches').insert(payload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      marcheId = data.id
      await supabase.from('audit_log').insert({
        marche_id: marcheId, marche_ref: form.ref, user_id: user?.id,
        user_nom: profile?.nom || user?.email, action: 'CREATION',
        champ: 'marche', ancienne_valeur: '', nouvelle_valeur: form.ref
      })
    }

    navigate('/marches')
  }

  return (
    <div className="page marche-form">
      <div className="page-header">
        <h1>{isEdit ? 'Modifier le marché' : 'Nouveau marché'}</h1>
      </div>
      
      {error && <div className="error-msg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-section">
          <h3>Informations générales</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Référence *</label>
              <input name="ref" value={form.ref} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>État</label>
              <select name="etat" value={form.etat} onChange={handleChange}>
                {ETATS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Titre</label>
            <input name="titre" value={form.titre} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lot</label>
              <input name="lot" value={form.lot} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Type de marché</label>
              <select name="type_marche" value={form.type_marche} onChange={handleChange}>
                <option value="fournitures">Fournitures</option>
                <option value="service">Service</option>
                <option value="travaux">Travaux</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Société & Lieu</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Société concurrente</label>
              <input name="societe" value={form.societe} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Ville</label>
              <input name="ville" value={form.ville} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Établissement</label>
              <input name="etablissement" value={form.etablissement} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Estimation (DH)</label>
              <input type="number" name="estimation" value={form.estimation} onChange={handleChange} min="0" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Dates & Délais</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Date d&apos;ouverture</label>
              <input type="date" name="ouverture_date" value={form.ouverture_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Délai CD</label>
              <input type="date" name="delai_cd" value={form.delai_cd} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>CD réalisé</label>
              <input type="date" name="cd_realise" value={form.cd_realise || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Délai livraison</label>
              <input type="date" name="delai_livraison" value={form.delai_livraison} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row checkboxes">
            <label className="checkbox-label">
              <input type="checkbox" name="livre" checked={form.livre} onChange={handleChange} />
              Livré
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="payment" checked={form.payment} onChange={handleChange} />
              Payé
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Notes</h3>
          <div className="form-group">
            <label>Échantillon</label>
            <input name="echantillon" value={form.echantillon} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={4} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/marches')} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer le marché')}
          </button>
        </div>
      </form>
    </div>
  )
}