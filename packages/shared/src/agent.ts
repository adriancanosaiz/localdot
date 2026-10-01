import type { AgentEvent } from './events.ts'
import type { AgentLimits } from './limits.ts'
import type { ApprovalBroker, PermissionGateway } from './permissions.ts'
import type { ModelProvider } from './providers.ts'
import type { AgentRun } from './run.ts'
import type { Tool } from './tools.ts'
import type { Workspace } from './workspace.ts'

/** Input to the agent runtime's entry point. */
export interface RunAgentOptions {
  readonly task: string
  readonly provider: ModelProvider
  readonly tools: readonly Tool[]
  readonly workspace: Workspace
  readonly limits?: Partial<AgentLimits>
  readonly gateway: PermissionGateway
  readonly approvals: ApprovalBroker
  /** Aborting cancels the in-flight model request, running tool and pending approval. */
  readonly signal: AbortSignal
  /** Called synchronously for every event. Must not throw or block. */
  readonly onEvent: (event: AgentEvent) => void
}

/** Settles once the run reaches a terminal status. Never rejects for agent-level failures. */
export interface AgentRunResult {
  readonly run: AgentRun
}

export type RunAgent = (options: RunAgentOptions) => Promise<AgentRunResult>
