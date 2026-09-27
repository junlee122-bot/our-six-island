// Self-contained: Playwright serializes this function into the page.
// ---- in-page measurement ----------------------------------------------------
export function measureInPage() {
  const parse = (c) => {
    // Chromium preserves color-mix(in srgb, ...) as color(srgb ...), even
    // though ordinary colours serialize as rgb(). Ignoring that opaque
    // background incorrectly compares white badge text against its paper parent.
    const rgb = c.match(/^rgba?\(([^)]+)\)$/);
    const color = c.match(/^color\((srgb(?:-linear)?)\s+([^)]+)\)$/);
    if (!rgb && !color) return null;
    const values = (rgb?.[1] ?? color[2]).split(/[ ,/]+/).filter(Boolean);
    const unit = (v) => v.endsWith('%') ? parseFloat(v) / 100 : Number(v);
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const channels = values.slice(0, 3).map((v) => {
      let n = rgb ? (v.endsWith('%') ? unit(v) : Number(v) / 255) : unit(v);
      if (color?.[1] === 'srgb-linear') n = n <= 0.0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - 0.055;
      return clamp(n) * 255;
    });
    const alpha = values[3] === undefined ? 1 : clamp(unit(values[3]));
    if (channels.length !== 3 || ![...channels, alpha].every(Number.isFinite)) return null;
    return { r: channels[0], g: channels[1], b: channels[2], a: alpha };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  function bgOf(el) {
    const stack = [];
    let opacity = 1;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      opacity *= +cs.opacity;
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('repeating-linear-gradient')) return { img: true };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 0.99) break;
      }
      if (cs.backdropFilter && cs.backdropFilter !== 'none' && stack.length === 0) return { img: true };
    }
    if (!stack.length || stack[stack.length - 1].a < 0.99) return { img: true };
    let out = stack.pop();
    while (stack.length) out = blend(stack.pop(), out);
    return out;
  }
  const cls = (e) => (e.className?.baseVal ?? e.className ?? '').toString().trim().split(/\s+/).slice(0, 2).join('.') || e.tagName.toLowerCase();
  const top = [...document.querySelectorAll('dialog[open]')].pop() ?? document.querySelector('main') ?? document.body;
  const visible = (e) => {
    // Content of a closed <details> still reports boxes in Chrome.
    const closed = e.closest('details:not([open])');
    if (closed && !e.closest('summary')) return false;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.right < 0 || r.left > innerWidth || r.top > innerHeight) return false;
    const cs = getComputedStyle(e);
    // Screen-reader announcements keep a layout box, but inset(50%) removes
    // all painted pixels. Do not measure their invisible ink as visual text.
    // Check ancestors too, because an announcement may wrap its text in a span.
    for (let p = e; p; p = p.parentElement) {
      if (getComputedStyle(p).clipPath === 'inset(50%)') return false;
    }
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const ownText = (e) => [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').trim();
  const low = [], small = [], narrow = [], cut = [];
  let texts = 0, minFont = 99;
  for (const e of top.querySelectorAll('*')) {
    const t = ownText(e);
    if (!t || !visible(e)) continue;
    const cs = getComputedStyle(e);
    let op = 1;
    for (let p = e; p; p = p.parentElement) op *= +getComputedStyle(p).opacity;
    if (op < 0.1) continue;
    texts++;
    const size = parseFloat(cs.fontSize);
    minFont = Math.min(minFont, size);
    if (size < 12) small.push({ t: t.slice(0, 18), size, cls: cls(e) });
    // contrast (the element's own opacity chain multiplies the text alpha)
    const fg0 = parse(cs.color);
    const bg = bgOf(e);
    if (fg0 && !bg.img) {
      const fg = blend({ ...fg0, a: fg0.a * op }, bg);
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const bold = +cs.fontWeight >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (ratio < need) low.push({ t: t.slice(0, 18), ratio: +ratio.toFixed(2), size, cls: cls(e) });
    }
    // one or two characters per line
    for (const node of e.childNodes) {
      if (node.nodeType !== 3) continue;
      const chars = Array.from(node.textContent.replace(/\s+/g, '')).length;
      if (chars < 3) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const lines = new Set([...range.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top / (size * 0.6))));
      if (lines.size >= 3 && chars / lines.size <= 2.2) {
        narrow.push({ t: t.slice(0, 18), lines: lines.size, cls: cls(e) });
        break;
      }
    }
    // cut off: outside the viewport, or outside a clipping ancestor that cannot scroll
    // (Text below the fold of a scrolling box is reachable, so it does not count.)
    const r = e.getBoundingClientRect();
    let isCut = false, scrolls = false;
    for (let p = e.parentElement; p && !isCut && p !== document.body; p = p.parentElement) {
      const pc = getComputedStyle(p);
      if ((pc.overflowY === 'auto' || pc.overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 1) {
        scrolls = true;
        break;
      }
      if (pc.overflowY === 'hidden' || pc.overflowY === 'clip') {
        const pr = p.getBoundingClientRect();
        if (r.top >= pr.bottom - 1 || r.bottom > pr.bottom + 2) isCut = true;
      }
    }
    if (!scrolls && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1)) isCut = true;
    if (isCut && top.tagName === 'DIALOG') cut.push({ t: t.slice(0, 18), cls: cls(e) });
  }
  // Floating HUD boxes that cover each other (only without a dialog on top).
  const overlaps = [];
  if (top.tagName !== 'DIALOG') {
    const boxes = [...top.querySelectorAll('*')].filter((e) => {
      const cs = getComputedStyle(e);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
      if (e.closest('canvas') || e.tagName === 'CANVAS' || !visible(e) || cs.pointerEvents === 'none') return false;
      const r = e.getBoundingClientRect();
      if (r.width * r.height < 3000 || (r.width > innerWidth * 0.6 && r.height > innerHeight * 0.6)) return false;
      return !!e.innerText?.trim();
    });
    const tops = boxes.filter((e) => !boxes.some((o) => o !== e && o.contains(e)));
    for (let i = 0; i < tops.length; i++)
      for (let j = i + 1; j < tops.length; j++) {
        const a = tops[i].getBoundingClientRect(), b = tops[j].getBoundingClientRect();
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w <= 4 || h <= 4) continue;
        const frac = (w * h) / Math.min(a.width * a.height, b.width * b.height);
        if (frac < 0.05) continue;
        const cx = Math.max(a.left, b.left) + w / 2, cy = Math.max(a.top, b.top) + h / 2;
        const hit = document.elementFromPoint(cx, cy);
        overlaps.push({ a: cls(tops[i]), b: cls(tops[j]), px: Math.round(w * h), onTop: hit && tops[i].contains(hit) ? cls(tops[i]) : hit && tops[j].contains(hit) ? cls(tops[j]) : '?' });
      }
  }
  // Controls hidden under another HUD piece: sample each control's centre
  // (and its left/right thirds) and see what is really on top there. This
  // also catches siblings inside one bar (a header row running into the date
  // sign), which the box check above cannot see.
  const covered = [];
  // Test the painted part of a control, not the off-scrollport rectangle.
  // Keep partially visible controls: another HUD may still cover that part.
  const clippedRect = (el) => {
    const r = el.getBoundingClientRect();
    const clip = { left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(innerWidth, r.right), bottom: Math.min(innerHeight, r.bottom) };
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const clips = (v) => /^(auto|scroll|hidden|clip)$/.test(v);
      if (!clips(cs.overflowX) && !clips(cs.overflowY)) continue;
      const pr = p.getBoundingClientRect();
      const sx = p.offsetWidth ? pr.width / p.offsetWidth : 1;
      const sy = p.offsetHeight ? pr.height / p.offsetHeight : 1;
      const left = pr.left + p.clientLeft * sx, top = pr.top + p.clientTop * sy;
      if (clips(cs.overflowX)) {
        clip.left = Math.max(clip.left, left);
        clip.right = Math.min(clip.right, left + p.clientWidth * sx);
      }
      if (clips(cs.overflowY)) {
        clip.top = Math.max(clip.top, top);
        clip.bottom = Math.min(clip.bottom, top + p.clientHeight * sy);
      }
    }
    return clip.right > clip.left && clip.bottom > clip.top ? clip : null;
  };
  if (top.tagName !== 'DIALOG') {
    for (const b of top.querySelectorAll('button, a[href], [role=button]')) {
      if (!visible(b) || b.closest('canvas')) continue;
      const cs = getComputedStyle(b);
      if (cs.pointerEvents === 'none' || +cs.opacity < 0.1) continue;
      const r = b.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const painted = clippedRect(b);
      if (!painted) continue;
      for (const fx of [0.06, 0.25, 0.5, 0.75, 0.94]) {
        const hit = document.elementFromPoint(painted.left + (painted.right - painted.left) * fx, (painted.top + painted.bottom) / 2);
        if (!hit || b.contains(hit) || hit.contains(b) || hit.tagName === 'CANVAS') continue;
        const hs = getComputedStyle(hit);
        if (hs.pointerEvents === 'none') continue;
        covered.push({ control: (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 20), cls: cls(b), by: cls(hit) });
        break;
      }
    }
  }
  let dialog = null;
  if (top.tagName === 'DIALOG') {
    const r = top.getBoundingClientRect();
    const x = top.querySelector('button[aria-label="닫기"], button[aria-label$="닫기"], [data-close]');
    const xr = x?.getBoundingClientRect();
    const targets = [...top.querySelectorAll('button, [role=tab], a[href]')].filter(visible);
    dialog = {
      label: top.getAttribute('aria-label') || cls(top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      offscreen: r.top < -1 || r.bottom > innerHeight + 1,
      close: xr ? { w: Math.round(xr.width), h: Math.round(xr.height) } : null,
      smallTargets: targets.filter((b) => { const q = b.getBoundingClientRect(); return q.height < 32 || q.width < 32; }).length,
      fonts: [...new Set([...top.querySelectorAll('h1,h2,h3,p,button')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))],
    };
  }
  low.sort((a, b) => a.ratio - b.ratio);
  return {
    texts,
    minFont: minFont === 99 ? null : minFont,
    lowCount: low.length,
    low: low.slice(0, 12),
    smallCount: small.length,
    small: small.slice(0, 8),
    narrowCount: narrow.length,
    narrow: narrow.slice(0, 8),
    cutCount: cut.length,
    cut: cut.slice(0, 8),
    overlapCount: overlaps.length,
    overlaps: overlaps.slice(0, 8),
    coveredCount: covered.length,
    covered: covered.slice(0, 8),
    dialog,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '') + ' ' + f.weight).filter((v, i, a) => a.indexOf(v) === i),
  };
}
