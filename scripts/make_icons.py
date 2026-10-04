#!/usr/bin/env python3
"""Render PNG icons (needs Pillow). Re-run only if the design changes."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
NAVY, RED, WHITE = (20, 48, 107), (200, 16, 46), (255, 255, 255)
SS = 4  # supersample for smooth edges


def render(size, rounded=True, inset=1.0):
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S, S], radius=int(S * 0.22), fill=NAVY)
    else:
        d.rectangle([0, 0, S, S], fill=NAVY)
    u = S / 512 * inset
    off = S * (1 - inset) / 2

    def p(x, y):
        return (off + x * u, off + y * u)

    d.rounded_rectangle([*p(96, 352), *p(416, 380)], radius=int(14 * u), fill=RED)
    pts = [p(148, 244), p(226, 322), p(368, 172)]
    w = int(52 * u)
    d.line(pts, fill=WHITE, width=w, joint="curve")
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


render(192).save(OUT / "icon-192.png")
render(512).save(OUT / "icon-512.png")
render(180, rounded=False).save(OUT / "apple-touch-icon.png")  # iOS rounds it itself
render(512, rounded=False, inset=0.72).save(OUT / "icon-maskable-512.png")
print("icons written")
