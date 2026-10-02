# Template-diff part extraction: register an edited copy of the base to the base, keep what changed.
import cv2, numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_erosion, binary_fill_holes, label

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)

def magenta(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 170) & (b > 170) & (g < 110)

def register(base, edit, mask=None):
    """Affine ECC on grey images; returns edit warped onto base."""
    g0 = cv2.cvtColor(base.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    g1 = cv2.cvtColor(edit.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
    m = None if mask is None else mask.astype(np.uint8)
    try:
        _, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, crit, m, 5)
    except cv2.error:
        pass
    out = cv2.warpAffine(edit, warp, (base.shape[1], base.shape[0]), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 0, 255))
    return out, warp

def part(base, edit, keep=None, thresh=38, grow=2, min_area=200):
    """Pixels of `edit` (registered) that differ from `base`; returns RGBA array."""
    d = np.abs(edit - base).max(-1)
    m = (d > thresh) & ~magenta(edit)
    m = binary_erosion(binary_dilation(m, iterations=2), iterations=1)
    if keep is not None: m &= keep
    lab, n = label(m); sz = np.bincount(lab.ravel()); small = sz < min_area; small[0] = False
    m[small[lab]] = False
    if grow:
        holes = binary_fill_holes(m) & ~m
        hl, hn = label(holes); hs = np.bincount(hl.ravel()); smallh = hs < 1500; smallh[0] = False
        m |= smallh[hl] & ~magenta(edit)
    if grow:
        # take in the edit's own outline pixels hugging the part
        dark = edit.sum(-1) < 300
        m |= binary_dilation(m, iterations=grow) & dark & ~magenta(edit)
    return np.dstack([edit, m.astype(np.float32) * 255]).astype(np.uint8)
