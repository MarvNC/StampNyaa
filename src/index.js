const { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const stickerHandler = require('./utils/stickerHandler');
const Store = require('electron-store');
const downloadPack = require('./utils/lineDownloader');

// Auto update
require('update-electron-app')();

let window;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  window = new BrowserWindow({
    icon: path.join(__dirname, '../assets/icon.ico'),
    width: 944,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    transparent: true,
    frame: false,
    minWidth: 624,
    minHeight: 450,
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
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  appIcon.setContextMenu(contextMenu);
  appIcon.on('click', () => {
    window.isFocused() ? window.hide() : window.show();
  });

  registerHotkey(config.get('hotkey'));
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
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

/**
 * Initialize the store
 */
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
  },
});
const stickersDataStore = new Store({
  name: 'stickers',
  cwd: store.get('stickersPath'),
});

// Migrate stickerPacksOrder to config in stickers folder
if (store.has('stickerPacksOrder')) {
  config.set('stickerPacksOrder', store.get('stickerPacksOrder'));
  store.delete('stickerPacksOrder');
}

// Register hotkey

function registerHotkey(hotkey) {
  try {
    globalShortcut.register(hotkey, () => {
      window.isFocused() ? window.hide() : window.show();
    });
  } catch (error) {
    config.reset('hotkey');
  }
}

// IPC handlers

ipcMain.on('close-window', () => {
  window.hide();
});

ipcMain.on('minimize-window', () => {
  window.minimize();
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

ipcMain.on('send-sticker', (event, stickerPath) => {
  stickerHandler.pasteStickerFromPath(stickerPath, window);
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
