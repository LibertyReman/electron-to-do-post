const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
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
    width: 165,
    height: 165,
    backgroundColor: '#362E43',
    resizable: true,
    useContentSize: true,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // レンダリングの準備が完了してから画面を表示
  mainWindow.once('ready-to-show', () => mainWindow.show());
  // 画面表示位置の設定
  if(appSettings.x && appSettings.y) mainWindow.setPosition(appSettings.x, appSettings.y);
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
      label: 'Window',
      submenu: [
        { role: 'close' }
      ]
    }
  ]);

  // アプリケーションメニューを表示
  if(isWin) {
    Menu.setApplicationMenu(null);
  } else {
    Menu.setApplicationMenu(appMenu);
  }
}

// アプリ設定画面の作成
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    show: false,
    width: 170,
    height: 100,
    backgroundColor: '#232323',
    resizable: false,
    useContentSize: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
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

  if(settings.sound !== undefined) appSettings.sound = settings.sound;
  if(settings.volume !== undefined) appSettings.volume = settings.volume;
  if(settings.resetHours !== undefined) appSettings.resetHours = settings.resetHours;
  if(settings.topmost !== undefined) appSettings.topmost = settings.topmost;
  appSettings.x = x;
  appSettings.y = y;

  // JSONファイルに書き込む
  fs.writeFileSync(settingsFilePath, JSON.stringify(appSettings, null, 2), 'utf-8');
}



// レンダラープロセスからのリクエスト待ち受け設定
ipcMain.handle('updateAppSettings', updateAppSettings);

// アプリ設定更新
function updateAppSettings(event, settings) {
  // アプリ設定情報の保存
  saveAppSettings(settings);

  // アプリ設定画面を閉じる
  settingsWindow.close();

  // 画面フロート設定の更新
  mainWindow.setAlwaysOnTop(settings.topmost);

  // サウンド設定の更新
  const encodeData = encodeURIComponent(JSON.stringify(appSettings));
  mainWindow.loadURL(`file://${__dirname}/mainWindow.html?data=${encodeData}`);
}


