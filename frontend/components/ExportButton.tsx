'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/performance/export`, { credentials: 'include' })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'wingman_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Export failed')
    }
    setLoading(false)
  }

  return (
    <button onClick={handleExport} disabled={loading} className="btn-ghost">
      {loading ? 'Export...' : 'Exporter CSV'}
    </button>
  )
}
