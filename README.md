This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 3D flythroughs

`/routes/<slug>/flythrough` flies along a route over real terrain, built on [MapLibre GL JS](https://maplibre.org) with a three.js layer for the pilgrim and trees. Routes with a flythrough are listed in `src/lib/flythroughs.ts`.

### Settings

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_ARCGIS_API_KEY` | Optional. An [ArcGIS Location Platform](https://location.arcgis.com) key enables Esri World Imagery (30–50 cm) for British routes. The free tier covers 2,000,000 basemap tiles a month; leave pay-as-you-go off and Esri stops serving rather than charging. Restrict the key to the site's domain. Without a key, the free Sentinel-2 tiles in `public/tiles` are used. |
| `NEXT_PUBLIC_FLYTHROUGH_TILE_BASE` | Optional. Where the baked tiles are served from (default `/tiles`). Set it to a Cloudflare R2 bucket after running `scripts/upload-tiles-r2.sh`. |

Spanish routes use Spain's PNOA and France's IGN aerial photography, which are free with credit and need no key.

### Adding a route

1. Add waypoints, stages and imagery for the slug in `src/lib/flythroughs.ts`, and its OpenStreetMap route relations in `scripts/fetch-route-track.py`.
2. `python3 scripts/fetch-route-track.py <slug>`: the walking track from OpenStreetMap.
3. `node scripts/bake-terrain.mjs <slug>` (add a bounding box first): a coarse heightfield for the camera and the elevation profile.
4. For British routes: `python3 scripts/bake-imagery-xyz.py <slug>` (needs `rasterio`, `numpy`, `pillow`): the free satellite tiles.

`npm run dev` and `npm run build` copy MapLibre's worker into `public/maplibre` first (`scripts/copy-maplibre-worker.mjs`).
