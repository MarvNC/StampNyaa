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
});
