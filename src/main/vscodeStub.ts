// src/main/vscodeStub.ts — esbuild stub so vendor agent/tools.ts can bundle without VS Code.
const noop = () => ({ dispose: () => {} });

export const Uri = {
  file: (p: string) => ({ fsPath: p, toString: () => p }),
  parse: (s: string) => ({ fsPath: s }),
};

export const workspace = {
  registerTextDocumentContentProvider: () => ({ dispose: () => {} }),
  applyEdit: async () => true,
  fs: { writeFile: async () => {} },
  asRelativePath: (p: string) => p,
};

export const window = {
  showInformationMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showOpenDialog: async () => undefined,
  showSaveDialog: async () => undefined,
  activeTextEditor: undefined,
};

export const commands = { executeCommand: async () => {} };

export class WorkspaceEdit {
  createFile() {}
}

export class Range {}
export class Selection {}
export const TextEditorRevealType = { InCenter: 0 };
export const DiagnosticSeverity = { Error: 'error', Warning: 'warning', Information: 'information', Hint: 'hint' };
export const languages = { getDiagnostics: () => [] };
export const ProgressLocation = { Notification: 1 };

export default { Uri, workspace, window, commands, WorkspaceEdit, Range, Selection };
