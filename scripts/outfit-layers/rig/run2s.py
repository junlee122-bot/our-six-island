# 7-character style faces on base2-b, hair carried over from the base3 parts (head scaled 1.048).
import numpy as np
from PIL import Image
import rig as R2
import rig3 as R3
R2.respace = lambda f, *a, **k: (f, 0); R3.respace = R2.respace
def carry(layer):
    im = Image.fromarray(layer, 'RGBA').convert('RGBa'); s = 1.048
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS).convert('RGBA')
    out = Image.new('RGBA', (R2.W, R2.H)); out.alpha_composite(im, (round(677 - 675 * s), round(326 - 326 * s)))
    return np.asarray(out).copy()
cols = {'dowon': '#7a2638', 'seungjun': '#1e1a1c'}
tiles = []
for n in cols:
    f, fi = R2.face_part(f's-face-{n}.png')
    b, fr = R3.hair_part(f'n-hair-{n}.png', R3.face_part(f'n-face-{n}.png')[1])
    tiles.append(R2.head_tile(R2.compose(f, (carry(b), carry(fr)), cols[n])))
    tiles.append(R3.head_tile(R3.compose(R3.face_part(f'n-face-{n}.png')[0], (b, fr), cols[n])))
o = Image.new('RGBA', (420 * len(tiles), 470), (235, 228, 214, 255))
for i, t in enumerate(tiles): o.alpha_composite(t, (i * 420, 0))
o.save('cmp-s.png')
