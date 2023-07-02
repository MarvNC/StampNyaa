// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  closeWindow: () => {
    ipcRenderer.send('close-window');
  },
  minimizeWindow: () => {
    ipcRenderer.send('minimize-window');
  },
  ready: () => ipcRenderer.invoke('ready'),
  sendSticker: (stickerPath) => {
    ipcRenderer.send('send-sticker', stickerPath);
  },
  downloadStickerPack: (url) => {
    const { port1, port2 } = new MessageChannel();
    ipcRenderer.postMessage('download-sticker-pack', url, [port2]);
    port1.onmessage = (event) => {
      window.postMessage(event.data);
    };
  },
});
