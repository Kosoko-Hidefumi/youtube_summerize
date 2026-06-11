const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CORS対応
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

// 要約の長さに応じたプロンプト調整
function getSummaryPrompt(summaryLength) {
  const lengthConfig = {
    short: { lines: '3〜4', detail: '簡潔に' },
    medium: { lines: '5〜6', detail: '適度な詳細で' },
    long: { lines: '6〜7', detail: '詳細に' }
  };

  const config = lengthConfig[summaryLength] || lengthConfig.medium;

  return `
このYouTube動画の内容（音声・字幕・映像）を日本語で要約してください。

【要約のルール】
1. ${config.lines}行の箇条書きで${config.detail}要約する
2. 重要なポイントを3つ抽出する
3. 専門用語があれば簡潔に説明を加える
4. 出力は必ず以下のJSON形式で返す

【出力形式】
{
  "summary": ["箇条書き1", "箇条書き2", ...],
  "keyPoints": ["重要ポイント1", "重要ポイント2", "重要ポイント3"]
}

JSONのみを出力してください。他の説明は不要です。
`;
}

// Geminiで要約を生成
async function generateSummary(videoId, summaryLength) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent([
    getSummaryPrompt(summaryLength),
    {
      fileData: {
        fileUri: `https://www.youtube.com/watch?v=${videoId}`
      }
    }
  ]);
  const response = await result.response;
  const text = response.text();

  // JSONを抽出してパース
  try {
    // コードブロックで囲まれている場合を処理
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || [],
      keyPoints: parsed.keyPoints || []
    };
  } catch (e) {
    console.error('JSON解析エラー:', e);
    // フォールバック: テキストをそのまま返す
    return {
      summary: [text.substring(0, 500)],
      keyPoints: ['解析エラーが発生しました']
    };
  }
}

// メインハンドラー
module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  // OPTIONSリクエスト（CORS preflight）の処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { videoId, summaryLength = 'medium' } = req.body;

    // videoIdのバリデーション
    if (!videoId) {
      res.status(400).json({ error: 'videoIdが指定されていません' });
      return;
    }

    // videoIdの形式チェック
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      res.status(400).json({ error: '無効なvideoId形式です' });
      return;
    }

    // APIキーのチェック
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'APIキーが設定されていません' });
      return;
    }

    console.log(`要約リクエスト: videoId=${videoId}, length=${summaryLength}`);

    const summary = await generateSummary(videoId, summaryLength);

    res.status(200).json({
      ...summary,
      sourceType: 'video',
      videoId
    });

  } catch (error) {
    console.error('サーバーエラー:', error);

    const message = error.message || '';
    if (message.includes('not supported') || message.includes('PERMISSION') || message.includes('INVALID_ARGUMENT')) {
      res.status(400).json({
        error: 'この動画は解析できませんでした。非公開・限定公開・年齢制限付きの動画は対象外です。'
      });
      return;
    }

    res.status(500).json({
      error: '要約の生成中にエラーが発生しました: ' + error.message
    });
  }
};
