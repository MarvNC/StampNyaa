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
  if (latestVersion !== version) {
    return latestVersion;
  }
  return null;
}

module.exports = checkUpdate;
