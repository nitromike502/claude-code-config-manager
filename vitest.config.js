import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],

  // Path aliases (match vite.config.js)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  test: {
    // Use happy-dom for DOM testing
    environment: 'happy-dom',

    // Test file patterns
    include: ['tests/frontend/**/*.test.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/stores/**/*.js'],
      exclude: ['node_modules/', 'tests/']
    },

    // Global test timeout
    testTimeout: 10000,

    // Globals (optional, allows using describe/it without imports)
    globals: true
  }
})
