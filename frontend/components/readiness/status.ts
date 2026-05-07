// Shared status → color + French label mapping.
// Backend `assess_readiness` already returns the correct status + message;
// the frontend only maps status → color and renders the copy as-is.

export type ReadinessStatus =
  | 'critical'
  | 'behind'
  | 'building'
  | 'approaching'
  | 'ready'
  | 'excellent'

export interface StatusStyle {
  color: string       // main text/accent
  bg: string          // tinted background for cards + pills
  border: string      // border at same hue, low alpha
  label: string       // French label for UI
  glow?: string       // optional box-shadow (used by "excellent")
}

export const STATUS_STYLES: Record<ReadinessStatus, StatusStyle> = {
  critical:    { color: '#ff4d4d', bg: 'rgba(255,77,77,.08)',  border: 'rgba(255,77,77,.30)',  label: 'Critical' },
  behind:      { color: '#ff8c42', bg: 'rgba(255,140,66,.08)', border: 'rgba(255,140,66,.30)', label: 'Behind' },
  building:    { color: '#ffc845', bg: 'rgba(255,200,69,.08)', border: 'rgba(255,200,69,.30)', label: 'Building' },
  approaching: { color: '#9be15d', bg: 'rgba(155,225,93,.08)', border: 'rgba(155,225,93,.30)', label: 'Approaching target' },
  ready:       { color: '#00e0b8', bg: 'rgba(0,224,184,.08)',  border: 'rgba(0,224,184,.30)',  label: 'Ready' },
  excellent:   { color: '#00e0b8', bg: 'rgba(0,224,184,.10)',  border: 'rgba(0,224,184,.45)',  label: 'Excellent', glow: '0 0 24px rgba(0,224,184,.45)' },
}

export function styleFor(status: string | undefined): StatusStyle {
  const key = (status as ReadinessStatus) || 'building'
  return STATUS_STYLES[key] ?? STATUS_STYLES.building
}

/** Round to at most 1 decimal, strip trailing zero. */
export function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  const rounded = Math.round(n * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}
