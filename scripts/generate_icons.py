"""Generate reproducible valid PWA icons for Vinnyzau using Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

for size in (192, 512):
    image = Image.new("RGB", (size, size), "#ffffff")
    draw = ImageDraw.Draw(image)
    # Purple rounded app tile, white V and yellow accent.
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.22), fill="#7135ec")
    v = [(0.17, 0.24), (0.36, 0.24), (0.50, 0.63), (0.64, 0.24), (0.83, 0.24), (0.60, 0.79), (0.40, 0.79)]
    draw.polygon([(round(x * size), round(y * size)) for x, y in v], fill="#ffffff")
    draw.ellipse((int(size*.79),int(size*.12),int(size*.88),int(size*.21)),fill="#ffce35")
    path = ROOT / f"icon-{size}.png"
    image.save(path, format="PNG", optimize=True)
    print(f"Generated {path.name}: {path.stat().st_size} bytes")
