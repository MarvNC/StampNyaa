/**
 * @typedef {import('../../libs/draggable@1.0.0-beta.11_lib_draggable.bundle').SortableEvent} SortableEvent
 */

class StickerRenderer {
  // Whether the user is currently moving a sticker pack icon
  sorting;
  // The current mouse x/y position
  mouseX;
  mouseY;
  stickerPacksMap;
  stickerPacksOrder;
  stickerContainer;
  stickerPackListDiv;
  constructor() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    this.sorting = false;
    this.stickerContainer = document.getElementById('sticker-list');
    this.stickerPackListDiv = document.getElementById('sticker-pack-list');
  }
  /**
   * Sets up sticker packs
   * @returns {Promise<void>}
   */
  async populateStickerPacks() {
    ({ stickerPacksMap: this.stickerPacksMap, stickerPacksOrder: this.stickerPacksOrder } =
      await api.ready());

    this.updateMostUsed();

    // Set up favorites
    const favorites = await api.getFavorites();
    const favoritesDiv = this.makeAndSetUpStickerPack('favorites', {
      title: '<span class="material-symbols-outlined">star</span> Favorites',
      author: '',
      stickers: favorites.map(({ PackID, StickerID }) => {
        // find sticker pack
        const stickerPack = this.stickerPacksMap[PackID];
        const sticker = stickerPack.stickers.find((sticker) => sticker.stickerID === StickerID);
        return sticker;
      }),
      storeURL: 'https://store.line.me/stickershop/',
      noIcon: true,
    });
    this.stickerContainer.appendChild(favoritesDiv);
    this.setUpDraggableFavorites(favoritesDiv);

    for (const stickerPackID of this.stickerPacksOrder) {
      const stickerPack = this.stickerPacksMap[stickerPackID];

      const stickerPackDiv = this.makeAndSetUpStickerPack(stickerPackID, stickerPack);
      this.stickerContainer.appendChild(stickerPackDiv);
    }

    // Scroll sticker pack icons list when scrolling sticker packs
    this.stickerContainer.addEventListener('scroll', (e) => {
      // check if mouse is over this.stickerContainer
      const stickerContainerRect = this.stickerContainer.getBoundingClientRect();
      if (
        this.mouseX >= stickerContainerRect.left &&
        this.mouseX <= stickerContainerRect.right &&
        this.mouseY >= stickerContainerRect.top &&
        this.mouseY <= stickerContainerRect.bottom
      ) {
        const topElementOffset = this.stickerPackListDiv.offsetTop;
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
    this.setUpDraggableIcons();
  }
  /**
   * Sets up draggable sticker pack icons and updates sticker pack order
   */
  setUpDraggableIcons() {
    /**
     * @type {SortableEvent}
     */
    const sortable = new Draggable.Sortable(this.stickerPackListDiv, {
      draggable: '.sticker-pack-icon-wrapper',
    });
    sortable.on('sortable:start', (event) => {
      this.sorting = true;
    });
    sortable.on('sortable:sorted', (event) => {
      // add active to sorted element
      event.data.dragEvent.data.source.classList.add('active');
    });
    sortable.on('sortable:stop', (event) => {
      this.sorting = false;
      // rearrange sticker packs
      const rearrangedStickerPack = event.dragEvent.data.source;
      const rearrangedStickerPackID = rearrangedStickerPack.dataset.packID;
      const rearrangedStickerPackContainer = document.getElementById(
        `sticker-pack-container-${rearrangedStickerPackID}`
      );
      this.stickerContainer.removeChild(rearrangedStickerPackContainer);
      // Remove rearrangedStickerPackID from this.stickerPacksOrder and insert it at the new index
      this.stickerPacksOrder = this.stickerPacksOrder.filter(
        (id) => id !== rearrangedStickerPackID
      );
      this.stickerPacksOrder.splice(event.data.newIndex, 0, rearrangedStickerPackID);
      // event.data.newIndex is the index of the element in the list
      if (event.data.newIndex !== this.stickerPacksOrder.length - 1) {
        this.stickerContainer.insertBefore(
          rearrangedStickerPackContainer,
          document.getElementById(
            'sticker-pack-container-' + this.stickerPacksOrder[event.data.newIndex + 1]
          )
        );
      } else {
        this.stickerContainer.appendChild(rearrangedStickerPackContainer);
      }

      api.setStickerPackOrder(this.stickerPacksOrder);
    });
  }
  /**
   * Allows for dragging icons in the favorites pack section
   * @param {HTMLDivElement} favoritesPackDiv
   */
  setUpDraggableFavorites(favoritesPackDiv) {
    /**
     * @type {SortableEvent}
     */
    const sortable = new Draggable.Sortable(favoritesPackDiv, {
      draggable: '.sticker',
    });
    sortable.on('sortable:sorted', (event) => {});
    sortable.on('sortable:stop', (event) => {
      setTimeout(() => {
        // wait for the temporary sortable to disappear
        this.updateFavorites();
      }, 100);
    });
  }
  /**
   * Creates a sticker pack and sets up the sticker pack icon
   * @param {string} stickerPackID
   * @param {Object} stickerPack
   * @returns {HTMLDivElement}
   */
  makeAndSetUpStickerPack(stickerPackID, stickerPack) {
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
      this.stickerPackListDiv.appendChild(stickerIconDiv);

      // Scroll to sticker pack on hover
      stickerIconDiv.addEventListener('mouseover', (e) => {
        stickerPackDiv.scrollIntoView({ behavior: 'instant' });
        // remove active from all sticker pack icons
        document.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
        // add active to current sticker pack icon
        if (!this.sorting) {
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
      stickerPackDiv.appendChild(this.createSticker(sticker));
    }

    return stickerPackDiv;
  }
  /**
   * Fetches and updates the most used sticker pack section
   */
  updateMostUsed() {
    let mostUsedDiv = document.getElementById('sticker-pack-container-most-used');
    if (!mostUsedDiv) {
      mostUsedDiv = document.createElement('div');
      mostUsedDiv.classList.add('sticker-pack');
      mostUsedDiv.id = 'sticker-pack-container-most-used';
      this.stickerContainer.appendChild(mostUsedDiv);
    }
    // reset most used contents
    mostUsedDiv.innerHTML = '';

    api.getMostUsed().then((mostUsed) => {
      const newDiv = this.makeAndSetUpStickerPack('most-used', {
        title: '<span class="material-symbols-outlined">history</span> Most Used',
        author: '',
        stickers: mostUsed.map(({ PackID, StickerID }) => {
          // find sticker pack
          const stickerPack = this.stickerPacksMap[PackID];
          const sticker = stickerPack.stickers.find((sticker) => sticker.stickerID === StickerID);
          return sticker;
        }),
        storeURL: 'https://store.line.me/stickershop/',
        noIcon: true,
      });
      // reinsert most used at the top
      this.stickerContainer.insertBefore(newDiv, mostUsedDiv);
      // delete old most used
      this.stickerContainer.removeChild(mostUsedDiv);
    });
  }
  /**
   * Creates a sticker div and sets up the sticker
   * @param {Object} sticker
   * @returns {HTMLDivElement}
   */
  createSticker(sticker) {
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
      api
        .sendSticker(stickerPath, {
          stickerID: sticker.stickerID,
          stickerPackID: sticker.stickerPackID,
          title: this.stickerPacksMap[sticker.stickerPackID].title,
          author: this.stickerPacksMap[sticker.stickerPackID].author,
        })
        .then(() => {
          this.updateMostUsed();
        });
    });

    // on right click add to favorites
    stickerDiv.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      const { packID, stickerID } = e.currentTarget.dataset;
      this.toggleFavorite(packID, stickerID);
    });

    return stickerDiv;
  }
  /**
   * Toggles a sticker as a favorite
   * @param {string} PackID
   * @param {string} ID
   */
  toggleFavorite(PackID, ID) {
    const favoritesPackDiv = document.getElementById('sticker-pack-container-favorites');
    // check if sticker already favorited
    const stickerDiv = favoritesPackDiv.querySelector(
      `.sticker[data-pack-i-d="${PackID}"][data-sticker-i-d="${ID}"]`
    );
    if (stickerDiv) {
      // remove from favorites
      stickerDiv.remove();
      this.popupRemoveFavoriteFeedback();
    } else {
      const stickerPackDiv = this.createSticker(
        this.stickerPacksMap[PackID].stickers.find((sticker) => sticker.stickerID === ID)
      );
      favoritesPackDiv.appendChild(stickerPackDiv);
      this.popupAddFavoriteFeedback();
    }
    this.updateFavorites();
  }
  /**
   * Animates a feedback modal
   * @param {HTMLElement} modal
   * @returns {Promise<void>}
   */
  animateFeedbackModal(modal) {
    modal.classList.add('active');
    setTimeout(() => {
      modal.classList.remove('active');
      modal.classList.add('inactive');
      setTimeout(() => {
        modal.classList.remove('inactive');
      }, 500);
    }, 500);
  }
  popupAddFavoriteFeedback() {
    const addFavoriteFeedbackModal = document.querySelector('#add-favorite-feedback');
    this.animateFeedbackModal(addFavoriteFeedbackModal);
  }
  popupRemoveFavoriteFeedback() {
    const deleteFavoriteFeedbackModal = document.querySelector('#remove-favorite-feedback');
    this.animateFeedbackModal(deleteFavoriteFeedbackModal);
  }
  /**
   * Updates favorites in the database
   */
  updateFavorites() {
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
  /**
   * Gets and refreshes all sticker packs
   */
  refreshStickerPacks() {
    this.stickerContainer.innerHTML = '';
    this.populateStickerPacks();
  }
}

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}
