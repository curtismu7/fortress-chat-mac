// Adapter: the copied chat.js calls acquireVsCodeApi() exactly once.
// window.__fc is installed by src/preload.cjs (contextBridge).
function acquireVsCodeApi() {
  return { postMessage: (m) => window.__fc.post(m) };
}
window.__fc.on((m) => window.postMessage(m, '*'));
