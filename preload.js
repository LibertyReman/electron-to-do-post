const { contextBridge, ipcRenderer } = require("electron");

// レンダラープロセスから呼び出す関数を登録
contextBridge.exposeInMainWorld('timer', {
  // アプリ設定更新関数の実行
  async updateAppSettings(settings) {
    const result = await ipcRenderer.invoke('updateAppSettings', settings);
    return result;
  },

  // ログ保存関数の実行
  async saveLog(log) {
    const result = await ipcRenderer.invoke('saveLog', log);
    return result;
  },

  // ログ表示画面の作成関数の実行
  async openLogWindow() {
    const result = await ipcRenderer.invoke('openLogWindow');
    return result;
  },

  // 本日の合計分を計算する関数の実行
  async getTodaysTotalMinutes() {
    const result = await ipcRenderer.invoke('getTodaysTotalMinutes');
    return result;
  },
});


