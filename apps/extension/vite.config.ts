import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import manifest from './manifest.json';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
      skills: path.resolve(__dirname, '../../packages/skills/src'),
      agent: path.resolve(__dirname, '../../packages/agent/src')
    }
  }
});
