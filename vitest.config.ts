import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
  resolve: { alias: { '@fortress-code/shared': new URL('./vendor/fortress-code/packages/shared/src/index.ts', import.meta.url).pathname } },
});
