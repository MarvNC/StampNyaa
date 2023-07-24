declare global {
  interface Api {
    closeWindow: () => void;
    ready: () => Promise<any>;
    sendSticker: (stickerPath: string, settings: any) => Promise<void>;
    downloadStickerPack: (url: string) => void;
    setStickerPackOrder: (stickerPackOrder: any) => void;
    getHotkey: () => Promise<any>;
    setHotkey: (hotkey: any) => void;
    disableHotkey: () => void;
    enableHotkey: () => void;
    getTheme: () => Promise<any>;
    setTheme: (theme: any) => void;
    getRunOnStartup: () => Promise<any>;
    setRunOnStartup: (runOnStartup: any) => void;
    getResizeWidth: () => Promise<any>;
    setResizeWidth: (width: any) => void;
    getUpdates: () => Promise<any>;
    getVersion: () => Promise<any>;
    setFavorites: (favorites: any) => void;
    getFavorites: () => Promise<any>;
    getMostUsed: () => Promise<any>;
  }
}

// Expose the 'api' variable to the global scope
declare const api: Api;
