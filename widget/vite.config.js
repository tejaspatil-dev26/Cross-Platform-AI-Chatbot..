import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'chat-widget.js',
        assetFileNames: 'chat-widget.[ext]',
      }
    }
  }
})