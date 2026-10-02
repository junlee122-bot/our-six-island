import numpy as np
from PIL import Image, ImageDraw
import rig3 as R
names = ['dowon', 'minseo', 'gangjae', 'minjae', 'seungjun']
cols = {'dowon': '#7a2638', 'minseo': '#3b2a22', 'gangjae': '#2a2220', 'minjae': '#3a2b24', 'seungjun': '#1e1a1c'}
R.respace = lambda f, *a, **k: (f, 0)
F, Hh = {}, {}
for n in names:
    F[n] = R.face_part(f'n-face-{n}.png')
    Hh[n] = R.hair_part(f'n-hair-{n}.png', F[n][1])
row1 = [R.head_tile(R.compose(F[n][0], Hh[n], cols[n])) for n in names]
swap = [('seungjun', 'minseo', '#c9a36b'), ('minseo', 'seungjun', '#5a7bd0'), ('dowon', 'gangjae', '#6b4a8a'), ('minjae', 'dowon', '#d06a8a'), ('gangjae', 'minjae', '#8a6a3a')]
row2 = [R.head_tile(R.compose(F[f][0], Hh[h], c)) for f, h, c in swap]
npc = Image.open('/home/user/our-six-island/public/assets/lounge/npc-lux.webp').convert('RGBA')
bb = npc.getbbox(); w = bb[2] - bb[0]
nt = npc.crop((bb[0], bb[1], bb[2], bb[1] + int(w * 1.1))).resize((420, 470))
out = Image.new('RGBA', (420 * 6, 940), (235, 228, 214, 255))
for k, t in enumerate(row1): out.alpha_composite(t, (k * 420, 0))
for k, t in enumerate(row2): out.alpha_composite(t, (k * 420, 470))
out.alpha_composite(nt, (5 * 420, 0))
out.save('cmp-n-final.png')
for n in names: R.compose(F[n][0], Hh[n], cols[n]).save(f'n-comp-{n}.png')
