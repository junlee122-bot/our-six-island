import sys, numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_fill_holes
sys.path.insert(0, '.')
from extract import load, magenta, register, part
base = load('base2-b.png'); H, W = base.shape[:2]
fg = ~magenta(base)
rows = fg.sum(1); ys = np.where(rows > 0)[0]; top = ys.min()
neck = top + np.argmin(rows[top + 200: top + 700]) + 200
head = np.zeros(fg.shape, bool); head[:neck] = fg[:neck]
head_sil = binary_fill_holes(binary_dilation(head, iterations=2))
face_zone = np.zeros(fg.shape, bool); face_zone[:neck + 10] = True
below = (np.arange(H)[:, None] > neck + 250)
def get(name, keep, reg, **kw):
    e, w = register(base, load(name + '.png'), mask=reg.astype(np.uint8)); print(name, w.round(3).tolist())
    return part(base, e, keep=keep, **kw)
feat = {n: get(f'b2-feat-{n}', head_sil & face_zone, fg & below, thresh=12, grow=1, min_area=40) for n in ['dowon', 'seungjun']}
hp = get('b2-hair-bob', None, fg & ~binary_dilation(head_sil, iterations=60) & below, thresh=40, grow=2, min_area=300)
a = hp[..., 3] > 0
hf = hp.copy(); hf[..., 3] = (a & head_sil) * 255; hb = hp.copy(); hb[..., 3] = (a & ~head_sil) * 255
baseimg = np.dstack([base, fg * 255]).astype(np.uint8)
def dye(im, hexcol):
    a = np.asarray(im).astype(float).copy(); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 110) & (b > r + 40) & (b > g + 25) & (a[..., 3] > 0)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    a[..., :3][m] = np.clip(t * np.clip(lum / 0.42, 0, 1.6)[m][:, None], 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')
def compose(face, hair, col):
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if hair: out.alpha_composite(Image.fromarray(hb))
    out.alpha_composite(Image.fromarray(baseimg))
    out.alpha_composite(Image.fromarray(feat[face]))
    if hair: out.alpha_composite(Image.fromarray(hf))
    return dye(out, col)
# originals for comparison (head crops)
orig = [Image.open(f'../crops/head{i}.png').convert('RGB') for i in (0, 3)]
tiles = [orig[0], compose('dowon', True, '#4f6fd6'), compose('dowon', True, '#963d4e'),
         orig[1], compose('seungjun', True, '#292e36'), compose('seungjun', False, '#292e36')]
z = Image.new('RGB', (6 * 380, 420), (236, 232, 222))
for j, t in enumerate(tiles):
    if t.mode == 'RGBA':
        t = t.crop((W // 2 - 330, top - 40, W // 2 + 330, neck + 200))
    t = t.resize((380, 420)) if t.mode == 'RGBA' else t.crop((0, 60, 1024, 1024)).resize((380, 420))
    z.paste(t, (j * 380, 0), t if t.mode == 'RGBA' else None)
z.save('b2-compare.png'); print('ok')
