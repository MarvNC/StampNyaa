const { app, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const { keyboard, Key } = require('@nut-tree/nut-js');

/**
 * Reads the sticker packs directory and returns a map of sticker pack objects.
 * @returns {Array} Array of sticker pack objects
 */
const getAllStickerPacks = (stickerPacksDir) => {
  const stickerPacksMap = {};
  const stickerPacks = fs.readdirSync(stickerPacksDir);
  for (const pack of stickerPacks) {
    const stickerPackData = JSON.parse(
      fs.readFileSync(path.join(stickerPacksDir, pack, 'info.json'))
    );

    // pack ID is the folder name
    stickerPackData.id = pack;

    // read pack icon
    const mainIcon = path.join(stickerPacksDir, pack, 'main.png');
    stickerPackData.mainIcon = mainIcon;

    // read the rest of the stickers
    const stickers = fs
      .readdirSync(path.join(stickerPacksDir, pack))
      .filter((file) => file !== 'info.json' && file !== 'main.png');

    stickerPackData.stickers = {};

    // handle animated/popup stickers (dumbly assume a static version exists)
    const specialStickers = [];
    for (const sticker of stickers) {
      if (sticker.endsWith('_animation.png') || sticker.endsWith('_popup.png')) {
        specialStickers.push(sticker);
      } else {
        const stickerID = path.parse(sticker).name;
        const filepath = path.join(stickerPacksDir, pack, sticker);
        const type = 'static';
        stickerPackData.stickers[stickerID] = { filepath, type };
      }
    }
    for (const sticker of specialStickers) {
      const stickerID = sticker.split('_')[0];
      const filepath = path.join(stickerPacksDir, pack, sticker);
      stickerPackData.stickers[stickerID].specialPath = filepath;
      const type = path.parse(sticker).name.split('_')[1];
      stickerPackData.stickers[stickerID].type = type;
    }
    stickerPacksMap[pack] = stickerPackData;
  }
  return stickerPacksMap;
};

/**
 * Pastes a sticker from the given directory path to the clipboard and sends it to the previous window.
 * @param {*} stickerPath
 * @param {*} window
 * @param {*} closeWindowAfterSend
 */
const pasteStickerFromPath = async (stickerPath, window, closeWindowAfterSend = true) => {
  // check valid file path
  if (!fs.existsSync(stickerPath)) {
    throw new Error('Invalid file path');
  }

  // write sticker image to clipboard
  clipboard.writeImage(stickerPath);

  if (closeWindowAfterSend) {
    window.minimize();
  } else {
    window.setAlwaysOnTop(true);
    window.setFocusable(false);
  }

  // paste sticker image (these are async functions but awaiting is slower)
  keyboard.pressKey(Key.LeftControl);
  keyboard.pressKey(Key.V);
  keyboard.releaseKey(Key.V);
  await keyboard.releaseKey(Key.LeftControl);

  if (!closeWindowAfterSend) {
    window.setFocusable(true);
    window.setAlwaysOnTop(false);
  }
};

/**
 * Uses a given sticker
 * @param {string} stickerID
 * @param {string} packName
 * @param {string} stickersPath
 */
const sendSticker = async (stickerID, packName, stickersPath, window) => {
  const stickerPath = path.join(stickersPath, packName, `${stickerID}.png`);
  await pasteStickerFromPath(stickerPath, window, false);
};

module.exports = {
  pasteStickerFromPath,
  getAllStickerPacks,
  sendSticker,
};
