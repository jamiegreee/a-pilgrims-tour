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
from PIL import Image
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject

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
    print(f"{len(items)} scenes over {len(by_tile)} grid squares")

    mosaic = np.zeros((3, height, width), dtype=np.uint8)
    years = set()
    for code, scenes in sorted(by_tile.items()):
        # Prefer clear scenes that cover most of the square.
        scenes.sort(key=lambda s: (s["properties"].get("s2:nodata_pixel_percentage", 0) > 40, s["properties"]["eo:cloud_cover"]))
        stack = []
        for s in scenes[: cfg["per_tile"]]:
            href = s["assets"]["visual"]["href"]
            with rasterio.open(href) as src:
                f = 8  # ~80 m source pixels, read from the COG overviews
                data = src.read(out_shape=(3, src.height // f, src.width // f), resampling=Resampling.average)
                transform = src.transform * src.transform.scale(src.width / data.shape[2], src.height / data.shape[1])
                out = np.zeros((3, height, width), dtype=np.uint8)
                reproject(data, out, src_transform=transform, src_crs=src.crs, src_nodata=0,
                          dst_transform=dst_transform, dst_crs="EPSG:4326", dst_nodata=0,
                          resampling=Resampling.average)
            stack.append(out)
            years.add(s["properties"]["datetime"][:4])
        arr = np.stack(stack).astype(np.float32)
        valid = arr.sum(axis=1, keepdims=True) > 0
        arr[~np.repeat(valid, 3, axis=1)] = np.nan
        with np.errstate(all="ignore"):
            med = np.nanmedian(arr, axis=0)
        fill = ~np.isnan(med[0]) & (mosaic.sum(axis=0) == 0)
        for b in range(3):
            mosaic[b][fill] = med[b][fill].astype(np.uint8)
        print(f"  {code}: {len(stack)} scenes")

    # Sentinel-2 true colour is dark and flat; lift it gently towards how the eye sees it.
    img = mosaic.transpose(1, 2, 0).astype(np.float32) / 255
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
