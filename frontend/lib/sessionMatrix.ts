// ── Session Matrix — maps (energy × time) → SessionData ──

export interface SessionLM {
  badge: string
  name: string
  meta: string
  type: string
  typeColor: string
  typeBg: string
}

export interface SessionSignal {
  label: string
  variant: 'red' | 'blue' | 'amber' | 'teal'
}

export interface SessionData {
  eyebrow: string
  title: string
  subtitle: string
  lms: SessionLM[]
  whyTitle: string
  whyBody: string
  signals: SessionSignal[]
}

export interface ResourceItem {
  id: string
  name: string
  type: string
  description: string
  color: string
}

type Energy = 'high' | 'mid' | 'low'

export const SIGNAL_COLORS: Record<SessionSignal['variant'], { bg: string; text: string }> = {
  red:   { bg: 'rgba(239,68,68,.12)', text: '#f87171' },
  blue:  { bg: 'rgba(108,140,255,.12)', text: '#a0b4ff' },
  amber: { bg: 'rgba(245,158,11,.12)', text: '#fbbf24' },
  teal:  { bg: 'rgba(0,224,184,.12)', text: '#00e0b8' },
}

const TYPE_BADGE: Record<string, { color: string; bg: string }> = {
  'Discovery':    { color: '#60a5fa', bg: 'rgba(96,165,250,.12)' },
  'Reinforcement':{ color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
  'Drill':        { color: '#fbbf24', bg: 'rgba(251,191,36,.12)' },
  'Assessment':   { color: '#f472b6', bg: 'rgba(244,114,182,.12)' },
  'Audio':        { color: '#818cf8', bg: 'rgba(129,140,248,.12)' },
  'Flashcards':   { color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  'Diagnostic':   { color: '#f472b6', bg: 'rgba(244,114,182,.12)' },
}

function tb(type: string): { typeColor: string; typeBg: string } {
  const s = TYPE_BADGE[type] || TYPE_BADGE['Discovery']
  return { typeColor: s.color, typeBg: s.bg }
}

// ── HIGH energy ──
const HIGH: Record<number, SessionData> = {
  120: {
    eyebrow: 'Generated · Intensive reinforcement · 120 min',
    title: 'FI Sequence — 3 Modules',
    subtitle: 'Intensive reinforcement Fixed Income LM02→LM04',
    lms: [
      { badge: 'FI LM02', name: 'Bond Valuation', meta: '40 min · 6 LOS', type: 'Reinforcement', ...tb('Reinforcement') },
      { badge: 'FI LM03', name: 'Yield and Yield Spread Measures', meta: '40 min · 5 LOS', type: 'Drill', ...tb('Drill') },
      { badge: 'FI LM04', name: 'Interest Rate Risk', meta: '40 min · 7 LOS', type: 'Assessment', ...tb('Assessment') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Fixed Income weighs 11-14% of the exam and your mastery is low. With 120 min of high energy, we attack 3 modules sequentially: reinforcement → drill → assessment. The extended duration consolidates connections between duration, convexity, and spreads.',
    signals: [
      { label: 'FI 22% mastery', variant: 'red' },
      { label: '11-14% exam weight', variant: 'blue' },
      { label: 'Discovery Phase W1', variant: 'amber' },
    ],
  },
  90: {
    eyebrow: 'Generated · Full effort · 90 min',
    title: 'FI LM04 — Interest Rate Risk',
    subtitle: 'Theory + drill + self-check in 3 blocks',
    lms: [
      { badge: 'FI LM04', name: 'Duration & Convexity — Theory', meta: '35 min · 4 LOS', type: 'Discovery', ...tb('Discovery') },
      { badge: 'FI LM04', name: 'Duration Drill — Calculations', meta: '30 min · 3 LOS', type: 'Drill', ...tb('Drill') },
      { badge: 'FI LM04', name: 'Self-check 10Q', meta: '25 min · 10 questions', type: 'Assessment', ...tb('Assessment') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'LM04 Interest Rate Risk is the most tested FI module. At 90 min you can cover theory, practice duration/convexity calculations, and validate with a quiz. Optimal format for a complex module.',
    signals: [
      { label: 'FI 22% mastery', variant: 'red' },
      { label: 'Most tested FI module', variant: 'amber' },
      { label: 'High energy detected', variant: 'teal' },
    ],
  },
  60: {
    eyebrow: 'Generated · Discovery + Quick win · 60 min',
    title: 'FI LM01 + Corporate Issuers',
    subtitle: 'Discovery Fixed Income + quick win CORP',
    lms: [
      { badge: 'FI LM01', name: 'Fixed-Income Instrument Features', meta: '40 min · 5 LOS', type: 'Discovery', ...tb('Discovery') },
      { badge: 'CORP LM01', name: 'Organizational Forms & Ownership', meta: '20 min · 3 LOS', type: 'Discovery', ...tb('Discovery') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'In 60 min high energy, we mix a heavy module (FI LM01, mandatory foundations) with a short one (CORP LM01, quick win at 19% mastery). Maximizes topic coverage while keeping motivation high.',
    signals: [
      { label: 'CORP 19% mastery', variant: 'red' },
      { label: 'FI foundations', variant: 'blue' },
      { label: 'Dual-topic boost', variant: 'teal' },
    ],
  },
  45: {
    eyebrow: 'Generated · Guided discovery · 45 min',
    title: 'Ethics LM01 — Foundations',
    subtitle: 'Guided discovery Ethics & Trust',
    lms: [
      { badge: 'ETH LM01', name: 'Ethics and Trust — Reading', meta: '25 min · 4 LOS', type: 'Discovery', ...tb('Discovery') },
      { badge: 'ETH LM01', name: 'Ethics and Trust — Concept Check', meta: '20 min · 5 questions', type: 'Assessment', ...tb('Assessment') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Ethics weighs 15-20% of the exam — the highest weighted topic. At 45 min, we cover guided reading then an immediate concept check. Freshness from reading maximizes retention.',
    signals: [
      { label: '15-20% exam weight', variant: 'blue' },
      { label: 'Top priority topic', variant: 'red' },
      { label: 'Discovery Phase', variant: 'amber' },
    ],
  },
  30: {
    eyebrow: 'Generated · Diagnostic · 30 min',
    title: 'Diagnostic 5Q — Calibration',
    subtitle: '5 multi-topic questions to calibrate your level',
    lms: [
      { badge: 'MULTI', name: 'Multi-topic Diagnostic 5Q', meta: '30 min · 5 questions · ETH, FSA, FI, QM, EQU', type: 'Diagnostic', ...tb('Diagnostic') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'In 30 min high energy, a 5Q diagnostic is the best investment. It recalibrates Wingman on your real strengths/weaknesses and adjusts priorities. Each question covers a different high-weight topic.',
    signals: [
      { label: 'Global calibration', variant: 'blue' },
      { label: '5 topics covered', variant: 'teal' },
      { label: 'Adjusts priorities', variant: 'amber' },
    ],
  },
  20: {
    eyebrow: 'Generated · Flashcards · 20 min',
    title: 'Flashcards Ethics LM01',
    subtitle: '15 flashcards on Ethics and Trust',
    lms: [
      { badge: 'ETH LM01', name: 'Flashcards Ethics — Code & Standards', meta: '20 min · 15 cards', type: 'Flashcards', ...tb('Flashcards') },
    ],
    whyTitle: 'Why this session',
    whyBody: '20 min high energy on Ethics flashcards: optimal SRS timing. Ethics is the heaviest exam topic and flashcards activate active recall — 3x more effective than passive rereading.',
    signals: [
      { label: 'Optimal SRS', variant: 'teal' },
      { label: '15-20% exam weight', variant: 'blue' },
    ],
  },
}

// ── MID energy ──
const MID: Record<number, SessionData> = {
  120: {
    eyebrow: 'Generated · Mixed consolidation · 120 min',
    title: 'QM Consolidation + ETH Discovery + Flash',
    subtitle: 'Mixed session: reinforcement, discovery, and review',
    lms: [
      { badge: 'QM LM02', name: 'Time Value of Money — Consolidation', meta: '50 min · 6 LOS', type: 'Reinforcement', ...tb('Reinforcement') },
      { badge: 'ETH LM02', name: 'Introduction to GIPS — Discovery', meta: '40 min · 4 LOS', type: 'Discovery', ...tb('Discovery') },
      { badge: 'QM+ETH', name: 'Flash review mix', meta: '30 min · 20 cards', type: 'Flashcards', ...tb('Flashcards') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'At moderate energy over 120 min, we alternate modes: QM consolidation (medium cognitive effort), ETH discovery (guided reading), and flashcards (active recall). Mode switching prevents cognitive fatigue.',
    signals: [
      { label: 'QM 28% mastery', variant: 'red' },
      { label: 'Anti-fatigue alternation', variant: 'teal' },
      { label: 'ETH 15-20% exam', variant: 'blue' },
    ],
  },
  90: {
    eyebrow: 'Generated · Targeted reinforcement · 90 min',
    title: 'QM LM02 — Time Value of Money',
    subtitle: 'Review + weak LOS drill + self-check',
    lms: [
      { badge: 'QM LM02', name: 'TVM — Summary review', meta: '30 min · 6 LOS', type: 'Reinforcement', ...tb('Reinforcement') },
      { badge: 'QM LM02', name: 'Weak LOS drill (annuities, PV)', meta: '35 min · 3 LOS', type: 'Drill', ...tb('Drill') },
      { badge: 'QM LM02', name: 'Self-check 5Q', meta: '25 min · 5 questions', type: 'Assessment', ...tb('Assessment') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'QM LM02 (TVM) is a foundational module — PV, FV, and annuity calculations appear in 60% of quantitative problems. In 90 min we review, drill the weakest LOS, and validate with a targeted quiz.',
    signals: [
      { label: 'QM 28% mastery', variant: 'red' },
      { label: 'Foundational module', variant: 'amber' },
      { label: 'Weak LOS targeted', variant: 'blue' },
    ],
  },
  60: {
    eyebrow: 'Generated · Quick win · 60 min',
    title: 'Corporate Issuers LM01 — Quick Win',
    subtitle: 'Discovery + quick drill on CORP',
    lms: [
      { badge: 'CORP LM01', name: 'Organizational Forms & Ownership', meta: '35 min · 4 LOS', type: 'Discovery', ...tb('Discovery') },
      { badge: 'CORP LM01', name: 'Quick Drill 5Q', meta: '25 min · 5 questions', type: 'Drill', ...tb('Drill') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'CORP is at 19% mastery with 8-12% exam weight. LM01 is accessible even at moderate energy. In 60 min you can cover it entirely — a quick win that boosts your overall coverage.',
    signals: [
      { label: 'CORP 19% mastery', variant: 'red' },
      { label: 'Accessible quick win', variant: 'teal' },
      { label: '8-12% exam weight', variant: 'blue' },
    ],
  },
  45: {
    eyebrow: 'Generated · Targeted consolidation · 45 min',
    title: 'QM LM02 — LOS 3 & 5 Targeted',
    subtitle: 'Weak LOS consolidation + 5Q check',
    lms: [
      { badge: 'QM LM02', name: 'TVM — LOS 3 & 5 (Annuities + PV)', meta: '30 min · 2 LOS', type: 'Reinforcement', ...tb('Reinforcement') },
      { badge: 'QM LM02', name: 'Targeted check 5Q', meta: '15 min · 5 questions', type: 'Assessment', ...tb('Assessment') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'In 45 min at moderate energy, we surgically target the 2 weakest TVM LOS. More effective than a general review — research shows targeted work doubles learning speed.',
    signals: [
      { label: 'Weak LOS targeting', variant: 'amber' },
      { label: 'QM foundational', variant: 'blue' },
    ],
  },
  30: {
    eyebrow: 'Generated · Diagnostic · 30 min',
    title: 'Diagnostic 5Q — Calibration',
    subtitle: 'Multi-topic calibration at moderate energy',
    lms: [
      { badge: 'MULTI', name: 'Adaptive diagnostic 5Q', meta: '30 min · 5 questions · FSA, QM, ETH, FI, CORP', type: 'Diagnostic', ...tb('Diagnostic') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Even at moderate energy, 30 min of diagnostics is a high-ROI investment. Adaptive questions adjust difficulty to your real level. Wingman recalibrates all priorities after each diagnostic.',
    signals: [
      { label: 'Recalibration', variant: 'blue' },
      { label: '5 topics', variant: 'teal' },
    ],
  },
  20: {
    eyebrow: 'Generated · Flashcards · 20 min',
    title: 'Flashcards QM LM02 — Formulas',
    subtitle: '12 flashcards Time Value of Money formulas',
    lms: [
      { badge: 'QM LM02', name: 'Flashcards TVM — Key formulas', meta: '20 min · 12 cards', type: 'Flashcards', ...tb('Flashcards') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'TVM formulas are the foundation for half of CFA calculations. 20 min of flashcards at moderate energy activates recall on PV, FV, annuities — the least tiring but most effective mode per minute.',
    signals: [
      { label: 'Active recall', variant: 'teal' },
      { label: 'Foundational formulas', variant: 'amber' },
    ],
  },
}

// ── LOW energy ──
const LOW: Record<number, SessionData> = {
  120: {
    eyebrow: 'Generated · Passive audio · 120 min',
    title: 'Audio Marathon — FI + Ethics',
    subtitle: 'Passive listening FI LM01-04 + Ethics LM01',
    lms: [
      { badge: 'FI LM01-02', name: 'Audio Fixed Income — Instruments & Valuation', meta: '45 min · audio', type: 'Audio', ...tb('Audio') },
      { badge: 'FI LM03-04', name: 'Audio Fixed Income — Yields & Risk', meta: '40 min · audio', type: 'Audio', ...tb('Audio') },
      { badge: 'ETH LM01', name: 'Audio Ethics — Trust & Standards', meta: '35 min · audio', type: 'Audio', ...tb('Audio') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Low energy + 120 min = optimal audio mode. Passive listening creates memory traces that facilitate later active learning. We cover FI (11-14% exam) and ETH (15-20% exam) — the two heaviest weights.',
    signals: [
      { label: 'Low energy mode', variant: 'teal' },
      { label: 'Memory traces', variant: 'blue' },
      { label: 'Top 2 exam weights', variant: 'amber' },
    ],
  },
  90: {
    eyebrow: 'Generated · Audio · 90 min',
    title: 'Audio FI LM04 + Ethics LM01',
    subtitle: 'Passive listening on priority modules',
    lms: [
      { badge: 'FI LM04', name: 'Audio Interest Rate Risk', meta: '50 min · audio', type: 'Audio', ...tb('Audio') },
      { badge: 'ETH LM01', name: 'Audio Ethics and Trust', meta: '40 min · audio', type: 'Audio', ...tb('Audio') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'At 90 min low energy, we target the 2 priority modules in audio. FI LM04 is the most tested Fixed Income module and Ethics LM01 lays foundations for the heaviest topic. Zero cognitive effort, maximum priming.',
    signals: [
      { label: 'Zero effort', variant: 'teal' },
      { label: 'Memory priming', variant: 'blue' },
    ],
  },
  60: {
    eyebrow: 'Generated · Audio · 60 min',
    title: 'Audio Ethics LM01 + LM04',
    subtitle: 'Complete guided Ethics listening',
    lms: [
      { badge: 'ETH LM01', name: 'Audio Ethics and Trust', meta: '35 min · audio', type: 'Audio', ...tb('Audio') },
      { badge: 'ETH LM04', name: 'Audio Introduction to GIPS', meta: '25 min · audio', type: 'Audio', ...tb('Audio') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Ethics is the only topic that can fail you even with a good overall score (minimum sector score). 60 min audio covers 2 modules passively — ideal when energy is low but time is available.',
    signals: [
      { label: 'Minimum sector score', variant: 'red' },
      { label: '15-20% exam weight', variant: 'blue' },
    ],
  },
  45: {
    eyebrow: 'Generated · Flashcards · 45 min',
    title: 'Flashcards Ethics LM01 + LM04',
    subtitle: 'Passive review via flashcards',
    lms: [
      { badge: 'ETH LM01', name: 'Flashcards Ethics and Trust', meta: '25 min · 15 cards', type: 'Flashcards', ...tb('Flashcards') },
      { badge: 'ETH LM04', name: 'Flashcards GIPS', meta: '20 min · 10 cards', type: 'Flashcards', ...tb('Flashcards') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Flashcards at low energy is the sweet spot: minimal effort, maximum retention via SRS. Ethics requires heavy memorization (standards, codes) — cards are more effective than rereading.',
    signals: [
      { label: 'Optimal SRS', variant: 'teal' },
      { label: 'Ethics memorization', variant: 'amber' },
    ],
  },
  30: {
    eyebrow: 'Generated · Flashcards · 30 min',
    title: 'Flashcards Mix — FI + Ethics',
    subtitle: '20 mixed cards on priorities',
    lms: [
      { badge: 'FI+ETH', name: 'Priority mix flashcards', meta: '30 min · 20 cards · FI, ETH', type: 'Flashcards', ...tb('Flashcards') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'A mix of 20 FI + Ethics flashcards in 30 min. Interleaving (mixing subjects) improves retention by 30% vs single-topic study. Perfect for a productive low-energy session.',
    signals: [
      { label: 'Interleaving +30%', variant: 'teal' },
      { label: 'Dual-topic', variant: 'blue' },
    ],
  },
  20: {
    eyebrow: 'Generated · Flashcards · 20 min',
    title: '5 Flashcards Ethics — Ultra-short',
    subtitle: 'Minimum viable recall session',
    lms: [
      { badge: 'ETH LM01', name: '5 essential Ethics flashcards', meta: '20 min · 5 cards', type: 'Flashcards', ...tb('Flashcards') },
    ],
    whyTitle: 'Why this session',
    whyBody: 'Even 5 flashcards maintain the forgetting curve. This is the minimum viable to not lose ground. Wingman selects the 5 cards closest to being forgotten based on your SRS history.',
    signals: [
      { label: 'Anti-forgetting', variant: 'red' },
      { label: 'Minimum viable', variant: 'amber' },
    ],
  },
}

const MATRICES: Record<Energy, Record<number, SessionData>> = { high: HIGH, mid: MID, low: LOW }
const TIME_KEYS = [120, 90, 60, 45, 30, 20]

export function generateSession(energy: Energy, time: number): SessionData {
  const matrix = MATRICES[energy]
  const key = TIME_KEYS.find(t => t <= time) ?? 20
  return matrix[key]
}
