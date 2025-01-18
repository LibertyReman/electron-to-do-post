const $postArea = document.querySelector('.js-post-area');

// DOM読み込み完了後
window.addEventListener('DOMContentLoaded', () => {
  // ローカルストレージの値を表示
  $postArea.value = localStorage.getItem('postData') || $postArea.value;

  // 初期化処理
  initializeFromQuery();

  // フォーカスが外れたとき
  $postArea.onblur = () => {
    localStorage.setItem('postData', $postArea.value);
  };

});

// クエリパラメータによる初期化
function initializeFromQuery() {
  // クエリパラメータの取得
  const urlParams = new URLSearchParams(window.location.search);
  const data = urlParams.get('data');
  const appSettings = JSON.parse(decodeURIComponent(data));

}


