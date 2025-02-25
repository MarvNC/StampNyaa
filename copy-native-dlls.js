const fse = require('fs-extra');
const path = require('path');

async function copyDlls() {
  // No need for buildPath argument
  const sourceDir = path.join(__dirname, 'node_modules', '@img', 'sharp-win32-x64', 'lib');

  // Construct the destination path directly:
  const destDir = path.join(
    __dirname, // Project root
    'out', // Electron Forge output directory
    'StampNyaa-win32-x64', // Your app name and platform
    'resources',
    'app.asar.unpacked',
    'node_modules',
    '@img',
    'sharp-win32-x64',
    'lib'
  );

  try {
    await fse.copy(path.join(sourceDir, 'libvips-cpp.dll'), path.join(destDir, 'libvips-cpp.dll'));
    await fse.copy(path.join(sourceDir, 'libvips-42.dll'), path.join(destDir, 'libvips-42.dll'));
    console.log('DLLs copied successfully.');
  } catch (error) {
    console.error('Error copying DLLs:', error);
  }
}

module.exports = copyDlls;
