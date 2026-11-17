import { handleNodeRequest } from '../server/editorHandler.mjs'

export default function handler(req, res) {
  return handleNodeRequest(req, res)
}
