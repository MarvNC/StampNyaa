import addStickerModal from './render/addStickerModal';
import menuBar from './render/menuBar';
import settingsModal from './render/settingsModal';
import updateModal from './render/updateModal';
import StickerRenderer from './render/stickerRenderer';

const stickerRenderer = new StickerRenderer();

window.addEventListener('DOMContentLoaded', async () => {
  addStickerModal.setUpAddStickerModal();
  addStickerModal.setRenderer(stickerRenderer);

  menuBar.setUpMenuBarButtons();

  settingsModal.setUpThemeSelect();

  stickerRenderer.populateStickerPacks();

  settingsModal.setUpSettingsModal();

  updateModal.setUpUpdateModal();
});
