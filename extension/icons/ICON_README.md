# アイコン生成ガイド

Chrome拡張機能には16x16, 48x48, 128x128のPNGアイコンが必要です。

## 方法1: オンラインツール（推奨）

1. [CloudConvert](https://cloudconvert.com/svg-to-png) または [SVGtoPNG](https://svgtopng.com/ja/) を開く
2. `icon.svg` をアップロード
3. 各サイズで変換してダウンロード：
   - 16x16 → `icon16.png`
   - 48x48 → `icon48.png`
   - 128x128 → `icon128.png`

## 方法2: ImageMagick（コマンドライン）

```bash
# ImageMagickをインストール済みの場合
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## 方法3: 簡易アイコン

以下のBase64データをPNGファイルとして保存することもできます。
単色のテスト用アイコンです。

ブラウザのコンソールで以下を実行：

```javascript
// 48x48の簡易アイコンを生成
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 48;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ff6b6b';
ctx.fillRect(0, 0, 48, 48);
ctx.fillStyle = 'white';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('▶', 24, 34);
console.log(canvas.toDataURL());
// 出力されたData URLを右クリック→「リンクを保存」
```


