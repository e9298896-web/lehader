import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const buildSingleFile = (): Plugin => ({
  name: "build-single-file",
  apply: "build" as const,
  transformIndexHtml: (html: string) =>
    html
      .replace(/\s*type="module"/g, "")
      .replace(/\s*crossorigin/g, ""),
  closeBundle() {
    const distDir = path.resolve(process.cwd(), 'dist')
    const htmlPath = path.join(distDir, 'index.html')
    if (!fs.existsSync(htmlPath)) return
    let html = fs.readFileSync(htmlPath, 'utf-8')

    // Inline CSS
    html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*\/?>/g, (_m, href) => {
      const fp = path.join(distDir, href.replace(/^\.\//, ''))
      return fs.existsSync(fp) ? `<style>${fs.readFileSync(fp, 'utf-8')}</style>` : _m
    })

    // Inline JS — move to before </body> so DOM is ready (no defer needed)
    let scripts = ''
    html = html.replace(/<script[^>]+src="(\.\/assets\/[^"]+\.js)"[^>]*><\/script>/g, (_m, src) => {
      const fp = path.join(distDir, src.replace(/^\.\//, ''))
      if (fs.existsSync(fp)) { scripts += `<script>${fs.readFileSync(fp, 'utf-8')}</script>\n`; return '' }
      return _m
    })
    if (scripts) html = html.replace('</body>', `${scripts}</body>`)

    fs.writeFileSync(htmlPath, html, 'utf-8')
    const kb = Math.round(fs.statSync(htmlPath).size / 1024)
    console.log(`\n✓ single-file build → dist/index.html (${kb} KB)\n`)
  }
})

export default defineConfig({
  plugins: [react(), buildSingleFile()],
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
