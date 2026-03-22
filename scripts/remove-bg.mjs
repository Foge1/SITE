import sharp from 'sharp';

const src = 'src/assets/img/favicon-source.png';
const img = sharp(src);
const { width, height } = await img.metadata();
console.log(`Source: ${width}x${height}`);

const raw = await img.ensureAlpha().raw().toBuffer();
const pixels = new Uint8Array(raw);
let changed = 0;
for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
  if (r > 240 && g > 240 && b > 240) {
    pixels[i + 3] = 0;
    changed++;
  }
}
console.log(`Transparent: ${changed} / ${pixels.length / 4} pixels`);

await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
  .png()
  .toFile(src);

const sizes = [
  ['favicon-32x32.png', 32],
  ['favicon-16x16.png', 16],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [name, size] of sizes) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`src/assets/img/${name}`);
  console.log(`  ${name} (${size}x${size})`);
}

// SVG with embedded 128px PNG
const buf128 = await sharp(src)
  .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const b64 = buf128.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="128" height="128" viewBox="0 0 128 128" role="img" aria-labelledby="title">
  <title>ГРУЗЪ</title>
  <image width="128" height="128" href="data:image/png;base64,${b64}"/>
</svg>`;
await import('fs').then(fs => fs.writeFileSync('src/assets/img/favicon.svg', svg));
console.log('  favicon.svg');
console.log('Done!');
