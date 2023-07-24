import addStickerModal from './render/addStickerModal.js';
import menuBar from './render/menuBar.js';
import settingsModal from './render/settingsModal.js';
import updateModal from './render/updateModal.js';
import StickerRenderer from './render/stickerRenderer.js';

const stickerRenderer = new StickerRenderer();

window.addEventListener('DOMContentLoaded', async () => {
  addStickerModal.setUpAddStickerModal();

  menuBar.setUpMenuBarButtons();

  settingsModal.setUpThemeSelect();

  stickerRenderer.populateStickerPacks();

  settingsModal.setUpSettingsModal();

  updateModal.setUpUpdateModal();
});
