import sys, numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_fill_holes, label
sys.path.insert(0, '.')
from extract import load, magenta, register, part

base = load('base-a.png'); H, W = base.shape[:2]
fg = ~magenta(base)
r, g, b = base[..., 0], base[..., 1], base[..., 2]
skin = (r > 200) & (g > 165) & (b > 120) & (r > b + 25) & fg
# head = everything above the neck's narrowest row
rows = fg.sum(1); ys = np.where(rows > 0)[0]; top = ys.min()
neck = top + np.argmin(rows[top + 200: top + 700]) + 200
head = np.zeros(fg.shape, bool); head[:neck] = fg[:neck]
head_sil = binary_fill_holes(binary_dilation(head, iterations=2))
face_zone = np.zeros(fg.shape, bool); face_zone[:neck + 10] = True
body_zone = ~face_zone | ~binary_dilation(head_sil, iterations=6)
print('neck row', neck)

def get(name, keep, reg=None, **kw):
    e, w = register(base, load(name + '.png'), mask=(reg if reg is not None else ~magenta(base)).astype(np.uint8))
    print(name, 'warp', w.round(3).tolist())
    return part(base, e, keep=keep, **kw)

feat = {n: get(f'feat-{n}', binary_dilation(head_sil, iterations=-0) & face_zone, thresh=30, grow=1, min_area=40) for n in ['dowon', 'minseo']}
hairs = {}
for n in ['bob'] + (['long'] if __import__('os').path.exists('hair-long.png') else []):
    hp = get(f'hair-{n}', None, reg=fg & ~binary_dilation(head_sil, iterations=60) & (np.arange(H)[:, None] > neck + 250), thresh=40, grow=2, min_area=300)
    a = hp[..., 3] > 0
    front = a & head_sil; back = a & ~head_sil
    f = hp.copy(); f[..., 3] = front * 255; bk = hp.copy(); bk[..., 3] = back * 255
    hairs[n] = (bk, f)
outfit = get('outfit-knit', body_zone, reg=head_sil, thresh=40, grow=2, min_area=300)
for k, v in {'feat-dowon': feat['dowon'], 'feat-minseo': feat['minseo'], 'outfit-knit': outfit}.items():
    Image.fromarray(v, 'RGBA').save(f'part-{k}.png')
for n, (bk, f) in hairs.items():
    Image.fromarray(bk, 'RGBA').save(f'part-hair-{n}-back.png'); Image.fromarray(f, 'RGBA').save(f'part-hair-{n}-front.png')
baseimg = np.dstack([base, fg * 255]).astype(np.uint8)
Image.fromarray(baseimg, 'RGBA').save('part-base.png')

def dye(im, hexcol, skin_hex=None):
    a = np.asarray(im).astype(float).copy(); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 110) & (b > r + 40) & (b > g + 25) & (a[..., 3] > 0)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    t = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)], float)
    a[..., :3][m] = np.clip(t * np.clip(lum / 0.42, 0, 1.6)[m][:, None], 0, 255)
    if skin_hex:
        sm = (r > 190) & (g > 150) & (b > 115) & (r > b + 20) & (r - g < 70) & (a[..., 3] > 0) & ~m
        base_c = np.array([0xfb, 0xe2, 0xc8], float); s = np.array([int(skin_hex[i:i + 2], 16) for i in (1, 3, 5)], float)
        a[..., :3][sm] = np.clip(a[..., :3][sm] * (s / base_c), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def compose(face, hair, hcol, outfit_on=True, skin_hex=None):
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if hair: out.alpha_composite(Image.fromarray(hairs[hair][0]))
    out.alpha_composite(Image.fromarray(baseimg))
    if outfit_on: out.alpha_composite(Image.fromarray(outfit))
    if face: out.alpha_composite(Image.fromarray(feat[face]))
    if hair: out.alpha_composite(Image.fromarray(hairs[hair][1]))
    return dye(out, hcol, skin_hex)

looks = [('dowon', 'bob', '#963d4e', True, None), ('minseo', 'bob', '#745044', True, None),
         ('dowon', 'bob', '#963d4e', False, None), ('dowon', 'bob', '#292e36', True, '#c98a5e')]
if 'long' in hairs:
    looks += [('minseo', 'long', '#745044', True, None), ('dowon', 'long', '#d07a95', True, None)]
T = 380
sheet = Image.new('RGB', (len(looks) * T, 600), (236, 232, 222))
for j, l in enumerate(looks):
    im = compose(*l); im = im.crop(im.getbbox()); im.thumbnail((T - 20, 580), Image.LANCZOS)
    sheet.paste(im, (j * T + (T - im.width) // 2, 590 - im.height), im)
sheet.save('rig-sheet.png')
# zoomed heads
z = Image.new('RGB', (len(looks) * 420, 460), (236, 232, 222))
for j, l in enumerate(looks):
    im = compose(*l).crop((W // 2 - 360, top - 40, W // 2 + 360, neck + 180)).resize((420, 460))
    z.paste(im, (j * 420, 0), im)
z.save('rig-heads.png'); print('ok')
