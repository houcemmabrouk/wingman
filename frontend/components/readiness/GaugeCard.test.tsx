import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import GaugeCard from './GaugeCard'
import { STATUS_STYLES } from './status'

afterEach(() => { cleanup() })

describe('GaugeCard', () => {
  it('renders the critical state: red accent + French label', () => {
    render(
      <GaugeCard
        title="Global Retention"
        value={12.3}
        target={70}
        status="critical"
      />,
    )
    expect(screen.getByText('Global Retention')).toBeInTheDocument()
    // Label is the French status copy pulled from STATUS_STYLES
    expect(screen.getByText(STATUS_STYLES.critical.label)).toBeInTheDocument()
    // 1-decimal formatting per spec
    expect(screen.getByText('12.3%')).toBeInTheDocument()
    // Accent color surfaced in inline style
    const value = screen.getByText('12.3%')
    expect(value.getAttribute('style')).toContain(STATUS_STYLES.critical.color)
  })

  it('renders the building state with amber/yellow accent and value', () => {
    render(
      <GaugeCard
        title="Exam Readiness"
        value={48}
        target={70}
        status="building"
      />,
    )
    expect(screen.getByText(STATUS_STYLES.building.label)).toBeInTheDocument()
    expect(screen.getByText('48%')).toBeInTheDocument()  // whole number, no trailing decimal
    const value = screen.getByText('48%')
    expect(value.getAttribute('style')).toContain(STATUS_STYLES.building.color)
  })

  it('renders the ready state with teal accent', () => {
    render(
      <GaugeCard
        title="Coverage"
        value={82.5}
        target={70}
        status="ready"
        subtitle="48 / 93 LMs étudiés."
      />,
    )
    expect(screen.getByText(STATUS_STYLES.ready.label)).toBeInTheDocument()
    expect(screen.getByText('82.5%')).toBeInTheDocument()
    expect(screen.getByText(/48 \/ 93 LMs/)).toBeInTheDocument()
    const value = screen.getByText('82.5%')
    expect(value.getAttribute('style')).toContain(STATUS_STYLES.ready.color)
  })

  it('clamps negative and >100 values', () => {
    const { rerender } = render(
      <GaugeCard title="X" value={-10} status="critical" />,
    )
    // Negative clamps to 0; fmtPct rounds to whole number (no decimals)
    expect(screen.getByText('0%')).toBeInTheDocument()

    rerender(<GaugeCard title="X" value={140} status="excellent" />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
