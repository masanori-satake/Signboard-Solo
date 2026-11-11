# Signboard-Solo

[![Version](https://img.shields.io/badge/version-v1.1.1-blue.svg)](package.json)
[![Visual Studio Marketplace](https://vsmarketplacebadges.dev/version/masanori-satake.signboard-solo.svg?label=Marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=masanori-satake.signboard-solo)
[![Open VSX](https://img.shields.io/open-vsx/v/masanori-satake/signboard-solo?label=Open%20VSX)](https://open-vsx.org/extension/masanori-satake/signboard-solo)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/masanori-satake/Signboard-Solo)](https://github.com/masanori-satake/Signboard-Solo/releases)

Your open tabs, shown as an airport split-flap arrivals board. It does nothing useful, on purpose — it just lives in the Explorer and flaps, quietly, whenever your files change.

Current version: **v1.1.1**

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

Two display modes share one data layer. The split-flap board is the default; set `signboard.mode` to `led` for the station dot-matrix departure board — train type from the language （特急/快速/普通/各停）, destination without extension, departure time = last modified, 遅延 blinking red, closed tabs lingering as 運休， and a scrolling announcement line. Automatic switching by view width (Phase 3) is still to come; `auto` falls back to flap until then.

表示モードは2つ（フラップ／駅LED）で、データ層は共通です。LEDモードは設定 `signboard.mode: led` で切り替わります。

## Principles / 原則

- 100% local, no tracking, no network, no dependencies.
- Blank flap tiles never flip. One ticker drives every tile. Nothing renders while the board is hidden.
- The board is for looking at. Rows are not buttons and do not open files.

## Settings / 設定

- `signboard.mode`: `flap` (default) / `led` / `auto` — auto falls back to flap until Phase 3. The Signboard view title also has a toggle button that switches between flap and LED.
