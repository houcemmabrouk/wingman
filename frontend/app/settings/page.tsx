'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [examDate, setExamDate] = useState('')
  const [dailyGoal, setDailyGoal] = useState(90)
  const [sessionDuration, setSessionDuration] = useState(45)
  const [coachIntensity, setCoachIntensity] = useState('medium')
  const [saved, setSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wingman_onboarding')
      if (raw) {
        const d = JSON.parse(raw)
        if (d.exam_date) setExamDate(d.exam_date)
        if (d.session_duration_min) setSessionDuration(d.session_duration_min)
        if (d.hours_per_week) setDailyGoal(Math.round(d.hours_per_week * 60 / 7))
      }
    } catch {}
  }, [])

  const handleSave = () => {
    try {
      const raw = localStorage.getItem('wingman_onboarding')
      const ob = raw ? JSON.parse(raw) : {}
      ob.exam_date = examDate
      ob.session_duration_min = sessionDuration
      ob.hours_per_week = Math.round(dailyGoal * 7 / 60)
      localStorage.setItem('wingman_onboarding', JSON.stringify(ob))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }

  const initials = (user?.display_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const changePassword = async () => {
    setPasswordStatus(null)
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setPasswordSubmitting(true)
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPasswordStatus({ type: 'error', text: data.detail || 'Password change failed.' })
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus({ type: 'ok', text: 'Password updated.' })
    } catch {
      setPasswordStatus({ type: 'error', text: 'Connection error.' })
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Profile</h1>

      {/* Identity */}
      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-400">{initials}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{user?.display_name || 'User'}</div>
            <div className="text-[12px] text-slate-500">{user?.email || ''}</div>
            <div className="text-[10px] text-slate-600 font-mono mt-0.5">{user?.user_id || ''}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Provider</div>
            <div className="text-[13px] font-semibold text-white mt-1">{user?.provider || 'Email'}</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Plan</div>
            <div className="text-[13px] font-semibold text-white mt-1">CFA Level I</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Status</div>
            <div className="text-[13px] font-semibold text-emerald-400 mt-1">Active</div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Security</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1a2540', border: '1px solid #2a3560' }}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1a2540', border: '1px solid #2a3560' }}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1a2540', border: '1px solid #2a3560' }}
            />
          </div>
        </div>
        {passwordStatus && (
          <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            passwordStatus.type === 'ok'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/20 bg-red-500/10 text-red-300'
          }`}>
            {passwordStatus.text}
          </div>
        )}
        <button
          onClick={changePassword}
          disabled={!currentPassword || !newPassword || !confirmPassword || passwordSubmitting}
          className="w-full mt-5 py-3 rounded-xl text-sm font-bold bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {passwordSubmitting ? 'Updating...' : 'Change Password'}
        </button>
      </div>

      {/* Study Settings */}
      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Study Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Exam Date</label>
            <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1a2540', border: '1px solid #2a3560' }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Daily Study Goal (minutes)</label>
            <div className="flex gap-2">
              {[30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => setDailyGoal(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dailyGoal === m ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                  }`}>{m}m</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Default Session Duration</label>
            <div className="flex gap-2">
              {[25, 30, 45, 60, 75].map(m => (
                <button key={m} onClick={() => setSessionDuration(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sessionDuration === m ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                  }`}>{m}m</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Coach Intensity</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(l => (
                <button key={l} onClick={() => setCoachIntensity(l)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    coachIntensity === l ? 'bg-purple-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleSave}
          className={`w-full mt-5 py-3 rounded-xl text-sm font-bold transition-all ${
            saved ? 'bg-emerald-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Question Bank Generator moved to /data — single source of truth */}

      {/* Danger Zone */}
      <div className="rounded-2xl bg-surface-800/60 border border-red-500/10 p-5">
        <h2 className="text-sm font-bold text-red-400 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <button onClick={() => { localStorage.clear(); window.location.reload() }}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-white/[0.06]">
            Reset All Local Data
          </button>
          <button onClick={logout}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-white/[0.06]">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
