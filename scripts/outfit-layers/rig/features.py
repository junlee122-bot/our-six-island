# Standardise a face layer: each eye (whole: lashes, white, iris, brow) moved to the template spacing and size.
import numpy as np
from scipy.ndimage import label, binary_dilation
from PIL import Image

TARGET_SEP_PER_HEAD = 0.40   # eye spacing / (skull top -> chin), measured on the original friends

def eye_groups(f, cx, eye_y, head_h):
    a = f[..., 3] > 0
    r, g, b = [f[..., i].astype(int) for i in range(3)]
    soft = (r > 200) & (g > 150) & (b > 140) & (r - g > 20) & (r - g < 90)   # blush / skin-ish tint
    strong = a & ~soft
    X = np.arange(a.shape[1])[None, :]
    left = np.zeros(a.shape, bool); right = np.zeros(a.shape, bool)
    for side, sel in ((left, X < cx - head_h * 0.03), (right, X > cx + head_h * 0.03)):
        st = strong & sel
        lab, n = label(binary_dilation(st, iterations=10) & sel)
        for k in range(1, n + 1):
            comp = lab == k
            ys, xs = np.where(comp & st)
            if len(ys) < 30: continue
            if not (eye_y - head_h * 0.30 < ys.mean() < eye_y + head_h * 0.12): continue
            side |= binary_dilation(comp & st, iterations=2) & a & sel
    return left, right

def paste_scaled(out, src, mask, dx, scale, centre):
    ys, xs = np.where(mask)
    if not len(ys): return
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    tile = src[y0:y1, x0:x1].copy(); tile[~mask[y0:y1, x0:x1]] = 0
    im = Image.fromarray(tile, 'RGBA').convert('RGBa')           # premultiplied: no fringes when resizing
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    im = im.resize((w, h), Image.LANCZOS).convert('RGBA')
    cxm, cym = centre
    out.alpha_composite(im, (round(cxm + (x0 - cxm) * scale + dx), round(cym + (y0 - cym) * scale)))

def respace(f, cx, eye_y, head_h, sep_now, scale=0.92):
    d = (sep_now - TARGET_SEP_PER_HEAD * head_h) / 2
    left, right = eye_groups(f, cx, eye_y, head_h)
    keep = f.copy(); keep[left | right] = 0
    out = Image.fromarray(keep, 'RGBA')
    for m, dx in ((left, d), (right, -d)):
        xs = np.where(m)[1]
        paste_scaled(out, f, m, dx, scale, (xs.mean(), eye_y))
    return np.asarray(out).copy(), round(d)
