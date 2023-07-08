const { app, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const { keyboard, Key } = require('@nut-tree/nut-js');
const Jimp = require('jimp');

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
  { closeWindowAfterSend = true, resizeWidth, title = 'Unknown', author = 'Unknown' } = {}
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

  author = stripIllegalCharacters(author);
  title = stripIllegalCharacters(title);
  const tempStickerPath = path.join(tempStickerFolder, `StampNyaa_${author}_${title}.png`);

  // if resizeImageWidth is set, resize the image to the given width
  if (resizeWidth) {
    const image = await Jimp.read(stickerPath);
    // check if width is bigger than resizeImageWidth
    if (image.getWidth() > resizeWidth) {
      await image.resize(resizeWidth, Jimp.AUTO);
    }

    // save in temp path
    await image.writeAsync(tempStickerPath);
  } else {
    // copy sticker to temp path
    fs.copyFileSync(stickerPath, tempStickerPath);
  }

  // write sticker file to clipboard
  // Thanks Kastow https://stackoverflow.com/a/76242802/22187538
  clipboard.writeBuffer(
    'FileNameW',
    Buffer.concat([Buffer.from(tempStickerPath, 'ucs-2'), Buffer.from([0, 0])])
  );
  console.log(`Wrote sticker to clipboard from path ${tempStickerPath}`);

  if (closeWindowAfterSend) {
    // windows
    window.minimize();
    // linux
    window.hide();
    // mac
    if (process.platform === 'darwin') {
      app.hide();
    }
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
}

/**
 * Removes illegal filepath characters from a string.
 * @param {string} string
 * @returns {string} String with illegal characters removed
 */
function stripIllegalCharacters(string) {
  return string.replace(/[/\\?%*:|"<>]/g, '');
}

module.exports = {
  pasteStickerFromPath,
  getAllStickerPacks,
};
