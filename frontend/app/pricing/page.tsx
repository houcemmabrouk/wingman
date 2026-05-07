'use client'

import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Get started with the essentials.',
    features: [
      '10 QBank questions per topic',
      'Basic mastery tracking',
      'Study plan generator',
      'Pomodoro timer',
      '3 content generations per day',
    ],
    cta: 'Start Free',
    accent: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'Full power. Unlimited everything.',
    features: [
      'Unlimited QBank + Mock Exams',
      'Full LOS-level mastery tracking',
      'AI Feynman Tutor (unlimited)',
      'Unlimited content generation',
      'Audio synthesis (TTS)',
      'Performance analytics + KPIs',
      'Priority API access',
      'Custom session builder',
    ],
    cta: 'Start Pro Trial',
    accent: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'Team',
    price: '$19',
    period: '/user/month',
    desc: 'For CFA prep groups and tutors.',
    features: [
      'Everything in Pro',
      'Team dashboard',
      'Student progress monitoring',
      'Shared question banks',
      'Admin controls',
      'Bulk account management',
    ],
    cta: 'Contact Us',
    accent: false,
  },
]

export default function PricingPage() {
  return (
    <div style={{ background: '#060915', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#f5f7ff' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5">
        <Link href="/landing" className="text-xl font-extrabold tracking-tight">
          <span style={{ color: '#6c8cff' }}>Wing</span>man
        </Link>
        <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition" style={{ background: '#6c8cff' }}>
          Get Started
        </Link>
      </nav>

      {/* Header */}
      <section className="px-6 md:px-16 pt-16 pb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ letterSpacing: '-.03em' }}>
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-slate-400 max-w-md mx-auto">
          Start free. Upgrade when you need more power.
        </p>
      </section>

      {/* Plans */}
      <section className="px-6 md:px-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map(plan => (
            <div key={plan.name} className="rounded-2xl p-6 relative flex flex-col"
              style={{
                background: plan.accent ? 'linear-gradient(135deg, rgba(108,140,255,.12), rgba(0,224,184,.06))' : '#10182d',
                border: plan.accent ? '1px solid rgba(108,140,255,.25)' : '1px solid rgba(255,255,255,.06)',
              }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-bold" style={{ background: '#6c8cff', color: '#fff' }}>
                  {plan.badge}
                </div>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className="text-[13px] text-slate-400 mb-5">{plan.desc}</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-slate-300">
                    <span style={{ color: '#00e0b8' }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className="block text-center py-3 rounded-xl text-sm font-bold transition"
                style={{
                  background: plan.accent ? '#6c8cff' : 'rgba(255,255,255,.04)',
                  border: plan.accent ? 'none' : '1px solid rgba(255,255,255,.08)',
                  color: '#fff',
                }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-16 pb-20">
        <h2 className="text-2xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { q: 'Is the Free plan really free?', a: 'Yes. No credit card required. You get limited access to QBank and content generation forever.' },
            { q: 'Can I cancel anytime?', a: 'Yes. No contracts. Cancel your Pro subscription anytime from Settings.' },
            { q: 'Does Wingman cover the full CFA Level I curriculum?', a: 'Yes. All 10 topics, 91 learning modules, and every LOS from the 2025 CFA Institute curriculum.' },
            { q: 'How does the AI tutor work?', a: 'Wingman uses Claude (Anthropic) to generate personalized study content, answer questions, and analyze your performance in real time.' },
          ].map(faq => (
            <div key={faq.q} className="rounded-xl p-4" style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}>
              <h3 className="text-[14px] font-bold text-white mb-1.5">{faq.q}</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">&copy; 2025 Wingman by Veridis. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/landing" className="hover:text-white transition">Home</Link>
            <Link href="/login" className="hover:text-white transition">Login</Link>
            <a href="mailto:contact@veridis.shop" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
