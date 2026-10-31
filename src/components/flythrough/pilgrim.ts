import * as THREE from 'three';

// A low-poly walking pilgrim: brimmed hat, pack with a scallop shell, and a staff.
// Built at roughly 1 unit tall, facing +Z; the scene scales it up so it reads from the air.

const SKIN = '#d9ab8a';
const JACKET = '#5C6B54';
const TROUSERS = '#2B3340';
const BOOTS = '#3d3227';
const PACK = '#8a6a48';
const STRAW = '#d8bf8a';
const SHELL = '#f2d27a';
const STAFF = '#6b4f33';

export interface Pilgrim {
  group: THREE.Group;
  /** Advance the walk cycle by `stride` (0 when standing still) and face along `dir`. */
  update: (stride: number, dir: THREE.Vector3, dt: number) => void;
  dispose: () => void;
}

export function createPilgrim(): Pilgrim {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const geos: THREE.BufferGeometry[] = [];
  const mats = new Map<string, THREE.MeshLambertMaterial>();
  const mat = (color: string) => {
    if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color }));
    return mats.get(color)!;
  };
  const mesh = (geo: THREE.BufferGeometry, color: string, parent: THREE.Object3D) => {
    geos.push(geo);
    const m = new THREE.Mesh(geo, mat(color));
    parent.add(m);
    return m;
  };

  // Legs pivot at the hip so they can swing.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.07, 0.46, 0);
    body.add(hip);
    mesh(new THREE.CapsuleGeometry(0.055, 0.3, 4, 8), TROUSERS, hip).position.y = -0.2;
    const boot = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.17), BOOTS, hip);
    boot.position.set(0, -0.42, 0.03);
    return hip;
  });

  const torso = mesh(new THREE.CapsuleGeometry(0.13, 0.22, 4, 10), JACKET, body);
  torso.position.y = 0.66;

  const head = mesh(new THREE.SphereGeometry(0.095, 14, 10), SKIN, body);
  head.position.y = 0.92;
  const brim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 20), STRAW, body);
  brim.position.y = 0.97;
  const crown = mesh(new THREE.CylinderGeometry(0.07, 0.095, 0.08, 16), STRAW, body);
  crown.position.y = 1.02;

  const pack = mesh(new THREE.BoxGeometry(0.24, 0.3, 0.14), PACK, body);
  pack.position.set(0, 0.68, -0.15);
  const roll = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 10), '#a88a58', body);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0.86, -0.15);
  // The scallop shell every Camino pilgrim carries, as a fan of ribs.
  const shell = new THREE.Group();
  shell.position.set(0, 0.68, -0.225);
  shell.rotation.y = Math.PI;
  body.add(shell);
  const shellGeo = new THREE.CircleGeometry(0.075, 12, Math.PI * 0.1, Math.PI * 0.8);
  mesh(shellGeo, SHELL, shell).position.y = -0.03;

  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.17, 0.78, 0);
    body.add(shoulder);
    mesh(new THREE.CapsuleGeometry(0.04, 0.26, 4, 8), JACKET, shoulder).position.y = -0.15;
    mesh(new THREE.SphereGeometry(0.04, 8, 6), SKIN, shoulder).position.y = -0.32;
    return shoulder;
  });

  // Staff held in the right hand.
  const staff = mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.15, 6), STAFF, arms[1]);
  staff.position.set(0.02, -0.12, 0.05);
  const gourd = mesh(new THREE.SphereGeometry(0.035, 8, 6), '#c98c3e', arms[1]);
  gourd.position.set(0.05, 0.25, 0.05);

  // Soft contact shadow so the figure sits on the ground.
  const shadowGeo = new THREE.CircleGeometry(0.28, 24);
  geos.push(shadowGeo);
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#1d2228', transparent: true, opacity: 0.35, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  let phase = 0;
  let swing = 0;
  let heading = 0;

  const update = (stride: number, dir: THREE.Vector3, dt: number) => {
    phase += stride;
    // Ease in and out of the walk so pausing doesn't freeze mid-step.
    swing += ((stride > 0 ? 1 : 0) - swing) * Math.min(dt * 6, 1);
    const s = Math.sin(phase) * swing;
    legs[0].rotation.x = s * 0.55;
    legs[1].rotation.x = -s * 0.55;
    arms[0].rotation.x = -s * 0.45;
    arms[1].rotation.x = s * 0.3 - 0.25 * swing;
    body.position.y = Math.abs(Math.cos(phase)) * 0.03 * swing;
    body.rotation.x = 0.06 * swing;

    const target = Math.atan2(dir.x, dir.z);
    let delta = target - heading;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    heading += delta * Math.min(dt * 4, 1);
    group.rotation.y = heading;
  };

  const dispose = () => {
    for (const g of geos) g.dispose();
    for (const m of mats.values()) m.dispose();
    shadowMat.dispose();
  };

  return { group, update, dispose };
}
