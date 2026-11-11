# Changelog

All notable changes to Signboard-Solo are documented here.
変更内容はここに記録します。

## [1.1.1] - 2026-11-12

- Fixed the column headers drifting out of alignment in the wide tier: the header's name column stretched with the panel width while the rows' name tiles are a fixed field, so UPDATED / REMARKS no longer sat over the time and remark columns after a resize. The header now shares the rows' fixed 270px name field (CJK names fit inside it), and the header time width matches the time tiles exactly.
- 広い表示で列見出しがずれる問題を修正。見出しのファイル名列がパネル幅に伸びる一方、行の名前タイルは固定幅だったため、幅を変えると「最終更新」「備考」が時刻・備考の列の上に来なくなっていた。見出しも行と同じ固定幅（270px、日本語名もこの内側に収まる）にし、時刻列の幅もタイルと一致させた。

## [1.1.0] - 2026-11-12

- Added a mode toggle button to the Signboard view title: one click switches between the flap board and the LED board (it writes the `signboard.mode` setting, so the choice is kept). The button shows the mode you can switch to.
- Signboard ビューのタイトルにモード切替ボタンを追加した。クリックでフラップ表示と LED 表示を切り替えられ、選択は `signboard.mode` 設定に保存される。ボタンには切り替え先のモードが表示される。

## [1.0.4] - 2026-11-12

- Fixed the page size calculation: it estimated the rows area from the window height minus a fixed allowance, so after the header shrank the board still showed only one flight per page and left the freed space empty. The board now measures the actual rows area and a real row height, and fits as many whole flights per page as the space allows.
- 1ページに表示する便数の計算を修正。従来はウィンドウ高さから固定値を引く見積もりで、ヘッダーが小さくなっても1便しか表示されず空きが残っていた。行エリアの実寸と行の実高を測り、入るだけの便数を表示するようにした。

## [1.0.3] - 2026-11-12

- Made the 7-segment header clock smaller (digits 13×23 → 11×19 px, tighter spacing), saving both header height and width.
- ヘッダーの7セグメント時計を小さくし（数字 13×23 → 11×19 px、間隔も詰めた）、高さと横幅を節約した。

## [1.0.2] - 2026-11-12

- Tidied the board layout. The flight count moved from the footer into the column-header row (right end of the FILE line). In the narrow and mini tiers, rows are now a two-column grid: the language logo spans both lines on the left, and the file name and the time/remarks line start at the same horizontal position, instead of the name wrapping onto its own line and the time starting at a different offset.
- 表示領域を整理した。便数はフッターから列見出しの行（ファイル名の行の右端）へ移動。狭幅では行を2カラムのグリッドにし、ロゴを左に置いてファイル名と時刻・備考の書き始めの位置を揃えた。

## [1.0.1] - 2026-11-12

- Removed the big bilingual header title (到着案内 / ARRIVALS shown twice, swapped by UI language). The header now carries a single ARRIVALS label next to the 7-segment clock, so it no longer wraps onto two lines in a narrow sidebar.
- ヘッダーの大きな二言語タイトル（到着案内／ARRIVALS の併記）を削除し、ARRIVALS の一語だけにした。狭いサイドバーでも折り返さない。

## [1.0.0] - 2026-11-12

- First release. Both display modes over one data layer: the airport split-flap arrivals board (default) and the station LED dot-matrix departure board (`signboard.mode: led`), living as a section in the Explorer.
  - Split-flap: language-logo tiles, file names without extensions in UPPERCASE on fixed-width tiles (blank tiles never flip), last-modified times, remarks as a single word plate (ARRIVED / DELAYED / CANCELLED, Japanese or English by UI language), width tiers with two-tier restacking, page-flip paging with jump-to-updated-flight, and a 7-segment header clock with a blinking colon.
  - LED: train type from the language （特急/快速/普通/各停）, destination without extension, departure time = last modified, 遅延 blinking, closed tabs lingering as 運休， scrolling announcements, 4 trains per screen switching every 8 seconds, coverage-based dot sampling.
  - 100% local, no tracking, no dependencies.
- 初回リリース。フラップ式到着案内板と駅LED発車標の両モードを搭載し、エクスプローラーのセクションとして表示する。

## [0.3.3] - 2026-11-12

- LED glyph dot budget: kanji were melting because each glyph only had ~7-8 dots of height. Header, ticker, destination, chip and time glyphs now get ~9-11 dots (fonts and row heights scaled up together; the board is slightly taller). Latin names and times were already legible and stay so.
- LEDの文字のドット数を増やした（漢字1文字あたり縦7〜8ドット→9〜11ドット）。盤面は少し縦長になる。

## [0.3.2] - 2026-11-12

- LED rendering quality: dots are now lit by glyph coverage. The composed scene is downscaled with filtering (each dot averages its block) instead of sampling a single centre pixel, so thin strokes stop dropping out and letterforms — including the type-chip labels — hold together; partially covered dots render dimmer, like a real LED matrix. The smaller readback also lowers the per-frame cost.
- LEDのドット化をカバレッジ方式に変更。細い線が抜け落ちなくなり、種別チップの文字も崩れにくくなった。

## [0.3.1] - 2026-11-12

- LED mode layout fix (from real-machine screenshots): the first LED layout reused the wide mock's font sizes on a fixed 76-dot stage, so at Explorer widths the destination collapsed to ~2 characters and the type-chip label spilled out of its chip. Layout is now defined in dot units with two size sets — at narrow widths the chip, time and status zones shrink first — and the destination width is computed from the space actually left. The dot column count adapts to the view width, and the announcement ticker moved directly under the header so it is not cut off in short sections.
- LEDモードのレイアウトを修正: 行先の幅を実測ベースにし、細幅ではチップ／時刻／状態を先に縮める2段階サイズに。テロップはヘッダー直下へ移動。

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
