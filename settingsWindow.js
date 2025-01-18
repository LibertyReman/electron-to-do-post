const $topmost = document.querySelector('.js-topmost-checkbox');

// DOM読み込み完了後
window.addEventListener('DOMContentLoaded', () => {
  initializeFromQuery();

  // Saveボタン押下時
  document.querySelector('.js-settings-save-btn').addEventListener('click', async () => {
    const settings = {
      topmost: $topmost.checked
    };

    await window.timer.updateAppSettings(settings);
  });

  // CANCELボタン押下
  document.querySelector('.js-settings-cancel-btn').addEventListener('click', () => {
    window.close();
  });
})


// クエリパラメータによる初期化
function initializeFromQuery() {
  // クエリパラメータの取得
  const urlParams = new URLSearchParams(window.location.search);
  const data = urlParams.get('data');
  const appSettings = JSON.parse(decodeURIComponent(data));

  // チェックボックスの設定
  if (appSettings.topmost === true) $topmost.checked = true;
}


