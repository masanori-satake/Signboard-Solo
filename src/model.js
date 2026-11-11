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
function boardName(fileName, tiles) {
  return truncMid(stripExt(fileName), tiles).padEnd(tiles, ' ');
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

function chunkPages(count, perPage) {
  if (count <= 0 || perPage <= 0) return 1;
  return Math.max(1, Math.ceil(count / perPage));
}

function pageOfIndex(index, perPage) {
  if (perPage <= 0) return 0;
  return Math.floor(index / perPage);
}

function hhmm(ms) {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
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
  chunkPages,
  pageOfIndex,
  hhmm,
};
