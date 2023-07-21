const updateModal = {
  setUpUpdateModal: async () => {
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
  },
};
