import { defineConfig } from 'vite'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html')
      },
      plugins: [
        visualizer({
          filename: 'bundle-stats.html',
          open: false,
          gzipSize: true
        })
      ]
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: false,
    proxy: {
      '/__': {
        target: 'http://localhost:5002',
        changeOrigin: true
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.spec.js',
      'src/**/*.test.js',
      'src/**/__tests__/*.js',
      'functions/**/*.test.js'
    ],
    exclude: [
      '**/node_modules/**',
      'cypress',
      '.history'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'clover'],
      include: ['src/**/*.js']
    },
    setupFiles: ['./vitest.setup.js'],
    // Sequence tests to avoid race conditions between Firebase apps
    fileParallelism: false,
    // Pool options for test isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
})
