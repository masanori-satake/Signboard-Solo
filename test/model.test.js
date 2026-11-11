'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CONFIG, extOf, stripExt, hasCjk, truncMid, boardName, tilesFor, statusFor, chunkPages, pageOfIndex, autoModeForWidth, parentDirName,
} = require('../src/model');

test('extOf takes the last extension, lowercased', () => {
  assert.equal(extOf('extension.ts'), 'ts');
  assert.equal(extOf('archive.TAR.GZ'), 'gz');
  assert.equal(extOf('Makefile'), '');
  assert.equal(extOf('.gitignore'), '');
});

test('stripExt removes only the final extension', () => {
  assert.equal(stripExt('extension.ts'), 'extension');
  assert.equal(stripExt('package.json'), 'package');
  assert.equal(stripExt('scrape.test.py'), 'scrape.test');
  assert.equal(stripExt('.env'), '.env');
  assert.equal(stripExt('README'), 'README');
});

test('hasCjk detects Japanese text', () => {
  assert.equal(hasCjk('会議メモ'), true);
  assert.equal(hasCjk('extension'), false);
});

test('truncMid keeps head and tail', () => {
  assert.equal(truncMid('skillMapProvider', 10), 'skill…ider');
  assert.equal(truncMid('skillMapProvider', 14), 'skillMap…vider');
  assert.equal(truncMid('short', 10), 'short');
  assert.equal([...truncMid('a'.repeat(30), 16)].length, 16);
});

test('boardName is always exactly the tile count', () => {
  assert.equal([...boardName('extension.ts', 16)].length, 16);
  assert.equal(boardName('app.js', 16), 'APP' + ' '.repeat(13));
  assert.equal([...boardName('プロジェクト進捗管理表.md', 10)].length, 10);
});

test('boardName uppercases Latin names (flap wheels are uppercase-only)', () => {
  assert.equal(boardName('extension.ts', 16), 'EXTENSION' + ' '.repeat(7));
  assert.equal(boardName('会議メモ.md', 10), '会議メモ' + ' '.repeat(6));
});

test('tilesFor picks CJK and mini counts', () => {
  assert.equal(tilesFor('extension.ts', false), CONFIG.nameTilesLatin);
  assert.equal(tilesFor('会議メモ.md', false), CONFIG.nameTilesCjk);
  assert.equal(tilesFor('extension.ts', true), CONFIG.nameTilesLatinMini);
  assert.equal(tilesFor('会議メモ.md', true), CONFIG.nameTilesCjkMini);
});

test('statusFor precedence: cancelled > arrived > delayed > ontime', () => {
  const now = 100000;
  assert.equal(statusFor({ cancelled: true, savedAt: now, dirty: true }, now), 'cancelled');
  assert.equal(statusFor({ savedAt: now - 1000, dirty: true }, now), 'arrived');
  assert.equal(statusFor({ savedAt: now - CONFIG.arrivalMs - 1, dirty: true }, now), 'delayed');
  assert.equal(statusFor({ savedAt: now - CONFIG.arrivalMs - 1, dirty: false }, now), 'ontime');
  assert.equal(statusFor({}, now), 'ontime');
});

test('paging helpers', () => {
  assert.equal(chunkPages(0, 4), 1);
  assert.equal(chunkPages(7, 3), 3);
  assert.equal(chunkPages(6, 3), 2);
  assert.equal(pageOfIndex(5, 3), 1);
  assert.equal(pageOfIndex(0, 3), 0);
});

test('parentDirName takes the containing directory from a URI path', () => {
  assert.equal(parentDirName('/home/satake/Signboard-Solo/src/extension.js'), 'src');
  assert.equal(parentDirName('/c:/work/project/README.md'), 'project');
  assert.equal(parentDirName('/file.ts'), '');
  assert.equal(parentDirName(''), '');
});

test('auto mode uses flap below 520px and LED at 520px and wider', () => {
  assert.equal(autoModeForWidth(519), 'flap');
  assert.equal(autoModeForWidth(CONFIG.autoLedMinWidth), 'led');
  assert.equal(autoModeForWidth(1200), 'led');
  assert.equal(autoModeForWidth(Number.NaN), 'flap');
});
