/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// base must match the GitHub Pages repo path so hashed asset URLs resolve.
// start_url/scope are relative ('.') so the same build works inside Capacitor.
export default defineConfig({
  base: '/Nour-Al-Quran/',
  // Dedicated port so we never collide with other local dev servers.
  server: { port: 5183, strictPort: true },
  preview: { port: 5183, strictPort: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // transformers is huge and only used inside the ASR worker — don't pre-bundle it.
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.woff2', 'icons/*', 'sounds/*'],
      manifest: {
        name: 'نور القرآن',
        short_name: 'نور',
        lang: 'ar',
        dir: 'rtl',
        description: 'مصحف ومواقيت وتسميع وحفظ، يعمل دون اتصال',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        background_color: '#fff8f4',
        theme_color: '#004333',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache app shell + Quran JSON + fonts → full offline after first load.
        globPatterns: ['**/*.{js,css,html,woff2,json,svg,png}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Web Push (Tier B) handlers are injected into the generated SW.
        importScripts: ['push-sw.js'],
        runtimeCaching: [
          {
            // Reciter audio — stream first, cache what has been heard.
            urlPattern: ({ url }) => /everyayah\.com|quran\.com|qurancdn\.com/.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
