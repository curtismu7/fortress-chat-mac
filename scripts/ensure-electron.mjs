import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Relative path inside dist/ for the Electron executable on this OS. */
function platformPath() {
  if (process.platform === 'darwin') return 'Electron.app/Contents/MacOS/Electron';
  if (process.platform === 'win32') return 'electron.exe';
  return 'electron';
}

/** Repair path.txt when npm blocks Electron's postinstall (allow-scripts). */
export function ensureElectron(root = DEFAULT_ROOT) {
  const electronDir = join(root, 'node_modules/electron');
  const pkgPath = join(electronDir, 'package.json');
  if (!existsSync(pkgPath)) return;

  const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
  const rel = platformPath();
  const bin = join(electronDir, 'dist', rel);
  const pathFile = join(electronDir, 'path.txt');
  const versionFile = join(electronDir, 'dist', 'version');

  if (existsSync(bin)) {
    mkdirSync(join(electronDir, 'dist'), { recursive: true });
    writeFileSync(pathFile, rel);
    writeFileSync(versionFile, version);
    return;
  }

  try {
    execFileSync(process.execPath, ['install.js'], { cwd: electronDir, stdio: 'inherit' });
  } catch {
    throw new Error(
      'Electron binary missing. Approve install scripts (npm approve-scripts --allow-scripts-pending) or use Node 20 LTS, then run npm install again.',
    );
  }

  if (!existsSync(pathFile)) {
    throw new Error('Electron install did not create path.txt — try deleting node_modules/electron and running npm install again.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureElectron();
}
