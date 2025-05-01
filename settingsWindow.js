const $topmost = document.querySelector('.js-topmost-checkbox');
const $filePath = document.querySelector('.js-filepath');

// DOM読み込み完了後
window.addEventListener('DOMContentLoaded', () => {
  initializeFromQuery();

  // Saveボタン押下時
  document.querySelector('.js-settings-save-btn').addEventListener('click', async () => {
    const settings = {
      topmost: $topmost.checked,
      filePath: $filePath.textContent
    };

    await window.post.updateAppSettings(settings);
  });

  // CANCELボタン押下
  document.querySelector('.js-settings-cancel-btn').addEventListener('click', () => {
    window.close();
  });

  // ファイルパスボタン押下
  document.querySelector('.js-filepath-btn').addEventListener('click', async () => {
    const ret = await window.post.openDialog();
    $filePath.textContent = ret ?? "";
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
  // ファイルパスの設定
  if (appSettings.filePath !== "") $filePath.textContent = appSettings.filePath;
}


