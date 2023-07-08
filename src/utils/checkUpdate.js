const { app } = require('electron');
const axios = require('axios');

const version = app.getVersion();
const platform = process.platform;

/**
 * Checks if the operating system is MacOS or Linux and if there are updates available.
 * Returns the version number of the latest release if there are updates available. Otherwise, returns null.
 * @returns {Promise<string|null>} The version number of the latest release if there are updates available. Otherwise, returns null.
 */
async function checkUpdate() {
  const url = 'https://api.github.com/repos/MarvNC/StampNyaa/releases/latest';
  const { data } = await axios.get(url);
  const latestVersion = data.tag_name.split('v')[1];
  // Check if the latest version is newer than the current version
  if (compareVersionString(latestVersion, version)) {
    // Check if the operating system is MacOS or Linux
    if (platform === 'darwin' || platform === 'linux') {
      return latestVersion;
    }
  }
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

module.exports = checkUpdate;
