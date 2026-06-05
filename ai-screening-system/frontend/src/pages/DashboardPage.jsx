import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, Users, CheckCircle, TrendingUp, ArrowRight, Plus, Loader, Brain } from 'lucide-react'
import { reportAPI } from '../services/api'

const recBadge = {
  strong_hire: { label: 'Strong Hire',  color: '#10b981' },
  hire:        { label: 'Hire',          color: '#6366f1' },
  maybe:       { label: 'Maybe',         color: '#f59e0b' },
  no_hire:     { label: 'No Hire',       color: '#ef4444' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await reportAPI.listReports()
      setReports(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const stats = {
    total:     reports.length,
    completed: reports.filter(r => r.recommendation).length,
    avgScore:  reports.length
      ? (reports.reduce((s, r) => s + (r.overall_score || 0), 0) / reports.length).toFixed(1)
      : '–',
    hireRate:  reports.length
      ? Math.round(reports.filter(r => ['hire','strong_hire'].includes(r.recommendation)).length / reports.length * 100)
      : 0,
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Screening Dashboard</h1>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All interview sessions &amp; results</p>
          </div>
        </div>
        <button onClick={() => navigate('/setup')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> New Interview
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { icon: Users,    label: 'Total Interviews', value: stats.total,             color: 'var(--accent)' },
            { icon: CheckCircle, label: 'Completed',     value: stats.completed,          color: '#10b981' },
            { icon: BarChart2, label: 'Avg Score',       value: stats.avgScore + '/10',   color: '#f59e0b' },
            { icon: TrendingUp, label: 'Hire Rate',      value: stats.hireRate + '%',     color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <s.icon size={20} color={s.color} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Recent Sessions</h2>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Loader size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No interviews yet</p>
              <button onClick={() => navigate('/setup')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Start First Interview</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', gap: 16, padding: '12px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {['Candidate','Role','Score','Recommendation','Date',''].map(h => (
                  <span key={h} style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {reports.map((r, i) => {
                const badge = recBadge[r.recommendation] || { label: 'Pending', color: 'var(--text-muted)' }
                return (
                  <motion.div key={r.session_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', gap: 16, padding: '16px 28px', alignItems: 'center', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/report/${r.session_id}`)}>
                    <span style={{ fontWeight: 600 }}>{r.candidate_name}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{r.role}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: r.overall_score >= 7 ? '#10b981' : r.overall_score >= 5 ? '#f59e0b' : '#ef4444' }}>
                      {r.overall_score ? r.overall_score.toFixed(1) : '–'}
                    </span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: `${badge.color}15`, color: badge.color, fontWeight: 600, display: 'inline-block' }}>{badge.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '–'}</span>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
