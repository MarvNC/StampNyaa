const { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const stickerHandler = require('./utils/stickerHandler');

let window;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  window = new BrowserWindow({
    icon: path.join(__dirname, '../assets/icon.png'),
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    transparent: true,
    frame: false,
  });

  window.setMinimumSize(466, 300);

  // and load the index.html of the app.
  window.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  window.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  ipcMain.on('close-window', () => {
    window.hide();
  });

  ipcMain.on('minimize-window', () => {
    window.minimize();
  });

  ipcMain.handle('ready', (event) => {
    // get stickers and settings and stuff and send to client
    // for now send icon.png
    return {
      dirName: app.getPath('userData'),
      stickerPackList: [
        {
          title: 'test',
          mainIcon: '../assets/icon.png',
          stickers: [
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
            {
              path: '../assets/icon.png',
              type: 'static',
            },
          ],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
        {
          title: 'test2',
          mainIcon: '../assets/icon.png',
          stickers: [],
        },
      ],
    };
  });

  globalShortcut.register('CommandOrControl+Shift+P', () => {
    console.log('CommandOrControl+Shift+P is pressed');
    window.isFocused() ? window.hide() : window.show();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  appIcon = new Tray('../assets/icon.png');
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
