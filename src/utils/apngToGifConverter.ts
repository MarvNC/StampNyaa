// apngToGifConverter.ts
import sharp from 'sharp';
import sharpApng from 'sharp-apng';
import * as path from 'path';

export async function convertApngToGif(
  apngPath: string,
  resizeWidth?: number // Add resizeWidth as an optional parameter
): Promise<string> {
  try {
    const outputDir = path.dirname(apngPath);
    const outputFilename = path.basename(apngPath, '.png') + '.gif';
    const gifPath = path.join(outputDir, outputFilename);

    const image = await sharpApng.sharpFromApng(apngPath, {
      delay: 0, // Set delay to 0 for infinite loop (or an array of delays for frame-specific delays)
      repeat: 0, // Explicitly set repeat to 0 for infinite loop
      transparent: true, // Preserve transparency
    });

    if (resizeWidth) {
      // Perform resizing if resizeWidth is provided
      image.resize(resizeWidth, null, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    await image.toFile(gifPath);

    return gifPath;
  } catch (err) {
    console.error('Error during APNG to GIF conversion:', err);
    throw err;
  }
}
