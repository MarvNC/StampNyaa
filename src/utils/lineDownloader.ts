import axios from 'axios';
const { JSDOM } = require('jsdom');
import fs from 'fs';
import { finished } from 'node:stream/promises';
import path from 'path';
import Jimp from 'jimp';
import { MessagePortMain } from 'electron';


const cdnURL = 'https://stickershop.line-scdn.net';
const mainImageURL = (packID: string) =>
  `${cdnURL}/stickershop/v1/product/${packID}/LINEStorePC/main.png?v=1`;
const stickerURL = (stickerId: string) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/IOS/sticker@2x.png`;
const fallbackStickerURL = (stickerId: string) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/android/sticker.png`;
const animatedStickerURL = (stickerId: string) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/iPhone/sticker_animation@2x.png`;
const fallbackAnimatedStickerURL = (stickerId: string) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/android/sticker_animation.png`;
const popupStickerURL = (stickerId: string) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/IOS/sticker_popup.png`;
const fallbackPopupStickerURL = (stickerId: string) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/android/sticker_popup.png`;

const packIDRegex = /stickershop\/product\/(\d+)/;

/**
 * Downloads a sticker pack from the LINE store.
 * @param {string} storeURL
 * @param {MessagePortMain} port
 * @param {string} directory
 * @returns {Promise<string>} The title of the sticker pack.
 */
async function downloadPack(storeURL: string, port: MessagePortMain, directory: string) {
  // Check URL first for valid pack
  let response;
  try {
    response = await axios.get(storeURL);
  } catch (error) {
    port.postMessage({
      type: 'download-sticker-pack',
      error: 'Error getting store page',
    });
    return;
  }
  const dom = new JSDOM(response.data);
  const document = dom.window.document;

  const packIDMatch = storeURL.match(packIDRegex);
  const packID = packIDMatch![1];
  if (!packID) {
    port.postMessage({
      type: 'download-sticker-pack',
      error: 'Invalid store page',
    });
    return;
  }
  const packDir = path.join(directory, '/', packID);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  if (!fs.existsSync(packDir)) {
    fs.mkdirSync(packDir);
  }

  const mainImage = path.join(packDir, 'main.png');
  if (!fs.existsSync(mainImage)) {
    const response = await axios({
      method: 'get',
      url: mainImageURL(packID),
      responseType: 'stream',
    });
    response.data.pipe(fs.createWriteStream(mainImage));
  }

  const title = document.title.split(' - ')[0];
  console.log(`Got store page for ${title}...`);

  const authorAnchor = document.querySelector('a[data-test="sticker-author"]');
  const author = authorAnchor.textContent;
  const authorURL = new URL(storeURL).origin + authorAnchor.href;

  const stickerLiList = [...document.querySelectorAll('.mdCMN09Li')];

  console.log(`Downloading ${stickerLiList.length} stickers from ${storeURL}...`);
  port.postMessage({
    type: 'download-sticker-pack',
    title,
    author,
    stickerCount: stickerLiList.length,
    progress: 0,
  });

  const stickerList = [];
  for (const stickerLi of stickerLiList) {
    const stickerJSON = JSON.parse(stickerLi.dataset.preview);
    stickerList.push(stickerJSON);
  }

  // Each sticker has a static URL, some have either an animation or popup url which is an animated png.
  for (let i = 0; i < stickerList.length; i++) {
    const sticker = stickerList[i];
    const staticUrl = stickerURL(sticker.id);
    await downloadImage(staticUrl, packDir, `${sticker.id}.png`);
    const isValid = await checkImageValidity(path.join(packDir, `${sticker.id}.png`));
    if (!isValid) {
      await downloadImage(fallbackStickerURL(sticker.id), packDir, `${sticker.id}.png`);
    }

    if (sticker.type === 'animation' || sticker.type === 'popup') {
      let downloadURL =
        sticker.type === 'animation' ? animatedStickerURL(sticker.id) : popupStickerURL(sticker.id);
      await downloadImage(downloadURL, packDir, `${sticker.id}_${sticker.type}.png`);
      const isValid = await checkImageValidity(
        path.join(packDir, `${sticker.id}_${sticker.type}.png`)
      );
      if (!isValid) {
        downloadURL =
          sticker.type === 'animation'
            ? fallbackAnimatedStickerURL(sticker.id)
            : fallbackPopupStickerURL(sticker.id);
        await downloadImage(downloadURL, packDir, `${sticker.id}_${sticker.type}.png`);
      }
    }

    console.log(`Downloaded ${i + 1}/${stickerList.length} stickers`);
    port.postMessage({
      type: 'download-sticker-pack',
      title,
      author,
      stickerCount: stickerList.length,
      progress: i + 1,
    });
  }

  // save title to info.json
  const info = {
    title,
    storeURL,
    author,
    authorURL,
  };
  fs.writeFileSync(path.join(packDir, 'info.json'), JSON.stringify(info));

  console.log(`Finished downloading ${title}!`);
  port.postMessage({
    type: 'download-sticker-pack',
    title,
    author,
    stickerCount: stickerList.length,
    progress: stickerList.length,
  });

  return {
    title,
    author,
    authorURL,
  };
}

/**
 * Downloads an image from a url to a given directory after checking if it's already downloaded.
 * @param {string} url
 * @param {string} dir
 * @param {string} filename
 * @returns {Promise<boolean>} Whether the image was downloaded.
 */
async function downloadImage(url: string, dir: string, filename: string) {
  console.log(`Downloading ${url} to ${filename}...`);
  return new Promise(async (resolve, reject) => {
    const filePath = path.join(dir, filename);
    const writer = fs.createWriteStream(filePath);
    axios.get(url, { responseType: 'stream' }).then((response) => {
      response.data.pipe(writer);
    });
    await finished(writer);
    console.log(`Wrote ${filename}`);
    resolve(true);
  });
}

/**
 * Checks if an image is valid.
 * @param {string} imagePath
 */
async function checkImageValidity(imagePath: string) {
  try {
    await Jimp.read(imagePath);
    console.log('Image is valid.');
    return true;
  } catch (error) {
    console.log('Image is invalid.');
    return false;
  }
}

export default downloadPack;
