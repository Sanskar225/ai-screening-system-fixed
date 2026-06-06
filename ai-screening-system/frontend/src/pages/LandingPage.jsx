import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Zap, Shield, BarChart3, ArrowRight,
         Cpu, Database, GitBranch, BookOpen } from 'lucide-react'

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
    desc: 'Questions dynamically adjust difficulty based on your answer quality. Great answers unlock harder questions.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Per-topic scoring, strength/gap analysis, and a structured hiring recommendation with full Q&A traceability.',
  },
]

const stack = [
  { icon: Cpu,       label: 'FastAPI + Python' },
  { icon: Database,  label: 'ChromaDB Vector DB' },
  { icon: GitBranch, label: 'SQLite / Postgres' },
  { icon: Brain,     label: 'Claude / GPT-4' },
  { icon: BookOpen,  label: 'ML Textbook RAG' },
]

export default function LandingPage() {
  const navigate   = useNavigate()
  const vantaRef   = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    if (!vantaEffect.current && window.VANTA) {
      vantaEffect.current = window.VANTA.GLOBE({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: 0x0a0a0f,   // matches --bg-primary
        color: 0x6366f1,              // matches --accent (indigo)
        color2: 0x818cf8,             // matches --accent-bright
        size: 1.2,
      })
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HERO with Vanta background ── */}
      <div
        ref={vantaRef}
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Nav */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 48px',
          position: 'relative', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={20} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: 18,
            }}>ScreenAI</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--text-primary)',
                padding: '8px 20px', borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 14,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(99,102,241,0.25)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            >Dashboard</button>

            <button
              onClick={() => navigate('/setup')}
              style={{
                background: 'var(--accent)',
                border: 'none', color: '#fff',
                padding: '8px 20px', borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                boxShadow: '0 0 20px rgba(99,102,241,0.5)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.boxShadow = '0 0 32px rgba(99,102,241,0.8)'}
              onMouseLeave={e => e.target.style.boxShadow = '0 0 20px rgba(99,102,241,0.5)'}
            >Start Interview</button>
          </div>
        </nav>

        {/* Hero content — centred over the globe */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
          position: 'relative', zIndex: 10,
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Live badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.4)',
              backdropFilter: 'blur(12px)',
              borderRadius: 100, padding: '6px 16px', marginBottom: 32,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--success)', display: 'inline-block',
                boxShadow: '0 0 8px #10b981',
              }} />
              <span style={{
                fontSize: 13, color: 'var(--accent-bright)',
                fontFamily: 'var(--font-mono)',
              }}>RAG + LLM · Adaptive Interviews</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 6vw, 82px)',
              fontWeight: 800, lineHeight: 1.08,
              marginBottom: 24, letterSpacing: '-2px',
            }}>
              AI-Powered<br />
              <span className="gradient-text">Technical Screening</span>
            </h1>

            <p style={{
              fontSize: 18, color: 'var(--text-secondary)',
              maxWidth: 540, margin: '0 auto 48px', lineHeight: 1.7,
            }}>
              Upload your resume, pick a role — and face a real adaptive interview
              driven by retrieved ML knowledge-base content and large language models.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/setup')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--accent)', border: 'none', color: '#fff',
                  padding: '14px 32px', borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
                  boxShadow: '0 0 40px rgba(99,102,241,0.5)',
                }}
              >
                Begin Screening <ArrowRight size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--text-primary)',
                  padding: '14px 32px', borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 500,
                }}
              >
                View Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute', bottom: 32,
            left: '50%', transform: 'translateX(-50%)',
            color: 'var(--text-muted)', fontSize: 12,
            fontFamily: 'var(--font-mono)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6, zIndex: 10,
          }}
        >
          <span>scroll</span>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(to bottom, var(--accent), transparent)',
          }} />
        </motion.div>
      </div>

      {/* ── FEATURES SECTION (below the globe) ── */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: '80px 24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800, letterSpacing: '-1px',
          }}>
            Everything you need for<br />
            <span className="gradient-text">smarter hiring</span>
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 20, maxWidth: 960, width: '100%',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 28, textAlign: 'left',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-bright)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <f.icon size={22} color="var(--accent-bright)" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 60,
            display: 'flex', gap: 28, flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {stack.map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--text-muted)',
            }}>
              <s.icon size={15} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}