'use client'

import { useEffect, useRef, ReactNode, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'

// ── MODAL COMPONENT ────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Prevent closing on overlay click */
  persistent?: boolean
  /** Override the panel wrapper classes (default caps width at max-w-md).
   *  Pass e.g. "w-full max-w-[560px] max-h-[90vh]" for a wider/taller modal.
   */
  panelClassName?: string
}

export function Modal({ open, onClose, children, persistent, panelClassName }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Mount-once flag so SSR doesn't try to portal to a missing document.body.
  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, persistent])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || !mounted) return null

  // Portal to document.body so the modal escapes any ancestor with
  // transform / filter / backdrop-filter (which would otherwise become the
  // containing block for our `fixed inset-0` overlay — Topbar uses backdrop-blur).
  return createPortal(
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current && !persistent) onClose() }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'modalOverlayIn 200ms ease-out' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel — clamp to viewport so contents never spill above/below.
          The outer flex container already has p-4, so max-h: calc(100vh - 2rem) keeps a tight margin. */}
      <div
        ref={panelRef}
        className={`relative z-10 max-h-[calc(100vh-2rem)] flex flex-col ${panelClassName ?? 'w-full max-w-md'}`}
        style={{ animation: 'modalPanelIn 250ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {children}
      </div>

      <style jsx global>{`
        @keyframes modalOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPanelIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  )
}

// ── MODAL CARD (styled panel) ──────────────────────────────
// flex-1 + min-h-0 makes the card fill the height-clamped panel and lets its
// own flex children (header / scrollable body / footer) lay out correctly.
export function ModalCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex-1 min-h-0 flex flex-col bg-[#1a1a2e] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

// ── ALERT MODAL ────────────────────────────────────────────
type AlertType = 'success' | 'error' | 'warning' | 'info'

const ALERT_STYLES: Record<AlertType, { icon: ReactNode; color: string; bg: string }> = {
  success: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
  },
  error: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  warning: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  info: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
  },
}

interface AlertModalProps {
  open: boolean
  onClose: () => void
  type?: AlertType
  title: string
  message: string
  buttonLabel?: string
}

export function AlertModal({ open, onClose, type = 'info', title, message, buttonLabel = 'OK' }: AlertModalProps) {
  const style = ALERT_STYLES[type]
  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard>
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: style.bg, color: style.color }}>
              {style.icon}
            </div>
          </div>
          {/* Title */}
          <h3 className="text-[15px] font-bold text-white text-center mb-2">{title}</h3>
          {/* Message */}
          <p className="text-[13px] text-slate-400 text-center leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        {/* Action */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: style.color }}
          >
            {buttonLabel}
          </button>
        </div>
      </ModalCard>
    </Modal>
  )
}

// ── CONFIRM MODAL ──────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  type?: 'danger' | 'warning' | 'info'
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

const CONFIRM_COLORS: Record<string, string> = {
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
}

const CONFIRM_ICONS: Record<string, ReactNode> = {
  danger: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
}

export function ConfirmModal({
  open, onClose, onConfirm, type = 'danger', title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
}: ConfirmModalProps) {
  const color = CONFIRM_COLORS[type]
  const icon = CONFIRM_ICONS[type]

  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard>
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: `${color}18`, color }}
            >
              {icon}
            </div>
          </div>
          {/* Title */}
          <h3 className="text-[15px] font-bold text-white text-center mb-2">{title}</h3>
          {/* Message */}
          <p className="text-[13px] text-slate-400 text-center leading-relaxed">{message}</p>
        </div>
        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: color }}
          >
            {confirmLabel}
          </button>
        </div>
      </ModalCard>
    </Modal>
  )
}

// ── TOAST SYSTEM ───────────────────────────────────────────
import { createContext, useContext } from 'react'

interface Toast {
  id: number
  type: AlertType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toast: (type: AlertType, title: string, message?: string, duration?: number) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let _toastIdCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: AlertType, title: string, message?: string, duration = 4000) => {
    const id = ++_toastIdCounter
    setToasts(prev => [...prev, { id, type, title, message, duration }])
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ctx: ToastContextType = {
    toast: addToast,
    success: (t, m) => addToast('success', t, m),
    error: (t, m) => addToast('error', t, m, 6000),
    warning: (t, m) => addToast('warning', t, m, 5000),
    info: (t, m) => addToast('info', t, m),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        {toasts.map(t => {
          const s = ALERT_STYLES[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto rounded-xl border shadow-xl shadow-black/30 overflow-hidden"
              style={{
                background: '#1a1a2e',
                borderColor: `${s.color}30`,
                animation: 'toastSlideIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex items-start gap-3 p-3.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[12px] font-semibold text-white leading-tight">{t.title}</div>
                  {t.message && <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.message}</div>}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Progress bar */}
              {t.duration && t.duration > 0 && (
                <div className="h-[2px] w-full" style={{ background: `${s.color}20` }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: s.color,
                      animation: `toastProgress ${t.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
