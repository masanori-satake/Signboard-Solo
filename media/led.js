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
const TICKER_D = 9;          // announcement line (about 2/3 of the old 13)
const ROW_D = 12;            // one train row
const PAD_D = 2;
const H_DOTS = HEADER_D + TICKER_D + SET_SIZE * ROW_D + PAD_D; // 71
const H = H_DOTS * SCALE;
/* Element sizes in compose px, two sets: at Explorer-section widths the
   wide set would leave the destination only a character or two, so the
   narrow set shrinks the chip, time and status zones first. The chip is
   kept as large as the row allows: two kanji in too few dots melt into
   a blob, which is what the chip sizes guard against. */
function geom() {
  /* English type labels (LTD EXP, ALL-STOPS) are wider than two kanji,
     so the chip grows in English and the destination shifts right. */
  if (COLS >= 84) {
    return LANG_JA
      ? { chipW: 76, chipH: 36, chipFont: 30, chipBase: 35, destX: 88, destFont: 34, timeFont: 30, statusFont: 26, statusW: 68, baseLine: 37 }
      : { chipW: 118, chipH: 36, chipFont: 30, chipBase: 35, destX: 130, destFont: 34, timeFont: 30, statusFont: 26, statusW: 68, baseLine: 37 };
  }
  return LANG_JA
    ? { chipW: 60, chipH: 36, chipFont: 26, chipBase: 33, destX: 68, destFont: 30, timeFont: 26, statusFont: 22, statusW: 52, baseLine: 36 }
    : { chipW: 92, chipH: 36, chipFont: 26, chipBase: 33, destX: 102, destFont: 30, timeFont: 26, statusFont: 22, statusW: 52, baseLine: 36 };
}

let COLS = 76;               // dots across, adapted in layout()
let W = COLS * SCALE;        // compose width in px

/* [Japanese label, English label, colour] — the board follows the
   VS Code display language, like the flap board does. */
const TYPE_BY_EXT = {
  ts: ['特急', 'LTD EXP', '#e03131'], go: ['特急', 'LTD EXP', '#e03131'],
  js: ['快速', 'RAPID', '#f08c00'], css: ['快速', 'RAPID', '#f08c00'], rs: ['快速', 'RAPID', '#f08c00'],
  py: ['普通', 'LOCAL', '#2f9e44'], json: ['普通', 'LOCAL', '#2f9e44'], html: ['普通', 'LOCAL', '#2f9e44'],
};
const TYPE_DEFAULT = ['各停', 'ALL-STOPS', '#1971c2'];
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
let tickerText = defaultTicker();
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
  if (r.status === 'delayed') return blinkOn ? [LANG_JA ? '遅延' : 'DELAYED', '#ff3b30'] : ['', ''];
  if (r.status === 'cancelled') return [LANG_JA ? '運休' : 'CANCELLED', '#ff3b30'];
  if (r.status === 'arrived') return [LANG_JA ? '到着' : 'ARRIVED', '#39e75f'];
  return ['', ''];
}

function composeScene(now) {
  cctx.clearRect(0, 0, W, H);
  cctx.textBaseline = 'alphabetic';
  /* header */
  cctx.fillStyle = '#39e75f';
  cctx.font = 'bold 34px ui-monospace,Menlo,monospace';
  const ck = clockNow();
  const ckW = cctx.measureText(ck).width;
  cctx.fillStyle = '#ffb03a';
  const headText = LANG_JA ? '出発案内' : 'DEPARTURES';
  let headFont = LANG_JA ? 38 : 30;
  cctx.font = 'bold ' + headFont + 'px ' + FONT;
  while (headFont > 16 && cctx.measureText(headText).width > W - ckW - 14) {
    headFont -= 2;
    cctx.font = 'bold ' + headFont + 'px ' + FONT;
  }
  cctx.fillText(headText, 2, 40);
  cctx.fillStyle = '#39e75f';
  cctx.font = 'bold 34px ui-monospace,Menlo,monospace';
  cctx.fillText(ck, W - ckW - 2, 40);
  /* ticker, directly under the header so it is never cut off */
  const tickerY = HEADER_D * SCALE;
  cctx.fillStyle = '#ffa02e';
  cctx.font = 'bold 28px ' + FONT;
  const tw = cctx.measureText(tickerText).width;
  if (tickerOffset === null) tickerOffset = W;
  cctx.fillText(tickerText, tickerOffset, tickerY + 31);
  tickerOffset -= 2;
  if (tickerOffset < -tw) {
    tickerOffset = null;
    if (announceUntilDone) { tickerText = defaultTicker(); announceUntilDone = false; }
  }
  /* train rows */
  const blinkOn = Math.floor(now / 530) % 2 === 0;
  const rowsY = (HEADER_D + TICKER_D) * SCALE;
  const slice = rows.slice(currentSet * SET_SIZE, currentSet * SET_SIZE + SET_SIZE);
  const g = geom();
  slice.forEach((r, i) => {
    const y0 = rowsY + i * ROW_D * SCALE;
    const baseLine = y0 + g.baseLine;
    const [labelJa, labelEn, color] = TYPE_BY_EXT[r.ext] || TYPE_DEFAULT;
    const label = LANG_JA ? labelJa : labelEn;
    const [st, sc] = statusOf(r, blinkOn);
    /* layout: [chip][destination ...][time][status?] */
    cctx.font = 'bold ' + g.timeFont + 'px ui-monospace,Menlo,monospace';
    const t = hhmm(r.mtime);
    const timeW = cctx.measureText(t).width;
    /* English status words are wider than the reserved zone; reserve
       what the word actually measures so it never overruns the time. */
    let statusW = g.statusW;
    if (st) {
      cctx.font = 'bold ' + g.statusFont + 'px ' + FONT;
      statusW = Math.max(g.statusW, cctx.measureText(st).width + 6);
    }
    const timeEnd = st ? W - statusW - 4 : W - 2;
    const timeX = timeEnd - timeW;
    cctx.fillStyle = color;
    cctx.beginPath();
    cctx.roundRect(2, y0 + 6, g.chipW, g.chipH, 8);
    cctx.fill();
    cctx.fillStyle = '#ffffff';
    /* Shrink the chip label until it fits (mainly for English words). */
    let chipFont = g.chipFont;
    cctx.font = 'bold ' + chipFont + 'px ' + FONT;
    while (chipFont > 12 && cctx.measureText(label).width > g.chipW - 8) {
      chipFont -= 2;
      cctx.font = 'bold ' + chipFont + 'px ' + FONT;
    }
    const lw = cctx.measureText(label).width;
    cctx.fillText(label, 2 + (g.chipW - lw) / 2, y0 + g.chipBase);
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
  /* Dots are binary, like a real LED board: coverage past the threshold
     lights the dot at full brightness, anything less stays dark. The
     earlier half-brightness pass for partial coverage read as fuzz and
     made small glyphs harder to read, so it is gone. The threshold is
     low enough to keep thin digit strokes, and a final pass fills a
     one-dot gap when the dots on both sides share a colour: that is a
     sampling notch in a stroke, not a real gap in the glyph. */
  const lit = new Uint8Array(COLS * H_DOTS);
  const dotKey = new Int32Array(COLS * H_DOTS).fill(-1);
  for (let dy = 0; dy < H_DOTS; dy++) {
    for (let dx = 0; dx < COLS; dx++) {
      const px = dx + dy * COLS;
      if (img[px * 4 + 3] <= 84) continue;
      lit[px] = 1;
      dotKey[px] = (img[px * 4] << 16) | (img[px * 4 + 1] << 8) | img[px * 4 + 2];
    }
  }
  for (let dy = 1; dy < H_DOTS - 1; dy++) {
    for (let dx = 1; dx < COLS - 1; dx++) {
      const px = dx + dy * COLS;
      if (lit[px]) continue;
      const horizontal = dotKey[px - 1] >= 0 && dotKey[px - 1] === dotKey[px + 1];
      const vertical = dotKey[px - COLS] >= 0 && dotKey[px - COLS] === dotKey[px + COLS];
      if (horizontal || vertical) {
        lit[px] = 1;
        dotKey[px] = horizontal ? dotKey[px - 1] : dotKey[px - COLS];
      }
    }
  }
  const byColor = new Map();
  for (let dy = 0; dy < H_DOTS; dy++) {
    for (let dx = 0; dx < COLS; dx++) {
      const px = dx + dy * COLS;
      if (!lit[px]) continue;
      const key = dotKey[px];
      if (!byColor.has(key)) byColor.set(key, []);
      byColor.get(key).push(dx, dy);
    }
  }
  for (const [key, pts] of byColor) {
    ctx.fillStyle = 'rgb(' + (key >> 16) + ',' + ((key >> 8) & 255) + ',' + (key & 255) + ')';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      ctx.moveTo((pts[i] + 0.5) * pitch + radius, (pts[i + 1] + 0.5) * pitch);
      ctx.arc((pts[i] + 0.5) * pitch, (pts[i + 1] + 0.5) * pitch, radius, 0, 7);
    }
    ctx.fill();
  }
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
    LANG_JA = String(msg.lang || '').toLowerCase().startsWith('ja');
    lineName = msg.line || '';
    if (!announceUntilDone && tickerText !== defaultTicker()) {
      // The line changed (a different first file): restart the greeting.
      tickerText = defaultTicker();
      tickerOffset = null;
    }
    const before = prevByKey;
    rows = msg.rows || [];
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
    if (currentSet >= sets()) currentSet = sets() - 1;
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
  layout();
});

layout();
reportWidth();
vscodeApi.postMessage({ type: 'ready' });
