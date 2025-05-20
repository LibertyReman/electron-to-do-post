const { app, BrowserWindow, ipcMain, dialog, Menu, screen } = require('electron');
const path = require('node:path');
const fs = require('fs');
const isWin = process.platform === 'win32'
const settingsFilePath = app.isPackaged ? path.join(__dirname, '..', 'settings.json') : 'settings.json';

let mainWindow;
let settingsWindow;
let appSettings = null;

// メイン画面の作成
function createMainWindow() {
  // アプリ設定情報の読み込み
  appSettings = loadAppSettings();

  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    width: appSettings.w,
    height: appSettings.h,
    minWidth: 165,
    minHeight: 165,
    backgroundColor: '#362E43',
    resizable: true,
    useContentSize: true,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // レンダリングの準備が完了してから画面を表示
  mainWindow.once('ready-to-show', () => mainWindow.show());
  // 画面表示位置の設定
  if (isWindowInBounds(appSettings.x, appSettings.y, appSettings.w, appSettings.h)) mainWindow.setPosition(appSettings.x, appSettings.y);
  // 画面フロート設定
  mainWindow.setAlwaysOnTop(appSettings.topmost);
  // 画面作成
  const encodeData = encodeURIComponent(JSON.stringify(appSettings));
  mainWindow.loadURL(`file://${__dirname}/mainWindow.html?data=${encodeData}`);
  // 起動時に自動で開発者ツールを開く
  //mainWindow.webContents.openDevTools({ mode: 'detach' });

  // 画面を閉じる前の処理
  mainWindow.on('close', () => {
    saveAppSettings();
  });

  // コンテキストメニューの設定
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow();
      }
    }
  ]);
  // コンテキストメニューを表示
  mainWindow.webContents.on('context-menu', () => {
    contextMenu.popup();
  });

  // アプリメニューの設定（拡大縮小など不要なショートカットを削除）
  const appMenu = Menu.buildFromTemplate([
    {
      role: app.name,
      submenu: [
        { role: 'about' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'close' }
      ]
    }
  ]);

  // アプリケーションメニューを表示
  Menu.setApplicationMenu(appMenu);
}

// アプリ設定画面の作成
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    show: false,
    width: 230,
    height: 120,
    backgroundColor: '#232323',
    resizable: false,
    useContentSize: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  settingsWindow.once('ready-to-show', () => settingsWindow.show());

  // 画面作成
  const encodeData = encodeURIComponent(JSON.stringify(appSettings));
  settingsWindow.loadURL(`file://${__dirname}/settingsWindow.html?data=${encodeData}`);
  //settingsWindow.webContents.openDevTools({ mode: 'detach' });
}


// アプリ初期化完了
app.whenReady().then(() => {
  // メイン画面作成
  createMainWindow();
})

// アプリ画面を全て閉じた時
app.on('window-all-closed', function () {
  app.quit();
})


// JSONフィルの読み込み
function readJsonFile(fileName) {
  try {
    // JSONファイルの読み込み
    const data = fs.readFileSync(fileName, 'utf-8');
    return JSON.parse(data);
  } catch(err) {
    console.error(err);
    // エラーダイアログの表示
    dialog.showMessageBoxSync(mainWindow, {
      type: 'error',
      buttons: ['OK'],
      title: 'Error',
      message: `${fileName}の読み込みに失敗しました。`
    });

    return null;
  }
}

// アプリ設定情報の読み込み
function loadAppSettings() {
  return readJsonFile(settingsFilePath);
}

// アプリ設定情報の保存（引数を指定した場合は、その設定を更新）
function saveAppSettings(settings = {}) {
  const [x, y] = mainWindow.getPosition();
  const [w, h] = mainWindow.getContentSize();

  if(settings.topmost !== undefined) appSettings.topmost = settings.topmost;
  if(settings.filePath !== undefined) appSettings.filePath = settings.filePath;
  appSettings.x = x;
  appSettings.y = y;
  appSettings.w = w;
  appSettings.h = h;

  // JSONファイルに書き込む
  fs.writeFileSync(settingsFilePath, JSON.stringify(appSettings, null, 2), 'utf-8');
}

// 画面表示位置が有効か確認
function isWindowInBounds(x, y, width, height) {
  // 引数チェック
  if ([x, y, width, height].some(v => v === null || v === undefined)) {
    return false;
  }

  // 各ディスプレイ領域内に画面表示位置が収まっているか確認
  const displays = screen.getAllDisplays();
  return displays.some(display => {
    const bounds = display.bounds;
    return (
      x >= bounds.x &&
      y >= bounds.y &&
      x + width <= bounds.x + bounds.width &&
      y + height <= bounds.y + bounds.height
    );
  });
}


// レンダラープロセスからのリクエスト待ち受け設定
ipcMain.handle('updateAppSettings', updateAppSettings);
ipcMain.handle('savePostData', savePostData);
ipcMain.handle('openDialog', openDialog);
ipcMain.handle('toggleTopmost', toggleTopmost);

// アプリ設定更新
function updateAppSettings(event, settings) {
  // アプリ設定情報の保存
  saveAppSettings(settings);

  // アプリ設定画面を閉じる
  settingsWindow.close();

  // 画面フロート設定の更新
  mainWindow.setAlwaysOnTop(settings.topmost);

  // アプリ設定を反映
  const encodeData = encodeURIComponent(JSON.stringify(appSettings));
  mainWindow.loadURL(`file://${__dirname}/mainWindow.html?data=${encodeData}`);
}

// ポストデータ保存
function savePostData(event, postData) {
  // ファイルパスが設定されていない場合
  if(appSettings.filePath == "") return;

  const filePath = path.join(appSettings.filePath, 'ToDoPost.txt');
  fs.writeFileSync(filePath, postData, 'utf-8');
}

// ダイアログを開く
async function openDialog(event) {
  const result = await dialog.showOpenDialog(settingsWindow, {
    properties: ["openDirectory"],
    title: "フォルダを選択",
    defaultPath: appSettings.filePath || app.getPath('home'),
  });

  if (result.canceled) return null;

  return result.filePaths[0];
}

// トグルで画面フロート
async function toggleTopmost(event) {
  const toggle = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!toggle);
}


