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

  // 2. Generate Android Splash Screens
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

  // 3. Generate iOS Assets
  const iosIconDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
  const iosSplashDir = 'ios/App/App/Assets.xcassets/Splash.imageset';

  if (fs.existsSync(iosIconDir)) {
    // 1024x1024 universal icon with safe zone (no alpha channel for App Store validation)
    const masterLogo = fs.existsSync('public/nnvs-logo_original_raw.png')
      ? 'public/nnvs-logo_original_raw.png'
      : sourceIcon;

    const iosLogoBuf = await sharp(masterLogo)
      .resize(820, 820, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: { r: 255, g: 255, b: 255 } }
    })
    .composite([{ input: iosLogoBuf, gravity: 'centre' }])
    .png()
    .toFile(iosIconDir + '/AppIcon-512@2x.png');

    const appIconContents = {
      images: [
        {
          idiom: 'universal',
          size: '1024x1024',
          filename: 'AppIcon-512@2x.png',
          platform: 'ios',
        },
      ],
      info: {
        author: 'xcode',
        version: 1,
      },
    };
    fs.writeFileSync(iosIconDir + '/Contents.json', JSON.stringify(appIconContents, null, 2));
    console.log('Generated iOS AppIcon (1024x1024 universal)');
  }

  if (fs.existsSync(iosSplashDir)) {
    // 2732x2732 universal splash screens for 1x, 2x, 3x scales
    const masterLogo = fs.existsSync('public/nnvs-logo_original_raw.png')
      ? 'public/nnvs-logo_original_raw.png'
      : sourceIcon;

    const iosSplashLogo = await sharp(masterLogo)
      .resize(900, 900, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const splashImg = await sharp({
      create: { width: 2732, height: 2732, channels: 4, background: white }
    })
    .composite([{ input: iosSplashLogo, gravity: 'centre' }])
    .png()
    .toBuffer();

    const splashNames = [
      'Default@1x~universal~anyany.png',
      'Default@2x~universal~anyany.png',
      'Default@3x~universal~anyany.png',
    ];

    for (const name of splashNames) {
      fs.writeFileSync(iosSplashDir + '/' + name, splashImg);
    }

    const splashContents = {
      images: [
        { idiom: 'universal', filename: 'Default@1x~universal~anyany.png', scale: '1x' },
        { idiom: 'universal', filename: 'Default@2x~universal~anyany.png', scale: '2x' },
        { idiom: 'universal', filename: 'Default@3x~universal~anyany.png', scale: '3x' },
      ],
      info: {
        version: 1,
        author: 'xcode',
      },
    };
    fs.writeFileSync(iosSplashDir + '/Contents.json', JSON.stringify(splashContents, null, 2));
    console.log('Generated iOS Splash screens (1x, 2x, 3x universal)');
  }
}

generate()
  .then(() => console.log('All icons and splash screens successfully generated!'))
  .catch(console.error);
