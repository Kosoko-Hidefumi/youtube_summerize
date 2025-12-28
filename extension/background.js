// バックエンドAPIのURL
const API_BASE_URL = 'https://backend-nine-silk-38.vercel.app';

// 拡張機能アイコンクリックでサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
  // サイドパネルを開く
  await chrome.sidePanel.open({ tabId: tab.id });
});

// サイドパネルからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    handleSummarize(request.videoId, request.summaryLength)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 非同期レスポンスを示す
  }
  
  if (request.action === 'getActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(tabs => sendResponse({ tab: tabs[0] }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// バックエンドAPIに要約リクエストを送信
async function handleSummarize(videoId, summaryLength) {
  const response = await fetch(`${API_BASE_URL}/api/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId: videoId,
      summaryLength: summaryLength
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `APIエラー: ${response.status}`);
  }

  return await response.json();
}


