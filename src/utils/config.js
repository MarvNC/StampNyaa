const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const settingsJSONPath = path.join(app.getPath('userData'), 'settings.json');

let settings = {};

const defaultSettings = {
  stickersPathName: 'pictures',
  stickersPathFolderName: 'stickers',
  stickerPacksOrder: [],
};

class Config {
  constructor() {
    if (!fs.existsSync(settingsJSONPath)) {
      fs.writeFileSync(settingsJSONPath, JSON.stringify(defaultSettings));
    }
    settings = JSON.parse(fs.readFileSync(settingsJSONPath));
  }
  /**
   * Name of the path where stickers are stored.
   * https://www.electronjs.org/docs/latest/api/app#appgetpathname
   * @param {string} pathType
   */
  setStickersPathName(pathType) {
    settings.stickersPath = pathType;
    fs.writeFileSync(settingsJSONPath, JSON.stringify(settings));
  }
  /**
   * Name of the folder where stickers are stored.
   * @param {string} folderName
   */
  setStickersPathFolderName(folderName) {
    settings.stickersPathFolderName = folderName;
    fs.writeFileSync(settingsJSONPath, JSON.stringify(settings));
  }
  /**
   * Returns the path where stickers are stored.
   * @returns {string}
   */
  getStickersPath() {
    return path.join(app.getPath(settings.stickersPathName), settings.stickersPathFolderName);
  }
}

module.exports = Config;
