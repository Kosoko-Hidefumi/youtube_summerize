# YouTube動画要約 Chrome拡張機能

ワンクリックでYouTube動画を要約し、Chromeサイドパネルに表示するChrome拡張機能です。

## 🎯 機能

- **ワンクリック要約**: 拡張機能アイコンをクリックするだけでサイドパネルが開き、動画を要約
- **字幕ベース要約**: 動画の字幕から内容を抽出して要約
- **フォールバック対応**: 字幕が取得できない場合はタイトル・説明文から要約
- **要約長さ選択**: 短い・普通・詳細の3段階で要約の詳しさを調整
- **日本語出力**: 箇条書き形式の要約＋重要ポイント3つ

## 📁 プロジェクト構成

```
├── extension/          # Chrome拡張機能
│   ├── manifest.json   # 拡張機能の設定
│   ├── background.js   # Service Worker
│   ├── sidepanel.html  # サイドパネルUI
│   ├── sidepanel.js    # サイドパネルロジック
│   ├── sidepanel.css   # スタイル
│   └── icons/          # アイコン
│
├── backend/            # Vercelバックエンド
│   ├── api/
│   │   └── summarize.js  # 要約APIエンドポイント
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
│
└── README.md
```

## 🚀 セットアップ手順

### 前提条件

- Node.js 18以上
- npm または yarn
- Google Chrome
- Gemini API Key（[Google AI Studio](https://aistudio.google.com/app/apikey)で取得）

### Step 1: アイコン画像の準備

`extension/icons/icon.svg` からPNG画像を生成します。

**オンラインツールを使う場合:**
1. [CloudConvert](https://cloudconvert.com/svg-to-png) などのオンラインツールを使用
2. `icon.svg` をアップロード
3. 16x16, 48x48, 128x128 の3サイズでダウンロード
4. `icon16.png`, `icon48.png`, `icon128.png` として保存

**または、シンプルな代替アイコン:**

手動で `extension/icons/` に以下のような単色アイコンを作成することもできます。
（Chromeは最低限のアイコンがあれば動作します）

### Step 2: バックエンドのセットアップ

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係をインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env

# .envファイルを編集してGemini APIキーを設定
# GEMINI_API_KEY=your_actual_api_key
```

### Step 3: ローカルでバックエンドを起動

```bash
# Vercel CLIをグローバルにインストール（まだの場合）
npm install -g vercel

# ローカル開発サーバーを起動
vercel dev
```

デフォルトで `http://localhost:3000` で起動します。

### Step 4: Chrome拡張機能をインストール

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `extension` フォルダを選択

### Step 5: 動作確認

1. YouTubeで動画ページを開く
2. 拡張機能アイコンをクリック
3. サイドパネルが開き、動画IDが表示される
4. 「要約を生成」ボタンをクリック

## 🌐 Vercelへのデプロイ

### Step 1: Vercelアカウント準備

1. [Vercel](https://vercel.com) にアカウント作成（GitHubでログイン推奨）
2. Vercel CLIでログイン: `vercel login`

### Step 2: デプロイ

```bash
cd backend

# 本番環境にデプロイ
vercel --prod
```

### Step 3: 環境変数の設定

1. [Vercel Dashboard](https://vercel.com/dashboard) でプロジェクトを選択
2. Settings → Environment Variables
3. `GEMINI_API_KEY` を追加

### Step 4: 拡張機能のAPI URLを更新

`extension/background.js` の `API_BASE_URL` を本番URLに変更:

```javascript
// const API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'https://your-project-name.vercel.app';
```

拡張機能を再読み込みして完了です。

## ⚙️ 設定オプション

### 要約の長さ

| オプション | 箇条書き行数 | 詳細度 |
|-----------|------------|--------|
| 短い      | 3〜4行      | 簡潔   |
| 普通      | 5〜6行      | 標準   |
| 詳細      | 6〜7行      | 詳細   |

### 対応するYouTube URL形式

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

## 🔧 トラブルシューティング

### 「APIキーが設定されていません」エラー

- `.env` ファイルに `GEMINI_API_KEY` が正しく設定されているか確認
- Vercel環境では、ダッシュボードで環境変数が設定されているか確認

### 「動画情報を取得できませんでした」エラー

- 動画が非公開または削除されている可能性
- 正しいYouTube動画ページを開いているか確認

### 字幕が取得できない場合

- 動画に字幕がない場合、タイトル・説明文から要約を生成
- 結果の「ソース」表示で確認可能

### CORSエラー

- ローカル開発時は `vercel dev` でサーバーを起動
- 本番環境では `vercel.json` のCORS設定が適用される

## 📝 技術仕様

### 使用技術

- **拡張機能**: Chrome Manifest V3, Service Worker, Side Panel API
- **バックエンド**: Vercel Node.js Serverless Functions
- **LLM**: Google Gemini 1.5 Flash（低コスト・高速モデル）
- **字幕取得**: youtube-captions-scraper

### APIエンドポイント

```
POST /api/summarize
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",
  "summaryLength": "medium"  // "short" | "medium" | "long"
}

Response:
{
  "summary": ["要約1", "要約2", ...],
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "sourceType": "captions" | "metadata",
  "videoId": "dQw4w9WgXcQ"
}
```

## 📄 ライセンス

MIT License


