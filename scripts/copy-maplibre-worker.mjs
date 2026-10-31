// MapLibre runs its tile work in a module worker that bundlers don't emit, so serve the
// installed package's worker from /maplibre. Runs before `dev` and `build`.
import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('public/maplibre', { recursive: true });
await copyFile('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/maplibre/maplibre-gl-worker.mjs');
