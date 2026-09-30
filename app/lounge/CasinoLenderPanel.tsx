'use client';
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { FinanceAction } from '../lounge-finance';
import { LOUNGE_ASSETS } from '../lounge-assets';
import { LENDER_NAME, nearCasinoLender } from '../lounge-casino-lender';
import { formatBeom } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { Modal } from './Modal';
import { useNow } from './use-now';
import './casino-lender.css';

const date = (at: number) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(at);
const validAmount = (n: number, min: number, max: number) => Number.isSafeInteger(n) && n >= min && n <= max;

export function CasinoLenderPanel({ room, view, onClose }: {
  room: CloudRoom; view: CloudRoomView; onClose: () => void;
}) {
  const [amount, setAmount] = useState(1000), [repay, setRepay] = useState(1000);
  const [busy, setBusy] = useState(false), [reply, setReply] = useState({ text: '', until: 0 });
  const inFlight = useRef(false);
  const now = useNow(true, 1000) + view.clockOffset;
  const me = view.players.find((p) => p.id === view.self);
  const loans = (view.finance?.loans ?? []).filter((l) => l.lender === 'house' && l.borrower === view.self);
  const active = loans.find((l) => l.state === 'active');
  const remaining = active ? active.principal + active.interest - active.paid : 0;
  const paying = Math.min(repay, remaining);
  const playing = Object.values(view.tables ?? {}).some((t) => t?.members.includes(view.self ?? ''));
  const fishing = (view.life?.me.fishing.pending?.expiresAt ?? 0) > now;
  const unavailable = !me || view.status !== 'connected' ? '마을에 다시 연결되면 거래할 수 있어요.'
    : !nearCasinoLender(me, me.area) ? `카지노 안에서 ${LENDER_NAME} 앞으로 와 주세요.`
      : playing || fishing ? '게임이나 낚시를 마친 뒤 이야기해요.' : '';
  const greeting = active ? now >= active.dueAt
    ? '약속한 날이 지났네. 이제부턴 네가 가진 범에서 알아서 걷어 갈게.'
    : '네 이름은 장부에 있어. 약속한 날까지 정리해 줘. 나도 약속은 지키거든.'
    : loans.some((l) => l.state === 'paid') ? '깔끔하게 갚았네. 그런 손님은 기억해 두지. 다음 거래도 조건부터 읽어.'
      : '난 로제. 급한 범이 필요해? 조건은 간단해. 잘 읽고 네가 결정해.';
  const run = async (action: FinanceAction) => {
    if (inFlight.current || unavailable) return;
    inFlight.current = true;
    setBusy(true);
    setReply({ text: '', until: 0 });
    try {
      if (await room.action(action)) {
        const text = action.op === 'borrow' ? '범은 네 주머니에 넣었어. 약속한 날짜, 잊지 마.'
          : action.op === 'repay' && action.amount >= remaining ? '장부 정리 끝. 약속을 지키는 손님, 마음에 드네.'
            : '받았어. 남은 금액은 장부에 적어 둘게.';
        setReply({ text, until: Date.now() + room.snapshot().clockOffset + 12000 });
      }
    } finally { inFlight.current = false; setBusy(false); }
  };
  const disabled = busy || !!unavailable || !view.finance;
  const history = loans.filter((l) => l !== active).slice().reverse();
  return <Modal title={`${LENDER_NAME}의 대출 장부`} wide venue="casino" className="l-casino-lender" onClose={onClose}>
    <div className="l-lender-layout" data-testid="casino-lender-panel" aria-busy={busy}>
      <aside className="l-lender-host">
        <img src={LOUNGE_ASSETS.casinoLenderSprite} alt="붉은 머리의 해적 상인 로제" className="l-lender-portrait" />
        <h3>{LENDER_NAME}</h3><p>별빛 카지노의 해적 상인</p>
        <output className="l-lender-speech" aria-live="polite">{reply.until > now ? reply.text : greeting}</output>
      </aside>
      <div className="l-lender-book">
        <div className="l-lender-balance">내 소지금 <strong>{formatBeom(view.wallet.balance)}</strong></div>
        {unavailable && <output className="l-lender-location" data-testid="lender-location">{unavailable}</output>}
        {!view.finance ? <p>내 장부를 불러오는 중이에요.</p> : active ? <section className="l-lender-contract" data-testid="lender-active-note">
          <header><h3>{now >= active.dueAt ? '기한이 지난 내 대출' : '갚고 있는 내 대출'}</h3></header>
          <dl className="l-lender-totals">
            <div><dt>빌린 돈</dt><dd>{formatBeom(active.principal)}</dd></div>
            <div><dt>한 번 붙는 이자</dt><dd>{formatBeom(active.interest)}</dd></div>
            <div><dt>갚은 돈</dt><dd>{formatBeom(active.paid)}</dd></div>
            <div><dt>남은 돈</dt><dd><strong>{formatBeom(remaining)}</strong></dd></div>
          </dl>
          <p>상환 기한 <strong>{date(active.dueAt)}</strong> · 추가 연체이자 없음 · 기한이 지나면 소지금과 은행 예금에서 자동으로 회수돼요</p>
          <label>이번에 갚을 금액<input data-testid="lender-repay-amount" type="number" min="1" max={remaining} step="1" value={paying} disabled={busy} onChange={(e) => setRepay(Number(e.target.value))} /></label>
          <div className="l-lender-actions">
            <GameButton data-testid="lender-repay" disabled={disabled || !validAmount(paying, 1, remaining) || paying > view.wallet.balance} onClick={() => void run({ kind: 'finance', op: 'repay', id: active.id, amount: paying })}>입력한 금액 갚기</GameButton>
            <GameButton data-testid="lender-repay-all" variant="primary" disabled={disabled || remaining > view.wallet.balance} onClick={() => void run({ kind: 'finance', op: 'repay', id: active.id, amount: remaining })}>{formatBeom(remaining)} 전액 갚기</GameButton>
          </div>
          {view.wallet.balance < remaining && <p>전액 상환에는 소지금이 부족해요. 일부 금액부터 갚을 수 있어요.</p>}
          <p>지금 대출을 모두 갚으면 새로 빌릴 수 있어요.</p>
        </section> : <section className="l-lender-contract">
          <h3>새 대출 조건</h3>
          <p>1,000~30,000범 · 3일 약정<br />이자는 한 번만 30% · 추가 연체이자 없음<br />기한이 지나면 소지금과 은행 예금에서 자동 회수</p>
          <label>빌릴 금액<input data-testid="lender-borrow-amount" type="number" min="1000" max="30000" step="1000" value={amount} disabled={busy} onChange={(e) => setAmount(Number(e.target.value))} /></label>
          <dl className="l-lender-totals">
            <div><dt>받는 돈</dt><dd>{formatBeom(validAmount(amount, 1000, 30000) ? amount : 0)}</dd></div>
            <div><dt>갚을 총액</dt><dd><strong>{formatBeom(validAmount(amount, 1000, 30000) ? amount + Math.floor(amount * .3) : 0)}</strong></dd></div>
          </dl>
          <p>계약한 시각부터 3일 뒤까지 갚아요. 상환도 내 앞에서 직접 해 줘.</p>
          <GameButton data-testid="lender-borrow" variant="primary" disabled={disabled || !validAmount(amount, 1000, 30000)} onClick={() => void run({ kind: 'finance', op: 'borrow', amount })}>조건을 확인했어요 · 빌리기</GameButton>
        </section>}
        <details className="l-lender-history" data-testid="lender-history"><summary>이전 대출 장부 · {history.length}건</summary>
          {!history.length && <p>이전에 작성한 대출 장부가 없어요.</p>}
          {history.map((loan) => <article key={loan.id}><h4>{loan.state === 'paid' ? '완납' : '대출 기록'} · {date(loan.offeredAt)}</h4><p>원금 {formatBeom(loan.principal)} + 이자 {formatBeom(loan.interest)}<br />갚은 돈 {formatBeom(loan.paid)} · 만기 {date(loan.dueAt)}</p></article>)}
        </details>
      </div>
    </div>
  </Modal>;
}
