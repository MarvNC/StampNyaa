/**
 * @typedef {import('./render/addStickerModal')} addStickerModal
 * @typedef {import('./render/menuBar')} menuBar
 * @typedef {import('./render/settingsModal')} settingsModal
 * @typedef {import('./render/updateModal')} updateModal
 * @typedef {import('./render/stickerRenderer')} StickerRenderer
 */
/**
 * @type {StickerRenderer}
 */
const stickerRenderer = new StickerRenderer();

window.addEventListener('DOMContentLoaded', async () => {
  addStickerModal.setUpAddStickerModal();

  menuBar.setUpMenuBarButtons();

  settingsModal.setUpThemeSelect();

  stickerRenderer.populateStickerPacks();

  settingsModal.setUpSettingsModal();

  updateModal.setUpUpdateModal();
});
