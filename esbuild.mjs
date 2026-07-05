import { build } from 'esbuild';

const shared = {
  bundle: true, platform: 'node', target: 'node20', format: 'cjs', sourcemap: true,
  alias: { '@fortress-code/shared': './vendor/fortress-code/packages/shared/src/index.ts' },
};

// Electron main bundle (electron is provided at runtime)
await build({ ...shared, entryPoints: ['src/main/main.ts'], outfile: 'dist/main.js', external: ['electron'] });

// Manager daemon bundle from vendor sources (spawned with ELECTRON_RUN_AS_NODE=1)
await build({ ...shared, entryPoints: ['vendor/fortress-code/packages/manager/src/index.ts'], outfile: 'dist/manager/index.js' });
