const { app } = require('electron');
const axios = require('axios');
const Store = require('electron-store');

const version = app.getVersion();
const platform = process.platform;

/**
 * Checks if the operating system is MacOS or Linux and if there are updates available.
 * Returns the version number of the latest release if there are updates available. Otherwise, returns null.
 * Also does not check for updates if the last update check was less than five minutes ago.
 * @param {Store} config
 * @returns {Promise<string|null>} The version number of the latest release if there are updates available. Otherwise, returns null.
 */
async function checkUpdate(config) {
  // Do not check if Windows
  if (platform === 'win32') {
    return null;
  }

  // Get last check update time
  const lastCheckUpdateTime = config.get('lastCheckUpdateTime', new Date(0).valueOf());
  console.log(
    `Last check update time: ${new Date(lastCheckUpdateTime).toLocaleString()} which was ${(
      (Date.now() - lastCheckUpdateTime) /
      1000 /
      60
    ).toFixed(1)} minutes ago.`
  );
  // Set last check update time to now
  // Check if the last check update time was less than five minutes ago
  if (Date.now() - lastCheckUpdateTime < 5 * 60 * 1000) {
    return null;
  }

  config.set('lastCheckUpdateTime', Date.now().valueOf());
  const url = 'https://api.github.com/repos/MarvNC/StampNyaa/releases/latest';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'StampNyaa Update Check',
    },
  });
  const latestVersion = data.tag_name.split('v')[1];
  console.log(`Latest version: ${latestVersion}`);
  // Check if the latest version is newer than the current version
  if (compareVersionString(latestVersion, version)) {
    console.log('Update available');
    return latestVersion;
  }
  console.log('No update available');
  return null;
}

/**
 * Compares two version strings and returns true if v1 is newer than v2.
 * @param {string} v1
 * @param {string} v2
 */
function compareVersionString(v1, v2) {
  const v1Parts = v1.split('.');
  const v2Parts = v2.split('.');

  for (let i = 0; i < v1Parts.length; i++) {
    if (v1Parts[i] > v2Parts[i]) {
      return true;
    } else if (v1Parts[i] < v2Parts[i]) {
      return false;
    }
  }

  return false;
}

export default checkUpdate;
