'use strict';
/* Signboard-Solo station LED board renderer (webview) — mask method.
   Same rows as the flap board, shown as a station LED departure board
   without ever computing a dot: the board is ordinary DOM text, and a
   static perforated mask (CSS radial-gradient holes on a dot pitch)
   lies over it, so the letters show only through the holes and read
   as lit LEDs. A blurred copy of the text sits underneath as the
   light bleed. Because the glyphs are real text they cannot thin out
   or drop strokes the way the earlier sampling renderers' dots did,
   and a frame costs no per-dot work at all — the ticker is a plain
   transform, the delayed blink a CSS animation.

   Dot parameters come from the signboard.ledPitch / ledHole /
   ledGlow settings; their defaults are the approved prototype's
   initial values (hole 38%, glow on; the pitch default became 3px
   in 1.8.3 after real-machine use). Everything else —
   live rows from the host, statuses, the line-name greeting,
   announcements, screen switching, auto-mode width reporting — is
   the product's own behaviour, unchanged. */
const vscodeApi = acquireVsCodeApi();
const CFG = Object.assign({ pitch: 3, hole: 38, glow: true }, window.__SB_LED || {});

const SET_SWITCH_MS = 8000;  // screen switching interval

/* [Japanese label, English label, colour class] in the palette of the
   mock and the mask prototype — the board follows the VS Code display
   language, like the flap board does. */
const TYPE_BY_EXT = {
  ts: ['特急', 'LTD EXP', 'c-red'], go: ['特急', 'LTD EXP', 'c-red'],
  js: ['快速', 'RAPID', 'c-orange'], css: ['快速', 'RAPID', 'c-orange'], rs: ['快速', 'RAPID', 'c-orange'],
  py: ['普通', 'LOCAL', 'c-green'], json: ['普通', 'LOCAL', 'c-green'], html: ['普通', 'LOCAL', 'c-green'],
};
const TYPE_DEFAULT = ['各停', 'ALL-STOPS', 'c-blue'];
let LANG_JA = false;
/* The line name comes from the host: the parent directory of the first
   file tab. The greeting thanks riders of that line, like a real station
   board; with no file open it falls back to the Signboard name. */
let lineName = '';
function defaultTicker() {
  if (!LANG_JA) {
    return lineName
      ? 'Thank you for riding the ' + lineName + ' Line today. This board shows your open tabs.'
      : 'Thank you for using Signboard today. This board shows your open tabs.';
  }
  return lineName
    ? '本日も ' + lineName + '線 をご利用くださいまして、ありがとうございます。　この案内板は、開いているタブを表示しています。'
    : '本日も Signboard をご利用くださいまして、ありがとうございます。　この案内板は、開いているタブを表示しています。';
}

function stripExt(n) { const i = n.lastIndexOf('.'); return i > 0 ? n.slice(0, i) : n; }
function destName(name) { return stripExt(name).toUpperCase(); }
function pad2(v) { return String(v).padStart(2, '0'); }
function hhmm(ms) { const d = new Date(ms); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function clockNow() { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()); }

const board = document.getElementById('board');
const textLayer = document.getElementById('textLayer');
const glowLayer = document.getElementById('glowLayer');
const pagesEl = document.getElementById('pages');

function applyParams() {
  const pitch = Math.min(12, Math.max(3, Number(CFG.pitch) || 3));
  const holePct = Math.min(48, Math.max(25, Number(CFG.hole) || 38));
  board.style.setProperty('--pitch', pitch + 'px');
  board.style.setProperty('--hole', (pitch * holePct / 100).toFixed(2) + 'px');
  board.style.setProperty('--feather', Math.max(0.3, pitch * 0.12).toFixed(2) + 'px');
  glowLayer.style.display = CFG.glow ? '' : 'none';
}

let rows = [];
let rowsBoxEl = null;   // set by buildAll; never look these up by id —
let tickerEl = null;    // the glow layer holds clones of the same nodes
let prevByKey = new Map();
let currentSet = 0;
let lastSetChange = Date.now();
let lastEventAt = 0;
let setSize = 4;
let tickerText = defaultTicker();
let tickerMode = 'loop';   // 'loop' = greeting scroll, 'once' = announcement pass
let tickerOffset = 0;

function sets() { return Math.max(1, Math.ceil(rows.length / setSize)); }
function jumpToKey(key) {
  const idx = rows.findIndex((r) => r.key === key);
  if (idx < 0) return;
  const s = Math.floor(idx / setSize);
  if (s !== currentSet) { currentSet = s; lastSetChange = Date.now(); buildRows(); }
}
function announce(text) {
  tickerText = text;
  tickerMode = 'once';
  tickerOffset = null; // start off the right edge, measured on next tick
  renderTickerText();
}
function statusOf(r) {
  if (r.status === 'delayed') return [LANG_JA ? '遅延' : 'DELAYED', 'st-delay blink'];
  if (r.status === 'cancelled') return [LANG_JA ? '運休' : 'CANCELLED', 'st-delay'];
  if (r.status === 'arrived') return [LANG_JA ? '到着' : 'ARRIVED', 'st-arrived'];
  if (r.active) return [LANG_JA ? '次発' : 'NEXT', 'st-next'];
  return ['', ''];
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/* Build the whole text layer (header + current screen of rows +
   ticker), then mirror it into the glow layer. */
function buildAll() {
  textLayer.replaceChildren();
  const head = el('div', 'head');
  head.appendChild(el('span', 'ttl', LANG_JA ? '出発案内' : 'DEPARTURES'));
  head.appendChild(el('span', 'clk', clockNow()));
  textLayer.appendChild(head);
  rowsBoxEl = el('div', 'rows');
  textLayer.appendChild(rowsBoxEl);
  tickerEl = el('div', 'ticker');
  tickerEl.appendChild(el('span', 'scroll'));
  textLayer.appendChild(tickerEl);
  buildRows();
  renderTickerText();
}

function buildRows() {
  const rowsBox = rowsBoxEl;
  if (!rowsBox) return;
  rowsBox.replaceChildren();
  const slice = rows.slice(currentSet * setSize, currentSet * setSize + setSize);
  for (const r of slice) {
    const [labelJa, labelEn, cls] = TYPE_BY_EXT[r.ext] || TYPE_DEFAULT;
    const row = el('div', 'row');
    row.appendChild(el('span', 'type ' + cls, LANG_JA ? labelJa : labelEn));
    const dest = el('span', 'dest', destName(r.name));
    if (r.status === 'cancelled') dest.style.color = '#777';
    row.appendChild(dest);
    row.appendChild(el('span', 'time', hhmm(r.mtime)));
    const [st, stCls] = statusOf(r);
    row.appendChild(el('span', 'st ' + stCls, st));
    rowsBox.appendChild(row);
  }
  pagesEl.replaceChildren();
  if (sets() > 1) {
    for (let s = 0; s < sets(); s++) {
      const dot = el('i', s === currentSet ? 'on' : '');
      pagesEl.appendChild(dot);
    }
  }
  syncGlow();
}

function syncGlow() {
  glowLayer.replaceChildren(...[...textLayer.childNodes].map((n) => n.cloneNode(true)));
}

function scrollEls() { return board.querySelectorAll('.ticker .scroll'); }
function renderTickerText() {
  const text = tickerMode === 'loop' ? (tickerText + '　　　').repeat(2) : tickerText + '　　　';
  scrollEls().forEach((s) => { s.textContent = text; });
  if (tickerMode === 'loop') tickerOffset = 0;
}

/* Trains per screen follows the view height, measured from a real
   row: the board pages only when the trains truly do not fit — the
   same rule the flap board uses. */
function measureSetSize() {
  const row = textLayer.querySelector('.row');
  const head = textLayer.querySelector('.head');
  const ticker = textLayer.querySelector('.ticker');
  if (!row || !head || !ticker) return;
  const rowH = row.offsetHeight;
  if (rowH <= 0) return;
  const fontPx = parseFloat(getComputedStyle(board).fontSize) || 40;
  const used = head.offsetHeight + ticker.offsetHeight + fontPx * 1.1; // layer padding + ticker margins
  const fit = Math.floor((window.innerHeight - 16 - used) / rowH);
  const next = Math.max(1, Math.min(24, fit));
  if (next !== setSize) {
    setSize = next;
    if (currentSet >= sets()) currentSet = sets() - 1;
    buildRows();
  }
}

function tickClock() {
  const t = clockNow();
  board.querySelectorAll('.clk').forEach((c) => { c.textContent = t; });
}

setInterval(() => {
  if (document.hidden) return;
  const now = Date.now();
  if (sets() > 1 && now - lastSetChange >= SET_SWITCH_MS && now - lastEventAt >= SET_SWITCH_MS) {
    currentSet = (currentSet + 1) % sets();
    lastSetChange = now;
    buildRows();
  }
  /* ticker scroll: the text layer slides under the static mask */
  const els = scrollEls();
  if (els.length) {
    /* Measure the text layer's copy: the glow layer may be hidden
       (glow off), and a hidden element reports a width of 0. */
    const main = textLayer.querySelector('.ticker .scroll');
    const w = main ? main.scrollWidth : 0;
    const box = tickerEl;
    if (tickerMode === 'loop') {
      const half = w / 2;
      tickerOffset -= 3;
      if (half > 0 && tickerOffset <= -half) tickerOffset += half;
    } else {
      if (tickerOffset === null) tickerOffset = box ? box.clientWidth : 0;
      tickerOffset -= 3;
      if (w > 0 && tickerOffset < -w) {
        tickerText = defaultTicker();
        tickerMode = 'loop';
        renderTickerText();
      }
    }
    els.forEach((s) => { s.style.transform = 'translateX(' + tickerOffset + 'px)'; });
  }
}, 50);
setInterval(() => { if (!document.hidden) tickClock(); }, 250);

window.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg) return;
  if (msg.type === 'state') {
    LANG_JA = String(msg.lang || '').toLowerCase().startsWith('ja');
    lineName = msg.line || '';
    if (tickerMode === 'loop' && tickerText !== defaultTicker()) {
      // The line changed (a different first file): restart the greeting
      // (buildAll below re-renders the ticker text).
      tickerText = defaultTicker();
    }
    const before = prevByKey;
    rows = msg.rows || [];
    if (currentSet >= sets()) currentSet = sets() - 1;
    buildAll();
    measureSetSize();
    for (const r of rows) {
      const prev = before.get(r.key);
      if (prev && prev.status !== r.status && r.status === 'arrived') {
        lastEventAt = Date.now(); jumpToKey(r.key);
        announce(LANG_JA ? 'まもなく ' + destName(r.name) + ' が到着します' : destName(r.name) + ' will arrive shortly.');
      } else if ((!prev && r.status === 'cancelled') || (prev && prev.status !== r.status && r.status === 'cancelled')) {
        lastEventAt = Date.now(); jumpToKey(r.key);
        announce(LANG_JA ? destName(r.name) + ' は運休となりました' : destName(r.name) + ' has been cancelled.');
      }
    }
    prevByKey = new Map(rows.map((r) => [r.key, r]));
  } else if (msg.type === 'event' && msg.key) {
    lastEventAt = Date.now();
    jumpToKey(msg.key);
  }
});

function reportWidth() {
  if (window.__SB_AUTO) vscodeApi.postMessage({ type: 'width', width: window.innerWidth });
}

let resizeAt = 0;
window.addEventListener('resize', () => {
  const now = Date.now();
  if (now - resizeAt < 150) return;
  resizeAt = now;
  reportWidth();
  measureSetSize();
});

applyParams();
buildAll();
measureSetSize();
reportWidth();
vscodeApi.postMessage({ type: 'ready' });
