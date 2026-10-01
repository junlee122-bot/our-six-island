'use client';
import type { AnglerLast, SpeciesLog } from '../lounge-fish-engine';
import { fishGrams, gramsText, rarityOf } from '../lounge-fish-engine';
import { FISH_QUALITY_MULT } from '../lounge-fish-quality';
import type { FishDef } from '../lounge-items';
import { ACTORS } from '../lounge-roster';
import { formatBeom } from '../lounge-text';
import { Glyph } from '../ui/Glyph';
import { FishCatchModel } from './FishCatchModel';
import { RarityBadge } from './FishRarity';
import { QualityStar } from './ItemIcon';
import './farm-fish.css';

export type CatchResult = Omit<AnglerLast, 'at'> & { isNew?: boolean; pressed?: boolean };
/** The catch card's headline for the two top grades. */
const RARITY_BANNER = { rare: '드문 물고기를 낚았어요!', legend: '전설의 물고기를 낚았어요!' } as const;
const QUALITY_NAME = ['보통', '은별', '금별'] as const;

/**
 * The body of a successful catch card (inside `.l-catch.is-ok[data-rarity]`):
 * the fish on its ruler, its grade, size, quality and records. The higher the
 * grade the louder the card: a banner for 드묾 and 전설, light rays behind the
 * fish from 보통 up (fish-rarity.css).
 */
export function CatchCard({
  fish,
  result,
  best,
  record,
  price,
}: {
  fish: FishDef;
  result: CatchResult;
  best?: SpeciesLog;
  record?: { actor: number; cm: number };
  price?: number;
}) {
  const q = Math.min(2, result.quality ?? 0) as 0 | 1 | 2; // fish top out at 금별 (별빛 is a farm grade)
  const rarity = rarityOf(fish);
  const big = rarity === 'rare' || rarity === 'legend';
  return (
    <>
      {big && (
        <p className="l-catch-banner">
          <RarityBadge rarity={rarity} size="l" />
          <strong>{RARITY_BANNER[rarity]}</strong>
        </p>
      )}
      <figure className="l-catch-art" data-rarity={rarity}>
        {rarity !== 'common' && <span className="l-catch-rays" aria-hidden="true" />}
        <FishCatchModel key={fish.id} fish={fish.id} />
        <svg className="l-catch-ruler" viewBox="0 0 200 18" aria-hidden="true">
          <rect x="1" y="3" width="198" height="12" rx="2" fill="#f3dc9a" stroke="#a8743a" />
          {Array.from({ length: 21 }, (_, i) => (
            <path key={i} d={`M${6 + i * 9.4} 3 v${i % 5 ? 4 : 7}`} stroke="#8a5a34" strokeWidth="1" />
          ))}
        </svg>
        <figcaption>{result.cm}cm</figcaption>
        {result.isNew && (
          <span className="l-stamp" aria-label="처음 낚았어요">
            첫<br />낚시
          </span>
        )}
      </figure>
      <div className="l-catch-text">
        {!big && <RarityBadge rarity={rarity} size="l" />}
        <strong>
          {fish.name} {q > 0 && <QualityStar quality={q} size={16} />}
        </strong>
        <b>
          {result.cm}cm · {gramsText(result.grams ?? fishGrams(fish.id, result.cm ?? 0))} · {QUALITY_NAME[q]}
        </b>
        <span className="l-catch-tags">
          {result.perfect && <span className="l-catch-tag" data-kind="perfect">완벽하게 낚음</span>}
          {result.seconds !== undefined && <span className="l-catch-tag">겨루기 {result.seconds}초</span>}
          {result.coop ? <span className="l-catch-tag" data-kind="coop">함께 낚시 {result.coop}명</span> : null}
          {result.cupScore ? <span className="l-catch-tag">대회 점수 {result.cupScore}</span> : null}
          {result.pressed && (result.grade === 'S' || result.grade === 'A') && <span className="l-catch-tag">재빠르게 챘어요</span>}
        </span>
        <p>{fish.note}</p>
        <dl>
          <dt>내 기록</dt>
          <dd>{result.best ? <span className="l-ribbon">새 기록</span> : best ? `${best.cm}cm · ${gramsText(best.g)}` : '—'}</dd>
          <dt>마을 최대어</dt>
          <dd>
            {result.record ? (
              <span className="l-ribbon is-gold">
                <Glyph name="star" size={13} /> 이 물고기예요
              </span>
            ) : record ? (
              `${record.cm}cm · ${ACTORS[record.actor] ?? '친구'}`
            ) : (
              '—'
            )}
          </dd>
          <dt>시세</dt>
          <dd>개당 {formatBeom(price ?? fish.sell)}{q > 0 ? ` (${QUALITY_NAME[q]} ×${FISH_QUALITY_MULT[q]})` : ''}</dd>
        </dl>
      </div>
    </>
  );
}
