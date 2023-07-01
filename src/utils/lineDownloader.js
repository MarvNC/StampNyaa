const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const cdnURL = 'https://stickershop.line-scdn.net';
const mainImageURL = (packID) =>
  `${cdnURL}/stickershop/v1/product/${packID}/LINEStorePC/main.png?v=1`;
const stickerURL = (stickerId) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/IOS/sticker@2x.png`;
const animatedStickerURL = (stickerId) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/iPhone/sticker_animation@2x.png`;
const popupStickerURL = (stickerId) =>
  `${cdnURL}/stickershop/v1/sticker/${stickerId}/android/sticker_popup.png`;

const packIDRegex = /stickershop\/product\/(\d+)/;

/**
 * Downloads a sticker pack from the LINE store.
 * @param {string} storeURL
 * @returns {Promise<string>} The title of the sticker pack.
 */
const downloadPack = async (storeURL) => {
  const packID = storeURL.match(packIDRegex)[1];
  const appDir = app.getPath('pictures');
  const stickersDir = `${appDir}/stickers/`;
  const packDir = `${stickersDir}${packID}`;

  if (!fs.existsSync(stickersDir)) {
    fs.mkdirSync(stickersDir);
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
  const response = await axios.get(storeURL);
  const dom = new JSDOM(response.data);
  const document = dom.window.document;

  const title = document.title.split(' - ')[0];
  console.log(`Got store page for ${title}...`);

  const stickerLiList = [...document.querySelectorAll('.mdCMN09Li')];

  console.log(`Downloading ${stickerLiList.length} stickers from ${storeURL}...`);

  const stickerList = [];
  for (const stickerLi of stickerLiList) {
    const stickerJSON = JSON.parse(stickerLi.dataset.preview);
    stickerList.push(stickerJSON);
  }

  // Each sticker has a static URL, some have either an animation or popup url which is an animated png.
  for (let i = 0; i < stickerList.length; i++) {
    const sticker = stickerList[i];
    const staticUrl = stickerURL(sticker.id);
    const response = await axios({
      method: 'get',
      url: staticUrl,
      responseType: 'stream',
    });
    const stickerImage = path.join(packDir, `${sticker.id}.png`);
    response.data.pipe(fs.createWriteStream(stickerImage));

    if (sticker.type === 'animation' || sticker.type === 'popup') {
      let downloadURL =
        sticker.type === 'animation' ? animatedStickerURL(sticker.id) : popupStickerURL(sticker.id);
      const response = await axios({
        method: 'get',
        url: downloadURL,
        responseType: 'stream',
      });
      const stickerImage = path.join(packDir, `${sticker.id}_${sticker.type}.png`);
      response.data.pipe(fs.createWriteStream(stickerImage));
    }

    console.log(`Downloaded ${i + 1}/${stickerList.length} stickers`);
  }
  // save title to info.json
  const info = {
    title,
    storeURL,
  };
  fs.writeFileSync(path.join(packDir, 'info.json'), JSON.stringify(info));
  return title;
};

module.exports = downloadPack;

// downloadPack('https://store.line.me/stickershop/product/28757/ja');
