# Compose from exported parts, the way the game will: eye spacing / height / size are user sliders.
import json, numpy as np
from PIL import Image
import rig3 as R
P = 'parts3'; M = json.load(open(f'{P}/layout.json')); W, H = M['size']
def L(n): return Image.open(f'{P}/{n}.png').convert('RGBA'), (M[n]['x'], M[n]['y'])
def put(c, n, dx=0, dy=0, s=1.0, alpha=None):
    im, (x, y) = L(n)
    if alpha is not None:
        a = np.asarray(im).copy(); a[..., 3] = (a[..., 3] * alpha).astype(np.uint8); im = Image.fromarray(a)
    if s != 1.0:
        cx, cy = x + im.width / 2, y + im.height / 2
        im = im.convert('RGBa').resize((round(im.width * s), round(im.height * s)), Image.LANCZOS).convert('RGBA')
        x, y = cx - im.width / 2, cy - im.height / 2
    c.alpha_composite(im, (round(x + dx), round(y + dy)))
def brows_only(n):
    im, xy = L(n); a = np.asarray(im).copy(); r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[..., 3] = np.where((b > 110) & (b > r + 40) & (b > g + 25), 120, 0).astype(np.uint8); return Image.fromarray(a), xy
def char(face, hair, col, sep=0, up=0, size=1.0):
    c = Image.new('RGBA', (W, H))
    put(c, f'hair-{hair}-back'); put(c, 'base'); put(c, f'face-{face}-rest')
    put(c, f'face-{face}-eyeL', -sep, -up, size); put(c, f'face-{face}-eyeR', sep, -up, size)
    put(c, f'hair-{hair}-front')
    for side, d in (('eyeL', -sep), ('eyeR', sep)):
        im, (x, y) = brows_only(f'face-{face}-{side}'); c.alpha_composite(im, (round(x + d), round(y - up)))
    return R.dye(c, col)
def tile(im): return im.crop((W // 2 - 180, 130, W // 2 + 180, 470))
if __name__ == '__main__':
    var = [(-12, 0, 1), (0, 0, 1), (12, 0, 1), (0, 10, 1), (0, -10, 1), (0, 0, 1.12), (-6, 4, 0.9)]
    rows = [('seungjun', 'seungjun', '#1e1a1c'), ('dowon', 'dowon', '#7a2638')]
    out = Image.new('RGBA', (360 * len(var), 340 * len(rows)), (235, 228, 214, 255))
    for j, (f, h, col) in enumerate(rows):
        for i, (s, u, z) in enumerate(var): out.alpha_composite(tile(char(f, h, col, s, u, z)), (i * 360, j * 340))
    out.save('cmp-eye-sliders.png')
