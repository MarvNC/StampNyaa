import { Sortable, SortableSortedEvent } from '@shopify/draggable';

class StickerRenderer {
  // Whether the user is currently moving a sticker pack icon
  sorting;
  // The current mouse x/y position
  mouseX = 0;
  mouseY = 0;
  stickerPacksMap = null as Record<string, StickerPack> | null;
  stickerPacksOrder = null as string[] | null;
  stickerContainer: HTMLDivElement;
  stickerPackListDiv: HTMLDivElement;
  constructor() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    this.sorting = false;
    this.stickerContainer = document.getElementById('sticker-list') as HTMLDivElement;
    this.stickerPackListDiv = document.getElementById('sticker-pack-list') as HTMLDivElement;
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
    const favorites = (await api.getFavorites()) as { PackID: string; StickerID: string }[];
    const favoritesDiv = this.makeAndSetUpStickerPack('favorites', {
      title: '<span class="material-symbols-outlined">star</span> Favorites',
      author: '',
      stickers: favorites.map(({ PackID, StickerID }) => {
        // find sticker pack
        const stickerPack = this.stickerPacksMap![PackID];
        const sticker = stickerPack.stickers.find((sticker) => sticker.stickerID === StickerID);
        return sticker;
      }),
      storeURL: 'https://store.line.me/stickershop/',
      noIcon: true,
    });
    if (favoritesDiv) {
      this.stickerContainer!.appendChild(favoritesDiv);
      this.setUpDraggableFavorites(favoritesDiv);
    }

    // set click to scroll to pack on icon for most-used and favorite
    const icons = ['most-used', 'favorites'];
    for (const icon of icons) {
      const iconDiv = document.getElementById(`${icon}-icon`) as HTMLDivElement;
      iconDiv.addEventListener('click', (e) => {
        const stickerPackDiv = document.getElementById(
          `sticker-pack-container-${icon}`
        ) as HTMLDivElement;
        stickerPackDiv.scrollIntoView({ behavior: 'instant' });
      });
    }

    for (const stickerPackID of this.stickerPacksOrder!) {
      const stickerPack = this.stickerPacksMap![stickerPackID];

      const stickerPackDiv = this.makeAndSetUpStickerPack(stickerPackID, stickerPack);
      if (stickerPackDiv) {
        this.stickerContainer.appendChild(stickerPackDiv);
      }
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
        const scrollPos = (e.currentTarget as HTMLDivElement).scrollTop + topElementOffset;
        const stickerPackDivs = document.getElementsByClassName(
          'sticker-pack'
        ) as HTMLCollectionOf<HTMLDivElement>;
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
    const sortable = new Sortable(this.stickerPackListDiv, {
      draggable: '.sticker-pack-icon-wrapper',
    });
    sortable.on('sortable:start', (event) => {
      this.sorting = true;
    });
    sortable.on('sortable:sorted', (event: SortableSortedEvent) => {
      // add active to sorted element
      event.dragEvent.source.classList.add('active');
    });
    sortable.on('sortable:stop', (event) => {
      this.sorting = false;
      // rearrange sticker packs
      const rearrangedStickerPack = event.dragEvent.source;
      const rearrangedStickerPackID = rearrangedStickerPack.dataset.packID as string;
      const rearrangedStickerPackContainer = document.getElementById(
        `sticker-pack-container-${rearrangedStickerPackID}`
      ) as HTMLDivElement;
      this.stickerContainer.removeChild(rearrangedStickerPackContainer);
      // Remove rearrangedStickerPackID from this.stickerPacksOrder and insert it at the new index
      this.stickerPacksOrder = this.stickerPacksOrder!.filter(
        (id) => id !== rearrangedStickerPackID
      );
      this.stickerPacksOrder.splice(event.newIndex, 0, rearrangedStickerPackID);
      // event.data.newIndex is the index of the element in the list
      if (event.newIndex !== this.stickerPacksOrder.length - 1) {
        this.stickerContainer.insertBefore(
          rearrangedStickerPackContainer,
          document.getElementById(
            'sticker-pack-container-' + this.stickerPacksOrder[event.newIndex + 1]
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
  setUpDraggableFavorites(favoritesPackDiv: HTMLDivElement) {
    /**
     * @type {SortableEvent}
     */
    const sortable = new Sortable(favoritesPackDiv, {
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
  makeAndSetUpStickerPack(stickerPackID: string, stickerPack: any) {
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
      // Don't add icon if it already exists
      if (!document.getElementById(`sticker-pack-icon-${stickerPackID}`)) {
        const stickerIconDiv = document.createElement('div');
        stickerIconDiv.classList.add('sticker-pack-icon-wrapper');
        stickerIconDiv.dataset.packID = stickerPackID;
        stickerIconDiv.id = `sticker-pack-icon-${stickerPackID}`;

        const stickerIconImg = document.createElement('img');
        stickerIconImg.src = mainIcon;
        stickerIconDiv.appendChild(stickerIconImg);
        this.stickerPackListDiv.appendChild(stickerIconDiv);

        // Scroll to sticker pack on hover
        stickerIconDiv.addEventListener('mouseover', (e) => {
          const stickerPackDiv = document.getElementById(
            `sticker-pack-container-${stickerPackID}`
          ) as HTMLDivElement;
          stickerPackDiv.scrollIntoView({ behavior: 'instant' });
          // remove active from all sticker pack icons
          document.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
          // add active to current sticker pack icon
          if (!this.sorting) {
            (e!.currentTarget! as HTMLDivElement).classList.add('active');
          }
        });
      }
    }

    // Make sticker pack if it doesn't exist
    if (!document.getElementById(`sticker-pack-container-${stickerPackID}`)) {
      const stickerPackDiv = document.createElement('div');
      stickerPackDiv.classList.add('sticker-pack');
      stickerPackDiv.dataset.packID = stickerPackID;
      stickerPackDiv.id = `sticker-pack-container-${stickerPackID}`;

      const stickerPackHeader = createElementFromHTML(/* html */ `
<div class="sticker-pack-header">
<a class="sticker-pack-title" href="${storeURL}" target="_blank">${title}</a>
<a class="sticker-pack-author" href="${authorURL}" target="_blank">${author}</a>
</div>
`) as HTMLDivElement;
      stickerPackDiv.appendChild(stickerPackHeader);

      // loop through stickers
      for (const sticker of stickers) {
        stickerPackDiv.appendChild(this.createSticker(sticker));
      }

      return stickerPackDiv;
    }
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

    api.getMostUsed().then((mostUsed: { PackID: string; StickerID: string }[]) => {
      // delete old most used
      this.stickerContainer.removeChild(
        document.getElementById('sticker-pack-container-most-used') as HTMLDivElement
      );
      const mostUsedDiv = this.makeAndSetUpStickerPack('most-used', {
        title: '<span class="material-symbols-outlined">history</span> Most Used',
        author: '',
        stickers: mostUsed.map(({ PackID, StickerID }) => {
          // find sticker pack
          const stickerPack = this.stickerPacksMap![PackID];
          const sticker = stickerPack.stickers.find((sticker) => sticker.stickerID === StickerID);
          return sticker;
        }),
        storeURL: 'https://store.line.me/stickershop/',
        noIcon: true,
      }) as HTMLDivElement;
      // reinsert most used before favorites div
      this.stickerContainer.insertBefore(
        mostUsedDiv,
        document.getElementById('sticker-pack-container-favorites')
      );
    });
  }
  /**
   * Creates a sticker div and sets up the sticker
   * @param {Object} sticker
   * @returns {HTMLDivElement}
   */
  createSticker(sticker: any) {
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
      // on hover change image to special
      stickerDiv.addEventListener('mouseover', async (e) => {
        const target = e.currentTarget as HTMLDivElement;
        const specialPath = target.dataset.specialPath!;
        const img = target.firstChild as HTMLImageElement;
        img.src = specialPath;
      });
      stickerDiv.addEventListener('mouseout', async (e) => {
        const target = e.currentTarget as HTMLDivElement;
        const filepath = target.dataset.filepath!;
        const img = target.firstChild as HTMLImageElement;
        img.src = filepath;
      });
    }

    // on click send sticker
    stickerDiv.addEventListener('click', async (e) => {
      // determine whether special or not, send appropriate sticker path
      const { type, filepath, specialPath } = (e.currentTarget as HTMLElement).dataset;
      let stickerPath = filepath;
      if (type !== 'static') {
        stickerPath = specialPath;
      }
      api
        .sendSticker(stickerPath, {
          stickerID: sticker.stickerID,
          stickerPackID: sticker.stickerPackID,
          title: this.stickerPacksMap![sticker.stickerPackID].title,
          author: this.stickerPacksMap![sticker.stickerPackID].author,
        })
        .then(() => {
          this.updateMostUsed();
        });
    });

    // on right click add to favorites
    stickerDiv.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      const { packID, stickerID } = target.dataset as { packID: string; stickerID: string };
      this.toggleFavorite(packID, stickerID);
    });

    return stickerDiv;
  }
  /**
   * Toggles a sticker as a favorite
   * @param {string} PackID
   * @param {string} ID
   */
  toggleFavorite(PackID: string, ID: string) {
    const favoritesPackDiv = document.getElementById(
      'sticker-pack-container-favorites'
    ) as HTMLDivElement;
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
        this.stickerPacksMap![PackID].stickers.find((sticker) => sticker.stickerID === ID)
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
  animateFeedbackModal(modal: HTMLElement) {
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
    const addFavoriteFeedbackModal = document.querySelector(
      '#add-favorite-feedback'
    ) as HTMLElement;
    this.animateFeedbackModal(addFavoriteFeedbackModal);
  }
  popupRemoveFavoriteFeedback() {
    const deleteFavoriteFeedbackModal = document.querySelector(
      '#remove-favorite-feedback'
    ) as HTMLElement;
    this.animateFeedbackModal(deleteFavoriteFeedbackModal);
  }
  /**
   * Updates favorites in the database
   */
  updateFavorites() {
    const favoritedStickers = [
      ...document.getElementById('sticker-pack-container-favorites')!.querySelectorAll('.sticker'),
    ] as HTMLDivElement[];
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
    console.log('Refreshing sticker packs');
    this.populateStickerPacks();
  }
}

function createElementFromHTML(htmlString: string) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

export default StickerRenderer;
