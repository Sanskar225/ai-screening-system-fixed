import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import {
  CheckCircle, XCircle, AlertCircle, TrendingUp,
  User, Download, Home, Loader, Star, Database,
} from 'lucide-react'
import { reportAPI } from '../services/api'

const recConfig = {
  strong_hire: { label: 'Strong Hire',                  color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle },
  hire:        { label: 'Hire',                          color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icon: TrendingUp  },
  maybe:       { label: 'Consider with Reservations',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: AlertCircle },
  no_hire:     { label: 'Not Recommended',               color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: XCircle     },
}

const scoreColor = (s) =>
  !s ? 'var(--text-muted)' : s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444'

export default function ReportPage() {
  const { sessionId } = useParams()
  const navigate      = useNavigate()
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => { loadReport() }, [sessionId])

  const loadReport = async () => {
    setLoading(true)
    try {
      let res
      try { res = await reportAPI.getReport(sessionId) }
      catch { res = await reportAPI.generateReport(sessionId) }
      setReport(res.data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Loader size={40} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Generating your report…</p>
    </div>
  )

  if (error || !report) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <AlertCircle size={48} color="var(--danger)" />
      <p style={{ color: 'var(--text-secondary)' }}>{error || 'Failed to load report'}</p>
      <button onClick={loadReport} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Retry</button>
    </div>
  )

  const rec     = recConfig[report.recommendation] || recConfig.maybe
  const RecIcon = rec.icon

  const topicData = Object.entries(report.topic_scores || {}).map(([topic, score]) => ({
    topic: topic.length > 22 ? topic.slice(0, 20) + '…' : topic,
    score: Math.round((score || 0) * 10) / 10,
  }))

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Interview Report</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            <Home size={14} /> Home
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600 }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero score card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 40, marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} color="var(--accent-bright)" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{report.candidate_name}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{report.role}</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 500 }}>{report.summary}</p>
            <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 12, background: rec.bg, border: `1px solid ${rec.color}40` }}>
              <RecIcon size={18} color={rec.color} />
              <span style={{ fontWeight: 700, color: rec.color, fontSize: 15 }}>{rec.label}</span>
            </div>
          </div>

          {/* Circular score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 140, height: 140, borderRadius: '50%', background: `conic-gradient(${scoreColor(report.overall_score)} ${(report.overall_score || 0) * 10}%, var(--bg-secondary) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${scoreColor(report.overall_score)}30` }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: scoreColor(report.overall_score) }}>{report.overall_score ? report.overall_score.toFixed(1) : '–'}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 10</span>
              </div>
            </div>
            <p style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>Overall Score</p>
          </div>
        </motion.div>

        {/* Strengths + Topic chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Strengths &amp; Gaps</h3>
            {report.strengths?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#10b981', fontFamily: 'var(--font-mono)', marginBottom: 10, fontWeight: 600 }}>STRENGTHS</p>
                {report.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                    <CheckCircle size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {report.weaknesses?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginBottom: 10, fontWeight: 600 }}>AREAS TO IMPROVE</p>
                {report.weaknesses.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                    <AlertCircle size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
            {report.detailed_feedback && Object.keys(report.detailed_feedback).length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10, fontWeight: 600 }}>DETAILED ASSESSMENT</p>
                {Object.entries(report.detailed_feedback).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Topic Performance</h3>
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis type="category" dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {topicData.map((d, i) => <Cell key={i} fill={d.score >= 7 ? '#10b981' : d.score >= 5 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No topic data available</div>
            )}
          </motion.div>
        </div>

        {/* Q&A Review */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Question Review</h3>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Database size={10} /> RAG-grounded
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {report.questions_and_answers?.map((qa, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)' }}>Q{i + 1} · {qa.topic || 'General'}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-card)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>{qa.difficulty || 'medium'}</span>
                    </div>
                    <p style={{ fontWeight: 600, lineHeight: 1.5, fontSize: 15 }}>{qa.question}</p>
                  </div>
                  {qa.score != null && (
                    <div style={{ minWidth: 56, height: 56, borderRadius: 12, background: `${scoreColor(qa.score)}15`, border: `2px solid ${scoreColor(qa.score)}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: scoreColor(qa.score) }}>{qa.score?.toFixed(1)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  )}
                </div>
                {qa.answer && qa.answer !== 'Not answered' && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>CANDIDATE'S ANSWER</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid var(--border-bright)' }}>{qa.answer}</p>
                  </div>
                )}
                {qa.feedback && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>FEEDBACK</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>{qa.feedback}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15 }}>
            <Home size={16} /> Back to Home
          </button>
          <button onClick={() => navigate('/setup')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>
            <Star size={16} /> New Interview
          </button>
        </div>
      </div>
    </div>
  )
}
