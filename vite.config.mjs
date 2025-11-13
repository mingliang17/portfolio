import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base:  process.env.VITE_BASE || '/portfolio/',
  server: {
    // 👇 This ensures BrowserRouter works during dev (no 404 on refresh)
    historyApiFallback: true,
  },

  build: {
    outDir: 'dist',
  },
})
