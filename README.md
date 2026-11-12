# Signboard-Solo

[![Version](https://img.shields.io/badge/version-v1.5.4-blue.svg)](package.json)
[![Visual Studio Marketplace](https://vsmarketplacebadges.dev/version/masanori-satake.signboard-solo.svg?label=Marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=masanori-satake.signboard-solo)
[![Open VSX](https://img.shields.io/open-vsx/v/masanori-satake/signboard-solo?label=Open%20VSX)](https://open-vsx.org/extension/masanori-satake/signboard-solo)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/masanori-satake/Signboard-Solo)](https://github.com/masanori-satake/Signboard-Solo/releases)

<p align="center">
  <strong>Language / 言語:</strong> <a href="#english">English</a> | <a href="#japanese">日本語</a>
</p>

---

<a id="english"></a>
## English

**Signboard-Solo** is a lightweight, 100% local VS Code extension that shows your open tabs as an airport split-flap arrivals board — or, in its second mode, as a station LED dot-matrix departure board — in a section of the Explorer.

It does nothing useful, on purpose. There is nothing to click and nothing to accomplish: the board just flaps and glows, quietly, whenever your files change, in the corner of your vision while you work. Because the rows are your own tabs, the board never repeats itself.

Current version: **v1.5.4**

---

<a id="en-toc"></a>
### 📑 Table of Contents

- [💡 Key Features](#en-key-features)
- [📦 Installation & Updates](#en-installation)
- [🚀 How to Use](#en-how-to-use)
- [⌨️ Commands](#en-commands)
- [🔧 Settings](#en-settings)
- [📋 Requirements](#en-requirements)
- [🔒 Data Storage & Privacy](#en-privacy)
- [🧭 Roadmap](#en-roadmap)
- [🛠️ Developer Documentation](#en-developer-docs)
- [📄 License](#en-license)

---

<a id="en-key-features"></a>
### 💡 Key Features

1. **Split-Flap Arrivals Board** (default)
   - One row per open tab: a language logo tile where the airline logo would go, the file name **without** its extension under a FLIGHT NAME column, and its last-modified time.
   - Save a file and its time flaps over, with the remarks plate flipping to **ARRIVED** for a few seconds. Unsaved changes read **DELAYED**; closing a tab leaves the row as **CANCELLED** for a few seconds before it disappears.
   - Reordering tabs reorders the board; adding a tab shifts the rows below it down with a flap.
   - Too many flights for the height? The whole board page-flips to the next set every 18 seconds (mouse wheel works too), and jumps straight to the page of a flight that just changed.
   - Too narrow? Rows restack into two tiers instead of truncating, and names are middle-truncated only as a last resort.
   - The header clock is a 7-segment LED clock whose colon blinks every second.

2. **Station LED Departure Board**
   - The same tabs as trains: the train type (Limited Express / Rapid / Local / All-Stops) comes from the file's language, the destination is the file name without its extension, and the departure time is its last-modified time.
   - Unsaved changes blink **DELAYED** in red; closed tabs linger as **CANCELLED**.
   - Every label on this board — header, train types, statuses, and the announcement line — follows the VS Code display language, in English or Japanese.
   - A scrolling announcement line runs station-style messages — arrivals, cancellations, and a greeting that thanks riders of the “line” named after the parent directory of your first file tab.

3. **Lives in the Explorer**
   - The board is a section **inside the Explorer**, next to the file tree — not a separate activity-bar panel you have to visit. Drag its header to the secondary side bar or the panel if you want it somewhere else; VS Code remembers the placement.

4. **Two Modes, One Data Layer**
   - A title-bar button on the Signboard view switches between the flap board and the LED board (only the mode you can switch *to* is shown).
   - With `signboard.mode` set to `auto`, the board follows the view width: flap below 520px, LED at 520px and wider.

5. **Local First / Privacy First / No AI**
   - 100% local, no tracking, no network, no dependencies. Blank flap tiles never flip, one central ticker drives every tile, and nothing renders while the board is hidden.

---

<a id="en-installation"></a>
### 📦 Installation & Updates

#### Method 1: Install from Visual Studio Marketplace (Recommended)

##### A. Install via VS Code UI
1. Open VS Code and click the **Extensions icon** on the Activity Bar (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Search for `Signboard-Solo`.
3. Click the **Install** button.

##### B. Install via Web Browser
1. Visit the [Signboard-Solo Marketplace Page](https://marketplace.visualstudio.com/items?itemName=masanori-satake.signboard-solo).
2. Click **Install** and follow the browser prompts to open and install in VS Code.

---

#### Method 2: Install from Open VSX Registry

For VSCodium, Gitpod, Eclipse Theia, or environments configured with Open VSX:
1. Visit the [Signboard-Solo Open VSX Page](https://open-vsx.org/extension/masanori-satake/signboard-solo).
2. Install via your editor's extension manager or download the `.vsix` package directly.

---

#### Method 3: Install from VSIX Package File (Offline / Manual)

1. Go to the [GitHub Releases](https://github.com/masanori-satake/Signboard-Solo/releases) page.
2. Download the `.vsix` file (e.g., `signboard-solo-1.5.4.vsix`) under Assets.
3. In VS Code Extensions view (`Ctrl+Shift+X`), click the **"..." (Views and More Actions)** icon at the top right, select **Install from VSIX...**, and choose the downloaded file.

---

<a id="en-how-to-use"></a>
### 🚀 How to Use

#### 1. Open the board
Open the **Explorer** and expand the **Signboard** section. That is all — the board follows your tabs on its own.

#### 2. Watch things happen
- **Save a file** → its row flaps to the new time and shows ARRIVED for a few seconds.
- **Edit without saving** → the row reads DELAYED, blinking in red on the LED board.
- **Close a tab** → the row stays briefly as CANCELLED, then disappears.
- **Reorder tabs** → the board reorders with them.

#### 3. Switch the display mode
- Click the title-bar button on the Signboard view: the flight-takeoff button switches to the flap board, the dashboard button to the LED board. The choice is saved to `signboard.mode`.
- Or set `signboard.mode` directly: `flap` / `led` / `auto` (auto switches by view width, at 520px).

#### 4. Move it somewhere else
Drag the **Signboard** section header to the secondary side bar (right side) or the panel. VS Code remembers where you put it.

---

<a id="en-commands"></a>
### ⌨️ Commands

| Command Name | Command ID | Description |
| :--- | :--- | :--- |
| **Show LED board** | `signboard.showLed` | Switch the Signboard view to the station LED board (also writes `signboard.mode`) |
| **Show flap board** | `signboard.showFlap` | Switch the Signboard view to the split-flap board (also writes `signboard.mode`) |

Only the command for the mode you can switch *to* appears in the view title bar; both are available from the Command Palette.

---

<a id="en-settings"></a>
### 🔧 Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `signboard.mode` | `flap` | Display mode: `flap` (split-flap arrivals board), `led` (station LED departure board), or `auto` (flap below 520px, LED at 520px and wider) |

Settings can be changed via VS Code Settings (`Ctrl+,` / `Cmd+,`).

---

<a id="en-requirements"></a>
### 📋 Requirements

- **VS Code**: `v1.90.0` or later
- **OS**: Windows, macOS, Linux
- No accounts, no API keys, no network access required.

---

<a id="en-privacy"></a>
### 🔒 Data Storage & Privacy

All rendering happens locally. There is no telemetry, no cloud service, and no AI feature; your file names and tab state are **never** transmitted over any network. The board keeps nothing of its own — the only thing stored is the display mode you choose, in VS Code's standard settings (`signboard.mode`).

---

<a id="en-roadmap"></a>
### 🧭 Roadmap

- Official language logo artwork (with licence checks) in place of the current simplified logo tiles.
- Continued fine tuning of the flap and LED rendering, driven by everyday use.

---

<a id="en-developer-docs"></a>
### 🛠️ Developer Documentation

- Development and release rules for contributors and AI agents: [AGENTS.md](AGENTS.md)
- Build & test:

```bash
npm run check        # syntax check for all JS
npm test             # unit tests (node --test)
npm run package      # build the VSIX
npm run update-version <X.Y.Z>
```

---

<a id="en-license"></a>
### 📄 License

[MIT License](LICENSE)

---

<a id="japanese"></a>
## Japanese (日本語)

**Signboard-Solo** は、開いているタブを空港の到着案内板（ソラリー式のパタパタ）で表示する、軽量で 100% ローカル動作の VS Code 拡張機能です。もうひとつの表示モードとして、駅の発車標のような LED ドットマトリクス盤面もあります。どちらもエクスプローラーの中のセクションに表示されます。

実用性はありません。それが目的です。クリックするものも、達成するものもなく、ファイルが変わるたびに盤面が静かにパタパタ／発光するだけです。行の中身は自分のタブなので、盤面が同じ状態を繰り返すことはまずありません。

現在のバージョン: **v1.5.4**

---

<a id="ja-toc"></a>
### 📑 目次

- [💡 主な機能](#ja-key-features)
- [📦 インストール/アップデート方法](#ja-installation)
- [🚀 使い方](#ja-how-to-use)
- [⌨️ コマンド](#ja-commands)
- [🔧 設定](#ja-settings)
- [📋 動作要件](#ja-requirements)
- [🔒 データの保存について](#ja-privacy)
- [🧭 ロードマップ](#ja-roadmap)
- [🛠️ 開発者向けドキュメント](#ja-developer-docs)
- [📄 ライセンス](#ja-license)

---

<a id="ja-key-features"></a>
### 💡 主な機能

1. **空港の到着案内板（フラップ盤面）**（既定）
   - 開いているタブが1行＝1便になります。航空会社のロゴの位置には言語ロゴ、列見出しは「便名」で、ファイル名は拡張子なし、時刻は最終更新時刻です。
   - ファイルを保存すると時刻がパタパタと切り替わり、備考プレートが数秒間「到着」に変わります。未保存の変更は「遅延」、タブを閉じると数秒間「欠航」として残ってから消えます。
   - タブの並べ替えは盤面にも反映され、タブを増やすと下の行がパタパタしながら繰り下がります。
   - 高さに収まらない便は、盤面ごと18秒ごとにページ送りされます（マウスホイールでも送れます）。変化した便があるページへは自動でジャンプします。
   - 幅が狭いときは切り捨てずに行を2段に組み替えます。名前の真ん中省略は最後の手段です。
   - ヘッダーの時計は、コロンが1秒ごとに点滅する7セグメント LED 時計です。

2. **駅の発車標（LED盤面）**
   - 同じタブを列車として表示します。種別（特急／快速／普通／各停）はファイルの言語から、行先は拡張子なしのファイル名、発車時刻は最終更新時刻です。
   - 未保存の変更は「遅延」が赤く点滅し、閉じたタブは「運休」としてしばらく残ります。
   - 案内テロップが流れます。到着・運休の案内に加えて、先頭のファイルの親ディレクトリ名を路線名にした「本日も ○○線 をご利用くださいまして、ありがとうございます」の挨拶も流れます。
   - 盤面の表記（見出し・種別・状態・テロップ）は VS Code の表示言語に従います（日本語／英語）。

3. **エクスプローラーの中に住む**
   - 盤面は専用のアクティビティバーパネルではなく、**エクスプローラーの中のセクション**です。「見に行く場所」ではなく「視界の端で動くもの」として置かれます。セクションの見出しを右サイドバーやパネルへドラッグすれば移動でき、配置は保持されます。

4. **2モード・1データ層**
   - Signboard ビューのタイトルバーのボタンで、フラップ盤面と LED 盤面を切り替えます（表示されるのは切り替え先のボタンだけです）。
   - `signboard.mode` を `auto` にすると、ビューの幅で切り替わります（520px未満はフラップ、520px以上は LED）。

5. **ローカルファースト・プライバシーファースト・AI不使用**
   - 100% ローカル処理で、トラッキングなし・ネットワーク通信なし・依存パッケージなし。空白のフラップタイルは決してめくれず、タイマーは中央の1本だけ、盤面が隠れている間は描画しません。

---

<a id="ja-installation"></a>
### 📦 インストール/アップデート方法

本拡張機能は **Visual Studio Marketplace** または **Open VSX Registry** から直接インストールできます（推奨）。Marketplace からインストールした場合、VS Code によって拡張機能のバージョン確認および自動アップデートが自動的に行われます。

#### 方法 1: Visual Studio Marketplace からのインストール（推奨）

##### A. VS Code UI からインストール
1. VS Code を開き、左側のアクティビティバーにある **拡張機能アイコン**（`Ctrl+Shift+X` / `Cmd+Shift+X`）をクリックします。
2. 検索窓に `Signboard-Solo` と入力します。
3. 一覧に表示された **Signboard-Solo** の **「インストール (Install)」** ボタンをクリックします。

##### B. VS Code Marketplace Web ページからインストール
1. [Visual Studio Marketplace の Signboard-Solo ページ](https://marketplace.visualstudio.com/items?itemName=masanori-satake.signboard-solo) にアクセスします。
2. **「Install」** ボタンをクリックし、ブラウザの指示に従って VS Code で開いてインストールします。

---

#### 方法 2: Open VSX Registry からのインストール

VSCodium や Gitpod、Eclipse Theia など Open VSX を利用する環境の場合：
1. [Open VSX Registry の Signboard-Solo ページ](https://open-vsx.org/extension/masanori-satake/signboard-solo) にアクセスします。
2. エディタの拡張機能ビューから検索してインストールするか、`.vsix` パッケージをダウンロードしてインストールします。

---

#### 方法 3: VSIX パッケージファイルからのインストール（オフライン環境等）

1. 本リポジトリの [GitHub Releases](https://github.com/masanori-satake/Signboard-Solo/releases) ページにアクセスします。
2. 最新リリースの **Assets** セクションから、`.vsix` ファイル（例: `signboard-solo-1.5.4.vsix`）をダウンロードします。
3. VS Code の拡張機能ビュー（`Ctrl+Shift+X` / `Cmd+Shift+X`）を開き、右上の **「...」（その他の操作）アイコン** をクリックして **「VSIX からのインストール... (Install from VSIX...)」** を選択し、ダウンロードしたファイルを選んでください。

---

<a id="ja-how-to-use"></a>
### 🚀 使い方

#### 1. 盤面を開く
**エクスプローラー** を開いて **Signboard** セクションを展開します。それだけです。盤面はタブの状態に勝手に追随します。

#### 2. 起きることを眺める
- **ファイルを保存する** → その行が新しい時刻にパタパタと変わり、数秒間「到着」になります。
- **保存せずに編集する** → その行が「遅延」になります。LED盤面では「遅延」が赤く点滅します。
- **タブを閉じる** → その行はしばらく「欠航」（フラップ）／「運休」（LED）として残ってから消えます。
- **タブを並べ替える** → 盤面も一緒に並べ替わります。

#### 3. 表示モードを切り替える
- Signboard ビューのタイトルバーのボタンを押します。離陸グリフのボタンがフラップ盤面へ、ダッシュボードのボタンが LED 盤面への切り替えです。選択は `signboard.mode` に保存されます。
- 設定を直接書くこともできます： `flap` / `led` / `auto`（auto は幅 520px で切り替わります）。

#### 4. 置き場所を変える
**Signboard** セクションの見出しを右サイドバーやパネルへドラッグします。配置は VS Code が保持します。

---

<a id="ja-commands"></a>
### ⌨️ コマンド

| コマンド名 | コマンド ID | 説明 |
| :--- | :--- | :--- |
| **LED表示に切り替え** | `signboard.showLed` | Signboard ビューを駅の LED 盤面に切り替える（`signboard.mode` にも保存される） |
| **フラップ表示に切り替え** | `signboard.showFlap` | Signboard ビューをフラップ盤面に切り替える（`signboard.mode` にも保存される） |

ビューのタイトルバーに表示されるのは切り替え先のコマンドだけですが、どちらもコマンドパレットから実行できます。

---

<a id="ja-settings"></a>
### 🔧 設定

| 設定キー | 既定値 | 説明 |
| :--- | :--- | :--- |
| `signboard.mode` | `flap` | 表示モード： `flap`（空港の到着案内板）/ `led`（駅の発車標）/ `auto`（520px未満はフラップ、520px以上は LED） |

設定は VS Code の設定エディタ（`Ctrl+,` / `Cmd+,`）から変更できます。

---

<a id="ja-requirements"></a>
### 📋 動作要件

- **VS Code**: `v1.90.0` 以降
- **対応 OS**: Windows, macOS, Linux
- アカウント・API キー・ネットワーク接続は不要です。

---

<a id="ja-privacy"></a>
### 🔒 データの保存について

すべての描画処理はローカルで完結します。テレメトリ（利用状況送信）、クラウドサービス、AI 機能は一切使用しておらず、ファイル名やタブの状態がネットワーク経由で送信されることは**絶対にありません**。盤面自体が保持するデータはなく、保存されるのは選んだ表示モードだけで、VS Code の標準設定（`signboard.mode`）に記録されます。

---

<a id="ja-roadmap"></a>
### 🧭 ロードマップ

- 現在の簡易ロゴタイルを、ライセンス確認済みの公式言語ロゴ原画へ差し替える。
- 日常利用からのフィードバックによる、フラップ／LED 描画の細部の調整を継続する。

---

<a id="ja-developer-docs"></a>
### 🛠️ 開発者向けドキュメント

- 開発・リリースのルール（貢献者と AI エージェント向け）: [AGENTS.md](AGENTS.md)
- ビルドとテスト:

```bash
npm run check        # 全 JS の構文チェック
npm test             # 単体テスト（node --test）
npm run package      # VSIX 生成
npm run update-version <X.Y.Z>
```

---

<a id="ja-license"></a>
### 📄 ライセンス

[MIT License](LICENSE)
