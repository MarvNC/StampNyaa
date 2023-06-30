const { clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const { keyboard, Key } = require('@nut-tree/nut-js');

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

module.exports = {
  pasteStickerFromPath,
};
