'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/components/ui/Modal'
import { installGlobalErrorLogger } from '@/lib/error-logger'
import LayoutShell from './LayoutShell'

const BARE_PATHS = ['/login', '/auth/callback', '/landing', '/pricing']

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBare = BARE_PATHS.some(p => pathname.startsWith(p))
  if (isBare) return <>{children}</>
  return <LayoutShell>{children}</LayoutShell>
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installGlobalErrorLogger()
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </AuthProvider>
  )
}
