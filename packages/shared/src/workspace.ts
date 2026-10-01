import { z } from 'zod'

import { IdSchema } from './common.ts'

/** A directory the agent is allowed to work in. All file and shell access is scoped to it. */
export const WorkspaceSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  /** Absolute, resolved path to the workspace root. */
  rootPath: z.string().startsWith('/', 'Workspace root must be an absolute path'),
})
export type Workspace = z.infer<typeof WorkspaceSchema>
