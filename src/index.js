const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  Tray,
  shell,
  screen,
} = require('electron');
const path = require('path');
const stickerHandler = require('./utils/stickerHandler');
const Store = require('electron-store');
const downloadPack = require('./utils/lineDownloader');
const checkUpdate = require('./utils/checkUpdate');
const sqlHandler = require('./utils/sqlHandler');

// Auto update, but not on first run
const args = process.argv.slice(1);
if (!args.includes('--squirrel-firstrun')) {
  // Only update on Windows
  if (process.platform === 'win32') {
    console.log('Checking for updates...');
    require('update-electron-app')();
  }
}

/**
 * @type {Electron.BrowserWindow}
 */
let window;

// Initialize config
const store = new Store({
  defaults: {
    stickersPath: path.join(app.getPath('pictures'), 'Stickers'),
  },
});
const config = new Store({
  cwd: store.get('stickersPath'),
  defaults: {
    stickerPacksOrder: [],
    theme: 'blue',
    hotkey: 'CommandOrControl+Shift+A',
    runOnStartup: true,
    resizeWidth: 160,
  },
});
sqlHandler.init(path.join(store.get('stickersPath'), 'stickers.db'));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  window = new BrowserWindow({
    icon: path.join(__dirname, '../assets/icon.ico'),
    width: 930,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    transparent: true,
    frame: false,
    minWidth: 624,
    minHeight: 450,
    skipTaskbar: true,
  });

  // and load the index.html of the app.
  window.loadFile(path.join(__dirname, 'index.html'));

  // open links in default browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Open the DevTools if in development mode.
  if (process.env.NODE_ENV === 'development') {
    window.webContents.openDevTools();
    window.setSize(1600, 900);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow();

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  const appIcon = new Tray(path.join(__dirname, '../assets/icon-16x16.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click: function () {
        app.quit();
      },
    },
  ]);

  appIcon.setContextMenu(contextMenu);
  appIcon.on('click', () => {
    toggleWindow();
  });

  registerHotkey(config.get('hotkey'));
  setRunOnStartup(config.get('runOnStartup'));
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Show window on clicking dock icon
  window.show();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Migrate stickerPacksOrder to config in stickers folder
if (store.has('stickerPacksOrder')) {
  config.set('stickerPacksOrder', store.get('stickerPacksOrder'));
  store.delete('stickerPacksOrder');
}

/**
 * Toggles the window's visibility
 */
function toggleWindow() {
  if (window.isFocused()) {
    window.hide();
  } else {
    const currentScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const isWindowOnCurrentScreen =
      currentScreen.bounds.x <= window.getPosition()[0] &&
      window.getPosition()[0] <= currentScreen.bounds.x + currentScreen.bounds.width &&
      currentScreen.bounds.y <= window.getPosition()[1] &&
      window.getPosition()[1] <= currentScreen.bounds.y + currentScreen.bounds.height;
    if (!isWindowOnCurrentScreen) {
      const windowSize = window.getSize();
      let moveToX = currentScreen.bounds.x + currentScreen.bounds.width / 2 - windowSize[0] / 2;
      let moveToY = currentScreen.bounds.y + currentScreen.bounds.height / 2 - windowSize[1] / 2;
      moveToX = Math.floor(moveToX);
      moveToY = Math.floor(moveToY);
      window.setPosition(moveToX, moveToY);
    }
    window.show();
  }
}

// Register hotkey
function registerHotkey(hotkey) {
  try {
    globalShortcut.register(hotkey, () => {
      toggleWindow();
    });
  } catch (error) {
    config.reset('hotkey');
  }
}

// IPC handlers

ipcMain.on('close-window', () => {
  window.hide();
});

ipcMain.handle('ready', () => {
  const stickerPacksMap = stickerHandler.getAllStickerPacks(store.get('stickersPath'));
  let stickerPacksOrder = [...new Set(config.get('stickerPacksOrder'))].filter(
    (pack) => pack in stickerPacksMap
  );
  // check if there are any new sticker packs not in StickerPacksOrder
  const newStickerPacks = Object.keys(stickerPacksMap).filter(
    (pack) => !stickerPacksOrder.includes(pack)
  );
  if (newStickerPacks.length > 0) {
    // add new sticker packs to the end of the order
    stickerPacksOrder = stickerPacksOrder.concat(newStickerPacks);
  }
  config.set('stickerPacksOrder', stickerPacksOrder);
  // get stickers and settings and stuff and send to client
  return {
    stickerPacksMap: stickerPacksMap,
    stickerPacksOrder: config.get('stickerPacksOrder'),
    hotkey: config.get('hotkey'),
  };
});

ipcMain.on('send-sticker', (event, stickerPath, settings) => {
  settings.resizeWidth = config.get('resizeWidth');
  stickerHandler.pasteStickerFromPath(stickerPath, window, settings);
  sqlHandler.useSticker({ PackID: settings.stickerPackID, StickerID: settings.stickerID });
});

ipcMain.on('download-sticker-pack', (event, url) => {
  const port = event.ports[0];
  downloadPack(url, port, store.get('stickersPath'));
});

ipcMain.on('set-sticker-pack-order', (event, stickerPackOrder) => {
  config.set('stickerPacksOrder', stickerPackOrder);
});

ipcMain.handle('get-theme', () => {
  return config.get('theme');
});

ipcMain.on('set-theme', (event, theme) => {
  config.set('theme', theme);
});

ipcMain.handle('get-hotkey', () => {
  return config.get('hotkey');
});

ipcMain.on('set-hotkey', (event, hotkey) => {
  config.set('hotkey', hotkey);
});

ipcMain.on('disable-hotkey', () => {
  globalShortcut.unregisterAll();
});

ipcMain.on('enable-hotkey', () => {
  registerHotkey(config.get('hotkey'));
});

function setRunOnStartup(runOnStartup) {
  // https://www.electronjs.org/docs/latest/api/app#appsetloginitemsettingssettings-macos-windows
  const appFolder = path.dirname(process.execPath);
  const updateExe = path.resolve(appFolder, '..', 'Update.exe');
  const exeName = path.basename(process.execPath);

  app.setLoginItemSettings({
    openAtLogin: runOnStartup,
    openAsHidden: true,
    path: updateExe,
    args: ['--processStart', `"${exeName}"`, '--process-start-args', '"--hidden"'],
  });
}

ipcMain.handle('get-run-on-startup', () => {
  return config.get('runOnStartup');
});

ipcMain.on('set-run-on-startup', (event, runOnStartup) => {
  setRunOnStartup(runOnStartup);
  config.set('runOnStartup', runOnStartup);
});

ipcMain.handle('get-resize-width', (event) => {
  return config.get('resizeWidth');
});

ipcMain.on('set-resize-width', (event, width) => {
  config.set('resizeWidth', width);
});

ipcMain.handle('get-updates', async () => {
  return await checkUpdate(config);
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.on('set-favorites', (event, favorites) => {
  sqlHandler.setFavorites(favorites);
});
ipcMain.handle('get-favorites', () => {
  return sqlHandler.getFavorites();
});
ipcMain.handle('get-most-used', () => {
  return sqlHandler.getMostUsed(15);
});
