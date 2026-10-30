"""Builds the walking track for a route from OpenStreetMap.

Downloads the route's stage relations, joins their ways into a graph, and walks the
shortest path through the flythrough's waypoints in order, so detours and alternative
branches that share the relations are left out. Where a route isn't mapped as a relation (or
the relation has gaps), legs are routed along OpenStreetMap footpaths by the public OSRM foot
router instead. Waypoints marked `offTrack` (an island reached by boat, say) are skipped. Writes public/terrain/<slug>-track.json
as [[lat, lon], ...] simplified to ~8 m, plus its length in km.

Map data © OpenStreetMap contributors, ODbL 1.0.

Usage: python3 scripts/fetch-route-track.py camino-de-santiago
"""

import heapq
import json
import math
import re
import sys
import time
import urllib.request

TRACKS = {
    # Stage relations of the "Camiño Francés" superroute (2163573), excluding its alternatives.
    "camino-de-santiago": [2163569, 2163558, 2163560, 2163561, 2163565, 2163559],
    # St Swithun's Way (Winchester-Farnham), then the North Downs Way west, east and its Canterbury loop.
    "the-pilgrims-way": [48741, 1957110, 8127, 4078375],
    # Melrose to Kirk Yetholm, then Kirk Yetholm to Lindisfarne.
    "st-cuthberts-way": [360996, 4515120],
    "st-michaels-way": [17684067],
    "the-saints-way": [2382950],
    # Not mapped as a route: the Cleveland Way coast path (Staithes to Filey) past Hinderwell,
    # with the first leg from Hinderwell church routed along footpaths.
    "st-hildas-way": {"relations": [31112], "foot_legs": ["St Hilda\u2019s Church, Hinderwell"]},
    # Mapped from Basingwerk to Llannefydd and in the hills above Llanfairfechan; routed along
    # footpaths through the Conwy valley between them, and west of Llanfairfechan to Aberdaron.
    "north-wales-pilgrims-way": {"relations": [5480035], "foot_from": "Llannefydd",
                                 # The router won't take Llanrwst's bridge over the Conwy.
                                 "straight_legs": ["Llanrwst"]},
}

FOOT_ROUTER = "https://routing.openstreetmap.de/routed-foot/route/v1/foot"

UA = {"User-Agent": "a-pilgrims-tour-flythrough/1.0 (route track builder)"}


def fetch(rel):
    for attempt in range(4):
        try:
            req = urllib.request.Request(f"https://api.openstreetmap.org/api/0.6/relation/{rel}/full.json", headers=UA)
            return json.load(urllib.request.urlopen(req, timeout=120))["elements"]
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def foot_route(a, b):
    """Footpath route between two (lat, lon) points, or None if the router finds none."""
    url = f"{FOOT_ROUTER}/{a[1]},{a[0]};{b[1]},{b[0]}?overview=full&geometries=geojson"
    for attempt in range(4):
        try:
            data = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120))
            break
        except Exception:
            if attempt == 3:
                return None
            time.sleep(2 ** attempt)
    if data.get("code") != "Ok":
        return None
    return [(la, lo) for lo, la in data["routes"][0]["geometry"]["coordinates"]]


def haversine(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def simplify(pts, tol_km):
    """Douglas-Peucker on a local equirectangular projection."""
    if len(pts) < 3:
        return pts
    k = math.cos(math.radians(pts[0][0]))
    xy = [(p[1] * 111.32 * k, p[0] * 110.57) for p in pts]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (x1, y1), (x2, y2) = xy[i], xy[j]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy) or 1e-9
        best, idx = 0.0, -1
        for m in range(i + 1, j):
            d = abs(dy * (xy[m][0] - x1) - dx * (xy[m][1] - y1)) / norm
            if d > best:
                best, idx = d, m
        if best > tol_km:
            keep[idx] = True
            stack += [(i, idx), (idx, j)]
    return [p for p, f in zip(pts, keep) if f]


def waypoints(slug):
    """(name, (lat, lon)) for each on-track waypoint of the route, in order."""
    src = open("src/lib/flythroughs.ts").read()
    block = src[src.index(f"'{slug}'"):]
    block = block[block.index("waypoints:"):]
    block = block[: block.index("\n    ],")]
    out = []
    for obj in re.findall(r"\{ name: [^\n]*\}", block):
        if "offTrack: true" in obj:
            continue
        name = re.search(r"name: '((?:[^'\\]|\\.)*)'", obj).group(1)
        name = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), name)
        lat, lon = re.search(r"lat: ([-\d.]+), lon: ([-\d.]+)", obj).groups()
        out.append((name, (float(lat), float(lon))))
    return out


def main(slug):
    cfg = TRACKS[slug] if isinstance(TRACKS[slug], dict) else {"relations": TRACKS[slug]}
    nodes, adj = {}, {}
    for rel in cfg["relations"]:
        elements = fetch(rel)
        for e in elements:
            if e["type"] == "node":
                nodes[e["id"]] = (e["lat"], e["lon"])
        for e in elements:
            if e["type"] == "way":
                ids = [n for n in e["nodes"] if n in nodes]
                for a, b in zip(ids, ids[1:]):
                    d = haversine(nodes[a], nodes[b])
                    adj.setdefault(a, []).append((b, d))
                    adj.setdefault(b, []).append((a, d))
        print(f"relation {rel}: {len(nodes)} nodes so far", flush=True)

    graph_nodes = list(adj)

    def nearest(p):
        return min(graph_nodes, key=lambda n: haversine(p, nodes[n]))

    def shortest(a, b):
        dist, prev, pq = {a: 0.0}, {}, [(0.0, a)]
        while pq:
            d, u = heapq.heappop(pq)
            if u == b:
                break
            if d > dist.get(u, math.inf):
                continue
            for v, w in adj[u]:
                nd = d + w
                if nd < dist.get(v, math.inf):
                    dist[v], prev[v] = nd, u
                    heapq.heappush(pq, (nd, v))
        if b not in dist:
            return None
        path = [b]
        while path[-1] != a:
            path.append(prev[path[-1]])
        return path[::-1]

    named = waypoints(slug)
    names = [n for n, _ in named]
    wps = [p for _, p in named]
    foot_from = names.index(cfg["foot_from"]) if "foot_from" in cfg else len(wps)
    foot_legs = {names.index(n) for n in cfg.get("foot_legs", [])} | set(range(foot_from, len(wps)))
    snapped = [nearest(p) for p in wps]
    for i, (p, n) in enumerate(zip(wps, snapped)):
        off = haversine(p, nodes[n])
        if off > 1.5 and i not in foot_legs and i - 1 not in foot_legs:
            print(f"  warning: {names[i]} is {off:.1f} km from the track", flush=True)

    # Each leg starts where the last one ended. Foot-routed legs use the waypoints themselves.
    def at(i):
        return wps[i] if i in foot_legs or i - 1 in foot_legs else nodes[snapped[i]]

    pts = [at(0)]
    for i in range(len(wps) - 1):
        seg = None
        if i not in foot_legs:
            path = shortest(snapped[i], snapped[i + 1])
            if path is not None:
                seg = [nodes[n] for n in path]
            else:
                print(f"  gap in the relation between {names[i]} and {names[i + 1]}: routing on footpaths", flush=True)
        if seg is None and names[i] in cfg.get("straight_legs", []):
            seg = [at(i), at(i + 1)]
        if seg is None:
            seg = foot_route(at(i), at(i + 1))
            if seg is None:
                print(f"  no footpath route between {names[i]} and {names[i + 1]}: straight line", flush=True)
                seg = [at(i), at(i + 1)]
        pts += seg[1:] if haversine(pts[-1], seg[0]) < 0.05 else seg

    length = sum(haversine(p, q) for p, q in zip(pts, pts[1:]))
    pts = simplify(pts, 0.008)
    out = {
        "credit": "Route © OpenStreetMap contributors (ODbL)",
        "km": round(length, 1),
        "points": [[round(la, 5), round(lo, 5)] for la, lo in pts],
    }
    with open(f"public/terrain/{slug}-track.json", "w") as fh:
        json.dump(out, fh, separators=(",", ":"))
    print(f"Track: {length:.1f} km, {len(pts)} points after simplification", flush=True)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "camino-de-santiago")
