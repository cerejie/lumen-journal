import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works at a domain root (Vercel/Netlify) or in a subfolder.
  base: './',
  plugins: [react(), tailwindcss()],
})
