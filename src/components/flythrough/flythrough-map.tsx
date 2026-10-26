'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as maplibregl from 'maplibre-gl';
import type {
  CameraOptions,
  LayerSpecification,
  LngLatLike,
  SourceSpecification,
  StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Flythrough } from '@/lib/flythroughs';
import type { RouteStage } from '@/lib/routes';
import { PilgrimLayer } from './pilgrim-layer';

interface TerrainMeta {
  west: number;
  east: number;
  south: number;
  north: number;
  width: number;
  height: number;
}

interface Track {
  credit: string;
  km: number;
  points: [number, number][];
}

interface Props {
  /** Where the baked terrain and track files are served from. */
  assetBase?: string;
  /** Where baked imagery tiles are served from (see scripts/upload-tiles-r2.sh). */
  tileBase?: string;
  /** ArcGIS Location Platform key for Esri World Imagery; without it, free imagery is used. */
  arcgisKey?: string;
  /** MapLibre's worker script (copied into /public by scripts/copy-maplibre-worker.mjs). */
  workerUrl?: string;
  slug: string;
  routeName: string;
  flythrough: Flythrough;
  stages: RouteStage[];
  ctaLabel: string;
}

type Phase = 'loading' | 'intro' | 'flying' | 'arrival' | 'done' | 'error';

const SAMPLE_M = 25;
const RAIL_M = 1200; // half-width of the camera rail's moving average
const BACK_M = 950; // camera distance behind the walker
const LOOK_M = 380; // camera looks this far ahead of the walker
const FLIGHT_SECONDS = 1920; // whole route at 1x (32 min); the old ¼ pace felt right
const INTRO_SECONDS = 3.5;
const ARRIVAL_SECONDS = 7;
const PAUSE_SECONDS = 9;
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];
const DEFAULT_SPEED = SPEEDS.indexOf(1);
const HAZE = '#e7dfd2';

const TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const OPENFREEMAP = 'https://tiles.openfreemap.org/planet';
const ESRI_IMAGERY = 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const PNOA =
  'https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}';
const IGN_FRANCE =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg';

const CREDITS = {
  esri: 'Imagery: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  sentinel: 'Imagery: contains modified Copernicus Sentinel data 2023–2024',
  iberia: 'Aerial photography: PNOA cedido por © Instituto Geográfico Nacional de España (CC BY 4.0); © IGN France',
  map: 'Map data © OpenStreetMap contributors, OpenMapTiles, OpenFreeMap',
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const wrap180 = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Moves a lng/lat by metres east and north (fine at the scales used here). */
function offset(lng: number, lat: number, east: number, north: number): [number, number] {
  return [lng + east / (111320 * Math.cos(toRad(lat))), lat + north / 110574];
}

function bearingBetween(a: [number, number], b: [number, number]) {
  const east = (b[0] - a[0]) * 111320 * Math.cos(toRad(a[1]));
  const north = (b[1] - a[1]) * 110574;
  return (Math.atan2(east, north) * 180) / Math.PI;
}

function formatSpeed(speed: number) {
  const label = speed === 0.25 ? '¼' : speed === 0.5 ? '½' : String(speed);
  return `${label}×`;
}

function formatKm(km: number) {
  return Math.round(km).toLocaleString('en-GB');
}

function buildStyle(
  flythrough: Flythrough,
  slug: string,
  tileBase: string,
  arcgisKey: string | undefined,
  meta: TerrainMeta,
  line: GeoJSON.Feature<GeoJSON.LineString>,
): StyleSpecification {
  const sources: Record<string, SourceSpecification> = {
    dem: { type: 'raster-dem', tiles: [TERRARIUM], encoding: 'terrarium', tileSize: 256, maxzoom: 15 },
    'dem-shade': { type: 'raster-dem', tiles: [TERRARIUM], encoding: 'terrarium', tileSize: 256, maxzoom: 14 },
    ofm: { type: 'vector', url: OPENFREEMAP },
    track: { type: 'geojson', data: line },
    walked: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } },
  };
  const layers: LayerSpecification[] = [{ id: 'background', type: 'background', paint: { 'background-color': HAZE } }];

  if (arcgisKey) {
    sources.esri = {
      type: 'raster',
      tiles: [`${ESRI_IMAGERY}?token=${encodeURIComponent(arcgisKey)}`],
      tileSize: 256,
      maxzoom: 19,
    };
    layers.push({ id: 'esri', type: 'raster', source: 'esri' });
  }
  if (flythrough.imagery === 'iberia') {
    sources.pnoa = { type: 'raster', tiles: [PNOA], tileSize: 256, maxzoom: 19, bounds: [-9.9, 35.0, 4.6, 43.9] };
    sources['ign-fr'] = { type: 'raster', tiles: [IGN_FRANCE], tileSize: 256, maxzoom: 19, bounds: [-1.42, 43.075, -0.9, 43.5] };
    layers.push({ id: 'pnoa', type: 'raster', source: 'pnoa' }, { id: 'ign-fr', type: 'raster', source: 'ign-fr' });
  } else if (!arcgisKey) {
    // The whole region to zoom 11, and sharper zooms only near the track: two sources, so
    // where the sharp tiles stop the region layer shows through instead of a gap.
    const tiles = [`${tileBase}/${slug}/{z}/{x}/{y}.webp`];
    const bounds: [number, number, number, number] = [meta.west, meta.south, meta.east, meta.north];
    sources['sentinel-region'] = { type: 'raster', tiles, tileSize: 256, minzoom: 8, maxzoom: 11, bounds };
    sources['sentinel-route'] = { type: 'raster', tiles, tileSize: 256, minzoom: 12, maxzoom: 13, bounds };
    layers.push(
      { id: 'sentinel-region', type: 'raster', source: 'sentinel-region' },
      { id: 'sentinel-route', type: 'raster', source: 'sentinel-route', minzoom: 11.5 },
    );
    // Calm water over the sea, where passes from different days don't match.
    layers.push({
      id: 'water',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'water',
      paint: { 'fill-color': '#a3b7bd', 'fill-opacity': 0.9 },
    });
  }

  layers.push(
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'dem-shade',
      paint: {
        'hillshade-exaggeration': 0.35,
        'hillshade-shadow-color': 'rgba(43, 51, 64, 0.45)',
        'hillshade-highlight-color': 'rgba(255, 248, 235, 0.25)',
        'hillshade-accent-color': 'rgba(0, 0, 0, 0)',
      },
    },
    // Woodland: barely tinted, but it keeps the polygons loaded for the 3D trees.
    {
      id: 'woodland',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-color': '#2f4a28', 'fill-opacity': 0.08 },
    },
    {
      id: 'track-ahead',
      type: 'line',
      source: 'track',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#fbf6ee',
        'line-opacity': 0.75,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 13, 3, 16, 6],
      },
    },
    // The stretch walked so far, as its own line: line gradients don't draw on 3D terrain.
    {
      id: 'track-walked',
      type: 'line',
      source: 'walked',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#d9a441',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2.5, 13, 5, 16, 9],
      },
    },
    {
      id: 'buildings',
      type: 'fill-extrusion',
      source: 'ofm',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': '#e6ddd0',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.92,
      },
    },
  );

  return {
    version: 8,
    sources,
    layers,
    terrain: { source: 'dem', exaggeration: flythrough.exaggeration },
    sky: {
      'sky-color': '#9fb6c9',
      'horizon-color': '#e9e2d6',
      'fog-color': HAZE,
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.7,
      'fog-ground-blend': 0.55,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 10, 1, 12, 0],
    },
    light: { anchor: 'map', position: [1.3, 210, 35], color: '#fff3e0', intensity: 0.35 },
  };
}

export default function FlythroughMap({
  assetBase = '/terrain',
  tileBase = process.env.NEXT_PUBLIC_FLYTHROUGH_TILE_BASE ?? '/tiles',
  arcgisKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY,
  workerUrl = '/maplibre/maplibre-gl-worker.mjs',
  slug,
  routeName,
  flythrough,
  stages,
  ctaLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapHostRef = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const elevRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(DEFAULT_SPEED);
  const [stageIdx, setStageIdx] = useState(0);
  const [placeIdx, setPlaceIdx] = useState(0);
  const [noteIdx, setNoteIdx] = useState<number | null>(null);
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
    /** Set when the user seeks, so landmark pauses don't trigger on a jump. */
    jumped: false,
  });

  const { waypoints, exaggeration, terrain } = flythrough;
  const credits = [
    flythrough.imagery === 'iberia' ? CREDITS.iberia : arcgisKey ? CREDITS.esri : CREDITS.sentinel,
    `Elevation: ${flythrough.terrainCredit}`,
    CREDITS.map,
  ].join(' · ');

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
    const host = mapHostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let map: maplibregl.Map | null = null;
    const markers: maplibregl.Marker[] = [];

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
        fetch(`${assetBase}/${terrain}-track.json`).then((r) => {
          if (!r.ok) throw new Error('track');
          return r.json() as Promise<Track>;
        }),
      ]);
      if (disposed) return;
      const heights = new Int16Array(buf);

      // Baked heightfield: for the camera's ground clearance and the elevation profile,
      // available everywhere at once (the map only knows heights for tiles it has loaded).
      const metresAt = (lng: number, lat: number) => {
        const fx = ((lng - meta.west) / (meta.east - meta.west)) * (meta.width - 1);
        const fy = ((meta.north - lat) / (meta.north - meta.south)) * (meta.height - 1);
        const ix = Math.min(Math.max(Math.floor(fx), 0), meta.width - 2);
        const iy = Math.min(Math.max(Math.floor(fy), 0), meta.height - 2);
        const dx = Math.min(Math.max(fx - ix, 0), 1);
        const dy = Math.min(Math.max(fy - iy, 0), 1);
        const at = (x: number, y: number) => Math.max(heights[y * meta.width + x], 0);
        return (
          at(ix, iy) * (1 - dx) * (1 - dy) +
          at(ix + 1, iy) * dx * (1 - dy) +
          at(ix, iy + 1) * (1 - dx) * dy +
          at(ix + 1, iy + 1) * dx * dy
        );
      };

      // --- Track, resampled every SAMPLE_M metres -----------------------------------
      const lng: number[] = [];
      const lat: number[] = [];
      {
        const pts = track.points.map(([la, lo]) => [lo, la] as [number, number]);
        lng.push(pts[0][0]);
        lat.push(pts[0][1]);
        let carry = 0;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1];
          const [bx, by] = pts[k];
          const seg = Math.hypot((bx - ax) * 111320 * Math.cos(toRad(ay)), (by - ay) * 110574);
          let at = SAMPLE_M - carry;
          while (at <= seg) {
            lng.push(lerp(ax, bx, at / seg));
            lat.push(lerp(ay, by, at / seg));
            at += SAMPLE_M;
          }
          carry = seg - (at - SAMPLE_M);
        }
      }
      const count = lng.length;
      const totalM = (count - 1) * SAMPLE_M;
      const elev = lng.map((x, i) => metresAt(x, lat[i]));
      setRouteTotalKm(track.km);

      // Camera rail: moving average of the track, so the camera ignores every twist of the path.
      const w = Math.round(RAIL_M / SAMPLE_M);
      const sumX = new Float64Array(count + 1);
      const sumY = new Float64Array(count + 1);
      for (let i = 0; i < count; i++) {
        sumX[i + 1] = sumX[i] + lng[i];
        sumY[i + 1] = sumY[i] + lat[i];
      }
      const railAt = (i: number): [number, number] => {
        const a = Math.max(0, i - w);
        const b = Math.min(count - 1, i + w);
        const n = b - a + 1;
        return [(sumX[b + 1] - sumX[a]) / n, (sumY[b + 1] - sumY[a]) / n];
      };
      const indexAt = (d: number) => Math.min(Math.max(Math.round(d / SAMPLE_M), 0), count - 1);

      // Waypoint distances along the track (nearest sample, searched in order).
      const wpDist: number[] = [];
      let cursor = 0;
      for (const wp of waypoints) {
        let best = cursor;
        let bestD = Infinity;
        for (let i = cursor; i < count; i++) {
          const d = ((lng[i] - wp.lon) * Math.cos(toRad(wp.lat))) ** 2 + (lat[i] - wp.lat) ** 2;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
          if (d > bestD + 0.04) break; // ~20 km past the best match
        }
        cursor = best;
        wpDist.push(best * SAMPLE_M);
      }
      const stageEnds = waypoints
        .map((wp, i) => (wp.stageEnd !== undefined ? wpDist[i] : null))
        .filter((d): d is number => d !== null);
      sim.current.stageStarts = [0, ...stageEnds.slice(0, -1).map((d) => d / totalM)];

      // Camera height above the walker: lower over towns and villages, higher over open country.
      const towns = waypoints.map((wp, i) => ({ d: wpDist[i], town: !!wp.label }));
      const rawHeight = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const d = i * SAMPLE_M;
        let nearTown = 0;
        for (const t of towns) if (t.town) nearTown = Math.max(nearTown, 1 - smoothstep(600, 2500, Math.abs(d - t.d)));
        rawHeight[i] = lerp(430, 260, nearTown);
      }
      const camHeight = new Float32Array(count);
      {
        const k = Math.round(1500 / SAMPLE_M);
        let acc = 0;
        for (let i = 0; i < Math.min(count, k); i++) acc += rawHeight[i];
        for (let i = 0; i < count; i++) {
          const a = i - k - 1;
          const b = i + k;
          if (b < count) acc += rawHeight[b];
          if (a >= 0) acc -= rawHeight[a];
          camHeight[i] = acc / (Math.min(count - 1, b) - Math.max(0, a + 1) + 1);
        }
      }

      // Elevation profile for the HUD.
      const PW = 1000;
      const PH = 100;
      const maxM = Math.max(...elev) * 1.1 + 1;
      const stride = Math.max(1, Math.floor(count / 600));
      let path = `M0 ${PH}`;
      for (let i = 0; i < count; i += stride) {
        path += ` L${((i / (count - 1)) * PW).toFixed(1)} ${(PH - (elev[i] / maxM) * PH).toFixed(1)}`;
      }
      path += ` L${PW} ${(PH - (elev[count - 1] / maxM) * PH).toFixed(1)} L${PW} ${PH} Z`;
      setProfile({ path, stageX: stageEnds.slice(0, -1).map((d) => (d / totalM) * PW) });

      // --- Map ------------------------------------------------------------------------
      const line: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: track.points.map(([la, lo]) => [lo, la]) },
      };
      const bounds = new maplibregl.LngLatBounds();
      for (const [la, lo] of track.points) bounds.extend([lo, la]);
      const small = window.innerWidth < 768;

      try {
        maplibregl.setWorkerUrl(`${workerUrl}?v=${maplibregl.getVersion()}`);
        map = new maplibregl.Map({
          container: host!,
          style: buildStyle(flythrough, slug, tileBase, arcgisKey || undefined, meta, line),
          bounds,
          fitBoundsOptions: { padding: 40 },
          interactive: false,
          attributionControl: false,
          maxPitch: 85,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          canvasContextAttributes: { antialias: true },
        });
      } catch {
        setPhase('error');
        return;
      }
      const m = map;
      m.on('error', () => {}); // a missing tile shouldn't spam the console

      const groundAlt = (lngLat: LngLatLike, fallbackMetres: number) =>
        m.queryTerrainElevation(lngLat) ?? fallbackMetres * exaggeration;

      const layer = new PilgrimLayer(
        {
          polygons: (centre, radiusM) => {
            const reach = (radiusM + 1500) / 111000;
            const out: GeoJSON.Position[][][] = [];
            for (const f of m.querySourceFeatures('ofm', {
              sourceLayer: 'landcover',
              filter: ['==', ['get', 'class'], 'wood'],
            })) {
              const g = f.geometry;
              const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
              for (const poly of polys) {
                const ring = poly[0];
                if (ring.some(([x, y]: GeoJSON.Position) => Math.abs(x - centre.lng) < reach * 1.6 && Math.abs(y - centre.lat) < reach)) out.push(poly);
              }
            }
            return out;
          },
          elevation: (ll) => {
            const p = maplibregl.LngLat.convert(ll);
            return groundAlt(p, metresAt(p.lng, p.lat));
          },
        },
        small,
      );

      // Floating labels for named places, pinned to the ground.
      const labelAnchors = waypoints
        .map((wp, i) => ({ wp, i }))
        .filter(({ wp }) => wp.label)
        .map(({ wp, i }) => {
          // MapLibre sets the marker element's own opacity (to dim it behind hills), so fade an inner one.
          const wrapper = document.createElement('div');
          const el = document.createElement('div');
          el.className = `pointer-events-none whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide shadow-sm transition-opacity duration-500 ${
            wp.poi ? 'bg-ochre/90 text-slate-deep' : 'bg-slate-deep/80 text-parchment'
          }`;
          el.textContent = wp.poi ? `\u2726 ${wp.name}` : wp.name;
          el.style.opacity = '0';
          wrapper.appendChild(el);
          const marker = new maplibregl.Marker({ element: wrapper, anchor: 'bottom', offset: [0, -6] })
            .setLngLat([wp.lon, wp.lat])
            .addTo(m);
          markers.push(marker);
          return { el, i, major: wp.stageEnd !== undefined || i === 0, shown: -1 };
        });

      // Overnight stays: pins by the route, shown nearby while following and all at once from above.
      const stayAnchors = (flythrough.stays ?? []).map((stay) => {
        const wrapper = document.createElement('div');
        const el = document.createElement('div');
        el.className =
          'pointer-events-none whitespace-nowrap rounded-md bg-forest/95 px-2.5 py-1 text-[11px] font-medium leading-tight text-white shadow-sm transition-opacity duration-500';
        const title = document.createElement('div');
        title.textContent = `Night ${stay.night} \u00b7 ${stay.name}`;
        el.appendChild(title);
        if (stay.town) {
          const town = document.createElement('div');
          town.className = 'text-[10px] font-normal text-white/80';
          town.textContent = stay.town;
          el.appendChild(town);
        }
        el.style.opacity = '0';
        wrapper.appendChild(el);
        const marker = new maplibregl.Marker({ element: wrapper, anchor: 'bottom', offset: [0, -6] })
          .setLngLat([stay.lon, stay.lat])
          .addTo(m);
        markers.push(marker);
        return { el, lng: stay.lon, lat: stay.lat, shown: -1 };
      });

      await new Promise<void>((resolve) => m.once('load', () => resolve()));
      if (disposed) return;
      m.addLayer(layer);

      // Overview framing, used for the intro and when pulling back.
      const overview: CameraOptions =
        m.cameraForBounds(bounds, { padding: small ? 30 : 70 }) ?? { center: bounds.getCenter(), zoom: 9 };
      const overviewCam = {
        lng: maplibregl.LngLat.convert(overview.center!).lng,
        lat: maplibregl.LngLat.convert(overview.center!).lat,
        zoom: (overview.zoom ?? 9) - 0.35,
        pitch: 38,
        bearing: 0,
        roll: 0,
        elevation: 0,
      };

      // --- Animation ------------------------------------------------------------------
      const cam = { lng: lng[0], lat: lat[0], alt: 0, tLng: lng[0], tLat: lat[0], tAlt: 0, ready: false };
      let roll = 0;
      let smoothAlt: number | null = null;
      let last = performance.now();
      let lastStage = -1;
      let lastPlace = -1;
      let lastNote: number | null = -1;
      let lastKm = -1;
      let lastWalked = -1;
      let lastWalkedAt = 0;
      // Cumulative distance along the original track points, to cut the walked line from them.
      const trackDist = [0];
      for (let k = 1; k < track.points.length; k++) {
        const [la0, lo0] = track.points[k - 1];
        const [la1, lo1] = track.points[k];
        trackDist.push(trackDist[k - 1] + Math.hypot((lo1 - lo0) * 111320 * Math.cos(toRad(la0)), (la1 - la0) * 110574));
      }
      const trackScale = trackDist[trackDist.length - 1] / totalM;
      const walkedSource = m.getSource('walked') as maplibregl.GeoJSONSource;
      let lastTrees = 0;
      let arrivalT = 0;
      let orbitBearing = 0;
      let pause: { wp: number; t: number; bearing: number } | null = null;
      let lastPassed = -1;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const orbitPose = (centreLng: number, centreLat: number, bearingDeg: number, radius: number, height: number) => {
        const ground = groundAlt([centreLng, centreLat], metresAt(centreLng, centreLat));
        const [cLng, cLat] = offset(centreLng, centreLat, -Math.sin(toRad(bearingDeg)) * radius, -Math.cos(toRad(bearingDeg)) * radius);
        return { lng: cLng, lat: cLat, alt: ground + height, tLng: centreLng, tLat: centreLat, tAlt: ground };
      };

      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        const s = sim.current;
        const flying = s.phase === 'flying';

        // Progress, slowed near landmarks and held while circling one.
        let d = s.progress * totalM;
        if (s.playing && flying && s.overview < 0.35 && !pause) {
          let slow = 1;
          for (let p = 0; p < waypoints.length; p++) {
            if (waypoints[p].note) slow = Math.min(slow, 1 - 0.55 * Math.exp(-(((d - wpDist[p]) / 1500) ** 2)));
          }
          s.progress += ((dt / FLIGHT_SECONDS) * s.speed * slow);
          d = s.progress * totalM;
          // Circle a landmark once when walking past it (not after a jump).
          if (!s.jumped && !reduceMotion) {
            for (let p = 0; p < waypoints.length; p++) {
              if (waypoints[p].pause && p !== lastPassed && Math.abs(d - wpDist[p]) < 60) {
                lastPassed = p;
                pause = { wp: p, t: 0, bearing: bearingBetween(railAt(indexAt(d - BACK_M)), railAt(indexAt(d + 600))) };
              }
            }
          }
          s.jumped = false;
          if (s.progress >= 1) {
            s.progress = 1;
            d = totalM;
            s.playing = false;
            setPlaying(false);
            s.phase = 'arrival';
            setPhase('arrival');
          }
        }
        const arriving = s.phase === 'arrival' || s.phase === 'done';
        if (arriving) {
          if (arrivalT === 0) orbitBearing = bearingBetween([cam.lng, cam.lat], [waypoints[waypoints.length - 1].lon, waypoints[waypoints.length - 1].lat]);
          arrivalT += dt;
          if (s.phase === 'arrival' && arrivalT > ARRIVAL_SECONDS) {
            s.phase = 'done';
            setPhase('done');
          }
        } else {
          arrivalT = 0;
        }
        if (pause) {
          pause.t += dt;
          if (pause.t > PAUSE_SECONDS || !flying || !s.playing) pause = null;
        }

        s.overview = s.overviewTarget > s.overview ? Math.min(s.overview + dt / INTRO_SECONDS, 1) : Math.max(s.overview - dt / INTRO_SECONDS, 0);
        const blend = easeInOut(s.overview);

        // Walker.
        // Glide between track samples rather than stepping 25 m at a time.
        const i = indexAt(d);
        const f = Math.min(Math.max(d / SAMPLE_M, 0), count - 1);
        const i0 = Math.min(Math.floor(f), count - 2);
        const t = f - i0;
        const wLng = lerp(lng[i0], lng[i0 + 1], t);
        const wLat = lerp(lat[i0], lat[i0 + 1], t);
        // Ground height jitters as finer terrain tiles load, so ease it (but jump after a seek).
        const rawAlt = groundAlt([wLng, wLat], lerp(elev[i0], elev[i0 + 1], t));
        if (smoothAlt === null || Math.abs(rawAlt - smoothAlt) > 300) smoothAlt = rawAlt;
        else smoothAlt = lerp(smoothAlt, rawAlt, 1 - Math.exp(-dt * 5));
        const wAlt = smoothAlt;
        const back = railAt(indexAt(d - BACK_M));
        const ahead = railAt(indexAt(d + 600));
        const heading = bearingBetween(back, ahead);

        // Follow pose: behind and above the walker along the rail, clear of the ground.
        const [cLng, cLat] = offset(wLng, wLat, -Math.sin(toRad(heading)) * BACK_M, -Math.cos(toRad(heading)) * BACK_M);
        let floor = 0;
        for (let t = 0; t <= 1; t += 0.25) floor = Math.max(floor, metresAt(lerp(cLng, wLng, t), lerp(cLat, wLat, t)));
        const [tLng, tLat] = offset(wLng, wLat, Math.sin(toRad(heading)) * LOOK_M, Math.cos(toRad(heading)) * LOOK_M);
        let pose = {
          lng: cLng,
          lat: cLat,
          alt: Math.max(wAlt + camHeight[i], floor * exaggeration + 140),
          tLng,
          tLat,
          tAlt: wAlt,
        };

        // Landmark circle or arrival circle, eased in and out of the follow pose.
        let circle = 0;
        if (pause) {
          const wp = waypoints[pause.wp];
          const e = smoothstep(0, 1.8, pause.t) * (1 - smoothstep(PAUSE_SECONDS - 1.8, PAUSE_SECONDS, pause.t));
          const o = orbitPose(wp.lon, wp.lat, pause.bearing + pause.t * 11, 650, 300);
          circle = e;
          pose = mixPose(pose, o, e);
        } else if (arriving) {
          const dest = waypoints[waypoints.length - 1];
          orbitBearing += dt * 4.5;
          const o = orbitPose(dest.lon, dest.lat, orbitBearing, flythrough.arrival.radius, flythrough.arrival.height);
          circle = easeInOut(Math.min(arrivalT / 5, 1));
          pose = mixPose(pose, o, circle);
        }

        if (!cam.ready || Math.hypot((pose.lng - cam.lng) * 70000, (pose.lat - cam.lat) * 110000) > 4000) {
          Object.assign(cam, pose, { ready: true });
        } else {
          const k = 1 - Math.exp(-dt * 2.5);
          cam.lng = lerp(cam.lng, pose.lng, k);
          cam.lat = lerp(cam.lat, pose.lat, k);
          cam.alt = lerp(cam.alt, pose.alt, k);
          cam.tLng = lerp(cam.tLng, pose.tLng, k);
          cam.tLat = lerp(cam.tLat, pose.tLat, k);
          cam.tAlt = lerp(cam.tAlt, pose.tAlt, k);
        }

        // Lean gently into bends.
        const turn = wrap180(bearingBetween(railAt(indexAt(d + 300)), railAt(indexAt(d + 900))) - heading);
        const targetRoll = reduceMotion ? 0 : Math.max(-5, Math.min(5, -turn * 0.12)) * (1 - circle);
        roll = lerp(roll, targetRoll, 1 - Math.exp(-dt * 1.5));

        const follow = m.calculateCameraOptionsFromTo(
          new maplibregl.LngLat(cam.lng, cam.lat),
          cam.alt,
          new maplibregl.LngLat(cam.tLng, cam.tLat),
          cam.tAlt,
        );
        const fc = maplibregl.LngLat.convert(follow.center!);
        m.jumpTo({
          center: [lerp(fc.lng, overviewCam.lng, blend), lerp(fc.lat, overviewCam.lat, blend)],
          zoom: lerp(follow.zoom ?? 14, overviewCam.zoom, blend),
          pitch: lerp(follow.pitch ?? 60, overviewCam.pitch, blend),
          bearing: (follow.bearing ?? 0) + wrap180(overviewCam.bearing - (follow.bearing ?? 0)) * blend,
          roll: lerp(roll, 0, blend),
          elevation: lerp(follow.elevation ?? 0, 0, blend),
        });

        // Pilgrim.
        layer.position = new maplibregl.LngLat(wLng, wLat);
        layer.altitude = wAlt;
        layer.heading = toRad(heading);
        const walking = s.playing && flying && s.overview < 0.35 && !pause;
        layer.stride = walking ? dt * 7 * Math.min(s.speed, 2) : 0;
        layer.dt = dt;
        layer.overview = blend;
        if (blend < 0.3 && now - lastTrees > 700) {
          lastTrees = now;
          layer.updateTrees(new maplibregl.LngLat(wLng, wLat));
        }

        // Trail walked so far, ending at the walker.
        if (i !== lastWalked && now - lastWalkedAt > 120) {
          lastWalked = i;
          lastWalkedAt = now;
          const target = d * trackScale;
          let hi = trackDist.findIndex((t) => t > target);
          if (hi < 0) hi = trackDist.length;
          const coords = track.points.slice(0, hi).map(([la, lo]) => [lo, la]);
          coords.push([wLng, wLat]);
          walkedSource.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
        }

        // Labels: nearby places while following, stage ends from the overview.
        for (const a of labelAnchors) {
          const metres = Math.abs(wpDist[a.i] - d);
          const show = blend > 0.5 ? (a.major ? 1 : 0) : metres < 9000 || (arriving && a.i === waypoints.length - 1) ? 1 : 0;
          if (show !== a.shown) {
            a.shown = show;
            a.el.style.opacity = String(show);
          }
        }

        for (const a of stayAnchors) {
          const metres = Math.hypot((a.lng - wLng) * 111320 * Math.cos(toRad(wLat)), (a.lat - wLat) * 110574);
          const show = blend > 0.5 || metres < 6000 ? 1 : 0;
          if (show !== a.shown) {
            a.shown = show;
            a.el.style.opacity = String(show);
          }
        }

        // HUD.
        const km = d / 1000;
        if (Math.round(km) !== lastKm) {
          lastKm = Math.round(km);
          if (kmRef.current) kmRef.current.textContent = formatKm((km * track.km) / (totalM / 1000));
          if (elevRef.current) elevRef.current.textContent = formatKm(elev[i]);
        }
        if (markerRef.current) markerRef.current.setAttribute('transform', `translate(${s.progress * PW} 0)`);
        if (scrubRef.current && document.activeElement !== scrubRef.current) {
          scrubRef.current.value = String(Math.round(s.progress * 1000));
        }
        let stage = stageEnds.findIndex((e) => d <= e + 1);
        if (stage < 0) stage = stageEnds.length - 1;
        if (stage !== lastStage) {
          lastStage = stage;
          setStageIdx(stage);
        }
        let place = 0;
        for (let p = 0; p < waypoints.length; p++) if (wpDist[p] <= d + 400) place = p;
        if (place !== lastPlace) {
          lastPlace = place;
          setPlaceIdx(place);
        }
        let note: number | null = null;
        if (flying) {
          for (let p = 0; p < waypoints.length; p++) {
            if (waypoints[p].note && d >= wpDist[p] - 1500 && d <= wpDist[p] + 4000) note = p;
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
      for (const mk of markers) mk.remove();
      map?.remove();
    };
  }, [assetBase, tileBase, arcgisKey, workerUrl, slug, terrain, waypoints, exaggeration, flythrough]);

  const begin = useCallback(() => {
    if (sim.current.progress >= 1) sim.current.progress = 0;
    sim.current.jumped = true;
    setPhase('flying');
    setPlaying(true);
  }, []);

  const seek = useCallback((value: number) => {
    sim.current.progress = Math.min(Math.max(value, 0), 1);
    sim.current.jumped = true;
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
      if (phase !== 'flying' && phase !== 'done') return;
      // Slower / faster with - and + (or [ and ]).
      if (['Minus', 'NumpadSubtract', 'BracketLeft'].includes(e.code)) {
        setSpeedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (['Equal', 'NumpadAdd', 'BracketRight'].includes(e.code)) {
        setSpeedIdx((i) => Math.min(i + 1, SPEEDS.length - 1));
        return;
      }
      if (e.code !== 'Space') return;
      // Let focused buttons and links handle Space themselves.
      if (e.target instanceof HTMLElement && ['BUTTON', 'A'].includes(e.target.tagName)) return;
      e.preventDefault();
      if (phase === 'done') begin();
      else setPlaying((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin]);

  const stage = stages[stageIdx];
  const place = waypoints[placeIdx];
  const note = noteIdx !== null ? waypoints[noteIdx] : null;
  const destination = waypoints[waypoints.length - 1].name;

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100svh-65px)] min-h-[560px] w-full overflow-hidden"
      style={{ background: HAZE }}
    >
      {/* Explicit size: MapLibre's stylesheet makes its container position: relative. */}
      <div ref={mapHostRef} className="h-full w-full" />

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
              <div
                className="flex shrink-0 items-center overflow-hidden rounded-md border border-slate-deep/20 bg-white/70 text-slate-deep"
                role="group"
                aria-label="Walking speed"
              >
                <button
                  type="button"
                  onClick={() => setSpeedIdx((i) => Math.max(i - 1, 0))}
                  disabled={speedIdx === 0}
                  className="px-2.5 py-1.5 text-sm leading-none hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Slower"
                  title="Slower (−)"
                >
                  &minus;
                </button>
                <span className="min-w-[3.25rem] text-center text-xs font-medium tabular-nums" aria-live="polite">
                  {formatSpeed(SPEEDS[speedIdx])}
                </span>
                <button
                  type="button"
                  onClick={() => setSpeedIdx((i) => Math.min(i + 1, SPEEDS.length - 1))}
                  disabled={speedIdx === SPEEDS.length - 1}
                  className="px-2.5 py-1.5 text-sm leading-none hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Faster"
                  title="Faster (+)"
                >
                  +
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-right text-[10px] text-stone/80">{credits}</p>
          </div>
        </div>
      )}

      {/* Intro / arrival / loading / error overlays */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm uppercase tracking-widest text-slate-deep/70 animate-pulse">Loading the route&hellip;</p>
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
              Follow {formatKm(routeTotalKm)} km of the way across real terrain, from {waypoints[0].name} to {destination}.
            </p>
            <button
              type="button"
              onClick={begin}
              className="mt-6 inline-block rounded-md bg-forest px-8 py-3.5 text-base font-medium text-white hover:bg-forest/90"
            >
              Begin the flythrough
            </button>
            <p className="mt-4 text-[11px] text-stone/80">
              {credits}. Heights exaggerated {exaggeration}&times;.
            </p>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div className="absolute left-4 right-4 top-4 sm:left-8 sm:right-auto sm:top-24">
          <div className="sm:max-w-sm rounded-xl bg-parchment/90 p-5 sm:p-6 shadow-xl backdrop-blur-sm animate-[fadeUp_0.6s_ease-out]">
            <p className="text-xs font-medium uppercase tracking-widest text-ochre">Journey&rsquo;s end</p>
            <h2 className="mt-2 font-display text-3xl text-slate-deep">{destination}</h2>
            <p className="mt-2 text-sm text-stone leading-relaxed">
              {formatKm(routeTotalKm)} km on foot. We book every bed and carry your bags; you just walk.
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

type Pose = { lng: number; lat: number; alt: number; tLng: number; tLat: number; tAlt: number };

function mixPose(a: Pose, b: Pose, t: number): Pose {
  return {
    lng: lerp(a.lng, b.lng, t),
    lat: lerp(a.lat, b.lat, t),
    alt: lerp(a.alt, b.alt, t),
    tLng: lerp(a.tLng, b.tLng, t),
    tLat: lerp(a.tLat, b.tLat, t),
    tAlt: lerp(a.tAlt, b.tAlt, t),
  };
}
