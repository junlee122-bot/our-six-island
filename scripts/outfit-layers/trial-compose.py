from PIL import Image
import numpy as np, json
from scipy.ndimage import binary_dilation, binary_erosion
S = __import__('sys').argv[1]
atlas = Image.open('public/assets/lounge/akatsuki-atlas.png').convert('RGB')
A = np.asarray(atlas).astype(int); W, H = atlas.size; cw, ch = W // 4, H // 2
B = np.asarray(Image.open(f'{S}/bodies.png').convert('RGB')).astype(int)
bh, bw = B.shape[:2]

def key(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return ~((r > 170) & (b > 170) & (g < 110))

bodies = []
for half in (0, 1):
    c = B[:, half * bw // 2:(half + 1) * bw // 2]
    fg = key(c)
    fg = binary_erosion(binary_dilation(fg, iterations=1), iterations=1)
    ys, xs = np.where(fg)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    white = (r > 235) & (g > 235) & (b > 235)
    cx = int(np.median(xs[ys < ys.min() + 200]))
    col = white[:, cx - 25:cx + 25].sum(1)
    collar = int(np.where(col > 10)[0].min())
    cut = collar - 14  # keep a little neck under the real chin
    alpha = np.where(fg, 255, 0).astype(np.uint8)
    alpha[:cut] = 0
    img = Image.fromarray(np.dstack([c.astype(np.uint8), alpha]), 'RGBA')
    bodies.append({'img': img, 'cut': cut, 'feet': int(ys.max()), 'cx': cx})

def hair_dye(rgba, hexcol):
    a = np.asarray(rgba).astype(float).copy()
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 120) & (b > r + 50) & (b > g + 30)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    k = np.clip(lum / 0.42, 0, 1.6)[..., None]
    a[..., :3][m] = np.clip(t * k[m], 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def skin_tone(rgba, hexcol):
    a = np.asarray(rgba).astype(float).copy()
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r > 190) & (g > 150) & (b > 115) & (r > b + 25) & (r - g < 70) & (a[..., 3] > 0)
    base = np.array([0xf6, 0xd5, 0xbd], float)
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    a[..., :3][m] = np.clip(a[..., :3][m] * (t / base), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def figure(i, hair='#292e36', skin=None):
    x0, y0 = (i % 4) * cw, (i // 4) * ch
    c = A[y0:y0 + ch, x0:x0 + cw]
    fg = key(c)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    sk = (r > 200) & (g > 160) & (b > 120) & (r > b + 30) & fg
    ys, xs = np.where(fg)
    cxa = int(xs.mean())
    rows = np.where(sk[:, cxa - 60:cxa + 60].sum(1) > 20)[0]
    chin = int(rows.max())
    fx = int(np.where(sk[chin - 120:chin])[1].mean())
    blue = (b > 120) & (b > r + 50) & (b > g + 30) & fg
    cut = chin + 2
    al = np.zeros(fg.shape, np.uint8); al[:cut][fg[:cut]] = 255
    hb = np.zeros_like(blue); hb[cut:] = blue[cut:]
    hb = binary_dilation(hb, iterations=3) & fg; hb[:cut] = False
    al[hb] = 255
    red = (r > g + 60) & (r > b + 40) & ~sk
    dark = (r + g + b < 200)
    zone = np.zeros(fg.shape, bool); zone[chin - 40:cut + 1] = True
    al[zone & red & ~blue] = 0
    # dark collar fill not touching skin or hair
    near = binary_dilation(sk | blue, iterations=4)
    al[zone & dark & ~near] = 0
    head = Image.fromarray(np.dstack([c.astype(np.uint8), al]), 'RGBA')
    body = bodies[0 if i in (0, 2, 7) else 1]
    s = (ys.max() - chin) / (body['feet'] - body['cut'] - 14)
    def width_at(mask, y, cx):
        row = np.where(mask[y])[0]
        row = row[np.abs(row - cx) < 260]
        return row.max() - row.min() if len(row) else 1
    ofg = fg & ~blue
    ow = np.median([width_at(ofg, chin + d, fx) for d in range(150, 260, 10)])
    bm = np.asarray(body['img'])[..., 3] > 0
    bwid = np.median([width_at(bm, int(body['cut'] + 14 + d / s), body['cx']) for d in range(150, 260, 10)])
    sx = min(max(ow / bwid, s), s * 1.35)
    bimg = body['img'].resize((int(body['img'].width * sx), int(body['img'].height * s)), Image.LANCZOS)
    out = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    out.alpha_composite(bimg, (int(fx - body['cx'] * sx), int(chin - 12 - body['cut'] * s)))
    out.alpha_composite(head)
    out = hair_dye(out, hair)
    if skin: out = skin_tone(out, skin)
    return out

HAIR = ['#963d4e', '#292e36', '#745044', '#292e36', '#4e7998', '#292e36', '#c39754', '#963d4e']
names = ['도원', '강재', '민서', '승준', '민재', '재민', '호현', '도원(번)']
sheet = Image.new('RGB', (8 * 300, 2 * 420 + 420), (236, 232, 222))
orig = atlas.copy()
for i in range(8):
    x0, y0 = (i % 4) * cw, (i // 4) * ch
    o = orig.crop((x0, y0, x0 + cw, y0 + ch)).convert('RGBA')
    oa = np.asarray(o).copy(); oa[..., 3] = np.where(key(np.asarray(o)[..., :3].astype(int)), 255, 0); o = Image.fromarray(oa)
    o = hair_dye(o, HAIR[i]).resize((300, 400), Image.LANCZOS)
    n = figure(i, HAIR[i]).resize((300, 400), Image.LANCZOS)
    sheet.paste(o, (i * 300, 10), o); sheet.paste(n, (i * 300, 430), n)
for j, tone in enumerate(['#fbe2cf', '#e8b48f', '#c98a5e', '#8d5a3b']):
    n = figure(3, HAIR[3], tone).resize((300, 400), Image.LANCZOS)
    sheet.paste(n, (j * 300, 850), n)
for j, (i, h) in enumerate([(2, '#d07a95'), (2, '#b7bcc9'), (6, '#527967'), (6, '#c39754')]):
    n = figure(i, h).resize((300, 400), Image.LANCZOS)
    sheet.paste(n, ((4 + j) * 300, 850), n)
sheet.save(f'{S}/trial-sheet.png')
print('ok')
