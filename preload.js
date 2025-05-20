const { contextBridge, ipcRenderer } = require("electron");

// レンダラープロセスから呼び出す関数を登録
contextBridge.exposeInMainWorld('post', {
  // アプリ設定更新関数の実行
  async updateAppSettings(settings) {
    const result = await ipcRenderer.invoke('updateAppSettings', settings);
    return result;
  },

  // ポストデータ保存関数の実行
  async savePostData(postData) {
    const result = await ipcRenderer.invoke('savePostData', postData);
    return result;
  },

  // ダイアログを開く関数の実行
  async openDialog() {
    const result = await ipcRenderer.invoke('openDialog');
    return result;
  },

  // トグルで画面フロートする関数の実行
  async toggleTopmost() {
    const result = await ipcRenderer.invoke('toggleTopmost');
    return result;
  },
});


