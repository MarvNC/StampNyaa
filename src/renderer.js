const closeButton = document.getElementById('close-button');

// close on X button
closeButton.addEventListener('click', () => {
  console.log('close button clicked');
  api.closeWindow();
});

window.addEventListener('DOMContentLoaded', async () => {
  console.log('dom content loaded');
  const { stickerPacksMap } = await api.ready();
  const stickerContainer = document.getElementById('sticker-list');
  const stickerPackListDiv = document.getElementById('sticker-pack-list');

  for (const stickerPackID of Object.keys(stickerPacksMap)) {
    const stickerPack = stickerPacksMap[stickerPackID];
    const { title, mainIcon, stickers, author, authorURL, storeURL } = stickerPack;

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

    const stickerPackHeader = createElementFromHTML(/* html */ `
<div class="sticker-pack-header">
  <a class="sticker-pack-title" href="${storeURL}" target="_blank">${title}</a>
  <a class="sticker-pack-author" href="${authorURL}" target="_blank">${author}</a>
</div>
`);
    stickerPackDiv.appendChild(stickerPackHeader);

    // loop through stickers
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

    // Scroll to sticker pack on hover
    stickerIconDiv.addEventListener('mouseover', (e) => {
      stickerPackDiv.scrollIntoView({ behavior: 'instant' });
    });

    // Scroll sticker pack icons list when scrolling sticker packs
    stickerPackDiv.addEventListener('mouseover', (e) => {
      stickerIconDiv.scrollIntoViewIfNeeded({ behavior: 'instant' });
      stickerIconDiv.classList.add('active');
    });
    stickerPackDiv.addEventListener('mouseout', (e) => {
      stickerIconDiv.classList.remove('active');
    });
  }

  // Download sticker pack on add button
  const addButton = document.getElementById('add-button');
  const modalBackground = document.getElementById('add-sticker-background');
  const input = document.getElementById('add-sticker-input');
  const addStickerButton = document.getElementById('add-sticker-button');
  const lineURLRegex = /^https?:\/\/store\.line\.me\/stickershop\/product\/\d+(\/\w{2})?$/;

  let downloadActive = false;

  addButton.addEventListener('click', async () => {
    modalBackground.style.display = 'block';
  });

  modalBackground.addEventListener('click', async (e) => {
    if (e.target === modalBackground && !downloadActive) {
      modalBackground.style.display = 'none';
      window.location.reload();
    }
  });

  addStickerButton.addEventListener('click', async () => {
    const url = input.value;
    if (!lineURLRegex.test(url)) {
      addStickerButton.classList.add('error');
      addStickerButton.firstElementChild.textContent = 'close';
      setTimeout(() => {
        addStickerButton.classList.remove('error');
        addStickerButton.firstElementChild.textContent = 'check';
      }, 400);
      return;
    }

    api.downloadStickerPack(url);

    downloadActive = true;
    addStickerButton.classList.add('loading');
    addStickerButton.firstElementChild.textContent = 'more_horiz';
    addStickerButton.disabled = true;
  });

  const addStickerDownloadFeedback = document.getElementById('add-sticker-download-feedback');
  const downloadProgressBar = document.getElementById('download-progress');
  const addStickerTitle = document.getElementById('add-sticker-title');
  const progressText = document.getElementById('progress-text');

  window.onmessage = (event) => {
    const data = event.data;
    if (data.type === 'download-sticker-pack') {
      addStickerDownloadFeedback.style.display = 'block';
      addStickerTitle.textContent = data.title;
      downloadProgressBar.style.width = `${(data.progress / data.stickerCount) * 100}%`;
      progressText.textContent = `${data.progress}/${data.stickerCount}`;
      if (data.progress === data.stickerCount) {
        downloadActive = false;
        addStickerButton.classList.remove('loading');
        addStickerButton.firstElementChild.textContent = 'check';
        addStickerButton.disabled = false;
      }
    }
  };
});

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}
