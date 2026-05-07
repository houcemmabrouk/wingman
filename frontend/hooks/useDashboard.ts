'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchDashboard } from '@/lib/dashboardApi'
import type { DashboardData } from '@/lib/types'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      let uid = '00000000-0000-0000-0000-000000000001'
      try { const u = localStorage.getItem('wingman_user'); if (u) uid = JSON.parse(u).user_id || uid } catch {}
      const result = await fetchDashboard(uid)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh])

  return { data, loading, error, refresh }
}
