import { tpexStocks } from './tpex_stocks.js';

document.addEventListener('DOMContentLoaded', function() {
  const stockCodeInput = document.getElementById('stockCode');
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');
  const historyList = document.getElementById('historyList');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  // 網站模板列表
  const websites = [
    'https://ifa.ai/tw-stock/{code}',
    'https://www.cnyes.com/twstock/{code}',
    'https://goodinfo.tw/tw/StockDividendSchedule.asp?STOCK_ID={code}',
    'https://statementdog.com/analysis/{code}/stock-health-check',
    'https://histock.tw/stock/{code}/每股淨值',
    'https://www.findbillion.com/twstock/{code}/financial_statement',
    'https://www.cmoney.tw/forum/stock/{code}?s=technical-analysis',
    'https://www.growin.tv/zh/my/analysis/{code}#analysis',
    'https://www.fugle.tw/ai/{code}',
  ];
  
  // 載入歷史記錄
  loadHistory();
  
  // 提交按鈕點擊事件
  submitBtn.addEventListener('click', function() {
    processStockCode();
  });
  
  // 清除全部記錄按鈕點擊事件
  clearAllBtn.addEventListener('click', function() {
    clearAllHistory();
  });
  
  // 輸入框按下 Enter 鍵事件
  stockCodeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      processStockCode();
    }
  });
  
  // 處理股票代碼
  function processStockCode() {
    const stockCode = stockCodeInput.value.trim();
    
    // 驗證股票代碼
    if (!isValidStockCode(stockCode)) {
      showMessage('請輸入有效的台股代號（通常為 4-6 位數字）', false);
      return;
    }
    
    // 顯示處理中訊息
    showMessage('正在開啟網站...', true);
    
    // 開啟網站
    openWebsites(stockCode);
    
    // 保存到歷史記錄
    saveToHistory(stockCode);
    
    // 清空輸入框
    stockCodeInput.value = '';
  }
  
  // 驗證股票代碼
  function isValidStockCode(code) {
    // 台股代號通常為 4-6 位數字
    return /^\d{4,6}$/.test(code);
  }
  
  // 開啟網站
  function openWebsites(code) {
    // 處理所有網站
    websites.forEach(url => {
      const finalUrl = url.replace('{code}', code);
      chrome.tabs.create({ url: finalUrl });
    });
    
    // 特別處理 TradingView URL (區分上市上櫃)
    const tradingViewUrl = getTradingViewUrl(code);
    chrome.tabs.create({ url: tradingViewUrl });
  }
  
  // 根據股票代碼判斷是上市還是上櫃，並返回對應的 TradingView URL
  function getTradingViewUrl(code) {
    // 檢查股票代碼是否在櫃買列表中
    return tpexStocks.has(code) 
      ? `https://tw.tradingview.com/symbols/TPEX-${code}/technicals/`
      : `https://tw.tradingview.com/symbols/TWSE-${code}/technicals/`;
  }
  
  // 顯示訊息
  function showMessage(text, isSuccess) {
    messageDiv.textContent = text;
    messageDiv.className = isSuccess ? 'message success' : 'message';
    
    // 3 秒後清除訊息
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 3000);
  }
  
  // 保存到歷史記錄
  function saveToHistory(code) {
    chrome.storage.local.get(['history'], function(result) {
      let history = result.history || [];
      
      // 如果已存在，先移除舊記錄
      history = history.filter(item => item !== code);
      
      // 添加到最前面
      history.unshift(code);
      
      // 只保留最近 5 筆記錄
      if (history.length > 5) {
        history = history.slice(0, 5);
      }
      
      // 保存更新後的歷史記錄
      chrome.storage.local.set({ history: history }, function() {
        loadHistory();
      });
    });
  }
  
  // 載入歷史記錄
  function loadHistory() {
    chrome.storage.local.get(['history'], function(result) {
      const history = result.history || [];
      
      // 清空歷史列表
      historyList.innerHTML = '';
      
      // 如果沒有歷史記錄
      if (history.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = '尚無查詢記錄';
        emptyItem.style.color = '#5f6368';
        emptyItem.style.fontStyle = 'italic';
        historyList.appendChild(emptyItem);
        return;
      }
      
      // 添加歷史記錄項目
      history.forEach(code => {
        const item = document.createElement('li');
        item.className = 'history-item';
        
        const codeSpan = document.createElement('span');
        codeSpan.className = 'history-code';
        codeSpan.textContent = code;
        codeSpan.addEventListener('click', function() {
          stockCodeInput.value = code;
          processStockCode();
        });
        
        const deleteSpan = document.createElement('span');
        deleteSpan.className = 'history-delete';
        deleteSpan.textContent = '刪除';
        deleteSpan.addEventListener('click', function(e) {
          e.stopPropagation();
          removeFromHistory(code);
        });
        
        item.appendChild(codeSpan);
        item.appendChild(deleteSpan);
        historyList.appendChild(item);
      });
    });
  }
  
  // 從歷史記錄中移除
  function removeFromHistory(code) {
    chrome.storage.local.get(['history'], function(result) {
      let history = result.history || [];
      
      // 移除指定代碼
      history = history.filter(item => item !== code);
      
      // 保存更新後的歷史記錄
      chrome.storage.local.set({ history: history }, function() {
        loadHistory();
      });
    });
  }
  
  // 清除全部歷史記錄
  function clearAllHistory() {
    if (confirm('確定要清除所有查詢記錄嗎？')) {
      chrome.storage.local.set({ history: [] }, function() {
        loadHistory();
        showMessage('已清除所有查詢記錄', true);
      });
    }
  }
}); 