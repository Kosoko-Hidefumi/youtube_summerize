// DOM要素
const videoStatus = document.getElementById('videoStatus');
const statusText = document.getElementById('statusText');
const videoIdDisplay = document.getElementById('videoIdDisplay');
const summarizeBtn = document.getElementById('summarizeBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const summaryResult = document.getElementById('summaryResult');
const summaryList = document.getElementById('summaryList');
const keyPointsList = document.getElementById('keyPointsList');
const metadata = document.getElementById('metadata');

let currentVideoId = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await checkCurrentTab();
  
  // 要約ボタンのイベントリスナー
  summarizeBtn.addEventListener('click', handleSummarize);
});

// 現在のタブをチェック
async function checkCurrentTab() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getActiveTab' });
    
    if (response.error) {
      showVideoError('タブ情報の取得に失敗しました');
      return;
    }

    const tab = response.tab;
    const videoId = extractVideoId(tab.url);

    if (videoId) {
      showVideoSuccess(videoId);
      currentVideoId = videoId;
      summarizeBtn.disabled = false;
    } else {
      showVideoError('YouTubeの動画ページを開いてください');
    }
  } catch (error) {
    showVideoError('エラーが発生しました: ' + error.message);
  }
}

// YouTubeのURLからvideoIdを抽出
function extractVideoId(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=xxxxx
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;
      
      // youtube.com/shorts/xxxxx
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];
      
      // youtube.com/embed/xxxxx
      const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) return embedMatch[1];
    }
    
    // youtu.be/xxxxx
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
  } catch (e) {
    return null;
  }

  return null;
}

// 動画検出成功
function showVideoSuccess(videoId) {
  videoStatus.innerHTML = `
    <span class="status-icon">✅</span>
    <span id="statusText">YouTube動画を検出しました</span>
  `;
  videoIdDisplay.textContent = `Video ID: ${videoId}`;
}

// 動画検出エラー
function showVideoError(message) {
  videoStatus.innerHTML = `
    <span class="status-icon">❌</span>
    <span id="statusText">${message}</span>
  `;
  videoIdDisplay.textContent = '';
  summarizeBtn.disabled = true;
}

// 要約を実行
async function handleSummarize() {
  if (!currentVideoId) return;

  // 選択された要約の長さを取得
  const summaryLength = document.querySelector('input[name="summaryLength"]:checked').value;

  // UIを更新
  hideError();
  hideSummary();
  showLoading();
  summarizeBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'summarize',
      videoId: currentVideoId,
      summaryLength: summaryLength
    });

    if (response.success) {
      displaySummary(response.data);
    } else {
      showError(response.error || '要約の生成に失敗しました');
    }
  } catch (error) {
    showError('通信エラー: ' + error.message);
  } finally {
    hideLoading();
    summarizeBtn.disabled = false;
  }
}

// 要約を表示
function displaySummary(data) {
  // 要約リストをクリア
  summaryList.innerHTML = '';
  keyPointsList.innerHTML = '';

  // 箇条書きの要約を表示
  if (data.summary && Array.isArray(data.summary)) {
    data.summary.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      summaryList.appendChild(li);
    });
  }

  // 重要ポイントを表示
  if (data.keyPoints && Array.isArray(data.keyPoints)) {
    data.keyPoints.forEach(point => {
      const li = document.createElement('li');
      li.textContent = point;
      keyPointsList.appendChild(li);
    });
  }

  // メタデータを表示
  const sourceType = data.sourceType === 'captions' ? '字幕' : 'タイトル・説明文';
  metadata.textContent = `ソース: ${sourceType} | 生成: ${new Date().toLocaleTimeString('ja-JP')}`;

  summaryResult.classList.add('active');
}

// ローディング表示
function showLoading() {
  loading.classList.add('active');
}

function hideLoading() {
  loading.classList.remove('active');
}

// エラー表示
function showError(message) {
  errorMessage.textContent = '⚠️ ' + message;
  errorMessage.classList.add('active');
}

function hideError() {
  errorMessage.classList.remove('active');
}

// 要約を非表示
function hideSummary() {
  summaryResult.classList.remove('active');
}


