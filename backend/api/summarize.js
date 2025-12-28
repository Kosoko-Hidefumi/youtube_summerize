const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSubtitles } = require('youtube-captions-scraper');

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CORS対応
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

// YouTube動画情報を取得
async function getVideoInfo(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // タイトルを抽出
    const titleMatch = html.match(/<title>(.+?) - YouTube<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // 説明文を抽出（メタタグから）
    const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
    const description = descMatch ? descMatch[1] : '';
    
    return { title, description };
  } catch (error) {
    console.error('動画情報の取得に失敗:', error);
    return { title: '', description: '' };
  }
}

// 字幕を取得
async function fetchCaptions(videoId) {
  try {
    // 日本語字幕を優先的に試行
    const languages = ['ja', 'en', 'auto'];
    
    for (const lang of languages) {
      try {
        const captions = await getSubtitles({
          videoID: videoId,
          lang: lang
        });
        
        if (captions && captions.length > 0) {
          // 字幕テキストを結合
          const text = captions.map(c => c.text).join(' ');
          return { success: true, text, language: lang };
        }
      } catch (e) {
        continue;
      }
    }
    
    return { success: false, text: null };
  } catch (error) {
    console.error('字幕取得エラー:', error);
    return { success: false, text: null };
  }
}

// 要約の長さに応じたプロンプト調整
function getSummaryPrompt(content, summaryLength, sourceType) {
  const lengthConfig = {
    short: { lines: '3〜4', detail: '簡潔に' },
    medium: { lines: '5〜6', detail: '適度な詳細で' },
    long: { lines: '6〜7', detail: '詳細に' }
  };
  
  const config = lengthConfig[summaryLength] || lengthConfig.medium;
  
  const sourceNote = sourceType === 'captions' 
    ? 'これはYouTube動画の字幕テキストです。'
    : 'これはYouTube動画のタイトルと説明文です。字幕が取得できなかったため、この情報をもとに内容を推測してください。';
  
  return `
${sourceNote}

以下のコンテンツを日本語で要約してください。

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

【コンテンツ】
${content}

JSONのみを出力してください。他の説明は不要です。
`;
}

// Geminiで要約を生成
async function generateSummary(content, summaryLength, sourceType) {
  // gemini-2.0-flash を使用（低コスト・高速）
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = getSummaryPrompt(content, summaryLength, sourceType);
  
  const result = await model.generateContent(prompt);
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
    
    // 字幕を取得
    const captionsResult = await fetchCaptions(videoId);
    
    let content;
    let sourceType;
    
    if (captionsResult.success) {
      // 字幕が取得できた場合
      content = captionsResult.text;
      sourceType = 'captions';
      console.log(`字幕取得成功 (${captionsResult.language}): ${content.length}文字`);
    } else {
      // 字幕が取得できない場合、タイトルと説明文でフォールバック
      const videoInfo = await getVideoInfo(videoId);
      
      if (!videoInfo.title && !videoInfo.description) {
        res.status(404).json({ error: '動画情報を取得できませんでした。動画が存在しないか、非公開の可能性があります。' });
        return;
      }
      
      content = `タイトル: ${videoInfo.title}\n説明: ${videoInfo.description}`;
      sourceType = 'metadata';
      console.log('フォールバック: タイトル・説明文を使用');
    }
    
    // コンテンツが短すぎる場合
    if (content.length < 10) {
      res.status(400).json({ error: '動画のコンテンツが不足しています。要約に必要な情報がありません。' });
      return;
    }
    
    // 要約を生成
    const summary = await generateSummary(content, summaryLength, sourceType);
    
    res.status(200).json({
      ...summary,
      sourceType,
      videoId
    });
    
  } catch (error) {
    console.error('サーバーエラー:', error);
    res.status(500).json({ 
      error: '要約の生成中にエラーが発生しました: ' + error.message 
    });
  }
};


