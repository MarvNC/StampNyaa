const fs = require('fs');
const path = require('path');
const copyDlls = require('./copy-native-dlls'); // Path to your script

module.exports = {
  packagerConfig: {
    asar: true,
    asarOptions: {
      unpackDir: 'node_modules/@img/sharp-win32-x64/lib',
    },
    asarUnpack: ['**/node_modules/sharp/**/*', '**/node_modules/@img/**/*'],
    executableName: 'stampnyaa',
    icon: './assets/icon',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'https://github.com/MarvNC/StampNyaa/raw/master/assets/icon.ico',
        setupIcon: './assets/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      executableName: 'stampnyaa',
      config: {
        options: {
          icon: './assets/icon.png',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/index.ts',
            config: 'vite.config.ts',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.config.ts',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.ts',
          },
        ],
      },
    },
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'MarvNC',
          name: 'StampNyaa',
        },
        draft: true,
      },
    },
  ],
  hooks: {
    postPackage: async (platform) => {
      if (platform === 'win32') {
        // No arguments needed
        await copyDlls();
      }
    },
    // Fix sqlite links out of the package https://www.update.rocks/blog/fixing-the-python3/
    packageAfterPrune: async (forgeConfig, buildPath, electronVersion, platform, arch) => {
      if (platform === 'darwin' || platform === 'linux') {
        console.log('We need to remove the problematic link file on macOS/Linux');
        console.log(`Build path ${buildPath}`);
        const python3Path = path.join(buildPath, 'node_modules/sqlite3/build/node_gyp_bins/python3');
        if (fs.existsSync(python3Path)) {
          try {
            fs.unlinkSync(python3Path);
          } catch (error) {
            console.error(`Error deleting python3: ${error.message}`);
          }
        } else {
          console.log(`python3 not found at: ${python3Path}`);
        }
      }
    },
  },
};
