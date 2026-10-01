'use client';
import { RARITY_INFO, type FishRarity } from '../lounge-fish-engine';
import { Glyph } from '../ui/Glyph';
import './fish-rarity.css';

/** A fish grade: one to four stars and its name, in the grade's colours. */
export function RarityBadge({ rarity, size = 's' }: { rarity: FishRarity; size?: 's' | 'l' }) {
  const info = RARITY_INFO[rarity];
  return (
    <span className="l-rarity" data-rarity={rarity} data-size={size}>
      <span className="l-rarity-stars" aria-hidden="true">
        {Array.from({ length: info.stars }, (_, i) => (
          <Glyph key={i} name="star" size={size === 'l' ? 15 : 11} />
        ))}
      </span>
      {info.name}
    </span>
  );
}
