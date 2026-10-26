"""Builds the walking track for a route from OpenStreetMap.

Downloads the route's stage relations, joins their ways into a graph, and walks the
shortest path through the flythrough's waypoints in order, so detours and alternative
branches that share the relations are left out. Writes public/terrain/<slug>-track.json
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
}

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
    src = open("src/lib/flythroughs.ts").read()
    block = src[src.index(f"'{slug}'"):]
    block = block[: block.index("],")]
    return [(float(a), float(b)) for a, b in re.findall(r"lat: ([-\d.]+), lon: ([-\d.]+)", block)]


def main(slug):
    nodes, adj = {}, {}
    for rel in TRACKS[slug]:
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

    wps = waypoints(slug)
    snapped = [nearest(p) for p in wps]
    for p, n in zip(wps, snapped):
        off = haversine(p, nodes[n])
        if off > 1.5:
            print(f"  warning: waypoint {p} is {off:.1f} km from the track", flush=True)

    track = [snapped[0]]
    for a, b in zip(snapped, snapped[1:]):
        seg = shortest(a, b)
        if seg is None:
            # A gap in the mapped relation: bridge it with a straight line.
            print(f"  gap between {nodes[a]} and {nodes[b]}, bridging", flush=True)
            seg = [a, b]
        track += seg[1:]

    pts = [nodes[n] for n in track]
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
