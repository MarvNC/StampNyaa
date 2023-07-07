// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  ready: () => ipcRenderer.invoke('ready'),
  sendSticker: (stickerPath, settings) => ipcRenderer.send('send-sticker', stickerPath, settings),
  downloadStickerPack: (url) => {
    const { port1, port2 } = new MessageChannel();
    ipcRenderer.postMessage('download-sticker-pack', url, [port2]);
    port1.onmessage = (event) => {
      window.postMessage(event.data);
    };
  },
  setStickerPackOrder: (stickerPackOrder) =>
    ipcRenderer.send('set-sticker-pack-order', stickerPackOrder),
  getHotkey: () => ipcRenderer.invoke('get-hotkey'),
  setHotkey: (hotkey) => ipcRenderer.send('set-hotkey', hotkey),
  disableHotkey: () => ipcRenderer.send('disable-hotkey'),
  enableHotkey: () => ipcRenderer.send('enable-hotkey'),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
  getRunOnStartup: () => ipcRenderer.invoke('get-run-on-startup'),
  setRunOnStartup: (runOnStartup) => ipcRenderer.send('set-run-on-startup', runOnStartup),
  getResizeWidth: () => ipcRenderer.invoke('get-resize-width'),
  setResizeWidth: (width) => ipcRenderer.send('set-resize-width', width),
});
