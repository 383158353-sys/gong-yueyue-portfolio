import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const editorHandler = './server/editorHandler.mjs'

export default defineConfig({
  assetsInclude: ['**/*.glb'],
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'editor-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = String((req as { url?: string }).url || '')
          if (url.indexOf('/api/editor') !== 0) return next()
          import(editorHandler)
            .then((loaded: { handleNodeRequest: (request: unknown, response: unknown) => Promise<void> }) => loaded.handleNodeRequest(req, res))
            .catch(next)
        })
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: false,
  },
})
