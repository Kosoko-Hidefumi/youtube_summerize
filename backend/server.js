// ローカル開発用サーバー
const http = require('http');
const url = require('url');

// .envファイルを読み込む
require('dotenv').config();

// summarize APIをインポート
const summarizeHandler = require('./api/summarize');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエスト（CORS preflight）
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // /api/summarize エンドポイント
  if (parsedUrl.pathname === '/api/summarize' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
      
      // Vercel互換のレスポンスオブジェクト
      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader(key, value) {
          this.headers[key] = value;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          res.writeHead(this.statusCode, { 
            'Content-Type': 'application/json',
            ...this.headers 
          });
          res.end(JSON.stringify(data));
        },
        end() {
          res.writeHead(this.statusCode, this.headers);
          res.end();
        }
      };
      
      try {
        await summarizeHandler(req, mockRes);
      } catch (error) {
        console.error('Handler error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // その他のリクエスト
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
  console.log(`📡 API エンドポイント: http://localhost:${PORT}/api/summarize`);
  console.log('');
  console.log('Ctrl+C で停止');
});

