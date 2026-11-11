'use strict';
/* Signboard-Solo station LED board renderer (webview).
   Same rows as the flap board, drawn as a dot-matrix departure board:
   text is composed small on an offscreen canvas and sampled into dots,
   so kanji become dot glyphs as-is. The unlit dot grid is pre-rendered
   once; each frame only draws the lit dots, batched by colour.

   Layout is defined in DOT units (1 dot = SCALE compose px) so elements
   keep their proportions at any width; the dot column count adapts to
   the view width. The announcement ticker sits directly under the
   header: in a short Explorer section the bottom of the board is cut
   off, and the announcements are the LED mode's main act. */
const vscodeApi = acquireVsCodeApi();

const SET_SIZE = 4;          // trains per screen (design memo E5)
const SET_SWITCH_MS = 8000;  // screen switching interval
const SCALE = 4;             // compose at 4x, sample every 4th pixel
/* dot-unit geometry */
const HEADER_D = 12;         // 出発案内 + clock
const TICKER_D = 13;         // announcement line
const ROW_D = 14;            // one train row
const PAD_D = 2;
const H_DOTS = HEADER_D + TICKER_D + SET_SIZE * ROW_D + PAD_D; // 83
const H = H_DOTS * SCALE;
/* Element sizes in compose px, two sets: at Explorer-section widths the
   wide set would leave the destination only a character or two, so the
   narrow set shrinks the chip, time and status zones first. */
function geom() {
  return COLS >= 84
    ? { chipW: 64, chipH: 44, chipFont: 26, destX: 76, destFont: 40, timeFont: 36, statusFont: 30, statusW: 68 }
    : { chipW: 52, chipH: 44, chipFont: 22, destX: 60, destFont: 34, timeFont: 30, statusFont: 24, statusW: 52 };
}

let COLS = 76;               // dots across, adapted in layout()
let W = COLS * SCALE;        // compose width in px

const TYPE_BY_EXT = {
  ts: ['特急', '#e03131'], go: ['特急', '#e03131'],
  js: ['快速', '#f08c00'], css: ['快速', '#f08c00'], rs: ['快速', '#f08c00'],
  py: ['普通', '#2f9e44'], json: ['普通', '#2f9e44'], html: ['普通', '#2f9e44'],
};
const TYPE_DEFAULT = ['各停', '#1971c2'];
const DEFAULT_TICKER = '本日も Signboard をご利用くださいまして、ありがとうございます。　この案内板は、開いているタブを表示しています。';
const FONT = '"Hiragino Kaku Gothic ProN","Yu Gothic UI",sans-serif';

function stripExt(n) { const i = n.lastIndexOf('.'); return i > 0 ? n.slice(0, i) : n; }
function hasCjk(t) { return /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(t); }
function destName(name) { const b = stripExt(name); return hasCjk(b) ? b : b.toUpperCase(); }
function hhmm(ms) { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function clockNow() { const d = new Date(); return [d.getHours(), d.getMinutes()].map((v) => String(v).padStart(2, '0')).join(':'); }

const canvas = document.getElementById('led');
const ctx = canvas.getContext('2d');
const compose = document.createElement('canvas');
compose.height = H;
const cctx = compose.getContext('2d', { willReadFrequently: true });
const base = document.createElement('canvas');
/* Coverage sampler: the composed scene is downscaled into a COLS x H_DOTS
   canvas (browser filtering averages each dot's block), so a dot lights
   by how much of it the glyph actually covers — strokes stop dropping
   out the way they did with single-centre-pixel sampling. */
const samp = document.createElement('canvas');
const sctx = samp.getContext('2d', { willReadFrequently: true });

let pitch = 6, radius = 2;
function layout() {
  const w = Math.max(160, canvas.clientWidth || document.body.clientWidth - 16);
  COLS = Math.max(64, Math.min(150, Math.round(w / 5)));
  W = COLS * SCALE;
  if (compose.width !== W) compose.width = W;
  if (samp.width !== COLS) { samp.width = COLS; samp.height = H_DOTS; }
  pitch = w / COLS;
  radius = pitch * 0.33;
  canvas.width = Math.round(w);
  canvas.height = Math.round(pitch * H_DOTS);
  base.width = canvas.width; base.height = canvas.height;
  const b = base.getContext('2d');
  b.fillStyle = '#060607'; b.fillRect(0, 0, base.width, base.height);
  b.fillStyle = '#1b1116';
  for (let y = 0; y < H_DOTS; y++) for (let x = 0; x < COLS; x++) {
    b.beginPath(); b.arc((x + 0.5) * pitch, (y + 0.5) * pitch, radius, 0, 7); b.fill();
  }
}

function fitText(text, maxPx) {
  if (cctx.measureText(text).width <= maxPx) return text;
  const chars = [...text];
  while (chars.length > 2) {
    const head = Math.ceil(chars.length * 0.55), tail = Math.floor(chars.length * 0.45);
    const cand = chars.slice(0, head).join('') + '…' + chars.slice(chars.length - tail).join('');
    if (cctx.measureText(cand).width <= maxPx) return cand;
    chars.splice(Math.floor(chars.length / 2), 1);
  }
  return chars.join('');
}

let rows = [];
let prevByKey = new Map();
let currentSet = 0;
let lastSetChange = Date.now();
let lastEventAt = 0;
let tickerText = DEFAULT_TICKER;
let tickerOffset = null; // null = start at right edge
let announceUntilDone = false;

function sets() { return Math.max(1, Math.ceil(rows.length / SET_SIZE)); }
function jumpToKey(key) {
  const idx = rows.findIndex((r) => r.key === key);
  if (idx < 0) return;
  const s = Math.floor(idx / SET_SIZE);
  if (s !== currentSet) { currentSet = s; lastSetChange = Date.now(); }
}
function announce(text) {
  tickerText = text;
  tickerOffset = null;
  announceUntilDone = true;
}
function statusOf(r, blinkOn) {
  if (r.status === 'delayed') return blinkOn ? ['遅延', '#ff3b30'] : ['', ''];
  if (r.status === 'cancelled') return ['運休', '#ff3b30'];
  if (r.status === 'arrived') return ['到着', '#39e75f'];
  return ['', ''];
}

function composeScene(now) {
  cctx.clearRect(0, 0, W, H);
  cctx.textBaseline = 'alphabetic';
  /* header */
  cctx.fillStyle = '#ffb03a';
  cctx.font = 'bold 38px ' + FONT;
  cctx.fillText('出発案内', 2, 40);
  cctx.fillStyle = '#39e75f';
  cctx.font = 'bold 34px ui-monospace,Menlo,monospace';
  const ck = clockNow();
  cctx.fillText(ck, W - cctx.measureText(ck).width - 2, 40);
  /* ticker, directly under the header so it is never cut off */
  const tickerY = HEADER_D * SCALE;
  cctx.fillStyle = '#ffa02e';
  cctx.font = 'bold 42px ' + FONT;
  const tw = cctx.measureText(tickerText).width;
  if (tickerOffset === null) tickerOffset = W;
  cctx.fillText(tickerText, tickerOffset, tickerY + 43);
  tickerOffset -= 3;
  if (tickerOffset < -tw) {
    tickerOffset = null;
    if (announceUntilDone) { tickerText = DEFAULT_TICKER; announceUntilDone = false; }
  }
  /* train rows */
  const blinkOn = Math.floor(now / 530) % 2 === 0;
  const rowsY = (HEADER_D + TICKER_D) * SCALE;
  const slice = rows.slice(currentSet * SET_SIZE, currentSet * SET_SIZE + SET_SIZE);
  const g = geom();
  slice.forEach((r, i) => {
    const y0 = rowsY + i * ROW_D * SCALE;
    const baseLine = y0 + 44;
    const [label, color] = TYPE_BY_EXT[r.ext] || TYPE_DEFAULT;
    const [st, sc] = statusOf(r, blinkOn);
    /* layout: [chip][destination ...][time][status?] */
    cctx.font = 'bold ' + g.timeFont + 'px ui-monospace,Menlo,monospace';
    const t = hhmm(r.mtime);
    const timeW = cctx.measureText(t).width;
    const timeEnd = st ? W - g.statusW - 4 : W - 2;
    const timeX = timeEnd - timeW;
    cctx.fillStyle = color;
    cctx.beginPath();
    cctx.roundRect(2, y0 + 6, g.chipW, g.chipH, 8);
    cctx.fill();
    cctx.fillStyle = '#ffffff';
    cctx.font = 'bold ' + g.chipFont + 'px ' + FONT;
    const lw = cctx.measureText(label).width;
    cctx.fillText(label, 2 + (g.chipW - lw) / 2, y0 + 40);
    cctx.fillStyle = '#ffb03a';
    cctx.font = 'bold ' + g.destFont + 'px ' + FONT;
    cctx.fillText(fitText(destName(r.name), timeX - g.destX - 8), g.destX, baseLine);
    cctx.fillStyle = '#39e75f';
    cctx.font = 'bold ' + g.timeFont + 'px ui-monospace,Menlo,monospace';
    cctx.fillText(t, timeX, baseLine);
    if (st) {
      cctx.fillStyle = sc;
      cctx.font = 'bold ' + g.statusFont + 'px ' + FONT;
      cctx.fillText(st, W - 2 - cctx.measureText(st).width, baseLine);
    }
  });
}

function draw(now) {
  composeScene(now);
  sctx.clearRect(0, 0, COLS, H_DOTS);
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(compose, 0, 0, COLS, H_DOTS);
  const img = sctx.getImageData(0, 0, COLS, H_DOTS).data;
  ctx.drawImage(base, 0, 0);
  /* pass 0: well-covered dots at full brightness; pass 1: partial
     coverage at half brightness (the anti-aliased edge of the glyph) */
  for (let pass = 0; pass < 2; pass++) {
    const byColor = new Map();
    for (let dy = 0; dy < H_DOTS; dy++) {
      for (let dx = 0; dx < COLS; dx++) {
        const px = dx + dy * COLS;
        const a = img[px * 4 + 3];
        const strong = a > 165;
        if (pass === 0 ? !strong : (a <= 55 || strong)) continue;
        const key = (img[px * 4] << 16) | (img[px * 4 + 1] << 8) | img[px * 4 + 2];
        if (!byColor.has(key)) byColor.set(key, []);
        byColor.get(key).push(dx, dy);
      }
    }
    ctx.globalAlpha = pass === 0 ? 1 : 0.42;
    for (const [key, pts] of byColor) {
      ctx.fillStyle = 'rgb(' + (key >> 16) + ',' + ((key >> 8) & 255) + ',' + (key & 255) + ')';
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) {
        ctx.moveTo((pts[i] + 0.5) * pitch + radius, (pts[i + 1] + 0.5) * pitch);
        ctx.arc((pts[i] + 0.5) * pitch, (pts[i + 1] + 0.5) * pitch, radius, 0, 7);
      }
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  if (sets() > 1) {
    for (let s = 0; s < sets(); s++) {
      ctx.beginPath();
      ctx.arc(canvas.width - 10 - (sets() - 1 - s) * 12, canvas.height - 8, s === currentSet ? 3.4 : 2.2, 0, 7);
      ctx.fillStyle = s === currentSet ? '#ffb03a' : '#3a3a40';
      ctx.fill();
    }
  }
}

setInterval(() => {
  if (document.hidden) return;
  const now = Date.now();
  if (sets() > 1 && now - lastSetChange >= SET_SWITCH_MS && now - lastEventAt >= SET_SWITCH_MS) {
    currentSet = (currentSet + 1) % sets();
    lastSetChange = now;
  }
  draw(now);
}, 66);

window.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg) return;
  if (msg.type === 'state') {
    layout(); // the section may have been resized since load
    const before = prevByKey;
    rows = msg.rows || [];
    for (const r of rows) {
      const prev = before.get(r.key);
      if (prev && prev.status !== r.status && r.status === 'arrived') {
        lastEventAt = Date.now(); jumpToKey(r.key);
        announce('まもなく ' + destName(r.name) + ' が到着します');
      } else if ((!prev && r.status === 'cancelled') || (prev && prev.status !== r.status && r.status === 'cancelled')) {
        lastEventAt = Date.now(); jumpToKey(r.key);
        announce(destName(r.name) + ' は運休となりました');
      }
    }
    if (currentSet >= sets()) currentSet = sets() - 1;
    prevByKey = new Map(rows.map((r) => [r.key, r]));
  } else if (msg.type === 'event' && msg.key) {
    lastEventAt = Date.now();
    jumpToKey(msg.key);
  }
});

let resizeAt = 0;
window.addEventListener('resize', () => {
  const now = Date.now();
  if (now - resizeAt < 150) return;
  resizeAt = now;
  layout();
});

layout();
vscodeApi.postMessage({ type: 'ready' });
