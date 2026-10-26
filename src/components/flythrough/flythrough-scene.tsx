'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import type { Flythrough } from '@/lib/flythroughs';
import type { RouteStage } from '@/lib/routes';
import { createPilgrim } from './pilgrim';

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

interface Props {
  slug: string;
  routeName: string;
  flythrough: Flythrough;
  stages: RouteStage[];
  ctaLabel: string;
}

type Phase = 'loading' | 'intro' | 'flying' | 'done' | 'error';

// Scene units are kilometres on the ground; heights are exaggerated.
const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON = 111.32;
const SAMPLE_KM = 0.2;
const RAIL_SMOOTH_KM = 8;
const CAMERA_BACK_KM = 7;
const LOOK_AHEAD_KM = 4;
const FLIGHT_SECONDS = 150;
const INTRO_SECONDS = 3;
const SPEEDS = [1, 2, 4];

const FOG_NEAR = 0.0009;
const FOG_FOLLOW = 0.011;
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

export default function FlythroughScene({ slug, routeName, flythrough, stages, ctaLabel }: Props) {
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
    sim.current.overviewTarget = phase === 'flying' ? 0 : 1;
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
      const [meta, buf] = await Promise.all([
        fetch(`/terrain/${terrain}.json`).then((r) => {
          if (!r.ok) throw new Error('terrain meta');
          return r.json() as Promise<TerrainMeta>;
        }),
        fetch(`/terrain/${terrain}.bin`).then((r) => {
          if (!r.ok) throw new Error('terrain data');
          return r.arrayBuffer();
        }),
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
      const groundY = (x: number, z: number) => toY(metresAtXZ(x, z));

      // --- Scene -------------------------------------------------------------
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(HAZE, FOG_NEAR);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 3000);

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
        img.src = `/terrain/${terrain}.jpg`;
      }

      // --- Route ---------------------------------------------------------------
      const flatCurve = new THREE.CatmullRomCurve3(
        waypoints.map((w) => new THREE.Vector3(toX(w.lon), 0, toZ(w.lat))),
        false,
        'centripetal',
      );
      const n = Math.ceil(flatCurve.getLength() / SAMPLE_KM);
      const pts = flatCurve.getSpacedPoints(n);
      const dist = new Float32Array(pts.length);
      const metres = new Float32Array(pts.length);
      // Ground distance first, before the points are lifted onto the terrain.
      for (let i = 1; i < pts.length; i++) dist[i] = dist[i - 1] + pts[i].distanceTo(pts[i - 1]);
      for (let i = 0; i < pts.length; i++) {
        metres[i] = Math.max(metresAtXZ(pts[i].x, pts[i].z), 0);
        pts[i].y = toY(metres[i]) + 0.1;
      }
      const totalKm = dist[dist.length - 1];
      const kmScale = routeKm / totalKm;

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
      const routeGeo = new THREE.TubeGeometry(routeCurve, pts.length - 1, 0.05, radial, false);
      const routeMat = new THREE.MeshBasicMaterial({ color: '#d9a441' });
      const routeMesh = new THREE.Mesh(routeGeo, routeMat);
      routeMesh.renderOrder = 2;
      scene.add(routeMesh);
      const ghostGeo = new THREE.TubeGeometry(routeCurve, pts.length - 1, 0.035, 4, false);
      const ghostMat = new THREE.MeshBasicMaterial({ color: '#fbf6ee', transparent: true, opacity: 0.75 });
      scene.add(new THREE.Mesh(ghostGeo, ghostMat));
      disposables.push(routeGeo, routeMat, ghostGeo, ghostMat);

      const walker = new THREE.Group();
      const pilgrim = createPilgrim();
      pilgrim.group.scale.setScalar(0.9);
      walker.add(pilgrim.group);
      disposables.push(pilgrim);
      const haloGeo = new THREE.RingGeometry(0.22, 0.32, 40);
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
          if (d > bestD + 400) break;
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
        pinPositions.push(x, y, z, x, y + 1.6, z);
        const el = document.createElement('div');
        el.className =
          'absolute left-0 top-0 whitespace-nowrap rounded-full bg-slate-deep/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-parchment shadow-sm will-change-transform';
        el.textContent = wp.name;
        el.style.opacity = '0';
        labelHost!.appendChild(el);
        labelEls.push(el);
        return {
          pos: new THREE.Vector3(x, y + 1.6, z),
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
            setPhase('done');
          }
        }
        const towards = s.overviewTarget;
        const rate = dt / INTRO_SECONDS;
        s.overview = towards > s.overview ? Math.min(s.overview + rate, 1) : Math.max(s.overview - rate, 0);
        const blend = easeInOut(s.overview);

        const d = s.progress * totalKm;
        const i = indexAt(d);
        const walkerPos = pts[i];
        walker.position.copy(walkerPos).y -= 0.08;
        const pulse = 1 + Math.sin(now / 300) * 0.15;
        halo.scale.setScalar(pulse);
        walker.scale.setScalar(1 + blend * 6);

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
        followPos.y = Math.max(walkerPos.y + 3.4, floor + 2);
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
          if (smoothPos.distanceTo(followPos) > 40) smoothPos.copy(followPos);
          if (smoothTarget.distanceTo(followTarget) > 40) smoothTarget.copy(followTarget);
        }
        camPos.lerpVectors(smoothPos, overviewPos, blend);
        camTarget.lerpVectors(smoothTarget, overviewTarget, blend);
        camera.position.copy(camPos);
        camera.lookAt(camTarget);
        (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(FOG_FOLLOW, FOG_NEAR, blend);

        r.render(scene, camera);

        // Labels
        const { clientWidth: cw, clientHeight: ch } = host!;
        for (const a of labelAnchors) {
          tmp.copy(a.pos).project(camera);
          const distance = a.pos.distanceTo(camera.position);
          let opacity = 0;
          if (tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1) {
            opacity = blend > 0.5 ? (a.major ? 1 : 0) : 1 - smoothstep(35, 70, distance);
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
  }, [terrain, waypoints, exaggeration, routeKm]);

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
            className="pointer-events-auto text-xs font-medium uppercase tracking-widest text-slate-deep/70 hover:text-slate-deep"
          >
            &larr; {routeName}
          </Link>
          {phase === 'flying' && (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-deep/70">
                {stage?.label} &middot; {stage?.name}
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl leading-tight text-slate-deep">
                {place?.name}
              </h1>
            </>
          )}
        </div>
        {phase === 'flying' && (
          <dl className="shrink-0 rounded-lg bg-parchment/85 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-stone">Walked</dt>
              <dd className="font-display text-2xl text-slate-deep tabular-nums">
                <span ref={kmRef}>0</span>
                <span className="text-base text-stone"> / {formatKm(routeKm)} km</span>
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
      {(phase === 'flying' || phase === 'done') && (
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
                Imagery: {imageryCredit} &middot; Elevation: Mapzen Terrain Tiles
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
              Follow {formatKm(routeKm)} km of the Way across real terrain, from {waypoints[0].name} to{' '}
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
              {imageryCredit && <> Imagery: {imageryCredit}.</>}
            </p>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4">
          <div className="max-w-lg rounded-xl bg-parchment/90 p-6 sm:p-8 text-center shadow-xl backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-ochre">Journey&rsquo;s end</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl text-slate-deep">
              {waypoints[waypoints.length - 1].name}
            </h2>
            <p className="mt-3 text-stone leading-relaxed">
              {formatKm(routeKm)} km on foot. We book every bed and carry your bags; you just walk.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/enquire?route=${encodeURIComponent(routeName)}`}
                className="inline-block rounded-md bg-forest px-6 py-3 text-sm font-medium text-white hover:bg-forest/90"
              >
                {ctaLabel}
              </Link>
              <button
                type="button"
                onClick={begin}
                className="inline-block rounded-md border border-slate-deep/20 px-6 py-3 text-sm font-medium text-slate-deep hover:bg-white/60"
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
