"""Bakes a free satellite tile pyramid for a route, for use where no sharper imagery is set up.

Cloud-free Copernicus Sentinel-2 composite (see bake-imagery.py), written as standard
web-map tiles that MapLibre loads directly:
  - zooms 8-11 over the whole route region (~40 m/px at 11),
  - zoom 12 within CORRIDOR_KM of the track, zoom 13 (~12 m/px, Sentinel's native detail)
    within CORRIDOR_NEAR_KM.
Writes public/tiles/<slug>/{z}/{x}/{y}.webp. Host that folder anywhere (see
scripts/upload-tiles-r2.sh) and point NEXT_PUBLIC_FLYTHROUGH_TILE_BASE at it.

Needs rasterio, numpy, pillow:
  python3 scripts/bake-imagery-xyz.py the-pilgrims-way
"""

import importlib.util
import json
import math
import multiprocessing
import os
import sys
from collections import defaultdict

import numpy as np
import rasterio
import rasterio._err
import rasterio.errors
from PIL import Image
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject, transform_bounds

os.environ.setdefault("GDAL_HTTP_TIMEOUT", "60")
os.environ.setdefault("GDAL_HTTP_MAX_RETRY", "4")
os.environ.setdefault("GDAL_HTTP_RETRY_DELAY", "2")

_spec = importlib.util.spec_from_file_location("bake_imagery", os.path.join(os.path.dirname(__file__), "bake-imagery.py"))
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)

PYRAMIDS = {
    "the-pilgrims-way": {
        "datetime": "2023-05-01T00:00:00Z/2024-09-30T23:59:59Z",
        "max_cloud": 10,
        "corridor_km": 6,
        "corridor_near_km": 3,
    },
}

R = 6378137.0
TILE = 256


def tile_bounds_3857(z, x, y):
    span = 2 * math.pi * R / 2 ** z
    minx = -math.pi * R + x * span
    maxy = math.pi * R - y * span
    return minx, maxy - span, minx + span, maxy


def lonlat_tile(lon, lat, z):
    n = 2 ** z
    r = math.radians(lat)
    return int((lon + 180) / 360 * n), int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)


def tile_centre(z, x, y):
    n = 2 ** z
    lon = (x + 0.5) / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 0.5) / n))))
    return lat, lon


def km(a, b):
    k = math.cos(math.radians(a[0]))
    return math.hypot((a[0] - b[0]) * 110.57, (a[1] - b[1]) * 111.32 * k)


JOB = {}


def bake_block(block):
    """Render one block (a tile at zoom zb, at the resolution of zoom zb + 3) and slice it."""
    zb, bx, by, mode = block
    items, out_dir, cfg = JOB["items"], JOB["out_dir"], JOB["cfg"]
    # Region blocks supply zooms 8-11; corridor blocks only the sharper zooms near the track.
    keep = (lambda lv, x, y: lv <= 11) if mode == "region" else (lambda lv, x, y: lv >= 12 and JOB["keep"](lv, x, y))
    px = TILE * 8
    b3857 = tile_bounds_3857(zb, bx, by)
    lon0, lat0, lon1, lat1 = transform_bounds("EPSG:3857", "EPSG:4326", *b3857)
    dst_transform = from_bounds(*b3857, px, px)
    ground_m = (b3857[2] - b3857[0]) * math.cos(math.radians((lat0 + lat1) / 2)) / px
    factor = max(1, min(8, int(ground_m // 10)))  # read the COG overview nearest our pixel size

    by_grid = defaultdict(list)
    for it in items:
        ib = it["bbox"]
        if ib[0] < lon1 and ib[2] > lon0 and ib[1] < lat1 and ib[3] > lat0:
            by_grid[it["properties"]["grid:code"]].append(it)
    for scenes in by_grid.values():
        scenes.sort(key=lambda s: (s["properties"].get("s2:nodata_pixel_percentage", 0) > 40, s["properties"]["eo:cloud_cover"]))

    def read(s):
        try:
            with rasterio.open(s["assets"]["visual"]["href"]) as src:
                sb = transform_bounds("EPSG:4326", src.crs, lon0, lat0, lon1, lat1, densify_pts=21)
                win = rasterio.windows.from_bounds(*sb, src.transform).intersection(
                    rasterio.windows.Window(0, 0, src.width, src.height)
                ).round_offsets().round_lengths()
                if win.width < 4 or win.height < 4:
                    return None
                shape = (3, max(1, int(win.height) // factor), max(1, int(win.width) // factor))
                data = src.read(window=win, out_shape=shape, resampling=Resampling.average)
                wt = src.window_transform(win)
                transform = wt * wt.scale(win.width / shape[2], win.height / shape[1])
                out = np.zeros((3, px, px), dtype=np.uint8)
                reproject(data, out, src_transform=transform, src_crs=src.crs, src_nodata=0,
                          dst_transform=dst_transform, dst_crs="EPSG:3857", dst_nodata=0,
                          resampling=Resampling.bilinear)
        except (rasterio.errors.RasterioError, rasterio.errors.WindowError, rasterio._err.CPLE_BaseError):
            return None
        arr = out.astype(np.float32)
        arr[:, out.sum(axis=0) == 0] = np.nan
        return arr

    # More passes per median over the wide region blocks evens out colour between neighbours.
    per_grid = 5 if mode == "region" else 3
    stack = [a for scenes in by_grid.values() for s in scenes[:per_grid] if (a := read(s)) is not None]
    with np.errstate(all="ignore"):
        med = np.nanmedian(np.stack(stack), axis=0) if stack else np.full((3, px, px), np.nan, np.float32)
    for s in [s for scenes in by_grid.values() for s in scenes[per_grid : per_grid + 3]]:
        gaps = np.isnan(med[0])
        if gaps.mean() < 0.0005:
            break
        a = read(s)
        if a is not None:
            fill = gaps & ~np.isnan(a[0])
            med[:, fill] = a[:, fill]
    rgb = base.fill_gaps(np.nan_to_num(med.transpose(1, 2, 0)), np.isnan(med[0])) / 255
    rgb = np.clip(rgb * 1.35, 0, 1) ** 0.85
    img = Image.fromarray((rgb * 255).astype(np.uint8))

    written = 0
    for level in range(zb, zb + 4):
        n = 2 ** (level - zb)
        scaled = img.resize((TILE * n, TILE * n), Image.LANCZOS) if n < 8 else img
        for ty in range(n):
            for tx in range(n):
                x, y = bx * n + tx, by * n + ty
                if not keep(level, x, y):
                    continue
                path = f"{out_dir}/{level}/{x}/{y}.webp"
                os.makedirs(os.path.dirname(path), exist_ok=True)
                scaled.crop((tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE)).save(path, quality=74, method=5)
                written += 1
    return f"  block z{zb}/{bx}/{by}: {len(stack)} scenes, {written} tiles"


def main(slug):
    cfg = PYRAMIDS[slug]
    meta = json.load(open(f"public/terrain/{slug}.json"))
    track = json.load(open(f"public/terrain/{slug}-track.json"))["points"]
    track = track[:: max(1, len(track) // 2000)]
    west, east, south, north = meta["west"], meta["east"], meta["south"], meta["north"]

    def near(level, x, y, limit):
        # Distance from the tile centre to the track, less half the tile's diagonal.
        c = tile_centre(level, x, y)
        half = 40075 / 2 ** level * math.cos(math.radians(c[0])) / 2 * 1.42
        return min(km(c, p) for p in track) - half < limit

    def keep(level, x, y):
        if level <= 11:
            return True
        if level == 12:
            return near(level, x, y, cfg["corridor_km"])
        return near(level, x, y, cfg["corridor_near_km"])

    blocks = []
    x0, y0 = lonlat_tile(west, north, 8)
    x1, y1 = lonlat_tile(east, south, 8)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            blocks.append((8, x, y, "region"))
    x0, y0 = lonlat_tile(west, north, 10)
    x1, y1 = lonlat_tile(east, south, 10)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if near(10, x, y, cfg["corridor_km"]):
                blocks.append((10, x, y, "corridor"))
    print(f"{len(blocks)} blocks", flush=True)

    # Search the full extent of the blocks, which reaches past the region's edges.
    corners = [transform_bounds("EPSG:3857", "EPSG:4326", *tile_bounds_3857(z, x, y)) for z, x, y, _ in blocks]
    extent = [min(c[0] for c in corners), min(c[1] for c in corners), max(c[2] for c in corners), max(c[3] for c in corners)]
    items = base.search(extent, cfg["datetime"], cfg["max_cloud"])
    print(f"{len(items)} scenes", flush=True)
    out_dir = f"public/tiles/{slug}"
    # Workers are forked, so they inherit JOB (and the keep closure) without pickling.
    JOB.update(items=items, out_dir=out_dir, cfg=cfg, keep=keep)
    with multiprocessing.get_context("fork").Pool(4) as pool:
        for i, line in enumerate(pool.imap_unordered(bake_block, blocks), 1):
            print(f"[{i}/{len(blocks)}]{line}", flush=True)
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(out_dir) for f in fs)
    count = sum(len(fs) for _, _, fs in os.walk(out_dir))
    print(f"Wrote {count} tiles, {total / 1e6:.1f} MB", flush=True)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "the-pilgrims-way")
