'use client';
// 요리·만들기 (at a table or the hearth in my room): recipes with what I have
// of each ingredient, how many I can make, and today's dish buff.
import { useState } from 'react';
import { ChefHat, Hammer, Lock, Soup, Sparkles } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { BUFF_INFO, CRAFTS, DISHES, VILLAGE_FLAGS, type RecipeDef } from '../lounge-items';
import { FURNITURE_BY_REF } from '../lounge-items';
import { formatBeom, josa } from '../lounge-text';
import { needHave, needLabel, recipeMax } from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon } from './ItemIcon';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import './life-plus.css';

type Mode = 'cook' | 'craft';
const madeName = (r: RecipeDef) => FURNITURE_BY_REF[r.makes]?.name ?? r.name;

export function KitchenPanel({
  room,
  view,
  notify,
  onClose,
  initial = 'cook',
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  initial?: Mode;
}) {
  const life = view.life;
  const [mode, setMode] = useState<Mode>(initial);
  const [picked, setPicked] = useState<string>(initial === 'cook' ? DISHES[0].id : CRAFTS[0].id);
  const [n, setN] = useState(1);
  const [run, busy] = useLifeAction(room, notify);
  const now = useNow(true, 60_000) + view.clockOffset;
  if (!life)
    return (
      <Modal title="요리·만들기" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 요리할 수 있어요.</p>
      </Modal>
    );
  const me = life.me;
  const list: readonly RecipeDef[] = mode === 'cook' ? DISHES : CRAFTS;
  const recipe = list.find((r) => r.id === picked) ?? list[0];
  const locked = !!recipe.flag && !life.flags?.includes(recipe.flag);
  const max = locked ? 0 : recipeMax(me, recipe);
  const count = Math.max(1, Math.min(n, Math.max(1, max)));
  const dish = mode === 'cook' ? DISHES.find((d) => d.id === recipe.id) : undefined;
  const buff = me.buff && me.buff.until > now ? me.buff : null;
  const make = async () => {
    const what = madeName(recipe);
    const ok = await run(
      { kind: mode, recipe: recipe.id, n: count },
      mode === 'cook'
        ? `${josa(what, '을/를')} ${count}개 만들었어요. 가방에 담았어요.`
        : `${josa(what, '을/를')} ${count * recipe.count}개 만들었어요.${recipe.makes.startsWith('furn-') ? ' 내 방 꾸미기의 “내 가구”에 있어요.' : ''}`,
    );
    if (ok) {
      lifeSfx('cook');
      setN(1);
    }
  };
  return (
    <Modal title="요리·만들기" onClose={onClose} className="l-life-modal l-kitchen" wide>
      <p className="l-modal-intro">
        {buff ? (
          <>
            <Sparkles size={14} aria-hidden="true" /> 오늘의 효과 <b>{buff.name}</b> · {buff.text}
          </>
        ) : me.ate ? (
          '오늘은 이미 든든하게 먹었어요.'
        ) : (
          '효과가 있는 요리를 먹으면 오늘 하루 특별한 힘이 생겨요 (하루 한 번).'
        )}
      </p>
      <div className="l-mail-tabs" role="tablist" aria-label="요리·만들기">
        <button
          role="tab"
          aria-selected={mode === 'cook'}
          onClick={() => {
            setMode('cook');
            setPicked(DISHES[0].id);
            setN(1);
          }}
          data-testid="kitchen-tab-cook"
        >
          <ChefHat size={15} /> 요리
        </button>
        <button
          role="tab"
          aria-selected={mode === 'craft'}
          onClick={() => {
            setMode('craft');
            setPicked(CRAFTS[0].id);
            setN(1);
          }}
          data-testid="kitchen-tab-craft"
        >
          <Hammer size={15} /> 만들기
        </button>
      </div>
      <div className="l-kitchen-body">
        <ul className="l-recipe-list" aria-label={mode === 'cook' ? '요리 목록' : '만들기 목록'}>
          {list.map((r) => {
            const lock = !!r.flag && !life.flags?.includes(r.flag);
            const can = lock ? 0 : recipeMax(me, r);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={recipe.id === r.id}
                  data-ready={can > 0 || undefined}
                  data-locked={lock || undefined}
                  onClick={() => {
                    setPicked(r.id);
                    setN(1);
                  }}
                  data-testid={`recipe-${r.id}`}
                >
                  <ItemIcon id={r.makes} size={30} />
                  <span>
                    <strong>{madeName(r)}</strong>
                    <small>{lock ? '마을 복원이 필요해요' : can > 0 ? `${can}번 만들 수 있어요` : '재료가 부족해요'}</small>
                  </span>
                  {lock && <Lock size={14} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <section className="l-recipe-detail" aria-live="polite" data-testid="recipe-detail">
          <div className="l-inv-detail-head">
            <ItemIcon id={recipe.makes} size={64} />
            <div>
              <strong>
                {madeName(recipe)}
                {recipe.count > 1 ? ` ×${recipe.count}` : ''}
              </strong>
              <small>
                {dish ? dish.note : recipe.makes.startsWith('furn-') ? '내 방에 놓는 가구' : '농사·낚시에 쓰는 도구'}
                {dish && dish.sell ? ` · 팔면 ${formatBeom(dish.sell)}` : ''}
              </small>
            </div>
          </div>
          {dish?.buff && (
            <p className="l-recipe-buff">
              <Soup size={14} aria-hidden="true" /> 먹으면 <b>{BUFF_INFO[dish.buff].name}</b> · {BUFF_INFO[dish.buff].text}
            </p>
          )}
          <ul className="l-needs">
            {recipe.needs.map((need, i) => {
              const have = needHave(me, need, view.wallet.balance),
                enough = have >= need.n * count;
              return (
                <li key={i} data-enough={enough || undefined}>
                  {'item' in need ? <ItemIcon id={need.item} size={24} /> : <span className="l-need-any" aria-hidden="true" />}
                  <span>{needLabel(need)}</span>
                  <b>
                    가진 {have.toLocaleString('ko-KR')} / 필요 {(need.n * count).toLocaleString('ko-KR')}
                  </b>
                </li>
              );
            })}
          </ul>
          {locked ? (
            <p className="l-why">
              <Lock size={13} aria-hidden="true" /> {VILLAGE_FLAGS[recipe.flag!] ?? '마을 복원'}이 필요해요. 마을 게시판의 꾸러미를 채워 주세요.
            </p>
          ) : (
            <div className="l-inv-sell">
              <label>
                <span>만들 개수</span>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, max)}
                  value={count}
                  disabled={max <= 1}
                  onChange={(e) => setN(Number(e.target.value))}
                  aria-valuetext={`${count}번`}
                />
                <output>{count}번</output>
              </label>
              <button className="l-primary" disabled={busy || max < 1} onClick={() => void make()} data-testid="recipe-make">
                {mode === 'cook' ? <ChefHat size={15} /> : <Hammer size={15} />} {mode === 'cook' ? '요리하기' : '만들기'}
              </button>
            </div>
          )}
          {dish?.buff && (me.inv?.[dish.id] ?? 0) > 0 && (
            <button
              className="l-secondary"
              disabled={busy || !!me.ate}
              onClick={() =>
                void run({ kind: 'eat', item: dish.id }, `${josa(dish.name, '을/를')} 먹었어요. 오늘은 ${BUFF_INFO[dish.buff!].name}!`).then(
                  (ok) => ok && lifeSfx('eat'),
                )
              }
              data-testid="recipe-eat"
            >
              <Soup size={15} /> {me.ate ? '오늘은 이미 먹었어요' : `지금 먹기 (${me.inv?.[dish.id]}개)`}
            </button>
          )}
        </section>
      </div>
    </Modal>
  );
}
