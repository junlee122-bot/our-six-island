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
