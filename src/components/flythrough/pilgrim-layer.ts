import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import { createPilgrim, type Pilgrim } from './pilgrim';

// A MapLibre custom layer drawn with three.js: the walking pilgrim and, around it, low-poly
// trees scattered over OpenStreetMap woodland. Everything is placed in metres around a local
// origin that follows the walker, which keeps float precision at street scale.
//
// Local axes: x east, y up, z south (metres).

const PILGRIM_METRES = 22; // drawn larger than life so it reads from the air
const TREE_SPACING_M = 24;

export interface WoodlandSource {
  /** Woodland polygons in lng/lat currently available near `centre`. */
  polygons: (centre: maplibregl.LngLat, radiusM: number) => GeoJSON.Position[][][];
  /** Ground height in metres at a point (already exaggerated, like the terrain mesh). */
  elevation: (lngLat: maplibregl.LngLatLike) => number;
}

export class PilgrimLayer implements CustomLayerInterface {
  readonly id = 'pilgrim';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;

  private map?: MapLibreMap;
  private renderer?: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly pilgrim: Pilgrim = createPilgrim();
  private readonly walker = new THREE.Group();
  private readonly halo: THREE.Mesh;
  private readonly trees = new THREE.Group();
  private crowns?: THREE.InstancedMesh;
  private trunks?: THREE.InstancedMesh;
  private treeOrigin = new maplibregl.MercatorCoordinate(0, 0, 0);
  private origin = new maplibregl.MercatorCoordinate(0, 0, 0);
  private lastTreeCentre: maplibregl.LngLat | null = null;
  private readonly maxTrees: number;
  private readonly treeRadiusM: number;

  /** Walker position and heading (radians clockwise from north), set by the flythrough each frame. */
  position = new maplibregl.LngLat(0, 0);
  altitude = 0;
  heading = 0;
  stride = 0;
  dt = 0;
  /** 0..1: how far the camera has pulled back to the overview; enlarges the marker. */
  overview = 0;

  constructor(
    private readonly woodland: WoodlandSource | null,
    small: boolean,
  ) {
    this.maxTrees = small ? 3000 : 9000;
    this.treeRadiusM = small ? 1400 : 2200;
    this.pilgrim.group.scale.setScalar(PILGRIM_METRES);
    this.walker.add(this.pilgrim.group);
    this.halo = new THREE.Mesh(
      new THREE.RingGeometry(PILGRIM_METRES * 0.35, PILGRIM_METRES * 0.5, 40),
      new THREE.MeshBasicMaterial({ color: '#d9a441', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.halo.rotation.x = -Math.PI / 2;
    this.halo.position.y = 0.5;
    this.walker.add(this.halo);
    this.scene.add(this.walker, this.trees);

    this.scene.add(new THREE.HemisphereLight('#f4efe6', '#5b5546', 1.6));
    const sun = new THREE.DirectionalLight('#fff3dd', 2.2);
    sun.position.set(-0.4, 0.8, 0.45);
    this.scene.add(sun);
  }

  onAdd(map: MapLibreMap, gl: WebGL2RenderingContext) {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
  }

  onRemove() {
    this.pilgrim.dispose();
    this.halo.geometry.dispose();
    (this.halo.material as THREE.Material).dispose();
    this.disposeTrees();
    // The GL context belongs to MapLibre, so don't dispose the renderer's context.
  }

  render(_gl: WebGL2RenderingContext, options: CustomRenderMethodInput) {
    if (!this.renderer || !this.map) return;
    this.origin = maplibregl.MercatorCoordinate.fromLngLat(this.position, this.altitude);
    const s = this.origin.meterInMercatorCoordinateUnits();

    // Walk cycle, heading and overview marker size.
    const dir = new THREE.Vector3(Math.sin(this.heading), 0, -Math.cos(this.heading));
    this.pilgrim.update(this.stride, dir, this.dt);
    this.halo.scale.setScalar(1 + Math.sin(performance.now() / 300) * 0.15);
    this.walker.scale.setScalar(1 + this.overview * 30);

    if (this.crowns) {
      this.trees.visible = this.overview < 0.3;
      this.trees.position.set(
        (this.treeOrigin.x - this.origin.x) / s,
        (this.treeOrigin.z - this.origin.z) / s,
        (this.treeOrigin.y - this.origin.y) / s,
      );
    }

    const local = new THREE.Matrix4()
      .makeTranslation(this.origin.x, this.origin.y, this.origin.z)
      .scale(new THREE.Vector3(s, -s, s))
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    // mainMatrix projects mercator coordinates (0..1) to clip space, matching `local` above.
    this.camera.projectionMatrix = new THREE.Matrix4()
      .fromArray(options.defaultProjectionData.mainMatrix as unknown as number[])
      .multiply(local);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }

  /** Re-scatter trees when the walker has moved far enough. Call a few times a second. */
  updateTrees(centre: maplibregl.LngLat) {
    if (!this.woodland) return;
    if (this.lastTreeCentre && this.lastTreeCentre.distanceTo(centre) < this.treeRadiusM * 0.3) return;
    const polygons = this.woodland.polygons(centre, this.treeRadiusM);
    if (!polygons.length) return;
    this.lastTreeCentre = centre;

    const lat0 = centre.lat;
    const mPerLat = 110574;
    const mPerLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const toLocal = (p: GeoJSON.Position) => [(p[0] - centre.lng) * mPerLon, -(p[1] - centre.lat) * mPerLat];
    const r2 = this.treeRadiusM ** 2;
    const points: [number, number][] = [];
    const seen = new Set<string>();

    for (const poly of polygons) {
      const rings = poly.map((ring) => ring.map(toLocal));
      let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
      for (const [x, z] of rings[0]) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
      // A global grid (anchored to whole metres of lng/lat) so trees keep their places between updates.
      const gx0 = Math.floor((minX + centre.lng * mPerLon) / TREE_SPACING_M);
      const gz0 = Math.floor((minZ - centre.lat * mPerLat) / TREE_SPACING_M);
      const gx1 = Math.ceil((maxX + centre.lng * mPerLon) / TREE_SPACING_M);
      const gz1 = Math.ceil((maxZ - centre.lat * mPerLat) / TREE_SPACING_M);
      for (let gz = gz0; gz <= gz1 && points.length < this.maxTrees; gz++) {
        for (let gx = gx0; gx <= gx1 && points.length < this.maxTrees; gx++) {
          const key = `${gx},${gz}`;
          if (seen.has(key)) continue;
          const h = hash(gx, gz);
          const x = (gx + h) * TREE_SPACING_M - centre.lng * mPerLon;
          const z = (gz + hash(gz, gx)) * TREE_SPACING_M + centre.lat * mPerLat;
          if (x * x + z * z > r2 || !inPolygon(x, z, rings)) continue;
          seen.add(key);
          points.push([x, z]);
        }
      }
    }
    this.buildTrees(centre, points, mPerLon, mPerLat);
  }

  private buildTrees(centre: maplibregl.LngLat, points: [number, number][], mPerLon: number, mPerLat: number) {
    this.disposeTrees();
    if (!points.length || !this.woodland) return;
    const crownGeo = new THREE.ConeGeometry(4.5, 11, 6);
    crownGeo.translate(0, 9.5, 0);
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 5);
    trunkGeo.translate(0, 2.5, 0);
    const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), points.length);
    const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: '#5a4632' }), points.length);
    const originAlt = this.woodland.elevation(centre);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const shades = ['#3f5a32', '#4a6a3a', '#38502e', '#56703f', '#445f36'].map((c) => new THREE.Color(c));
    points.forEach(([x, z], i) => {
      const lngLat = new maplibregl.LngLat(centre.lng + x / mPerLon, centre.lat - z / mPerLat);
      const y = this.woodland!.elevation(lngLat) - originAlt;
      const h = hash(i, points.length);
      const scale = 0.7 + h * 0.8;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h * Math.PI * 2);
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(scale, scale * (0.85 + h * 0.4), scale));
      crowns.setMatrixAt(i, m);
      trunks.setMatrixAt(i, m);
      crowns.setColorAt(i, shades[Math.floor(h * shades.length) % shades.length]);
    });
    this.crowns = crowns;
    this.trunks = trunks;
    this.trees.add(crowns, trunks);
    this.treeOrigin = maplibregl.MercatorCoordinate.fromLngLat(centre, originAlt);
  }

  private disposeTrees() {
    for (const mesh of [this.crowns, this.trunks]) {
      if (!mesh) continue;
      this.trees.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    }
    this.crowns = this.trunks = undefined;
  }
}

function hash(a: number, b: number) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Even-odd test against a polygon with holes, in local metres. */
function inPolygon(x: number, z: number, rings: number[][][]) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i];
      const [xj, zj] = ring[j];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
  }
  return inside;
}
