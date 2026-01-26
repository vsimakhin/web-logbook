import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mui-material': ['@mui/material'],
          'vendor-mui-icons': ['@mui/icons-material'],
          'vendor-mui-x-data-grid': ['@mui/x-data-grid'],
          'vendor-mui-x-date-pickers': ['@mui/x-date-pickers'],
          'vendor-maps': ['ol'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-tanstack': ['@tanstack/react-query'],
          'vendor-toolpad': ['@toolpad/core'],
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
