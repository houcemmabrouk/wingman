'use client'

/**
 * /inbox — Unified communication inbox (canal de communication transversal).
 *
 * Affiche uniquement la liste Inbox (actions NBA, alerts, disputes, coach
 * proactive, SRS due). Pas de hero NBA / System Diagnostic / Recall Prompt —
 * ces blocs vivent sur /nba qui est la "fiche action" focalisée.
 */

import InboxView from '@/components/inbox/InboxView'

export default function InboxPage() {
  return (
    <div className="space-y-4 max-w-[1100px]">
      <InboxView />
    </div>
  )
}
