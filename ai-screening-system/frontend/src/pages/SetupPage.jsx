import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Briefcase, Upload, CheckCircle, ArrowRight, ArrowLeft, Loader, FileText, ChevronRight } from 'lucide-react'
import { sessionAPI, resumeAPI } from '../services/api'

const steps = ['Profile', 'Role', 'Resume', 'Ready']

const inputStyle = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '12px 16px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s',
}

export default function SetupPage() {
  const navigate  = useNavigate()
  const [step, setStep]           = useState(0)
  const [roles, setRoles]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [session, setSession]     = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const fileInputRef = useRef()

  const [form, setForm] = useState({ name: '', email: '', role: '', file: null })

  useEffect(() => {
    sessionAPI.getRoles()
      .then(r => setRoles(r.data))
      .catch(() => {})
  }, [])

  /* ── handlers ── */
  const handleCreateSession = async () => {
    if (!form.name.trim() || !form.role) return
    setLoading(true); setError('')
    try {
      const res = await sessionAPI.createSession({ candidate_name: form.name, candidate_email: form.email || undefined, role: form.role })
      setSession(res.data)
      setStep(2)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleResumeUpload = async () => {
    if (!form.file || !session) return
    setLoading(true); setError('')
    try {
      const res = await resumeAPI.uploadResume(session.id, form.file)
      setResumeData(res.data)
      setStep(3)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleStart = () => { if (session) navigate(`/interview/${session.id}`) }

  /* ── shared button style ── */
  const primaryBtn = (disabled) => ({
    background: disabled ? 'var(--bg-secondary)' : 'var(--accent)',
    border: 'none',
    color: disabled ? 'var(--text-muted)' : '#fff',
    padding: 14,
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Back + stepper */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, marginBottom: 32, fontFamily: 'var(--font-body)' }}>
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, background: i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--bg-card)', border: i === step ? 'none' : '1px solid var(--border)', color: i <= step ? '#fff' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
                {i < steps.length - 1 && <ChevronRight size={14} color="var(--text-muted)" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40 }}>

            {/* ── STEP 0: Profile ── */}
            {step === 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="var(--accent-bright)" /></div>
                  <div><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Your Profile</h2><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Basic info to personalise your session</p></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Full Name *</label>
                    <input style={inputStyle} placeholder="e.g. Alex Kumar" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      onKeyDown={e => e.key === 'Enter' && form.name.trim() && setStep(1)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Email (optional)</label>
                    <input style={inputStyle} placeholder="alex@example.com" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                </div>
                <button onClick={() => form.name.trim() && setStep(1)} disabled={!form.name.trim()} style={{ ...primaryBtn(!form.name.trim()), marginTop: 32, width: '100%' }}>
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* ── STEP 1: Role ── */}
            {step === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={24} color="var(--accent-bright)" /></div>
                  <div><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Target Role</h2><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Choose the position you're interviewing for</p></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roles.map(role => (
                    <button key={role.id} onClick={() => setForm(p => ({ ...p, role: role.name }))}
                      style={{ background: form.role === role.name ? 'var(--accent-dim)' : 'var(--bg-secondary)', border: `1px solid ${form.role === role.name ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{role.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{role.description}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {role.key_topics.slice(0, 3).map(t => (
                              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                        {form.role === role.name && <CheckCircle size={20} color="var(--accent)" />}
                      </div>
                    </button>
                  ))}
                </div>
                {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginTop: 12 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                  <button onClick={() => setStep(0)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: 14, borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15 }}>Back</button>
                  <button onClick={handleCreateSession} disabled={!form.role || loading} style={{ ...primaryBtn(!form.role || loading), flex: 2 }}>
                    {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <>Continue <ArrowRight size={18} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Resume ── */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={24} color="var(--accent-bright)" /></div>
                  <div><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Upload Resume</h2><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>PDF or TXT · shapes your interview questions</p></div>
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onDragLeave={e => e.currentTarget.style.borderColor = form.file ? 'var(--success)' : 'var(--border)'}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setForm(p => ({ ...p, file: f })) }}
                  style={{ border: `2px dashed ${form.file ? 'var(--success)' : 'var(--border)'}`, borderRadius: 16, padding: 48, textAlign: 'center', cursor: 'pointer', background: form.file ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)', transition: 'all 0.2s' }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) setForm(p => ({ ...p, file: e.target.files[0] })) }} />
                  {form.file ? (
                    <div>
                      <FileText size={40} color="var(--success)" style={{ marginBottom: 12 }} />
                      <p style={{ fontWeight: 600, color: 'var(--success)' }}>{form.file.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{(form.file.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop your resume here</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>PDF or TXT · Max 10 MB</p>
                    </div>
                  )}
                </div>
                {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginTop: 12 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: 14, borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15 }}>Back</button>
                  <button onClick={handleResumeUpload} disabled={!form.file || loading} style={{ ...primaryBtn(!form.file || loading), flex: 2 }}>
                    {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</> : <>Analyse Resume <ArrowRight size={18} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Ready ── */}
            {step === 3 && resumeData && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={32} color="#fff" />
                  </motion.div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>You're all set!</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Resume analysed. Preparing your personalised interview…</p>
                </div>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>EXTRACTED FROM RESUME</h3>
                  {resumeData.extracted_skills?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>SKILLS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {resumeData.extracted_skills.slice(0, 14).map(s => (
                          <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData.extracted_technologies?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>TECHNOLOGIES</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {resumeData.extracted_technologies.slice(0, 10).map(t => (
                          <span key={t} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData.extracted_experience?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>EXPERIENCE</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{resumeData.extracted_experience[0]}</p>
                    </div>
                  )}
                </div>

                <button onClick={handleStart}
                  style={{ width: '100%', background: 'var(--accent)', border: 'none', color: '#fff', padding: 16, borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 0 30px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bright)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
                  Start Interview <ArrowRight size={20} />
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
