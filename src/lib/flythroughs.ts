import type { PlanId } from '@/lib/plans';

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
  /** A landmark rather than a town: labelled in the accent colour. */
  poi?: boolean;
  /** Not on foot (an island reached by boat): labelled, but the walking track stops short of it. */
  offTrack?: boolean;
}

/**
 * An overnight stay we book for pilgrims, shown in the flythrough as a pin by the route.
 * Only plans listed in `plans` see it (the free plan sees none), so a route can carry stays
 * for Walk Light and Guided Pilgrimage without showing them to everyone.
 */
export interface FlythroughStay {
  name: string;
  lat: number;
  lon: number;
  /** Which night of the pilgrimage this is, from 1. */
  night: number;
  /** Town or village, shown under the name. */
  town?: string;
  url?: string;
  plans: PlanId[];
}

/**
 * Where the imagery comes from:
 * - `iberia`: Spain's PNOA and France's IGN aerial photography, free with credit.
 * - `britain`: Esri World Imagery when NEXT_PUBLIC_ARCGIS_API_KEY is set, otherwise the
 *   Sentinel-2 tiles baked by scripts/bake-imagery-xyz.py (see `bakedTiles`).
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
  /** Has a Sentinel-2 tile pyramid baked by scripts/bake-imagery-xyz.py, used when there is no
   *  Esri key. Without one (and without a key) the map falls back to shaded relief. */
  bakedTiles?: boolean;
  /** Credit for the elevation data. */
  terrainCredit: string;
  /** Radius and height, in metres, of the closing circle over the destination. */
  arrival: { radius: number; height: number };
  waypoints: FlythroughWaypoint[];
  /** Overnight stays along the route, in walking order. */
  stays?: FlythroughStay[];
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
    bakedTiles: true,
    terrainCredit: 'Mapzen Terrain Tiles, including Environment Agency LiDAR (OGL)',
    arrival: { radius: 450, height: 230 },
    waypoints: [
      { name: 'Winchester Cathedral', lat: 51.0606, lon: -1.313, label: true, note: 'Once home to the shrine of St Swithun. The walk begins at its west door.' },
      { name: 'New Alresford', lat: 51.0897, lon: -1.1616, label: true, note: 'A Georgian market town, home of the Watercress Line heritage railway.' },
      { name: 'Jane Austen\u2019s House, Chawton', lat: 51.1334, lon: -0.9878, label: true, poi: true, pause: true, note: 'Jane Austen spent the last eight years of her life here, writing or revising all six of her novels.' },
      { name: 'Alton', lat: 51.1496, lon: -0.9737, label: true },
      { name: 'Farnham', lat: 51.2148, lon: -0.799, label: true, stageEnd: 0, note: 'Farnham Castle, seat of the Bishops of Winchester for some 800 years.' },
      { name: 'Puttenham', lat: 51.2225, lon: -0.672 },
      { name: 'Watts Chapel, Compton', lat: 51.22, lon: -0.631, label: true, poi: true, note: 'An Arts and Crafts chapel designed by Mary Watts and decorated by the people of Compton.' },
      { name: 'Guildford', lat: 51.2265, lon: -0.576, label: true, stageEnd: 1, note: 'The old pilgrim crossing of the River Wey, below the ruined St Catherine\u2019s Chapel.' },
      { name: 'St Martha\u2019s Hill', lat: 51.2216, lon: -0.525, label: true, poi: true, pause: true, note: 'St Martha-on-the-Hill, a chapel high on the pilgrim road above Guildford.' },
      { name: 'Newlands Corner', lat: 51.2333, lon: -0.508, label: true, poi: true, note: 'One of the great viewpoints of the North Downs, looking south over the Weald.' },
      { name: 'Stepping stones, River Mole', lat: 51.2497, lon: -0.3233, label: true, poi: true, note: 'Stepping stones across the River Mole at the foot of Box Hill.' },
      { name: 'Box Hill', lat: 51.2537, lon: -0.31, label: true, note: 'The North Downs at their most famous: a chalk escarpment above the Weald.' },
      { name: 'Reigate Hill', lat: 51.26, lon: -0.205 },
      { name: 'Oxted Downs', lat: 51.276, lon: -0.01 },
      { name: 'Otford, near Sevenoaks', lat: 51.312, lon: 0.188, label: true, stageEnd: 2, note: 'The ruins of Otford Palace, once among the grandest houses of the archbishops of Canterbury.' },
      { name: 'St Edith\u2019s Well, Kemsing', lat: 51.3045, lon: 0.2356, label: true, poi: true, note: 'A holy well dedicated to St Edith, said to have been born in the village.' },
      { name: 'Wrotham', lat: 51.31, lon: 0.31 },
      { name: 'Medway crossing', lat: 51.371, lon: 0.483 },
      { name: 'Kit\u2019s Coty House', lat: 51.3185, lon: 0.503, label: true, poi: true, pause: true, note: 'A Neolithic burial chamber, more than 5,000 years old, beside the old track.' },
      { name: 'Detling', lat: 51.294, lon: 0.573 },
      { name: 'Hollingbourne', lat: 51.265, lon: 0.642 },
      { name: 'Charing', lat: 51.212, lon: 0.794, label: true, note: 'The ruined palace where archbishops broke their journey to Canterbury.' },
      { name: 'Boughton Lees', lat: 51.189, lon: 0.883, note: 'The North Downs Way divides here: the pilgrims\u2019 branch turns north for Canterbury.' },
      { name: 'Chilham', lat: 51.245, lon: 0.962, label: true, stageEnd: 3, pause: true, note: 'A medieval village square between the castle and the church.' },
      { name: 'Harbledown', lat: 51.2836, lon: 1.0573, label: true, poi: true, note: 'The last halt before Canterbury, with a hospital founded around 1084. Chaucer\u2019s pilgrims pass this way near the end of the Tales.' },
      { name: 'Canterbury Cathedral', lat: 51.2798, lon: 1.0828, label: true, stageEnd: 4, note: 'Where Thomas Becket was murdered in 1170. His shrine drew pilgrims for more than three centuries.' },
    ],
  },
  'st-cuthberts-way': {
    terrain: 'st-cuthberts-way',
    routeKm: 100,
    exaggeration: 1.6,
    imagery: 'britain',
    terrainCredit: 'Mapzen Terrain Tiles',
    arrival: { radius: 650, height: 320 },
    waypoints: [
      { name: 'Melrose Abbey', lat: 55.5995, lon: -2.7182, label: true, note: 'The walk begins at the abbey ruins. Cuthbert entered the monastery at nearby Old Melrose around 651.' },
      { name: 'Eildon Hills', lat: 55.5872, lon: -2.7083, label: true, poi: true, pause: true, note: 'The three Eildon summits. The Romans named their fort below them Trimontium, “three hills”.' },
      { name: 'Bowden', lat: 55.5665, lon: -2.7084 },
      { name: 'Newtown St Boswells', lat: 55.577, lon: -2.6723 },
      { name: 'Dryburgh Abbey', lat: 55.5772, lon: -2.6503, label: true, poi: true, note: 'Across the Tweed: the ruined abbey where Sir Walter Scott is buried.' },
      { name: 'St Boswells', lat: 55.5713, lon: -2.6431 },
      { name: 'Maxton', lat: 55.5636, lon: -2.6145, label: true, stageEnd: 0 },
      { name: 'Lilliard’s Stone', lat: 55.5397, lon: -2.6043, label: true, poi: true, note: 'On Dere Street, the Roman road north. It marks the Battle of Ancrum Moor in 1545.' },
      { name: 'Harestanes', lat: 55.5127, lon: -2.5699 },
      { name: 'Cessford Castle', lat: 55.5077, lon: -2.4163, label: true, poi: true, note: 'The ruined tower of the Kers of Cessford, a power in the Borders for centuries.' },
      { name: 'Morebattle', lat: 55.5174, lon: -2.3637, label: true, stageEnd: 1 },
      { name: 'Wideopen Hill', lat: 55.5123, lon: -2.3211, label: true, poi: true, pause: true, note: 'At 368 m, the highest point of the Way and roughly its halfway mark.' },
      { name: 'Kirk Yetholm', lat: 55.5473, lon: -2.2756, label: true, stageEnd: 2, note: 'The northern end of the Pennine Way. Over the hills ahead lies England.' },
      { name: 'Hethpool', lat: 55.5483, lon: -2.1676 },
      { name: 'Wooler', lat: 55.5459, lon: -2.0148, label: true, stageEnd: 3 },
      { name: 'Weetwood Bridge', lat: 55.559, lon: -1.9725 },
      { name: 'East Horton', lat: 55.5723, lon: -1.9555 },
      { name: 'St Cuthbert’s Cave', lat: 55.61, lon: -1.9074, label: true, poi: true, pause: true, note: 'By tradition, the monks carrying Cuthbert’s body sheltered under this sandstone overhang after fleeing Lindisfarne.' },
      { name: 'Fenwick', lat: 55.6542, lon: -1.8964 },
      { name: 'Holy Island causeway', lat: 55.6791, lon: -1.8659, label: true, poi: true, note: 'Passable only around low tide. Walkers can take the older Pilgrims’ Path across the sands, marked by poles.' },
      { name: 'Lindisfarne Priory', lat: 55.6691, lon: -1.8009, label: true, stageEnd: 4, note: 'Founded by St Aidan in 635. Cuthbert was bishop here and was buried on the island in 687.' },
    ],
  },
  'st-michaels-way': {
    terrain: 'st-michaels-way',
    routeKm: 20,
    exaggeration: 1.8,
    imagery: 'britain',
    terrainCredit: 'Mapzen Terrain Tiles, including Environment Agency LiDAR (OGL)',
    arrival: { radius: 420, height: 220 },
    waypoints: [
      { name: 'St Uny’s Church, Lelant', lat: 50.1887, lon: -5.4362, label: true, note: 'The walk starts at the church by the Hayle estuary, a landing place for pilgrims from Ireland and Wales.' },
      { name: 'Carbis Bay', lat: 50.1971, lon: -5.4637, label: true },
      { name: 'Knill’s Steeple', lat: 50.1958, lon: -5.4814, label: true, poi: true, note: 'A granite pyramid built in 1782 by John Knill, a mayor of St Ives.' },
      { name: 'Trencrom Hill', lat: 50.1746, lon: -5.4777, label: true, poi: true, pause: true, note: 'An Iron Age hillfort. From the top you can see both the north and south coasts of Cornwall.' },
      { name: 'Ludgvan', lat: 50.1447, lon: -5.4932, label: true, stageEnd: 0 },
      { name: 'Marazion', lat: 50.1239, lon: -5.4728, label: true, note: 'An ancient market town on the shore of Mount’s Bay.' },
      { name: 'St Michael’s Mount', lat: 50.1184, lon: -5.4776, label: true, stageEnd: 1, note: 'A tidal island reached on foot by a causeway at low tide. Monks of Mont-Saint-Michel held it in the Middle Ages.' },
    ],
  },
  'north-wales-pilgrims-way': {
    terrain: 'north-wales-pilgrims-way',
    routeKm: 217,
    exaggeration: 1.5,
    imagery: 'britain',
    terrainCredit: 'Mapzen Terrain Tiles',
    arrival: { radius: 1700, height: 650 },
    waypoints: [
      { name: 'Basingwerk Abbey', lat: 53.288, lon: -3.2075, label: true, note: 'The ruins of a 12th-century abbey, where the Way begins.' },
      { name: 'St Winefride’s Well', lat: 53.2772, lon: -3.2236, label: true, poi: true, pause: true, note: 'A holy well visited by pilgrims since the 7th century, called the “Lourdes of Wales”.' },
      { name: 'Pantasaph', lat: 53.2731, lon: -3.2594 },
      { name: 'Trelawnyd', lat: 53.3072, lon: -3.3673 },
      { name: 'St Asaph Cathedral', lat: 53.2571, lon: -3.4421, label: true, poi: true, note: 'Britain’s smallest ancient cathedral. William Morgan, who translated the whole Bible into Welsh, was bishop here.' },
      { name: 'Llannefydd', lat: 53.2147, lon: -3.5132, label: true },
      { name: 'Llangernyw', lat: 53.1919, lon: -3.6842, label: true, stageEnd: 0, note: 'The churchyard yew is thought to be one of the oldest living trees in Britain, perhaps 4,000 years old or more.' },
      { name: 'Gwytherin', lat: 53.1394, lon: -3.681, label: true, poi: true, note: 'St Winefride lived here as an abbess and was buried here. Her relics were taken to Shrewsbury in 1138.' },
      { name: 'Llanrwst', lat: 53.1415, lon: -3.7939, label: true },
      { name: 'Pont Fawr, Llanrwst', lat: 53.1378, lon: -3.802 },
      { name: 'Trefriw', lat: 53.1514, lon: -3.8275 },
      { name: 'Rowen', lat: 53.2307, lon: -3.8636 },
      { name: 'Llangelynnin Old Church', lat: 53.2458, lon: -3.873, label: true, poi: true, note: 'A remote medieval church high above the Conwy valley, with its own holy well.' },
      { name: 'Above Llanfairfechan', lat: 53.2463, lon: -3.9584 },
      { name: 'Bangor Cathedral', lat: 53.2265, lon: -4.1275, label: true, poi: true, note: 'On a site where St Deiniol founded a monastery in the 6th century.' },
      { name: 'Clynnog Fawr', lat: 53.021, lon: -4.3653, label: true, poi: true, pause: true, stageEnd: 1, note: 'St Beuno’s church, one of the great stopping places for pilgrims bound for Bardsey.' },
      { name: 'Llanaelhaearn', lat: 52.9768, lon: -4.4029 },
      { name: 'Pistyll', lat: 52.9488, lon: -4.4929, label: true },
      { name: 'Nefyn', lat: 52.9356, lon: -4.5192, label: true },
      { name: 'Tudweiliog', lat: 52.8868, lon: -4.6082 },
      { name: 'Llangwnnadl', lat: 52.8625, lon: -4.6597, label: true },
      { name: 'Aberdaron', lat: 52.8051, lon: -4.7126, label: true, stageEnd: 2, note: 'The last village on the mainland, where pilgrims waited for weather to cross to Bardsey.' },
      { name: 'Braich y Pwll', lat: 52.7979, lon: -4.7665, label: true, poi: true, note: 'The tip of the Llŷn Peninsula, looking across Bardsey Sound.' },
      { name: 'Bardsey Island', lat: 52.7569, lon: -4.7886, label: true, stageEnd: 3, offTrack: true, note: 'Ynys Enlli, the Island of 20,000 Saints, reached by boat across the Sound.' },
    ],
  },
  'st-hildas-way': {
    terrain: 'st-hildas-way',
    routeKm: 65,
    exaggeration: 1.8,
    imagery: 'britain',
    terrainCredit: 'Mapzen Terrain Tiles, including Environment Agency LiDAR (OGL)',
    arrival: { radius: 450, height: 230 },
    waypoints: [
      { name: 'St Hilda’s Church, Hinderwell', lat: 54.5424, lon: -0.7785, label: true, note: 'The village church is dedicated to St Hilda, and the well that gave Hinderwell its name is in the churchyard.' },
      { name: 'Staithes', lat: 54.5592, lon: -0.7923, label: true, stageEnd: 0, note: 'The young James Cook worked in a shop here before going to sea from Whitby.' },
      { name: 'Port Mulgrave', lat: 54.5494, lon: -0.7685 },
      { name: 'Runswick Bay', lat: 54.5327, lon: -0.7504, label: true, stageEnd: 1 },
      { name: 'Kettleness', lat: 54.5292, lon: -0.7175 },
      { name: 'Goldsborough signal station', lat: 54.5246, lon: -0.7109, label: true, poi: true, pause: true, note: 'The site of a late Roman signal station that kept watch over the coast for raiders.' },
      { name: 'Sandsend', lat: 54.5026, lon: -0.6707, label: true, stageEnd: 2 },
      { name: 'Whitby swing bridge', lat: 54.487, lon: -0.6131, label: true },
      { name: 'The 199 Steps', lat: 54.4887, lon: -0.611, label: true, poi: true, note: 'The old stair up the East Cliff to St Mary’s Church and the abbey.' },
      { name: 'Whitby Abbey', lat: 54.4883, lon: -0.6075, label: true, stageEnd: 3, note: 'Hilda founded a monastery here in 657 and hosted the Synod of Whitby in 664. The ruins are of the later Benedictine abbey.' },
    ],
  },
  'the-saints-way': {
    terrain: 'the-saints-way',
    routeKm: 45,
    exaggeration: 1.8,
    imagery: 'britain',
    terrainCredit: 'Mapzen Terrain Tiles, including Environment Agency LiDAR (OGL)',
    arrival: { radius: 450, height: 230 },
    waypoints: [
      { name: 'St Petroc’s Church, Padstow', lat: 50.5412, lon: -4.9429, label: true, note: 'Named for St Petroc, the 6th-century Welsh saint said to have landed on the Camel estuary.' },
      { name: 'Little Petherick', lat: 50.512, lon: -4.9372, label: true },
      { name: 'St Breock Downs Monolith', lat: 50.4793, lon: -4.8656, label: true, poi: true, pause: true, note: 'Cornwall’s largest prehistoric standing stone, on the high downs between the two coasts.' },
      { name: 'Withiel', lat: 50.4537, lon: -4.8261 },
      { name: 'Lanivet', lat: 50.4445, lon: -4.7648, label: true, stageEnd: 0 },
      { name: 'Helman Tor', lat: 50.4232, lon: -4.7308, label: true, poi: true, pause: true, note: 'A granite tor ringed by a Neolithic enclosure, one of the oldest monuments in Cornwall.' },
      { name: 'Luxulyan', lat: 50.3899, lon: -4.7426, label: true, stageEnd: 1 },
      { name: 'Fowey', lat: 50.3354, lon: -4.6357, label: true, stageEnd: 2, note: 'The Way ends at the church of St Fimbarrus by the harbour.' },
    ],
  },
};

export const flythroughSlugs = Object.keys(flythroughs);

/** The stays a plan may see on a route. */
export function staysFor(flythrough: Flythrough, plan: PlanId) {
  return (flythrough.stays ?? []).filter((stay) => stay.plans.includes(plan));
}
