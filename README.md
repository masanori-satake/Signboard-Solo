# Signboard-Solo

Your open tabs, shown as an airport split-flap arrivals board. It does nothing useful, on purpose — it just lives in the Explorer and flaps, quietly, whenever your files change.

開いているタブを、空港の到着案内板（ソラリー式のパタパタ）で表示する拡張です。実用性はありません。それが目的です。

## Placement / 置き場所

The board is a section **inside the Explorer**, next to the file tree — not a separate activity-bar panel. You keep the Explorer open to work, so the board stays in your peripheral vision instead of being a place you have to visit. If you prefer it always on screen, drag the section's header to the secondary side bar (right side) or the panel; VS Code remembers the placement.

盤面は専用パネルではなく、**エクスプローラーの中のセクション**です。作業中はエクスプローラーを開いたままにするので、盤面が「見に行く場所」ではなく「視界の端で動くもの」になります。常時表示したい場合は、セクションの見出しを右サイドバーやパネルへドラッグしてください（配置は保持されます）。

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
