'use strict';
/* Signboard-Solo flap board renderer (webview).
   Lightness rules (design memo section 5): blank tiles never flip, one
   central ticker drives all tiles, unchanged glyphs flip only briefly,
   and everything pauses while the view is hidden. */
const vscodeApi = acquireVsCodeApi();

const CONFIG = { pageRotateMs: 18000, nameTilesLatin: 16, nameTilesCjk: 10, nameTilesLatinMini: 10, nameTilesCjkMini: 7 };

let LANG_JA = true;
let REMARKS = {};
let REMARK_WORDS = [];
function setLocale(lang) {
  LANG_JA = !lang || lang.toLowerCase().startsWith('ja');
  REMARKS = LANG_JA
    ? { ontime: '定刻', arrived: '到着', delayed: '遅延', cancelled: '欠航' }
    : { ontime: 'ON TIME', arrived: 'ARRIVED', delayed: 'DELAYED', cancelled: 'CANCELLED' };
  REMARK_WORDS = Object.values(REMARKS);
  document.getElementById('colName').textContent = LANG_JA ? 'ファイル名' : 'FILE';
  document.getElementById('colTime').textContent = LANG_JA ? '最終更新' : 'UPDATED';
  document.getElementById('colRemark').textContent = LANG_JA ? '備考' : 'REMARKS';
}
setLocale('ja');

/* ---------- name helpers (display-side copy of src/model.js) ---------- */
function stripExt(n) { const i = n.lastIndexOf('.'); return i > 0 ? n.slice(0, i) : n; }
function hasCjk(t) { return /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(t); }
function truncMid(text, max) {
  const chars = [...text];
  if (chars.length <= max) return text;
  const head = Math.ceil((max - 1) * 0.55), tail = Math.floor((max - 1) * 0.45);
  return chars.slice(0, head).join('') + '…' + chars.slice(chars.length - tail).join('');
}
function tilesFor(name, mini) {
  const cjk = hasCjk(stripExt(name));
  if (mini) return cjk ? CONFIG.nameTilesCjkMini : CONFIG.nameTilesLatinMini;
  return cjk ? CONFIG.nameTilesCjk : CONFIG.nameTilesLatin;
}
function boardName(name, tiles) {
  const base = stripExt(name);
  const shown = hasCjk(base) ? base : base.toUpperCase(); // flap wheels are uppercase-only
  return truncMid(shown, tiles).padEnd(tiles, ' ');
}
function hhmm(ms) { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

/* ---------- flap engine: one ticker for every tile ---------- */
const SETS = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-#@',
  cjk: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん議事録要件定義設計集計仕様会議顧客売上進捗管理表報告書連絡週次作業画面0123456789._-',
  digit: '0123456789',
};
const FLIP_FRAMES = [
  { transform: 'rotateX(0deg)', filter: 'brightness(1)' },
  { transform: 'rotateX(-70deg)', filter: 'brightness(1.7)', offset: 0.45 },
  { transform: 'rotateX(0deg)', filter: 'brightness(1)' },
];
const FLIP_TIMING = { duration: 130, easing: 'ease-in-out' };
const flapJobs = new Map();
let flapTicker = null;
function ensureFlapTicker() {
  if (flapTicker) return;
  flapTicker = setInterval(() => {
    if (document.hidden) return;
    const now = performance.now();
    for (const [cell, job] of flapJobs) {
      if (now < job.startAt) continue;
      job.steps--;
      if (job.steps <= 0) { cell.textContent = job.target; flapJobs.delete(cell); }
      else {
        cell.textContent = job.set[Math.floor(Math.random() * job.set.length)];
        if (cell.animate) cell.animate(FLIP_FRAMES, FLIP_TIMING);
      }
    }
    if (!flapJobs.size) { clearInterval(flapTicker); flapTicker = null; }
  }, 82);
}
function flapCell(cell, target, set, delay) {
  if (target === ' ') { flapJobs.delete(cell); cell.textContent = ' '; return; }
  const same = cell.textContent === target;
  const steps = same ? 3 : 6 + Math.floor(Math.random() * 5);
  flapJobs.set(cell, { target, set, steps, startAt: performance.now() + delay });
  ensureFlapTicker();
}
function setCells(container, text, flapAll, set) {
  const chars = [...text];
  while (container.children.length < chars.length) {
    const c = document.createElement('span');
    c.className = 'cell'; c.textContent = ' ';
    container.appendChild(c);
  }
  while (container.children.length > chars.length) container.removeChild(container.lastChild);
  chars.forEach((ch, i) => {
    const cell = container.children[i];
    if (flapAll || cell.textContent !== ch) flapCell(cell, ch, set, i * 85);
    else cell.textContent = ch;
  });
}
function setTimeCells(container, ms, flapAll) {
  const t = hhmm(ms);
  const seq = [t[0], t[1], ':', t[3], t[4]];
  if (!container.children.length) {
    seq.forEach((ch) => {
      const c = document.createElement('span');
      c.className = 'cell' + (ch === ':' ? ' colon' : '');
      c.textContent = ch;
      container.appendChild(c);
    });
  }
  seq.forEach((ch, i) => {
    if (ch === ':') return;
    const cell = container.children[i];
    if (flapAll || cell.textContent !== ch) flapCell(cell, ch, SETS.digit, i * 115);
  });
}
/* Remarks: ONE wide plate per row, flipping word by word. */
const remarkTimers = new WeakMap();
function setRemark(container, text, flap) {
  let plate = container.querySelector('.remark-plate');
  if (!plate) {
    plate = document.createElement('span');
    plate.className = 'cell remark-plate';
    container.replaceChildren(plate);
    if (!flap) { plate.textContent = text; plate.dataset.text = text; return; }
    plate.textContent = REMARK_WORDS[Math.floor(Math.random() * REMARK_WORDS.length)];
    plate.dataset.text = '';
  }
  if (!flap || plate.dataset.text === text) { plate.textContent = text; plate.dataset.text = text; return; }
  plate.dataset.text = text;
  if (remarkTimers.has(plate)) { clearInterval(remarkTimers.get(plate)); remarkTimers.delete(plate); }
  const steps = 4 + Math.floor(Math.random() * 3);
  let s = 0;
  const iv = setInterval(() => {
    s++;
    if (plate.animate) plate.animate(FLIP_FRAMES, FLIP_TIMING);
    if (s >= steps) { plate.textContent = text; clearInterval(iv); remarkTimers.delete(plate); }
    else plate.textContent = REMARK_WORDS[Math.floor(Math.random() * REMARK_WORDS.length)];
  }, 165);
  remarkTimers.set(plate, iv);
}

/* ---------- logos (simplified tiles in the MVP; real SVGs pre-release) ---------- */
const LOGOS = {
  ts: ['ts', 'TS'], js: ['js', 'JS'], py: ['py', 'Py'], md: ['md', 'M↓'],
  json: ['json', '{}'], css: ['css', 'CSS'], html: ['html', '</>'], go: ['go', 'Go'],
  rs: ['rs', 'R'], txt: ['txt', 'TXT'],
};
function logoEl(ext) {
  const [cls, text] = LOGOS[ext] || ['generic', (ext || '···').toUpperCase().slice(0, 4)];
  const d = document.createElement('span');
  d.className = 'logo ' + cls;
  d.textContent = text;
  return d;
}

/* ---------- board state + paging ---------- */
const rowsEl = document.getElementById('rows');
const boardEl = document.getElementById('board');
let rows = [];
let prevByKey = new Map();
let currentPage = 0;
let lastPageChange = Date.now();
let lastEventAt = 0;
let tier = 'wide';

function computeTier() {
  const w = window.innerWidth;
  tier = w >= 380 ? 'wide' : w >= 240 ? 'narrow' : 'mini';
  boardEl.dataset.tier = tier;
}
let measuredRowH = 0;
function rowsPerPage() {
  const rowH = measuredRowH || (tier === 'wide' ? 41 : 74);
  // #rows is flex:1, so its clientHeight is exactly the space rows may use.
  const avail = rowsEl.clientHeight || Math.max(rowH, window.innerHeight - 108);
  return Math.max(1, Math.floor(avail / rowH));
}
function pages() { return Math.max(1, Math.ceil(rows.length / rowsPerPage())); }

function rowElFor(r) {
  let row = rowsEl.querySelector('.row[data-key="' + CSS.escape(r.key) + '"]');
  if (!row) {
    row = document.createElement('div');
    row.className = 'row'; row.dataset.key = r.key;
    const lg = document.createElement('span'); lg.dataset.role = 'logo';
    const name = document.createElement('div'); name.className = 'cells name';
    const meta = document.createElement('div'); meta.className = 'meta';
    const time = document.createElement('div'); time.className = 'cells time';
    const rem = document.createElement('div'); rem.className = 'cells remark';
    meta.append(time, rem);
    row.append(lg, name, meta);
    row._name = name; row._time = time; row._rem = rem; row._logo = lg;
  }
  return row;
}

function render(pageChanged) {
  computeTier();
  const per = rowsPerPage();
  const pg = pages();
  if (currentPage >= pg) currentPage = pg - 1;
  const slice = rows.slice(currentPage * per, currentPage * per + per);
  const keep = new Set(slice.map((r) => r.key));
  rowsEl.querySelectorAll('.row').forEach((el) => { if (!keep.has(el.dataset.key)) el.remove(); });
  slice.forEach((r, i) => {
    const row = rowElFor(r);
    rowsEl.appendChild(row);
    const prev = prevByKey.get(r.key);
    const idxChanged = !prev || prev.index !== currentPage * per + i;
    const flapName = pageChanged || idxChanged || !prev || prev.name !== r.name;
    const flapTime = pageChanged || !prev || prev.mtime !== r.mtime;
    const flapRem = pageChanged || !prev || prev.status !== r.status;
    row.className = 'row st-' + r.status + (r.active ? ' active' : '');
    row._logo.replaceChildren(logoEl(r.ext));
    const tiles = tilesFor(r.name, tier === 'mini');
    const cjk = hasCjk(stripExt(r.name));
    row._name.classList.toggle('cjk', cjk);
    setCells(row._name, boardName(r.name, tiles), flapName, cjk ? SETS.cjk : SETS.latin);
    setTimeCells(row._time, r.mtime, flapTime);
    setRemark(row._rem, REMARKS[r.status] || REMARKS.ontime, flapRem);
  });
  // Measure a real row and redo the slice once if the page size was wrong;
  // measuredRowH is then set, so the corrective pass cannot loop.
  const firstRow = rowsEl.querySelector('.row');
  if (firstRow && firstRow.offsetHeight > 0 && firstRow.offsetHeight !== measuredRowH) {
    measuredRowH = firstRow.offsetHeight;
    if (rowsPerPage() !== per) { render(pageChanged); return; }
  }
  document.getElementById('pageInfo').textContent = pg > 1 ? 'PAGE ' + (currentPage + 1) + ' / ' + pg : '';
  document.getElementById('flightCount').textContent = rows.length
    ? (LANG_JA ? rows.length + ' 便' : rows.length + (rows.length === 1 ? ' FLIGHT' : ' FLIGHTS')) : '';
  prevByKey = new Map(rows.map((r, i) => [r.key, { ...r, index: i }]));
}

function jumpToKey(key) {
  const idx = rows.findIndex((r) => r.key === key);
  if (idx < 0) return;
  const p = Math.floor(idx / rowsPerPage());
  if (p !== currentPage) {
    currentPage = p;
    lastPageChange = Date.now();
    render(true);
  }
}

window.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg) return;
  if (msg.type === 'state') {
    setLocale(msg.lang);
    const before = prevByKey;
    rows = msg.rows || [];
    // If a just-saved or just-cancelled row sits on another page, jump to it.
    let jumpKey = null;
    for (const r of rows) {
      const prev = before.get(r.key);
      if (prev && (prev.status !== r.status || prev.mtime !== r.mtime) &&
          (r.status === 'arrived' || r.status === 'cancelled')) { jumpKey = r.key; break; }
      if (!prev && r.status === 'cancelled') { jumpKey = r.key; break; }
    }
    render(false);
    if (jumpKey) { lastEventAt = Date.now(); jumpToKey(jumpKey); }
  } else if (msg.type === 'event' && msg.key) {
    lastEventAt = Date.now();
    jumpToKey(msg.key);
  }
});

let wheelAt = 0;
window.addEventListener('wheel', (e) => {
  const now = Date.now();
  if (now - wheelAt < 350 || pages() <= 1) return;
  wheelAt = now;
  currentPage = (currentPage + (e.deltaY > 0 ? 1 : -1) + pages()) % pages();
  lastPageChange = now;
  render(true);
}, { passive: true });

let resizeAt = 0;
window.addEventListener('resize', () => {
  const now = Date.now();
  if (now - resizeAt < 120) return;
  resizeAt = now;
  render(false);
});

// Page rotation: only when nothing worth watching just happened.
setInterval(() => {
  if (document.hidden || pages() <= 1) return;
  const now = Date.now();
  if (now - lastPageChange >= CONFIG.pageRotateMs && now - lastEventAt >= CONFIG.pageRotateMs) {
    currentPage = (currentPage + 1) % pages();
    lastPageChange = now;
    render(true);
  }
}, 1000);

/* ---------- header clock: 7-segment, colon blinks every second ---------- */
const SEG_MAP = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
const clockEl = document.getElementById('clock');
const clockDigits = [];
for (let i = 0; i < 8; i++) {
  if (i === 2 || i === 5) {
    const col = document.createElement('span');
    col.className = 'seg-colon';
    col.innerHTML = '<i class="cdot"></i><i class="cdot"></i>';
    clockEl.appendChild(col);
  } else {
    const dig = document.createElement('span');
    dig.className = 'seg-digit';
    for (const s of 'abcdefg') {
      const seg = document.createElement('i');
      seg.className = 'seg seg-' + s;
      dig.appendChild(seg);
    }
    clockEl.appendChild(dig);
    clockDigits.push(dig);
  }
}
function tickClock() {
  const d = new Date();
  const parts = [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join('');
  [...parts].forEach((ch, i) => {
    const on = SEG_MAP[ch];
    clockDigits[i].querySelectorAll('.seg').forEach((seg) => {
      const name = [...seg.classList].find((c) => c.startsWith('seg-')).slice(4);
      seg.classList.toggle('on', on.includes(name));
    });
  });
  const blink = d.getSeconds() % 2 === 0;
  clockEl.querySelectorAll('.cdot').forEach((c) => c.classList.toggle('on', blink));
}
setInterval(tickClock, 1000);
tickClock();

computeTier();
vscodeApi.postMessage({ type: 'ready' });
