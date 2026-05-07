/**
 * Minimal markdown renderer for the weekly digest.
 *
 * Supports: ## h2, ### h3, **bold**, *italic*, `code`, bullet lists (-, *),
 * numbered lists (1.), blockquotes (>), paragraphs. Pas de lib externe pour
 * éviter d'ajouter une dépendance avant d'avoir validé l'usage.
 */

import { Fragment, ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Order matters: bold (**) before italic (*).
  const tokens: ReactNode[] = []
  let remaining = text
  let i = 0
  // Pattern matches **bold**, *italic*, `code` — first match wins.
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/
  while (remaining.length) {
    const m = re.exec(remaining)
    if (!m) {
      tokens.push(<Fragment key={`${keyPrefix}-t${i}`}>{remaining}</Fragment>)
      break
    }
    if (m.index > 0) tokens.push(<Fragment key={`${keyPrefix}-t${i}`}>{remaining.slice(0, m.index)}</Fragment>)
    if (m[1])      tokens.push(<strong key={`${keyPrefix}-b${i}`} className="text-white font-semibold">{m[2]}</strong>)
    else if (m[3]) tokens.push(<em     key={`${keyPrefix}-i${i}`} className="italic text-slate-300">{m[4]}</em>)
    else if (m[5]) tokens.push(<code   key={`${keyPrefix}-c${i}`} className="px-1 py-0.5 rounded bg-surface-700/60 text-[12px] font-mono text-emerald-300">{m[6]}</code>)
    remaining = remaining.slice(m.index + m[0].length)
    i++
  }
  return tokens
}

export function renderDigestMarkdown(md: string): ReactNode {
  const lines = md.split(/\r?\n/)
  const out: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    // Headings
    if (trimmed.startsWith('### ')) {
      out.push(
        <h3 key={key++} className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400 mt-5 mb-2">
          {renderInline(trimmed.slice(4), `h3-${key}`)}
        </h3>
      )
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      out.push(
        <h2 key={key++} className="text-[15px] font-bold text-emerald-400 mt-6 mb-2 first:mt-0">
          {renderInline(trimmed.slice(3), `h2-${key}`)}
        </h2>
      )
      i++
      continue
    }
    if (trimmed.startsWith('# ')) {
      out.push(
        <h1 key={key++} className="text-[20px] font-bold text-white mt-2 mb-3">
          {renderInline(trimmed.slice(2), `h1-${key}`)}
        </h1>
      )
      i++
      continue
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        buf.push(lines[i].trim().slice(2))
        i++
      }
      out.push(
        <blockquote key={key++} className="border-l-2 border-emerald-500/40 pl-3 my-3 text-slate-300 italic">
          {buf.map((b, j) => <p key={j} className="my-1">{renderInline(b, `bq-${key}-${j}`)}</p>)}
        </blockquote>
      )
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      out.push(
        <ul key={key++} className="list-disc list-outside pl-5 my-2 space-y-1.5">
          {items.map((it, j) => <li key={j}>{renderInline(it, `ul-${key}-${j}`)}</li>)}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      out.push(
        <ol key={key++} className="list-decimal list-outside pl-5 my-2 space-y-1.5">
          {items.map((it, j) => <li key={j}>{renderInline(it, `ol-${key}-${j}`)}</li>)}
        </ol>
      )
      continue
    }

    // Paragraph (collect consecutive non-blank, non-special lines)
    const buf: string[] = [line]
    i++
    while (i < lines.length) {
      const l = lines[i].trim()
      if (!l) break
      if (l.startsWith('## ') || l.startsWith('### ') || l.startsWith('# ') || l.startsWith('> ') || /^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l)) break
      buf.push(lines[i])
      i++
    }
    out.push(
      <p key={key++} className="my-2.5">
        {renderInline(buf.join(' ').trim(), `p-${key}`)}
      </p>
    )
  }

  return <>{out}</>
}
