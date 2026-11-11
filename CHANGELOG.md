# Changelog

All notable changes to Signboard-Solo are documented here.
変更内容はここに記録します。

## [0.3.0] - 2026-11-12

- Phase 2: LED mode. Set `signboard.mode` to `led` and the same tabs render as a station dot-matrix departure board — train type from the language （特急/快速/普通/各停）, destination without extension, departure time = last modified, 遅延 blinking, closed tabs linger as 運休， and a scrolling announcement line (on save: 「まもなく ○○ が到着します」). Screens of 4 trains switch every 8 seconds and jump to the screen of a train that just changed. Changing the setting swaps the renderer live.
- The Explorer section is now named "Signboard".
- Flap board: Latin file names are shown in UPPERCASE, like real split-flap character wheels (mixed case read as two different fonts).
- Phase 2: LEDモードを追加（`signboard.mode: led`）。セクション名を "Signboard" に変更。フラップ盤面の英字を大文字化。

## [0.2.0] - 2026-11-12

- Moved the board from its own activity-bar container into the Explorer as a section, so it stays visible while opening files (the board is for peripheral viewing, not for visiting). Users can still drag the section to the secondary side bar or panel.
- 盤面を専用コンテナからエクスプローラーのセクションへ移設。ファイルを開く作業をしながら眺められるようにした。

## [0.1.0] - 2026-11-11

- Initial Phase 1 build: data layer over VS Code tabs + split-flap arrivals board in a sidebar view.
  - Rows follow tab order; language-logo tiles; file names without extensions on fixed-width flap tiles (blank tiles never flip); last-modified times; remarks as a single word plate (ARRIVED / DELAYED / CANCELLED, Japanese or English by UI language).
  - Save / edit / open / close / reorder events flap accordingly; closed tabs linger as CANCELLED.
  - Width tiers (wide single line, narrow/mini two-tier restack, middle-truncated names) and height paging (whole-board page flips every 18s, jump to the page of a flight that just changed).
  - 7-segment LED header clock with a colon blinking every second.
  - `signboard.mode` setting scaffold (led / auto fall back to flap until Phase 2 / 3).
- 初版（Phase 1）: データ層とフラップ式到着案内板を実装。
