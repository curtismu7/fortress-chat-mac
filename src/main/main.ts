import { app, BrowserWindow, Menu, dialog, ipcMain, shell, safeStorage, clipboard } from 'electron';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ensureDaemon } from '../../vendor/fortress-chat/packages/extension/src/daemon';
import { DEFAULT_SKILL_DIRS } from '../../vendor/fortress-chat/packages/extension/src/skills';
import { ChatController } from './controller';
import { SecretStore } from './secrets';
import { FileMemento } from './fileMemento';

const MCP_KEY = 'fortressChat.mcpServers';
const SKILL_DIRS_KEY = 'fortressChat.skillDirectories';

let controller: ChatController | null = null;
let mainWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;

function settingsPath(userDataDir: string): string {
  return join(userDataDir, 'settings.json');
}

/** Ensure default MCP/skills keys exist in settings.json. */
function ensureDefaultSettings(settings: FileMemento): void {
  if (!settings.get(MCP_KEY)) settings.update(MCP_KEY, []);
  if (!settings.get(SKILL_DIRS_KEY)) settings.update(SKILL_DIRS_KEY, [...DEFAULT_SKILL_DIRS]);
}

function broadcast(msg: unknown): void {
  mainWindow?.webContents.send('fc', msg);
  panelWindow?.webContents.send('fc', msg);
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100, height: 800, title: 'FortressChat',
    webPreferences: { preload: join(__dirname, '..', 'src', 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  void win.loadFile(join(__dirname, '..', 'renderer', 'chat.html'));
  return win;
}

function openPanelWindow(): void {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.focus();
    return;
  }
  panelWindow = createWindow();
  panelWindow.setTitle('FortressChat — Chat');
  panelWindow.on('closed', () => { panelWindow = null; });
  panelWindow.webContents.on('did-finish-load', () => void controller?.init());
}

app.whenReady().then(async () => {
  mainWindow = createWindow();
  const userDataDir = app.getPath('userData');
  const settings = new FileMemento(settingsPath(userDataDir));
  ensureDefaultSettings(settings);
  const secrets = new SecretStore(join(userDataDir, 'secrets.json'), safeStorage);

  controller = new ChatController({
    userDataDir,
    settings,
    connect: () => ensureDaemon(join(__dirname, 'manager', 'index.js')),
    post: broadcast,
    openPath: async (p) => { await shell.openPath(p); },
    saveFile: async (defaultName, content) => {
      const r = await dialog.showSaveDialog(mainWindow!, { defaultPath: defaultName, filters: [{ name: 'Markdown', extensions: ['md'] }] });
      if (r.filePath) writeFileSync(r.filePath, content, 'utf8');
    },
    secrets,
    pickDocuments: async () => {
      const r = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Documents', extensions: ['txt', 'md', 'markdown', 'json', 'csv'] }],
      });
      return r.filePaths;
    },
    pickImage: async () => {
      const r = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
      });
      const path = r.filePaths[0];
      if (!path) return null;
      const buf = readFileSync(path);
      const ext = path.split('.').pop()?.toLowerCase() ?? 'png';
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      return { mime, base64: buf.toString('base64'), name: path.split('/').pop() ?? 'image' };
    },
    approveEdit: async (rel, isNew) => {
      const r = await dialog.showMessageBox(mainWindow!, {
        type: 'question', buttons: ['Apply', 'Reject'], defaultId: 0, cancelId: 1,
        message: `${isNew ? 'Create' : 'Edit'} ${rel}?`,
        detail: 'FortressChat agent wants to change this file.',
      });
      return r.response === 0;
    },
    approveCommand: async (command) => {
      const r = await dialog.showMessageBox(mainWindow!, {
        type: 'warning', buttons: ['Run', 'Reject'], defaultId: 1, cancelId: 1,
        message: 'FortressChat wants to run a shell command',
        detail: command,
      });
      return r.response === 0;
    },
    writeClipboard: (text) => { clipboard.writeText(text); },
    openChatPanel: openPanelWindow,
    openSettingsFile: async () => {
      const path = settingsPath(userDataDir);
      if (!existsSync(path)) writeFileSync(path, '{}', 'utf8');
      await shell.openPath(path);
    },
    showInfo: (message) => { void dialog.showMessageBox(mainWindow!, { type: 'info', message }); },
  });

  controller.setDevMode(Boolean(settings.get('fortressChat.devMode')));
  ipcMain.on('fc', (_e, m) => void controller!.onMessage(m));
  mainWindow.webContents.on('did-finish-load', () => void controller!.init());
  const last = settings.get('fortressChat.folder');
  if (typeof last === 'string') { controller.setFolder(last); mainWindow.setTitle(`FortressChat — ${last}`); }

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { label: 'File', submenu: [
      { label: 'Open Folder…', accelerator: 'CmdOrCtrl+O', click: async () => {
        const r = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'] });
        const root = r.filePaths[0];
        if (root) { controller!.setFolder(root); settings.update('fortressChat.folder', root); mainWindow!.setTitle(`FortressChat — ${root}`); }
      } },
      { role: 'close' },
    ] },
    { label: 'Fortress', submenu: [
      { label: 'Developer Mode (bypasses US-only governance)', accelerator: 'Ctrl+Alt+M', click: async () => {
        const on = !settings.get('fortressChat.devMode');
        if (on) {
          const c = await dialog.showMessageBox(mainWindow!, { type: 'warning', buttons: ['Enable', 'Cancel'], defaultId: 1,
            message: 'Developer Mode bypasses the US-only governance and lets you use any Fireworks model (including non-US). Continue?' });
          if (c.response !== 0) return;
        }
        settings.update('fortressChat.devMode', on);
        controller!.setDevMode(on);
      } },
      { label: 'Edit Settings (MCP + Skills)…', click: async () => { await shell.openPath(settingsPath(userDataDir)); } },
      { label: 'Reload MCP Servers', click: () => void controller?.onMessage({ type: 'reloadMcp' }) },
      { label: 'Reload Skills', click: () => void controller?.onMessage({ type: 'reloadSkills' }) },
    ] },
    { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
  ]));

  if (process.argv.includes('--smoke')) {
    try {
      const client = await ensureDaemon(join(__dirname, 'manager', 'index.js'));
      await client.status();
      console.log('SMOKE OK');
      app.exit(0);
    } catch (e) { console.error('SMOKE FAIL', e); app.exit(1); }
  }
});

app.on('window-all-closed', () => { controller?.dispose(); app.quit(); });
