/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    // Optimize CSS processing for Tailwind v4
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: ["src/main.tsx", "src/pages/testmodel.tsx", "src/pages/ThreeViewer.tsx"],
    },
  },
})