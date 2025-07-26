import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'window.Sentry': 'undefined',
    'global.Sentry': 'undefined',
    '__SENTRY__': 'undefined',
  },
  build: {
    rollupOptions: {
      external: [
        '@sentry/browser', 
        '@sentry/react', 
        '@sentry/tracing',
        '@sentry/replay',
        '@sentry/utils',
        '@sentry/core',
        '@sentry/types',
        '@sentry/integrations'
      ],
    },
  },
  server: {
    middlewareMode: false,
  },
});