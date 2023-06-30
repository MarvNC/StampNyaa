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
  const { dirName } = await api.ready();
  const stickerContainer = document.getElementById('sticker-list');

  for (let i = 0; i < 20; i++) {
    const stickerDiv = document.createElement('div');
    stickerDiv.classList.add('sticker');
    const stickerImg = document.createElement('img');
    stickerImg.src = `../assets/icon.png`;
    stickerDiv.appendChild(stickerImg);
    stickerContainer.appendChild(stickerDiv);
  }
});
