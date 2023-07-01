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
  const { stickerPacksMap } = await api.ready();
  const stickerContainer = document.getElementById('sticker-list');
  const stickerPackListDiv = document.getElementById('sticker-pack-list');

  for (const stickerPackID of Object.keys(stickerPacksMap)) {
    const stickerPack = stickerPacksMap[stickerPackID];
    const { title, mainIcon, stickers } = stickerPack;

    // Sticker main icon
    const stickerIconDiv = document.createElement('div');
    stickerIconDiv.classList.add('sticker-pack-icon');
    const stickerIconImg = document.createElement('img');
    stickerIconImg.src = mainIcon;
    stickerIconDiv.appendChild(stickerIconImg);
    stickerPackListDiv.appendChild(stickerIconDiv);

    // Sticker pack
    const stickerPackDiv = document.createElement('div');
    stickerPackDiv.classList.add('sticker-pack');

    // Title
    const stickerPackTitleDiv = document.createElement('div');
    stickerPackTitleDiv.classList.add('sticker-pack-title');
    const stickerPackTitle = document.createElement('h2');
    stickerPackTitle.innerText = title;

    stickerPackTitleDiv.appendChild(stickerPackTitle);
    stickerPackDiv.appendChild(stickerPackTitleDiv);

    for (const stickerID of Object.keys(stickers)) {
      const sticker = stickers[stickerID];
      const stickerDiv = document.createElement('div');
      stickerDiv.classList.add('sticker');
      stickerDiv.dataset.stickerID = stickerID;
      stickerDiv.dataset.type = sticker.type;
      stickerDiv.dataset.packName = title;
      stickerDiv.dataset.filepath = sticker.filepath;
      stickerDiv.dataset.packID = stickerPackID;

      const stickerImg = document.createElement('img');
      stickerImg.src = sticker.filepath;

      stickerDiv.appendChild(stickerImg);
      stickerPackDiv.appendChild(stickerDiv);

      // if special type
      if (sticker.type !== 'static') {
        stickerDiv.classList.add('special');
        stickerDiv.dataset.specialPath = sticker.specialPath;
        stickerDiv.addEventListener('mouseover', async (e) => {
          const { specialPath } = e.currentTarget.dataset;
          e.currentTarget.firstChild.src = specialPath;
        });
        stickerDiv.addEventListener('mouseout', async (e) => {
          const { filepath } = e.currentTarget.dataset;
          e.currentTarget.firstChild.src = filepath;
        });
      }

      // on click send sticker
      stickerDiv.addEventListener('click', async (e) => {
        // determine whether special or not, send appropriate sticker path
        const { type, filepath, specialPath } = e.currentTarget.dataset;
        let stickerPath = filepath;
        if (type !== 'static') {
          stickerPath = specialPath;
        }
        api.sendSticker(stickerPath);
      });
    }

    stickerContainer.appendChild(stickerPackDiv);

    // JS stuff
    stickerIconDiv.addEventListener('mouseover', (e) => {
      stickerPackDiv.scrollIntoView({ behavior: 'instant' });
    });
  }
});
