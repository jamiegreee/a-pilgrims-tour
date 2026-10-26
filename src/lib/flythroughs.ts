export interface FlythroughWaypoint {
  name: string;
  lat: number;
  lon: number;
  /** Shown as a floating label in the scene. */
  label?: boolean;
  /** Index into the route's `stages` array for the stage that ends here. */
  stageEnd?: number;
  /** Short caption shown while the camera passes. */
  note?: string;
  /** Slow down and circle this landmark briefly while flying past. */
  pause?: boolean;
}

/**
 * Where the imagery comes from:
 * - `iberia`: Spain's PNOA and France's IGN aerial photography, free with credit.
 * - `britain`: Esri World Imagery when NEXT_PUBLIC_ARCGIS_API_KEY is set, otherwise the
 *   Sentinel-2 tiles baked by scripts/bake-imagery-xyz.py.
 */
export type FlythroughImagery = 'iberia' | 'britain';

export interface Flythrough {
  /** Name of the baked heightfield and track in /public/terrain (see scripts/bake-terrain.mjs). */
  terrain: string;
  /** Distance shown until the real track has loaded. */
  routeKm: number;
  /** Vertical exaggeration applied to the real elevations. */
  exaggeration: number;
  imagery: FlythroughImagery;
  /** Credit for the elevation data. */
  terrainCredit: string;
  /** Radius and height, in metres, of the closing circle over the destination. */
  arrival: { radius: number; height: number };
  waypoints: FlythroughWaypoint[];
}

export const flythroughs: Record<string, Flythrough> = {
  'camino-de-santiago': {
    terrain: 'camino-de-santiago',
    routeKm: 790,
    exaggeration: 1.4,
    imagery: 'iberia',
    terrainCredit: 'Mapzen Terrain Tiles',
    arrival: { radius: 700, height: 380 },
    waypoints: [
      { name: 'Saint-Jean-Pied-de-Port', lat: 43.163, lon: -1.238, label: true, note: 'The last French town before the climb. Pilgrims collect their credential here.' },
      { name: 'Orisson', lat: 43.111, lon: -1.237 },
      { name: 'Roncesvalles', lat: 43.009, lon: -1.319, label: true, note: 'Over the Pyrenees: roughly 1,250 m of climbing on the first day.' },
      { name: 'Zubiri', lat: 42.930, lon: -1.503 },
      { name: 'Pamplona', lat: 42.818, lon: -1.644, label: true, stageEnd: 0 },
      { name: 'Puente la Reina', lat: 42.672, lon: -1.815, label: true },
      { name: 'Estella', lat: 42.671, lon: -2.032 },
      { name: 'Los Arcos', lat: 42.569, lon: -2.192 },
      { name: 'Logroño', lat: 42.465, lon: -2.445, label: true, note: 'Into La Rioja and the wine country of the Ebro valley.' },
      { name: 'Nájera', lat: 42.416, lon: -2.733 },
      { name: 'Santo Domingo de la Calzada', lat: 42.441, lon: -2.953, label: true },
      { name: 'Belorado', lat: 42.420, lon: -3.190 },
      { name: 'San Juan de Ortega', lat: 42.376, lon: -3.437 },
      { name: 'Burgos', lat: 42.341, lon: -3.704, label: true, stageEnd: 1 },
      { name: 'Hontanas', lat: 42.312, lon: -4.045 },
      { name: 'Castrojeriz', lat: 42.288, lon: -4.138, label: true, note: 'The Meseta: a high plateau at 800–900 m, flat for days.' },
      { name: 'Frómista', lat: 42.267, lon: -4.406 },
      { name: 'Carrión de los Condes', lat: 42.338, lon: -4.603, label: true },
      { name: 'Sahagún', lat: 42.371, lon: -5.030, label: true, note: 'The traditional halfway point of the Camino Francés.' },
      { name: 'El Burgo Ranero', lat: 42.423, lon: -5.221 },
      { name: 'Mansilla de las Mulas', lat: 42.498, lon: -5.417 },
      { name: 'León', lat: 42.599, lon: -5.567, label: true, stageEnd: 2 },
      { name: 'Hospital de Órbigo', lat: 42.463, lon: -5.880 },
      { name: 'Astorga', lat: 42.457, lon: -6.055, label: true },
      { name: 'Rabanal del Camino', lat: 42.481, lon: -6.284 },
      { name: 'Cruz de Ferro', lat: 42.489, lon: -6.361, label: true, pause: true, note: 'The iron cross at about 1,500 m, near the highest point of the route. Pilgrims leave a stone carried from home.' },
      { name: 'Molinaseca', lat: 42.538, lon: -6.519 },
      { name: 'Ponferrada', lat: 42.546, lon: -6.590, label: true, note: 'El Bierzo, guarded by the Templar castle of Ponferrada.' },
      { name: 'Villafranca del Bierzo', lat: 42.606, lon: -6.811 },
      { name: 'O Cebreiro', lat: 42.708, lon: -7.043, label: true, pause: true, note: 'The climb into Galicia, to a hilltop village of thatched pallozas at about 1,300 m.' },
      { name: 'Triacastela', lat: 42.756, lon: -7.240 },
      { name: 'Sarria', lat: 42.781, lon: -7.414, label: true, stageEnd: 3, note: 'About 115 km from Santiago: the most popular start for pilgrims walking the minimum 100 km needed for the Compostela.' },
      { name: 'Portomarín', lat: 42.807, lon: -7.616, label: true },
      { name: 'Palas de Rei', lat: 42.873, lon: -7.869 },
      { name: 'Melide', lat: 42.914, lon: -8.015, label: true },
      { name: 'Arzúa', lat: 42.927, lon: -8.164 },
      { name: 'O Pedrouzo', lat: 42.905, lon: -8.360 },
      { name: 'Monte do Gozo', lat: 42.887, lon: -8.495, note: 'The Hill of Joy, where pilgrims catch their first sight of the cathedral spires.' },
      { name: 'Santiago de Compostela', lat: 42.8806, lon: -8.5446, label: true, stageEnd: 4 },
    ],
  },
  'the-pilgrims-way': {
    terrain: 'the-pilgrims-way',
    routeKm: 190,
    exaggeration: 1.8,
    imagery: 'britain',
    terrainCredit: 'Mapzen Terrain Tiles, including Environment Agency LiDAR (OGL)',
    arrival: { radius: 450, height: 230 },
    waypoints: [
      { name: 'Winchester Cathedral', lat: 51.0606, lon: -1.313, label: true, note: 'Once home to the shrine of St Swithun. The walk begins at its west door.' },
      { name: 'New Alresford', lat: 51.0897, lon: -1.1616 },
      { name: 'Alton', lat: 51.1496, lon: -0.9737, label: true },
      { name: 'Farnham', lat: 51.2148, lon: -0.799, label: true, stageEnd: 0, note: 'Farnham Castle, seat of the Bishops of Winchester for some 800 years.' },
      { name: 'Puttenham', lat: 51.2225, lon: -0.672 },
      { name: 'Guildford', lat: 51.2265, lon: -0.576, label: true, stageEnd: 1 },
      { name: 'St Martha\u2019s Hill', lat: 51.2216, lon: -0.525, label: true, pause: true, note: 'St Martha-on-the-Hill, a chapel high on the pilgrim road above Guildford.' },
      { name: 'Box Hill', lat: 51.2537, lon: -0.31, label: true, note: 'The North Downs at their most famous: a chalk escarpment above the Weald.' },
      { name: 'Reigate Hill', lat: 51.26, lon: -0.205 },
      { name: 'Oxted Downs', lat: 51.276, lon: -0.01 },
      { name: 'Otford, near Sevenoaks', lat: 51.312, lon: 0.188, label: true, stageEnd: 2 },
      { name: 'Kemsing', lat: 51.304, lon: 0.237 },
      { name: 'Wrotham', lat: 51.31, lon: 0.31 },
      { name: 'Medway crossing', lat: 51.371, lon: 0.483 },
      { name: 'Kit\u2019s Coty House', lat: 51.3185, lon: 0.503, label: true, pause: true, note: 'A Neolithic burial chamber, more than 5,000 years old, beside the old track.' },
      { name: 'Detling', lat: 51.294, lon: 0.573 },
      { name: 'Hollingbourne', lat: 51.265, lon: 0.642 },
      { name: 'Charing', lat: 51.212, lon: 0.794, label: true },
      { name: 'Boughton Lees', lat: 51.189, lon: 0.883 },
      { name: 'Chilham', lat: 51.245, lon: 0.962, label: true, stageEnd: 3, pause: true, note: 'A medieval village square between the castle and the church.' },
      { name: 'Canterbury Cathedral', lat: 51.2798, lon: 1.0828, label: true, stageEnd: 4, note: 'Where Thomas Becket was murdered in 1170. His shrine drew pilgrims for more than three centuries.' },
    ],
  },
};

export const flythroughSlugs = Object.keys(flythroughs);
