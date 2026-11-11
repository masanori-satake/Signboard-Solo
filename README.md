# Signboard-Solo

Your open tabs, shown as an airport split-flap arrivals board. It does nothing useful, on purpose — it just sits in the sidebar and flaps, quietly, whenever your files change.

開いているタブを、空港の到着案内板（ソラリー式のパタパタ）で表示する拡張です。実用性はありません。それが目的です。

## What it does / 何をするものか

- One row per open tab: a language logo (in place of the airline logo), the file name **without** its extension, and its last-modified time.
- Save a file and its time flaps over to the new time, with the remarks plate flipping to ARRIVED / 到着 for a few seconds.
- Unsaved changes show as DELAYED / 遅延. Closing a tab leaves its row as CANCELLED / 欠航 for a few seconds before it disappears.
- Reordering tabs reorders the board. Adding a tab shifts the rows below it down with a flap.
- Too many flights for the height? The whole board page-flips to the next set every 18 seconds — and jumps straight to the page of a flight that just arrived.
- The header clock is a 7-segment LED clock whose colon blinks every second.
- Narrow sidebar? Rows restack into two tiers instead of truncating.

Phase 1 is the split-flap mode. A station LED dot-matrix mode (Phase 2) and automatic mode switching by view width (Phase 3) are planned; until then, the `signboard.mode` setting falls back to flap.

## Principles / 原則

- 100% local, no tracking, no network, no dependencies.
- Blank flap tiles never flip. One ticker drives every tile. Nothing renders while the board is hidden.
- The board is for looking at. Rows are not buttons and do not open files.

## Settings / 設定

- `signboard.mode`: `flap` (default) / `led` / `auto` — led and auto fall back to flap until their phases land.
