"""Bakes a cloud-free satellite texture for a route flythrough.

Searches the public Sentinel-2 L2A archive on AWS (Element 84 Earth Search, no key
needed), takes the clearest summer scenes for each 110 km grid square, median-composites
them to remove clouds, and resamples onto the same lat/lon grid as the terrain from
scripts/bake-terrain.mjs. Writes public/terrain/<slug>.jpg.

Copernicus Sentinel data is free for any use, including commercial, with the credit
"Contains modified Copernicus Sentinel data <year>".

Usage (needs rasterio, numpy, pillow):
  python3 scripts/bake-imagery.py camino-de-santiago
"""

import json
import os
import sys
import urllib.request
from collections import defaultdict

import numpy as np
import rasterio
import rasterio.errors
from PIL import Image
from rasterio.transform import from_bounds
from rasterio.windows import Window, from_bounds as window_from_bounds
from rasterio.warp import Resampling, reproject

os.environ.setdefault("AWS_NO_SIGN_REQUEST", "YES")

STAC = "https://earth-search.aws.element84.com/v1/search"

IMAGERY = {
    "camino-de-santiago": {
        "width": 4096,
        "datetime": "2024-06-15T00:00:00Z/2024-09-15T23:59:59Z",
        "max_cloud": 15,
        "per_tile": 3,
    },
}


def search(bbox, datetime, max_cloud):
    items, body = [], {
        "collections": ["sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": datetime,
        "query": {"eo:cloud_cover": {"lt": max_cloud}},
        "limit": 200,
    }
    url = STAC
    while url:
        req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        page = json.load(urllib.request.urlopen(req))
        items += page["features"]
        nxt = next((l for l in page.get("links", []) if l["rel"] == "next"), None)
        url, body = (nxt["href"], nxt.get("body", body)) if nxt else (None, None)
    return items


def fill_gaps(img, empty):
    """Fill pixels no pass covered by repeatedly averaging their covered neighbours."""
    img = img.astype(np.float32)
    known = ~empty
    for _ in range(400):
        if known.all():
            break
        acc = np.zeros_like(img)
        cnt = np.zeros(known.shape, dtype=np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-3, 0), (3, 0), (0, -3), (0, 3)):
            k = np.roll(known, (dy, dx), axis=(0, 1))
            acc += np.roll(img, (dy, dx), axis=(0, 1)) * k[..., None]
            cnt += k
        grow = ~known & (cnt > 0)
        img[grow] = acc[grow] / cnt[grow][:, None]
        known |= grow
    return img


def main(slug):
    cfg = IMAGERY[slug]
    meta = json.load(open(f"public/terrain/{slug}.json"))
    west, east, south, north = meta["west"], meta["east"], meta["south"], meta["north"]
    width = cfg["width"]
    # Same aspect as the terrain grid, so texture pixels line up with mesh UVs.
    height = round(width * (meta["height"] - 1) / (meta["width"] - 1))
    dst_transform = from_bounds(west, south, east, north, width, height)

    items = search([west, south, east, north], cfg["datetime"], cfg["max_cloud"])
    by_tile = defaultdict(list)
    for it in items:
        by_tile[it["properties"]["grid:code"]].append(it)
    print(f"{len(items)} scenes over {len(by_tile)} grid squares", flush=True)

    mosaic = np.zeros((3, height, width), dtype=np.uint8)
    years = set()
    for code, scenes in sorted(by_tile.items()):
        # Prefer clear scenes that cover most of the square.
        scenes.sort(key=lambda s: (s["properties"].get("s2:nodata_pixel_percentage", 0) > 40, s["properties"]["eo:cloud_cover"]))
        # Only reproject into the part of the map this grid square covers.
        lons = [c[0] for s in scenes[: cfg["per_tile"]] for c in s["geometry"]["coordinates"][0]]
        lats = [c[1] for s in scenes[: cfg["per_tile"]] for c in s["geometry"]["coordinates"][0]]
        win = window_from_bounds(max(min(lons), west), max(min(lats), south), min(max(lons), east), min(max(lats), north), dst_transform)
        win = win.round_offsets().round_lengths()
        col0, row0 = max(int(win.col_off), 0), max(int(win.row_off), 0)
        w = min(int(win.width) + 2, width - col0)
        h = min(int(win.height) + 2, height - row0)
        if w <= 0 or h <= 0:
            continue
        win_transform = rasterio.windows.transform(Window(col0, row0, w, h), dst_transform)
        def read(s):
            try:
                return read_scene(s)
            except rasterio.errors.RasterioIOError as err:
                print(f"    skipped {s['id']}: {err}", flush=True)
                return np.full((3, h, w), np.nan, dtype=np.float32)

        def read_scene(s):
            with rasterio.open(s["assets"]["visual"]["href"]) as src:
                f = 8  # ~80 m source pixels, read from the COG overviews
                data = src.read(out_shape=(3, src.height // f, src.width // f), resampling=Resampling.average)
                transform = src.transform * src.transform.scale(src.width / data.shape[2], src.height / data.shape[1])
                out = np.zeros((3, h, w), dtype=np.uint8)
                reproject(data, out, src_transform=transform, src_crs=src.crs, src_nodata=0,
                          dst_transform=win_transform, dst_crs="EPSG:4326", dst_nodata=0,
                          resampling=Resampling.average)
            years.add(s["properties"]["datetime"][:4])
            arr = out.astype(np.float32)
            arr[:, out.sum(axis=0) == 0] = np.nan
            return arr

        stack = [read(s) for s in scenes[: cfg["per_tile"]]]
        with np.errstate(all="ignore"):
            med = np.nanmedian(np.stack(stack), axis=0)
        # Swath edges leave wedges no chosen pass covers; patch them from the next clearest passes.
        # Square corners outside every swath stay empty, so stop once passes add little.
        misses = 0
        for s in scenes[cfg["per_tile"] : cfg["per_tile"] + 8]:
            gaps = np.isnan(med[0])
            extra = read(s)
            filled = gaps & ~np.isnan(extra[0])
            med[:, filled] = extra[:, filled]
            stack.append(extra)
            misses = misses + 1 if filled.mean() < 0.005 else 0
            if misses == 2:
                break
        region = mosaic[:, row0 : row0 + h, col0 : col0 + w]
        fill = ~np.isnan(med[0]) & (region.sum(axis=0) == 0)
        for b in range(3):
            region[b][fill] = med[b][fill].astype(np.uint8)
        print(f"  {code}: {len(stack)} scenes", flush=True)

    # Sentinel-2 true colour is dark and flat; lift it gently towards how the eye sees it.
    img = fill_gaps(mosaic.transpose(1, 2, 0), mosaic.sum(axis=0) == 0) / 255
    img = np.clip(img * 1.35, 0, 1) ** 0.85
    out = Image.fromarray((img * 255).astype(np.uint8))
    out.save(f"public/terrain/{slug}.jpg", quality=82, optimize=True, progressive=True)
    meta["imagery"] = {"width": width, "height": height, "credit": f"Contains modified Copernicus Sentinel data {', '.join(sorted(years))}"}
    with open(f"public/terrain/{slug}.json", "w") as fh:
        json.dump(meta, fh, indent=2)
        fh.write("\n")
    print(f"Wrote {width}x{height} imagery ({os.path.getsize(f'public/terrain/{slug}.jpg') // 1024} KB)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "camino-de-santiago")
