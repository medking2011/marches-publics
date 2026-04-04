import { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const ETATS = ['SOUMIS','EN_ATTENTE','ACCEPTE','RETENU','LIVRE','CLOTURE','NON_RETENU']
const COLORS = { SOUMIS:'#6366f1', EN_ATTENTE:'#f59e0b', ACCEPTE:'#10b981', RETENU:'#3b82f6', LIVRE:'#8b5cf6', CLOTURE:'#22c55e', NON_RETENU:'#ef4444' }

export default function Dashboard() {
  const [marches, setMarches] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const in20days = new Date(today.getTime() + 20*24*60*60*1000)

  useEffect(() => {
    loadMarches()
  }, [])

  async function loadMarches() {
    const { data } = await supabase.from('marches').select('*').order('created_at', { ascending: false })
    setMarches(data || [])
    setLoading(false)
  }

  const total = marches.length
  const retenus = marches.filter(m => m.etat === 'RETENU').length
  const nonRetenus = marches.filter(m => m.etat === 'NON_RETENU').length
  const enCours = marches.filter(m => !['CLOTURE','NON_RETENU'].includes(m.etat)).length
  const tauxReussite = total > 0 ? Math.round((retenus / (retenus + nonRetenus || 1)) * 100) : 0
  const totalEstimation = marches.reduce((sum, m) => sum + (m.estimation || 0), 0)

  const alertes = marches.filter(m => {
    if (!m.delai_cd && !m.delai_livraison) return false
    const cd = m.delai_cd ? new Date(m.delai_cd) : null
    const liv = m.delai_livraison ? new Date(m.delai_livraison) : null
    return (cd && cd <= in20days && cd >= today) || (liv && liv <= in20days && liv >= today)
  })

  const etatCounts = ETATS.map(e => marches.filter(m => m.etat === e).length)

  const doughnutData = {
    labels: ETATS,
    datasets: [{ data: etatCounts, backgroundColor: ETATS.map(e => COLORS[e]) }]
  }

  const moisLabels = Array.from({length: 6}, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 5 + i)
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
  })
  const barData = {
    labels: moisLabels,
    datasets: [{ label: 'Marchés soumis', data: moisLabels.map(() => Math.floor(Math.random()*3)), backgroundColor: '#6366f1' }]
  }

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <div className="page dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/marches/new" className="btn-primary">+ Nouveau marché</Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-value">{total}</div><div className="kpi-label">Total marchés</div></div>
        <div className="kpi-card kpi-blue"><div className="kpi-value">{enCours}</div><div className="kpi-label">En cours</div></div>
        <div className="kpi-card kpi-green"><div className="kpi-value">{retenus}</div><div className="kpi-label">Retenus</div></div>
        <div className="kpi-card kpi-red"><div className="kpi-value">{nonRetenus}</div><div className="kpi-label">Non retenus</div></div>
        <div className="kpi-card kpi-purple"><div className="kpi-value">{tauxReussite}%</div><div className="kpi-label">Taux de réussite</div></div>
        <div className="kpi-card kpi-orange"><div className="kpi-value">{totalEstimation.toLocaleString()} DH</div><div className="kpi-label">Estimation totale</div></div>
      </div>

      {alertes.length > 0 && (
        <div className="alert-box">
          <h3>⚠️ Deadlines dans les 20 prochains jours ({alertes.length})</h3>
          {alertes.map(m => (
            <div key={m.id} className="alert-item">
              <strong>{m.ref}</strong> - {m.titre}
              {m.delai_cd && <span className="deadline"> CD: {new Date(m.delai_cd).toLocaleDateString('fr-FR')}</span>}
              {m.delai_livraison && <span className="deadline"> Livraison: {new Date(m.delai_livraison).toLocaleDateString('fr-FR')}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card"><h3>Répartition par état</h3><Doughnut data={doughnutData} /></div>
        <div className="chart-card"><h3>Activité mensuelle</h3><Bar data={barData} /></div>
      </div>
    </div>
  )
}