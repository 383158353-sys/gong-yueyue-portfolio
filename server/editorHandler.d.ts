import type { IncomingMessage, ServerResponse } from 'node:http'

export function handleNodeRequest(req: IncomingMessage, res: ServerResponse, env?: NodeJS.ProcessEnv): Promise<void>
