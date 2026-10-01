import { z } from 'zod'

import { JsonSchemaObjectSchema, ToolNameSchema, safeParse, type ParseResult } from './common.ts'
import type { AgentLimits } from './limits.ts'
import type { RiskAssessment } from './permissions.ts'
import type { Workspace } from './workspace.ts'

/** Presentation hint for the UI. The agent runtime never branches on it. */
export const TOOL_CATEGORIES = ['file', 'search', 'shell', 'browser', 'mcp', 'other'] as const
export const ToolCategorySchema = z.enum(TOOL_CATEGORIES)
export type ToolCategory = z.infer<typeof ToolCategorySchema>

/** The serializable part of a tool: what is sent to the model and shown in the UI. */
export const ToolDescriptorSchema = z.object({
  name: ToolNameSchema,
  description: z.string().min(1),
  inputSchema: JsonSchemaObjectSchema,
  category: ToolCategorySchema,
})
export type ToolDescriptor = z.infer<typeof ToolDescriptorSchema>

export const ToolResultSchema = z
  .object({
    ok: z.boolean(),
    /** Text fed back to the model as the observation. Already bounded by the tool. */
    observation: z.string(),
    error: z.string().optional(),
    exitCode: z.int().optional(),
    durationMs: z.number().nonnegative().optional(),
    /** Workspace-relative paths the tool modified. */
    filesChanged: z.array(z.string()).optional(),
    truncated: z.boolean().optional(),
    /** Where the untruncated output can be retrieved. Required when `truncated` is true. */
    fullOutputRef: z.string().min(1).optional(),
  })
  .refine((result) => result.truncated !== true || result.fullOutputRef !== undefined, {
    message: 'A truncated result must reference its full output',
    path: ['fullOutputRef'],
  })
export type ToolResult = z.infer<typeof ToolResultSchema>

export interface ToolContext {
  readonly runId: string
  readonly step: number
  readonly workspace: Workspace
  readonly limits: AgentLimits
  /** Aborted on cancellation or timeout. Tools must stop work and release resources. */
  readonly signal: AbortSignal
}

/**
 * Uniform contract for every tool: built-in, browser, MCP or plugin.
 * The runner only ever sees this interface.
 */
export interface Tool<Input = unknown> extends ToolDescriptor {
  /** Validates untrusted model-supplied arguments. Must not throw. */
  parseInput(raw: unknown): ParseResult<Input>
  assessRisk(input: Input, context: ToolContext): RiskAssessment
  execute(input: Input, context: ToolContext): Promise<ToolResult>
}

/** Checks a tool's serializable descriptor, e.g. one discovered from an MCP server. */
export function validateToolDescriptor(descriptor: unknown): ParseResult<ToolDescriptor> {
  return safeParse(ToolDescriptorSchema, descriptor)
}
