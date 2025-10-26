import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-icons', 'framer-motion'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['axios', 'dompurify', 'jspdf', 'xlsx'],
        }
      }
    },
    // Warning limit
    chunkSizeWarningLimit: 1000,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        comments: false
      }
    },
    // Source maps for production debugging (disable if not needed)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },
  // Optimization hints
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'react-router-dom'],
    exclude: []
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
  },
})
