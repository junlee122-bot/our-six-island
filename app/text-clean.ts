// One text sanitizer for everything friends type (chat, guestbook, mail,
// status, digest lines, legacy names). Pure; runs in the browser, the Edge
// Functions and tests.
//
// Why: `s.slice(0, n)` cuts UTF-16 units and can leave half of an emoji (a
// lone surrogate). Postgres jsonb rejects `\ud83d` escapes, so one such chat
// line made every world commit fail (503) — audit D-9. Control characters and
// bidi overrides (U+202E) can also spoof or garble what other friends see.

/** C0/C1 controls, zero-width space, LRM/RLM, line/paragraph separators, bidi embeddings/overrides/isolates, invisible operators, BOM. ZWJ (U+200D) stays: emoji sequences need it. */
export const TEXT_CONTROL_SOURCE =
  '[\\u0000-\\u001f\\u007f-\\u009f\\u200b\\u200e\\u200f\\u2028-\\u202e\\u2060-\\u206f\\ufeff]';
// oxlint-disable-next-line no-control-regex -- rejecting control characters is the point.
const CONTROL = new RegExp(TEXT_CONTROL_SOURCE);
// oxlint-disable-next-line no-control-regex -- stripping control characters is the point.
const CONTROL_ALL = new RegExp(TEXT_CONTROL_SOURCE, 'g');
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const LONE_SURROGATE_ALL = new RegExp(LONE_SURROGATE.source, 'g');

/** True when the text holds a control/bidi character or half of a surrogate pair. */
export const hasUnsafeText = (text: string) =>
  CONTROL.test(text) || LONE_SURROGATE.test(text);

/** Length in code points (what every *_TEXT_MAX limit counts). */
export const textLength = (text: string) => Array.from(text).length;

type Segmenter = { segment(s: string): Iterable<{ segment: string }> };
let graphemes: Segmenter | null | undefined;
function segmenter(): Segmenter | null {
  if (graphemes === undefined) {
    const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => Segmenter }).Segmenter;
    graphemes = Seg ? new Seg(undefined, { granularity: 'grapheme' }) : null;
  }
  return graphemes;
}

/**
 * At most `max` code points, cut only between graphemes when the runtime can
 * tell (an emoji family or flag is kept whole or dropped whole), otherwise
 * between code points. Never splits a surrogate pair.
 */
export function clipText(text: string, max: number): string {
  if (max <= 0) return '';
  if (textLength(text) <= max) return text;
  const seg = segmenter();
  if (!seg) return Array.from(text).slice(0, max).join('');
  let out = '',
    used = 0;
  for (const { segment } of seg.segment(text)) {
    const n = textLength(segment);
    if (used + n > max) break;
    out += segment;
    used += n;
  }
  return out;
}

/**
 * Lenient sanitizer: whitespace runs become one space, controls/bidi
 * overrides and lone surrogates are removed, the result is trimmed and
 * clipped to `max` code points. Non-strings become ''.
 */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const text = value
    .replace(/\s+/g, ' ')
    .replace(CONTROL_ALL, '')
    .replace(LONE_SURROGATE_ALL, '')
    .trim();
  return clipText(text, max).trim();
}
