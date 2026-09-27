import type { Season } from './lounge-calendar.ts';

type Tint = { color: string; glow: string; glowIntensity: number };
const AUTUMN: Tint = { color: '#ffcf6a', glow: '#7a4410', glowIntensity: 0.28 };
// The GLBs bake bark and leaves into one texture. White emission washes both out;
// a cool diffuse multiplier preserves dark trunks and the original leaf detail.
const FROST: Tint = { color: '#d6e2df', glow: '#000000', glowIntensity: 0 };
export function villageFoliageTint(model: string, season: Season | null): Tint | undefined {
  if (model === 'smallPine') return season === 'winter' ? { ...FROST, color: '#c9ddd5' } : undefined;
  if (!['broadleafTree', 'shrub', 'meadowGrass'].includes(model)) return undefined;
  return season === 'winter' ? FROST : season === 'autumn' ? AUTUMN : undefined;
}
