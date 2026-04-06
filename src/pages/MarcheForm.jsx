import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

export default function MarcheForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    titre: '',
    description: '',
    statut: 'ouvert',
    date_limite: '',
    budget: '',
    categorie: '',
    region: '',
    contact_email: '',
  });

  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCustomFields();
    if (isEdit) fetchMarche();
  }, [id]);

  async function fetchCustomFields() {
    const { data } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('actif', true)
      .order('ordre');
    if (data) setCustomFields(data);
  }

  async function fetchMarche() {
    const { data } = await supabase.from('marches').select('*').eq('id', id).single();
    if (data) {
      setForm({
        titre: data.titre || '',
        description: data.description || '',
        statut: data.statut || 'ouvert',
        date_limite: data.date_limite || '',
        budget: data.budget || '',
        categorie: data.categorie || '',
        region: data.region || '',
        contact_email: data.contact_email || '',
      });
      const { data: vals } = await supabase
        .from('marche_custom_values')
        .select('*')
        .eq('marche_id', id);
      if (vals) {
        const map = {};
        vals.forEach(v => { map[v.custom_field_id] = v.valeur; });
        setCustomValues(map);
      }
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleCustomChange(fieldId, value) {
    setCustomValues({ ...customValues, [fieldId]: value });
  }

  function renderCustomField(field) {
    const value = customValues[field.id] || '';
    switch (field.type_champ) {
      case 'number':
        return (
          <input
            type="number"
            className="form-input"
            value={value}
            onChange={e => handleCustomChange(field.id, e.target.value)}
            required={field.requis}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="form-input"
            value={value}
            onChange={e => handleCustomChange(field.id, e.target.value)}
            required={field.requis}
          />
        );
      case 'boolean':
        return (
          <select
            className="form-input"
            value={value}
            onChange={e => handleCustomChange(field.id, e.target.value)}
            required={field.requis}
          >
            <option value="">-- Choisir --</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        );
      case 'select':
        return (
          <select
            className="form-input"
            value={value}
            onChange={e => handleCustomChange(field.id, e.target.value)}
            required={field.requis}
          >
            <option value="">-- Choisir --</option>
            {(field.options || '').split(',').map(opt => (
              <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            className="form-input"
            value={value}
            onChange={e => handleCustomChange(field.id, e.target.value)}
            required={field.requis}
          />
        );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
      created_by: profile?.id,
    };

    let marcheId = id;

    if (isEdit) {
      const { error: err } = await supabase.from('marches').update(payload).eq('id', id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { data, error: err } = await supabase.from('marches').insert([payload]).select().single();
      if (err) { setError(err.message); setLoading(false); return; }
      marcheId = data.id;
    }

    for (const field of customFields) {
      const valeur = customValues[field.id];
      if (valeur !== undefined && valeur !== '') {
        const existing = await supabase
          .from('marche_custom_values')
          .select('id')
          .eq('marche_id', marcheId)
          .eq('custom_field_id', field.id)
          .single();
        if (existing.data) {
          await supabase.from('marche_custom_values').update({ valeur }).eq('id', existing.data.id);
        } else {
          await supabase.from('marche_custom_values').insert([{ marche_id: marcheId, custom_field_id: field.id, valeur }]);
        }
      }
    }

    setSuccess('Marche enregistre!');
    setLoading(false);
    setTimeout(() => navigate('/marches'), 1500);
  }

  return (
    <div className="page-container">
      <h1 className="page-title">{isEdit ? 'Modifier le marche' : 'Nouveau marche'}</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h3>Informations generales</h3>
          <div className="form-group">
            <label>Titre *</label>
            <input type="text" name="titre" className="form-input" value={form.titre} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-input" rows={4} value={form.description} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Statut</label>
              <select name="statut" className="form-input" value={form.statut} onChange={handleChange}>
                <option value="ouvert">Ouvert</option>
                <option value="ferme">Ferme</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Termine</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date limite</label>
              <input type="date" name="date_limite" className="form-input" value={form.date_limite} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget (MAD)</label>
              <input type="number" name="budget" className="form-input" value={form.budget} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Categorie</label>
              <input type="text" name="categorie" className="form-input" value={form.categorie} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Region</label>
              <input type="text" name="region" className="form-input" value={form.region} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email de contact</label>
              <input type="email" name="contact_email" className="form-input" value={form.contact_email} onChange={handleChange} />
            </div>
          </div>
        </div>

        {customFields.length > 0 && (
          <div className="form-section">
            <h3>Parametres personnalises</h3>
            <div className="form-row" style={{flexWrap:'wrap'}}>
              {customFields.map(field => (
                <div className="form-group" key={field.id}>
                  <label>{field.label}{field.requis ? ' *' : ''}</label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/marches')} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Creer')}
          </button>
        </div>
      </form>
    </div>
  );
}
