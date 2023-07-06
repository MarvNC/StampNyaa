let mouseX, mouseY;
let sorting = false;
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// close on X button
const closeButton = document.getElementById('close-button');
closeButton.addEventListener('click', () => {
  api.closeWindow();
});

window.addEventListener('DOMContentLoaded', async () => {
  // change theme
  let theme = await api.getTheme();
  function setTheme(theme) {
    const colors = [
      'primary-color',
      'background-color',
      'white-color',
      'red-color',
      'green-color',
      'yellow-color',
      'gray-color',
      'text-color',
    ];
    const root = document.documentElement;
    for (const color of colors) {
      root.style.setProperty(`--${color}`, `var(--${theme}-${color})`);
    }
  }
  setTheme(theme);
  const themeSelect = document.getElementById('theme-select');
  const themes = [...themeSelect.children];
  for (const themeSelector of themes) {
    const elementTheme = themeSelector.dataset.theme;
    if (elementTheme === theme) {
      themeSelector.classList.add('active');
    }
    themeSelector.style.backgroundColor = `var(--${elementTheme}-background-color)`;

    themeSelector.addEventListener('click', () => {
      for (const themeSelector of themes) {
        themeSelector.classList.remove('active');
      }
      themeSelector.classList.add('active');
      theme = elementTheme;
      setTheme(theme);
      api.setTheme(theme);
    });
  }

  const { stickerPacksMap, stickerPacksOrder, favorites } = await api.ready();
  const stickerContainer = document.getElementById('sticker-list');
  const stickerPackListDiv = document.getElementById('sticker-pack-list');
  let stickerPackIDsOrder = stickerPacksOrder;

  //favorites
  const favoriteDiv = document.createElement('div');
  favoriteDiv.classList.add('sticker-pack');
  favoriteDiv.id = `sticker-pack-container-favorites`;

  const favoriteHeader = createElementFromHTML(/* html */ `
  <div class="sticker-pack-header">
  <a class="sticker-pack-title" href="" target="_blank">⭐</a>
  <a class="sticker-pack-author" href="" target="_blank"></a>
</div>
  `);
  favoriteDiv.appendChild(favoriteHeader);
  favoriteDiv.style.display = 'none';
  stickerContainer.appendChild(favoriteDiv);

  //function for adding davorites to dom
  function renderFav(favorite) {
    favoriteDiv.style.display = 'grid';
    const sticker = stickerPacksMap[favorite.packID].stickers[favorite.stickerID];
    const stickerDiv = document.createElement('div');
    stickerDiv.classList.add('sticker');
    stickerDiv.classList.add(`${favorite.packID}-${favorite.stickerID}`)
    stickerDiv.dataset.stickerID = favorite.stickerID;
    stickerDiv.dataset.type = sticker.type;
    stickerDiv.dataset.filepath = sticker.filepath;
    stickerDiv.dataset.packID = favorite.packID;

    const stickerImg = document.createElement('img');
    stickerImg.src = sticker.filepath;

    stickerDiv.appendChild(stickerImg);
    favoriteDiv.appendChild(stickerDiv);

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

    //right click to remove favorite
    stickerDiv.addEventListener('mousedown', async (e) => {
      if (e.button == 2) {
        api.unfavoriteSticker(stickerDiv.dataset.packID, stickerDiv.dataset.stickerID);
        var existing = document.getElementsByClassName(`${stickerDiv.dataset.packID}-${stickerDiv.dataset.stickerID}`);
        while (existing.length > 0) {
          existing[0].remove();
        }
        if (favoriteDiv.children.length == 1) {
          favoriteDiv.style.display = 'none';
        }
      }
    }, false)
  }
  //render em
  if (favorites.length > 0) {
    favoriteDiv.style.display = 'grid';

    for (const favorite of favorites) {
      renderFav(favorite);
    }


    stickerContainer.appendChild(favoriteDiv);
  }



  for (const stickerPackID of stickerPackIDsOrder) {
    const stickerPack = stickerPacksMap[stickerPackID];
    const { title, mainIcon, stickers, author, authorURL, storeURL } = stickerPack;

    // Sticker main icon
    const stickerIconDiv = document.createElement('div');
    stickerIconDiv.classList.add('sticker-pack-icon-wrapper');
    stickerIconDiv.dataset.packID = stickerPackID;

    const stickerIconImg = document.createElement('img');
    stickerIconImg.src = mainIcon;
    stickerIconDiv.appendChild(stickerIconImg);
    stickerPackListDiv.appendChild(stickerIconDiv);

    // Sticker pack
    const stickerPackDiv = document.createElement('div');
    stickerPackDiv.classList.add('sticker-pack');
    stickerPackDiv.dataset.packID = stickerPackID;
    stickerPackDiv.id = `sticker-pack-container-${stickerPackID}`;

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

      //On right click, favorite sticker
      stickerDiv.addEventListener('mousedown', async (e) => {
        if (e.button == 2) {
          if (document.getElementsByClassName(`${stickerDiv.dataset.packID}-${stickerDiv.dataset.stickerID}`).length == 0) {
            api.favoriteSticker(stickerDiv.dataset.packID, stickerDiv.dataset.stickerID);
            renderFav({ packID: stickerDiv.dataset.packID, stickerID: stickerDiv.dataset.stickerID })
          }
        }
      }, false)

    }

    stickerContainer.appendChild(stickerPackDiv);

    // Scroll to sticker pack on hover
    stickerIconDiv.addEventListener('mouseover', (e) => {
      stickerPackDiv.scrollIntoView({ behavior: 'instant' });
      // remove active from all sticker pack icons
      document.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
      // add active to current sticker pack icon
      if (!sorting) {
        e.currentTarget.classList.add('active');
      }
    });
  }

  // Scroll sticker pack icons list when scrolling sticker packs
  stickerContainer.addEventListener('scroll', (e) => {
    // check if mouse is over stickerContainer
    const stickerContainerRect = stickerContainer.getBoundingClientRect();
    if (
      mouseX >= stickerContainerRect.left &&
      mouseX <= stickerContainerRect.right &&
      mouseY >= stickerContainerRect.top &&
      mouseY <= stickerContainerRect.bottom
    ) {
      const topElementOffset = stickerPackListDiv.offsetTop;
      const scrollPos = e.currentTarget.scrollTop + topElementOffset;
      const stickerPackDivs = document.getElementsByClassName('sticker-pack');
      const stickerPackIconDivs = document.getElementsByClassName('sticker-pack-icon-wrapper');
      for (let i = 0; i < stickerPackDivs.length; i++) {
        const stickerPackDiv = stickerPackDivs[i];
        const stickerPackIconDiv = stickerPackIconDivs[i];
        const stickerPackDivTop = stickerPackDiv.offsetTop;
        const stickerPackDivBottom = stickerPackDivTop + stickerPackDiv.offsetHeight;
        if (scrollPos >= stickerPackDivTop && scrollPos <= stickerPackDivBottom) {
          stickerPackIconDiv.scrollIntoView({ behavior: 'instant' });
          stickerPackIconDiv.classList.add('active');
        } else {
          stickerPackIconDiv.classList.remove('active');
        }
      }
      return;
    }
  });

  // Download sticker pack on add button
  const addButton = document.getElementById('add-button');
  const addStickerModalBackground = document.getElementById('add-sticker-background');
  const input = document.getElementById('add-sticker-input');
  const addStickerButton = document.getElementById('add-sticker-button');
  const lineURLRegex = /^https?:\/\/store\.line\.me\/stickershop\/product\/\d+(\/\w{2})?$/;

  let downloadActive = false;

  function errorButton(addStickerButton) {
    addStickerButton.classList.add('error');
    addStickerButton.firstElementChild.textContent = 'close';
    setTimeout(() => {
      addStickerButton.classList.remove('error');
      addStickerButton.firstElementChild.textContent = 'check';
    }, 600);
  }

  addButton.addEventListener('click', async () => {
    addStickerModalBackground.style.display = 'block';
  });

  addStickerModalBackground.addEventListener('click', async (e) => {
    if (e.target === addStickerModalBackground && !downloadActive) {
      addStickerModalBackground.style.display = 'none';
      window.location.reload();
    }
  });

  addStickerButton.addEventListener('click', async () => {
    if (downloadActive) {
      return;
    }
    const url = input.value;
    if (!lineURLRegex.test(url)) {
      errorButton(addStickerButton);
      return;
    }

    api.downloadStickerPack(url);

    downloadActive = true;
    addStickerButton.classList.add('loading');
    addStickerButton.firstElementChild.textContent = 'more_horiz';
  });

  const addStickerDownloadFeedback = document.getElementById('add-sticker-download-feedback');
  const downloadProgressBar = document.getElementById('download-progress');
  const addStickerTitle = document.getElementById('add-sticker-title');
  const progressText = document.getElementById('progress-text');

  window.onmessage = (event) => {
    // Updates the progress bar and button
    function finishDownload(addStickerButton) {
      downloadActive = false;
      addStickerButton.classList.remove('loading');
      addStickerButton.firstElementChild.textContent = 'check';
    }
    const data = event.data;
    if (data.type === 'download-sticker-pack') {
      if (data.error) {
        finishDownload(addStickerButton);
        setTimeout(() => {
          errorButton(addStickerButton);
        }, 100);
        return;
      }
      addStickerDownloadFeedback.style.display = 'block';
      addStickerTitle.textContent = data.title;
      downloadProgressBar.style.width = `${(data.progress / data.stickerCount) * 100}%`;
      progressText.textContent = `${data.progress}/${data.stickerCount}`;
      if (data.progress === data.stickerCount) {
        finishDownload(addStickerButton);
      }
    }
  };

  // Settings modal stuff
  const settingsModalBackground = document.getElementById('settings-background');
  const settingsButton = document.getElementById('settings-button');

  settingsButton.addEventListener('click', () => {
    settingsModalBackground.style.display = 'block';
  });

  settingsModalBackground.addEventListener('click', (e) => {
    if (e.target === settingsModalBackground) {
      settingsModalBackground.style.display = 'none';
    }
  });

  const hotkeyInputContainer = document.getElementById('hotkey-input-container');
  const hotkeyInput = document.getElementById('hotkey-input');
  const pressedkeys = new Set();
  let hotkeyString = await api.getHotkey();
  hotkeyInput.value = hotkeyString;
  let newHotkey = '';

  function keyToUpper(key) {
    if (key.length === 1) {
      key = key.toUpperCase();
    }
    return key;
  }

  hotkeyInput.addEventListener('keydown', (e) => {
    const key = keyToUpper(e.key);
    if (key == 'Meta') {
      return;
    }

    api.disableHotkey();
    e.preventDefault();
    hotkeyInputContainer.classList.add('active');
    if (key === 'Escape') {
      hotkeyInput.value = hotkeyString;
      pressedkeys.clear();
      return;
    } else {
      pressedkeys.add(key);
      newHotkey = [...pressedkeys].join('+');
      hotkeyInput.value = newHotkey;
    }
  });
  hotkeyInput.addEventListener('keyup', (e) => {
    const key = keyToUpper(e.key);
    e.preventDefault();
    pressedkeys.delete(key);
    if (pressedkeys.size === 0) {
      hotkeyInputContainer.classList.remove('active');
      // save hotkey
      hotkeyString = newHotkey;
      api.setHotkey(hotkeyString);
      api.enableHotkey();
      return;
    }
  });

  const runOnStartup = document.getElementById('run-on-startup');
  const runOnStartupCheck = document.getElementById('run-on-startup-check');
  const runOnStartupEnabled = await api.getRunOnStartup();
  runOnStartupCheck.style.display = runOnStartupEnabled ? 'block' : 'none';
  runOnStartup.addEventListener('click', () => {
    if (runOnStartupCheck.style.display === 'none') {
      runOnStartupCheck.style.display = 'block';
      api.setRunOnStartup(true);
    } else {
      runOnStartupCheck.style.display = 'none';
      api.setRunOnStartup(false);
    }
  });

  // Sort sticker packs on drag
  const sortable = new Draggable.Sortable(stickerPackListDiv, {
    draggable: '.sticker-pack-icon-wrapper',
  });
  sortable.on('sortable:start', (event) => {
    sorting = true;
  });
  sortable.on('sortable:sorted', (event) => {
    // add active to sorted element
    event.data.dragEvent.data.source.classList.add('active');
  });
  sortable.on('sortable:stop', (event) => {
    sorting = false;
    // rearrange sticker packs
    const rearrangedStickerPack = event.dragEvent.data.source;
    const rearrangedStickerPackID = rearrangedStickerPack.dataset.packID;
    const rearrangedStickerPackContainer = document.getElementById(
      `sticker-pack-container-${rearrangedStickerPackID}`
    );
    stickerContainer.removeChild(rearrangedStickerPackContainer);
    stickerPackIDsOrder = stickerPackIDsOrder.filter((id) => id !== rearrangedStickerPackID);
    stickerPackIDsOrder.splice(event.data.newIndex, 0, rearrangedStickerPackID);
    // event.data.newIndex is the index of the element in the list
    if (event.data.newIndex !== stickerPackIDsOrder.length - 1) {
      stickerContainer.insertBefore(
        rearrangedStickerPackContainer,
        document.getElementById(
          'sticker-pack-container-' + stickerPackIDsOrder[event.data.newIndex + 1]
        )
      );
    } else {
      stickerContainer.appendChild(rearrangedStickerPackContainer);
    }

    api.setStickerPackOrder(stickerPackIDsOrder);
  });
});

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}
