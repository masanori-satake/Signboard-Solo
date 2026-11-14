'use strict';

/* Pure board logic for Signboard-Solo. No vscode dependency, so it can be
   unit-tested with node --test. The webview keeps a small display-side copy
   of the name helpers in media/board.js. */

// Initial constants (design memo section 11, E5). Tune in one place.
const CONFIG = {
  arrivalMs: 4000,        // how long a saved row says ARRIVED / 到着
  cancelLingerMs: 3500,   // how long a closed tab's row stays as CANCELLED / 欠航
  pageRotateMs: 18000,    // page-flip rotation interval
  nameTilesLatin: 16,     // fixed flap tiles for Latin names
  nameTilesCjk: 10,       // fixed flap tiles for CJK names (wider tiles)
  nameTilesLatinMini: 10, // extreme narrow tier
  nameTilesCjkMini: 7,
  autoLedMinWidth: 520,   // Phase 3: auto uses LED at this width and wider
};

function extOf(fileName) {
  const i = fileName.lastIndexOf('.');
  return i > 0 ? fileName.slice(i + 1).toLowerCase() : '';
}

// The board never shows the extension: the language logo already says it.
function stripExt(fileName) {
  const i = fileName.lastIndexOf('.');
  return i > 0 ? fileName.slice(0, i) : fileName;
}

function hasCjk(text) {
  return /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(text);
}

// Middle truncation: the head and tail carry the identity of a file name;
// the extension is already told by the logo, and siblings usually share a
// prefix (skillMapProvider vs skillMapTree).
function truncMid(text, max) {
  const chars = [...text];
  if (chars.length <= max) return text;
  const head = Math.ceil((max - 1) * 0.55);
  const tail = Math.floor((max - 1) * 0.45);
  return chars.slice(0, head).join('') + '…' + chars.slice(chars.length - tail).join('');
}

// Fixed-width board name: truncated to the tile count, then blank-padded.
// Blank tiles exist for layout only and never flip.
// Latin letters are shown in UPPERCASE — always, even inside a name that
// also contains Japanese: real split-flap character wheels are
// uppercase-only, and leaving the Latin part of a mixed name in lowercase
// reads as two different fonts on the tiles. Japanese has no letter case,
// so uppercasing the whole name is safe.
function boardName(fileName, tiles) {
  const base = stripExt(fileName);
  const shown = base.toUpperCase();
  return truncMid(shown, tiles).padEnd(tiles, ' ');
}

function tilesFor(fileName, mini) {
  const cjk = hasCjk(stripExt(fileName));
  if (mini) return cjk ? CONFIG.nameTilesCjkMini : CONFIG.nameTilesLatinMini;
  return cjk ? CONFIG.nameTilesCjk : CONFIG.nameTilesLatin;
}

// Status precedence: cancelled (lingering ghost) > arrived (just saved) >
// delayed (dirty) > ontime. Pure: pass timestamps in.
function statusFor(entry, now) {
  if (entry.cancelled) return 'cancelled';
  if (entry.savedAt && now - entry.savedAt < CONFIG.arrivalMs) return 'arrived';
  if (entry.dirty) return 'delayed';
  return 'ontime';
}

function hhmm(ms) {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// Name of the directory a file lives in, from its URI path (POSIX-style
// even on Windows). The LED ticker greets riders of "<this>線", named
// after the first file's parent directory.
function parentDirName(uriPath) {
  const parts = String(uriPath).split('/').filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : '';
}

// Phase 3 mode choice: the flap board is the narrow/sidebar form, while
// the LED board is the wide/panel form. The 520px boundary was the
// provisional value recorded when the three-phase plan was decided.
function autoModeForWidth(width) {
  return Number.isFinite(width) && width >= CONFIG.autoLedMinWidth ? 'led' : 'flap';
}

/* Display order for live rows plus lingering CANCELLED ghosts.
   Live keys follow the current tab order. A ghost is not part of that
   order anymore, so it anchors to the first live key that followed it
   in the previous display order and is emitted just before that key;
   ghosts with no live key after them trail at the end. (Numbering live
   rows 0..n and letting a ghost keep its old number collides: closing
   the 2nd of 4 tabs renumbered the 3rd tab to 1, tying with the ghost
   at 1, and the stable sort then showed the ghost one row too low.) */
function mergeOrder(prevOrder, liveOrder, ghostKeys) {
  const liveSet = new Set(liveOrder);
  const prevPos = new Map(prevOrder.map((k, i) => [k, i]));
  const pos = (k) => (prevPos.has(k) ? prevPos.get(k) : Number.MAX_SAFE_INTEGER);
  const ghosts = [...ghostKeys].sort((a, b) => pos(a) - pos(b));
  const anchored = new Map(); // live key -> ghost keys emitted before it
  const trailing = [];
  for (const g of ghosts) {
    const gi = prevPos.has(g) ? prevPos.get(g) : -1;
    let anchor = null;
    if (gi >= 0) {
      for (let j = gi + 1; j < prevOrder.length; j++) {
        if (liveSet.has(prevOrder[j])) { anchor = prevOrder[j]; break; }
      }
    }
    if (anchor) {
      if (!anchored.has(anchor)) anchored.set(anchor, []);
      anchored.get(anchor).push(g);
    } else {
      trailing.push(g);
    }
  }
  const order = [];
  for (const k of liveOrder) {
    if (anchored.has(k)) order.push(...anchored.get(k));
    order.push(k);
  }
  order.push(...trailing);
  return order;
}

module.exports = {
  CONFIG,
  extOf,
  stripExt,
  hasCjk,
  truncMid,
  boardName,
  tilesFor,
  statusFor,
  hhmm,
  autoModeForWidth,
  parentDirName,
  mergeOrder,
};
