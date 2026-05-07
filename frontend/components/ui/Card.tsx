import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  header?: string
}

export default function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 ${className}`}>
      {header && (
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
          {header}
        </h3>
      )}
      {children}
    </div>
  )
}
