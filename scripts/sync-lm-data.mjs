#!/usr/bin/env node
// Regenerate frontend/lib/lm-data.ts LM_DATA from /api/admin/modules (live DB).
// Keeps the hardcoded TS list in sync with the database — prevents drift like
// the EQU-04 module that was missing from the TS but present in DB.
//
// Run BEFORE `docker compose build frontend`:
//   node scripts/sync-lm-data.mjs
// or via npm:
//   cd frontend && npm run sync-lms
//
// Env:
//   WINGMAN_API  — backend base URL (default http://localhost:8000)

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(__dirname, '..', 'frontend', 'lib', 'lm-data.ts')
const API = process.env.WINGMAN_API || 'http://localhost:8000'
const TOPIC_ORDER = ['ETH','QM','ECO','FSA','CORP','EQU','FI','DER','ALT','PM']

const res = await fetch(`${API}/api/admin/modules`)
if (!res.ok) {
  console.error(`✗ ${API}/api/admin/modules → ${res.status}`)
  process.exit(1)
}
const modules = await res.json()

// Group by topic, in TOPIC_ORDER. /api/admin/modules already orders by sort_order.
const byTopic = new Map(TOPIC_ORDER.map(t => [t, []]))
for (const m of modules) {
  const arr = byTopic.get(m.topic_code)
  if (arr) arr.push(m)
}

const escape = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const lines = []
for (const topic of TOPIC_ORDER) {
  for (const m of byTopic.get(topic)) {
    const num = m.code.split('-')[1]
    if (!/^\d+$/.test(num)) {
      console.error(`✗ malformed module code: ${m.code}`)
      process.exit(1)
    }
    const lmCode = `LM${num.padStart(2, '0')}`
    lines.push(`  ['${topic}','${lmCode}','${escape(m.title)}'],`)
  }
}

const original = readFileSync(FILE, 'utf-8')
const START = 'export const LM_DATA: [string, string, string][] = ['
const startIdx = original.indexOf(START)
if (startIdx === -1) {
  console.error(`✗ LM_DATA marker not found in ${FILE}`)
  process.exit(1)
}
const afterStart = startIdx + START.length
const closeIdx = original.indexOf('\n]', afterStart)
if (closeIdx === -1) {
  console.error(`✗ LM_DATA closing bracket not found`)
  process.exit(1)
}

const replacement = `${START}\n${lines.join('\n')}\n]`
const updated = original.slice(0, startIdx) + replacement + original.slice(closeIdx + 2)

if (updated === original) {
  console.log(`✓ ${modules.length} modules — already in sync`)
} else {
  writeFileSync(FILE, updated)
  const before = (original.match(/^  \['/gm) || []).length
  console.log(`✓ synced ${modules.length} modules (was ${before}) → ${FILE}`)
}
