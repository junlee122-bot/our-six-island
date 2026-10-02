# Layer split from the ORIGINAL art: bald face (edited original) + original hair (blue key) + shared body.
from PIL import Image
import numpy as np, json, sys
from scipy.ndimage import binary_dilation, label
S = sys.argv[1]; C = f'{S}/crops'
atlas = Image.open('public/assets/lounge/akatsuki-atlas.png').convert('RGB')
A = np.asarray(atlas).astype(int); W, H = atlas.size; cw, ch = W // 4, H // 2
meta = json.load(open(f'{C}/meta.json'))

def mag(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return (r > 170) & (b > 170) & (g < 110)

def blue_of(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return (b > 110) & (b > r + 40) & (b > g + 25)

def rgba(c, al):
    return Image.fromarray(np.dstack([np.clip(c, 0, 255).astype(np.uint8), (al * 255).astype(np.uint8)]), 'RGBA')

def eyes_of(a, lo, hi):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r < 120) & (g < 80) & (b < 60) & (r > g); m[:lo] = False; m[hi:] = False
    lab, n = label(m); sz = np.bincount(lab.ravel()); sz[0] = 0
    top = np.argsort(sz)[-2:]
    pts = sorted([np.argwhere(lab == t).mean(0)[::-1] for t in top], key=lambda p: p[0])
    return np.array(pts)

chars = []
for i in range(8):
    m = meta[i]; x0, y0, x1, y1 = m['box']; s = (x1 - x0) / 1024
    cx0, cy0 = (i % 4) * cw, (i // 4) * ch
    cell = A[cy0:cy0 + ch, cx0:cx0 + cw]
    fg = ~mag(cell); blue = blue_of(cell) & fg
    # eyes in cell coords (original)
    eyes = eyes_of(cell, m['chin'] - 300, m['chin'] - 60)
    # hair layer: blue key + its outline; brows (blue islands inside the face) stay with the face
    lab, n = label(blue); sz = np.bincount(lab.ravel())
    hair = blue.copy()
    for j in range(1, n + 1):
        if sz[j] < 5000:
            ys, xs = np.where(lab == j)
            if ys.mean() > eyes[:, 1].mean() - 120 and ys.mean() < eyes[:, 1].mean() - 20 and eyes[0, 0] - 60 < xs.mean() < eyes[1, 0] + 60:
                hair[lab == j] = False
    r, g, b = cell[..., 0], cell[..., 1], cell[..., 2]
    dark = (r + g + b) < 330
    outline = dark & binary_dilation(hair, iterations=4) & fg
    skin = (r > 200) & (g > 160) & (b > 120) & (r > b + 30)
    outline &= ~binary_dilation(skin, iterations=1) | binary_dilation(hair, iterations=2)
    hl = hair | outline
    hl[m['chin'] + 2:] &= binary_dilation(hair, iterations=3)[m['chin'] + 2:]
    bi = i if i < 7 else 0
    bald = np.asarray(Image.open(f'{C}/bald{bi}.png').convert('RGB').resize((x1 - x0, y1 - y0), Image.LANCZOS)).astype(int)
    if i == 7:
        d = None
    else:
        bm = np.zeros(fg.shape, bool)
        yy0, xx0 = y0 - cy0, x0 - cx0
        sub = mag(bald)
        ys_, xs_ = np.mgrid[0:sub.shape[0], 0:sub.shape[1]]
        ok = (ys_ + yy0 >= 0) & (ys_ + yy0 < ch) & (xs_ + xx0 >= 0) & (xs_ + xx0 < cw)
        bm[(ys_ + yy0)[ok], (xs_ + xx0)[ok]] = sub[ok]
        outside = bm & fg
        outside[m['chin'] - 40:] = False
        lab3, n3 = label(outside); sz3 = np.bincount(lab3.ravel()); keep3 = sz3 > 400; keep3[0] = False
        hl |= keep3[lab3]
    if i == 7:
        # buns: ribbons are cream islands next to the buns, above the eyes
        cream = (r > 225) & (g > 210) & (b > 160) & ~skin & fg
        zone = np.zeros(fg.shape, bool); zone[:int(eyes[:, 1].mean()) - 40] = True
        hl |= binary_dilation(cream & zone & binary_dilation(hair, iterations=25), iterations=2) & fg & zone
    lab2, n2 = label(hl); sz2 = np.bincount(lab2.ravel()); small = sz2 < 300; small[0] = False
    hl[small[lab2]] = False
    hair_img = rgba(cell, hl.astype(float))
    face_img = None
    if i < 7:
        bald = np.asarray(Image.open(f'{C}/bald{i}.png').convert('RGB')).astype(int)
        bald_cell = Image.fromarray(bald.astype(np.uint8)).resize((x1 - x0, y1 - y0), Image.LANCZOS)
        bc = np.asarray(bald_cell).astype(int)
        al = (~mag(bc)).astype(float)
        # keep the head only: rows above the chin cut
        chin_local = m['chin'] - (y0 - cy0)
        al[chin_local + 4:] = 0
        rr, gg, bb = bc[..., 0], bc[..., 1], bc[..., 2]
        sk = (rr > 190) & (gg > 150) & (bb > 115) & (rr > bb + 20)
        # head silhouette below the eyes: the skin (face, ears, neck) and the outline hugging it
        from scipy.ndimage import binary_fill_holes
        lab_s, ns = label(sk)
        cy_local = chin_local - 60; cx_local = m['fcx'] - (x0 - cx0)
        core = lab_s == lab_s[cy_local, cx_local] if lab_s[cy_local, cx_local] else sk
        sil = binary_dilation(binary_fill_holes(binary_dilation(core | (sk & binary_dilation(core, iterations=12)), iterations=2)), iterations=3)
        eye_local = int(chars_eye_y) if False else chin_local - 200
        below = np.zeros(al.shape, bool); below[eye_local:] = True
        al[below & ~sil] = 0
        al[chin_local + 3:] = 0
        face = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        face.alpha_composite(rgba(bc, al), (x0 - cx0, y0 - cy0))
        face_img = face
    ys, xs = np.where(fg)
    chars.append(dict(hair=hair_img, face=face_img, chin=m['chin'], fcx=m['fcx'], eyes=eyes, feet=int(ys.max()),
                      torso=fg & ~blue))

# bodies (first trial: shared knit bodies, mannequin head removed above the collar)
B = np.asarray(Image.open(f'{S}/bodies.png').convert('RGB')).astype(int); bw = B.shape[1]
bodies = []
for half in (0, 1):
    c = B[:, half * bw // 2:(half + 1) * bw // 2]
    fg = ~mag(c); r, g, b = c[..., 0], c[..., 1], c[..., 2]
    white = (r > 235) & (g > 235) & (b > 235)
    ys, xs = np.where(fg); cx = int(np.median(xs[ys < ys.min() + 200]))
    collar = int(np.where(white[:, cx - 25:cx + 25].sum(1) > 10)[0].min())
    cut = collar - 34
    al = fg.astype(float); al[:cut] = 0
    bodies.append(dict(img=rgba(c, al), cut=cut, feet=int(ys.max()), cx=cx, collar=collar))

def width_at(mask, y, cx):
    row = np.where(mask[y])[0]; row = row[np.abs(row - cx) < 260]
    return row.max() - row.min() if len(row) else 1

def place_body(out, ci, bi):
    c, bd = chars[ci], bodies[bi]
    s = (c['feet'] - c['chin'] - 14) / (bd['feet'] - bd['collar'])
    ow = np.median([width_at(c['torso'], c['chin'] + d, c['fcx']) for d in range(150, 260, 10)])
    bm = np.asarray(bd['img'])[..., 3] > 0
    bwid = np.median([width_at(bm, int(bd['collar'] + d / s), bd['cx']) for d in range(150, 260, 10)])
    sx = min(max(ow / bwid, s), s * 1.35)
    im = bd['img'].resize((int(bd['img'].width * sx), int(bd['img'].height * s)), Image.LANCZOS)
    out.alpha_composite(im, (int(c['fcx'] - bd['cx'] * sx), int(c['chin'] + 14 - bd['collar'] * s)))

def place_hair(out, fi, hi):
    # move hair of hi onto the face of fi by matching eye centres and eye spacing
    ef, eh = chars[fi]['eyes'], chars[hi]['eyes']
    sc = np.linalg.norm(ef[1] - ef[0]) / np.linalg.norm(eh[1] - eh[0])
    mf, mh = ef.mean(0), eh.mean(0)
    im = chars[hi]['hair']
    im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    out.alpha_composite(im, (int(mf[0] - mh[0] * sc), int(mf[1] - mh[1] * sc)))

def dye(im, hexcol, skin=None):
    a = np.asarray(im).astype(float).copy(); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 110) & (b > r + 40) & (b > g + 25) & (a[..., 3] > 0)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    a[..., :3][m] = np.clip(t * np.clip(lum / 0.42, 0, 1.6)[m][:, None], 0, 255)
    if skin:
        sm = (r > 190) & (g > 150) & (b > 115) & (r > b + 20) & (r - g < 70) & (a[..., 3] > 0) & ~m
        base = np.array([0xf6, 0xd8, 0xc0], float); s = np.array([int(skin[i:i + 2], 16) for i in (1, 3, 5)], float)
        a[..., :3][sm] = np.clip(a[..., :3][sm] * (s / base), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

FACE_OF = [0, 1, 2, 3, 4, 5, 6, 0]
SLIM = {0, 2, 7}
def figure(ci, hi, hcol, skin=None):
    out = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    place_body(out, ci, 0 if ci in SLIM else 1)
    out.alpha_composite(chars[FACE_OF[ci]]['face'] if ci < 7 else chars[0]['face'], (0, 0)) if ci < 7 else None
    if ci == 7:
        # 도원 (buns cell) uses 도원's bald face moved onto this cell
        f = chars[0]['face']; d = chars[7]['eyes'].mean(0) - chars[0]['eyes'].mean(0)
        out.alpha_composite(f, (int(d[0]), int(d[1])))
    place_hair(out, ci, hi)
    return dye(out, hcol, skin)

HAIR = ['#963d4e', '#292e36', '#745044', '#292e36', '#4e7998', '#292e36', '#c39754', '#963d4e']
T = 300
r0 = []
for i in range(8):
    o = Image.fromarray(A[(i // 4) * ch:(i // 4 + 1) * ch, (i % 4) * cw:(i % 4 + 1) * cw].astype(np.uint8))
    oa = np.asarray(o.convert('RGBA')).copy(); oa[..., 3] = np.where(mag(np.asarray(o).astype(int)), 0, 255)
    r0.append(dye(Image.fromarray(oa), HAIR[i]))
r1 = [figure(i, i, HAIR[i]) for i in range(8)]
r2 = [figure(3, 2, HAIR[3]), figure(2, 3, HAIR[2]), figure(0, 6, '#d07a95'), figure(6, 0, HAIR[6]),
      figure(1, 7, '#b7bcc9'), figure(4, 1, '#527967'), figure(5, 4, '#c39754'), figure(2, 7, '#4e7998')]
r3 = [figure(3, 3, HAIR[3], t) for t in ['#fbe2cf', '#e8b48f', '#c98a5e', '#8d5a3b']] + \
     [figure(2, 2, HAIR[2], t) for t in ['#fbe2cf', '#e8b48f', '#c98a5e', '#8d5a3b']]
sheet = Image.new('RGB', (8 * T, 4 * 400), (236, 232, 222))
for ri, row in enumerate([r0, r1, r2, r3]):
    for j, im in enumerate(row):
        im = im.crop(im.getbbox()); im.thumbnail((T - 20, 390), Image.LANCZOS)
        sheet.paste(im, (j * T + (T - im.width) // 2, ri * 400 + 395 - im.height), im)
sheet.save(f'{S}/layers2-sheet.png'); print('ok')

if len(sys.argv) > 2 and sys.argv[2] == 'zoom':
    z = Image.new('RGB', (4 * 400, 2 * 400), (236, 232, 222))
    for j, i in enumerate([0, 3, 2, 6]):
        c = chars[i]; y = c['chin']; x = c['fcx']
        box = (x - 200, y - 260, x + 200, y + 140)
        o = r0[i].crop(box); n = r1[i].crop(box)
        z.paste(o, (j * 400, 0), o); z.paste(n, (j * 400, 400), n)
    z.save(f'{S}/zoom.png')
