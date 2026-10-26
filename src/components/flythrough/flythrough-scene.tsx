'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import type { Flythrough } from '@/lib/flythroughs';
import type { RouteStage } from '@/lib/routes';
import { createPilgrim } from './pilgrim';
import { AERIAL_CREDIT, DetailImagery, IBERIAN_AERIAL } from './detail-imagery';

interface TerrainMeta {
  west: number;
  east: number;
  south: number;
  north: number;
  width: number;
  height: number;
  /** Present when scripts/bake-imagery.py has produced a satellite texture. */
  imagery?: { width: number; height: number; credit: string };
}

interface TileManifest {
  px: number;
  credit: string;
  tiles: { col: number; row: number; i0: number; j0: number; i1: number; j1: number; file: string }[];
}

type HiresTile = TileManifest['tiles'][number] & {
  cx: number;
  cz: number;
  state: 'idle' | 'loading' | 'ready';
  mesh?: THREE.Mesh;
  dispose?: () => void;
};

interface Track {
  credit: string;
  km: number;
  points: [number, number][];
}

interface Props {
  /** Where the baked terrain files are served from. */
  assetBase?: string;
  slug: string;
  routeName: string;
  flythrough: Flythrough;
  stages: RouteStage[];
  ctaLabel: string;
}

type Phase = 'loading' | 'intro' | 'flying' | 'arrival' | 'done' | 'error';

// Scene units are kilometres on the ground; heights are exaggerated.
const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON = 111.32;
const SAMPLE_KM = 0.05;
const RAIL_SMOOTH_KM = 2.5;
const CAMERA_BACK_KM = 2.4;
const CAMERA_HEIGHT_KM = 1;
const LOOK_AHEAD_KM = 1.2;
const FLIGHT_SECONDS = 480;
const ARRIVAL_SECONDS = 7;
// Aerial photography streamed around the walker: chunk zoom and radius in km.
const DETAIL_ZOOM = 13;
const LANDMARK_ZOOM = 15;
const INTRO_SECONDS = 3;
const SPEEDS = [1, 2, 4];

const FOG_NEAR = 0.0009;
const FOG_FOLLOW = 0.014;
const HAZE = '#e7dfd2';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Elevation ramps (metres → colour) for dry Castilian plateau and green Atlantic Spain.
const DRY_RAMP: [number, string][] = [
  [0, '#b9ab82'],
  [700, '#cbb07c'],
  [1000, '#b79a72'],
  [1500, '#94877a'],
  [2100, '#cfc8bd'],
  [2500, '#f2efe9'],
];
const GREEN_RAMP: [number, string][] = [
  [0, '#6c805c'],
  [500, '#647a55'],
  [1000, '#7b8160'],
  [1500, '#8d8577'],
  [2100, '#cfc8bd'],
  [2500, '#f2efe9'],
];

function buildRamp(stops: [number, string][]) {
  const cols = stops.map(([h, c]) => [h, new THREE.Color(c)] as const);
  return (h: number, out: THREE.Color) => {
    if (h <= cols[0][0]) return out.copy(cols[0][1]);
    for (let i = 1; i < cols.length; i++) {
      if (h <= cols[i][0]) {
        const t = (h - cols[i - 1][0]) / (cols[i][0] - cols[i - 1][0]);
        return out.copy(cols[i - 1][1]).lerp(cols[i][1], t);
      }
    }
    return out.copy(cols[cols.length - 1][1]);
  };
}

function formatKm(km: number) {
  return Math.round(km).toLocaleString('en-GB');
}

export default function FlythroughScene({
  assetBase = '/terrain',
  slug,
  routeName,
  flythrough,
  stages,
  ctaLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const elevRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [placeIdx, setPlaceIdx] = useState(0);
  const [noteIdx, setNoteIdx] = useState<number | null>(null);
  const [imageryCredit, setImageryCredit] = useState<string | null>(null);
  const [trackCredit, setTrackCredit] = useState<string | null>(null);
  const [routeTotalKm, setRouteTotalKm] = useState(flythrough.routeKm);
  const [profile, setProfile] = useState<{ path: string; stageX: number[] } | null>(null);

  // Mutable animation state shared between React handlers and the render loop.
  const sim = useRef({
    progress: 0,
    playing: false,
    speed: 1,
    phase: 'loading' as Phase,
    overview: 1,
    overviewTarget: 1,
    stageStarts: [0] as number[],
  });

  const { waypoints, exaggeration, routeKm, terrain } = flythrough;

  useEffect(() => {
    sim.current.playing = playing;
  }, [playing]);
  useEffect(() => {
    sim.current.speed = SPEEDS[speedIdx];
  }, [speedIdx]);
  useEffect(() => {
    sim.current.phase = phase;
    sim.current.overviewTarget = phase === 'intro' || phase === 'loading' ? 1 : 0;
  }, [phase]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const labelHost = labelsRef.current;
    const container = containerRef.current;
    if (!host || !labelHost || !container) return;

    let disposed = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const disposables: { dispose: () => void }[] = [];
    const labelEls: HTMLDivElement[] = [];

    async function init() {
      const [meta, buf, track] = await Promise.all([
        fetch(`${assetBase}/${terrain}.json`).then((r) => {
          if (!r.ok) throw new Error('terrain meta');
          return r.json() as Promise<TerrainMeta>;
        }),
        fetch(`${assetBase}/${terrain}.bin`).then((r) => {
          if (!r.ok) throw new Error('terrain data');
          return r.arrayBuffer();
        }),
        // The walking track from OpenStreetMap (scripts/fetch-route-track.py); optional.
        fetch(`${assetBase}/${terrain}-track.json`)
          .then((r) => (r.ok ? (r.json() as Promise<Track>) : null))
          .catch(() => null),
      ]);
      if (disposed) return;
      const heights = new Int16Array(buf);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setPhase('error');
        return;
      }

      // --- Geography helpers -------------------------------------------------
      const lat0 = (meta.north + meta.south) / 2;
      const lon0 = (meta.west + meta.east) / 2;
      const cosLat = Math.cos((lat0 * Math.PI) / 180);
      const toX = (lon: number) => (lon - lon0) * KM_PER_DEG_LON * cosLat;
      const toZ = (lat: number) => -(lat - lat0) * KM_PER_DEG_LAT;
      const toLon = (x: number) => x / (KM_PER_DEG_LON * cosLat) + lon0;
      const toLat = (z: number) => -z / KM_PER_DEG_LAT + lat0;
      const toY = (m: number) => (Math.max(m, 0) / 1000) * exaggeration;

      const metresAt = (lon: number, lat: number) => {
        const fx = ((lon - meta.west) / (meta.east - meta.west)) * (meta.width - 1);
        const fy = ((meta.north - lat) / (meta.north - meta.south)) * (meta.height - 1);
        const ix = Math.min(Math.max(Math.floor(fx), 0), meta.width - 2);
        const iy = Math.min(Math.max(Math.floor(fy), 0), meta.height - 2);
        const dx = Math.min(Math.max(fx - ix, 0), 1);
        const dy = Math.min(Math.max(fy - iy, 0), 1);
        const at = (x: number, y: number) => heights[y * meta.width + x];
        return (
          at(ix, iy) * (1 - dx) * (1 - dy) +
          at(ix + 1, iy) * dx * (1 - dy) +
          at(ix, iy + 1) * (1 - dx) * dy +
          at(ix + 1, iy + 1) * dx * dy
        );
      };
      const metresAtXZ = (x: number, z: number) => metresAt(toLon(x), toLat(z));
      // Height on the rendered terrain surface: the same two triangles per cell as the mesh,
      // so things placed with it sit exactly on the ground instead of above or below it.
      const surfaceMetres = (lon: number, lat: number) => {
        const fx = ((lon - meta.west) / (meta.east - meta.west)) * (meta.width - 1);
        const fy = ((meta.north - lat) / (meta.north - meta.south)) * (meta.height - 1);
        const ix = Math.min(Math.max(Math.floor(fx), 0), meta.width - 2);
        const iy = Math.min(Math.max(Math.floor(fy), 0), meta.height - 2);
        const dx = Math.min(Math.max(fx - ix, 0), 1);
        const dy = Math.min(Math.max(fy - iy, 0), 1);
        const at = (x: number, y: number) => Math.max(heights[y * meta.width + x], 0);
        const a = at(ix, iy);
        const b = at(ix + 1, iy);
        const d = at(ix, iy + 1);
        const e = at(ix + 1, iy + 1);
        return dx + dy <= 1 ? a + (b - a) * dx + (d - a) * dy : e + (d - e) * (1 - dx) + (b - e) * (1 - dy);
      };
      const groundY = (x: number, z: number) => toY(metresAtXZ(x, z));

      // --- Scene -------------------------------------------------------------
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(HAZE, FOG_NEAR);
      const camera = new THREE.PerspectiveCamera(48, 1, 0.02, 3000);

      scene.add(new THREE.HemisphereLight('#f4efe6', '#6b6152', 1.1));
      const sun = new THREE.DirectionalLight('#fff3dd', 2.4);
      sun.position.set(0.55, 0.45, 0.7);
      scene.add(sun);

      // --- Terrain mesh -------------------------------------------------------
      const step = window.innerWidth < 768 ? 2 : 1;
      const cols = Math.floor((meta.width - 1) / step) + 1;
      const rows = Math.floor((meta.height - 1) / step) + 1;
      const positions = new Float32Array(cols * rows * 3);
      const colors = new Float32Array(cols * rows * 3);
      const rawMetres = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        const j = r * step;
        const lat = meta.north - ((meta.north - meta.south) * j) / (meta.height - 1);
        for (let c = 0; c < cols; c++) {
          const i = c * step;
          const lon = meta.west + ((meta.east - meta.west) * i) / (meta.width - 1);
          const m = heights[j * meta.width + i];
          const v = r * cols + c;
          rawMetres[v] = m;
          positions[v * 3] = toX(lon);
          positions[v * 3 + 1] = m <= 0 ? -0.05 : toY(m);
          positions[v * 3 + 2] = toZ(lat);
        }
      }
      const indices = new Uint32Array((cols - 1) * (rows - 1) * 6);
      let k = 0;
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const a = r * cols + c;
          const b = a + 1;
          const d = a + cols;
          const e = d + 1;
          indices[k++] = a;
          indices[k++] = d;
          indices[k++] = b;
          indices[k++] = b;
          indices[k++] = d;
          indices[k++] = e;
        }
      }
      const terrainGeo = new THREE.BufferGeometry();
      terrainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      terrainGeo.setIndex(new THREE.BufferAttribute(indices, 1));
      terrainGeo.computeVertexNormals();

      const dry = buildRamp(DRY_RAMP);
      const green = buildRamp(GREEN_RAMP);
      const water = new THREE.Color('#9fb2b8');
      const rock = new THREE.Color('#857a70');
      const haze = new THREE.Color(HAZE);
      const cDry = new THREE.Color();
      const cGreen = new THREE.Color();
      const normals = terrainGeo.getAttribute('normal');
      for (let v = 0; v < cols * rows; v++) {
        const m = rawMetres[v];
        const out = new THREE.Color();
        if (m <= 0) {
          out.copy(water);
        } else {
          const lon = toLon(positions[v * 3]);
          const lat = toLat(positions[v * 3 + 2]);
          // Atlantic "Green Spain" (Galicia, El Bierzo, the Pyrenean north) versus the dry Meseta.
          const wet = Math.max(smoothstep(-6.4, -6.95, lon), smoothstep(42.65, 42.95, lat));
          dry(m, cDry);
          green(m, cGreen);
          out.copy(cDry).lerp(cGreen, wet);
          const slope = 1 - normals.getY(v);
          out.lerp(rock, smoothstep(0.08, 0.45, slope) * 0.55);
          // Cheap per-vertex grain so flat plains are not a single flat colour.
          const n = Math.sin(positions[v * 3] * 12.9898 + positions[v * 3 + 2] * 78.233) * 43758.5453;
          out.multiplyScalar(0.96 + (n - Math.floor(n)) * 0.08);
        }
        // Dissolve the edges of the map into the haze.
        const r = Math.floor(v / cols);
        const c = v % cols;
        const edge = Math.min(c / (cols - 1), 1 - c / (cols - 1), r / (rows - 1), 1 - r / (rows - 1));
        out.lerp(haze, 1 - smoothstep(0, 0.07, edge));
        colors[v * 3] = out.r;
        colors[v * 3 + 1] = out.g;
        colors[v * 3 + 2] = out.b;
      }
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      scene.add(terrainMesh);
      disposables.push(terrainGeo, terrainMat);

      // Drape satellite imagery over the terrain once it arrives; the tinted mesh stands in until then.
      if (meta.imagery) {
        const uvs = new Float32Array(cols * rows * 2);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const v = r * cols + c;
            uvs[v * 2] = (c * step) / (meta.width - 1);
            uvs[v * 2 + 1] = 1 - (r * step) / (meta.height - 1);
          }
        }
        terrainGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        const credit = meta.imagery.credit;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (disposed || !renderer) return;
          // Fade the image edges into the haze on a canvas, capped to what the GPU accepts.
          const max = renderer.capabilities.maxTextureSize;
          const scale = Math.min(1, max / img.width, max / img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const fw = canvas.width * 0.07;
          const fh = canvas.height * 0.07;
          const edges: [number, number, number, number, number, number, number, number][] = [
            [0, 0, fw, 0, 0, 0, fw, canvas.height],
            [canvas.width, 0, canvas.width - fw, 0, canvas.width - fw, 0, fw, canvas.height],
            [0, 0, 0, fh, 0, 0, canvas.width, fh],
            [0, canvas.height, 0, canvas.height - fh, 0, canvas.height - fh, canvas.width, fh],
          ];
          for (const [x0, y0, x1, y1, rx, ry, rw, rh] of edges) {
            const g = ctx.createLinearGradient(x0, y0, x1, y1);
            g.addColorStop(0, HAZE);
            g.addColorStop(1, 'rgba(231, 223, 210, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(rx, ry, rw, rh);
          }
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          const imageryMat = new THREE.MeshLambertMaterial({ map: texture });
          terrainMesh.material = imageryMat;
          disposables.push(texture, imageryMat);
          setImageryCredit(credit);
        };
        img.src = `${assetBase}/${terrain}.jpg`;
      }

      // --- High-resolution tiles along the route ---------------------------------
      // Streamed in near the walker and dropped once far behind (see scripts/bake-imagery-tiles.py).
      const isSmall = window.innerWidth < 768;
      const tileLoadKm = isSmall ? 55 : 75;
      const tileDropKm = tileLoadKm + 45;
      const slopeY = (i: number, j: number) => {
        const ic = Math.min(Math.max(i, 0), meta.width - 1);
        const jc = Math.min(Math.max(j, 0), meta.height - 1);
        const m = heights[jc * meta.width + ic];
        return m <= 0 ? -0.05 : toY(m);
      };
      const cellX = toX(meta.west + (meta.east - meta.west) / (meta.width - 1)) - toX(meta.west);
      const cellZ = toZ(meta.north) - toZ(meta.north - (meta.north - meta.south) / (meta.height - 1));
      const tiles = new Map<string, HiresTile>();
      const tileKeys = new Set<string>();
      let tileLoads = 0;
      fetch(`${assetBase}/${terrain}/tiles.json`)
        .then((res) => (res.ok ? (res.json() as Promise<TileManifest>) : null))
        .then((manifest) => {
          if (!manifest || disposed) return;
          for (const t of manifest.tiles) {
            const key = `${t.col}_${t.row}`;
            tileKeys.add(key);
            const cx = toX(meta.west + ((meta.east - meta.west) * (t.i0 + t.i1)) / 2 / (meta.width - 1));
            const cz = toZ(meta.north - ((meta.north - meta.south) * (t.j0 + t.j1)) / 2 / (meta.height - 1));
            tiles.set(key, { ...t, cx, cz, state: 'idle' });
          }
        })
        .catch(() => {});

      const buildTile = (t: HiresTile, image: HTMLImageElement) => {
        if (!renderer) return;
        const size = Math.min(isSmall ? 1024 : 2048, renderer.capabilities.maxTextureSize);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, size, size);
        // Feather edges that border the low-resolution base map rather than another tile.
        ctx.globalCompositeOperation = 'destination-out';
        const f = size * 0.12;
        const sides: [string, number, number, number, number, number, number, number, number][] = [
          [`${t.col - 1}_${t.row}`, 0, 0, f, 0, 0, 0, f, size],
          [`${t.col + 1}_${t.row}`, size, 0, size - f, 0, size - f, 0, f, size],
          [`${t.col}_${t.row - 1}`, 0, 0, 0, f, 0, 0, size, f],
          [`${t.col}_${t.row + 1}`, 0, size, 0, size - f, 0, size - f, size, f],
        ];
        let feathered = false;
        for (const [neighbour, x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
          if (tileKeys.has(neighbour)) continue;
          const g = ctx.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, 'rgba(0,0,0,1)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(rx, ry, rw, rh);
          feathered = true;
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const tc = t.i1 - t.i0 + 1;
        const tr = t.j1 - t.j0 + 1;
        const pos = new Float32Array(tc * tr * 3);
        const nrm = new Float32Array(tc * tr * 3);
        const uv = new Float32Array(tc * tr * 2);
        for (let r = 0; r < tr; r++) {
          const j = t.j0 + r;
          const lat = meta.north - ((meta.north - meta.south) * j) / (meta.height - 1);
          for (let c = 0; c < tc; c++) {
            const i = t.i0 + c;
            const lon = meta.west + ((meta.east - meta.west) * i) / (meta.width - 1);
            const v = r * tc + c;
            pos[v * 3] = toX(lon);
            pos[v * 3 + 1] = slopeY(i, j);
            pos[v * 3 + 2] = toZ(lat);
            // Normals from the whole heightfield, so lighting matches across tile seams.
            const nx = -(slopeY(i + 1, j) - slopeY(i - 1, j)) / (2 * cellX);
            const nz = (slopeY(i, j + 1) - slopeY(i, j - 1)) / (2 * cellZ);
            const len = Math.hypot(nx, 1, nz);
            nrm[v * 3] = nx / len;
            nrm[v * 3 + 1] = 1 / len;
            nrm[v * 3 + 2] = nz / len;
            uv[v * 2] = c / (tc - 1);
            uv[v * 2 + 1] = 1 - r / (tr - 1);
          }
        }
        const idx = new Uint32Array((tc - 1) * (tr - 1) * 6);
        let q = 0;
        for (let r = 0; r < tr - 1; r++) {
          for (let c = 0; c < tc - 1; c++) {
            const a = r * tc + c;
            idx[q++] = a;
            idx[q++] = a + tc;
            idx[q++] = a + 1;
            idx[q++] = a + 1;
            idx[q++] = a + tc;
            idx[q++] = a + tc + 1;
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setIndex(new THREE.BufferAttribute(idx, 1));
        const mat = new THREE.MeshLambertMaterial({
          map: texture,
          transparent: feathered,
          depthWrite: !feathered,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 1;
        scene.add(mesh);
        t.mesh = mesh;
        t.dispose = () => {
          scene.remove(mesh);
          geo.dispose();
          mat.dispose();
          texture.dispose();
        };
      };

      const updateTiles = (near: THREE.Vector3[]) => {
        for (const t of tiles.values()) {
          const dist = Math.min(...near.map((p) => Math.hypot(p.x - t.cx, p.z - t.cz)));
          if (t.state === 'idle' && dist < tileLoadKm && tileLoads < 3) {
            t.state = 'loading';
            tileLoads++;
            const image = new Image();
            image.src = `${assetBase}/${terrain}/tiles/${t.file}`;
            image
              .decode()
              .then(() => {
                if (disposed || t.state !== 'loading') return;
                buildTile(t, image);
                t.state = 'ready';
              })
              .catch(() => {
                t.state = 'idle';
              })
              .finally(() => {
                tileLoads--;
              });
          } else if (t.state === 'ready' && dist > tileDropKm) {
            t.dispose?.();
            t.mesh = undefined;
            t.state = 'idle';
          }
        }
      };
      disposables.push({ dispose: () => tiles.forEach((t) => t.dispose?.()) });

      // --- Route ---------------------------------------------------------------
      let pts: THREE.Vector3[];
      if (track && track.points.length > 1) {
        // Resample the real track at even spacing so index maps straight to distance.
        const raw = track.points.map(([la, lo]) => new THREE.Vector3(toX(lo), 0, toZ(la)));
        pts = [raw[0].clone()];
        let carry = 0;
        for (let k = 1; k < raw.length; k++) {
          const seg = raw[k].distanceTo(raw[k - 1]);
          let at = SAMPLE_KM - carry;
          while (at <= seg) {
            pts.push(raw[k - 1].clone().lerp(raw[k], at / seg));
            at += SAMPLE_KM;
          }
          carry = seg - (at - SAMPLE_KM);
        }
        pts.push(raw[raw.length - 1].clone());
        setTrackCredit(track.credit);
        setRouteTotalKm(track.km);
      } else {
        const flatCurve = new THREE.CatmullRomCurve3(
          waypoints.map((w) => new THREE.Vector3(toX(w.lon), 0, toZ(w.lat))),
          false,
          'centripetal',
        );
        pts = flatCurve.getSpacedPoints(Math.ceil(flatCurve.getLength() / SAMPLE_KM));
      }
      const dist = new Float32Array(pts.length);
      const metres = new Float32Array(pts.length);
      // Ground distance first, before the points are lifted onto the terrain.
      for (let i = 1; i < pts.length; i++) dist[i] = dist[i - 1] + pts[i].distanceTo(pts[i - 1]);
      for (let i = 0; i < pts.length; i++) {
        metres[i] = surfaceMetres(toLon(pts[i].x), toLat(pts[i].z));
        pts[i].y = toY(metres[i]) + 0.02;
      }
      const totalKm = dist[dist.length - 1];
      const kmScale = (track?.km ?? routeKm) / totalKm;

      // Smoothed camera rail (moving average) so the camera doesn't zig-zag with the path.
      const w = Math.round(RAIL_SMOOTH_KM / SAMPLE_KM);
      const rail = pts.map((_, i) => {
        const a = Math.max(0, i - w);
        const b = Math.min(pts.length - 1, i + w);
        const p = new THREE.Vector3();
        for (let j = a; j <= b; j++) p.add(pts[j]);
        return p.divideScalar(b - a + 1);
      });

      const radial = 6;
      const routeCurve = new THREE.CatmullRomCurve3(pts);
      // Enough arc-length samples that tube segment i sits at track point i.
      routeCurve.arcLengthDivisions = pts.length * 2;
      const routeGeo = new THREE.TubeGeometry(routeCurve, pts.length - 1, 0.012, radial, false);
      const routeMat = new THREE.MeshBasicMaterial({
        color: '#d9a441',
        polygonOffset: true,
        polygonOffsetFactor: -8,
        polygonOffsetUnits: -8,
      });
      const routeMesh = new THREE.Mesh(routeGeo, routeMat);
      routeMesh.renderOrder = 2;
      scene.add(routeMesh);
      const ghostGeo = new THREE.TubeGeometry(routeCurve, pts.length - 1, 0.007, 4, false);
      const ghostMat = new THREE.MeshBasicMaterial({
        color: '#fbf6ee',
        transparent: true,
        opacity: 0.75,
        polygonOffset: true,
        polygonOffsetFactor: -8,
        polygonOffsetUnits: -8,
      });
      const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
      scene.add(ghostMesh);
      disposables.push(routeGeo, routeMat, ghostGeo, ghostMat);

      const walker = new THREE.Group();
      const pilgrim = createPilgrim();
      pilgrim.group.scale.setScalar(0.09);
      walker.add(pilgrim.group);
      disposables.push(pilgrim);
      const haloGeo = new THREE.RingGeometry(0.03, 0.045, 40);
      const haloMat = new THREE.MeshBasicMaterial({
        color: '#d9a441',
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      walker.add(halo);
      scene.add(walker);
      disposables.push(haloGeo, haloMat);

      // Distance along the route for each waypoint (nearest sample, searched monotonically).
      const wpDist: number[] = [];
      let cursor = 0;
      for (const wp of waypoints) {
        const target = new THREE.Vector3(toX(wp.lon), 0, toZ(wp.lat));
        let best = cursor;
        let bestD = Infinity;
        for (let i = cursor; i < pts.length; i++) {
          const d = (pts[i].x - target.x) ** 2 + (pts[i].z - target.z) ** 2;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
          if (d > bestD + 400) break; // 20 km past the best match
        }
        cursor = best;
        wpDist.push(dist[best]);
      }
      const stageEnds = waypoints
        .map((wp, i) => (wp.stageEnd !== undefined ? wpDist[i] : null))
        .filter((d): d is number => d !== null);
      sim.current.stageStarts = [0, ...stageEnds.slice(0, -1).map((d) => d / totalKm)];

      // Pins and floating labels for named places.
      const pinPositions: number[] = [];
      const labelled = waypoints
        .map((wp, i) => ({ wp, i }))
        .filter(({ wp }) => wp.label);
      const labelAnchors = labelled.map(({ wp, i }) => {
        const x = toX(wp.lon);
        const z = toZ(wp.lat);
        const y = groundY(x, z);
        pinPositions.push(x, y, z, x, y + 0.5, z);
        const el = document.createElement('div');
        el.className =
          'absolute left-0 top-0 whitespace-nowrap rounded-full bg-slate-deep/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-parchment shadow-sm will-change-transform';
        el.textContent = wp.name;
        el.style.opacity = '0';
        labelHost!.appendChild(el);
        labelEls.push(el);
        return {
          pos: new THREE.Vector3(x, y + 0.5, z),
          el,
          major: wp.stageEnd !== undefined || i === 0,
        };
      });
      const pinGeo = new THREE.BufferGeometry();
      pinGeo.setAttribute('position', new THREE.Float32BufferAttribute(pinPositions, 3));
      const pinMat = new THREE.LineBasicMaterial({ color: '#2b3340', transparent: true, opacity: 0.7 });
      scene.add(new THREE.LineSegments(pinGeo, pinMat));
      disposables.push(pinGeo, pinMat);

      // --- Elevation profile for the HUD --------------------------------------
      const PW = 1000;
      const PH = 100;
      const maxM = Math.max(...metres) * 1.08;
      const stride = Math.max(1, Math.floor(pts.length / 500));
      let path = `M0 ${PH}`;
      for (let i = 0; i < pts.length; i += stride) {
        path += ` L${((dist[i] / totalKm) * PW).toFixed(1)} ${(PH - (metres[i] / maxM) * PH).toFixed(1)}`;
      }
      path += ` L${PW} ${(PH - (metres[pts.length - 1] / maxM) * PH).toFixed(1)} L${PW} ${PH} Z`;
      setProfile({ path, stageX: stageEnds.slice(0, -1).map((d) => (d / totalKm) * PW) });

      // --- Overview framing ------------------------------------------------------
      const box = new THREE.Box3().setFromPoints(pts);
      const centre = box.getCenter(new THREE.Vector3());
      const halfW = (box.max.x - box.min.x) / 2 + 70;
      const overviewTarget = new THREE.Vector3();
      const overviewPos = new THREE.Vector3();
      const frameOverview = () => {
        if (camera.aspect < 1) {
          // Portrait: look down the length of the route from beyond its eastern end.
          overviewTarget.set(centre.x - halfW * 0.1, 0, centre.z);
          overviewPos.set(centre.x + halfW * 1.55, halfW * 1.2, centre.z + halfW * 0.35);
          return;
        }
        const vfov = (camera.fov * Math.PI) / 180;
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
        const dist = halfW / Math.tan(hfov / 2);
        overviewTarget.set(centre.x, 0, centre.z);
        overviewPos.set(centre.x, dist * 0.8, centre.z + dist * 0.55);
      };

      // --- Sizing ------------------------------------------------------------------
      const r = renderer!;
      r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host!.appendChild(r.domElement);
      r.domElement.style.display = 'block';
      const resize = () => {
        const { clientWidth, clientHeight } = host!;
        r.setSize(clientWidth, clientHeight, false);
        r.domElement.style.width = '100%';
        r.domElement.style.height = '100%';
        camera.aspect = clientWidth / Math.max(clientHeight, 1);
        camera.updateProjectionMatrix();
        frameOverview();
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host!);

      // Aerial photography near the walker, and a sharper patch over the destination.
      const detail = new DetailImagery({
        scene,
        renderer: r,
        source: IBERIAN_AERIAL,
        project: (lon, lat) => new THREE.Vector3(toX(lon), toY(surfaceMetres(lon, lat)), toZ(lat)),
      });
      disposables.push(detail);
      const detailRadius = window.innerWidth < 768 ? 3.5 : 4.5;
      const destination = waypoints[waypoints.length - 1];
      const destPos = new THREE.Vector3(toX(destination.lon), 0, toZ(destination.lat));
      destPos.y = groundY(destPos.x, destPos.z);
      let landmarkPinned = false;
      const focus = new THREE.Vector3();

      // --- Animation -----------------------------------------------------------------
      const indexAt = (d: number) => Math.min(Math.max(Math.round(d / SAMPLE_KM), 0), pts.length - 1);
      const followPos = new THREE.Vector3();
      const followTarget = new THREE.Vector3();
      const camPos = new THREE.Vector3();
      const camTarget = new THREE.Vector3();
      const smoothPos = new THREE.Vector3();
      const smoothTarget = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      let initialised = false;
      let last = performance.now();
      let lastStage = -1;
      let lastPlace = -1;
      let lastNote: number | null = -1;
      let lastKm = -1;
      let lastTileCheck = 0;
      let lastDetailCheck = 0;
      let arrivalT = 0;
      let orbitAngle = 0;

      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        const s = sim.current;

        // Hold the walker at the start until the camera has swooped down from the overview.
        if (s.playing && s.phase === 'flying' && s.overview < 0.35) {
          s.progress += (dt / FLIGHT_SECONDS) * s.speed;
          if (s.progress >= 1) {
            s.progress = 1;
            s.playing = false;
            setPlaying(false);
            s.phase = 'arrival';
            setPhase('arrival');
          }
        }
        const arriving = s.phase === 'arrival' || s.phase === 'done';
        if (arriving) {
          if (arrivalT === 0) {
            orbitAngle = Math.atan2(camera.position.z - destPos.z, camera.position.x - destPos.x);
          }
          arrivalT += dt;
          if (s.phase === 'arrival' && arrivalT > ARRIVAL_SECONDS) {
            s.phase = 'done';
            setPhase('done');
          }
        } else {
          arrivalT = 0;
        }
        const towards = s.overviewTarget;
        const rate = dt / INTRO_SECONDS;
        s.overview = towards > s.overview ? Math.min(s.overview + rate, 1) : Math.max(s.overview - rate, 0);
        const blend = easeInOut(s.overview);

        const d = s.progress * totalKm;
        const i = indexAt(d);
        const walkerPos = pts[i];
        walker.position.copy(walkerPos).y -= 0.02;
        const pulse = 1 + Math.sin(now / 300) * 0.15;
        halo.scale.setScalar(pulse);
        walker.scale.setScalar(1 + blend * 40);
        ghostMesh.visible = !arriving;

        routeGeo.setDrawRange(0, i * radial * 6);

        // Camera follows the smoothed rail, behind and above the walker.
        const back = rail[indexAt(d - CAMERA_BACK_KM)];
        const ahead = rail[indexAt(d + LOOK_AHEAD_KM)];
        const dir = tmp.copy(ahead).sub(back).setY(0);
        if (dir.lengthSq() < 1e-6) dir.set(-1, 0, 0);
        dir.normalize();
        const walking = s.playing && s.phase === 'flying' && s.overview < 0.35;
        pilgrim.update(walking ? dt * 7 * Math.min(s.speed, 2) : 0, dir, dt);
        followPos.copy(walkerPos).addScaledVector(dir, -CAMERA_BACK_KM);
        let floor = 0;
        for (let t = 0; t <= 1; t += 0.25) {
          const x = THREE.MathUtils.lerp(followPos.x, walkerPos.x, t);
          const z = THREE.MathUtils.lerp(followPos.z, walkerPos.z, t);
          floor = Math.max(floor, groundY(x, z));
        }
        followPos.y = Math.max(walkerPos.y + CAMERA_HEIGHT_KM, floor + 0.4);
        followTarget.copy(walkerPos).addScaledVector(dir, LOOK_AHEAD_KM);
        followTarget.y = walkerPos.y;

        if (!initialised) {
          smoothPos.copy(followPos);
          smoothTarget.copy(followTarget);
          initialised = true;
        } else {
          // Frame-rate independent damping; faster while scrubbing big distances.
          const k = 1 - Math.exp(-dt * 3);
          smoothPos.lerp(followPos, k);
          smoothTarget.lerp(followTarget, k);
          if (smoothPos.distanceTo(followPos) > 15) smoothPos.copy(followPos);
          if (smoothTarget.distanceTo(followTarget) > 15) smoothTarget.copy(followTarget);
        }
        if (arriving) {
          // Arrival: ease from following the walker into a slow circle over the destination.
          const a = easeInOut(Math.min(arrivalT / 5, 1));
          orbitAngle += dt * 0.08;
          const radius = THREE.MathUtils.lerp(2.4, 1.3, a);
          tmp.set(
            destPos.x + Math.cos(orbitAngle) * radius,
            destPos.y + THREE.MathUtils.lerp(CAMERA_HEIGHT_KM, 0.85, a),
            destPos.z + Math.sin(orbitAngle) * radius,
          );
          smoothPos.lerp(tmp, a);
          smoothTarget.lerp(destPos, a);
        }
        camPos.lerpVectors(smoothPos, overviewPos, blend);
        camTarget.lerpVectors(smoothTarget, overviewTarget, blend);
        camera.position.copy(camPos);
        camera.lookAt(camTarget);
        (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(FOG_FOLLOW, FOG_NEAR, blend);

        if (blend < 0.5 && now - lastTileCheck > 500) {
          lastTileCheck = now;
          updateTiles([walkerPos, rail[indexAt(d + 35)]]);
        }
        if (blend < 0.5 && now - lastDetailCheck > 300) {
          lastDetailCheck = now;
          // Centre the sharp imagery a little ahead of the walker, where the camera looks.
          focus.copy(arriving ? destPos : rail[indexAt(d + 1.2)]);
          detail.update(toLon(focus.x), toLat(focus.z), focus, detailRadius, DETAIL_ZOOM);
          if (!landmarkPinned && totalKm - d < 25) {
            detail.pin(destination.lon, destination.lat, LANDMARK_ZOOM, 3);
            landmarkPinned = true;
          } else if (landmarkPinned && totalKm - d > 40) {
            detail.release(LANDMARK_ZOOM);
            landmarkPinned = false;
          }
        }

        r.render(scene, camera);

        // Labels
        const { clientWidth: cw, clientHeight: ch } = host!;
        for (const a of labelAnchors) {
          tmp.copy(a.pos).project(camera);
          const distance = a.pos.distanceTo(camera.position);
          let opacity = 0;
          if (tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1) {
            opacity = blend > 0.5 ? (a.major ? 1 : 0) : 1 - smoothstep(12, 25, distance);
          }
          a.el.style.opacity = opacity.toFixed(2);
          a.el.style.transform = `translate(${((tmp.x + 1) / 2) * cw}px, ${((1 - tmp.y) / 2) * ch}px) translate(-50%, -130%)`;
        }

        // HUD
        const km = d * kmScale;
        if (Math.round(km) !== lastKm) {
          lastKm = Math.round(km);
          if (kmRef.current) kmRef.current.textContent = formatKm(km);
          if (elevRef.current) elevRef.current.textContent = formatKm(metres[i]);
        }
        if (markerRef.current) markerRef.current.setAttribute('transform', `translate(${s.progress * PW} 0)`);
        if (scrubRef.current && document.activeElement !== scrubRef.current) {
          scrubRef.current.value = String(Math.round(s.progress * 1000));
        }
        let stage = stageEnds.findIndex((e) => d <= e + 0.01);
        if (stage < 0) stage = stageEnds.length - 1;
        if (stage !== lastStage) {
          lastStage = stage;
          setStageIdx(stage);
        }
        let place = 0;
        for (let p = 0; p < waypoints.length; p++) if (wpDist[p] <= d + 1) place = p;
        if (place !== lastPlace) {
          lastPlace = place;
          setPlaceIdx(place);
        }
        let note: number | null = null;
        if (s.phase === 'flying') {
          for (let p = 0; p < waypoints.length; p++) {
            if (waypoints[p].note && d >= wpDist[p] - 6 && d <= wpDist[p] + 18) note = p;
          }
        }
        if (note !== lastNote) {
          lastNote = note;
          setNoteIdx(note);
        }
      };

      setPhase('intro');
      raf = requestAnimationFrame(tick);
    }

    init().catch(() => {
      if (!disposed) setPhase('error');
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      for (const d of disposables) d.dispose();
      for (const el of labelEls) el.remove();
      if (renderer) {
        renderer.domElement.remove();
        renderer.dispose();
      }
    };
  }, [assetBase, terrain, waypoints, exaggeration, routeKm]);

  const begin = useCallback(() => {
    if (sim.current.progress >= 1) sim.current.progress = 0;
    setPhase('flying');
    setPlaying(true);
  }, []);

  const seek = useCallback((value: number) => {
    sim.current.progress = Math.min(Math.max(value, 0), 1);
    if (sim.current.phase !== 'flying') setPhase('flying');
  }, []);

  const jumpToStage = useCallback(
    (index: number) => {
      seek(sim.current.stageStarts[index] ?? 0);
      setPlaying(true);
    },
    [seek],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (phase !== 'flying' && phase !== 'done')) return;
      // Let focused buttons and links handle Space themselves.
      if (e.target instanceof HTMLElement && ['BUTTON', 'A'].includes(e.target.tagName)) return;
      {
        e.preventDefault();
        if (phase === 'done') begin();
        else setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin]);

  const stage = stages[stageIdx];
  const place = waypoints[placeIdx];
  const note = noteIdx !== null ? waypoints[noteIdx] : null;

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100svh-65px)] min-h-[560px] w-full overflow-hidden"
      style={{ background: `linear-gradient(to bottom, #b9c6cc 0%, #d8d6cf 45%, ${HAZE} 70%)` }}
    >
      <div ref={canvasHostRef} className="absolute inset-0" />
      <div ref={labelsRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />

      {/* Top-left: where we are */}
      <div className="pointer-events-none absolute left-4 top-4 right-4 sm:left-8 sm:top-6 flex items-start justify-between gap-4">
        <div className="max-w-md">
          <Link
            href={`/routes/${slug}`}
            className="pointer-events-auto text-xs font-medium uppercase tracking-widest text-slate-deep/80 hover:text-slate-deep"
            style={{ textShadow: '0 0 8px rgba(245,240,235,0.9)' }}
          >
            &larr; {routeName}
          </Link>
          {(phase === 'flying' || phase === 'arrival') && (
            <>
              <p
                className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-deep/80"
                style={{ textShadow: '0 0 8px rgba(245,240,235,0.9)' }}
              >
                {stage?.label} &middot; {stage?.name}
              </p>
              <h1
                className="mt-1 font-display text-3xl sm:text-4xl leading-tight text-slate-deep"
                style={{ textShadow: '0 0 12px rgba(245,240,235,0.9), 0 0 3px rgba(245,240,235,0.9)' }}
              >
                {place?.name}
              </h1>
            </>
          )}
        </div>
        {(phase === 'flying' || phase === 'arrival') && (
          <dl className="shrink-0 rounded-lg bg-parchment/85 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-stone">Walked</dt>
              <dd className="font-display text-2xl text-slate-deep tabular-nums">
                <span ref={kmRef}>0</span>
                <span className="text-base text-stone"> / {formatKm(routeTotalKm)} km</span>
              </dd>
            </div>
            <div className="mt-1">
              <dt className="text-[10px] uppercase tracking-widest text-stone">Elevation</dt>
              <dd className="text-sm text-slate-deep tabular-nums">
                <span ref={elevRef}>0</span> m
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Caption for the place we're passing */}
      {phase === 'flying' && note && (
        <div
          key={noteIdx}
          className="pointer-events-none absolute left-4 right-4 sm:left-8 sm:right-auto bottom-44 sm:max-w-sm rounded-lg bg-slate-deep/85 px-5 py-4 text-parchment shadow-lg backdrop-blur-sm animate-[fadeUp_0.6s_ease-out]"
        >
          <p className="text-[10px] uppercase tracking-widest text-ochre">{note.name}</p>
          <p className="mt-1 text-sm leading-relaxed">{note.note}</p>
        </div>
      )}

      {/* Bottom controls */}
      {(phase === 'flying' || phase === 'arrival' || phase === 'done') && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-parchment via-parchment/90 to-transparent px-4 pb-4 pt-10 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {stages.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => jumpToStage(i)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    i === stageIdx && phase === 'flying'
                      ? 'bg-slate-deep text-parchment'
                      : 'bg-white/70 text-stone hover:bg-white hover:text-slate-deep'
                  }`}
                >
                  {s.label}: {s.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (phase === 'done' ? begin() : setPlaying((p) => !p))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white hover:bg-forest/90"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <rect x="2" y="1" width="3.5" height="12" fill="currentColor" />
                    <rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M3 1 L13 7 L3 13 Z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <div className="relative h-14 flex-1">
                {profile && (
                  <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                    <path d={profile.path} fill="#5C6B54" fillOpacity="0.25" stroke="#5C6B54" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    {profile.stageX.map((x) => (
                      <line key={x} x1={x} x2={x} y1="0" y2="100" stroke="#2B3340" strokeOpacity="0.25" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                    ))}
                    <g ref={markerRef}>
                      <line x1="0" x2="0" y1="0" y2="100" stroke="#d9a441" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </g>
                  </svg>
                )}
                <input
                  ref={scrubRef}
                  type="range"
                  min={0}
                  max={1000}
                  defaultValue={0}
                  onChange={(e) => seek(Number(e.target.value) / 1000)}
                  aria-label="Position along the route"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <button
                type="button"
                onClick={() => setSpeedIdx((s) => (s + 1) % SPEEDS.length)}
                className="shrink-0 rounded-md border border-slate-deep/20 bg-white/70 px-2.5 py-1.5 text-xs font-medium tabular-nums text-slate-deep hover:bg-white"
                aria-label="Change speed"
              >
                {SPEEDS[speedIdx]}&times;
              </button>
            </div>
            {imageryCredit && (
              <p className="mt-1.5 text-right text-[10px] text-stone/80">
                Imagery: {imageryCredit}; {AERIAL_CREDIT} &middot; Elevation: Mapzen Terrain Tiles
                {trackCredit && <> &middot; {trackCredit}</>}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Intro / arrival / loading / error overlays */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm uppercase tracking-widest text-slate-deep/70 animate-pulse">Loading terrain&hellip;</p>
        </div>
      )}
      {phase === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
            <p className="font-display text-2xl text-slate-deep">The flythrough couldn&rsquo;t load</p>
            <p className="mt-3 text-stone">Your browser may not support WebGL. The full stage-by-stage guide is still available.</p>
            <Link href={`/routes/${slug}`} className="mt-6 inline-block rounded-md bg-forest px-6 py-3 text-sm font-medium text-white hover:bg-forest/90">
              View the route
            </Link>
          </div>
        </div>
      )}
      {phase === 'intro' && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-8 sm:pb-12">
          <div className="max-w-lg rounded-xl bg-parchment/90 p-6 sm:p-8 text-center shadow-xl backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-ochre">3D Flythrough</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl text-slate-deep">{routeName}</h1>
            <p className="mt-3 text-stone leading-relaxed">
              Follow {formatKm(routeTotalKm)} km of the Way across real terrain, from {waypoints[0].name} to{' '}
              {waypoints[waypoints.length - 1].name}.
            </p>
            <button
              type="button"
              onClick={begin}
              className="mt-6 inline-block rounded-md bg-forest px-8 py-3.5 text-base font-medium text-white hover:bg-forest/90"
            >
              Begin the flythrough
            </button>
            <p className="mt-4 text-[11px] text-stone/80">
              Elevation data: Mapzen Terrain Tiles (AWS Open Data). Heights exaggerated {exaggeration}&times;.
              {imageryCredit && <> Imagery: {imageryCredit}. {AERIAL_CREDIT}.</>}
              {trackCredit && <> {trackCredit}.</>}
            </p>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div className="absolute left-4 right-4 top-4 sm:left-8 sm:right-auto sm:top-24">
          <div className="sm:max-w-sm rounded-xl bg-parchment/90 p-5 sm:p-6 shadow-xl backdrop-blur-sm animate-[fadeUp_0.6s_ease-out]">
            <p className="text-xs font-medium uppercase tracking-widest text-ochre">Journey&rsquo;s end</p>
            <h2 className="mt-2 font-display text-3xl text-slate-deep">
              {waypoints[waypoints.length - 1].name}
            </h2>
            <p className="mt-2 text-sm text-stone leading-relaxed">
              {formatKm(routeTotalKm)} km on foot to the cathedral. We book every bed and carry your bags; you just walk.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/enquire?route=${encodeURIComponent(routeName)}`}
                className="inline-block rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest/90"
              >
                {ctaLabel}
              </Link>
              <button
                type="button"
                onClick={begin}
                className="inline-block rounded-md border border-slate-deep/20 px-5 py-2.5 text-sm font-medium text-slate-deep hover:bg-white/60"
              >
                Fly again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
