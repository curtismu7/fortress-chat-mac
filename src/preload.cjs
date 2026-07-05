const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('__fc', {
  post: (m) => ipcRenderer.send('fc', m),
  on: (cb) => ipcRenderer.on('fc', (_e, m) => cb(m)),
});
