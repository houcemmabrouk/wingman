interface BadgeProps {
  label: string
  variant?: 'green' | 'orange' | 'red' | 'blue' | 'purple'
}

const variantStyles: Record<string, string> = {
  green:  'bg-emerald-500/15 text-emerald-400',
  orange: 'bg-amber-500/15 text-amber-400',
  red:    'bg-red-500/15 text-red-400',
  blue:   'bg-blue-500/15 text-blue-400',
  purple: 'bg-purple-500/15 text-purple-400',
}

export default function Badge({ label, variant = 'blue' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variantStyles[variant]}`}>
      {label}
    </span>
  )
}
