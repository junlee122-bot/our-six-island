'use client';
import { useRef, useState } from 'react';
import { ACTORS } from '../lounge-roster';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { FinanceAction } from '../lounge-finance';
import { LENDER_NAME } from '../lounge-casino-lender';
import { LOUNGE_ASSETS } from '../lounge-assets';
import { formatBeom } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { Modal } from './Modal';
import { useNow } from './use-now';
import './finance.css';

type Page = 'bank' | 'notes' | 'casino' | 'rob';
const pages = [{ id: 'bank', label: '보관함' }, { id: 'notes', label: '차용증' }, { id: 'casino', label: '카지노 창구' }, { id: 'rob', label: '강도 놀이' }] as const;
const date = (at: number) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(at);
export function FinancePanel({ room, view, onClose, initial = 'bank' }: {
  room: CloudRoom; view: CloudRoomView; onClose: () => void; initial?: Page;
}) {
  const [page, setPage] = useState<Page>(initial), [amount, setAmount] = useState(1000),
    [target, setTarget] = useState(''), [interest, setInterest] = useState(0), [days, setDays] = useState(3),
    [loot, setLoot] = useState<'cash' | 'produce' | 'furniture'>('cash'), [busy, setBusy] = useState(false);
  const now = useNow(true, 30_000) + view.clockOffset;
  const inFlight = useRef(false);
  const data = view.finance, uid = view.self, mine = view.players.find((p) => p.id === uid),
    casino = mine?.area === 'casino', friends = ACTORS.map((name, actor) => ({ name, actor })).filter((f) => f.actor !== mine?.actor);
  const run = async (action: FinanceAction) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await room.action(action);
    } finally { inFlight.current = false; setBusy(false); }
  };
  const button = (label: string, action: FinanceAction, off = false) => <GameButton disabled={busy || off} onClick={() => void run(action)}>{label}</GameButton>;
  return <Modal title="범마을 은행" wide className="l-finance" venue={page === 'casino' ? 'casino' : undefined} onClose={onClose}>
    {!data ? <p role="status">은행 장부를 불러오는 중이에요. 잠시 뒤 다시 열어 주세요.</p> : <>
      {(page === 'bank' || page === 'notes') && <div className="l-finance-clerk" data-testid="bank-clerk">
        <img src={LOUNGE_ASSETS.bankClerkSprite} alt="고양이 귀와 꼬리가 있는 은행원 냐모" />
        <div><h3>냐모 <span>범마을 은행원</span></h3><p>{page === 'notes' ? '친구와의 약속은 차용증에 남겨요. 조건을 함께 확인한 뒤에 범을 보내 드릴게요.' : data.stored > 0 ? '맡긴 범은 잘 지키고 있어요. 필요한 만큼 찾아가세요.' : '어서 와요. 오늘은 얼마를 맡길까요? 보관함은 제가 지킬게요.'}</p></div>
      </div>}
      <div className="l-finance-balances"><span>소지금 <strong>{formatBeom(view.wallet.balance)}</strong></span><span>보관금 <strong>{formatBeom(data.stored)}</strong></span></div>
      {data.loans.some((l) => l.borrower === uid && l.state === 'active' && l.dueAt <= now) && <p className="l-finance-due" role="status">상환 기한이 지난 차용증이 있어요. 차용증 탭에서 남은 금액을 확인하고 직접 갚아 주세요.</p>}
      <Tabs items={pages.map((p) => ({ ...p }))} value={page} onChange={setPage} label="은행 업무" idBase="finance" />
      <section {...tabPanelProps('finance', page)} className="l-finance-page">
        {page === 'bank' && <>
          <h3>안전 보관함</h3><p>맡긴 범은 게임 판돈이나 강도 놀이로 사용되지 않아요. 보관 이자는 없어요.</p>
          <label>맡기거나 찾을 금액<input type="number" min="1" max="500000000" step="100" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
          <div className="l-finance-actions">{button('맡기기', { kind: 'finance', op: 'deposit', amount }, amount <= 0 || amount > view.wallet.balance)}{button('찾기', { kind: 'finance', op: 'withdraw', amount }, amount <= 0 || amount > data.stored)}</div>
          <p>친구에게 돈을 빌려줄 때는 차용증을 쓰세요. 상대가 조건을 수락해야 송금돼요.</p>
        </>}
        {page === 'notes' && <>
          <h3>친구에게 빌려주기</h3><div className="l-finance-form">
            <label>빌릴 친구<select value={target} onChange={(e) => setTarget(e.target.value)}><option value="">친구 선택</option>{friends.map((f) => <option key={f.actor} value={f.actor}>{f.name}</option>)}</select></label>
            <label>원금<input type="number" min="100" max="500000" step="100" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
            <label>한 번 붙는 이자 (%)<input type="number" min="0" max="10" value={interest} onChange={(e) => setInterest(Number(e.target.value))} /></label>
            <label>수락 후 기한 (일)<input type="number" min="1" max="14" value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
          </div>
          <p>총 상환액 <strong>{formatBeom(amount + Math.floor(amount * interest / 100))}</strong> · 24시간 안에 수락 · 자동 인출 없음</p>
          {button('이 조건으로 차용증 보내기', { kind: 'finance', op: 'offer', to: Number(target), amount, interest, days }, target === '' || amount > view.wallet.balance)}
          <h3>내 차용증</h3>
          {!data.loans.length && <p>아직 주고받은 차용증이 없어요.</p>}
          {data.loans.slice().reverse().map((l) => {
            const remaining = l.principal + l.interest - l.paid, borrowing = l.borrower === uid,
              lender = l.lender === 'house' ? LENDER_NAME : ACTORS[l.lenderActor ?? -1] ?? '친구', borrower = ACTORS[l.borrowerActor] ?? '친구';
            return <article className="l-finance-note" key={l.id}>
              <h4>{lender} → {borrower}</h4><p>원금 {formatBeom(l.principal)} + 이자 {formatBeom(l.interest)} · 남은 {formatBeom(remaining)}</p>
              <p>{l.state === 'offered' ? l.expired ? '수락 기한이 지났어요.' : `${l.days}일 약정 · 상대 수락 대기` : l.state === 'active' ? `만기 ${date(l.dueAt)}${now >= l.dueAt ? ' · 연체 중' : ''}` : l.state === 'paid' ? '모두 갚았어요.' : '거절한 차용증'}</p>
              <div className="l-finance-actions">
                {l.state === 'offered' && borrowing && !l.expired && <>{button('조건 확인 · 수락', { kind: 'finance', op: 'accept', id: l.id })}{button('거절', { kind: 'finance', op: 'decline', id: l.id })}</>}
                {l.state === 'active' && borrowing && (l.lender === 'house' ? <p>상환하려면 카지노의 {LENDER_NAME}를 찾아가세요.</p> : <>{button(`${formatBeom(Math.min(1000, remaining))} 갚기`, { kind: 'finance', op: 'repay', id: l.id, amount: Math.min(1000, remaining) }, view.wallet.balance < Math.min(1000, remaining))}{button('전액 갚기', { kind: 'finance', op: 'repay', id: l.id, amount: remaining }, view.wallet.balance < remaining)}</>)}
                {l.state === 'active' && !borrowing && button('독촉 쪽지 보내기', { kind: 'finance', op: 'remind', id: l.id }, now < l.dueAt)}
              </div>
            </article>;
          })}
        </>}
        {page === 'casino' && <>
          <h3>오늘 루미의 장부</h3><div className="l-finance-balances"><span>받은 범 <strong>{formatBeom(data.casino.earned)}</strong></span><span>승자에게 준 범 <strong>{formatBeom(data.casino.paid)}</strong></span><span>환급 후 순수익 <strong>{formatBeom(data.casino.profit)}</strong></span></div>
          <p>한국 시간 오늘의 블랙잭 정산이에요. 포커 판돈은 친구끼리 나누므로 루미 수익에 포함하지 않아요. 기록은 이번 업데이트부터 쌓여요.</p>
          <p>내 블랙잭 순손익 <strong>{formatBeom(data.casino.myNet)}</strong></p>
          {button(data.casino.mercyUsed ? `오늘 부탁 완료 · ${formatBeom(data.casino.refund)} 환급` : '루미에게 싹싹 빌기', { kind: 'finance', op: 'mercy' }, !casino || data.casino.mercyUsed || data.casino.myNet >= 0)}
          <p>하루 한 번 · 성공 30% · 오늘 블랙잭 순손실의 50%를 돌려줘요. 금액 상한은 없어요.</p>
          {!casino && <p>루미에게 부탁하기는 카지노에 들어가서 이용해 주세요.</p>}
          <p>카지노 대출과 상환은 카지노 안의 {LENDER_NAME}에게 직접 찾아가세요.</p>
        </>}
        {page === 'rob' && <>
          <h3>방범 물품</h3><p>접속 중인 모든 친구가 강도 대상이에요. 자물쇠와 호루라기는 자동으로 지켜줘요.</p>
          <p>{data.protection.until > now ? `자물쇠 보호: ${date(data.protection.until)}까지` : '자물쇠 보호 없음'} · 호루라기 {data.protection.whistles}개</p>
          <div className="l-finance-actions">{button('24시간 자물쇠 · 1,500범', { kind: 'finance', op: 'protect', item: 'lock' }, view.wallet.balance < 1500 || data.protection.until > now)}{button('1회 호루라기 · 800범', { kind: 'finance', op: 'protect', item: 'whistle' }, view.wallet.balance < 800 || data.protection.whistles >= 3)}</div>
          <h3>강도 놀이</h3><p>마을에서 가까운 접속 친구에게 하루 한 번 시도할 수 있어요. 대상도 하루 한 번만. 게임·낚시 중인 친구는 보호돼요.</p>
          <div className="l-finance-form"><label>가까운 친구<select value={target} onChange={(e) => setTarget(e.target.value)}><option value="">친구 선택</option>{friends.filter((f) => view.players.some((p) => p.actor === f.actor && p.area === 'village')).map((f) => <option key={f.actor} value={f.actor}>{f.name}</option>)}</select></label>
            <label>대상<select value={loot} onChange={(e) => setLoot(e.target.value as typeof loot)}><option value="cash">소지금 3% · 최대 3,000범</option><option value="produce">일반 품질 수확물 1개</option><option value="furniture">2개 이상 가진 일반 가구 1개</option></select></label></div>
          <p>성공 35% · 발각되면 상대에게 최대 500범 지급. 보관금·예약 판돈·명품/기념 가구·마지막 가구는 보호해요.</p>
          {button(data.robbedToday ? '오늘 시도 완료' : '강도 놀이 시도', { kind: 'finance', op: 'rob', to: Number(target), item: loot }, target === '' || data.robbedToday)}
        </>}
      </section>
      <details className="l-finance-history"><summary>내 거래·독촉 기록</summary>{data.logs.map((l) => <p key={l.id}><time>{date(l.at)}</time> {l.text}</p>)}</details>
    </>}
  </Modal>;
}
