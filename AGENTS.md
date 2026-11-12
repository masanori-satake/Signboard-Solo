# AGENTS.md

このファイルは、本リポジトリで作業を行うAIエージェント向けの開発・運用ガイドラインです。

## 📌 バージョン更新およびリリースルール（必須）

本プロジェクトでは、コードやドキュメント（VSIXに含まれる全ファイル）に修正・機能拡張・不具合修正を行う際、**必ず適切なバージョン昇格（インクリメント）を行うこと**が義務付けられています。
pre-commit フックおよび CI にてバージョン更新チェックが実行されます。

### 1. バージョン選択基準 (SemVer)
- **マイナーバージョン (`X.Y.Z` -> `X.(Y+1).0`)**: 新機能の追加、既存機能の拡張、仕様変更などの場合
- **パッチバージョン (`X.Y.Z` -> `X.Y.(Z+1)`)**: 不具合修正（バグフィックス）、軽微なUI調整、`README.md` などのパッケージ包含ドキュメントの更新の場合

※例外：`.vscode/`, `.github/`, `scripts/`, `.gitignore` 等のVSIXパッケージ外の開発用設定・ドキュメントのみの更新の場合はバージョン昇格不要です。

### 2. バージョン更新手順
`npm run update-version <X.Y.Z>` で以下を一括更新してください：
- `package.json` (`"version"`)
- `package-lock.json` (`"version"` および `"packages[''].version"`)
- `README.md` (バッジおよび本文のバージョン表記)
- `CHANGELOG.md` (`## [X.Y.Z]` 形式のヘッダー追加)

### 3. CHANGELOG.md の記述
各版の項目は Solo シリーズ共通の型で、英語の箇条書きの後に日本語の要約を置いてください（`## [X.Y.Z] - YYYY-MM-DD` 見出し、Keep a Changelog 式）。

## 🔒 設計原則（変更不可）

- **実用機能を持たない**： これは眺めるための玩具である。行クリックでファイルを開く等の実用導線を足さない。
- **100%ローカル処理**： ネットワーク通信を行わない。
- **トラッキングなし**： テレメトリ・解析送信を一切行わない。
- **依存ゼロ**： 実行時依存パッケージを持たない。バニラ JS と VS Code API のみで実装する（ビルド工程なし）。
- **軽さ**： 空タイルをパタパタさせない、タイマーは盤面ごとに最小限、非表示時は描画しない。フラップは中央タイマー1本で駆動する。

## 🏗️ プロジェクト構成

- `src/extension.js` — 拡張ホスト側：データ層（タブ→盤面行の変換、状態判定、欠航ゴースト）と Webview プロバイダ
- `src/model.js` — 純粋モジュール（`vscode` 非依存、単体テスト対象）。定数（秒数・タイル数）はここに集約
- `media/board.js` / `board.css` — フラップ盤面（空港の到着案内）の描画
- `media/led.js` / `led.css` — LED盤面（駅の発車標）の描画。通常のDOMテキストの上に穴あきマスク（CSS）を被せ、下にぼかした複製を置いて滲ませるマスク方式（1.8.0〜）
- `test/` — `src/model.js` の単体テスト（node:test）
- データ層は両モード共通。モード切替は描画の差し替えのみで行う。

## ⚙️ 開発コマンド

```bash
npm run check        # 全 JS の構文チェック
npm test             # node --test（model の単体テスト）
npm run check-version
npm run package      # VSIX 生成（check-version + vsce、prepublish で check/test 実行）
npm run update-version <X.Y.Z>
```

## 📝 コーディング規約

- 言語はバニラ JavaScript（CommonJS）。ビルドなしで `src/extension.js` がそのまま動く。
- `src/model.js` は `vscode` に依存させない（単体テスト可能に保つ）。表示側の小さな複製が `media/*.js` にある場合は、両方を揃えて直す。
- README / CHANGELOG の体裁は Solo シリーズ共通の型に従う（英語→日本語）。
