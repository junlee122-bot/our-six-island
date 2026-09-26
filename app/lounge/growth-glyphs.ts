// Which hand-drawn glyph (field-glyphs.tsx) stands for each skill and tool.
import type { SkillId, ToolId } from '../lounge-growth-data';
import type { GlyphName } from './field-glyphs';

export const SKILL_GLYPH: Record<SkillId, GlyphName> = {
  farm: 'hoe',
  fish: 'rod',
  forage: 'basket',
  mine: 'pickaxe',
  craft: 'book',
};
export const TOOL_GLYPH: Record<ToolId, GlyphName> = {
  can: 'can',
  hoe: 'hoe',
  rod: 'rod',
  axe: 'axe',
  pickaxe: 'pickaxe',
};
/** Crest of each Lv5 profession (Lv10 picks show their branch's crest). */
export const PROF_GLYPH: Record<string, GlyphName> = {
  'farm-a': 'leaf',
  'farm-b': 'sack',
  'fish-a': 'hook',
  'fish-b': 'wave',
  'forage-a': 'basket',
  'forage-b': 'axe',
  'mine-a': 'pickaxe',
  'mine-b': 'ore',
  'craft-a': 'bell',
  'craft-b': 'anvil',
};
export const profGlyph = (id: string): GlyphName | undefined => PROF_GLYPH[id] ?? PROF_GLYPH[id.replace(/[12]$/, '')];
