'use client';
// 가방 (I): a category grid of everything I carry (seeds, crops with quality
// stars, fish, bugs, forage, dishes, furniture, materials). Hover shows name,
// quality, sell price and where it comes from; drag a seed, tool or dish onto
// the hotbar; sell (with a quality choice for crops), eat or gift from here.
import { useMemo, useState } from 'react';
import { Coins, Gift, Landmark, Soup, Store } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { CROP_INFO, SELL_MAX_N, type Crop, type Quality } from '../lounge-life';
import { ITEM_BY_ID, FURNITURE_BY_REF, DISH_BY_ID, BUFF_INFO } from '../lounge-items';
import { formatBeom, josa } from '../lounge-text';
import {
  INV_GROUPS,
  QUALITY_LABEL,
  cropPrice,
  cropSplit,
  inventoryEntries,
  whereFrom,
  type InvEntry,
  type InvGroup,
} from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon, QualityStar } from './ItemIcon';
import { Hotbar, HOTBAR_DRAG_TYPE, type HotbarState } from './LifeHud';
import { useLifeAction } from './LifePanels';
import './life-plus.css';

function EntryTip({ entry, museum }: { entry: InvEntry; museum: boolean }) {
  const note =
    ITEM_BY_ID[entry.id]?.note ??
    (entry.id.startsWith('seed-') ? '' : CROP_INFO[entry.id as Crop] ? '' : FURNITURE_BY_REF[entry.id] ? '내 방에 놓을 수 있어요.' : '');
  return (
    <>
      <strong>
        {entry.name}
        {entry.quality ? (
          <>
            {' '}
            <QualityStar quality={entry.quality} /> {QUALITY_LABEL[entry.quality]}
          </>
        ) : null}
      </strong>
      <small>{whereFrom(entry.id)}</small>
      {note && <small className="l-inv-note">{note}</small>}
      <span className="l-inv-tip-meta">
        {entry.sell > 0 ? `개당 ${formatBeom(entry.sell)}` : '팔 수 없어요'}
        {entry.museum ? (museum ? ' · 박물관에 있어요' : ' · 박물관에 기증할 수 있어요') : ''}
      </span>
    </>
  );
}

export function InventoryPanel({
  room,
  view,
  notify,
  onClose,
  hotbar,
  onGift,
  onShop,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  hotbar: HotbarState;
  /** Opens mail compose with this item as the gift. */
  onGift: (id: string) => void;
  onShop: () => void;
}) {
  const life = view.life;
  const [group, setGroup] = useState<InvGroup | 'all'>('all');
  const [picked, setPicked] = useState<string | null>(null);
  const [n, setN] = useState(1);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [run, busy] = useLifeAction(room, notify);
  // One floating tooltip (fixed to the viewport) so the scrolling grid never clips it.
  const [tip, setTip] = useState<{ key: string; x: number; y: number; below: boolean } | null>(null);
  const entries = useMemo(() => (life ? inventoryEntries(life.me) : []), [life]);
  if (!life)
    return (
      <Modal title="가방" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 가방을 열 수 있어요.</p>
      </Modal>
    );
  const shown = entries.filter((e) => group === 'all' || e.group === group);
  const entry = entries.find((e) => e.key === picked) ?? null;
  const cap = life.sellCapLeft;
  const counts = Object.fromEntries(INV_GROUPS.map(([g]) => [g, entries.filter((e) => e.group === g).reduce((s, e) => s + e.n, 0)]));
  // Crops: pick the quality to sell (defaults to the row's own tier).
  const crop = entry && CROP_INFO[entry.id as Crop] ? (entry.id as Crop) : null;
  const split = crop ? cropSplit(life.me, crop) : null;
  const q: Quality = crop ? (quality ?? entry?.quality ?? 0) : 0;
  const have = crop && split ? split[q] : (entry?.n ?? 0);
  const price = crop ? cropPrice(crop, q) : (entry?.sell ?? 0);
  const count = Math.max(1, Math.min(n, have, SELL_MAX_N));
  const total = price * count;
  const donated = !!(entry && life.museum?.[entry.id]);
  const sell = async () => {
    if (!entry) return;
    const ok = crop
      ? await run({ kind: 'sell', crop, n: count, quality: q }, `${QUALITY_LABEL[q] === '보통' ? '' : QUALITY_LABEL[q] + ' '}${entry.name} ${count}개를 ${formatBeom(total)}에 팔았어요.`, 'coin')
      : entry.id === 'fruit'
        ? await run({ kind: 'sell', crop: 'fruit', n: count }, `과일 ${count}개를 ${formatBeom(total)}에 팔았어요.`, 'coin')
        : await run({ kind: 'sellItem', item: entry.id, n: count }, `${entry.name} ${count}개를 ${formatBeom(total)}에 팔았어요.`, 'coin');
    if (ok) setN(1);
  };
  const dish = entry ? DISH_BY_ID[entry.id] : undefined;
  return (
    <Modal title="가방" onClose={onClose} className="l-life-modal l-inventory" wide>
      <div className="l-inv-head">
        <p className="l-modal-intro">
          <Coins size={15} aria-hidden="true" /> 내 지갑 <b>{formatBeom(view.wallet.balance)}</b> · 오늘 더 팔 수 있어요{' '}
          <b data-testid="sell-cap">{formatBeom(cap)}</b>
        </p>
        <button type="button" className="l-secondary" onClick={onShop}>
          <Store size={15} /> 상점
        </button>
      </div>
      <div className="l-mail-tabs l-inv-tabs" role="tablist" aria-label="가방 칸">
        <button role="tab" aria-selected={group === 'all'} onClick={() => setGroup('all')}>
          전체 <small>{entries.reduce((sum, e) => sum + e.n, 0)}</small>
        </button>
        {INV_GROUPS.map(([g, label]) => (
          <button key={g} role="tab" aria-selected={group === g} onClick={() => setGroup(g)} data-testid={`inv-tab-${g}`}>
            {label} <small>{counts[g] ?? 0}</small>
          </button>
        ))}
      </div>
      <div className="l-inv-body">
        <ul className="l-inv-grid" aria-label="가방에 든 것" data-testid="inv-grid">
          {shown.map((e) => (
            <li key={e.key}>
              <button
                type="button"
                className="l-inv-slot"
                aria-pressed={picked === e.key}
                aria-label={`${e.name}${e.quality ? ' ' + QUALITY_LABEL[e.quality] : ''} ${e.n}개`}
                draggable={e.hotbar}
                data-key={e.key}
                data-group={e.group}
                onDragStart={(ev) => {
                  ev.dataTransfer.setData(HOTBAR_DRAG_TYPE, e.id);
                  ev.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => {
                  setPicked(e.key);
                  setQuality(null);
                  setN(1);
                }}
                onMouseEnter={(ev) => {
                  const r = ev.currentTarget.getBoundingClientRect();
                  setTip({ key: e.key, x: r.left + r.width / 2, y: r.top < 200 ? r.bottom : r.top, below: r.top < 200 });
                }}
                onFocus={(ev) => {
                  const r = ev.currentTarget.getBoundingClientRect();
                  setTip({ key: e.key, x: r.left + r.width / 2, y: r.top < 200 ? r.bottom : r.top, below: r.top < 200 });
                }}
                onMouseLeave={() => setTip((t) => (t?.key === e.key ? null : t))}
                onBlur={() => setTip((t) => (t?.key === e.key ? null : t))}
                aria-describedby={tip?.key === e.key ? 'l-inv-tip' : undefined}
              >
                <ItemIcon id={e.id} size={40} quality={e.quality} />
                <b className="l-item-count">{e.n}</b>
              </button>
            </li>
          ))}
          {!shown.length && <li className="l-inv-empty">아직 비어 있어요. 마을에서 낚시하고, 채집하고, 수확해 보세요.</li>}
        </ul>
        <aside className="l-inv-detail" aria-live="polite" data-testid="inv-detail">
          {!entry ? (
            <p className="l-help-text">칸을 누르면 여기서 팔거나, 먹거나, 선물할 수 있어요. 씨앗·도구·요리는 아래 핫바로 끌어다 놓아요.</p>
          ) : (
            <>
              <div className="l-inv-detail-head">
                <ItemIcon id={entry.id} size={64} quality={crop ? q : entry.quality} />
                <div>
                  <strong>{entry.name}</strong>
                  <small>{whereFrom(entry.id)}</small>
                </div>
              </div>
              {ITEM_BY_ID[entry.id]?.note && <p className="l-help-text">{ITEM_BY_ID[entry.id].note}</p>}
              {crop && split && (
                <fieldset className="l-quality-pick" aria-label="팔 품질">
                  {([0, 1, 2] as Quality[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={q === t}
                      disabled={!split[t]}
                      onClick={() => {
                        setQuality(t);
                        setN(1);
                      }}
                      data-testid={`inv-quality-${t}`}
                    >
                      {t ? <QualityStar quality={t} /> : null} {QUALITY_LABEL[t]} {split[t]}개
                      <small>{formatBeom(cropPrice(crop, t))}</small>
                    </button>
                  ))}
                </fieldset>
              )}
              {price > 0 && have > 0 && (
                <div className="l-inv-sell">
                  <label>
                    <span>팔 개수</span>
                    <input
                      type="range"
                      min={1}
                      max={Math.max(1, Math.min(have, SELL_MAX_N))}
                      value={count}
                      onChange={(e) => setN(Number(e.target.value))}
                      aria-valuetext={`${count}개`}
                    />
                    <output>{count}개</output>
                  </label>
                  <button className="l-primary" disabled={busy || total > cap} onClick={() => void sell()} data-testid="inv-sell">
                    <Coins size={15} /> {formatBeom(total)}에 팔기
                  </button>
                  {total > cap && <small className="l-why">오늘 판매 한도를 넘어요</small>}
                </div>
              )}
              <div className="l-inv-actions">
                {dish?.buff && (
                  <button
                    className="l-secondary"
                    disabled={busy || !!life.me.ate}
                    onClick={() =>
                      void run({ kind: 'eat', item: entry.id }, `${josa(entry.name, '을/를')} 먹었어요. 오늘은 ${BUFF_INFO[dish.buff!].name}!`).then(
                        (ok) => ok && lifeSfx('eat'),
                      )
                    }
                    data-testid="inv-eat"
                  >
                    <Soup size={15} /> {life.me.ate ? '오늘은 이미 먹었어요' : `먹기 · ${BUFF_INFO[dish.buff].name}`}
                  </button>
                )}
                {entry.group !== 'seed' && entry.group !== 'furniture' && ITEM_BY_ID[entry.id]?.kind !== 'tool' && (
                  <button className="l-secondary" onClick={() => onGift(entry.id)} data-testid="inv-gift">
                    <Gift size={15} /> 선물하기
                  </button>
                )}
                {entry.museum && (
                  <span className="l-inv-museum">
                    <Landmark size={14} aria-hidden="true" /> {donated ? '박물관에 전시 중' : '박물관에 기증할 수 있어요'}
                  </span>
                )}
              </div>
              {dish?.buff && <p className="l-help-text">{BUFF_INFO[dish.buff].text}</p>}
            </>
          )}
        </aside>
      </div>
      {tip && entries.find((x) => x.key === tip.key) && (
        <div
          id="l-inv-tip"
          role="tooltip"
          className="l-inv-tip"
          data-below={tip.below || undefined}
          data-testid="inv-tip"
          style={{ left: tip.x, top: tip.y }}
        >
          <EntryTip entry={entries.find((x) => x.key === tip.key)!} museum={!!life.museum?.[tip.key.split('@')[0]]} />
        </div>
      )}
      <div className="l-inv-hotbar">
        <small>핫바: 씨앗·도구·요리를 끌어다 놓고 1–9로 골라요. 오른쪽 클릭하면 비워요.</small>
        <Hotbar hotbar={hotbar} life={life} />
      </div>
    </Modal>
  );
}
