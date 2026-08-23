import type { ReactNode } from 'react'
import { Header } from './Header'
import { MicButton } from '@/components/voice/MicButton'

interface AppShellProps {
  children: ReactNode
}

// Mobile-first, single-column shell capped at max-w-lg so it also reads
// well as a centered card on desktop — this is a voice-first, phone-in-hand
// app first, and a desktop app second.
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-surface-muted">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <MicButton />
    </div>
  )
}
