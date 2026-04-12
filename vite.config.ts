import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('pdf-lib') || id.includes('jspdf') || id.includes('mammoth')) return 'vendor-pdf';
            if (id.includes('recharts') || id.includes('reactflow')) return 'vendor-charts';
            if (id.includes('firebase') || id.includes('supabase') || id.includes('aws-sdk')) return 'vendor-cloud';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
            return 'vendor-core';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800,
    reportCompressedSize: true
  },
})

