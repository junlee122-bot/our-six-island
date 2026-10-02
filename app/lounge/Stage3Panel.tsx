'use client';
// 마을 확장 3단계 counters (handover/design/design-npcs-stage3.md §2), opened
// from TownPanel: 닐라 목장 (my animals, 건초, buying animals, selling goods),
// 강물 과수원 (my three fruit trees, saplings, selling fruit), 오른의 대장간
// (range upgrades, ore buying and today's ore), 메르시 의원 (care) and 신이치's
// 점집 (today's fortune). Every trade is a server action (lounge-stage3.ts);
// this only shows the view's numbers and sends the choice.
import { useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { LifeAction } from '../lounge-life';
import {
  ANIMALS,
  ANIMAL_BOND,
  ANIMAL_KINDS,
  CLINIC_MENU,
  CLINIC_PER_DAY,
  FORTUNE_HOURS,
  FORTUNE_PRICE,
  FRUIT_TREE_KINDS,
  HAY_PER_BUY,
  HAY_PRICE,
  ORCHARD_GROW_DAYS,
  ORE_OF_DAY_PREMIUM,
  SAPLINGS,
  SMITH_COST,
  SMITH_EFFECT,
  SMITH_TOOLS,
  SMITH_TOOL_NAME,
  STAGE3_ITEMS,
  type AnimalKind,
  type FruitTreeKind,
  type SmithTool,
} from '../lounge-stage3-data';
import { SEASON_INFO } from '../lounge-calendar';
import { itemName } from '../lounge-life-plus';
import { formatBeom, josa } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { ItemIcon } from './ItemIcon';
import { ShopSell } from './ShopGoods';
import { useLifeAction } from './LifePanels';
import { ConfirmModal } from './Modal';
import { RESPEC_PRICE, SKILL_INFO, type SkillId } from '../lounge-growth-data';
import type { Notify } from './Toast';

export type Stage3Place = 'barn' | 'orchardShop' | 'smithy' | 'clinic' | 'fortune';
export const STAGE3_PLACES: readonly Stage3Place[] = ['barn', 'orchardShop', 'smithy', 'clinic', 'fortune'];
export const isStage3Place = (p: unknown): p is Stage3Place => typeof p === 'string' && (STAGE3_PLACES as readonly string[]).includes(p);

type Props = { room: CloudRoom; view: CloudRoomView; notify: Notify; place: Stage3Place };

const hhmm = (t: number) => new Date(t + 9 * 3_600_000).toISOString().slice(11, 16);
const hearts = (love: number) => '♥'.repeat(Math.min(10, love)) + '♡'.repeat(Math.max(0, 10 - love));

export function Stage3Counter({ room, view, notify, place }: Props) {
  const life = view.life;
  const s3 = life?.stage3;
  const [run, busy] = useLifeAction(room, notify);
  const [hayN, setHayN] = useState(4);
  const act = (a: LifeAction, done: string) => void run(a, done, 'coin');
  const base = { room, view, notify };
  if (!life || !s3) return <EmptyState glyph="store" title="마을에 접속한 뒤 이용할 수 있어요" />;
  const balance = view.wallet.balance;
  const inv = life.me.inv ?? {};

  switch (place) {
    case 'barn': {
      const todo = s3.animals.filter((a) => !a.cared).length;
      // 목축 Lv3 makes hay cheaper (the server's unit price; older servers: the list price).
      const hay = s3.price?.hay ?? HAY_PRICE;
      return (
        <>
          <section className="l-town-notice" aria-label="오늘의 돌봄" data-testid="ranch-care">
            <strong>오늘의 돌봄 · 건초 {s3.hay}개</strong>
            <p>
              하루 한 번 건초를 먹이고 쓰다듬으면 달걀·우유·양털을 받아요. 정이 {ANIMAL_BOND} 이상이면 큰 달걀·진한 우유, 양은 날마다 양털. 하루 건너뛰면 정이 1씩 줄어요.
            </p>
            <GameButton
              variant="primary"
              disabled={busy || !todo || s3.hay < todo}
              onClick={() => act({ kind: 'animalCare' }, `동물 ${todo}마리를 돌봤어요. 산물은 가방에 담았어요.`)}
            >
              {!s3.animals.length ? '아직 동물이 없어요' : !todo ? '오늘 돌봄 끝' : s3.hay < todo ? `건초가 ${todo - s3.hay}개 모자라요` : `${todo}마리 돌보기`}
            </GameButton>
          </section>
          {!!s3.animals.length && (
            <ul className="l-town-list" aria-label="내 동물">
              {s3.animals.map((a, i) => (
                <li key={`${a.k}-${a.n}`} className="l-town-row" data-testid={`animal-${i}`}>
                  <span className="l-town-art" aria-hidden="true" />
                  <div>
                    <strong>
                      {a.name} <small>{a.bonded ? '정든 동물' : `정 ${a.love}/10`}</small>
                    </strong>
                    <small aria-label={`정 ${a.love}`}>{hearts(a.love)}</small>
                  </div>
                  <small>
                    {a.cared ? '오늘 돌봤어요' : a.product ? `돌보면 ${itemName(a.product)}` : '내일 양털'}
                    {a.want ? <span className="l-animal-want" data-testid={`animal-want-${i}`}>“{a.want}”</span> : null}
                  </small>
                </li>
              ))}
            </ul>
          )}
          <section className="l-town-notice" aria-label="건초 사기">
            <strong>건초 {formatBeom(hay)}</strong>
            <p>동물 한 마리의 하루 먹이예요. 한 번에 {HAY_PER_BUY}개까지.</p>
            <span className="l-town-buttons">
              {[4, 8, HAY_PER_BUY].map((n) => (
                <GameButton key={n} size="s" variant={hayN === n ? 'primary' : undefined} disabled={busy || balance < Math.round(n * hay)} onClick={() => {
                  setHayN(n);
                  act({ kind: 'hayBuy', n }, `건초 ${n}개를 샀어요.`);
                }}>
                  {n}개 · {formatBeom(Math.round(n * hay))}
                </GameButton>
              ))}
            </span>
          </section>
          <ul className="l-town-list" aria-label="동물 사기">
            {ANIMAL_KINDS.map((k: AnimalKind) => {
              const def = ANIMALS[k];
              const price = s3.price?.animals[k] ?? def.price;
              const left = def.home === 'coop' ? s3.room.coop : s3.room.barn;
              return (
                <li key={k} className="l-town-row" data-testid={`animal-buy-${k}`}>
                  <ItemIcon id={def.product} size={36} />
                  <div>
                    <strong>
                      {def.name} <small>{def.home === 'coop' ? `닭장 ${left}자리 남음` : `외양간 ${left}자리 남음`}</small>
                    </strong>
                    <small>
                      {k === 'sheep' ? '이틀마다 양털(정들면 매일)' : `매일 ${itemName(def.product)}(정들면 ${itemName(def.bonded)})`} · {itemName(def.product)} {formatBeom(STAGE3_ITEMS[def.product as keyof typeof STAGE3_ITEMS].sell)}
                    </small>
                  </div>
                  <GameButton size="s" variant="primary" disabled={busy || !left || balance < price} onClick={() => act({ kind: 'animalBuy', animal: k }, `${josa(def.name, '을/를')} 데려왔어요.`)}>
                    {formatBeom(price)}
                  </GameButton>
                </li>
              );
            })}
          </ul>
          <ShopSell {...base} at="barn" />
        </>
      );
    }
    case 'orchardShop': {
      const freeSlot = s3.trees.findIndex((t) => !t);
      return (
        <>
          <section className="l-town-notice" aria-label="내 과일나무">
            <strong>내 과일나무 {s3.trees.filter(Boolean).length}/{s3.trees.length}</strong>
            <p>묘목은 {ORCHARD_GROW_DAYS}일 자라면 제철에 하루 한 번 열매를 줘요. 오래된 나무(14일)는 하나 더.</p>
          </section>
          <ul className="l-town-list" aria-label="과일나무 자리">
            {s3.trees.map((t, i) => (
              <li key={i} className="l-town-row" data-testid={`tree-${i}`}>
                {t ? <ItemIcon id={t.k} size={36} /> : <span className="l-town-art" aria-hidden="true" />}
                <div>
                  <strong>{t ? t.name : `빈 자리 ${i + 1}`}</strong>
                  <small>
                    {!t
                      ? '아래에서 묘목을 골라 심어요'
                      : !t.grown
                        ? `자라는 중 · ${Math.max(0, ORCHARD_GROW_DAYS - t.age)}일 남음`
                        : !t.inSeason
                          ? `쉬는 중 · ${SEASON_INFO[SAPLINGS[t.k].season].name}에 열려요`
                          : t.picked
                            ? '오늘 땄어요'
                            : `${itemName(t.k)} ${t.n}개 딸 수 있어요`}
                  </small>
                </div>
                {t && (
                  <span className="l-town-buttons">
                    <GameButton size="s" variant="primary" disabled={busy || !t.ripe} onClick={() => act({ kind: 'treePick', slot: i }, `${josa(itemName(t.k), '을/를')} 땄어요.`)}>
                      따기
                    </GameButton>
                    <GameButton size="s" disabled={busy} title="나무를 베어 자리를 비워요(돈은 돌아오지 않아요)" onClick={() => act({ kind: 'treeClear', slot: i }, `${t.name} 자리를 비웠어요.`)}>
                      베기
                    </GameButton>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <ul className="l-town-list" aria-label="묘목 사기">
            {FRUIT_TREE_KINDS.map((k: FruitTreeKind) => (
              <li key={k} className="l-town-row" data-testid={`sapling-${k}`}>
                <ItemIcon id={k} size={36} />
                <div>
                  <strong>
                    {SAPLINGS[k].name} <small>{SEASON_INFO[SAPLINGS[k].season].name}</small>
                  </strong>
                  <small>
                    {itemName(k)} {formatBeom(STAGE3_ITEMS[k].sell)}
                  </small>
                </div>
                <GameButton size="s" variant="primary" disabled={busy || freeSlot < 0 || balance < SAPLINGS[k].price} onClick={() => act({ kind: 'treePlant', slot: freeSlot, tree: k }, `${josa(SAPLINGS[k].name, '을/를')} 심었어요.`)}>
                  {freeSlot < 0 ? '자리 없음' : formatBeom(SAPLINGS[k].price)}
                </GameButton>
              </li>
            ))}
          </ul>
          <ShopSell {...base} at="orchardShop" />
        </>
      );
    }
    case 'smithy':
      return (
        <>
          <section className="l-town-notice" aria-label="오늘의 광석" data-testid="ore-of-day">
            <strong>
              오늘의 광석 · {itemName(s3.ore.today)} +{Math.round(ORE_OF_DAY_PREMIUM * 100)}%
            </strong>
            <p>오늘은 이 광석을 웃돈 얹어 사요. 웃돈은 하루 {formatBeom(s3.ore.premiumLeft)}까지 더 받을 수 있어요.</p>
          </section>
          <ul className="l-town-list" aria-label="범위 강화">
            {SMITH_TOOLS.map((tool: SmithTool) => {
              const tier = s3.smith[tool];
              const to = tier < 3 ? ((tier + 1) as 2 | 3) : null;
              const cost = to ? SMITH_COST[tool][to] : null;
              const short = cost ? Object.entries(cost.mats).find(([id, n]) => (inv[id] ?? 0) < n) : undefined;
              return (
                <li key={tool} className="l-town-row" data-testid={`smith-${tool}`}>
                  <span className="l-town-art" aria-hidden="true" />
                  <div>
                    <strong>
                      {SMITH_TOOL_NAME[tool]} <small>{tier}단계 · {SMITH_EFFECT[tool][tier]}</small>
                    </strong>
                    <small>
                      {to && cost
                        ? `${to}단계: ${SMITH_EFFECT[tool][to]} · ${formatBeom(cost.beom)} + ${Object.entries(cost.mats)
                            .map(([id, n]) => `${itemName(id)} ${n}`)
                            .join(', ')}`
                        : '가장 좋은 단계예요'}
                    </small>
                  </div>
                  <GameButton
                    size="s"
                    variant="primary"
                    disabled={busy || !to || !cost || !!short || balance < cost.beom}
                    title={short ? `${itemName(short[0])}이(가) 모자라요` : undefined}
                    onClick={() => to && act({ kind: 'smithUpgrade', tool }, `${SMITH_TOOL_NAME[tool]} ${to}단계로 강화했어요.`)}
                  >
                    {to ? '강화' : '최고'}
                  </GameButton>
                </li>
              );
            })}
          </ul>
          <ShopSell {...base} at="smithy" />
        </>
      );
    case 'clinic':
      return (
        <>
          <p className="l-town-sub">
            오늘 {s3.clinic.left}번 더 받을 수 있어요 (하루 {CLINIC_PER_DAY}번). 그 자리에서 받아요.
          </p>
          <ul className="l-town-list" aria-label="처치">
            {CLINIC_MENU.map((c) => (
              <li key={c.id} className="l-town-row" data-testid={`clinic-${c.id}`}>
                <span className="l-town-art" aria-hidden="true" />
                <div>
                  <strong>{c.name}</strong>
                  <small>{c.note}</small>
                </div>
                <GameButton size="s" variant="primary" disabled={busy || !s3.clinic.left || balance < c.price} onClick={() => act({ kind: 'clinicCare', care: c.id }, `${josa(c.name, '을/를')} 받았어요. 한결 개운해요.`)}>
                  {formatBeom(c.price)}
                </GameButton>
              </li>
            ))}
          </ul>
        </>
      );
    case 'fortune': {
      const f = s3.fortune;
      return (
        <>
        <section className="l-town-notice" aria-label="오늘의 운세" data-testid="fortune">
          <strong>{f.read ? `오늘의 운세 · ${f.name}` : f.open ? '오늘의 운세' : '점집은 쉬는 날이에요'}</strong>
          <p>
            {f.read
              ? `${f.line} (${hhmm(f.until ?? 0)}까지 작은 버프)`
              : f.open
                ? `${formatBeom(FORTUNE_PRICE)}에 오늘의 운세와 ${FORTUNE_HOURS}시간 작은 버프를 받아요. 하루 한 번.`
                : '신이치는 주말과 축제 기간에만 천막을 열어요.'}
          </p>
          {!f.read && (
            <GameButton variant="primary" disabled={busy || !f.open || balance < FORTUNE_PRICE} onClick={() => act({ kind: 'fortuneRead' }, '범인은… 아니, 오늘 운세가 나왔어요.')}>
              운세 보기
            </GameButton>
          )}
        </section>
        <FateReset {...base} />
        </>
      );
    }
  }
}

/**
 * 운명 다시 보기 (design-skill-tree.md §2): 신이치 resets one skill's
 * professions and talents. 500,000범, doubling for that skill every time.
 */
function FateReset({ room, view, notify }: { room: CloudRoom; view: CloudRoomView; notify: Notify }) {
  const [run, busy] = useLifeAction(room, notify);
  const [skill, setSkill] = useState<SkillId | null>(null);
  const skills = view.life?.growth?.skills ?? [];
  const balance = view.wallet.balance;
  const picked = skills.find((k) => k.id === skill);
  return (
    <section className="l-town-notice" aria-label="운명 다시 보기" data-testid="fate-reset">
      <strong>운명 다시 보기</strong>
      <p>
        한 기술의 전문가와 재능을 모두 되돌려요. 처음엔 {formatBeom(RESPEC_PRICE)}이고, 같은 기술을 다시 되돌릴 때마다 두 배가 돼요.
      </p>
      <ul className="l-town-list" aria-label="되돌릴 기술">
        {skills.map((k) => {
          const has = k.prof.length + (k.tal?.length ?? 0);
          const price = k.respec ?? RESPEC_PRICE;
          return (
            <li key={k.id} className="l-town-row" data-testid={`fate-${k.id}`}>
              <div>
                <strong>
                  {SKILL_INFO[k.id].name} <small>Lv{k.level}</small>
                </strong>
                <small>{has ? `전문가 ${k.prof.length} · 재능 ${k.tal?.length ?? 0}` : '되돌릴 것이 없어요'}</small>
              </div>
              <GameButton size="s" disabled={busy || !has || balance < price} onClick={() => setSkill(k.id)}>
                {formatBeom(price)}
              </GameButton>
            </li>
          );
        })}
      </ul>
      {skill && picked && (
        <ConfirmModal
          title={`${SKILL_INFO[skill].name}의 운명을 다시 볼까요?`}
          body={
            <>
              {SKILL_INFO[skill].name} 전문가와 재능을 모두 내려놓고 다시 고를 수 있어요. <b>{formatBeom(picked.respec ?? RESPEC_PRICE)}</b>이 들어요. 지갑에{' '}
              {formatBeom(balance)}이 있어요. 다음에 이 기술을 또 되돌리면 두 배예요.
            </>
          }
          confirmLabel="다시 보기"
          busyLabel="점치는 중…"
          cancelLabel="그대로 두기"
          onClose={() => setSkill(null)}
          onConfirm={() => run({ kind: 'respec', skill }, `${SKILL_INFO[skill].name}의 운명이 새로 열렸어요. 전문가와 재능을 다시 골라요.`)}
        />
      )}
    </section>
  );
}
