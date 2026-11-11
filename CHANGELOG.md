# Changelog

All notable changes to Signboard-Solo are documented here.
変更内容はここに記録します。

## [0.1.0] - 2026-11-11

- Initial Phase 1 build: data layer over VS Code tabs + split-flap arrivals board in a sidebar view.
  - Rows follow tab order; language-logo tiles; file names without extensions on fixed-width flap tiles (blank tiles never flip); last-modified times; remarks as a single word plate (ARRIVED / DELAYED / CANCELLED, Japanese or English by UI language).
  - Save / edit / open / close / reorder events flap accordingly; closed tabs linger as CANCELLED.
  - Width tiers (wide single line, narrow/mini two-tier restack, middle-truncated names) and height paging (whole-board page flips every 18s, jump to the page of a flight that just changed).
  - 7-segment LED header clock with a colon blinking every second.
  - `signboard.mode` setting scaffold (led / auto fall back to flap until Phase 2 / 3).
- 初版（Phase 1）: データ層とフラップ式到着案内板を実装。
