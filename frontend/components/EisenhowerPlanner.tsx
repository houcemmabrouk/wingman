'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { ConfirmModal } from '@/components/ui/Modal'

// ── TYPES ──────────────────────────────────────────────────
interface TopicInfo { full: string; w: string; wm: number; c: string }
interface Module {
  id: string; topic: string; lm: string; title: string; nb_los: number
  priority_score: number; difficulty_score: number
  exam_weight_range: string; exam_weight_mid: number
  status: Status; mastery_pct: number; accuracy_pct: number | null
  mock_score: number | null; notes: string; pinned: boolean; quadrant: number
}
interface SavedModule {
  status?: Status; mastery_pct?: number; accuracy_pct?: number | null
  mock_score?: number | null; notes?: string; pinned?: boolean; quadrant?: number
}

type Status = 'not_started' | 'in_progress' | 'to_review' | 'mastered'
type SortMode = 'quadrant' | 'priority' | 'topic' | 'status'

// ── CONSTANTS ──────────────────────────────────────────────
const TOPICS: Record<string, TopicInfo> = {
  QM:  { full: 'Quantitative Methods', w: '8–12%', wm: 10, c: '#7C3AED' },
  ECO: { full: 'Economics', w: '8–12%', wm: 10, c: '#059669' },
  CORP:{ full: 'Corporate Issuers', w: '8–12%', wm: 10, c: '#EA580C' },
  FSA: { full: 'Financial Statement Analysis', w: '13–17%', wm: 15, c: '#D4537E' },
  EQU: { full: 'Equity Investments', w: '10–12%', wm: 11, c: '#2563EB' },
  FI:  { full: 'Fixed Income', w: '11–14%', wm: 11, c: '#0891B2' },
  DER: { full: 'Derivatives', w: '5–8%', wm: 6.5, c: '#65A30D' },
  ALT: { full: 'Alternative Investments', w: '5–8%', wm: 6.5, c: '#D97706' },
  PM:  { full: 'Portfolio Management', w: '5–8%', wm: 6.5, c: '#6B7280' },
  ETH: { full: 'Ethical & Professional Standards', w: '15–20%', wm: 17.5, c: '#DC2626' },
}

const RAW: [string, string, string, number, number, number][] = [
  ['QM','LM01','Rates and Returns',6,4.47,3.67],['QM','LM02','Time Value of Money',3,4.60,4.00],
  ['QM','LM03','Statistical Measures of Asset Returns',4,3.90,3.75],['QM','LM04','Probability Trees and Conditional Expectations',3,4.20,4.00],
  ['QM','LM05','Portfolio Mathematics',3,4.33,3.33],['QM','LM06','Simulation Methods',3,3.80,3.00],
  ['QM','LM07','Estimation and Inference',3,3.80,3.00],['QM','LM08','Hypothesis Testing',4,3.70,3.25],
  ['QM','LM09','Parametric and Non-Parametric Tests',2,3.80,3.50],['QM','LM10','Simple Linear Regression',7,3.86,3.43],
  ['QM','LM11','Big Data Techniques',3,3.20,2.00],
  ['ECO','LM01','The Firm and Market Structures',5,2.56,1.60],['ECO','LM02','Understanding Business Cycles',3,2.20,1.00],
  ['ECO','LM03','Fiscal Policy',4,2.40,1.50],['ECO','LM04','Monetary Policy',4,2.30,1.25],
  ['ECO','LM05','Introduction to Geopolitics',6,2.50,1.00],['ECO','LM06','International Trade',3,2.47,1.67],
  ['ECO','LM07','Capital Flows and FX Market',3,2.20,1.00],['ECO','LM08','Exchange Rate Calculations',2,3.00,3.00],
  ['CORP','LM01','Organizational Forms, Features, and Ownership',3,2.47,1.67],['CORP','LM02','Investors and Other Stakeholders',3,2.33,1.33],
  ['CORP','LM03','Corporate Governance',3,2.60,1.00],['CORP','LM04','Working Capital and Liquidity',3,2.67,1.67],
  ['CORP','LM05','Capital Investments and Capital Allocation',4,2.45,1.25],['CORP','LM06','Capital Structure',4,2.90,2.00],
  ['CORP','LM07','Business Models',2,2.20,1.00],
  ['FSA','LM01','Introduction to Financial Statement Analysis',5,3.40,1.00],['FSA','LM02','Analyzing Income Statements',7,3.57,1.43],
  ['FSA','LM03','Analyzing Balance Sheets',5,3.88,2.20],['FSA','LM04','Analyzing Statements of Cash Flows I',7,3.57,1.43],
  ['FSA','LM05','Analyzing Statements of Cash Flows II',2,4.00,2.50],['FSA','LM06','Analysis of Inventories',3,3.67,1.67],
  ['FSA','LM07','Analysis of Long-Lived Assets',4,3.70,1.75],['FSA','LM08','Long-Term Liabilities and Equity',3,3.67,1.67],
  ['FSA','LM09','Analysis of Income Taxes',4,3.90,2.25],['FSA','LM10','Financial Reporting Quality',9,3.53,1.33],
  ['FSA','LM11','Financial Analysis Techniques',6,3.67,1.67],['FSA','LM12','Financial Statement Modeling',6,3.87,2.17],
  ['EQU','LM01','Market Organization and Structure',12,3.05,1.50],['EQU','LM02','Security Market Indexes',11,3.18,1.55],
  ['EQU','LM03','Market Efficiency',7,3.29,1.57],['EQU','LM05','Company Analysis: Past and Present',5,3.48,2.40],
  ['EQU','LM06','Industry and Competitive Analysis',5,3.12,1.80],['EQU','LM07','Company Analysis: Forecasting',5,3.24,1.80],
  ['EQU','LM08','Equity Valuation: Concepts and Basic Tools',13,3.65,1.85],
  ['FI','LM01','Fixed-Income Instrument Features',2,3.80,2.00],['FI','LM02','Fixed-Income Cash Flows and Types',2,3.80,2.00],
  ['FI','LM03','Fixed-Income Issuance and Trading',3,3.93,2.33],['FI','LM04','Fixed-Income Markets for Corporate Issuers',3,4.07,2.67],
  ['FI','LM05','Fixed-Income Markets for Government Issuers',2,4.00,2.50],['FI','LM06','Bond Valuation: Prices and Yields',3,4.07,2.67],
  ['FI','LM07','Yield and Yield Spread Measures for Fixed-Rate Bonds',2,4.40,3.50],['FI','LM08','Yield and Yield Spread Measures for Floating-Rate',2,4.60,4.00],
  ['FI','LM09','Term Structure of Interest Rates',3,4.20,3.00],['FI','LM10','Interest Rate Risk and Return',3,4.33,3.33],
  ['FI','LM11','Yield-Based Bond Duration Measures',2,4.20,3.00],['FI','LM12','Yield-Based Bond Convexity and Portfolio Properties',3,4.60,4.00],
  ['FI','LM13','Curve-Based and Empirical Duration Measures',4,4.40,3.50],['FI','LM14','Credit Risk',3,3.93,2.33],
  ['FI','LM15','Credit Analysis for Government Issuers',1,4.20,3.00],['FI','LM16','Credit Analysis for Corporate Issuers',3,4.07,2.67],
  ['FI','LM17','Fixed-Income Securitization',2,4.00,2.50],['FI','LM18','Asset-Backed Security Instruments and Valuation',4,3.80,2.00],
  ['FI','LM19','Mortgage-Backed Security Instruments and Valuation',4,3.80,2.00],
  ['DER','LM01','Derivative Instrument and Market Features',2,2.60,2.00],['DER','LM02','Forward Commitment and Contingent Claim Features',3,3.47,3.67],
  ['DER','LM03','Derivative Benefits, Risks, and Uses',2,3.10,2.50],['DER','LM04','Arbitrage, Replication, and Cost of Carry',2,3.20,3.50],
  ['DER','LM05','Pricing and Valuation of Forward Contracts',2,3.70,4.00],['DER','LM06','Pricing and Valuation of Futures Contracts',2,3.40,4.00],
  ['DER','LM07','Pricing and Valuation of Interest Rate Swaps',2,3.20,3.50],['DER','LM08','Pricing and Valuation of Options',4,3.35,3.50],
  ['DER','LM09','Option Replication Using Put-Call Parity',2,3.40,4.00],['DER','LM10','Valuing a Derivative Using a One-Period Binomial Model',2,3.30,3.00],
  ['ALT','LM01','Alternative Investment Features, Methods, Structures',3,1.73,1.33],['ALT','LM02','Alternative Investment Performance and Returns',2,2.30,2.00],
  ['ALT','LM03','Private Capital: Equity and Debt',3,2.07,1.67],['ALT','LM04','Real Estate and Infrastructure',4,2.00,2.00],
  ['ALT','LM05','Natural Resources',3,2.07,1.67],['ALT','LM06','Hedge Funds',3,2.07,1.67],
  ['ALT','LM07','Introduction to Digital Assets',4,1.95,1.50],
  ['PM','LM01','Portfolio Risk and Return: Part I',7,3.26,2.14],['PM','LM02','Portfolio Risk and Return: Part II',9,3.11,2.11],
  ['PM','LM03','Portfolio Management: An Overview',6,2.40,1.00],['PM','LM04','Basics of Portfolio Planning and Construction',8,2.67,1.25],
  ['PM','LM05','Behavioral Biases of Individuals',3,2.47,1.67],['PM','LM06','Introduction to Risk Management',7,2.86,1.14],
  ['ETH','LM01','Ethics and Trust in the Investment Profession',7,3.40,1.00],
  ['ETH','LM04','Introduction to GIPS',6,3.40,1.00],['ETH','LM05','Ethics Application',2,3.60,1.50],
]

const STATUS_ORDER: Status[] = ['not_started', 'in_progress', 'to_review', 'mastered']
const STATUS_SHORT: Record<Status, string> = { not_started: 'NS', in_progress: 'IP', to_review: 'TR', mastered: 'MA' }
const STATUS_LABELS: Record<Status, string> = { not_started: 'Not Started', in_progress: 'In Progress', to_review: 'To Review', mastered: 'Mastered' }

const Q_NAMES: Record<number, string> = { 1: 'DO NOW', 2: 'SCHEDULE', 3: 'DELEGATE / REDUCE', 4: 'ELIMINATE / REDUCE' }
const Q_DESC: Record<number, string> = {
  1: 'Direct impact on score, deadline close. Handle this week.',
  2: 'High exam weight, still time. Where strong candidates spend most time.',
  3: 'Low weight but seems urgent. Cover quickly without going deep.',
  4: 'Low exam weight, low priority. Skim only.',
}

// Dark theme quadrant colors
const Q_COLORS: Record<number, { border: string; headBg: string; headText: string; hoverBg: string; accent: string }> = {
  1: { border: '#EF4444', headBg: 'rgba(239,68,68,0.12)', headText: '#FCA5A5', hoverBg: 'rgba(239,68,68,0.06)', accent: '#EF4444' },
  2: { border: '#3B82F6', headBg: 'rgba(59,130,246,0.12)', headText: '#93C5FD', hoverBg: 'rgba(59,130,246,0.06)', accent: '#3B82F6' },
  3: { border: '#F97316', headBg: 'rgba(249,115,22,0.12)', headText: '#FDBA74', hoverBg: 'rgba(249,115,22,0.06)', accent: '#F97316' },
  4: { border: '#22C55E', headBg: 'rgba(34,197,94,0.12)', headText: '#86EFAC', hoverBg: 'rgba(34,197,94,0.06)', accent: '#22C55E' },
}

const STATUS_COLORS: Record<Status, { bg: string; text: string }> = {
  not_started: { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
  in_progress: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  to_review:   { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  mastered:    { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
}

const STORAGE_KEY = 'cfa_planner_v1'
const COL_WIDTHS_KEY = 'cfa_planner_colwidths'

// Default column widths (percentages) for left table and quadrant tables
const DEFAULT_LEFT_COLS = [12, 10, 50, 10, 18]    // Topic, LM, Title, LOs, Status
const DEFAULT_QUAD_COLS = [10, 10, 48, 14, 18]     // Topic, LM, Title, Weight, Status

interface ColWidths { left: number[]; quad: number[] }

function loadColWidths(): ColWidths {
  if (typeof window === 'undefined') return { left: DEFAULT_LEFT_COLS, quad: DEFAULT_QUAD_COLS }
  try {
    const raw = localStorage.getItem(COL_WIDTHS_KEY)
    if (raw) { const parsed = JSON.parse(raw); return { left: parsed.left || DEFAULT_LEFT_COLS, quad: parsed.quad || DEFAULT_QUAD_COLS } }
  } catch { /* */ }
  return { left: DEFAULT_LEFT_COLS, quad: DEFAULT_QUAD_COLS }
}

function saveColWidths(cw: ColWidths) {
  localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(cw))
}

// ── ALGORITHM ──────────────────────────────────────────────
function assignQuadrant(m: Module): number {
  const w = m.exam_weight_mid, p = m.priority_score, mastery = m.mastery_pct, gap = 100 - mastery
  const isImportant = w >= 10 || p >= 3.8 || (w >= 8 && gap > 60)
  const isUrgent = gap > 70 || (w >= 10 && mastery < 40) || p >= 4.2
  if (isImportant && isUrgent) return 1
  if (isImportant && !isUrgent) return 2
  if (!isImportant && isUrgent) return 3
  return 4
}

function loadModules(): Module[] {
  let savedMap: Record<string, SavedModule> = {}
  if (typeof window !== 'undefined') {
    try { savedMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { /* */ }
  }
  const mods = RAW.map(r => {
    const id = `${r[0]}-${r[1]}`
    const s = savedMap[id] || {}
    return {
      id, topic: r[0], lm: r[1], title: r[2], nb_los: r[3],
      priority_score: r[4], difficulty_score: r[5],
      exam_weight_range: TOPICS[r[0]].w, exam_weight_mid: TOPICS[r[0]].wm,
      status: (s.status || 'not_started') as Status,
      mastery_pct: s.mastery_pct ?? 0,
      accuracy_pct: s.accuracy_pct ?? null,
      mock_score: s.mock_score ?? null,
      notes: s.notes || '',
      pinned: s.pinned || false,
      quadrant: 0,
    }
  })
  mods.forEach(m => {
    const s = savedMap[m.id]
    if (s?.pinned && s.quadrant) { m.quadrant = s.quadrant; m.pinned = true }
    else m.quadrant = assignQuadrant(m)
  })
  return mods
}

function saveModules(modules: Module[]) {
  const obj: Record<string, SavedModule> = {}
  modules.forEach(m => {
    obj[m.id] = { status: m.status, mastery_pct: m.mastery_pct, accuracy_pct: m.accuracy_pct,
      mock_score: m.mock_score, notes: m.notes, pinned: m.pinned, quadrant: m.quadrant }
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
}

// ── COMPONENTS ─────────────────────────────────────────────

function TopicBadge({ topic }: { topic: string }) {
  const c = TOPICS[topic]?.c || '#666'
  return (
    <span className="inline-flex items-center justify-center w-[30px] h-[17px] rounded text-[8px] font-extrabold text-white tracking-wider"
      style={{ background: c }}>{topic}</span>
  )
}

function StatusPill({ status, onClick }: { status: Status; onClick?: () => void }) {
  const s = STATUS_COLORS[status]
  return (
    <span className="inline-block px-1.5 py-[1px] rounded-lg text-[9px] font-bold cursor-pointer select-none transition-colors"
      style={{ background: s.bg, color: s.text }} onClick={onClick}>
      {STATUS_SHORT[status]}
    </span>
  )
}

// ── Resize Handle component ───────────────────────────────
function ResizeHandle({ onResize }: { onResize: (deltaX: number) => void }) {
  const startXRef = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startXRef.current = e.clientX

    const onMouseMove = (ev: MouseEvent) => {
      onResize(ev.clientX - startXRef.current)
      startXRef.current = ev.clientX
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [onResize])

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-[3] hover:bg-purple-500/30 transition-colors"
      style={{ touchAction: 'none' }}
    />
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function EisenhowerPlanner() {
  const [modules, setModules] = useState<Module[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('quadrant')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [topicFilter, setTopicFilter] = useState('ALL')
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [colWidths, setColWidths] = useState<ColWidths>(loadColWidths)
  const dragIdRef = useRef<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const leftTableRef = useRef<HTMLTableElement>(null)
  const quadTableRefs = useRef<Record<number, HTMLTableElement | null>>({ 1: null, 2: null, 3: null, 4: null })

  // Column resize handler — adjusts col[index] and col[index+1] to keep total 100%
  const handleColResize = useCallback((tableType: 'left' | 'quad', colIndex: number, deltaX: number) => {
    const tableEl = tableType === 'left' ? leftTableRef.current : Object.values(quadTableRefs.current).find(Boolean)
    if (!tableEl) return
    const tableWidth = tableEl.offsetWidth
    if (tableWidth === 0) return
    const deltaPct = (deltaX / tableWidth) * 100

    setColWidths(prev => {
      const arr = [...(tableType === 'left' ? prev.left : prev.quad)]
      const minW = 4 // minimum column width %
      const newLeft = arr[colIndex] + deltaPct
      const newRight = arr[colIndex + 1] - deltaPct
      if (newLeft < minW || newRight < minW) return prev
      arr[colIndex] = Math.round(newLeft * 100) / 100
      arr[colIndex + 1] = Math.round(newRight * 100) / 100
      const next = { ...prev, [tableType]: arr }
      saveColWidths(next)
      return next
    })
  }, [])

  const makeLeftResizeHandler = useCallback((colIndex: number) => {
    return (deltaX: number) => handleColResize('left', colIndex, deltaX)
  }, [handleColResize])

  const makeQuadResizeHandler = useCallback((colIndex: number) => {
    return (deltaX: number) => handleColResize('quad', colIndex, deltaX)
  }, [handleColResize])

  // Init
  useEffect(() => { setModules(loadModules()) }, [])

  // Save on change
  const update = useCallback((fn: (mods: Module[]) => Module[]) => {
    setModules(prev => { const next = fn([...prev.map(m => ({ ...m }))]); saveModules(next); return next })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedId(null); return }
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault(); searchRef.current?.focus(); return
      }
      if (!selectedId || tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'm' || e.key === 'M') { handleMarkMastered(selectedId); return }
      if (['1','2','3','4'].includes(e.key)) { handleReassign(selectedId, Number(e.key)); return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Actions ────────────────────────────────────────────
  const cycleStatus = useCallback((id: string) => {
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (!m) return mods
      const i = STATUS_ORDER.indexOf(m.status)
      m.status = STATUS_ORDER[(i + 1) % 4]
      if (m.status === 'mastered') m.mastery_pct = 100
      if (!m.pinned) m.quadrant = assignQuadrant(m)
      return mods
    })
  }, [update])

  const handleMarkMastered = useCallback((id: string) => {
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (!m) return mods
      m.status = 'mastered'; m.mastery_pct = 100
      if (!m.pinned) m.quadrant = assignQuadrant(m)
      return mods
    })
  }, [update])

  const handleReassign = useCallback((id: string, q: number) => {
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (!m) return mods
      m.quadrant = q; m.pinned = true
      return mods
    })
    setReassignOpen(false)
  }, [update])

  const handleSetStatus = useCallback((id: string, status: Status) => {
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (!m) return mods
      m.status = status
      if (status === 'mastered') m.mastery_pct = 100
      if (!m.pinned) m.quadrant = assignQuadrant(m)
      return mods
    })
  }, [update])

  const handleSlider = useCallback((id: string, field: 'mastery_pct' | 'accuracy_pct', val: number) => {
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (!m) return mods
      m[field] = val
      if (field === 'mastery_pct' && !m.pinned) m.quadrant = assignQuadrant(m)
      return mods
    })
  }, [update])

  const handleField = useCallback((id: string, field: 'mock_score' | 'notes', val: number | null | string) => {
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (!m) return mods
      ;(m as unknown as Record<string, unknown>)[field] = val
      return mods
    })
  }, [update])

  const recalcAll = useCallback(() => {
    update(mods => { mods.forEach(m => { if (!m.pinned) m.quadrant = assignQuadrant(m) }); return mods })
  }, [update])

  const resetAll = useCallback(() => {
    setShowResetConfirm(true)
  }, [])

  const doResetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setModules(loadModules())
    setSelectedId(null)
  }, [])

  const exportCSV = useCallback(() => {
    const header = 'ID,Topic,LM,Title,LOS,Exam Weight,Priority,Difficulty,Status,Mastery%,Accuracy%,Mock Score,Quadrant,Pinned,Notes\n'
    const rows = modules.map(m =>
      `"${m.id}","${m.topic}","${m.lm}","${m.title.replace(/"/g, '""')}",${m.nb_los},"${m.exam_weight_range}",${m.priority_score},${m.difficulty_score},"${m.status}",${m.mastery_pct},${m.accuracy_pct ?? ''},${m.mock_score ?? ''},Q${m.quadrant},${m.pinned},"${(m.notes || '').replace(/"/g, '""')}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cfa_eisenhower_planner.csv'; a.click()
  }, [modules])

  // ── Drag & Drop ────────────────────────────────────────
  const onDragStart = useCallback((id: string) => { dragIdRef.current = id }, [])
  const onDrop = useCallback((q: number) => {
    const id = dragIdRef.current
    if (!id) return
    update(mods => {
      const m = mods.find(x => x.id === id)
      if (m) { m.quadrant = q; m.pinned = true }
      return mods
    })
    dragIdRef.current = null
    setDropTarget(null)
  }, [update])

  // ── Derived data ───────────────────────────────────────
  const selectedModule = useMemo(() => modules.find(m => m.id === selectedId) || null, [modules, selectedId])

  const filteredLeft = useMemo(() => {
    const s = search.toLowerCase()
    let list = modules.filter(m => {
      if (topicFilter !== 'ALL' && m.topic !== topicFilter) return false
      if (s && !m.title.toLowerCase().includes(s) && !m.topic.toLowerCase().includes(s) && !m.id.toLowerCase().includes(s)) return false
      return true
    })
    const fns: Record<SortMode, (a: Module, b: Module) => number> = {
      quadrant: (a, b) => a.quadrant - b.quadrant || b.priority_score - a.priority_score,
      priority: (a, b) => b.priority_score - a.priority_score,
      topic: (a, b) => a.topic.localeCompare(b.topic) || a.lm.localeCompare(b.lm),
      status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    }
    list.sort(fns[sort])
    return list
  }, [modules, search, topicFilter, sort])

  const quadrantModules = useMemo(() => {
    const map: Record<number, Module[]> = { 1: [], 2: [], 3: [], 4: [] }
    modules.forEach(m => { if (map[m.quadrant]) map[m.quadrant].push(m) })
    Object.values(map).forEach(arr => arr.sort((a, b) => b.priority_score - a.priority_score))
    return map
  }, [modules])

  // KPIs
  const kpis = useMemo(() => {
    const ma = modules.filter(m => m.status === 'mastered').length
    const ip = modules.filter(m => m.status === 'in_progress').length
    const hp = modules.filter(m => m.quadrant === 1).length
    const mockScores = modules.filter(m => m.mock_score !== null).map(m => m.mock_score!)
    const mockAvg = mockScores.length ? Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length) : null
    return { ma, ip, hp, mockAvg }
  }, [modules])

  // Countdown
  const daysLeft = useMemo(() => {
    const exam = new Date(2026, 7, 22) // Aug 22, 2026
    return Math.ceil((exam.getTime() - Date.now()) / 86400000)
  }, [])

  if (modules.length === 0) return <div className="text-slate-500 p-8">Loading...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden text-[11.5px]">
      {/* KPI BAR */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[13px] font-bold text-white">Eisenhower Planner</h1>
          <span className="text-[11px] text-slate-400 tabular-nums">{daysLeft} days to Aug 22, 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">Mastered: {kpis.ma}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400">In Progress: {kpis.ip}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400">High Priority: {kpis.hp}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400">Mock Avg: {kpis.mockAvg !== null ? `${kpis.mockAvg}%` : '—'}</span>
          <div className="flex gap-1 ml-2">
            <button onClick={recalcAll} className="px-2 py-1 rounded text-[10px] font-semibold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition-colors">Recalculate</button>
            <button onClick={exportCSV} className="px-2 py-1 rounded text-[10px] font-semibold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition-colors">Export CSV</button>
            <button onClick={resetAll} className="px-2 py-1 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Reset</button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-[26%] min-w-[280px] max-w-[380px] bg-white/[0.02] border-r border-white/[0.06] flex flex-col overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex gap-1 mb-2">
              <input ref={searchRef} type="text" placeholder="Search modules... ( / )"
                className="flex-1 px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50"
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] text-slate-300 cursor-pointer"
                value={sort} onChange={e => setSort(e.target.value as SortMode)}>
                <option value="quadrant">By Quadrant</option>
                <option value="priority">By Priority</option>
                <option value="topic">By Topic</option>
                <option value="status">By Status</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setTopicFilter('ALL')}
                className={`px-1.5 py-[1px] rounded-lg text-[9px] font-bold border transition-colors ${
                  topicFilter === 'ALL' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08]'
                }`}>ALL</button>
              {Object.entries(TOPICS).map(([key, t]) => (
                <button key={key} onClick={() => setTopicFilter(topicFilter === key ? 'ALL' : key)}
                  className="px-1.5 py-[1px] rounded-lg text-[9px] font-bold border transition-colors"
                  style={{
                    background: topicFilter === key ? t.c : 'rgba(255,255,255,0.04)',
                    borderColor: topicFilter === key ? t.c : t.c + '40',
                    color: topicFilter === key ? '#fff' : t.c,
                  }}>{key}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table ref={leftTableRef} className="w-full border-collapse text-[10.5px] table-fixed">
              <colgroup>
                {colWidths.left.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
              </colgroup>
              <thead>
                <tr className="sticky top-0 z-[2] bg-[#161822]">
                  {['Topic', 'LM', 'Title', 'LOs', 'Status'].map((label, i) => (
                    <th key={label} className="relative text-left py-1 px-1.5 text-[9px] uppercase text-slate-500 font-medium border-b border-white/[0.06]">
                      {label}
                      {i < 4 && <ResizeHandle onResize={makeLeftResizeHandler(i)} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeft.map(m => (
                  <tr key={m.id} onClick={() => setSelectedId(m.id)}
                    className={`cursor-pointer transition-colors border-b border-white/[0.03] ${
                      m.id === selectedId ? 'bg-purple-500/10' : 'hover:bg-white/[0.03]'
                    }`}>
                    <td className="py-[3px] px-1.5 overflow-hidden"><TopicBadge topic={m.topic} /></td>
                    <td className="py-[3px] px-1.5 text-[11px] text-slate-400 font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{m.lm}</td>
                    <td className="py-[3px] px-1.5 text-[11px] text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">{m.title}</td>
                    <td className="py-[3px] px-1.5 overflow-hidden"><span className="bg-white/[0.06] text-slate-400 px-1 rounded text-[9px] font-semibold">{m.nb_los}</span></td>
                    <td className="py-[3px] px-1.5 overflow-hidden" onClick={e => { e.stopPropagation(); cycleStatus(m.id) }}>
                      <StatusPill status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUADRANTS */}
        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 grid-rows-2 gap-2">
          {([1, 2, 3, 4] as number[]).map(q => {
            const qc = Q_COLORS[q]
            const qm = quadrantModules[q]
            return (
              <div key={q}
                className={`flex flex-col rounded-lg overflow-hidden border transition-shadow ${
                  dropTarget === q ? 'ring-2 ring-purple-500' : ''
                }`}
                style={{ borderColor: 'rgba(255,255,255,0.06)', borderLeftWidth: '4px', borderLeftColor: qc.border }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(q) }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={e => { e.preventDefault(); onDrop(q) }}>
                <div className="px-2.5 py-1.5" style={{ background: qc.headBg }}>
                  <div className="flex items-center gap-1 text-[11px] font-extrabold" style={{ color: qc.headText }}>
                    Q{q} {Q_NAMES[q]}
                    <span className="ml-auto text-[9.5px] font-semibold opacity-70">{qm.length}/{modules.length}</span>
                  </div>
                  <div className="text-[8.5px] opacity-70 mt-0.5" style={{ color: qc.headText }}>{Q_DESC[q]}</div>
                </div>
                <div className="flex-1 overflow-y-auto bg-white/[0.01]">
                  {qm.length === 0 ? (
                    <div className="p-5 text-center text-slate-600 text-[11px]">No modules in this quadrant</div>
                  ) : (
                    <table ref={el => { quadTableRefs.current[q] = el }} className="w-full border-collapse text-[10px] table-fixed">
                      <colgroup>
                        {colWidths.quad.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
                      </colgroup>
                      <thead>
                        <tr className="sticky top-0 bg-[#161822] z-[1]">
                          {['Topic', 'LM', 'Title', 'Weight', 'Status'].map((label, i) => (
                            <th key={label} className="relative text-left py-1 px-1.5 text-[8px] uppercase text-slate-600 border-b border-white/[0.06]">
                              {label}
                              {i < 4 && <ResizeHandle onResize={makeQuadResizeHandler(i)} />}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {qm.map(m => (
                          <tr key={m.id} draggable
                            onDragStart={() => onDragStart(m.id)}
                            onClick={() => setSelectedId(m.id)}
                            className="cursor-grab border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]">
                            <td className="py-[2px] px-1.5 overflow-hidden"><TopicBadge topic={m.topic} /></td>
                            <td className="py-[2px] px-1.5 font-semibold text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                              {m.lm}{m.pinned && <span className="ml-0.5 opacity-50 text-[10px]">&#128204;</span>}
                            </td>
                            <td className="py-[2px] px-1.5 text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">{m.title}</td>
                            <td className="py-[2px] px-1.5 text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">{m.exam_weight_range}</td>
                            <td className="py-[2px] px-1.5 overflow-hidden" onClick={e => { e.stopPropagation(); cycleStatus(m.id) }}>
                              <StatusPill status={m.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setSelectedId(null) }}>
          <div className="bg-[#1e2030] border border-white/[0.08] rounded-xl w-[440px] max-h-[85vh] overflow-y-auto p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <TopicBadge topic={selectedModule.topic} />
              <span className="text-[12px] font-bold text-slate-400">{selectedModule.id}</span>
            </div>
            <h2 className="text-[14px] font-extrabold text-white mb-1">{selectedModule.title}</h2>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mb-4"
              style={{ background: Q_COLORS[selectedModule.quadrant].headBg, color: Q_COLORS[selectedModule.quadrant].headText }}>
              Q{selectedModule.quadrant} {Q_NAMES[selectedModule.quadrant]}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {[
                { val: selectedModule.exam_weight_range, lbl: 'Exam Weight' },
                { val: selectedModule.priority_score.toFixed(2), lbl: 'Priority Score' },
                { val: selectedModule.difficulty_score.toFixed(2), lbl: 'Difficulty' },
                { val: String(selectedModule.nb_los), lbl: 'Learning Outcomes' },
                { val: `${selectedModule.mastery_pct}%`, lbl: 'Mastery' },
                { val: selectedModule.accuracy_pct !== null ? `${selectedModule.accuracy_pct}%` : '—', lbl: 'Accuracy' },
              ].map(s => (
                <div key={s.lbl} className="bg-white/[0.04] rounded-md p-2 text-center">
                  <div className="text-[15px] font-extrabold text-white">{s.val}</div>
                  <div className="text-[8px] uppercase text-slate-500 font-semibold">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Status buttons */}
            <div className="flex gap-1 mb-4">
              {STATUS_ORDER.map(s => (
                <button key={s} onClick={() => handleSetStatus(selectedModule.id, s)}
                  className="flex-1 py-1.5 rounded-md text-[10px] font-bold border-2 transition-colors"
                  style={{
                    background: selectedModule.status === s ? STATUS_COLORS[s].text : 'transparent',
                    borderColor: selectedModule.status === s ? STATUS_COLORS[s].text : 'rgba(255,255,255,0.08)',
                    color: selectedModule.status === s ? '#fff' : STATUS_COLORS[s].text,
                  }}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="flex items-center gap-2 mb-2">
              <label className="w-[70px] text-[10px] font-semibold text-slate-400">Mastery %</label>
              <input type="range" min={0} max={100} value={selectedModule.mastery_pct}
                className="flex-1 accent-purple-500"
                onChange={e => handleSlider(selectedModule.id, 'mastery_pct', Number(e.target.value))} />
              <span className="w-[36px] text-right text-[11px] font-bold text-white tabular-nums">{selectedModule.mastery_pct}%</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="w-[70px] text-[10px] font-semibold text-slate-400">Accuracy %</label>
              <input type="range" min={0} max={100} value={selectedModule.accuracy_pct ?? 0}
                className="flex-1 accent-purple-500"
                onChange={e => handleSlider(selectedModule.id, 'accuracy_pct', Number(e.target.value))} />
              <span className="w-[36px] text-right text-[11px] font-bold text-white tabular-nums">{selectedModule.accuracy_pct ?? 0}%</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <label className="w-[70px] text-[10px] font-semibold text-slate-400">Mock Score</label>
              <input type="number" min={0} max={100} placeholder="—"
                className="w-[50px] px-1.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[11px] text-center text-white"
                value={selectedModule.mock_score ?? ''}
                onChange={e => handleField(selectedModule.id, 'mock_score', e.target.value ? Number(e.target.value) : null)} />
            </div>

            {/* Notes */}
            <textarea placeholder="Add notes..."
              className="w-full p-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[11px] text-slate-200 resize-y min-h-[48px] mb-3 outline-none focus:border-purple-500/50"
              value={selectedModule.notes}
              onChange={e => handleField(selectedModule.id, 'notes', e.target.value)} />

            {/* Actions */}
            <div className="flex gap-1.5">
              <button onClick={() => handleMarkMastered(selectedModule.id)}
                className="flex-1 py-1.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                Mark as Mastered
              </button>
              <div className="relative">
                <button onClick={() => setReassignOpen(!reassignOpen)}
                  className="py-1.5 px-3 rounded-md text-[11px] font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition-colors">
                  Reassign
                </button>
                {reassignOpen && (
                  <div className="absolute bottom-full left-0 mb-1 bg-[#1e2030] border border-white/[0.1] rounded-lg shadow-xl min-w-[180px] z-10 overflow-hidden">
                    {[1, 2, 3, 4].map(q => (
                      <button key={q} onClick={() => handleReassign(selectedModule.id, q)}
                        className="block w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06] transition-colors">
                        Q{q} — {Q_NAMES[q]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { setSelectedId(null); setReassignOpen(false) }}
                className="py-1.5 px-3 rounded-md text-[11px] font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition-colors ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={doResetAll}
        type="danger"
        title="Reset all progress?"
        message="This will reset all module progress, mastery scores, and notes. This action cannot be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
      />
    </div>
  )
}
