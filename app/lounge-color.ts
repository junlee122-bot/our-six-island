export type RGB = readonly [number, number, number];

// Saved and shared looks accept plain six-digit colors only, never CSS expressions.
export function readColorHex(value: unknown): string | undefined {
  return typeof value === 'string' &&
    value.length === 7 &&
    /^#[\da-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : undefined;
}

export function colorRgb(hex: string): RGB {
  const color = readColorHex(hex);
  if (!color) throw new TypeError('Invalid RGB color');
  return [1, 3, 5].map((i) =>
    parseInt(color.slice(i, i + 2), 16),
  ) as unknown as RGB;
}

export function rgbColor(rgb: readonly number[]): string {
  if (
    rgb.length !== 3 ||
    rgb.some((value) => !Number.isInteger(value) || value < 0 || value > 255)
  )
    throw new RangeError('RGB channels must be integers from 0 to 255');
  return '#' + rgb.map((value) => value.toString(16).padStart(2, '0')).join('');
}

export const DEFAULT_SKIN_COLOR = '#edbd9d';

export type SkinMask = { pixels: Uint8Array; luminance: number };
type SkinAnchors = {
  cx: number;
  eyes: number;
  head: number;
  raisedHands?: boolean;
  bareLegs?: boolean;
  bareShoulders?: boolean;
  collared?: boolean;
  shortSleeveTunic?: boolean;
};
const luminance = (r: number, g: number, b: number) =>
  r * 0.21 + g * 0.72 + b * 0.07;

// Each sheet encodes dyeable hair in blue. Follow that silhouette from the head,
// rather than changing every blue pixel (denim, jackets and costume ties are blue too).
export function createHairMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  anchors: Pick<SkinAnchors, 'cx' | 'eyes' | 'head'>,
): Uint8Array {
  const size = width * height,
    pixels = new Uint8Array(size),
    seen = new Uint8Array(size),
    queue = new Int32Array(size);
  for (let start = 0; start < size; start++) {
    const k = start * 4;
    if (
      seen[start] ||
      data[k + 3] === 0 ||
      data[k + 2] <= Math.max(data[k], data[k + 1]) * 1.12
    )
      continue;
    let count = 1,
      attached = false,
      maxY = 0;
    queue[0] = start;
    seen[start] = 1;
    for (let n = 0; n < count; n++) {
      const point = queue[n],
        x = point % width,
        y = Math.floor(point / width);
      maxY = Math.max(maxY, y);
      if (y <= anchors.eyes && Math.abs(x - anchors.cx) <= anchors.head * 0.65)
        attached = true;
      const visit = (next: number) => {
        if (next < 0 || next >= size || seen[next]) return;
        const q = next * 4;
        if (
          data[q + 3] === 0 ||
          data[q + 2] <= Math.max(data[q], data[q + 1]) * 1.12
        )
          return;
        seen[next] = 1;
        queue[count++] = next;
      };
      if (x > 0) visit(point - 1);
      if (x + 1 < width) visit(point + 1);
      visit(point - width);
      visit(point + width);
    }
    // The dark outline behind an ear can disconnect a small nape lock from the
    // crown. Keep blue components wholly inside the head's vertical extent too.
    if (attached || maxY <= anchors.eyes + anchors.head * 0.36)
      for (let n = 0; n < count; n++) pixels[queue[n]] = 1;
  }
  return pixels;
}

// Determine skin from the untouched figure, never from the user's hair/top dyes.
// Warm clothing can share skin hues, so face, arms and exposed legs have separate
// source-space regions. Raised hands exist only in legacy wave frames.
export function createSkinMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  anchors: SkinAnchors,
): SkinMask {
  const { cx, eyes, head } = anchors;
  const size = width * height;
  const pixels = new Uint8Array(size);
  let top = height,
    bottom = 0;
  const faceSamples: number[][] = [[], [], []];
  for (let i = 0; i < size; i++) {
    const k = i * 4;
    if (data[k + 3] < 64) continue;
    const x = i % width,
      y = Math.floor(i / width);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    const [r, g, b] = [data[k], data[k + 1], data[k + 2]];
    if (
      Math.abs(x - cx) < head * 0.32 &&
      y > eyes + head * 0.06 &&
      y < eyes + head * 0.27 &&
      r >= 185 &&
      g >= 100 &&
      b >= 45 &&
      r - g >= 18 &&
      g - b >= 17
    ) {
      [r, g, b].forEach((channel, index) => faceSamples[index].push(channel));
    }
  }
  const reference =
    faceSamples[0].length >= 8
      ? faceSamples.map(
          (values) =>
            values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        )
      : [...colorRgb(DEFAULT_SKIN_COLOR)];
  const sourceLight = luminance(reference[0], reference[1], reference[2]);
  const bodyHeight = Math.max(1, bottom - top);
  const faceBottom = Math.min(top + bodyHeight * 0.4, eyes + head * 0.25);
  const warm = new Uint8Array(size),
    candidates = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const k = i * 4,
      r = data[k],
      g = data[k + 1],
      b = data[k + 2];
    if (
      data[k + 3] < 32 ||
      r < 100 ||
      g < 60 ||
      b < 30 ||
      r - g < 12 ||
      g - b < 7 ||
      g / r < 0.5
    )
      continue;
    const x = i % width,
      y = Math.floor(i / width);
    const eyeDistance = Math.min(
      Math.abs(x - (cx - head * 0.15)),
      Math.abs(x - (cx + head * 0.15)),
    );
    const inEye =
      (eyeDistance / (head * 0.115)) ** 2 +
        ((y - eyes - head * 0.015) / (head * 0.08)) ** 2 <
      1;
    if (inEye && r - g < 28 && g - b < 35) continue;
    warm[i] = 1;
    if (
      r - g < 10 ||
      g - b < 9 ||
      Math.abs(g / r - reference[1] / reference[0]) > 0.105 ||
      Math.abs(b / r - reference[2] / reference[0]) > 0.14
    )
      continue;
    if (luminance(r, g, b) < sourceLight * 0.6) continue;
    candidates[i] = 1;
  }
  type Component = {
    points: number[];
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    x: number;
    y: number;
  };
  const components = (
    source: Uint8Array,
    region: (x: number, y: number) => boolean,
  ): Component[] => {
    const seen = new Uint8Array(size),
      queue = new Int32Array(size),
      result: Component[] = [];
    const eligible = (point: number) =>
      point >= 0 &&
      point < size &&
      source[point] &&
      region(point % width, Math.floor(point / width));
    for (let start = 0; start < size; start++) {
      if (!eligible(start) || seen[start]) continue;
      let count = 1,
        minX = width,
        maxX = 0,
        minY = height,
        maxY = 0,
        sumX = 0,
        sumY = 0;
      queue[0] = start;
      seen[start] = 1;
      for (let n = 0; n < count; n++) {
        const point = queue[n],
          x = point % width,
          y = Math.floor(point / width);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        sumX += x;
        sumY += y;
        const visit = (next: number) => {
          if (eligible(next) && !seen[next]) {
            seen[next] = 1;
            queue[count++] = next;
          }
        };
        if (x > 0) visit(point - 1);
        if (x + 1 < width) visit(point + 1);
        visit(point - width);
        visit(point + width);
      }
      const points = Array.from(queue.subarray(0, count));
      result.push({
        points,
        minX,
        maxX,
        minY,
        maxY,
        x: sumX / count,
        y: sumY / count,
      });
    }
    return result;
  };
  const face = components(
    warm,
    (x, y) =>
      y >= eyes - head * 0.48 &&
      y <= faceBottom &&
      Math.abs(x - cx) <= head * 0.56,
  );
  const dominant = face
    .filter((part) => Math.abs(part.x - cx) < head * 0.32)
    .sort((a, b) => b.points.length - a.points.length)[0];
  for (const part of face) {
    const forehead = part.y < eyes - head * 0.06;
    const ear =
      Math.abs(part.x - cx) > head * 0.22 && part.y > eyes - head * 0.2;
    // Small brown irises are separate interior components, surrounded by whites/outline.
    if (part === dominant || ((forehead || ear) && part.points.length >= 4))
      for (const point of part.points) pixels[point] = 1;
  }
  for (
    let y = Math.floor(faceBottom);
    y <=
    Math.min(
      height - 1,
      eyes +
        head * (anchors.collared ? 0.32 : anchors.bareShoulders ? 0.4 : 0.34),
    );
    y++
  )
    for (
      let x = Math.max(
        0,
        Math.floor(cx - head * (anchors.collared ? 0.075 : 0.12)),
      );
      x <= Math.min(width - 1, cx + head * (anchors.collared ? 0.075 : 0.12));
      x++
    ) {
      const point = y * width + x,
        k = point * 4;
      if (
        warm[point] &&
        data[k] - data[k + 1] >= (anchors.collared ? 28 : 18) &&
        data[k + 1] - data[k + 2] >= (anchors.collared ? 25 : 17)
      )
        pixels[point] = 1;
    }
  const expand = (part: Component) => {
    // Fill pale skin highlights within the selected silhouette, while keeping its
    // measured upper edge below a cream/tan cuff.
    for (let y = part.minY; y <= part.maxY; y++)
      for (let x = part.minX; x <= part.maxX; x++) {
        const point = y * width + x;
        if (warm[point]) pixels[point] = 1;
      }
  };
  for (const side of [-1, 1]) {
    const lower = components(
      candidates,
      (x, y) =>
        (x - cx) * side > head * 0.18 &&
        y >= eyes + head * 0.3 &&
        y <= top + bodyHeight * 0.82,
    ).filter(
      (part) =>
        part.points.length >= Math.max(5, head * head * 0.001) &&
        part.y >= top + bodyHeight * 0.52 &&
        part.y <= top + bodyHeight * 0.77 &&
        part.maxX - part.minX <= head * 0.48 &&
        part.maxY - part.minY <= head * 0.88,
    );
    const lowest = lower.sort(
      (a, b) => b.maxY - a.maxY || b.points.length - a.points.length,
    )[0];
    if (lowest) expand(lowest);
    // A few pale hands have a different light balance from the shaded face.
    // Recover those highlights only at the outer wrist/hand position, below
    // the sleeves and outside the trousers, without widening the color test
    // over the torso or jacket cuffs.
    const paleHand = components(
      warm,
      (x, y) =>
        (x - cx) * side > head * 0.24 &&
        (x - cx) * side < head * 0.6 &&
        y >= top + bodyHeight * 0.66 &&
        y <= top + bodyHeight * 0.77,
    ).filter(
      (part) =>
        part.points.length >= Math.max(5, head * head * 0.001) &&
        part.maxY >= top + bodyHeight * 0.7 &&
        part.maxY <= top + bodyHeight * 0.75,
    );
    for (const hand of paleHand) expand(hand);
    if (anchors.raisedHands) {
      const raised = components(
        candidates,
        (x, y) =>
          (x - cx) * side > head * 0.46 &&
          y >= top + bodyHeight * 0.12 &&
          y < top + bodyHeight * 0.54,
      )
        .filter(
          (part) =>
            part.points.length > head * head * 0.005 &&
            part.maxX - part.minX < head * 0.45,
        )
        .sort((a, b) => b.points.length - a.points.length)[0];
      if (raised) expand(raised);
    }
  }
  if (anchors.bareLegs) {
    const legs = components(
      candidates,
      (x, y) =>
        Math.abs(x - cx) < head * 0.43 &&
        y >= top + bodyHeight * 0.68 &&
        y <= top + bodyHeight * 0.91,
    );
    for (const leg of legs)
      if (leg.points.length > head * head * 0.006) expand(leg);
  }
  if (anchors.bareShoulders) {
    const shoulders = components(
      candidates,
      (x, y) =>
        Math.abs(x - cx) > head * 0.25 &&
        Math.abs(x - cx) < head * 0.6 &&
        y >= top + bodyHeight * 0.36 &&
        y <= top + bodyHeight * 0.7,
    );
    for (const shoulder of shoulders)
      if (shoulder.points.length > head * head * 0.002) expand(shoulder);
  }
  if (anchors.shortSleeveTunic) {
    // The Shampoo atlas has pale trousers joined to its gold side trim by a few
    // antialiased pixels. That must not merge either bare arm with the trousers.
    // Both hair variants share this measured arm silhouette in the 400×480 pose.
    for (
      let y = Math.ceil((height * 223) / 480);
      y <= (height * 309) / 480;
      y++
    ) {
      const poseY = (y * 480) / height;
      const inner = poseY < 267 ? 166 - (poseY - 223) * 0.45 : 146;
      for (let x = 0; x < width; x++) {
        const poseX = (Math.abs(x - cx) * 400) / width,
          point = y * width + x,
          k = point * 4;
        if (poseX < 200 - inner || poseX > 83 || !warm[point]) continue;
        const redStep = data[k] - data[k + 1],
          yellowStep = data[k + 1] - data[k + 2];
        // Skin's warm gradient is balanced; gold has a much larger yellow step.
        if (yellowStep <= redStep * 1.8) pixels[point] = 1;
      }
    }
  }
  return { pixels, luminance: sourceLight };
}

export function dyeSkinPixel(
  r: number,
  g: number,
  b: number,
  color: RGB,
  sourceLuminance: number,
): number[] {
  const shade = Math.max(
    0.3,
    Math.min(1.4, luminance(r, g, b) / Math.max(1, sourceLuminance)),
  );
  return color.map((channel) => Math.round(Math.min(255, channel * shade)));
}
