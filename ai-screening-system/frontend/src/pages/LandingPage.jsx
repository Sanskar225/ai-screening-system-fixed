import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Zap, Shield, BarChart3, ArrowRight, Cpu, Database, GitBranch, BookOpen } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'RAG-Powered Questions',
    desc: 'Questions generated from role-specific ML textbooks via Retrieval-Augmented Generation using ChromaDB + sentence-transformers.',
  },
  {
    icon: Zap,
    title: 'Resume Intelligence',
    desc: 'Your background shapes the interview — skills, years of experience, and technology stack all directly influence question selection.',
  },
  {
    icon: Shield,
    title: 'Adaptive Difficulty',
    desc: 'Questions dynamically adjust difficulty based on your answer quality. Great answers unlock harder questions; the system meets you where you are.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Per-topic scoring, strength/gap analysis, and a structured hiring recommendation with full Q&A traceability.',
  },
]

const stack = [
  { icon: Cpu,      label: 'FastAPI + Python' },
  { icon: Database, label: 'ChromaDB Vector DB' },
  { icon: GitBranch,label: 'SQLite / Postgres' },
  { icon: Brain,    label: 'Claude / GPT-4' },
  { icon: BookOpen, label: 'ML Textbook RAG' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 48px', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>ScreenAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
          >Dashboard</button>
          <button
            onClick={() => navigate('/setup')}
            style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.background = 'var(--accent-bright)'}
            onMouseLeave={e => e.target.style.background = 'var(--accent)'}
          >Start Interview</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid var(--border-bright)', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)' }}>RAG + LLM · Adaptive Interviews</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,78px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-2px' }}>
            AI-Powered<br />
            <span className="gradient-text">Technical Screening</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Upload your resume, pick a role — and face a real adaptive interview driven by
            retrieved ML knowledge-base content and large language models.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/setup')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent)', border: 'none', color: '#fff', padding: '14px 32px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, boxShadow: '0 0 30px rgba(99,102,241,0.35)' }}>
              Begin Screening <ArrowRight size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: '1px solid var(--border-bright)', color: 'var(--text-primary)', padding: '14px 32px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 500 }}>
              View Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 20, maxWidth: 960, width: '100%', marginTop: 80 }}>
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, textAlign: 'left', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={22} color="var(--accent-bright)" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stack */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{ marginTop: 60, display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {stack.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <s.icon size={15} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  )
}
