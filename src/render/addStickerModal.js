const addStickerModal = {
  setUpAddStickerModal: async () => {
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
        stickerRenderer.refreshStickerPacks();
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
  },
};
