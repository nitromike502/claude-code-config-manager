import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  // Dev server configuration
  server: {
    port: 5173,
    host: 'localhost',

    // Hot Module Replacement (HMR) configuration
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },

    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: 'http://localhost:8420',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // Build output configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },

  // Root directory for index.html
  root: '.',

  // Public base path
  base: '/'
})
