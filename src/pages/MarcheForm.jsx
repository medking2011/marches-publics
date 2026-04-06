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
    const [customFields, setCustomFields] = useState([])
    const [customValues, setCustomValues] = useState({})

  useEffect(() => {
        loadCustomFields()
        if (isEdit) loadMarche()
  }, [id])

  async function loadCustomFields() {
        const { data } = await supabase.from('custom_fields').select('*').eq('actif', true).order('ordre')
        if (data) setCustomFields(data)
  }

  async function loadMarche() {
        const { data } = await supabase.from('marches').select('*').eq('id', id).single()
        if (data) {
                const clean = Object.fromEntries(Object.entries(data).map(([k,v]) => [k, v === null ? (typeof EMPTY[k] === 'boolean' ? false : '') : v]))
                setForm(clean)
                setOriginal(clean)
        }
        const { data: cvData } = await supabase.from('marche_custom_values').select('*').eq('marche_id', id)
        if (cvData) {
                const vals = {}
                        cvData.forEach(cv => { vals[cv.custom_field_id] = cv.valeur })
                setCustomValues(vals)
        }
  }

  function handleChange(e) {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleCustomChange(fieldId, value) {
        setCustomValues(prev => ({ ...prev, [fieldId]: value }))
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

      // Save custom field values
      for (const field of customFields) {
              const val = customValues[field.id] ?? ''
              const { data: existing } = await supabase.from('marche_custom_values')
                .select('id').eq('marche_id', marcheId).eq('custom_field_id', field.id).single()
              if (existing) {
                        await supabase.from('marche_custom_values').update({ valeur: String(val) })
                          .eq('marche_id', marcheId).eq('custom_field_id', field.id)
              } else {
                        await supabase.from('marche_custom_values').insert({
                                    marche_id: marcheId, custom_field_id: field.id, valeur: String(val)
                        })
              }
      }

      navigate('/marches')
  }

  function renderCustomField(field) {
        const val = customValues[field.id] ?? ''
        switch (field.type_champ) {
          case 'number':
                    return <input type="number" value={val} onChange={e => handleCustomChange(field.id, e.target.value)} />
          case 'date':
                    return <input type="date" value={val} onChange={e => handleCustomChange(field.id, e.target.value)} />
          case 'boolean':
                    return (
                                <label className="checkbox-label">
                                            <input type="checkbox" checked={val === 'true' || val === true} onChange={e => handleCustomChange(field.id, e.target.checked)} />
                                  {field.label}
                                </label>label>
                              )
          case 'select':
                    return (
                                <select value={val} onChange={e => handleCustomChange(field.id, e.target.value)}>
                                            <option value="">-- Choisir --</option>option>
                                  {(field.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                                                <option key={o} value={o}>{o}</option>option>
                                              ))}
                                </select>select>
                              )
          default:
                    return <input type="text" value={val} onChange={e => handleCustomChange(field.id, e.target.value)} />
        }
  }
  
    return (
          <div className="page marche-form">
                <div className="page-header">
                        <h1>{isEdit ? 'Modifier le marché' : 'Nouveau marché'}</h1>h1>
                </div>div>
                
            {error && <div className="error-msg">{error}</div>div>}
                
                <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-section">
                                  <h3>Informations générales</h3>h3>
                                  <div className="form-row">
                                              <div className="form-group">
                                                            <label>Référence *</label>label>
                                                            <input name="ref" value={form.ref} onChange={handleChange} required />
                                              </div>div>
                                              <div className="form-group">
                                                            <label>État</label>label>
                                                            <select name="etat" value={form.etat} onChange={handleChange}>
                                                              {ETATS.map(e => <option key={e} value={e}>{e}</option>option>)}
                                                            </select>select>
                                              </div>div>
                                  </div>div>
                                  <div className="form-group">
                                              <label>Titre</label>label>
                                              <input name="titre" value={form.titre} onChange={handleChange} />
                                  </div>div>
                                  <div className="form-row">
                                              <div className="form-group">
                                                            <label>Lot</label>label>
                                                            <input name="lot" value={form.lot} onChange={handleChange} />
                                              </div>div>
                                              <div className="form-group">
                                                            <label>Type de marché</label>label>
                                                            <select name="type_marche" value={form.type_marche} onChange={handleChange}>
                                                                            <option value="fournitures">Fournitures</option>option>
                                                                            <option value="service">Service</option>option>
                                                                            <option value="travaux">Travaux</option>option>
                                                            </select>select>
                                              </div>div>
                                  </div>div>
                        </div>div>
                
                        <div className="form-section">
                                  <h3>Société & Lieu</h3>h3>
                                  <div className="form-row">
                                              <div className="form-group">
                                                            <label>Société concurrente</label>label>
                                                            <input name="societe" value={form.societe} onChange={handleChange} />
                                              </div>div>
                                              <div className="form-group">
                                                            <label>Ville</label>label>
                                                            <input name="ville" value={form.ville} onChange={handleChange} />
                                              </div>div>
                                  </div>div>
                                  <div className="form-row">
                                              <div className="form-group">
                                                            <label>Établissement</label>label>
                                                            <input name="etablissement" value={form.etablissement} onChange={handleChange} />
                                              </div>div>
                                              <div className="form-group">
                                                            <label>Estimation (DH)</label>label>
                                                            <input type="number" name="estimation" value={form.estimation} onChange={handleChange} min="0" />
                                              </div>div>
                                  </div>div>
                        </div>div>
                
                        <div className="form-section">
                                  <h3>Dates & Délais</h3>h3>
                                  <div className="form-row">
                                              <div className="form-group">
                                                            <label>Date d&apos;ouverture</label>label>
                                                            <input type="date" name="ouverture_date" value={form.ouverture_date} onChange={handleChange} />
                                              </div>div>
                                              <div className="form-group">
                                                            <label>Délai CD</label>label>
                                                            <input type="date" name="delai_cd" value={form.delai_cd} onChange={handleChange} />
                                              </div>div>
                                  </div>div>
                                  <div className="form-row">
                                              <div className="form-group">
                                                            <label>CD réalisé</label>label>
                                                            <input type="date" name="cd_realise" value={form.cd_realise || ''} onChange={handleChange} />
                                              </div>div>
                                              <div className="form-group">
                                                            <label>Délai livraison</label>label>
                                                            <input type="date" name="delai_livraison" value={form.delai_livraison} onChange={handleChange} />
                                              </div>div>
                                  </div>div>
                                  <div className="form-row checkboxes">
                                              <label className="checkbox-label">
                                                            <input type="checkbox" name="livre" checked={form.livre} onChange={handleChange} />
                                                            Livré
                                              </label>label>
                                              <label className="checkbox-label">
                                                            <input type="checkbox" name="payment" checked={form.payment} onChange={handleChange} />
                                                            Payé
                                              </label>label>
                                  </div>div>
                        </div>div>
                
                        <div className="form-section">
                                  <h3>Notes</h3>h3>
                                  <div className="form-group">
                                              <label>Échantillon</label>label>
                                              <input name="echantillon" value={form.echantillon} onChange={handleChange} />
                                  </div>div>
                                  <div className="form-group">
                                              <label>Notes</label>label>
                                              <textarea name="note" value={form.note} onChange={handleChange} rows={4} />
                                  </div>div>
                        </div>div>
                
                  {customFields.length > 0 && (
                      <div className="form-section">
                                  <h3>Paramètres personnalisés</h3>h3>
                                  <div className="form-row" style={{flexWrap:'wrap'}}>
                                    {customFields.map(field => (
                                        <div className="form-group" key={field.id}>
                                                          <label>{field.label}{field.requis ? ' *' : ''}</label>label>
                                          {renderCustomField(field)}
                                        </div>div>
                                      ))}
                                  </div>div>
                      </div>div>
                        )}
                
                        <div className="form-actions">
                                  <button type="button" onClick={() => navigate('/marches')} className="btn-secondary">Annuler</button>button>
                                  <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer le marché')}
                                  </button>button>
                        </div>div>
                </form>form>
          </div>div>
        )
}</label>
