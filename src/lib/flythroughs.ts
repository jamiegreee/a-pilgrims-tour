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
}

export interface Flythrough {
  /** Name of the baked heightfield in /public/terrain (see scripts/bake-terrain.mjs). */
  terrain: string;
  /** Total walking distance used to scale the on-screen kilometre counter. */
  routeKm: number;
  /** Vertical exaggeration applied to the real elevations. */
  exaggeration: number;
  waypoints: FlythroughWaypoint[];
}

export const flythroughs: Record<string, Flythrough> = {
  'camino-de-santiago': {
    terrain: 'camino-de-santiago',
    routeKm: 790,
    exaggeration: 2,
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
      { name: 'Cruz de Ferro', lat: 42.489, lon: -6.361, label: true, note: 'The iron cross at about 1,500 m, near the highest point of the route. Pilgrims leave a stone carried from home.' },
      { name: 'Molinaseca', lat: 42.538, lon: -6.519 },
      { name: 'Ponferrada', lat: 42.546, lon: -6.590, label: true, note: 'El Bierzo, guarded by the Templar castle of Ponferrada.' },
      { name: 'Villafranca del Bierzo', lat: 42.606, lon: -6.811 },
      { name: 'O Cebreiro', lat: 42.708, lon: -7.043, label: true, note: 'The climb into Galicia, to a hilltop village of thatched pallozas at about 1,300 m.' },
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
};

export const flythroughSlugs = Object.keys(flythroughs);
