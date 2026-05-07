'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import QCMSession from '@/components/QCMSession'
import ScoreCard from '@/components/ScoreCard'
import FlashcardDeck from '@/components/FlashcardDeck'
import CoachPanel from '@/components/CoachPanel'
import ModuleSelector from '@/components/ModuleSelector'
import SessionHistory from '@/components/SessionHistory'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Tab = 'qbank' | 'mock_questions' | 'flashcards' | 'mock_exam' | 'history'
type Mode = 'menu' | 'active' | 'results'

const TABS: { key: Tab; label: string }[] = [
  { key: 'qbank', label: 'QBank' },
  { key: 'mock_questions', label: 'Mock Questions' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'mock_exam', label: 'Mock Exam' },
  { key: 'history', label: 'History' },
]

const Q_COUNTS = [5, 10, 15, 20]

interface QCMData {
  session_id: number
  questions: { id: number; stem: string; option_a: string; option_b: string; option_c: string }[]
  time_limit_min: number
}

interface QCMResult {
  session_id: number
  score_pct: number
  correct: number
  incorrect: number
  total: number
  details: { question_id: number; stem: string; user_answer: string; correct_answer: string; is_correct: boolean; explanation: string | null }[]
}

export default function SessionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<Tab>('qbank')
  const [mode, setMode] = useState<Mode>('menu')

  // QBank state
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const [selectedModuleCode, setSelectedModuleCode] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [timed, setTimed] = useState(true)
  const [qcmData, setQcmData] = useState<QCMData | null>(null)
  const [results, setResults] = useState<QCMResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Flashcards state
  const [flashcards, setFlashcards] = useState<{ id: number; front: string; back: string; tags: string[] }[]>([])

  // Reveal mode for QCM/Mock — propagated from /sessions builder via handoff.
  const [revealMode, setRevealMode] = useState<'after_each' | 'end_only'>('after_each')

  // History detail
  const [historySessionId, setHistorySessionId] = useState<number | null>(null)
  const [historyDetails, setHistoryDetails] = useState<QCMResult | null>(null)

  // Auth: wait for auto-session to complete
  // No redirect needed — auto-session creates user automatically

  const initialTopicCode = searchParams.get('topic') || ''

  // URL params
  useEffect(() => {
    const urlMode = searchParams.get('mode')
    const urlLm = searchParams.get('lm')
    if (urlLm) {
      const id = Number(urlLm)
      if (Number.isFinite(id) && id > 0) setSelectedModuleId(id)
    }
    if (urlMode === 'srs') setActiveTab('flashcards')
    else if (urlMode === 'mock') setActiveTab('mock_exam')
    else if (urlMode === 'mock_questions') setActiveTab('mock_questions')
  }, [searchParams])

  // Handoff from /sessions builder: if a prebuilt session is queued in
  // localStorage, jump straight into active mode instead of the menu.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('wingman_prebuilt_session')
      if (!raw) return
      localStorage.removeItem('wingman_prebuilt_session')
      const parsed = JSON.parse(raw) as { qcm?: QCMData; activeTab?: Tab; revealMode?: 'after_each' | 'end_only' }
      if (parsed?.qcm?.session_id && Array.isArray(parsed.qcm.questions)) {
        if (parsed.activeTab) setActiveTab(parsed.activeTab)
        if (parsed.revealMode === 'end_only' || parsed.revealMode === 'after_each') {
          setRevealMode(parsed.revealMode)
        }
        setQcmData(parsed.qcm)
        setMode('active')
      }
    } catch { /* ignore malformed handoff */ }
  }, [])

  const userId = user?.user_id || ''

  const startQCM = useCallback(async () => {
    if (!selectedModuleId || !userId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/qcm/start`, {
        method: 'POST', credentials: 'include' as RequestCredentials, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lm_id: selectedModuleId, question_count: questionCount, time_limit_min: timed ? 15 : 9999 }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else { setQcmData(data); setMode('active') }
    } catch { setError('Server connection error') }
    setLoading(false)
  }, [selectedModuleId, userId, questionCount, timed])

  const startMockQuestions = useCallback(async () => {
    if (!selectedModuleId || !userId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/qcm/start`, {
        method: 'POST', credentials: 'include' as RequestCredentials, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lm_id: selectedModuleId, question_count: questionCount, time_limit_min: timed ? 15 : 9999, question_type: 'mock' }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else { setQcmData(data); setMode('active') }
    } catch { setError('Server connection error') }
    setLoading(false)
  }, [selectedModuleId, userId, questionCount, timed])

  const startMock = useCallback(async () => {
    if (!userId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/mock/start`, {
        method: 'POST', credentials: 'include' as RequestCredentials, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else { setQcmData(data); setMode('active') }
    } catch { setError('Server connection error') }
    setLoading(false)
  }, [userId])

  const startFlashcards = useCallback(async () => {
    if (!selectedModuleId || !userId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/flashcards?lm_id=${selectedModuleId}`, { credentials: 'include' })
      setFlashcards(await res.json()); setMode('active')
    } catch { setError('Connection error') }
    setLoading(false)
  }, [selectedModuleId, userId])

  const handleQCMComplete = useCallback((result: unknown) => {
    const r = result as QCMResult
    setResults(r); setMode('results')

    // Auto-generate debrief for the Debrief page
    const topicCode = selectedModuleCode.split('-')[0] || 'ETH'
    const topicColors: Record<string, string> = { ETH: '#DC2626', QM: '#7C3AED', ECO: '#2563EB', FSA: '#059669', CORP: '#D97706', EQU: '#0891B2', FI: '#4F46E5', DER: '#BE185D', ALT: '#7C2D12', PM: '#4338CA' }
    const topicNames: Record<string, string> = { ETH: 'Ethical & Professional Standards', QM: 'Quantitative Methods', ECO: 'Economics', FSA: 'Financial Statement Analysis', CORP: 'Corporate Issuers', EQU: 'Equity Investments', FI: 'Fixed Income', DER: 'Derivatives', ALT: 'Alternative Investments', PM: 'Portfolio Management' }

    const debrief = {
      kpis: {
        duration: r.total * 90,
        topicStudied: topicCode,
        topicName: topicNames[topicCode] || topicCode,
        topicColor: topicColors[topicCode] || '#6B7280',
        topicWeight: 10,
        topicProgress: r.score_pct,
        dailyPct: 50,
        todayTotalMin: Math.round(r.total * 1.5),
        dailyGoalMin: 90,
        daysToExam: 130,
        todaySessions: 1,
      },
      weaknesses: [],
      strengths: [],
      commentary: [
        `You completed a ${r.total}-question QCM on ${selectedModuleCode} with a score of ${r.score_pct}%.`,
        r.score_pct >= 70
          ? `Strong performance! ${r.correct}/${r.total} correct. Focus on maintaining this level with spaced repetition.`
          : `${r.correct}/${r.total} correct. Review the ${r.incorrect} missed questions and focus on the concepts behind them.`,
      ],
      nextSession: null,
    }
    localStorage.setItem('wingman_last_debrief', JSON.stringify(debrief))
    localStorage.setItem('wingman_last_debrief_ts', new Date().toISOString())
  }, [selectedModuleCode])

  const handleViewSession = useCallback(async (sessionId: number) => {
    setHistorySessionId(sessionId)
    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/details`, { credentials: 'include' })
      const data = await res.json()
      if (data.session) {
        setHistoryDetails({
          session_id: sessionId,
          score_pct: data.session.score || 0,
          correct: data.session.questions_correct || 0,
          incorrect: (data.session.questions_total || 0) - (data.session.questions_correct || 0),
          total: data.session.questions_total || 0,
          details: data.details || [],
        })
      }
    } catch { /* ignore */ }
  }, [userId])

  const backToMenu = () => {
    setMode('menu'); setQcmData(null); setResults(null); setError(null)
    setHistorySessionId(null); setHistoryDetails(null)
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Active QCM / Mock ──
  if (mode === 'active' && qcmData && (activeTab === 'qbank' || activeTab === 'mock_questions' || activeTab === 'mock_exam')) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={backToMenu} className="text-xs text-slate-500 hover:text-slate-300">&larr; Quit</button>
        <QCMSession sessionId={qcmData.session_id} questions={qcmData.questions} timeLimitMin={qcmData.time_limit_min} revealMode={revealMode} onComplete={handleQCMComplete} />
      </div>
    )
  }

  // ── Active Flashcards ──
  if (mode === 'active' && activeTab === 'flashcards') {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <button onClick={backToMenu} className="text-xs text-slate-500 hover:text-slate-300">&larr; Back</button>
        <FlashcardDeck cards={flashcards} lmId={selectedModuleId || 1} onComplete={backToMenu} />
      </div>
    )
  }

  // ── Results (post-quiz) ──
  if (mode === 'results' && results) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={backToMenu} className="text-xs text-slate-500 hover:text-slate-300">&larr; Back to menu</button>
          <button onClick={() => router.push('/debrief')} className="text-xs text-blue-400 hover:text-blue-300">View Debrief &rarr;</button>
        </div>
        <ScoreCard
          scorePct={results.score_pct} correct={results.correct} incorrect={results.incorrect} total={results.total}
          details={results.details} sessionId={results.session_id} showAIAnalysis onRecalibrate={backToMenu}
        />
      </div>
    )
  }

  // ── History Detail ──
  if (historySessionId && historyDetails) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => { setHistorySessionId(null); setHistoryDetails(null) }} className="text-xs text-slate-500 hover:text-slate-300">
          &larr; Back to history
        </button>
        <ScoreCard
          scorePct={historyDetails.score_pct} correct={historyDetails.correct} incorrect={historyDetails.incorrect} total={historyDetails.total}
          details={historyDetails.details} sessionId={historySessionId} showAIAnalysis
        />
      </div>
    )
  }

  // ── Menu ──
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Study Session</h1>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.04] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setError(null) }}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* QBank Tab */}
      {activeTab === 'qbank' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card">
            <h2 className="card-header mb-4">Choose a module</h2>
            <ModuleSelector userId={userId} selectedModuleId={selectedModuleId} initialTopicCode={initialTopicCode}
              onSelect={(id, code) => { setSelectedModuleId(id || null); setSelectedModuleCode(code) }} />
          </div>
          <div className="space-y-4">
            <div className="card">
              <h2 className="card-header mb-4">Settings</h2>
              {selectedModuleCode && <p className="text-xs text-blue-400 font-mono mb-4">{selectedModuleCode}</p>}
              <label className="text-[11px] text-slate-500 uppercase font-semibold">Number of questions</label>
              <div className="flex gap-1.5 mt-1.5 mb-4">
                {Q_COUNTS.map(n => (
                  <button key={n} onClick={() => setQuestionCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      questionCount === n ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                    }`}>{n}</button>
                ))}
              </div>
              <label className="text-[11px] text-slate-500 uppercase font-semibold">Mode</label>
              <div className="flex gap-1.5 mt-1.5 mb-4">
                <button onClick={() => setTimed(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${timed ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                  Timed (15 min)
                </button>
                <button onClick={() => setTimed(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!timed ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                  Untimed
                </button>
              </div>
              <button onClick={startQCM} disabled={!selectedModuleId || loading}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
                {loading ? 'Loading...' : 'Start QCM'}
              </button>
            </div>
            <CoachPanel lmId={selectedModuleId || 1} />
          </div>
        </div>
      )}

      {/* Mock Questions Tab (QBank-style but with mock-type questions) */}
      {activeTab === 'mock_questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card">
            <h2 className="card-header mb-4">Choose a module</h2>
            <ModuleSelector userId={userId} selectedModuleId={selectedModuleId} initialTopicCode={initialTopicCode}
              onSelect={(id, code) => { setSelectedModuleId(id || null); setSelectedModuleCode(code) }} />
          </div>
          <div className="space-y-4">
            <div className="card">
              <h2 className="card-header mb-4">Mock Settings</h2>
              {selectedModuleCode && <p className="text-xs text-purple-400 font-mono mb-4">{selectedModuleCode}</p>}
              <div className="mb-4 p-4 rounded-lg bg-purple-500/[0.08] border border-purple-500/15">
                <p className="text-[11px] text-purple-300 font-medium">Mock Exam type questions</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Higher difficulty, real exam style</p>
              </div>
              <label className="text-[11px] text-slate-500 uppercase font-semibold">Number of questions</label>
              <div className="flex gap-1.5 mt-1.5 mb-4">
                {Q_COUNTS.map(n => (
                  <button key={n} onClick={() => setQuestionCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      questionCount === n ? 'bg-purple-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                    }`}>{n}</button>
                ))}
              </div>
              <label className="text-[11px] text-slate-500 uppercase font-semibold">Mode</label>
              <div className="flex gap-1.5 mt-1.5 mb-4">
                <button onClick={() => setTimed(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${timed ? 'bg-purple-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                  Timed (15 min)
                </button>
                <button onClick={() => setTimed(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!timed ? 'bg-purple-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                  Untimed
                </button>
              </div>
              <button onClick={startMockQuestions} disabled={!selectedModuleId || loading}
                className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
                {loading ? 'Loading...' : 'Start Mock Questions'}
              </button>
            </div>
            <CoachPanel lmId={selectedModuleId || 1} />
          </div>
        </div>
      )}

      {/* Mock Exam Tab (full exam simulation) */}
      {activeTab === 'mock_exam' && (
        <div className="max-w-lg mx-auto">
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Mock Exam — CFA Level I</h2>
            <p className="text-sm text-slate-400">Simulate the exam under real conditions</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/[0.03] rounded-2xl">
                <p className="text-xl font-bold text-white">180</p>
                <p className="text-[11px] text-slate-500">Questions</p>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-2xl">
                <p className="text-xl font-bold text-white">4h30</p>
                <p className="text-[11px] text-slate-500">Duration</p>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-2xl">
                <p className="text-xl font-bold text-white">10</p>
                <p className="text-[11px] text-slate-500">Topics</p>
              </div>
            </div>
            <div className="text-left bg-red-500/[0.08] border border-red-500/15 rounded-lg p-4">
              <p className="text-[11px] text-red-400 font-medium">Exam conditions</p>
              <ul className="text-[11px] text-slate-400 mt-1 space-y-0.5 list-disc list-inside">
                <li>Questions distributed by topic weight</li>
                <li>270-minute timer</li>
                <li>Detailed results + AI analysis at the end</li>
                <li>Only use when you are ready</li>
              </ul>
            </div>
            <button onClick={startMock} disabled={loading}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-medium text-sm transition-colors">
              {loading ? 'Preparing...' : 'Start exam'}
            </button>
          </div>
        </div>
      )}

      {/* Flashcards Tab */}
      {activeTab === 'flashcards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="card-header mb-4">Choose a module</h2>
            <ModuleSelector userId={userId} selectedModuleId={selectedModuleId} initialTopicCode={initialTopicCode}
              onSelect={(id, code) => { setSelectedModuleId(id || null); setSelectedModuleCode(code) }} />
          </div>
          <div className="card flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">SRS Review</h3>
            <p className="text-xs text-slate-400">{selectedModuleCode ? `Flashcards for ${selectedModuleCode}` : 'Select a module'}</p>
            <button onClick={startFlashcards} disabled={!selectedModuleId || loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
              Start review
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h2 className="card-header mb-4">Session history</h2>
          <SessionHistory userId={userId} onViewSession={handleViewSession} />
        </div>
      )}
    </div>
  )
}
