import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(HERE, 'vendor/fortress-code');

/** Resolve ../../vendor/... imports from src/main to absolute vendor paths. */
const vendorResolvePlugin = {
  name: 'vendor-resolve',
  setup(build) {
    build.onResolve({ filter: /^\.\.\/\.\.\/vendor\/fortress-chat\// }, (args) => ({
      path: resolve(args.resolveDir, args.path),
    }));
  },
};

const shared = {
  bundle: true, platform: 'node', target: 'node20', format: 'cjs', sourcemap: true,
  absWorkingDir: HERE,
  plugins: [vendorResolvePlugin],
  alias: {
    '@fortress-chat/shared': join(VENDOR, 'packages/shared/src/index.ts'),
    vscode: join(HERE, 'src/main/vscodeStub.ts'),
  },
};

// Electron main bundle (electron is provided at runtime)
await build({ ...shared, entryPoints: ['src/main/main.ts'], outfile: 'dist/main.js', external: ['electron'] });

// Manager daemon bundle from vendor sources (spawned with ELECTRON_RUN_AS_NODE=1)
await build({ ...shared, entryPoints: ['vendor/fortress-chat/packages/manager/src/index.ts'], outfile: 'dist/manager/index.js' });
