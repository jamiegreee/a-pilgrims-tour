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

## Accounts and purchases

Sign-up is passwordless: `/signup` and `/login` email a one-time link (valid 30 minutes) through
Resend, and confirming it sets a signed session cookie for 30 days. Accounts are free.

A route's 3D flythrough (`/routes/<slug>/flythrough`) unlocks only once the signed-in email has
paid for a pilgrimage on that route (`src/lib/purchases.ts`). There is no database: Stripe is
the record. A completed, paid Checkout counts when it names the route either
- in its metadata, as payment links made by `POST /api/stripe/create-payment-link` do (send the
  `ADMIN_API_SECRET` in an `x-admin-secret` header; body: `email`, `name`, `amount` in pence,
  `description`, `routeSlug`, and optionally `optionId`: `independent`, `walk-light` or
  `guided`), or
- in the name of a product bought, e.g. a Dashboard payment link for a product called
  "St Cuthbert's Way – Walk Light" (the route name as on the site; the option name decides
  which hotel stays the flythrough shows).

It is matched against the email paid with, and for links made by the endpoint, the email the
link was made out to. The owner (`BUSINESS_EMAIL`) can watch every flythrough. The owner is
emailed on every new sign-up and every completed checkout; the customer's confirmation email
links to their flythrough.

Environment:
- `AUTH_SECRET`: at least 32 random characters (`openssl rand -hex 32`). Required.
- `RESEND_API_KEY`: sends the sign-in links and emails. Without it, previews and local
  development show the sign-in link on screen; production refuses to sign people in.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: from the business's Stripe account. Without the
  secret key no purchases are found, so only the owner can watch flythroughs.
- `ADMIN_API_SECRET`: lets the business create payment links through the API. Unset, the
  endpoint refuses every request.
- `BUSINESS_EMAIL`: the owner (default green.jcb@gmail.com).

Hotel stays: add `stays` to a route in `src/lib/flythroughs.ts` (name, position, night, and the
`plans` allowed to see it). The flythrough shows them as green pins; the server strips any the
viewer's purchase doesn't include.

## 3D flythroughs

`/routes/<slug>/flythrough` flies along a route over real terrain, built on [MapLibre GL JS](https://maplibre.org) with a three.js layer for the pilgrim and trees. Routes with a flythrough are listed in `src/lib/flythroughs.ts`.

### Settings

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_ARCGIS_API_KEY` | Optional. An [ArcGIS Location Platform](https://location.arcgis.com) key enables Esri World Imagery (30–50 cm) for British routes. The free tier covers 2,000,000 basemap tiles a month; leave pay-as-you-go off and Esri stops serving rather than charging. Restrict the key to the site's domain. Without a key, routes with `bakedTiles` use the free Sentinel-2 tiles in `public/tiles` (only the Pilgrims' Way so far); the others show shaded relief. |
| `NEXT_PUBLIC_FLYTHROUGH_TILE_BASE` | Optional. Where the baked tiles are served from (default `/tiles`). Set it to a Cloudflare R2 bucket after running `scripts/upload-tiles-r2.sh`. |

Spanish routes use Spain's PNOA and France's IGN aerial photography, which are free with credit and need no key.

### Adding a route

1. Add waypoints, stages and imagery for the slug in `src/lib/flythroughs.ts`, and its OpenStreetMap route relations in `scripts/fetch-route-track.py`. Where the route isn't mapped as a relation, list the legs to route along footpaths instead (`foot_from`, `foot_legs`).
2. `python3 scripts/fetch-route-track.py <slug>`: the walking track from OpenStreetMap.
3. `node scripts/bake-terrain.mjs <slug>` (add a bounding box first): a coarse heightfield for the camera and the elevation profile.
4. Optional, for British routes: `python3 scripts/bake-imagery-xyz.py <slug>` (needs `rasterio`, `numpy`, `pillow`) bakes free satellite tiles for when there's no Esri key; then set `bakedTiles: true`.

`npm run dev` and `npm run build` copy MapLibre's worker into `public/maplibre` first (`scripts/copy-maplibre-worker.mjs`).
