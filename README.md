# FortressChat for Mac

A native macOS app for FortressChat — local-first AI chat with US-only model
governance. This app wraps the shared logic from the
[fortress-chat](https://github.com/curtismu7/fortress-chat) monorepo,
which is included here as a git submodule (`vendor/fortress-chat`), and bundles
its TypeScript sources directly via esbuild.

Built from the fortress-code monorepo via git submodule (`vendor/fortress-code`, pinned on `main`).

When the VS Code extension chat UI or Google key validation changes, refresh Mac parity:

```bash
git submodule update --remote vendor/fortress-code   # optional: bump vendor pin
npm run sync:extension                             # copy media + validateGoogleKey.ts
npm test && npm run build
```

## Feature parity

The Mac app tracks the VS Code extension chat UI and protocol:

- Claude-style model picker, settings drawer, composer `+` menu (modes, skills, MCP, context)
- **Skills** — `SKILL.md` from `fortressChat.skillDirectories` in app settings
- **MCP servers** — stdio tools in Agent mode via `fortressChat.mcpServers` in settings
- Agent mode, plan/debug/multitask, compare models, personas, memory, `@docs`, images, voice (TTS)
- Project rules (`.fortress/rules.md`), agent undo, @-mentions

Edit MCP/skills paths: **Fortress → Edit Settings (MCP + Skills)…** (`~/Library/Application Support/fortress-chat-mac/settings.json`).

Code block **Insert/Apply** copies to the clipboard (no in-app editor). **Open in editor tab** opens a second chat window.


FortressChat for Mac is a native menu-bar-friendly Electron shell around the
same chat UI as the FortressChat VS Code extension: local, US-governed model
chat plus `@codebase` context lookups, backed by the manager daemon from the
`fortress-chat` monorepo. No editor required — it runs standalone.

## Install and open (no Terminal required)

FortressChat runs on **macOS 13+** with **Apple Silicon** (M1/M2/M3/M4).

### Install

1. Go to [Releases](https://github.com/curtismu7/fortress-chat-mac/releases) and download the latest `FortressChat-<version>-arm64.dmg`.
2. Double-click the DMG file in your **Downloads** folder.
3. Drag **FortressChat** into the **Applications** folder in the window that opens.
4. Eject the DMG (right-click the disk icon on your Desktop → **Eject**).

### First launch (one-time security step)

The app is not yet signed with an Apple Developer ID, so macOS may block the
first launch if you double-click it normally. Use **Right-click → Open** instead:

1. Open **Finder** → **Applications**.
2. Find **FortressChat**.
3. **Right-click** (or Control-click) **FortressChat** → choose **Open**.
4. In the dialog, click **Open** again.

FortressChat opens. After this one-time step, you can launch it like any other
app — double-click, Spotlight, Launchpad, or the Dock.

### If you already double-clicked and saw “can’t be opened”

1. Open **System Settings** → **Privacy & Security**.
2. Scroll down to the security message about FortressChat being blocked.
3. Click **Open Anyway**, then confirm **Open**.

Or use **Right-click → Open** in Applications (steps above).

### Everyday use

- **Open a project:** **File → Open Folder…** (or drag a folder onto the app).
- **Quit:** **FortressChat → Quit FortressChat** (or press **⌘Q**).

## Dev build

**Requirements:** macOS 13+, Apple Silicon, **Node.js 20 or 22 LTS** (Node 23+ is unsupported).

```bash
git clone --recurse-submodules https://github.com/curtismu7/fortress-chat-mac
cd fortress-chat-mac
npm install
npm start
```

If `npm install` warns about blocked install scripts (npm 11+), run once:

```bash
npm approve-scripts --allow-scripts-pending
npm install
```

Our `postinstall` also repairs Electron when the binary downloaded but `path.txt` was skipped.

`npm run dist` produces an unsigned arm64 DMG under `release/`.

Note: VS Code integrated terminals export `ELECTRON_RUN_AS_NODE=1`, which makes
`npm start` run Electron as plain Node (no window). Run
`env -u ELECTRON_RUN_AS_NODE npm start` there, or use a regular terminal.
