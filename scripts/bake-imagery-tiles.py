"""Bakes high-resolution satellite tiles along a route's corridor.

The base texture from scripts/bake-imagery.py covers the whole map at ~180 m per pixel.
This adds ~20 m imagery in tiles that lie within CORRIDOR_KM of the route, which the
flythrough streams in as the walker approaches. Tiles are aligned to cells of the terrain
grid so each one drapes over an exact block of the heightfield.

Writes public/terrain/<slug>/tiles/<col>_<row>.webp and public/terrain/<slug>/tiles.json.
Run after bake-terrain.mjs and bake-imagery.py (needs rasterio, numpy, pillow):
  python3 scripts/bake-imagery-tiles.py camino-de-santiago
"""

import importlib.util
import json
import math
import multiprocessing
import os
import re
import sys
from collections import defaultdict

import numpy as np
import rasterio
import rasterio.errors
from PIL import Image
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject, transform_bounds

_spec = importlib.util.spec_from_file_location("bake_imagery", os.path.join(os.path.dirname(__file__), "bake-imagery.py"))
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)

TILES = {
    "camino-de-santiago": {
        # Terrain grid cells per tile; ~41 x 46 km on the ground.
        "cells_x": 57,
        "cells_y": 64,
        "px": 2048,
        "corridor_km": 18,
        "datetime": "2024-06-15T00:00:00Z/2024-09-15T23:59:59Z",
        "max_cloud": 15,
        "per_grid": 3,
    },
}


def route_points(slug):
    """Waypoint lat/lons from src/lib/flythroughs.ts, densified to ~1 km steps."""
    src = open("src/lib/flythroughs.ts").read()
    block = src[src.index(f"'{slug}'"):]
    block = block[: block.index("],")]
    pts = [(float(lat), float(lon)) for lat, lon in re.findall(r"lat: ([-\d.]+), lon: ([-\d.]+)", block)]
    dense = []
    for (a_lat, a_lon), (b_lat, b_lon) in zip(pts, pts[1:]):
        steps = max(1, int(math.hypot((b_lat - a_lat) * 111, (b_lon - a_lon) * 82)))
        for k in range(steps):
            t = k / steps
            dense.append((a_lat + (b_lat - a_lat) * t, a_lon + (b_lon - a_lon) * t))
    dense.append(pts[-1])
    return dense


JOB = {}


def bake_tile(t):
    cfg, items, out_dir = JOB["cfg"], JOB["items"], JOB["out_dir"]
    px = cfg["px"]
    years = set()
    tb = t["bounds"]
    dst_transform = from_bounds(*tb, px, px)
    by_grid = defaultdict(list)
    for it in items:
        ib = it["bbox"]
        if ib[0] < tb[2] and ib[2] > tb[0] and ib[1] < tb[3] and ib[3] > tb[1]:
            by_grid[it["properties"]["grid:code"]].append(it)
    ranked = []
    for scenes in by_grid.values():
        scenes.sort(key=lambda s: (s["properties"].get("s2:nodata_pixel_percentage", 0) > 40, s["properties"]["eo:cloud_cover"]))
        ranked.append(scenes)

    def read(s):
        try:
            with rasterio.open(s["assets"]["visual"]["href"]) as src:
                sb = transform_bounds("EPSG:4326", src.crs, *tb, densify_pts=21)
                win = rasterio.windows.from_bounds(*sb, src.transform).intersection(
                    rasterio.windows.Window(0, 0, src.width, src.height)
                ).round_offsets().round_lengths()
                f = 2  # 20 m source pixels, from the first COG overview
                shape = (3, max(1, int(win.height) // f), max(1, int(win.width) // f))
                data = src.read(window=win, out_shape=shape, resampling=Resampling.average)
                wt = src.window_transform(win)
                transform = wt * wt.scale(win.width / shape[2], win.height / shape[1])
                out = np.zeros((3, px, px), dtype=np.uint8)
                reproject(data, out, src_transform=transform, src_crs=src.crs, src_nodata=0,
                          dst_transform=dst_transform, dst_crs="EPSG:4326", dst_nodata=0,
                          resampling=Resampling.bilinear)
        except (rasterio.errors.RasterioIOError, rasterio.errors.WindowError) as err:
            print(f"    skipped {s['id']}: {err}", flush=True)
            return None
        years.add(s["properties"]["datetime"][:4])
        arr = out.astype(np.float32)
        arr[:, out.sum(axis=0) == 0] = np.nan
        return arr

    stack = [a for scenes in ranked for s in scenes[: cfg["per_grid"]] if (a := read(s)) is not None]
    with np.errstate(all="ignore"):
        med = np.nanmedian(np.stack(stack), axis=0) if stack else np.full((3, px, px), np.nan, np.float32)
    # Patch swath-edge gaps from the next clearest passes.
    extras = [s for scenes in ranked for s in scenes[cfg["per_grid"] : cfg["per_grid"] + 3]]
    for s in extras:
        gaps = np.isnan(med[0])
        if gaps.mean() < 0.0005:
            break
        a = read(s)
        if a is not None:
            fill = gaps & ~np.isnan(a[0])
            med[:, fill] = a[:, fill]

    empty = np.isnan(med[0])
    rgb = np.nan_to_num(med.transpose(1, 2, 0))
    rgb = base.fill_gaps(rgb, empty) / 255
    rgb = np.clip(rgb * 1.35, 0, 1) ** 0.85  # same lift as the base texture so they match
    name = f"{t['col']}_{t['row']}.webp"
    Image.fromarray((rgb * 255).astype(np.uint8)).save(f"{out_dir}/{name}", quality=72, method=5)
    t["file"] = name
    return t, years, f"  {name}: {len(stack)} scenes, {os.path.getsize(f'{out_dir}/{name}') // 1024} KB"


def main(slug):
    cfg = TILES[slug]
    meta = json.load(open(f"public/terrain/{slug}.json"))
    west, east, south, north = meta["west"], meta["east"], meta["south"], meta["north"]
    dlon = (east - west) / (meta["width"] - 1)
    dlat = (north - south) / (meta["height"] - 1)
    km_lon = 111.32 * math.cos(math.radians((north + south) / 2))
    route = route_points(slug)

    tiles = []
    for row in range(math.ceil((meta["height"] - 1) / cfg["cells_y"])):
        for col in range(math.ceil((meta["width"] - 1) / cfg["cells_x"])):
            i0, j0 = col * cfg["cells_x"], row * cfg["cells_y"]
            i1, j1 = min(i0 + cfg["cells_x"], meta["width"] - 1), min(j0 + cfg["cells_y"], meta["height"] - 1)
            b = (west + i0 * dlon, north - j1 * dlat, west + i1 * dlon, north - j0 * dlat)
            near = any(
                math.hypot(max(b[0] - lon, 0, lon - b[2]) * km_lon, max(b[1] - lat, 0, lat - b[3]) * 110.57) < cfg["corridor_km"]
                for lat, lon in route
            )
            if near:
                tiles.append({"col": col, "row": row, "i0": i0, "j0": j0, "i1": i1, "j1": j1, "bounds": b})
    print(f"{len(tiles)} corridor tiles", flush=True)

    lons = [t["bounds"][0] for t in tiles] + [t["bounds"][2] for t in tiles]
    lats = [t["bounds"][1] for t in tiles] + [t["bounds"][3] for t in tiles]
    items = base.search([min(lons), min(lats), max(lons), max(lats)], cfg["datetime"], cfg["max_cloud"])
    print(f"{len(items)} scenes", flush=True)

    out_dir = f"public/terrain/{slug}/tiles"
    os.makedirs(out_dir, exist_ok=True)
    px = cfg["px"]
    years = set()

    global JOB
    JOB = {"cfg": cfg, "items": items, "out_dir": out_dir}
    with multiprocessing.get_context("fork").Pool(4) as pool:
        done = []
        for t, scene_years, line in pool.imap(bake_tile, tiles):
            years.update(scene_years)
            done.append(t)
            print(f"  [{len(done)}/{len(tiles)}]{line}", flush=True)
    tiles = done

    manifest = {
        "px": px,
        "credit": f"Contains modified Copernicus Sentinel data {', '.join(sorted(years))}",
        "tiles": [{k: t[k] for k in ("col", "row", "i0", "j0", "i1", "j1", "file")} for t in tiles],
    }
    with open(f"public/terrain/{slug}/tiles.json", "w") as fh:
        json.dump(manifest, fh, indent=1)
        fh.write("\n")
    total = sum(os.path.getsize(f"{out_dir}/{t['file']}") for t in tiles)
    print(f"Wrote {len(tiles)} tiles, {total // 1024 // 1024} MB total", flush=True)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "camino-de-santiago")
