import * as THREE from 'three';

// Streams national aerial photography (Spain's PNOA, France's BD ORTHO) around a point,
// in chunks of 4 x 4 web-map tiles draped over the terrain. Chunks fade out towards the
// edge of the loaded radius so they blend into the satellite layers underneath.

export interface DetailSource {
  /** XYZ tile URL for this location, or null where no source covers it. */
  url: (z: number, x: number, y: number, lat: number, lon: number) => string | null;
}

interface Options {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  source: DetailSource;
  /** Scene position for a lon/lat, including terrain height. */
  project: (lon: number, lat: number) => THREE.Vector3;
}

const TILE = 256;
const GRID = 4; // tiles per chunk side
const SEGMENTS = 32; // mesh segments per chunk side

const lonToX = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const latToY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};
const xToLon = (x: number, z: number) => (x / 2 ** z) * 360 - 180;
const yToLat = (y: number, z: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

interface Chunk {
  key: string;
  centre: THREE.Vector3;
  mesh: THREE.Mesh;
  texture: THREE.CanvasTexture;
  pending: HTMLImageElement[];
  dispose: () => void;
}

export class DetailImagery {
  private readonly chunks = new Map<string, Chunk>();
  private readonly fade = { centre: { value: new THREE.Vector2() }, radius: { value: 1 } };
  private inflight = 0;
  private readonly queue: (() => void)[] = [];
  private dirty = new Set<THREE.CanvasTexture>();
  private lastUpload = 0;

  constructor(private readonly opts: Options) {}

  /**
   * Keep chunks at `zoom` loaded within `radiusKm` of `centre` (scene units are km),
   * built from tiles at `zoom + 2`. Call a few times a second.
   */
  update(lon: number, lat: number, centre: THREE.Vector3, radiusKm: number, zoom: number) {
    this.fade.centre.value.set(centre.x, centre.z);
    this.fade.radius.value = radiusKm;
    const cx = Math.floor(lonToX(lon, zoom));
    const cy = Math.floor(latToY(lat, zoom));
    const want = new Set<string>();
    const reach = 3;
    const candidates: { key: string; x: number; y: number; d: number }[] = [];
    for (let y = cy - reach; y <= cy + reach; y++) {
      for (let x = cx - reach; x <= cx + reach; x++) {
        const mid = this.opts.project(xToLon(x + 0.5, zoom), yToLat(y + 0.5, zoom));
        const d = Math.hypot(mid.x - centre.x, mid.z - centre.z);
        if (d > radiusKm + 2) continue;
        const key = `${zoom}/${x}/${y}`;
        want.add(key);
        if (!this.chunks.has(key)) candidates.push({ key, x, y, d });
      }
    }
    candidates.sort((a, b) => a.d - b.d);
    for (const c of candidates.slice(0, 4)) this.build(c.key, c.x, c.y, zoom);
    for (const [key, chunk] of this.chunks) {
      if (key.startsWith(`${zoom}/`) && !want.has(key)) {
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
    // Re-upload changed chunk textures at most once a second; each upload is a full 1024px image.
    const now = performance.now();
    if (now - this.lastUpload > 1000) {
      this.lastUpload = now;
      for (const t of this.dirty) t.needsUpdate = true;
      this.dirty.clear();
    }
  }

  /** Load one chunk-sized block at a fixed place, kept until `release`. */
  pin(lon: number, lat: number, zoom: number, span: number) {
    const cx = Math.floor(lonToX(lon, zoom));
    const cy = Math.floor(latToY(lat, zoom));
    const half = Math.floor(span / 2);
    for (let y = cy - half; y <= cy + half; y++) {
      for (let x = cx - half; x <= cx + half; x++) {
        const key = `${zoom}/${x}/${y}`;
        if (!this.chunks.has(key)) this.build(key, x, y, zoom);
      }
    }
  }

  release(zoom: number) {
    for (const [key, chunk] of this.chunks) {
      if (key.startsWith(`${zoom}/`)) {
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }

  dispose() {
    for (const chunk of this.chunks.values()) chunk.dispose();
    this.chunks.clear();
    this.queue.length = 0;
  }

  private build(key: string, x: number, y: number, zoom: number) {
    const { scene, renderer, source, project } = this.opts;
    const size = GRID * TILE;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Vertices follow the Mercator grid exactly, so tile pixels land where they belong.
    const n = SEGMENTS + 1;
    const pos = new Float32Array(n * n * 3);
    const uv = new Float32Array(n * n * 2);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const lon = xToLon(x + c / SEGMENTS, zoom);
        const lat = yToLat(y + r / SEGMENTS, zoom);
        const p = project(lon, lat);
        const v = r * n + c;
        pos[v * 3] = p.x;
        pos[v * 3 + 1] = p.y + 0.003;
        pos[v * 3 + 2] = p.z;
        uv[v * 2] = c / SEGMENTS;
        uv[v * 2 + 1] = 1 - r / SEGMENTS;
      }
    }
    const idx: number[] = [];
    for (let r = 0; r < SEGMENTS; r++) {
      for (let c = 0; c < SEGMENTS; c++) {
        const a = r * n + c;
        idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const fade = this.fade;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.fadeCentre = fade.centre;
      shader.uniforms.fadeRadius = fade.radius;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vDetailXZ;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvDetailXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vDetailXZ;\nuniform vec2 fadeCentre;\nuniform float fadeRadius;')
        .replace(
          '#include <map_fragment>',
          '#include <map_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(fadeRadius * 0.6, fadeRadius, distance(vDetailXZ, fadeCentre));',
        );
    };
    mat.customProgramCacheKey = () => 'detail-imagery';

    const mesh = new THREE.Mesh(geo, mat);
    // Finer zoom levels draw last, over the coarser chunks beneath them.
    mesh.renderOrder = 2 + zoom;
    scene.add(mesh);

    // Each chunk is a 4 x 4 block of tiles two zoom levels down.
    const tz = zoom + 2;
    const pending: HTMLImageElement[] = [];
    let alive = true;
    for (let ty = 0; ty < GRID; ty++) {
      for (let tx = 0; tx < GRID; tx++) {
        const X = x * GRID + tx;
        const Y = y * GRID + ty;
        const lat = yToLat(Y + 0.5, tz);
        const lon = xToLon(X + 0.5, tz);
        const url = source.url(tz, X, Y, lat, lon);
        if (!url) continue;
        const ix = tx;
        const iy = ty;
        this.enqueue(() => {
          if (!alive) {
            this.done();
            return;
          }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          pending.push(img);
          img.onload = () => {
            if (alive) {
              ctx.drawImage(img, ix * TILE, iy * TILE, TILE, TILE);
              this.dirty.add(texture);
            }
            this.done();
          };
          img.onerror = () => this.done();
          img.src = url;
        });
      }
    }

    const centre = project(xToLon(x + 0.5, zoom), yToLat(y + 0.5, zoom));
    this.chunks.set(key, {
      key,
      centre,
      mesh,
      texture,
      pending,
      dispose: () => {
        alive = false;
        for (const img of pending) img.src = '';
        scene.remove(mesh);
        geo.dispose();
        mat.dispose();
        texture.dispose();
        this.dirty.delete(texture);
      },
    });
  }

  private enqueue(job: () => void) {
    this.queue.push(job);
    this.pump();
  }

  private done() {
    this.inflight--;
    this.pump();
  }

  private pump() {
    while (this.inflight < 8 && this.queue.length) {
      this.inflight++;
      this.queue.shift()!();
    }
  }
}

/** Spain's PNOA orthophotos, with France's IGN orthophotos north-east of the Pyrenean border. */
export const IBERIAN_AERIAL: DetailSource = {
  url: (z, x, y, lat, lon) => {
    const inFrance = lat > 43.075 && lon > -1.42;
    if (inFrance) {
      return `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=image/jpeg`;
    }
    return `https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix=${z}&TileRow=${y}&TileCol=${x}`;
  },
};

export const AERIAL_CREDIT =
  'Aerial photography: PNOA cedido por © Instituto Geográfico Nacional de España (CC BY 4.0); © IGN France (Licence Ouverte)';
