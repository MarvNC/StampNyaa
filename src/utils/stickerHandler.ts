// stickerHandler.ts
import { BrowserWindow, app, clipboard, nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';
import { keyboard, Key } from '@nut-tree-fork/nut-js';
import FileType from 'file-type';
import sharp from 'sharp';
import sharpApng from 'sharp-apng';

type clipboard = typeof import('electron-clipboard-ex');
let clipboardEx: clipboard | null = null;

// if not linux
if (process.platform !== 'linux') {
  clipboardEx = require('electron-clipboard-ex');
}

/**
 * Reads the sticker packs directory and returns a map of sticker pack objects.
 */
function getAllStickerPacks(stickerPacksDir: string) {
  const stickerPacksMap: Record<string, StickerPack> = {};

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
    const stickerPackData: StickerPack = JSON.parse(
      fs.readFileSync(path.join(stickerPacksDir, pack, 'info.json')).toString()
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
      .filter((file: string) => file !== 'info.json' && file !== 'main.png');

    const stickersMap: Record<string, Sticker> = {};

    // handle animated/popup stickers (dumbly assume a static version exists)
    const specialStickers = [];
    for (const sticker of stickers) {
      if (sticker.endsWith('_animation.png') || sticker.endsWith('_popup.png')) {
        specialStickers.push(sticker);
      } else {
        const stickerID: string = path.parse(sticker).name;
        const filepath = path.join(stickerPacksDir, pack, sticker);
        const type = 'static';
        stickersMap[stickerID] = { filepath, type, stickerPackID: pack, stickerID };
      }
    }
    for (const sticker of specialStickers) {
      const stickerID = sticker.split('_')[0];
      const filepath = path.join(stickerPacksDir, pack, sticker);
      stickersMap[stickerID].specialPath = filepath;
      const type = path.parse(sticker).name.split('_')[1] as StickerType;
      stickersMap[stickerID].type = type;
    }
    // convert stickersMap object to array
    stickerPackData.stickers = Object.values(stickersMap);
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
  stickerPath: any,
  window: BrowserWindow,
  {
    closeWindowAfterSend = true,
    resizeWidth = 160,
    title = '',
    author = '',
    stickerPackID = '',
  } = {}
) {
  if (!fs.existsSync(stickerPath)) {
    throw new Error('Invalid file path');
  }

  const tempStickerFolder = path.join(app.getPath('appData'), 'temp');

  if (!fs.existsSync(tempStickerFolder)) {
    fs.mkdirSync(tempStickerFolder);
  }

  author = stripIllegalCharacters(author);
  title = stripIllegalCharacters(title);
  stickerPackID = stripIllegalCharacters(stickerPackID);
  let tempStickerPath = path.join(tempStickerFolder, `StampNyaa_${stickerPackID}_${author}`);

  try {
    // Use fileType.fromFile for APNG detection
    const { mime } = await FileType.fromFile(stickerPath);
    const isAPNG = mime === 'image/apng';
    let image;

    if (isAPNG) {
      tempStickerPath += '.gif';
      // APNG to GIF conversion using sharpApng
      image = await sharpApng.sharpFromApng(stickerPath, {
        delay: 0,
        repeat: 0,
        transparent: true,
      });
    } else {
      tempStickerPath += '.png';
      // Use sharp for PNG processing
      image = sharp(stickerPath);
    }

    if (resizeWidth) {
      image.resize(resizeWidth, null, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    await image.toFile(tempStickerPath);

    // Write to clipboard (platform-specific)
    if (process.platform !== 'linux') {
      const clipboardEx = require('electron-clipboard-ex');
      clipboardEx.writeFilePaths([tempStickerPath]);
    } else {
      const img = nativeImage.createFromPath(tempStickerPath);
      clipboard.writeImage(img);
    }
    console.log(`Wrote sticker to clipboard from path ${tempStickerPath}`);

    // Window handling and pasting
    if (closeWindowAfterSend) {
      window.minimize();
      if (process.platform === 'darwin') {
        app.hide();
      }
    } else {
      window.setAlwaysOnTop(true);
      window.setFocusable(false);
    }

    const ctrlKey = process.platform === 'darwin' ? Key.LeftCmd : Key.LeftControl;
    keyboard.pressKey(ctrlKey);
    keyboard.pressKey(Key.V);
    keyboard.releaseKey(Key.V);
    await keyboard.releaseKey(ctrlKey);

    if (!closeWindowAfterSend) {
      window.setFocusable(true);
      window.setAlwaysOnTop(false);
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return;
  }
}

/**
 * Removes illegal filepath characters from a string.
 * @param {string} string
 * @returns {string} String with illegal characters removed
 */
function stripIllegalCharacters(string: string) {
  return string.replace(/[/\\?%*:|"<>]/g, '');
}

export default {
  pasteStickerFromPath,
  getAllStickerPacks,
};
