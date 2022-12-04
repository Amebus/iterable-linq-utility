import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // ...
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
});
