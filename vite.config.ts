import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const stripModuleType = () => ({
  name: "strip-module-type",
  apply: "build" as const,
  transformIndexHtml: (html: string) =>
    html
      .replace(/\s*type="module"/g, "")
      .replace(/\s*crossorigin/g, "")
      .replace(/<script src="\.\/assets\//g, '<script defer src="./assets/'),
});

export default defineConfig({
  plugins: [react(), stripModuleType()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
})
