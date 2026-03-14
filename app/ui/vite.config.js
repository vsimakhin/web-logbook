import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mui/material')) return 'vendor-mui-material'
          if (id.includes('@mui/icons-material')) return 'vendor-mui-icons'
          if (id.includes('@mui/x-data-grid')) return 'vendor-mui-x-data-grid'
          if (id.includes('@mui/x-date-pickers')) return 'vendor-mui-x-date-pickers'
          if (id.includes('@toolpad/core')) return 'vendor-toolpad'
          if (id.includes('@tanstack/react-query')) return 'vendor-tanstack'
          if (id.includes('react-router-dom')) return 'vendor-react'
          if (id.includes('react-dom')) return 'vendor-react'
          if (id.includes('react')) return 'vendor-react'
          if (id.includes('/ol/')) return 'vendor-maps'
        }
      }
    }
  },
  server: {
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
})
