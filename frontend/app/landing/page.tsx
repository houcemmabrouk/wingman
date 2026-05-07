'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ background: '#060915', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#f5f7ff' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5">
        <div className="text-xl font-extrabold tracking-tight">
          <span style={{ color: '#6c8cff' }}>Wing</span>man
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition">Pricing</Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition" style={{ background: '#6c8cff' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 md:px-16 pt-16 md:pt-24 pb-20">
        <div className="absolute top-0 left-[15%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(108,140,255,.4), transparent 60%)' }} />
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(0,224,184,.3), transparent 60%)' }} />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-6" style={{ background: 'rgba(108,140,255,.1)', border: '1px solid rgba(108,140,255,.2)', color: '#a0b4ff' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CFA Level I — 2025 Curriculum
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6" style={{ letterSpacing: '-.03em' }}>
            Your AI-Powered<br />
            <span style={{ color: '#6c8cff' }}>CFA Study Copilot</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-8 max-w-xl">
            Wingman generates personalized study sessions, tracks your mastery at the LOS level,
            and coaches you with AI — so you study smarter, not harder.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="px-6 py-3.5 rounded-xl text-[15px] font-bold text-white transition hover:brightness-110" style={{ background: '#6c8cff' }}>
              Start Studying Free
            </Link>
            <Link href="/pricing" className="px-6 py-3.5 rounded-xl text-[15px] font-semibold transition hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#f5f7ff' }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 md:px-16 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
          {[
            { value: '91', label: 'Learning Modules' },
            { value: '611+', label: 'QBank Questions' },
            { value: '494', label: 'Flashcards' },
            { value: '10', label: 'CFA Topics' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-[12px] text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-16 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Everything you need to pass</h2>
        <p className="text-slate-400 mb-10 max-w-lg">One platform. AI-generated content. Adaptive learning. Real analytics.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'AI Session Generator', desc: 'Pick your energy and time. Wingman builds the optimal session from 18 combinations.', color: '#6c8cff' },
            { title: 'Mastery Tracking', desc: 'Track progress at the topic, module, and LOS level. Know exactly where you stand.', color: '#00e0b8' },
            { title: 'Smart QBank', desc: '611+ calibrated questions with concept tags, error analysis, and adaptive difficulty.', color: '#f59e0b' },
            { title: 'Feynman AI Tutor', desc: 'Explain concepts, get quizzed, receive real-time feedback from your AI coach.', color: '#8b5cf6' },
            { title: 'Content Library', desc: 'AI-generated summaries, LOS sheets, flashcards, audio, and exam traps for every module.', color: '#ef4444' },
            { title: 'Performance Analytics', desc: 'Mastery Score, Readiness Score, weak areas, coach effectiveness — all from real data.', color: '#06b6d4' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl p-5" style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="w-2 h-2 rounded-full mb-3" style={{ background: f.color }} />
              <h3 className="text-[15px] font-bold text-white mb-2">{f.title}</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-16 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-10">How Wingman works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          {[
            { step: '01', title: 'Tell Wingman how you feel', desc: 'Select your energy level (high, mid, low) and available time (20 min to 2h+).' },
            { step: '02', title: 'Get your personalized session', desc: 'Wingman picks the optimal modules, session type, and materials based on your mastery gaps.' },
            { step: '03', title: 'Study, quiz, improve', desc: 'Complete QCMs, review flashcards, listen to audio. Your mastery updates in real time.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <div className="text-3xl font-extrabold shrink-0" style={{ color: '#6c8cff' }}>{s.step}</div>
              <div>
                <h3 className="text-[14px] font-bold text-white mb-1.5">{s.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-16 py-20">
        <div className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(108,140,255,.15), rgba(0,224,184,.08))', border: '1px solid rgba(108,140,255,.12)' }}>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to pass CFA Level I?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">Join Wingman and let AI optimize your study plan.</p>
          <Link href="/login" className="inline-block px-8 py-4 rounded-xl text-[16px] font-bold text-white transition hover:brightness-110" style={{ background: '#6c8cff' }}>
            Start Free — No Credit Card
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">&copy; 2025 Wingman by Veridis. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/login" className="hover:text-white transition">Login</Link>
            <a href="mailto:contact@veridis.shop" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
