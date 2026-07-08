import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('ensureElectron', () => {
  let root: string;
  let originalCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'fc-electron-'));
    originalCwd = process.cwd();
    process.chdir(root);
    mkdirSync(join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS'), { recursive: true });
    writeFileSync(join(root, 'node_modules/electron/package.json'), JSON.stringify({ version: '33.4.11' }));
    writeFileSync(join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'), '');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('writes path.txt and dist/version when the binary exists but markers are missing', async () => {
    const { ensureElectron } = await import('../scripts/ensure-electron.mjs');
    ensureElectron(root);
    expect(readFileSync(join(root, 'node_modules/electron/path.txt'), 'utf8')).toBe('Electron.app/Contents/MacOS/Electron');
    expect(readFileSync(join(root, 'node_modules/electron/dist/version'), 'utf8')).toBe('33.4.11');
  });

  it('is a no-op when electron is not installed', async () => {
    rmSync(join(root, 'node_modules/electron'), { recursive: true, force: true });
    const { ensureElectron } = await import('../scripts/ensure-electron.mjs');
    expect(() => ensureElectron(root)).not.toThrow();
    expect(existsSync(join(root, 'node_modules/electron/path.txt'))).toBe(false);
  });
});
