# Changelog

All notable changes to Signboard-Solo are documented here.
変更内容はここに記録します。

## [1.7.0] - 2026-11-12

- Rebuilt the LED board's proportions on the pre-implementation prototype mock, which rendered far more legibly: glyphs there had about 11 dots each, while the shipped board had squeezed them to 6–7.5 dots over successive "lower and finer" adjustments. Rows are 12 dots again (header 12, ticker 11) with fonts at roughly 10–11 dots per glyph, body text returns to regular weight (bold strokes fuse at dot resolution), dots are fuller (radius ratio 0.36, the mock's proportion), and the train type is coloured text in the mock's bright colours instead of white text on a filled chip — the chip was the worst-melting element, since every dot cell mixed the label and chip colours. The cost is the one the mock accepted: fewer trains fit on one screen, and the board pages like the mock did.
- LED 盤面の比率を、実装前のプロトタイプ・モックのものに戻した。モックでは文字が約11ドットで描かれていたが、製品版は「低く・細かく」の調整を重ねるうちに6〜7.5ドットまで潰れていた。行を12ドット（見出し12、テロップ11）に戻し、フォントを1文字あたり約10〜11ドットにし、本文を通常ウェイトに戻し（太字はドット解像度で線が融合する）、ドット半径比をモックの比率 0.36 に戻した。種別は、色チップの上に白文字を載せる方式（セルごとに文字色とチップ色が混ざり、最も潰れていた箇所）をやめ、モックと同じ明るい色の文字そのもので表示する。代償はモックが受け入れていた通りで、1画面に入る本数は減り、モック同様にページ切替になる。

## [1.6.0] - 2026-11-12

- Improved LED legibility without changing the board's look: the scene is now composed at double resolution and supersampled (each dot's coverage is estimated from 8×8 source pixels instead of 4×4), sampled dot colours are snapped to the scene palette so mixed edge colours — the main cause of melted glyphs, above all the white type-chip labels on their coloured chips — resolve to the majority colour, the lighting threshold rose (105) so neighbouring strokes stop fusing, dots shrank slightly relative to their pitch (radius ratio 0.27) for clearer separation, text sizes grew within the same dot bands (header, destination, type chips, time, ticker), and destinations gained a touch of letter spacing.
- LED の視認性を、盤面の雰囲気を変えずに改善した。シーンを2倍の解像度で描いてスーパーサンプリングし（1ドットのカバレッジを 4×4 ではなく 8×8 の元ピクセルから推定）、サンプリングしたドットの色をシーンのパレット色へ寄せることで、混色した縁のドット――文字が潰れる主因で、特に色チップ上の白い種別文字が顕著だった――を「セルの中で勝った色」で描くようにした。点灯しきい値も上げて（105）隣り合う線の融合を抑え、ドット半径比を 0.27 に少し小さくして分離を良くし、同じドット帯のまま各テキスト（見出し・行先・種別チップ・時刻・テロップ）を少し大きくし、行先にわずかな字間を入れた。

## [1.5.4] - 2026-11-12

- Fixed the cancelled row appearing one position too low: closing the second of four tabs made the *third* row show CANCELLED. Live rows were renumbered compactly (0, 1, 2) while the closed tab's ghost kept its old number (1), so the tie sorted the ghost below the tab that had moved up. Live rows and ghosts now share one merged ordering — a ghost anchors to the live row that followed it and stays in its own place on the board (both display modes).
- 欠航の行が1つ下にずれる不具合を直した。4つのタブの2番目を閉じると、3番目の行が欠航になっていた。残った行は詰めて振り直され（0, 1, 2）、閉じたタブの残像は古い番号（1）を保持するため、同点になって残像が下に並んでいた。残った行と残像で1つの並び順を共有し、残像は「自分の後ろにいた行」の直前に anchor して元の場所に留まるようにした（両盤面共通）。

## [1.5.3] - 2026-11-12

- Fixed the LED board appearing vertically squashed right after switching from the flap board: at load, the board laid itself out for the maximum row count (no rows known yet), and when the actual rows arrived, the sampler kept the stale tall geometry, squeezing the scene into a fraction of the dot height until the next resize. Layout now runs after the new rows land, and each frame refuses to sample with geometry the canvases were not laid out for.
- フラップから LED に切り替えた直後、盤面が縦に圧縮されて見える不具合を直した。読み込み直後は行数が分からず最大行数ぶんの高さでレイアウトされ、実際の行が届いてもサンプラーが古い高いジオメトリのままになり、場面がドット高の数分の一に潰れていた（リサイズで直ったのはそのため）。レイアウトを行データの反映後に実行するよう直し、各フレームでもキャンバスのジオメトリと食い違うサンプリングをしないようガードを入れた。

## [1.5.2] - 2026-11-12

- Names that mix Japanese and Latin letters now uppercase their Latin part too, on both boards. Previously only purely-Latin names were uppercased, so a name like 会議memo showed lowercase tiles among the board's uppercase ones and read as a different font. Japanese characters have no letter case, so the whole name is now uppercased unconditionally.
- 日本語と英字が混ざるファイル名で、英字部分も大文字化するようにした（両盤面）。従来は英字だけの名前しか大文字化しておらず、「会議memo」のような名前で小文字タイルが混ざり、フォントが揃って見えなかった。日本語には大文字・小文字がないので、名前全体を無条件に大文字化する。

## [1.5.1] - 2026-11-12

- Fixed the flap board's remarks plate showing the final word twice around a flip: when a tab closed, CANCELLED appeared instantly, then the plate flipped again and landed on CANCELLED a second time. A duplicate state update (the host pushes on both tab and tab-group events) was overwriting the plate with the final word while its flip timer was still running, orphaning the timer. The plate now tracks the word it is flipping toward and never stomps an in-flight flip; the word appears only when the flip lands.
- フラップ盤面の備考プレートで、最終形が2回出る不具合を直した。タブを閉じると「欠航」がまず即座に表示され、そのあとプレートがまたパタパタして「欠航」に落ち着いていた。ホストがタブとタブグループの両イベントで状態を送るため、2通目の状態がフリップ中のプレートへ最終形を上書きし、止められなかったタイマーが孤児になって回り続けていた。プレートが「向かっている単語」を記録し、フリップ中は最終形で上書きしないようにしたので、単語はパタパタの着地時に初めて現れる。

## [1.5.0] - 2026-11-12

- The LED board no longer shows a fixed four trains per screen: the number of rows now follows the view height (measured, like the flap board's paging), so trains stay on one screen whenever the space below is available and page only when they truly do not fit. The board also got finer and lower again: dot pitch about 3.2px (was about 4px) with slightly smaller dots, train rows 9 dots tall (was 10), header 10 (was 11), announcement band 7 (was 8).
- LED盤面の1画面あたりの行数を固定4行からやめ、ビューの高さに追随させた（フラップ盤面のページ送りと同じ実測方式）。下にスペースがあるのに複数ページへ分かれることがなくなり、本当に収まらないときだけページ送りする。あわせて粒と高さをさらに詰めた：ドット間隔は約4px→約3.2pxで粒自体も少し小さく、列車行は10ドット→9ドット、ヘッダー11→10、案内帯8→7。

## [1.4.1] - 2026-11-12

- LED board refinement: the dot grain is finer (more, smaller dots across the same width — the pitch went from about 5px to about 4px and the dots themselves are slightly smaller), and the whole board is shorter: train rows are 10 dots tall instead of 12, the header 11 instead of 12, and the announcement band 8 instead of 9, with fonts kept as large as the slimmer rows allow.
- LED盤面の調整。ドットの粒を細かくした（同じ幅により小さなドットを多く並べる：間隔は約5px→約4px、ドット自体も少し小さく）。あわせて盤面全体を低くした：列車行は12ドット→10ドット、ヘッダーは12→11、案内帯は9→8。文字は細くなった行に収まる範囲で最大の大きさを保った。

## [1.4.0] - 2026-11-12

- The LED board now follows the VS Code display language, like the flap board always did: in English environments the header reads DEPARTURES, train types are LTD EXP / RAPID / LOCAL / ALL-STOPS, statuses read DELAYED / CANCELLED / ARRIVED, and the announcement ticker and line greeting are in English (“Thank you for riding the ○○ Line today”, “… will arrive shortly”, “… has been cancelled”). English type chips are wider and labels shrink to fit; English status words reserve their measured width so they never overrun the time. The README's English section no longer mixes in Japanese status words.
- LED盤面が、フラップ盤面と同様に VS Code の表示言語へ追随するようになった。英語環境では見出しが DEPARTURES、種別が LTD EXP / RAPID / LOCAL / ALL-STOPS、状態が DELAYED / CANCELLED / ARRIVED になり、案内テロップと路線名の挨拶も英語になる。英語の種別チップは幅を広げ、ラベルは収まるよう自動で縮小する。英語の状態語は実測幅を確保するので時刻へ被らない。あわせて README の英語セクションに混ざっていた日本語の状態語を英語表記に直した。

## [1.3.2] - 2026-11-12

- Rewrote the README in the shared Solo-series format used by StructMap-Solo, SkillMap-Solo and SkillTrace-Solo: language switcher, English section followed by a Japanese section, each with a table of contents, key features, three installation routes, how to use, commands, settings, requirements, privacy, roadmap, developer documentation and license. The version-update script's per-project VSIX filename pattern was also corrected from its SkillTrace leftover to signboard-solo, so future version bumps keep the README's example VSIX names current.
- README を StructMap-Solo／SkillMap-Solo／SkillTrace-Solo と共通の Solo シリーズの型に書き換えた。言語スイッチャー、英語セクション→日本語セクションの構成で、各セクションに目次・主な機能・3通りのインストール方法・使い方・コマンド・設定・動作要件・データの保存について・ロードマップ・開発者向けドキュメント・ライセンスを備える。あわせて、バージョン更新スクリプトに残っていた SkillTrace 由来の VSIX ファイル名パターンを signboard-solo に直し、今後のバージョン更新で README の VSIX 例示名も自動で追随するようにした。

## [1.3.1] - 2026-11-12

- The “show flap board” title-bar button no longer uses the stock calendar glyph: VS Code's codicon set has no airplane icon, so the button now carries a small custom flight-takeoff glyph (an airliner lifting off over a runway line), drawn as light/dark SVG variants.
- タイトルバーの「フラップ表示に切り替え」ボタンのグリフを、カレンダーから自作の離陸グリフ（滑走路の線の上を機首を上げて離陸する旅客機）に変えた。VS Code の codicon には飛行機のアイコンが無いため、ライト／ダーク両テーマ用の SVG を用意した。

## [1.3.0] - 2026-11-12

- The LED board's greeting ticker now names a railway line after your work: it thanks riders of “<parent directory of the first file tab>線” instead of Signboard — open a file in a project folder and the board greets that project's line. The line follows the first file tab in tab order and updates when it changes; with no file open, the Signboard greeting remains.
- LED盤面の案内テロップの挨拶を、その人の作業にちなんだ路線名にした。「Signboard」ではなく、先頭のファイルタブの親ディレクトリ名を使い「本日も ○○線 をご利用くださいまして、ありがとうございます」と流れる。路線名はタブ順の先頭ファイルに追随し、ファイルがないときは従来の Signboard の挨拶のまま。

## [1.2.1] - 2026-11-12

- Renamed the flap board's name column from FILE / ファイル名 to FLIGHT NAME / 便名, leaning further into the departures-board fiction: each row is a flight, so its name is a flight name.
- フラップ盤面の名前列の見出しを「ファイル名」から「便名」に変更した（英語は FLIGHT NAME）。1行が1便なので、名前も便名として扱うほうが案内板らしい。

## [1.2.0] - 2026-11-12

- Phase 3: `signboard.mode: auto` now switches by view width — flap below 520px, LED at 520px and wider — so moving the board from the sidebar to a wide panel changes its form. Also tuned the LED board: the announcement ticker band is about two-thirds of its former height, and binary dot sampling now keeps more of each digit's outline and fills one-dot sampling gaps between same-colour dots, reducing chipped digit contours without bringing back half-bright shading.
- Phase 3を実装した。`signboard.mode: auto` ではビューの幅で切り替わり、520px未満はフラップ、520px以上は LED になるため、盤面をサイドバーから広いパネルへ移すと形が変わる。あわせて LED を調整した。案内テロップの帯を従来の約2/3の高さにし、二値ドットの判定と同色ドット間の1ドット欠け補完で、濃淡を戻さずに数字の輪郭の欠けを抑えた。

## [1.1.2] - 2026-11-12

- LED board tuning. Rows are slimmer (14 → 12 dots) with slightly smaller destination/time text, so the board reads finer next to the flap board. Dots are now binary — a dot is either fully lit or dark, like a real LED board — instead of half-bright partial-coverage dots that made glyphs fuzzy. The train-type chips are larger with bigger label text, so 特急 / 快速 / 普通 / 各停 stay readable instead of melting into a blob.
- LED盤面を調整した。行を 14 → 12 ドットに低くし、行先・時刻の文字も少し小さくして、フラップ盤面に近い繊細さにした。ドットは実物の LED と同じく点くか消えるかの二値にし、読みづらさの原因だった中間の濃淡ドットをやめた。種別チップは大きくし、ラベルの文字も大きくして「特急」「快速」「普通」「各停」が潰れて読めない状態を改善した。

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
