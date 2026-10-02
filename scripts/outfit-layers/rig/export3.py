# Export each friend as separate layers (base, hair back/front, eye L/R incl. brow, rest of face) + offsets json.
import json, os, sys, numpy as np
from PIL import Image
import rig3 as R
from features import eye_groups
R.respace = lambda f, *a, **k: (f, 0)
OUT = 'parts3'; os.makedirs(OUT, exist_ok=True)
S = 0.5
def save(arr, name, meta):
    im = Image.fromarray(arr, 'RGBA').convert('RGBa')
    im = im.resize((round(R.W * S), round(R.H * S)), Image.LANCZOS).convert('RGBA')
    bb = im.getbbox()
    if not bb: return
    im.crop(bb).save(f'{OUT}/{name}.png', optimize=True)
    meta[name] = {'x': bb[0], 'y': bb[1]}
meta = {'size': [round(R.W * S), round(R.H * S)], 'eyeY': round(R.EYE_Y * S), 'cx': round(R.CX * S)}
save(R.BASE, 'base', meta)
names = [n for n in sys.argv[1:]]
for n in names:
    face, fimg = R.face_part(f'n-face-{n}.png')
    L, Rm = eye_groups(face, R.CX, R.EYE_Y, R.HEAD_H)
    for nm, m in (('eyeL', L), ('eyeR', Rm)):
        x = face.copy(); x[..., 3] = np.where(m, x[..., 3], 0); save(x, f'face-{n}-{nm}', meta)
    x = face.copy(); x[..., 3] = np.where(L | Rm, 0, x[..., 3]); save(x, f'face-{n}-rest', meta)
    if os.path.exists(f'n-hair-{n}.png'):
        b, fr = R.hair_part(f'n-hair-{n}.png', fimg)
        save(b, f'hair-{n}-back', meta); save(fr, f'hair-{n}-front', meta)
json.dump(meta, open(f'{OUT}/layout.json', 'w'), indent=1)
