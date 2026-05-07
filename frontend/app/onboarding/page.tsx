'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Data ───────────────────────────────────────────────────

const CERTIFICATIONS = [
  { id: 'CFA Level I', icon: '\u{1F4CA}', label: 'CFA Level I', desc: 'Finance & investment' },
  { id: 'CFA Level II', icon: '\u{1F4C8}', label: 'CFA Level II', desc: 'Finance & investment' },
  { id: 'FRM Part I', icon: '\u{2696}\u{FE0F}', label: 'FRM Part I', desc: 'Risk management' },
  { id: 'PMP', icon: '\u{1F5C2}\u{FE0F}', label: 'PMP', desc: 'Project management' },
  { id: 'AWS SAA', icon: '\u{2601}\u{FE0F}', label: 'AWS SAA', desc: 'Cloud computing' },
  { id: 'Autre', icon: '\u{1F3AF}', label: 'Other', desc: 'CAIA, CPA, CISSP...' },
]

const LEVELS = [
  { id: 'beginner', label: 'Complete Beginner', desc: "I'm discovering the program, haven't studied anything yet" },
  { id: 'intermediate', label: 'Some Basics', desc: "I've started studying but still have a lot to cover" },
  { id: 'advanced', label: 'In Review Phase', desc: 'Program is covered, I\'m consolidating and testing my knowledge' },
]

const DAYS = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']

// ── Session Types ─────────────────────────────────────────

const SESSION_TYPES = [
  { id: 'rage',        icon: '\u{1F525}', name: 'Rage Session',         desc: '3h+ sprint — max coverage',              time: '3h+',   energy: 'high',   color: '#ef4444' },
  { id: 'effort',      icon: '\u{1F4AA}', name: 'Effort Session',      desc: '2h intense — weak modules',              time: '2h',    energy: 'high',   color: '#f97316' },
  { id: 'standard',    icon: '\u{1F4D6}', name: 'Standard Session',    desc: '1-2h — notes + LOS exercises',           time: '1-2h',  energy: 'medium', color: '#3b82f6' },
  { id: 'consolidation', icon: '\u{1F4E6}', name: 'Consolidation',     desc: 'Rework modules in progress',             time: '1-2h',  energy: 'medium', color: '#8b5cf6' },
  { id: 'evaluation',  icon: '\u{1F3AF}', name: 'Targeted Evaluation', desc: 'QBank / mini mock on weak areas',        time: '1h',    energy: 'high',   color: '#22c55e' },
  { id: 'simulation',  icon: '\u{1F4CB}', name: 'Full Simulation',     desc: 'Mock 180q — real conditions',            time: '3h+',   energy: 'high',   color: '#ec4899' },
  { id: 'analyse',     icon: '\u{1F50D}', name: 'Deep Analysis',       desc: 'Mock debrief — gaps LOS by LOS',        time: '1-2h',  energy: 'medium', color: '#14b8a6' },
  { id: 'completage',  icon: '\u{1F9E9}', name: 'Catch-Up',            desc: 'Catch up on late modules',               time: '1h',    energy: 'medium', color: '#f59e0b' },
  { id: 'planning',    icon: '\u{1F4C5}', name: 'Planning',            desc: 'Weekly schedule + goals',                time: '30min', energy: 'low',    color: '#6b7280' },
  { id: 'repos',       icon: '\u{1F634}', name: 'Rest Session',        desc: 'Passive audio — recharge',               time: '30min', energy: 'low',    color: '#475569' },
]

// ── Animated background particles (deterministic to avoid SSR mismatch) ──

const PARTICLE_DATA = [
  { w: 180, h: 220, l: 10, t: 15, dur: 28, del: -3 },
  { w: 250, h: 150, l: 75, t: 80, dur: 35, del: -12 },
  { w: 120, h: 300, l: 50, t: 5, dur: 22, del: -7 },
  { w: 300, h: 200, l: 85, t: 45, dur: 40, del: -18 },
  { w: 200, h: 280, l: 20, t: 70, dur: 30, del: -1 },
  { w: 160, h: 160, l: 60, t: 30, dur: 25, del: -15 },
  { w: 280, h: 240, l: 35, t: 90, dur: 38, del: -9 },
  { w: 140, h: 180, l: 90, t: 20, dur: 27, del: -5 },
  { w: 220, h: 260, l: 5, t: 55, dur: 33, del: -14 },
  { w: 260, h: 130, l: 45, t: 65, dur: 42, del: -10 },
  { w: 190, h: 210, l: 70, t: 10, dur: 29, del: -6 },
  { w: 310, h: 170, l: 25, t: 85, dur: 36, del: -17 },
]

const PARTICLE_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b']

function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {PARTICLE_DATA.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-[0.04]"
          style={{
            width: `${p.w}px`,
            height: `${p.h}px`,
            left: `${p.l}%`,
            top: `${p.t}%`,
            background: `radial-gradient(circle, ${PARTICLE_COLORS[i % 4]}, transparent 70%)`,
            animation: `float ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.del}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  )
}

// ── Step indicator ─────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-[3px] flex-1 rounded-full transition-all duration-500"
          style={{
            background: i < current ? '#22c55e' : i === current ? '#3b82f6' : 'rgba(255,255,255,0.08)',
            boxShadow: i === current ? '0 0 8px rgba(59,130,246,0.4)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [cert, setCert] = useState<string | null>(null)
  const [examDate, setExamDate] = useState('')
  const [level, setLevel] = useState<string | null>(null)
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [sessionMin, setSessionMin] = useState(45)
  const [activeDays, setActiveDays] = useState([true, false, true, false, true, false, false])
  const [sessionType, setSessionType] = useState<string | null>(null)
  const [error, setError] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  // Load existing onboarding data if revisiting
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('wingman_onboarding')
      if (raw) {
        const data = JSON.parse(raw)
        if (data.certification) setCert(data.certification)
        if (data.exam_date) setExamDate(data.exam_date)
        if (data.level) setLevel(data.level)
        if (data.language === 'fr' || data.language === 'en') setLanguage(data.language)
        if (data.session_type?.id) setSessionType(data.session_type.id)
        if (data.hours_per_week) setHoursPerWeek(data.hours_per_week)
        if (data.session_duration_min) setSessionMin(data.session_duration_min)
        if (data.preferred_days) {
          setActiveDays(DAYS.map(d => data.preferred_days.includes(d)))
        }
      }
    } catch {}
  }, [])

  const goTo = (n: number) => {
    setDirection(n > step ? 'next' : 'prev')
    setError('')
    setStep(n)
  }

  const nextStep = () => goTo(step + 1)
  const prevStep = () => goTo(step - 1)

  const validateStep1 = () => {
    if (!cert) { setError('Choose a certification'); return }
    nextStep()
  }

  const validateStep2 = () => {
    if (!level) { setError('Choose your level'); return }
    nextStep()
  }

  const validateStep3 = () => {
    if (!sessionType) { setError('Select a session type'); return }
    nextStep()
  }

  const finish = () => {
    const selected = SESSION_TYPES.find(s => s.id === sessionType) || null
    const data = {
      certification: cert,
      exam_date: examDate || null,
      level,
      language,
      session_type: selected ? { id: selected.id, name: selected.name, time: selected.time, energy: selected.energy } : null,
      hours_per_week: hoursPerWeek,
      session_duration_min: sessionMin,
      preferred_days: DAYS.filter((_, i) => activeDays[i]),
      completed_at: new Date().toISOString(),
    }
    localStorage.setItem('wingman_onboarding', JSON.stringify(data))
    localStorage.setItem('wingman_onboarded', 'true')
    localStorage.setItem('wingman_language', language)
    // Persist to backend so the Planning Skill + Coach use the right language.
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${API}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ language, exam_date: examDate || null }),
    }).catch(() => {})
    nextStep()
  }

  const launch = () => {
    router.push('/')
  }

  const toggleDay = (i: number) => {
    setActiveDays(d => d.map((v, idx) => idx === i ? !v : v))
  }

  // Weeks until exam
  const weeksRemaining = examDate
    ? Math.max(0, Math.round((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)))
    : null

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative">
      <Particles />

      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-[540px]"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Wingman</span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20 ml-1">
            Learning OS
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-7 shadow-2xl shadow-black/30 backdrop-blur-sm">
          <ProgressBar current={step} total={6} />

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
              {error}
            </div>
          )}

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="animate-fadeUp">
              {/* Language / Langue — drives all AI-generated content */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {([
                  { code: 'fr', flag: '🇫🇷', label: 'Français' },
                  { code: 'en', flag: '🇬🇧', label: 'English' },
                ] as const).map(l => {
                  const active = language === l.code
                  return (
                    <button key={l.code} onClick={() => setLanguage(l.code)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                            style={{
                              background: active ? 'rgba(108,140,255,.15)' : 'rgba(255,255,255,.04)',
                              border: `1px solid ${active ? 'rgba(108,140,255,.4)' : 'rgba(255,255,255,.08)'}`,
                              color: active ? '#a0b4ff' : 'rgba(255,255,255,.6)',
                            }}>
                      <span className="text-lg leading-none">{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="text-center mb-6">
                <h1 className="text-[28px] font-extrabold text-white tracking-tight leading-tight mb-2">
                  {language === 'fr' ? 'Bienvenue sur' : 'Welcome to'}<br/>
                  <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                    Wingman
                  </span>
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {language === 'fr'
                    ? <>Votre copilote IA pour réussir votre certification.<br/>Configuration en moins de 2 minutes.</>
                    : <>Your AI co-pilot to pass your certification.<br/>Setup in less than 2 minutes.</>}
                </p>
              </div>

              <div className="space-y-2.5 mb-6">
                {[
                  { title: "Personalized Study Plan", desc: "Generated based on your exam date and availability", color: '#3b82f6' },
                  { title: 'Adaptive Sessions', desc: "AI targets your weak areas in real time", color: '#22c55e' },
                  { title: 'Progress Tracking', desc: 'Dashboard and ROI per topic', color: '#a855f7' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-4 p-3.5 rounded-2xl bg-surface-700/50 border border-surface-600/50 hover:border-surface-600 transition-colors">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${f.color}18` }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 3.5" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{f.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Welcome</span>
                <button onClick={nextStep} className="btn-primary flex items-center gap-2">
                  Get Started
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Certification ── */}
          {step === 1 && (
            <div className="animate-fadeUp">
              <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-accent-blue mb-2">Step 1</div>
              <h2 className="text-[22px] font-bold text-white leading-tight mb-1.5">
                Which certification<br/>are you preparing for?
              </h2>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                The study plan will be calibrated specifically for this program.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {CERTIFICATIONS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCert(c.id); setError('') }}
                    className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                      cert === c.id
                        ? 'border-accent-blue bg-accent-blue/10 ring-1 ring-accent-blue/30'
                        : 'border-surface-600 bg-surface-700/30 hover:border-surface-600 hover:bg-surface-700/60'
                    }`}
                  >
                    <span className="text-xl block mb-1.5">{c.icon}</span>
                    <span className={`block text-sm font-medium ${cert === c.id ? 'text-accent-blue' : 'text-white'}`}>{c.label}</span>
                    <span className={`block text-[11px] mt-0.5 ${cert === c.id ? 'text-blue-400/70' : 'text-slate-500'}`}>{c.desc}</span>
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full h-10 rounded-lg px-3 text-sm bg-surface-700 border border-surface-600 text-white
                             focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="btn-ghost text-sm">&larr; Back</button>
                <button onClick={validateStep1} className="btn-primary flex items-center gap-2">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Level ── */}
          {step === 2 && (
            <div className="animate-fadeUp">
              <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-accent-blue mb-2">Step 2</div>
              <h2 className="text-[22px] font-bold text-white leading-tight mb-1.5">
                What is your<br/>current level?
              </h2>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                This calibrates the difficulty and pace of generated sessions.
              </p>

              <div className="space-y-2.5 mb-5">
                {LEVELS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setLevel(l.id); setError('') }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      level === l.id
                        ? 'border-accent-blue bg-accent-blue/10 ring-1 ring-accent-blue/30'
                        : 'border-surface-600 bg-surface-700/30 hover:border-surface-600 hover:bg-surface-700/60'
                    }`}
                  >
                    <span className={`block text-sm font-medium ${level === l.id ? 'text-accent-blue' : 'text-white'}`}>{l.label}</span>
                    <span className={`block text-xs mt-1 ${level === l.id ? 'text-blue-400/70' : 'text-slate-500'}`}>{l.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="btn-ghost text-sm">&larr; Back</button>
                <button onClick={validateStep2} className="btn-primary flex items-center gap-2">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Session Type ── */}
          {step === 3 && (
            <div className="animate-fadeUp">
              <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-accent-blue mb-2">Step 3</div>
              <h2 className="text-[22px] font-bold text-white leading-tight mb-1.5">
                What type of<br/>session today?
              </h2>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                Choose the format that matches your available time and energy.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {SESSION_TYPES.map(s => {
                  const active = sessionType === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSessionType(s.id); setError('') }}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                        active
                          ? 'border-accent-blue bg-accent-blue/10 ring-1 ring-accent-blue/30'
                          : 'border-surface-600 bg-surface-700/30 hover:border-surface-600 hover:bg-surface-700/60'
                      }`}
                    >
                      <span className="text-2xl block mb-1.5">{s.icon}</span>
                      <span className={`block text-sm font-semibold ${active ? 'text-accent-blue' : 'text-white'}`}>
                        {s.name}
                      </span>
                      <span className={`block text-[11px] mt-0.5 leading-snug ${active ? 'text-blue-400/70' : 'text-slate-500'}`}>
                        {s.desc}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-surface-600/50 text-slate-400">{s.time}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md text-slate-400"
                          style={{ background: s.id === 'repos' || s.id === 'planning' ? '#47556918' : s.energy === 'high' ? '#22c55e18' : '#f59e0b18',
                                   color: s.id === 'repos' || s.id === 'planning' ? '#6b7280' : s.energy === 'high' ? '#22c55e' : '#f59e0b' }}>
                          {s.energy === 'high' ? 'High energy' : s.energy === 'medium' ? 'Medium energy' : 'Low energy'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="btn-ghost text-sm">&larr; Back</button>
                <button onClick={validateStep3} className="btn-primary flex items-center gap-2">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Availability ── */}
          {step === 4 && (
            <div className="animate-fadeUp">
              <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-accent-blue mb-2">Step 4</div>
              <h2 className="text-[22px] font-bold text-white leading-tight mb-1.5">
                Your available<br/>time
              </h2>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                The SmartPlanner will build your schedule automatically.
              </p>

              {/* Hours per week slider */}
              <div className="mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-medium text-slate-400">Hours per week</span>
                  <span>
                    <span className="text-xl font-bold text-accent-blue">{hoursPerWeek}</span>
                    <span className="text-xs text-slate-500 ml-1">h/wk</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={2} max={40} value={hoursPerWeek} step={1}
                  onChange={e => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-accent-blue h-1 bg-surface-600 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue [&::-webkit-slider-thumb]:shadow-lg
                             [&::-webkit-slider-thumb]:shadow-accent-blue/30"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-slate-600">2h</span>
                  <span className="text-[11px] text-slate-600">40h</span>
                </div>
              </div>

              {/* Session duration slider */}
              <div className="mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-medium text-slate-400">Session duration</span>
                  <span>
                    <span className="text-xl font-bold text-accent-blue">{sessionMin}</span>
                    <span className="text-xs text-slate-500 ml-1">min</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={15} max={120} value={sessionMin} step={15}
                  onChange={e => setSessionMin(Number(e.target.value))}
                  className="w-full accent-accent-blue h-1 bg-surface-600 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue [&::-webkit-slider-thumb]:shadow-lg
                             [&::-webkit-slider-thumb]:shadow-accent-blue/30"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-slate-600">15 min</span>
                  <span className="text-[11px] text-slate-600">2h</span>
                </div>
              </div>

              {/* Preferred days */}
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-2">Preferred days</span>
                <div className="flex gap-1.5">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(i)}
                      className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        activeDays[i]
                          ? 'bg-accent-blue/15 border-accent-blue text-accent-blue border ring-1 ring-accent-blue/20'
                          : 'bg-surface-700/50 border-surface-600 text-slate-500 border hover:bg-surface-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button onClick={prevStep} className="btn-ghost text-sm">&larr; Back</button>
                <button onClick={finish} className="btn-primary flex items-center gap-2">
                  Generate my plan
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Summary / Success ── */}
          {step === 5 && (
            <div className="animate-fadeUp">
              {/* Success icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center ring-4 ring-accent-green/5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l4.5 4.5L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <h2 className="text-[22px] font-bold text-white text-center mb-1">Plan generated!</h2>
              <p className="text-sm text-slate-400 text-center mb-5">
                Here is your configuration. Your first session awaits.
              </p>

              {/* Summary card */}
              <div className="rounded-2xl bg-surface-700/50 border border-surface-600/50 p-4 mb-5">
                {[
                  { label: 'Certification', value: cert || '--' },
                  { label: "Exam Date", value: examDate ? new Date(examDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set' },
                  { label: 'Level', value: LEVELS.find(l => l.id === level)?.label || '--' },
                  { label: 'Session type', value: sessionType ? `${SESSION_TYPES.find(s => s.id === sessionType)?.name} (${SESSION_TYPES.find(s => s.id === sessionType)?.time})` : '--' },
                  { label: 'Weekly load', value: `${hoursPerWeek}h/wk - ${sessionMin} min sessions` },
                  { label: 'Weeks remaining', value: weeksRemaining !== null ? (weeksRemaining > 0 ? `${weeksRemaining} weeks` : 'Soon') : '--' },
                  { label: 'Active days', value: DAYS.filter((_, i) => activeDays[i]).join(', ') || 'None' },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-surface-600/40' : ''}`}
                  >
                    <span className="text-xs text-slate-500">{row.label}</span>
                    <span className="text-sm font-medium text-white">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={launch}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm bg-accent-green hover:bg-green-600 text-white transition-all shadow-lg shadow-green-500/20"
                >
                  Launch Wingman
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={() => goTo(0)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Restart setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp { animation: fadeUp 0.4s ease both; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease; }
      `}</style>
    </div>
  )
}
