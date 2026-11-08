const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xFF];
  }
  return (c ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(width, height, pixelFn) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // deflate
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // no interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const idx = 1 + x * 4;
      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = a;
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Drishti Bommai pixel generator
function drishtiPixel(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1

  // Ring at top
  const ringDist = Math.hypot(nx, ny - (-0.75));
  if (ringDist >= 0.12 && ringDist <= 0.22 && ny <= -0.6) {
    return [245, 166, 35, 255]; // Golden ring
  }

  // Face circle / oval
  const faceDist = Math.hypot(nx * 1.05, (ny - 0.1) * 1.15);
  if (faceDist <= 0.7) {
    // Border
    if (faceDist > 0.63) {
      return [255, 179, 0, 255]; // Yellow/gold border
    }

    // Forehead Tilak (red in center)
    if (Math.abs(nx) < 0.08 && ny >= -0.45 && ny <= -0.15) {
      return [211, 47, 47, 255]; // Red Tilak
    }

    // White Tripundra stripes
    if (Math.abs(nx) < 0.4 && (
        (ny >= -0.38 && ny <= -0.33) ||
        (ny >= -0.26 && ny <= -0.21)
    )) {
      return [255, 255, 255, 230];
    }

    // Eyes: left centered at (-0.32, -0.02), right at (0.32, -0.02)
    const leftEye = Math.hypot((nx + 0.32) * 1.1, (ny - (-0.02)) * 1.3);
    const rightEye = Math.hypot((nx - 0.32) * 1.1, (ny - (-0.02)) * 1.3);

    if (leftEye < 0.22 || rightEye < 0.22) {
      if (leftEye < 0.1 || rightEye < 0.1) {
        // Iris / pupil
        if (leftEye < 0.04 || rightEye < 0.04) {
          return [255, 255, 255, 255]; // Glint
        }
        return [20, 20, 25, 255]; // Black pupil
      }
      return [255, 240, 180, 255]; // Sclera / eye
    }

    // Curled Mustache
    if (ny >= 0.16 && ny <= 0.32) {
      const mustacheCurve = 0.22 + 0.08 * (nx * nx);
      if (Math.abs(ny - mustacheCurve) < 0.06 && Math.abs(nx) < 0.65) {
        return [24, 24, 28, 255]; // Black mustache
      }
    }

    // Red Tongue protruding
    if (Math.abs(nx) < 0.14 && ny >= 0.32 && ny <= 0.58) {
      return [229, 57, 53, 255]; // Red tongue
    }

    // Open mouth
    if (Math.abs(nx) < 0.3 && ny >= 0.22 && ny <= 0.45) {
      // Teeth
      if (ny <= 0.28 && Math.abs(nx) > 0.08) {
        return [255, 255, 255, 255]; // Fangs
      }
      return [74, 10, 18, 255]; // Mouth dark
    }

    // Face body
    return [26, 26, 30, 255]; // Dark protective mask base
  }

  // Ear kundalas (gold rings on side)
  const leftEar = Math.hypot(nx + 0.76, ny - 0.12);
  const rightEar = Math.hypot(nx - 0.76, ny - 0.12);
  if (leftEar < 0.14 || rightEar < 0.14) {
    if (leftEar < 0.06 || rightEar < 0.06) {
      return [211, 47, 47, 255]; // Red center
    }
    return [255, 179, 0, 255]; // Gold earring
  }

  // Transparent outside
  return [0, 0, 0, 0];
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate 32x32 tray icon
const trayIconBuf = createPNG(32, 32, drishtiPixel);
fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), trayIconBuf);
console.log('Created assets/tray-icon.png (32x32)');

// Generate 256x256 app icon (required by electron-builder for Windows)
const appIconBuf = createPNG(256, 256, drishtiPixel);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), appIconBuf);
console.log('Created assets/icon.png (256x256)');

// In ICO format, width/height of 256 is represented by 0 in the directory entry
function createIcoFromPng(pngBuffer, width, height) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // image type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuffer.length, 8); // size
  entry.writeUInt32LE(6 + 16, 12); // offset

  return Buffer.concat([icoHeader, entry, pngBuffer]);
}

const icoBuf = createIcoFromPng(appIconBuf, 256, 256);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuf);
console.log('Created assets/icon.ico (Windows 256x256 icon)');
