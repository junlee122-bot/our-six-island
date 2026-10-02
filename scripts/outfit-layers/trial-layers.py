# Layered character trial: shared body + bald face base + hairstyle on top.
from PIL import Image
import numpy as np, sys
from scipy.ndimage import binary_dilation, label
S = sys.argv[1]

def load(n):
    return np.asarray(Image.open(f'{S}/{n}.png').convert('RGB')).astype(int)

def magenta(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return (r > 170) & (b > 170) & (g < 110)

def skinmask(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return (r > 200) & (g > 165) & (b > 125) & (r > b + 25) & ~magenta(c)

def cells(a):
    H, W = a.shape[:2]; cw, ch = W // 4, H // 2
    return [a[(i // 4) * ch:(i // 4 + 1) * ch, (i % 4) * cw:(i % 4 + 1) * cw] for i in range(8)]

def neck_chin(sk):
    ys, xs = np.where(sk)
    bottom = ys.max()
    nr = np.where(sk[bottom - 10])[0]; nw = nr.max() - nr.min()
    y = bottom - 10
    while y > 0:
        row = np.where(sk[y])[0]
        if len(row) and row.max() - row.min() > nw * 1.25: break
        y -= 1
    return (nr.max() + nr.min()) / 2, y, bottom, nw

def rgba(c, alpha):
    return Image.fromarray(np.dstack([c.astype(np.uint8), alpha.astype(np.uint8)]), 'RGBA')

# faces: keep everything non-magenta, cut a few px under the chin (body's neck shows below)
faces = []
for c in cells(load('faces'))[:7]:
    sk = skinmask(c); cx, chin, bottom, nw = neck_chin(sk)
    al = np.where(~magenta(c), 255, 0); al[chin + 18:] = 0
    ys = np.where(sk)[0]
    faces.append({'img': rgba(c, al), 'cx': cx, 'chin': chin, 'top': ys.min()})

# hair: everything non-magenta minus the mannequin skin connected to the neck and its outline
hairs = []
for c in cells(load('hairs')):
    fg = ~magenta(c); sk = skinmask(c)
    cx, chin, bottom, nw = neck_chin(sk)
    lab, _ = label(sk)
    face = np.isin(lab, np.unique(lab[sk & (np.arange(sk.shape[0])[:, None] > chin - 200)]))
    face &= sk
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    blue = (b > 120) & (b > r + 50) & (b > g + 30)
    dark = (r + g + b) < 260
    near_face = binary_dilation(face, iterations=4)
    near_blue = binary_dilation(blue, iterations=1)
    drop = face | (dark & near_face & ~near_blue)
    al = np.where(fg & ~drop, 255, 0)
    # small specks
    lab2, n = label(al > 0)
    if n:
        sizes = np.bincount(lab2.ravel()); small = sizes < 400; small[0] = False
        hasblue = np.bincount(lab2.ravel(), weights=blue.ravel().astype(float)) > 20
        small |= ~hasblue; small[0] = False
        al[small[lab2]] = 0
    # thin strokes over the cheeks (the mannequin's jaw line) go; real strands are wider
    from scipy.ndimage import binary_opening
    zone = np.zeros(al.shape, bool); zone[chin - 170:chin + 30, int(cx) - 150:int(cx) + 150] = True
    keep = binary_opening(al > 0, iterations=3)
    al[zone & ~keep] = 0
    hairs.append({'img': rgba(c, al), 'cx': cx, 'chin': chin})

# bodies: two figures, mannequin head removed above the collar
B = load('bodies'); bw = B.shape[1]
bodies = []
for half in (0, 1):
    c = B[:, half * bw // 2:(half + 1) * bw // 2]
    fg = ~magenta(c); sk = skinmask(c)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    white = (r > 235) & (g > 235) & (b > 235)
    ys, xs = np.where(fg)
    cx = int(np.median(xs[ys < ys.min() + 200]))
    collar = int(np.where(white[:, cx - 25:cx + 25].sum(1) > 10)[0].min())
    headrows = np.where(sk[:collar, cx - 30:cx + 30].sum(1) > 10)[0]
    top = int(ys.min())
    # mannequin chin: last wide skin row above the collar
    chin = collar - 6
    for y in range(collar - 1, top, -1):
        row = np.where(sk[y])[0]
        if len(row) and row.max() - row.min() > 120: chin = y; break
    al = np.where(fg, 255, 0); al[:chin - 4] = 0
    bodies.append({'img': rgba(c, al), 'cx': cx, 'chin': chin, 'top': top, 'feet': int(ys.max())})

def dye(im, hexcol, skin=None):
    a = np.asarray(im).astype(float).copy()
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 120) & (b > r + 50) & (b > g + 30) & (a[..., 3] > 0)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    a[..., :3][m] = np.clip(t * np.clip(lum / 0.42, 0, 1.6)[m][:, None], 0, 255)
    if skin:
        sm = (r > 190) & (g > 150) & (b > 115) & (r > b + 20) & (r - g < 70) & (a[..., 3] > 0) & ~m
        base = np.array([0xf8, 0xdc, 0xc0], float)
        s = np.array([int(skin[i:i + 2], 16) for i in (1, 3, 5)], float)
        a[..., :3][sm] = np.clip(a[..., :3][sm] * (s / base), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def figure(face, hair, body, hcol, skin=None):
    f, h, bd = faces[face], hairs[hair], bodies[body]
    W, H = 760, 1500
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox, oy = W / 2 - f['cx'], 480 - f['chin']
    # body scaled so its mannequin head height matches the bald face head height
    s = (f['chin'] - f['top']) / (bd['chin'] - bd['top'])
    bimg = bd['img'].resize((int(bd['img'].width * s), int(bd['img'].height * s)), Image.LANCZOS)
    out.alpha_composite(bimg, (int(W / 2 - bd['cx'] * s), int(480 - bd['chin'] * s)))
    out.alpha_composite(f['img'], (int(ox), int(oy)))
    hs, hdy = 1.16, -60
    himg = h['img'].resize((int(h['img'].width * hs), int(h['img'].height * hs)), Image.LANCZOS)
    out.alpha_composite(himg, (int(W / 2 - h['cx'] * hs), int(480 - h['chin'] * hs + hdy)))
    return dye(out, hcol, skin)

HAIR = ['#963d4e', '#292e36', '#745044', '#292e36', '#4e7998', '#292e36', '#c39754']
names = ['도원', '강재', '민서', '승준', '민재', '재민', '호현']
slim = {0, 2}
T = 300
rows = []
# row 1: everyone in their own hairstyle (도원 twice: bob and buns)
r1 = [figure(i, i, 0 if i in slim else 1, HAIR[i]) for i in range(7)] + [figure(0, 7, 0, HAIR[0])]
# row 2: swapped hairstyles
r2 = [figure(3, 2, 1, HAIR[3]), figure(2, 3, 0, HAIR[2]), figure(0, 6, 0, '#d07a95'), figure(6, 0, 1, HAIR[6]),
      figure(1, 7, 1, '#b7bcc9'), figure(4, 1, 1, '#527967'), figure(5, 4, 1, '#c39754'), figure(2, 7, 0, '#4e7998')]
# row 3: skin tones on 승준 and 민서
r3 = [figure(3, 3, 1, HAIR[3], t) for t in ['#fbe2cf', '#e8b48f', '#c98a5e', '#8d5a3b']] + \
     [figure(2, 2, 0, HAIR[2], t) for t in ['#fbe2cf', '#e8b48f', '#c98a5e', '#8d5a3b']]
sheet = Image.new('RGB', (8 * T, 3 * 400), (236, 232, 222))
for ri, row in enumerate([r1, r2, r3]):
    for j, im in enumerate(row):
        im = im.crop(im.getbbox()); im.thumbnail((T - 20, 390), Image.LANCZOS)
        sheet.paste(im, (j * T + (T - im.width) // 2, ri * 400 + 395 - im.height), im)
sheet.save(f'{S}/layers-sheet.png')
print('ok')
