'use strict';

const vscode = require('vscode');
const path = require('path');
const { CONFIG, extOf, statusFor, autoModeForWidth, parentDirName, mergeOrder } = require('./model');

/* ------------------------------------------------------------------ *
 * Data layer: turns VS Code's tabs into board rows.
 * A row: { key, name, ext, mtime, savedAt, dirty, cancelled, active }
 * The webview only renders; every state decision happens here.
 * ------------------------------------------------------------------ */
class BoardData {
  constructor(onChange) {
    this.onChange = onChange;
    this.entries = new Map(); // key -> entry (live tabs)
    this.ghosts = new Map();  // key -> entry with cancelled=true, expiresAt
    this.lastOrder = [];      // keys in display order after the last refresh
    this.activeKey = null;
    this.disposables = [];
    this.ghostTimer = null;
  }

  start(context) {
    const d = (sub) => { this.disposables.push(sub); context.subscriptions.push(sub); };
    d(vscode.window.tabGroups.onDidChangeTabs(() => this.refresh()));
    d(vscode.window.tabGroups.onDidChangeTabGroups(() => this.refresh()));
    d(vscode.workspace.onDidSaveTextDocument((doc) => {
      const e = this.entries.get(doc.uri.toString());
      if (e) {
        e.mtime = Date.now();
        e.savedAt = Date.now();
        e.dirty = false;
        this.onChange('saved', e.key);
      }
    }));
    d(vscode.workspace.onDidChangeTextDocument((ev) => {
      const e = this.entries.get(ev.document.uri.toString());
      if (e && ev.document.isDirty) {
        e.dirty = true;
        e.savedAt = 0; // a new edit ends the arrival moment
        this.onChange('dirty', e.key);
      }
    }));
    this.refresh();
  }

  tabUri(tab) {
    const input = tab && tab.input;
    if (!input || typeof input !== 'object') return null;
    if (input instanceof vscode.Uri) return input;
    if (input.uri instanceof vscode.Uri) return input.uri;
    if (input.original instanceof vscode.Uri) return input.original; // diff editor
    return null;
  }

  refresh() {
    const now = Date.now();
    const seen = new Set();
    const liveOrder = [];
    const freshStats = [];
    let order = 0;
    let newActiveKey = null;

    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const uri = this.tabUri(tab);
        if (!uri) continue; // settings, webviews etc. are not flights
        if (uri.scheme !== 'file' && uri.scheme !== 'untitled') continue;
        const key = uri.toString();
        if (!seen.has(key)) liveOrder.push(key);
        seen.add(key);
        let e = this.entries.get(key);
        if (!e) {
          e = {
            key,
            name: uri.scheme === 'untitled' ? tab.label : path.posix.basename(uri.path),
            dir: uri.scheme === 'file' ? parentDirName(uri.path) : '',
            ext: uri.scheme === 'untitled' ? '' : extOf(path.posix.basename(uri.path)),
            mtime: now,
            savedAt: 0,
            dirty: !!tab.isDirty,
            cancelled: false,
            index: order,
          };
          this.entries.set(key, e);
          if (uri.scheme === 'file') freshStats.push(e);
        }
        e.index = order;
        e.dirty = !!tab.isDirty;
        if (tab.isActive) newActiveKey = key;
        order++;
      }
    }

    // Tabs that disappeared become CANCELLED ghosts for a short while.
    for (const [key, e] of this.entries) {
      if (!seen.has(key)) {
        this.entries.delete(key);
        if (!this.ghosts.has(key)) {
          this.ghosts.set(key, { ...e, cancelled: true, expiresAt: now + CONFIG.cancelLingerMs });
        }
      }
    }
    /* One shared numbering for live rows and ghosts: ghosts keep the
       place they held on the board instead of colliding with the
       renumbered live rows (see mergeOrder in model.js). */
    const merged = mergeOrder(this.lastOrder, liveOrder, [...this.ghosts.keys()]);
    merged.forEach((key, i) => {
      const e = this.entries.get(key) || this.ghosts.get(key);
      if (e) e.index = i;
    });
    this.lastOrder = merged;
    this.activeKey = newActiveKey;
    this.scheduleGhostCleanup();
    this.onChange('tabs', null);

    // Fill in real mtimes for files we have not seen before.
    for (const e of freshStats) {
      vscode.workspace.fs.stat(vscode.Uri.parse(e.key)).then(
        (st) => { e.mtime = st.mtime; this.onChange('stat', e.key); },
        () => { /* keep first-seen time */ }
      );
    }
  }

  scheduleGhostCleanup() {
    if (this.ghostTimer) { clearTimeout(this.ghostTimer); this.ghostTimer = null; }
    if (!this.ghosts.size) return;
    const next = Math.min(...[...this.ghosts.values()].map((g) => g.expiresAt));
    this.ghostTimer = setTimeout(() => {
      const now = Date.now();
      for (const [key, g] of this.ghosts) if (g.expiresAt <= now) this.ghosts.delete(key);
      this.scheduleGhostCleanup();
      this.onChange('ghost-expire', null);
    }, Math.max(50, next - Date.now()));
  }

  // The railway line this board serves: the parent directory of the
  // first file tab, in tab order. Untitled tabs have no directory.
  lineName() {
    const first = [...this.entries.values()]
      .sort((a, b) => a.index - b.index)
      .find((e) => e.dir);
    return first ? first.dir : '';
  }

  rows() {
    const now = Date.now();
    const live = [...this.entries.values()];
    // Dirty state is authoritative on the document, not on tab snapshots:
    // undoing back to the saved state must clear DELAYED even when no tab
    // event fires.
    const docs = new Map(vscode.workspace.textDocuments.map((d) => [d.uri.toString(), d]));
    for (const e of live) {
      const doc = docs.get(e.key);
      if (doc) e.dirty = doc.isDirty;
    }
    const ghosts = [...this.ghosts.values()].filter((g) => g.expiresAt > now);
    const all = [...live, ...ghosts].sort((a, b) => a.index - b.index);
    return all.map((e) => ({
      key: e.key,
      name: e.name,
      ext: e.ext,
      mtime: e.mtime,
      status: statusFor(e, now),
      active: e.key === this.activeKey && !e.cancelled,
    }));
  }

  dispose() {
    if (this.ghostTimer) clearTimeout(this.ghostTimer);
    this.disposables.forEach((d) => d.dispose());
  }
}

/* ------------------------------------------------------------------ *
 * Webview provider
 * ------------------------------------------------------------------ */
class BoardProvider {
  constructor(context, data) {
    this.context = context;
    this.data = data;
    this.view = null;
    this.lastSignature = '';
    this.tick = null;
    this.autoRenderer = 'flap';
    this.onRendererChange = null;
  }

  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };
    view.webview.html = this.html(view.webview);
    view.webview.onDidReceiveMessage((msg) => {
      if (msg && msg.type === 'ready') this.push(true);
      if (msg && msg.type === 'width') this.handleWidth(msg.width);
    });
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('signboard') && this.view) {
        // Swap the renderer (flap <-> LED) by rebuilding the page; the
        // LED mask parameters (ledPitch / ledHole / ledGlow) also take
        // effect this way. Auto starts from flap; the new page
        // immediately reports its width.
        this.autoRenderer = 'flap';
        this.view.webview.html = this.html(this.view.webview);
        this.lastSignature = '';
      }
    });
    view.onDidChangeVisibility(() => {
      if (view.visible) this.push(true);
    });
    // Arrival windows and ghost expiries are time-based; re-check cheaply.
    this.tick = setInterval(() => this.push(false), 1000);
    view.onDidDispose(() => { if (this.tick) clearInterval(this.tick); });
    this.push(true);
  }

  configuredMode() {
    return vscode.workspace.getConfiguration('signboard').get('mode', 'flap');
  }

  effectiveMode() {
    const mode = this.configuredMode();
    return mode === 'auto' ? this.autoRenderer : mode;
  }

  handleWidth(width) {
    if (!this.view || this.configuredMode() !== 'auto') return;
    const desired = autoModeForWidth(width);
    if (desired === this.autoRenderer) return;
    this.autoRenderer = desired;
    // Rebuilding with the other renderer is the mode switch itself; its
    // page reports the same width on load, so this cannot oscillate.
    this.view.webview.html = this.html(this.view.webview);
    this.lastSignature = '';
    this.push(true);
  }

  push(force) {
    if (!this.view || !this.view.visible) return;
    const rows = this.data.rows();
    const mode = vscode.workspace.getConfiguration('signboard').get('mode', 'flap');
    const payload = { type: 'state', rows, lang: vscode.env.language, mode, line: this.data.lineName() };
    const signature = JSON.stringify(rows) + '|' + mode + '|' + payload.lang + '|' + payload.line;
    if (!force && signature === this.lastSignature) return;
    this.lastSignature = signature;
    // A just-saved or just-cancelled row is the one worth watching: tell the
    // webview which row changed most recently so it can jump pages to it.
    this.view.webview.postMessage(payload);
  }

  notifyChange(kind, key) {
    if (this.view) {
      if (kind === 'saved' || kind === 'dirty') {
        this.view.webview.postMessage({ type: 'event', kind, key });
      }
    }
    this.push(true);
  }

  html(webview) {
    const mode = this.configuredMode();
    const effectiveMode = this.effectiveMode();
    const led = effectiveMode === 'led';
    if (this.onRendererChange) this.onRendererChange(effectiveMode);
    const cssFile = led ? 'led.css' : 'board.css';
    const jsFile = led ? 'led.js' : 'board.js';
    const css = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', cssFile));
    const js = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', jsFile));
    const nonce = String(Date.now()) + Math.floor(Math.random() * 1e9);
    const autoScript = mode === 'auto'
      ? `<script nonce="${nonce}">window.__SB_AUTO = true;</script>\n`
      : '';
    const cfg = vscode.workspace.getConfiguration('signboard');
    const ledScript = led
      ? `<script nonce="${nonce}">window.__SB_LED = ${JSON.stringify({
        pitch: cfg.get('ledPitch', 3),
        hole: cfg.get('ledHole', 38),
        glow: cfg.get('ledGlow', true),
      })};</script>\n`
      : '';
    const body = led
      ? `<div class="board" id="board">
  <div class="layer glow" id="glowLayer" aria-hidden="true"></div>
  <div class="layer" id="textLayer"></div>
  <div class="mask"></div>
  <div class="pages" id="pages"></div>
</div>`
      : `<div class="board" id="board">
  <div class="board-head">
    <span class="title">ARRIVALS</span>
    <span class="clock" id="clock"></span>
  </div>
  <div class="cols"><span class="c-logo"></span><span class="c-name" id="colName">便名</span><span class="c-meta"><span class="c-time" id="colTime">到着時刻</span><span class="c-rem" id="colRemark">備考</span></span><span class="c-count" id="flightCount"></span></div>
  <div id="rows"></div>
  <div class="board-foot"><span id="pageInfo"></span></div>
</div>`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}">
</head>
<body>
${body}
${autoScript}${ledScript}<script nonce="${nonce}" src="${js}"></script>
</body>
</html>`;
  }
}

function syncModeContext(effectiveMode) {
  const mode = effectiveMode || vscode.workspace.getConfiguration('signboard').get('mode', 'flap');
  vscode.commands.executeCommand('setContext', 'signboard.isLed', mode === 'led');
}

async function setMode(next) {
  const cfg = vscode.workspace.getConfiguration('signboard');
  const info = cfg.inspect('mode');
  const target = info && info.workspaceValue !== undefined
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  await cfg.update('mode', next, target);
}

function activate(context) {
  let provider;
  const data = new BoardData((kind, key) => { if (provider) provider.notifyChange(kind, key); });
  provider = new BoardProvider(context, data);
  provider.onRendererChange = syncModeContext;
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('signboard.board', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );
  // View-title toggle: one of the two commands is visible, by mode.
  context.subscriptions.push(
    vscode.commands.registerCommand('signboard.showLed', () => setMode('led')),
    vscode.commands.registerCommand('signboard.showFlap', () => setMode('flap')),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('signboard.mode')) syncModeContext();
    })
  );
  syncModeContext();
  data.start(context);
  context.subscriptions.push({ dispose: () => data.dispose() });
}

function deactivate() {}

module.exports = { activate, deactivate };
