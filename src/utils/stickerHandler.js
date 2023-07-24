const { app, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const { keyboard, Key } = require('@nut-tree/nut-js');
const Jimp = require('jimp');

let clipboardEx;

// if not linux
if (process.platform !== 'linux') {
  clipboardEx = require('electron-clipboard-ex');
}

/**
 * Reads the sticker packs directory and returns a map of sticker pack objects.
 * @returns {Array} Array of sticker pack objects
 */
function getAllStickerPacks(stickerPacksDir) {
  const stickerPacksMap = {};
  // check if sticker packs directory exists, if not create it
  if (!fs.existsSync(stickerPacksDir)) {
    fs.mkdirSync(stickerPacksDir);
  }
  const stickerPacks = fs.readdirSync(stickerPacksDir);
  for (const pack of stickerPacks) {
    // check if pack is a directory
    if (!fs.lstatSync(path.join(stickerPacksDir, pack)).isDirectory()) {
      continue;
    }
    // check if info.json exists, if not create it
    if (!fs.existsSync(path.join(stickerPacksDir, pack, 'info.json'))) {
      fs.writeFileSync(path.join(stickerPacksDir, pack, 'info.json'), '{}');
    }
    const stickerPackData = JSON.parse(
      fs.readFileSync(path.join(stickerPacksDir, pack, 'info.json'))
    );

    if (!stickerPackData.title) {
      stickerPackData.title = pack;
    }
    if (!stickerPackData.author) {
      stickerPackData.author = 'Unknown';
    }

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
        stickerPackData.stickers[stickerID] = { filepath, type, stickerPackID: pack };
      }
    }
    for (const sticker of specialStickers) {
      const stickerID = sticker.split('_')[0];
      const filepath = path.join(stickerPacksDir, pack, sticker);
      stickerPackData.stickers[stickerID].specialPath = filepath;
      const type = path.parse(sticker).name.split('_')[1];
      stickerPackData.stickers[stickerID].type = type;
    }
    // convert stickers object to array
    stickerPackData.stickers = Object.entries(stickerPackData.stickers).map(
      ([stickerID, sticker]) => {
        return { stickerID, ...sticker };
      }
    );
    stickerPacksMap[pack] = stickerPackData;
  }
  return stickerPacksMap;
}

/**
 * Pastes a sticker from the given directory path to the clipboard and sends it to the previous window.
 * @param {*} stickerPath
 * @param {*} window
 * @param {*} closeWindowAfterSend
 */
async function pasteStickerFromPath(
  stickerPath,
  window,
  { closeWindowAfterSend = true, resizeWidth, title = '', author = '', stickerPackID = '' } = {}
) {
  // check valid file path
  if (!fs.existsSync(stickerPath)) {
    throw new Error('Invalid file path');
  }

  const tempStickerFolder = path.join(app.getPath('appData'), 'temp');

  // create temp folder if it doesn't exist
  if (!fs.existsSync(tempStickerFolder)) {
    fs.mkdirSync(tempStickerFolder);
  }

  // strip illegal characters from author and title and ID
  author = stripIllegalCharacters(author);
  title = stripIllegalCharacters(title);
  stickerPackID = stripIllegalCharacters(stickerPackID);
  const tempStickerPath = path.join(tempStickerFolder, `StampNyaa_${stickerPackID}_${author}.png`);

  // if resizeImageWidth is set, resize the image to the given width
  if (resizeWidth) {
    try {
      const image = await Jimp.read(stickerPath);
      // check if width is bigger than resizeImageWidth
      if (image.getWidth() > resizeWidth) {
        await image.resize(resizeWidth, Jimp.AUTO);
      }
      // save in temp path
      await image.writeAsync(tempStickerPath);
    } catch (error) {
      console.log('Unsupported image format, could not resize');
      fs.copyFileSync(stickerPath, tempStickerPath);
    }
  } else {
    // copy sticker to temp path
    fs.copyFileSync(stickerPath, tempStickerPath);
  }

  // write sticker file to clipboard if not linux
  if (process.platform !== 'linux') {
    clipboardEx.writeFilePaths([tempStickerPath]);
  } else {
    // linux
    clipboard.writeImage(tempStickerPath);
  }
  console.log(`Wrote sticker to clipboard from path ${tempStickerPath}`);

  if (closeWindowAfterSend) {
    // windows / linux
    window.minimize();
    // mac
    if (process.platform === 'darwin') {
      app.hide();
    }
  } else {
    window.setAlwaysOnTop(true);
    window.setFocusable(false);
  }

  // paste sticker image (these are async functions but awaiting is slower)
  const ctrlKey = process.platform === 'darwin' ? Key.LeftCmd : Key.LeftControl;
  keyboard.pressKey(ctrlKey);
  keyboard.pressKey(Key.V);
  keyboard.releaseKey(Key.V);
  await keyboard.releaseKey(ctrlKey);

  if (!closeWindowAfterSend) {
    window.setFocusable(true);
    window.setAlwaysOnTop(false);
  }
}

/**
 * Removes illegal filepath characters from a string.
 * @param {string} string
 * @returns {string} String with illegal characters removed
 */
function stripIllegalCharacters(string) {
  return string.replace(/[/\\?%*:|"<>]/g, '');
}

export default {
  pasteStickerFromPath,
  getAllStickerPacks,
};
