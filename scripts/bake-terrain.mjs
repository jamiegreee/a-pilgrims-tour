// Bakes a real-elevation heightfield for a route flythrough.
//
// Downloads Mapzen/AWS "Terrarium" elevation tiles (public, no key needed),
// mosaics them, resamples onto a regular lat/lon grid and writes:
//   public/terrain/<slug>.bin   little-endian Int16 heights in metres, row-major, north row first
//   public/terrain/<slug>.json  grid metadata (bbox, width, height, min/max)
//
// Usage: node scripts/bake-terrain.mjs camino-de-santiago

import { mkdir, writeFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';

const TERRAINS = {
  'camino-de-santiago': {
    // Saint-Jean-Pied-de-Port (-1.24) to Santiago (-8.55), with margin for the camera.
    west: -9.4,
    east: -0.4,
    south: 41.5,
    north: 43.9,
    zoom: 9,
    width: 1024,
  },
};

const TILE_URL = (z, x, y) =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

// Minimal PNG decoder for the 8-bit RGB/RGBA, non-interlaced files Terrarium serves.
function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      const colorType = data[9];
      if (bitDepth !== 8 || data[12] !== 0) throw new Error('Unsupported PNG');
      channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
      if (!channels) throw new Error(`Unsupported PNG colour type ${colorType}`);
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i];
      const a = i >= channels ? out[dst + i - channels] : 0;
      const b = y > 0 ? out[dst - stride + i] : 0;
      const c = y > 0 && i >= channels ? out[dst - stride + i - channels] : 0;
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`Bad PNG filter ${filter}`);
      }
      out[dst + i] = v & 0xff;
    }
  }
  return { width, height, channels, pixels: out };
}

const lonToTileX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const latToTileY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

async function fetchTile(z, x, y) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(TILE_URL(z, x, y));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return decodePng(Buffer.from(await res.arrayBuffer()));
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}

async function bake(slug) {
  const cfg = TERRAINS[slug];
  if (!cfg) throw new Error(`No terrain config for "${slug}"`);
  const { west, east, south, north, zoom: z, width } = cfg;

  // Keep cells roughly square on the ground.
  const midLat = ((north + south) / 2) * (Math.PI / 180);
  const height = Math.round((width * (north - south)) / ((east - west) * Math.cos(midLat)));

  const x0 = Math.floor(lonToTileX(west, z));
  const x1 = Math.floor(lonToTileX(east, z));
  const y0 = Math.floor(latToTileY(north, z));
  const y1 = Math.floor(latToTileY(south, z));
  const tilesW = x1 - x0 + 1;
  const tilesH = y1 - y0 + 1;
  const mosaicW = tilesW * 256;
  const mosaic = new Float32Array(mosaicW * tilesH * 256);

  console.log(`Fetching ${tilesW * tilesH} tiles at z${z}…`);
  const jobs = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      jobs.push(
        fetchTile(z, tx, ty).then(({ pixels, channels }) => {
          for (let py = 0; py < 256; py++) {
            for (let px = 0; px < 256; px++) {
              const i = (py * 256 + px) * channels;
              const elev = pixels[i] * 256 + pixels[i + 1] + pixels[i + 2] / 256 - 32768;
              mosaic[((ty - y0) * 256 + py) * mosaicW + (tx - x0) * 256 + px] = elev;
            }
          }
        }),
      );
    }
  }
  await Promise.all(jobs);

  const sample = (fx, fy) => {
    const ix = Math.min(Math.max(Math.floor(fx), 0), mosaicW - 2);
    const iy = Math.min(Math.max(Math.floor(fy), 0), tilesH * 256 - 2);
    const dx = fx - ix;
    const dy = fy - iy;
    const at = (x, y) => mosaic[y * mosaicW + x];
    return (
      at(ix, iy) * (1 - dx) * (1 - dy) +
      at(ix + 1, iy) * dx * (1 - dy) +
      at(ix, iy + 1) * (1 - dx) * dy +
      at(ix + 1, iy + 1) * dx * dy
    );
  };

  const heights = new Int16Array(width * height);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < height; j++) {
    const lat = north - ((north - south) * j) / (height - 1);
    const fy = (latToTileY(lat, z) - y0) * 256;
    for (let i = 0; i < width; i++) {
      const lon = west + ((east - west) * i) / (width - 1);
      const fx = (lonToTileX(lon, z) - x0) * 256;
      const h = Math.round(sample(fx, fy));
      heights[j * width + i] = h;
      if (h < min) min = h;
      if (h > max) max = h;
    }
  }

  await mkdir('public/terrain', { recursive: true });
  await writeFile(`public/terrain/${slug}.bin`, Buffer.from(heights.buffer));
  await writeFile(
    `public/terrain/${slug}.json`,
    JSON.stringify({ west, east, south, north, width, height, min, max }, null, 2) + '\n',
  );
  console.log(`Wrote ${width}×${height} grid, ${min} m to ${max} m`);
}

await bake(process.argv[2] ?? 'camino-de-santiago');
