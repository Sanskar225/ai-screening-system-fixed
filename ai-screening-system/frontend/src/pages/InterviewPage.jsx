import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader, Clock, Brain, AlertCircle, Database, TrendingUp, TrendingDown } from 'lucide-react'
import { interviewAPI } from '../services/api'

const difficultyColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
const typeColor = { conceptual: '#6366f1', applied: '#8b5cf6', behavioral: '#06b6d4' }

export default function InterviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const textareaRef = useRef()

  const [status, setStatus] = useState('loading')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [prevDifficulty, setPrevDifficulty] = useState(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [adaptiveMsg, setAdaptiveMsg] = useState(null)
  const timerRef = useRef()

  useEffect(() => { startInterview() }, [sessionId])

  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [status, currentQuestion])

  const startInterview = async () => {
    setStatus('starting')
    try {
      const res = await interviewAPI.startInterview(sessionId)
      const data = res.data
      setCurrentQuestion(data.current_question)
      setProgress({ current: 1, total: data.total_questions })
      setStatus('active')
      setTimer(0)
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim() || status === 'submitting') return
    setStatus('submitting')
    clearInterval(timerRef.current)

    try {
      const res = await interviewAPI.submitAnswer(sessionId, currentQuestion.id, answer)
      const data = res.data

      if (data.feedback) {
        setFeedback(data.feedback)
        setShowFeedback(true)
        await new Promise(r => setTimeout(r, 2800))
        setShowFeedback(false)
      }

      if (data.is_last_question) {
        setStatus('completed')
        setTimeout(() => navigate(`/report/${sessionId}`), 1500)
      } else {
        const next = data.next_question
        // detect adaptive difficulty change
        if (next && currentQuestion && next.difficulty !== currentQuestion.difficulty) {
          const up = ['easy','medium','hard'].indexOf(next.difficulty) > ['easy','medium','hard'].indexOf(currentQuestion.difficulty)
          setAdaptiveMsg(up ? '↑ Difficulty increased based on your answer' : '↓ Difficulty adjusted to match your pace')
          setTimeout(() => setAdaptiveMsg(null), 3500)
        }
        setPrevDifficulty(currentQuestion?.difficulty)
        setCurrentQuestion(next)
        setProgress(p => ({ ...p, current: p.current + 1 }))
        setAnswer('')
        setFeedback(null)
        setTimer(0)
        setStatus('active')
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    } catch (e) {
      setError(e.message)
      setStatus('active')
    }
  }

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (status === 'loading' || status === 'starting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Preparing your interview</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>RAG pipeline retrieving relevant knowledge...</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Parsing resume', 'Querying ChromaDB', 'Generating questions'].map((s, i) => (
            <motion.span key={s} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: i * 0.8, duration: 1.6, repeat: Infinity }}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {s}
            </motion.span>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button onClick={startInterview} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Retry</button>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Brain size={40} color="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Interview Complete!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Generating your report...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Progress Bar */}
      <div style={{ height: 3, background: 'var(--bg-card)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <motion.div animate={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }} transition={{ duration: 0.5 }}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-bright))' }} />
      </div>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>ScreenAI</span>
          {/* RAG indicator */}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Database size={10} /> RAG
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
            <Clock size={14} />{formatTime(timer)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-bright)' }}>
            {progress.current} / {progress.total}
          </div>
          <div style={{ width: 120, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${(progress.current / Math.max(progress.total,1)) * 100}%` }}
              style={{ height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', maxWidth: 800, width: '100%', margin: '0 auto' }}>
        {/* Adaptive difficulty notification */}
        <AnimatePresence>
          {adaptiveMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ width: '100%', marginBottom: 16, padding: '10px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-bright)', borderRadius: 10, fontSize: 13, color: 'var(--accent-bright)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={14} /> {adaptiveMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ width: '100%' }}>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: `${typeColor[currentQuestion.question_type] || '#6366f1'}20`, color: typeColor[currentQuestion.question_type] || '#6366f1', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'capitalize' }}>
                  {currentQuestion.question_type}
                </span>
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: `${difficultyColor[currentQuestion.difficulty]}20`, color: difficultyColor[currentQuestion.difficulty], fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'capitalize' }}>
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.topic && (
                  <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {currentQuestion.topic}
                  </span>
                )}
              </div>

              {/* Question Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 20, padding: 36, marginBottom: 24, boxShadow: 'var(--shadow-accent)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Brain size={20} color="var(--accent-bright)" />
                  </div>
                  <p style={{ fontSize: 19, lineHeight: 1.7, fontWeight: 500, fontFamily: 'var(--font-display)' }}>
                    {currentQuestion.question_text}
                  </p>
                </div>
              </div>

              {/* Answer */}
              <div style={{ position: 'relative' }}>
                <textarea ref={textareaRef} value={answer} onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
                  placeholder="Type your answer here… (Ctrl+Enter to submit)"
                  disabled={status === 'submitting'}
                  style={{ width: '100%', minHeight: 180, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 15, resize: 'vertical', outline: 'none', lineHeight: 1.7, transition: 'border-color 0.2s', opacity: status === 'submitting' ? 0.7 : 1 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{answer.length} chars</span>
                  <button onClick={handleSubmit} disabled={!answer.trim() || status === 'submitting'}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: answer.trim() ? 'var(--accent)' : 'var(--bg-secondary)', border: 'none', color: answer.trim() ? '#fff' : 'var(--text-muted)', padding: '10px 20px', borderRadius: 10, cursor: answer.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}>
                    {status === 'submitting' ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating…</> : <>Submit <Send size={15} /></>}
                  </button>
                </div>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && feedback && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-bright)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--accent-bright)' }}>Quick feedback: </strong>{feedback}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ marginTop: 32, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Take your time. Think out loud. Partial answers are fine — clarity matters more than perfection.
        </p>
      </main>
    </div>
  )
}
