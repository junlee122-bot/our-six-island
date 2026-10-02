# Character rig assembly: shared base + per-person face + hairstyles (each drawn as an edit, lifted by difference).
import sys, numpy as np
from PIL import Image
from scipy.ndimage import binary_opening, binary_dilation, binary_erosion, binary_fill_holes, label
sys.path.insert(0, '.')
from extract import load, magenta, register, part
from features import respace

base = load('base3.png'); H, W = base.shape[:2]
fg = ~magenta(base)
rows = fg.sum(1); TOP = np.where(rows > 0)[0].min()
NECK = TOP + np.argmin(rows[TOP + 200: TOP + 700]) + 200
head = np.zeros(fg.shape, bool); head[:NECK] = fg[:NECK]
HEAD_SIL = binary_fill_holes(binary_dilation(head, iterations=2))
FACE_ZONE = np.zeros(fg.shape, bool); FACE_ZONE[:NECK + 10] = True
BELOW = (np.arange(H)[:, None] > NECK + 250)
CHIN, EYE_Y, CX = 822, 655, 675
HEAD_H = CHIN - TOP
cols = np.where(HEAD_SIL[EYE_Y - 120])[0]
EAR_FREE = np.zeros(fg.shape, bool); EAR_FREE[:, cols.min() + 42:cols.max() - 42] = True
BASE = np.dstack([base, fg * 255]).astype(np.uint8)

def eye_sep(f):
    a = f[..., 3] > 0; e = a & (f[..., :3].astype(int).sum(-1) < 250)
    e[:EYE_Y - 70] = False; e[EYE_Y + 70:] = False
    out = []
    for side in (np.arange(W) < CX, np.arange(W) > CX):
        m = e & side[None, :]
        lab, n = label(m); sz = np.bincount(lab.ravel()); sz[0] = 0
        out.append(np.argwhere(lab == sz.argmax())[:, 1].mean())
    return out[1] - out[0]

def face_part(path):
    e, _ = register(base, load(path), mask=(fg & BELOW).astype(np.uint8))
    inner = binary_erosion(HEAD_SIL, iterations=16)
    # the skull disc only (ears sit outside it): left/right limits from the head width at eye level
    f = part(base, e, keep=inner & FACE_ZONE & EAR_FREE, thresh=12, grow=1, min_area=40)
    f = drop_contours(f)
    f, d = respace(f, CX, EYE_Y, HEAD_H, eye_sep(f))
    return f, e

def drop_contours(f):
    # thin tall dark strokes (the edit's own cheek outline) are not features
    f = f.copy(); a = f[..., 3] > 0
    dark = a & (f[..., :3].astype(int).sum(-1) < 380)
    lab, n = label(dark)
    for k in range(1, n + 1):
        ys, xs = np.where(lab == k)
        h, w = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
        thin = len(ys) / max(h, w) < 9
        if thin and h > 1.4 * w and h > 45 and abs(xs.mean() - CX) > HEAD_H * 0.22:
            m = binary_dilation(lab == k, iterations=3)
            f[..., 3][m & ~(f[..., :3].astype(int).sum(-1) > 600)] = 0
            f[..., 3][lab == k] = 0
    return f

def hair_part(path, face_img):
    e, _ = register(face_img, load(path), mask=(fg & ~binary_dilation(HEAD_SIL, iterations=60) & BELOW).astype(np.uint8))
    hp = part(face_img, e, keep=None, thresh=40, grow=2, min_area=300)
    r, g, b = [e[..., i].astype(int) for i in range(3)]
    key = (b > 60) & (b > r + 30) & (b > g + 20)
    keep = binary_dilation(key, iterations=4) & (hp[..., 3] > 0)
    keep |= (hp[..., 3] > 0) & ~HEAD_SIL & ~binary_dilation(key, iterations=4) & (np.abs(r - g) > 25)   # ribbons/ties outside the head
    hp[..., 3] = np.where(keep, hp[..., 3], 0)
    hp = despill(hp)
    a = hp[..., 3] > 0
    band = np.zeros_like(a); band[EYE_Y - 120:EYE_Y - 20, CX - 220:CX + 220] = True
    thick = binary_opening(a, structure=np.ones((22, 1), bool))
    a &= ~(band & ~thick)                      # thin strokes at brow height are the edit's redrawn eyebrows
    lab, n = label(a & HEAD_SIL); sz = np.bincount(lab.ravel()); sz[0] = 0
    a &= ~np.isin(lab, np.where((sz > 0) & (sz < 4000))[0])   # stray brow strokes the hair edit redrew are not hair
    front = hp.copy(); front[..., 3] = (a & HEAD_SIL) * 255
    back = hp.copy(); back[..., 3] = (a & ~HEAD_SIL) * 255
    return back, front

def despill(p):
    # pixels at the part edge mixed with the magenta backdrop: drop the strongly mixed, pull the rest to dark ink
    p = p.copy(); a = p[..., 3] > 0
    r, g, b = [p[..., i].astype(int) for i in range(3)]
    edge = a & binary_dilation(~a, iterations=6)
    mix = (r > g + 30) & (b > g + 30) & (r > 70)
    strong = edge & mix & (r > 200) & (b > 200)
    p[..., 3][strong] = 0
    soft = edge & mix & ~strong
    soft |= a & ~strong & (r > g + 25) & (b > g + 25) & (r * 2 > b)   # purple spill anywhere in the hair -> blue, so the dye catches it
    p[..., 0][soft] = np.minimum(g[soft], r[soft] // 3).astype(np.uint8)   # take the magenta's red out -> blue/ink
    p[..., 2][soft] = np.maximum(b[soft], g[soft] + 60).astype(np.uint8)
    return p

def brows(f):
    b = f.copy(); r, g, bl = [f[..., i].astype(int) for i in range(3)]
    m = (bl > 110) & (bl > r + 40) & (bl > g + 25) & (f[..., 3] > 0)
    b[..., 3] = np.where(m, 120, 0); return b

def dye(im, hexcol):
    a = np.asarray(im).astype(float).copy(); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 60) & (b > r + 30) & (b > g + 20) & (a[..., 3] > 0)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    a[..., :3][m] = np.clip(t * np.clip(lum / 0.42, 0, 1.6)[m][:, None], 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def compose(face, hair, col):
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if hair: out.alpha_composite(Image.fromarray(hair[0]))
    out.alpha_composite(Image.fromarray(BASE))
    out.alpha_composite(Image.fromarray(face))
    if hair:
        out.alpha_composite(Image.fromarray(hair[1])); out.alpha_composite(Image.fromarray(brows(face)))
    return dye(out, col)

def head_tile(im, w=420, h=470):
    return im.crop((W // 2 - 360, TOP - 60, W // 2 + 360, NECK + 220)).resize((w, h))
