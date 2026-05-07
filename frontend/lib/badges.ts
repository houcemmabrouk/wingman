// ── Badge System - Wingman CFA ──────────────────────────────

export type BadgeCategory = 'consistency' | 'mastery' | 'combat' | 'score' | 'intelligence' | 'focus' | 'exploration' | 'identity' | 'exam' | 'hidden'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface Badge {
  id: string
  name: string
  trigger: string
  category: BadgeCategory
  rarity: BadgeRarity
  icon: string
  xp_reward: number
  evolution_next?: string
  unlocked?: boolean
  unlocked_at?: string
}

export interface RarityStyle {
  bg: string
  border: string
  text: string
  glow: string
}

export const RARITY_STYLES: Record<BadgeRarity, RarityStyle> = {
  common:    { bg: '#374151', border: '#4B5563', text: '#9CA3AF', glow: 'none' },
  rare:      { bg: '#1e3a5f', border: '#3b82f6', text: '#60a5fa', glow: '0 0 12px rgba(59,130,246,0.3)' },
  epic:      { bg: '#2d1b69', border: '#8b5cf6', text: '#a78bfa', glow: '0 0 16px rgba(139,92,246,0.4)' },
  legendary: { bg: '#422006', border: '#f59e0b', text: '#fbbf24', glow: '0 0 20px rgba(245,158,11,0.4)' },
  mythic:    { bg: '#0a0a0a', border: '#ec4899', text: '#f472b6', glow: '0 0 24px rgba(236,72,153,0.5), 0 0 48px rgba(236,72,153,0.2)' },
}

export const RARITY_ORDER: BadgeRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic']

export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  consistency: 'Consistency',
  mastery: 'Mastery',
  combat: 'Combat',
  score: 'Score',
  intelligence: 'Intelligence',
  focus: 'Focus',
  exploration: 'Exploration',
  identity: 'Identity',
  exam: 'Exam',
  hidden: 'Hidden',
}

// ── SVG Icon Paths ──────────────────────────────────────────
// Each icon is an SVG path for a 24x24 viewBox

export const BADGE_ICONS: Record<string, string> = {
  // Consistency - lightning bolt variants
  'first-strike':       'M13 10V3L4 14h7v7l9-11h-7z',
  'streak-initiate':    'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  'iron-discipline':    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  'unbreakable':        'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'machine':            'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',

  // Mastery - building blocks
  'builder':            'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  'architect':          'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  'master-builder':     'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',

  // Combat - sword/shield
  'first-blood':        'M15 5l-2 2m0 0l-2 2m2-2l2 2m-2-2l-2-2m5.657 10.657L12 20.485l-5.657-2.828a8 8 0 1111.314 0z',
  'warrior':            'M3 7v4a1 1 0 001 1h3l2 3 2-3h3a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1zm6 10l3 4 3-4M12 3v4',
  'gladiator':          'M6 18L18 6M6 6l12 12M12 2v4m0 12v4M2 12h4m12 0h4',

  // Score - target
  'competent':          'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'elite':              'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  'sniper':             'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V3m0 18v-5m-9-4H8m13 0h-5M5.636 5.636l3.536 3.536m5.656 5.656l3.536 3.536M5.636 18.364l3.536-3.536m5.656-5.656l3.536-3.536',

  // Intelligence - brain
  'self-aware':         'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  'error-hunter':       'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  'error-assassin':     'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',

  // Focus - meditation
  'monk':               'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  'zen-master':         'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',

  // Exploration - compass
  'explorer':           'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  'generalist':         'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',

  // Identity - crown
  'top-tier':           'M5 3l3.057 6.114L12 3l3.943 6.114L19 3v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3z',
  'apex':               'M12 2l2.09 6.26L20.18 9.27l-4.64 4.53L16.54 20 12 16.9 7.46 20l1-6.2-4.64-4.53 6.09-1.01L12 2z',

  // Exam - scroll/document
  'survivor':           'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'battle-tested':      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  'exam-slayer':        'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',

  // Hidden - mystery
  '5am-club':           'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  'overdrive':          'M13 10V3L4 14h7v7l9-11h-7z',
  'comeback':           'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'phoenix':            'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  'war-mode':           'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
}

// ── Badge Definitions ───────────────────────────────────────

const ALL_BADGES: Badge[] = [
  // Consistency
  { id: 'first-strike',     name: 'First Strike',     trigger: 'Complete 1 learning module',       category: 'consistency', rarity: 'common',    icon: 'first-strike',     xp_reward: 50,   evolution_next: 'streak-initiate' },
  { id: 'streak-initiate',  name: 'Streak Initiate',  trigger: '3-day study streak',               category: 'consistency', rarity: 'common',    icon: 'streak-initiate',  xp_reward: 100,  evolution_next: 'iron-discipline' },
  { id: 'iron-discipline',  name: 'Iron Discipline',  trigger: '7-day study streak',               category: 'consistency', rarity: 'rare',      icon: 'iron-discipline',  xp_reward: 250,  evolution_next: 'unbreakable' },
  { id: 'unbreakable',      name: 'Unbreakable',      trigger: '14-day study streak',              category: 'consistency', rarity: 'epic',      icon: 'unbreakable',      xp_reward: 500,  evolution_next: 'machine' },
  { id: 'machine',          name: 'Machine',          trigger: '30-day study streak',              category: 'consistency', rarity: 'legendary', icon: 'machine',          xp_reward: 1000 },

  // Mastery
  { id: 'builder',          name: 'Builder',          trigger: 'Complete 5 learning modules',      category: 'mastery',     rarity: 'common',    icon: 'builder',          xp_reward: 100,  evolution_next: 'architect' },
  { id: 'architect',        name: 'Architect',        trigger: 'Complete 10 learning modules',     category: 'mastery',     rarity: 'rare',      icon: 'architect',        xp_reward: 300,  evolution_next: 'master-builder' },
  { id: 'master-builder',   name: 'Master Builder',   trigger: 'Complete 25 learning modules',     category: 'mastery',     rarity: 'epic',      icon: 'master-builder',   xp_reward: 750 },

  // Combat
  { id: 'first-blood',      name: 'First Blood',      trigger: 'Complete 1 QBank session',         category: 'combat',      rarity: 'common',    icon: 'first-blood',      xp_reward: 50,   evolution_next: 'warrior' },
  { id: 'warrior',          name: 'Warrior',          trigger: 'Complete 10 QBank sessions',       category: 'combat',      rarity: 'rare',      icon: 'warrior',          xp_reward: 300,  evolution_next: 'gladiator' },
  { id: 'gladiator',        name: 'Gladiator',        trigger: 'Complete 50 QBank sessions',       category: 'combat',      rarity: 'legendary', icon: 'gladiator',        xp_reward: 1000 },

  // Score
  { id: 'competent',        name: 'Competent',        trigger: 'Score above 70% on a session',     category: 'score',       rarity: 'common',    icon: 'competent',        xp_reward: 100,  evolution_next: 'elite' },
  { id: 'elite',            name: 'Elite',            trigger: 'Score above 85% on a session',     category: 'score',       rarity: 'rare',      icon: 'elite',            xp_reward: 300,  evolution_next: 'sniper' },
  { id: 'sniper',           name: 'Sniper',           trigger: 'Score above 90% on a session',     category: 'score',       rarity: 'epic',      icon: 'sniper',           xp_reward: 500 },

  // Intelligence
  { id: 'self-aware',       name: 'Self-Aware',       trigger: 'Correct 1 error in review',        category: 'intelligence', rarity: 'common',   icon: 'self-aware',       xp_reward: 50,   evolution_next: 'error-hunter' },
  { id: 'error-hunter',     name: 'Error Hunter',     trigger: 'Correct 50 errors in review',      category: 'intelligence', rarity: 'rare',     icon: 'error-hunter',     xp_reward: 400,  evolution_next: 'error-assassin' },
  { id: 'error-assassin',   name: 'Error Assassin',   trigger: 'Correct 100 errors in review',     category: 'intelligence', rarity: 'epic',     icon: 'error-assassin',   xp_reward: 750 },

  // Focus
  { id: 'monk',             name: 'Monk',             trigger: '2-hour deep focus session',        category: 'focus',       rarity: 'rare',      icon: 'monk',             xp_reward: 300,  evolution_next: 'zen-master' },
  { id: 'zen-master',       name: 'Zen Master',       trigger: '10 deep focus sessions',           category: 'focus',       rarity: 'epic',      icon: 'zen-master',       xp_reward: 750 },

  // Exploration
  { id: 'explorer',         name: 'Explorer',         trigger: 'Study 5 different topics',         category: 'exploration', rarity: 'rare',      icon: 'explorer',         xp_reward: 300,  evolution_next: 'generalist' },
  { id: 'generalist',       name: 'Generalist',       trigger: 'Study all 10 CFA topics',          category: 'exploration', rarity: 'epic',      icon: 'generalist',       xp_reward: 750 },

  // Identity
  { id: 'top-tier',         name: 'Top Tier',         trigger: 'Reach top 10% globally',           category: 'identity',    rarity: 'legendary', icon: 'top-tier',         xp_reward: 1000, evolution_next: 'apex' },
  { id: 'apex',             name: 'Apex',             trigger: 'Reach top 1% globally',            category: 'identity',    rarity: 'mythic',    icon: 'apex',             xp_reward: 2000 },

  // Exam
  { id: 'survivor',         name: 'Survivor',         trigger: 'Complete 1 mock exam',             category: 'exam',        rarity: 'rare',      icon: 'survivor',         xp_reward: 300,  evolution_next: 'battle-tested' },
  { id: 'battle-tested',    name: 'Battle Tested',    trigger: 'Complete 3 mock exams',            category: 'exam',        rarity: 'epic',      icon: 'battle-tested',    xp_reward: 500,  evolution_next: 'exam-slayer' },
  { id: 'exam-slayer',      name: 'Exam Slayer',      trigger: 'Pass 5 mock exams',                category: 'exam',        rarity: 'legendary', icon: 'exam-slayer',      xp_reward: 1000 },

  // Hidden
  { id: '5am-club',         name: '5AM Club',         trigger: 'Study at 5 AM',                    category: 'hidden',      rarity: 'epic',      icon: '5am-club',         xp_reward: 500 },
  { id: 'overdrive',        name: 'Overdrive',        trigger: '3 study sessions in one day',      category: 'hidden',      rarity: 'rare',      icon: 'overdrive',        xp_reward: 250 },
  { id: 'comeback',         name: 'Comeback',         trigger: 'Return after 3+ days off',         category: 'hidden',      rarity: 'rare',      icon: 'comeback',         xp_reward: 250 },
  { id: 'phoenix',          name: 'Phoenix',          trigger: 'Review a forgotten learning module', category: 'hidden',    rarity: 'rare',      icon: 'phoenix',          xp_reward: 250 },
  { id: 'war-mode',         name: 'War Mode',         trigger: '7-day streak + 10 QBank + 3h focus', category: 'hidden',   rarity: 'mythic',    icon: 'war-mode',         xp_reward: 2000 },
]

// ── Storage Keys ────────────────────────────────────────────

const BADGES_KEY = 'wingman_badges'
const STREAK_KEY = 'wingman_streak'

// ── Helper: safe localStorage access ────────────────────────

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}

// ── Badge Functions ─────────────────────────────────────────

export function getBadges(): Badge[] {
  return ALL_BADGES.map(b => ({ ...b }))
}

export interface UnlockedBadge {
  id: string
  unlocked_at: string
}

export function getUnlockedBadges(): UnlockedBadge[] {
  return getStorage<UnlockedBadge[]>(BADGES_KEY, [])
}

export function unlockBadge(id: string): Badge | null {
  const badge = ALL_BADGES.find(b => b.id === id)
  if (!badge) return null

  const unlocked = getUnlockedBadges()
  if (unlocked.find(u => u.id === id)) {
    // Already unlocked - return badge with status
    return { ...badge, unlocked: true, unlocked_at: unlocked.find(u => u.id === id)!.unlocked_at }
  }

  const entry: UnlockedBadge = { id, unlocked_at: new Date().toISOString() }
  unlocked.push(entry)
  setStorage(BADGES_KEY, unlocked)

  return { ...badge, unlocked: true, unlocked_at: entry.unlocked_at }
}

export function getBadgesWithStatus(): Badge[] {
  const unlocked = getUnlockedBadges()
  const unlockedMap = new Map(unlocked.map(u => [u.id, u.unlocked_at]))

  return ALL_BADGES.map(b => ({
    ...b,
    unlocked: unlockedMap.has(b.id),
    unlocked_at: unlockedMap.get(b.id),
  }))
}

export function getRecentlyUnlockedBadges(count: number = 3): Badge[] {
  const unlocked = getUnlockedBadges()
  const sorted = [...unlocked].sort((a, b) =>
    new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
  )
  const recent = sorted.slice(0, count)
  const mapped: Badge[] = []
  for (const u of recent) {
    const def = ALL_BADGES.find(b => b.id === u.id)
    if (def) mapped.push({ ...def, unlocked: true, unlocked_at: u.unlocked_at })
  }
  return mapped
}

export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return ALL_BADGES.filter(b => b.rarity === rarity)
}

export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return ALL_BADGES.filter(b => b.category === category)
}

export function getTotalXP(): number {
  const unlocked = getUnlockedBadges()
  return unlocked.reduce((sum, u) => {
    const badge = ALL_BADGES.find(b => b.id === u.id)
    return sum + (badge?.xp_reward ?? 0)
  }, 0)
}

export function getEvolutionChain(badgeId: string): Badge[] {
  const chain: Badge[] = []
  // Find the root of the chain
  let current = ALL_BADGES.find(b => b.id === badgeId)
  if (!current) return chain

  // Walk back to find the root
  let root = current
  let found = true
  while (found) {
    found = false
    const parent = ALL_BADGES.find(b => b.evolution_next === root.id)
    if (parent) {
      root = parent
      found = true
    }
  }

  // Walk forward from root
  let node: Badge | undefined = root
  while (node) {
    chain.push({ ...node })
    node = node.evolution_next ? ALL_BADGES.find(b => b.id === node!.evolution_next) : undefined
  }

  return chain
}

// ── Streak Functions ────────────────────────────────────────

export interface StreakEntry {
  date: string // YYYY-MM-DD
}

export function getStreakData(): StreakEntry[] {
  return getStorage<StreakEntry[]>(STREAK_KEY, [])
}

export function recordSession(date?: string): StreakEntry[] {
  const today = date || new Date().toISOString().split('T')[0]
  const data = getStreakData()

  if (!data.find(d => d.date === today)) {
    data.push({ date: today })
    setStorage(STREAK_KEY, data)
  }

  return data
}

export function getCurrentStreak(): number {
  const data = getStreakData()
  if (data.length === 0) return 0

  const dates = data.map(d => d.date).sort().reverse()
  const today = new Date().toISOString().split('T')[0]

  // Check if today or yesterday is in the streak
  const todayDate = new Date(today)
  let checkDate = today

  // If today isn't in the list, check if yesterday is (streak not yet broken)
  if (!dates.includes(today)) {
    const yesterday = new Date(todayDate)
    yesterday.setDate(yesterday.getDate() - 1)
    checkDate = yesterday.toISOString().split('T')[0]
    if (!dates.includes(checkDate)) return 0
  }

  let streak = 1
  let current = new Date(checkDate)

  for (let i = 1; i < 365; i++) {
    const prev = new Date(current)
    prev.setDate(prev.getDate() - 1)
    const prevStr = prev.toISOString().split('T')[0]
    if (dates.includes(prevStr)) {
      streak++
      current = prev
    } else {
      break
    }
  }

  return streak
}

export function getLast7DaysStatus(): { date: string; active: boolean; dayLabel: string }[] {
  const data = getStreakData()
  const dateSet = new Set(data.map(d => d.date))
  const dayLabels = ['D', 'L', 'M', 'Me', 'J', 'V', 'S']
  const result: { date: string; active: boolean; dayLabel: string }[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayIndex = d.getDay() // 0=Sunday
    result.push({
      date: dateStr,
      active: dateSet.has(dateStr),
      dayLabel: dayLabels[dayIndex],
    })
  }

  return result
}

// ── Demo: Seed default unlocked badges ──────────────────────

export function seedDemoBadges(): void {
  const existing = getUnlockedBadges()
  if (existing.length > 0) return // already seeded

  const demoIds = ['first-strike', 'streak-initiate', 'first-blood']
  const now = new Date()
  const entries: UnlockedBadge[] = demoIds.map((id, i) => ({
    id,
    unlocked_at: new Date(now.getTime() - (demoIds.length - i) * 86400000).toISOString(),
  }))

  setStorage(BADGES_KEY, entries)

  // Also seed some streak data for demo
  const streakData: StreakEntry[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    streakData.push({ date: d.toISOString().split('T')[0] })
  }
  const existingStreak = getStreakData()
  if (existingStreak.length === 0) {
    setStorage(STREAK_KEY, streakData)
  }
}
