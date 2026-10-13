const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  const brandMaroon = { r: 74, g: 18, b: 26, alpha: 1 }; // #4A121A
  const white = { r: 255, g: 255, b: 255, alpha: 1 };
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

  const sourceIcon = 'public/icon-512.png';

  // 1. Generate Mipmap Icons
  const densities = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const { dir, size, fgSize } of densities) {
    const targetDir = 'android/app/src/main/res/' + dir;

    // ic_launcher.png (legacy square icon on white rounded background)
    const logoSquare = await sharp(sourceIcon)
      .resize(Math.round(size * 0.85), Math.round(size * 0.85), { fit: 'contain' })
      .toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: white }
    })
    .composite([{ input: logoSquare, gravity: 'centre' }])
    .png()
    .toFile(targetDir + '/ic_launcher.png');

    // ic_launcher_round.png (legacy round icon)
    const radius = Math.floor(size / 2);
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/></svg>`
    );
    const circleBg = await sharp({
      create: { width: size, height: size, channels: 4, background: transparent }
    })
    .composite([{ input: circleSvg, blend: 'over' }])
    .png()
    .toBuffer();

    const logoRound = await sharp(sourceIcon)
      .resize(Math.round(size * 0.72), Math.round(size * 0.72), { fit: 'contain' })
      .toBuffer();

    await sharp(circleBg)
      .composite([{ input: logoRound, gravity: 'centre' }])
      .png()
      .toFile(targetDir + '/ic_launcher_round.png');

    // ic_launcher_foreground.png (Adaptive icon foreground, 108dp with 72dp safe zone)
    const logoFg = await sharp(sourceIcon)
      .resize(Math.round(fgSize * 0.65), Math.round(fgSize * 0.65), { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: { width: fgSize, height: fgSize, channels: 4, background: transparent }
    })
    .composite([{ input: logoFg, gravity: 'centre' }])
    .png()
    .toFile(targetDir + '/ic_launcher_foreground.png');

    console.log('Generated icons for', dir);
  }

  // 2. Generate Splash Screens
  const splashScreens = [
    { dir: 'drawable', w: 480, h: 320, logoSize: 150 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320, logoSize: 150 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480, logoSize: 220 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720, logoSize: 320 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960, logoSize: 420 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280, logoSize: 550 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480, logoSize: 160 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800, logoSize: 240 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280, logoSize: 340 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600, logoSize: 450 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920, logoSize: 600 },
  ];

  for (const { dir, w, h, logoSize } of splashScreens) {
    const targetFile = 'android/app/src/main/res/' + dir + '/splash.png';
    const logoBuf = await sharp(sourceIcon)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: { width: w, height: h, channels: 4, background: brandMaroon }
    })
    .composite([{ input: logoBuf, gravity: 'centre' }])
    .png()
    .toFile(targetFile);

    console.log('Generated splash for', dir);
  }
}

generate()
  .then(() => console.log('All icons and splash screens successfully generated!'))
  .catch(console.error);
