'use client'

import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  id: string
  email: string
  display_name: string
  provider: string
  is_active: boolean
  last_login_at: string | null
  created_at: string | null
}

export default function AdminUsersPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async (key: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/admin/users?key=${encodeURIComponent(key)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Access denied')
        setAuthenticated(false)
        return
      }
      const data: User[] = await res.json()
      setUsers(data)
      setAuthenticated(true)
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) return
    await fetchUsers(adminKey.trim())
  }

  const toggleActivation = async (userId: string, activate: boolean) => {
    setActionLoading(userId)
    try {
      const endpoint = activate ? 'activate' : 'deactivate'
      const res = await fetch(`${API}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey, user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Action failed')
        return
      }
      // Refresh user list
      await fetchUsers(adminKey)
    } catch {
      setError('Connection error')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (user: User) => {
    const label = `${user.display_name} <${user.email}>`
    if (!window.confirm(`Delete ${label}? This removes this user and their user-scoped data.`)) return
    setActionLoading(user.id)
    setError(null)
    try {
      const res = await fetch(`${API}/api/admin/users/${encodeURIComponent(user.id)}?key=${encodeURIComponent(adminKey)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Delete failed')
        return
      }
      await fetchUsers(adminKey)
    } catch {
      setError('Connection error')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  // Key entry screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              <span className="text-purple-500">Wing</span>man
            </h1>
            <p className="text-sm text-slate-500 mt-2">Admin Panel</p>
          </div>

          <form onSubmit={handleAuth} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Admin Secret Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                placeholder="Enter admin key..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={!adminKey.trim() || loading}
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    )
  }

  // Users management screen
  return (
    <div className="min-h-screen bg-[#0f1117] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="text-purple-500">Wing</span>man Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">User Management</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{users.length} users</span>
            <button
              onClick={() => fetchUsers(adminKey)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Users table */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Provider</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Last Login</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{user.display_name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.provider === 'google'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {user.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-emerald-400">Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="text-amber-400">Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{formatDate(user.last_login_at)}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                      {user.is_active ? (
                        <button
                          onClick={() => toggleActivation(user.id, false)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Deactivate'}
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleActivation(user.id, true)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Activate'}
                        </button>
                      )}
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 border border-white/[0.08] text-slate-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
