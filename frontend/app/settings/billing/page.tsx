'use client'

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Billing</h1>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Current Plan</h2>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Active</span>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/15 p-4 mb-4">
          <div className="text-lg font-extrabold text-white">Wingman Pro</div>
          <div className="text-[12px] text-slate-400 mt-1">Full access to all CFA Level I content, AI coaching, and analytics.</div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl font-extrabold text-white">Free</span>
            <span className="text-[12px] text-slate-500">during beta</span>
          </div>
        </div>
        <div className="space-y-2 text-[12px] text-slate-400">
          <div className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 91 Learning Modules</div>
          <div className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> AI-generated study materials</div>
          <div className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Feynman AI Tutor</div>
          <div className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Performance analytics & KPIs</div>
          <div className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Audio synthesis (TTS)</div>
          <div className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Mock exams & QBank</div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <h2 className="text-sm font-bold text-white mb-3">Payment Method</h2>
        <p className="text-[12px] text-slate-500">No payment method required during beta. You will be notified before any charges apply.</p>
      </div>
    </div>
  )
}
