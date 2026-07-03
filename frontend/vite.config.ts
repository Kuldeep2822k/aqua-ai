import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      // `json-summary` is required by the Coverage Report CI job, which reads
      // coverage/coverage-summary.json to post a PR comment. `text` keeps the
      // console summary and `html`/`json` remain available for local drill-down.
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**',
        'src/components/figma/**',
        'src/styles/**',
        'src/**/Attributions.md',
        'src/**/Guidelines.md',
        'src/setupTests.ts',
      ],
    },
  },
});
