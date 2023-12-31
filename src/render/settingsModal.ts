const settingsModal = {
  setUpThemeSelect: async () => {
    // change theme
    let theme = (await api.getTheme()) as Theme;
    type Theme = 'blue' | 'pink' | 'dracula' | 'night-pink';
    function setTheme(theme: Theme) {
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
    const themeSelect = document.getElementById('theme-select') as HTMLDivElement;
    const themes = [...(themeSelect.children as HTMLCollectionOf<HTMLDivElement>)];
    for (const themeSelector of themes) {
      const elementTheme = themeSelector.dataset.theme as Theme;
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
  },
  setUpSettingsModal: async () => {
    const settingsModalBackground = document.getElementById(
      'settings-background'
    ) as HTMLDivElement;
    const settingsButton = document.getElementById('settings-button') as HTMLDivElement;

    settingsButton.addEventListener('click', () => {
      settingsModalBackground.style.display = 'block';
    });

    settingsModalBackground.addEventListener('click', (e) => {
      if (e.target === settingsModalBackground) {
        settingsModalBackground.style.display = 'none';
      }
    });

    // Set hotkey
    const hotkeyInputContainer = document.getElementById(
      'hotkey-input-container'
    ) as HTMLDivElement;
    const hotkeyInput = document.getElementById('hotkey-input') as HTMLInputElement;
    const pressedkeys = new Set();
    let hotkeyString = await api.getHotkey();
    hotkeyInput.value = hotkeyString;
    let newHotkey = '';

    function keyToUpper(key: string) {
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
    const runOnStartup = document.getElementById('run-on-startup') as HTMLDivElement;
    const runOnStartupCheck = document.getElementById('run-on-startup-check') as HTMLSpanElement;
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
    const widthInput = document.getElementById('fit-to-width-input') as HTMLInputElement;
    let resizeWidth = await api.getResizeWidth();
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
    const headerElement = document.getElementById('version-string') as HTMLHeadingElement;
    headerElement.textContent = version;
  },
};

export default settingsModal;
