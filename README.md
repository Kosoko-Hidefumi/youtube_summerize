# YouTube動画要約 Chrome拡張機能

ワンクリックでYouTube動画を要約し、Chromeサイドパネルに表示するChrome拡張機能です。

## 🎯 機能

- **ワンクリック要約**: 拡張機能アイコンをクリックするだけでサイドパネルが開き、動画を要約
- **動画ベース要約**: Gemini APIがYouTube動画URLを直接解析して要約
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
│   └── env.sample
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

### Step 2: バックエンドのセットアップ

```bash
cd backend
npm install
cp env.sample .env
# .env に GEMINI_API_KEY を設定
```

### Step 3: ローカルでバックエンドを起動

```bash
node server.js
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

```bash
cd backend
npx vercel login
npx vercel --prod --yes
```

Vercel Dashboard で `GEMINI_API_KEY` を Production 環境に設定してください。

`extension/background.js` の `API_BASE_URL` を本番URLに合わせてください。

## ⚙️ 設定オプション

### 要約の長さ

| オプション | 箇条書き行数 | 詳細度 |
| ----- | ------ | --- |
| 短い    | 3〜4行   | 簡潔  |
| 普通    | 5〜6行   | 標準  |
| 詳細    | 6〜7行   | 詳細  |

## 🔧 トラブルシューティング

### 「APIキーが設定されていません」エラー

- `.env` または Vercel の環境変数に `GEMINI_API_KEY` が設定されているか確認
- 環境変数追加後は再デプロイが必要

### 非公開・限定公開・年齢制限付き動画は要約できません

- Gemini APIは公開YouTube動画のURLのみ解析可能です

### CORSエラー

- 本番環境では `vercel.json` のCORS設定が適用されます
- `manifest.json` の `host_permissions` にAPI URLが含まれているか確認

## 📝 技術仕様

### 使用技術

- **拡張機能**: Chrome Manifest V3, Service Worker, Side Panel API
- **バックエンド**: Vercel Node.js Serverless Functions
- **LLM**: Google Gemini 2.5 Flash
- **動画解析**: Gemini APIによるYouTube URL直接入力

### APIエンドポイント

```
POST /api/summarize
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",
  "summaryLength": "medium"
}

Response:
{
  "summary": ["要約1", "要約2", ...],
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "sourceType": "video",
  "videoId": "dQw4w9WgXcQ"
}
```

## 📄 ライセンス

MIT License
