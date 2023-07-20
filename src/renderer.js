// Always updated x/y pos
let mouseX, mouseY;

// Whether the user is currently moving a sticker pack icon
let sorting = false;
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
// Size to resize stickers to
let resizeWidth;

window.addEventListener('DOMContentLoaded', async () => {
  setUpMenuBarButtons();

  setUpThemeSelect();

  populateStickerPacks();

  setUpAddStickerModal();

  setUpSettingsModal();

  setUpUpdateModal();
});

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

async function setUpMenuBarButtons() {
  // close on X button
  const closeButton = document.getElementById('close-button');
  closeButton.addEventListener('click', () => {
    api.closeWindow();
  });
}

async function setUpThemeSelect() {
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
}

async function populateStickerPacks() {
  const { stickerPacksMap, stickerPacksOrder } = await api.ready();
  const stickerContainer = document.getElementById('sticker-list');
  const stickerPackListDiv = document.getElementById('sticker-pack-list');
  let stickerPackIDsOrder = stickerPacksOrder;

  function setUpStickerPack(stickerPackID, stickerPack) {
    const {
      title,
      mainIcon,
      stickers,
      author = '',
      authorURL = '',
      storeURL = '',
      noIcon = false,
    } = stickerPack;

    // Sticker main icon
    if (!noIcon) {
      const stickerIconDiv = document.createElement('div');
      stickerIconDiv.classList.add('sticker-pack-icon-wrapper');
      stickerIconDiv.dataset.packID = stickerPackID;

      const stickerIconImg = document.createElement('img');
      stickerIconImg.src = mainIcon;
      stickerIconDiv.appendChild(stickerIconImg);
      stickerPackListDiv.appendChild(stickerIconDiv);

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
    for (const sticker of stickers) {
      stickerPackDiv.appendChild(createSticker(sticker));
    }

    stickerContainer.appendChild(stickerPackDiv);
  }

  function createSticker(sticker) {
    const stickerID = sticker.stickerID;
    const stickerDiv = document.createElement('div');
    stickerDiv.classList.add('sticker');
    stickerDiv.dataset.stickerID = stickerID;
    stickerDiv.dataset.type = sticker.type;
    stickerDiv.dataset.filepath = sticker.filepath;
    stickerDiv.dataset.packID = sticker.stickerPackID;

    const stickerImg = document.createElement('img');
    stickerImg.src = sticker.filepath;

    stickerDiv.appendChild(stickerImg);

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
      api.sendSticker(stickerPath, { stickerPackID, title, author, resizeWidth });
    });

    // on right click add to favorites
    stickerDiv.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      const { packID, stickerID } = e.currentTarget.dataset;
      toggleFavorite(packID, stickerID);
    });

    return stickerDiv;
  }

  // Set up favorites
  const favorites = await api.getFavorites();
  setUpStickerPack('favorites', {
    title: '<span class="material-symbols-outlined">star</span> Favorites',
    author: '',
    stickers: favorites.map(({ PackID, StickerID }) => {
      // find sticker pack
      const stickerPack = stickerPacksMap[PackID];
      const sticker = stickerPack.stickers.find((sticker) => sticker.stickerID === StickerID);
      return sticker;
    }),
    storeURL: 'https://store.line.me/stickershop/',
    noIcon: true,
  });

  function toggleFavorite(PackID, ID) {
    const favoritesPackDiv = document.getElementById('sticker-pack-container-favorites');
    // check if sticker already favorited
    const stickerDiv = favoritesPackDiv.querySelector(
      `.sticker[data-pack-i-d="${PackID}"][data-sticker-i-d="${ID}"]`
    );
    if (stickerDiv) {
      // remove from favorites
      stickerDiv.remove();
    } else {
      const stickerPackDiv = createSticker(
        stickerPacksMap[PackID].stickers.find((sticker) => sticker.stickerID === ID)
      );
      favoritesPackDiv.appendChild(stickerPackDiv);
    }
    updateFavorites();
  }

  function updateFavorites() {
    const favoritedStickers = [
      ...document.getElementById('sticker-pack-container-favorites').querySelectorAll('.sticker'),
    ];
    api.setFavorites(
      favoritedStickers.map((stickerDiv) => ({
        PackID: stickerDiv.dataset.packID,
        StickerID: stickerDiv.dataset.stickerID,
      }))
    );
  }

  // Set up most used

  for (const stickerPackID of stickerPackIDsOrder) {
    const stickerPack = stickerPacksMap[stickerPackID];

    setUpStickerPack(stickerPackID, stickerPack);
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
      for (let i = 0; i < stickerPackDivs.length; i++) {
        const stickerPackDiv = stickerPackDivs[i];
        const packID = stickerPackDiv.dataset.packID;
        const stickerPackIconDiv = document.querySelector(
          `.sticker-pack-icon-wrapper[data-pack-i-d="${packID}"]`
        );
        // Check if sticker pack icon exists
        if (!stickerPackIconDiv) continue;
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
    // Remove rearrangedStickerPackID from stickerPackIDsOrder and insert it at the new index
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
}

async function setUpAddStickerModal() {
  // Download sticker pack on add button
  const addButton = document.getElementById('add-button');
  const addStickerModalBackground = document.getElementById('add-sticker-background');
  const addStickerInput = document.getElementById('add-sticker-input');
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
    addStickerInput.focus();
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
    const url = addStickerInput.value;
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
}

async function setUpSettingsModal() {
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

  // Set hotkey
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

  // Run on startup
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

  // Width setting
  const widthInput = document.getElementById('fit-to-width-input');
  resizeWidth = await api.getResizeWidth();
  widthInput.value = resizeWidth;
  widthInput.addEventListener('change', () => {
    // validate
    const inputWidth = parseInt(widthInput.value);
    if (isNaN(inputWidth) || inputWidth <= 0) {
      widthInput.value = resizeWidth;
      return;
    }
    resizeWidth = inputWidth;
    api.setResizeWidth(resizeWidth);
  });
  widthInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      widthInput.blur();
    }
  });

  // Version
  const version = await api.getVersion();
  document.getElementById('versionString').textContent = version;
}

async function setUpUpdateModal() {
  // Update modal
  const updateModalBackground = document.getElementById('update-background');
  const updateText = document.getElementById('update-text');
  async function checkUpdates() {
    const needsUpdateVersion = await api.getUpdates();
    console.log(`Needs update: ${needsUpdateVersion}`);
    if (needsUpdateVersion) {
      updateModalBackground.style.display = 'block';
      updateText.textContent = `New Update ${needsUpdateVersion} Available!`;
      const updateButton = document.getElementById('update-button');
      updateButton.addEventListener('click', () => {
        updateModalBackground.style.display = 'none';
      });
    }
  }
  checkUpdates();
  // Check once per day
  setInterval(checkUpdates, 24 * 60 * 60 * 1000);
}
