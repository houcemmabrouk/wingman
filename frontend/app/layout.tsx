import './globals.css'
import AuthShell from '@/components/layout/AuthShell'

export const metadata = {
  title: 'Wingman — CFA Level I',
  description: 'Learning OS for CFA Level I preparation',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen antialiased">
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  )
}
