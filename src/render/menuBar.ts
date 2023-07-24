const menuBar = {
  setUpMenuBarButtons: async () => {
    // close on X button
    const closeButton = document.getElementById('close-button');
    closeButton?.addEventListener('click', () => {
      api.closeWindow();
    });
  },
};

export default menuBar;
