const closeButton = document.getElementById('close-button');

// close on X button
closeButton.addEventListener('click', () => {
  console.log('close button clicked');
  api.closeWindow();
});

const minimizeButton = document.getElementById('minimize-button');

// minimize on - button
minimizeButton.addEventListener('click', () => {
  console.log('minimize button clicked');
  api.minimizeWindow();
});

window.addEventListener('DOMContentLoaded', async () => {
  console.log('dom content loaded');
  const { dirName, stickerPackList } = await api.ready();
  const stickerContainer = document.getElementById('sticker-list');
  const stickerPackListDiv = document.getElementById('sticker-pack-list');

  for (const stickerPack of stickerPackList) {
    const stickerIconDiv = document.createElement('div');
    stickerIconDiv.classList.add('sticker-pack-icon');
    const stickerIconImg = document.createElement('img');
    // TODO fix dirs
    stickerIconImg.src = `../assets/icon.png`;
    // stickerIconImg.src = path.join(dirName, stickerPack.mainIcon);
    stickerIconDiv.appendChild(stickerIconImg);
    stickerPackListDiv.appendChild(stickerIconDiv);

    const stickerPackDiv = document.createElement('div');
    stickerPackDiv.classList.add('sticker-pack');
    
    const stickerPackTitleDiv = document.createElement('div');
    stickerPackTitleDiv.classList.add('sticker-pack-title');

    const stickerPackTitle = document.createElement('h2');
    stickerPackTitle.innerText = stickerPack.title;

    stickerPackTitleDiv.appendChild(stickerPackTitle);
    stickerPackDiv.appendChild(stickerPackTitleDiv);

    for (const sticker of stickerPack.stickers) {
      const stickerDiv = document.createElement('div');
      stickerDiv.classList.add('sticker');
      const stickerImg = document.createElement('img');
      // TODO fix dirs
      stickerImg.src = `../assets/icon.png`;
      // stickerImg.src = path.join(dirName, sticker.path);
      stickerDiv.appendChild(stickerImg);
      stickerPackDiv.appendChild(stickerDiv);
    }

    stickerContainer.appendChild(stickerPackDiv);
  }
});
