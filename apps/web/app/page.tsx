import type { AgentPhase } from '@localdot/shared'

const phase: AgentPhase = 'idle'

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
      <div
        role="img"
        aria-label={`Agent ${phase}`}
        className="size-4 rounded-full bg-dot shadow-[0_0_48px_8px_color-mix(in_oklab,var(--dot)_18%,transparent)]"
      />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-medium tracking-tight">Localdot</h1>
        <p className="text-sm text-muted">Early development. The agent is not usable yet.</p>
      </div>
    </main>
  )
}
