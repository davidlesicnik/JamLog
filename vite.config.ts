import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@coderline/alphatab/dist/alphaTab.worker.mjs',
          dest: 'alphatab',
        },
        {
          src: 'node_modules/@coderline/alphatab/dist/soundfont/sonivox.sf2',
          dest: 'alphatab/soundfont',
        },
      ],
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  optimizeDeps: {
    exclude: ['@coderline/alphatab'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          alphatab: ['@coderline/alphatab'],
        },
      },
    },
  },
})
