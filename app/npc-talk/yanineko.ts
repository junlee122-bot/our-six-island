// 야니네코 — 청년 자취방의 고양이 귀 대학생. 나른하고 귀찮아하는 반말("…귀찮아",
// "~거든", "~야. 아마.", "꼬리 보지 마"), 표정 없는 단조로운 말투로 귀여움을
// 스스로 깎아 먹는다. 게으른 척하지만 머리가 좋고, 잔나에게 동네 소문을 흘려준다.
// 생선 요리·따뜻한 음료·볕 좋은 자리를 좋아하고, 아침 수업과 비 오는 날의
// 달팽이는 질색. 고양이 버릇(상자, 컵 밀기, 꾹꾹이, 모른 척하다 나타나기),
// 밤 편의점 컵라면·야간 알바, 시험·과제, 힘멜과 같이 쓰는 자취방.
// 담배는 불 없이 물고만 있다(멋있게 그리지 않는다). 여섯 장 이야기는
// 무심한 척하는 고양이가 "버리기 싫은 것"을 모으는 상자를 열어 보이기까지.
// 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const YANINEKO_TALK: NpcTalkBook = {
  npc: 'yanineko',
  memories: {
    'sun-spot': '볕 좋은 비밀 자리를 같이 쓰기로 했어요',
    'fish-lover': '생선은 구이가 최고라고 했어요',
    'warm-drink': '따뜻한 꽃차를 사 주겠다고 했어요',
    'night-owl': '밤이 더 좋다고 했어요',
    'gossip-ok': '소문을 먼저 듣는 사이가 됐어요',
    'gossip-no': '소문보다 본인 이야기가 좋다고 했어요',
    'box-fan': '빈 상자에 같이 들어가 봤어요',
    'thesis': '낮잠 논문 이야기를 들었어요',
    'morning-help': '아침 수업에 깨워 주기로 했어요',
    'cupramen': '밤 편의점 컵라면을 같이 먹기로 했어요',
    'ear-wait': '귀는 허락할 때까지 안 만지기로 했어요',
    'quit-try': '담배를 끊는 걸 응원하기로 했어요',
    'snail-guard': '비 오는 날 달팽이를 치워 주기로 했어요',
    'bench-nap': '광장 벤치에서 같이 볕을 쬐었어요',
    'fish-share': '생선구이를 반씩 나눠 먹었어요',
    'library-spot': '도서관 숨은 낮잠 자리를 비밀로 해 주기로 했어요',
    'roommate': '힘멜과 같이 사는 자취방 이야기를 들었어요',
    'lux-tail': '어시장 꼬리 토막 이야기를 들었어요',
    'gossip-rule': '슬픈 소문은 안 판다는 규칙을 들었어요',
    'night-shift': '야간 알바 끝날 때 마중 가기로 했어요',
    'exam-help': '시험 공부를 같이 하기로 했어요',
    'kneading': '꾹꾹이 버릇을 들켜 버렸대요',
    'roof-stars': '지붕 위에서 별을 같이 보기로 했어요',
    'tail-secret': '꼬리는 거짓말을 못 한다고 했어요',
    'home-letter': '고향에서 온 말린 생선 이야기를 들었어요',
    'future-talk': '졸업하고도 이 동네에 있고 싶대요',
    'milk-warm': '데운 우유를 좋아한다고 했어요',
    'autumn-sun': '가을 볕이 제일 좋다고 했어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일 생선 이야기를 나눴어요',
    'date-talk': '방 데이트한 날을 이야기했어요',
  },
  talks: [
    {
      id: 'sun-spot',
      open: '{me}, 비밀 하나 알려 줄까. 동네에서 제일 따뜻한 볕 자리. …귀찮지만.',
      replies: [
        { say: '같이 쓰자. 둘만 알기', tier: 'great', remember: 'sun-spot', face: 'shy', answer: ['…둘만. 좋아. 대신 오후 세 시 이후엔 내 자리야.', '아, 반쪽은 줄게. 꼬리 보지 마.'] },
        { say: '어딘데? 궁금해', tier: 'good', remember: 'sun-spot', answer: ['빵집 뒤 담벼락 아래. 오후엔 돌이 데워져.', '아무한테도 말하지 마. 잔나한테 특히.'] },
        { say: '볕은 다 똑같지 않아?', tier: 'meh', face: 'calm', answer: '…전혀 안 똑같아. 너 고양이 아니라서 모르는 거야. 불쌍하네.' },
      ],
    },
    {
      id: 'fish-way',
      open: '생선은 구이야, 회야, 탕이야. 이건 중요한 질문이야. 대답 잘해.',
      replies: [
        { say: '당연히 구이지', tier: 'great', remember: 'fish-lover', answer: ['…너 좀 아는구나. 껍질 바삭한 거.', '그거 하나면 하루가 살아. 과장 아니야. 조금 과장이야.'] },
        { say: '난 회가 좋아', tier: 'good', answer: '회도 좋아. 럭스가 썰어 주는 거면 더 좋고. 공짜라서.' },
        { say: '생선은 별로야', tier: 'meh', face: 'sorry', answer: '…그럼 네 몫은 내가 먹을게. 잘됐네. 서로 이득이야.' },
      ],
    },
    {
      id: 'warm-drink',
      open: '추운 날 따뜻한 거 한 잔 사 주는 사람, 그 사람 편이야. …싸지, 나.',
      replies: [
        { say: '그럼 꽃차 한 잔 살게', tier: 'great', remember: 'warm-drink', face: 'shy', answer: '…진짜? 꽃차는 반칙인데. 오늘부터 너 편이야. 취소 안 돼.' },
        { say: '나도 따뜻한 거 좋아', tier: 'good', answer: '그치. 손 시릴 때 컵 감싸는 게 제일 좋아. 마시는 건 그다음이야.' },
        { say: '난 찬 게 좋던데', tier: 'meh', face: 'calm', answer: '혀가 튼튼하구나. 난 고양이 혀라서 뜨거운 것도 식혀서 마셔.' },
      ],
    },
    {
      id: 'night-or-day',
      open: '너는 낮이 좋아, 밤이 좋아? 난 밤. 눈이 잘 보이거든. 장점은 그거 하나야.',
      replies: [
        { say: '나도 밤이 좋아', tier: 'great', remember: 'night-owl', answer: '…오. 같은 편이네. 밤산책 하다 마주치면 아는 척해 줄게. 가끔.' },
        { say: '낮에 볕 쬐는 것도 좋잖아', tier: 'good', answer: '그건 맞아. 낮엔 자고 밤엔 깨어 있고. 완벽한 하루지.' },
        { say: '밤엔 자야지', tier: 'meh', face: 'calm', answer: '건전하네. 나랑은 안 맞는 말이야. 그래도 잘 자.' },
      ],
    },
    {
      id: 'gossip',
      open: '오늘 들은 소문 있는데. 들을래? 잔나한텐 아직 안 팔았어.',
      replies: [
        { say: '나한테 먼저? 영광이다', tier: 'great', remember: 'gossip-ok', face: 'laugh', answer: ['큰 건 아니고, 빵집 오븐이 오늘 두 번 꺼졌대.', '…이거 잔나한테 팔면 커피 한 잔이야. 너한텐 공짜.'] },
        { say: '남 얘기보다 네 얘기 해', tier: 'good', remember: 'gossip-no', face: 'think', answer: '…나? 할 얘기 없는데. 잤어. 먹었어. 또 잤어. 끝.' },
        { say: '관심 없어', tier: 'meh', face: 'calm', answer: '그래. 그럼 잔나한테 팔러 간다. 손해 본 건 너야.' },
      ],
    },
    {
      id: 'box',
      open: '빈 상자 보면 들어가 보고 싶지 않아? …나만 그래? 이유는 묻지 마.',
      replies: [
        { say: '나도 들어가 볼래', tier: 'great', remember: 'box-fan', face: 'laugh', answer: ['…좁은데. 뭐, 너면 괜찮아.', '무릎 접어. 이게 상자의 예의야.'] },
        { say: '좁지 않아?', tier: 'good', answer: '좁으니까 좋은 거야. 사방이 막혀 있으면 마음이 놓여. 설명은 귀찮아.' },
        { say: '그건 고양이 습관이잖아', tier: 'meh', face: 'calm', answer: '…그래서 뭐. 귀 달린 대학생도 상자는 좋아할 수 있어.' },
      ],
    },
    {
      id: 'thesis',
      open: '내 논문 주제 알아? 낮잠의 효율. 진지해. 제목만 있지만.',
      replies: [
        { say: '결론이 뭔데?', tier: 'great', remember: 'thesis', face: 'think', answer: ['결론은… 볕 아래서 자면 효율이 두 배야.', '근거는 내 경험. 표본은 하나. 교수님은 웃었어.'] },
        { say: '교수님이 허락했어?', tier: 'good', answer: '허락은 안 했는데 거절도 안 했어. 그럼 된 거지. 머리 좋지.' },
        { say: '그게 논문이야?', tier: 'meh', face: 'calm', answer: '…다들 그 말 해. 그래서 아직 제목밖에 없는 거야.' },
      ],
    },
    {
      id: 'morning-class',
      open: '아침 수업 또 빠졌어. 알람은 들었어. 몸이 반대했을 뿐이야.',
      replies: [
        { say: '내일은 내가 깨워 줄게', tier: 'great', remember: 'morning-help', face: 'shy', answer: ['…진짜 올 거야?', '문 두드리면 한 번은 무시할 거야. 두 번째엔 나갈게. 아마.'] },
        { say: '오후 수업으로 바꿔', tier: 'good', answer: '그게 정답인데 그 수업이 아침에만 있어. 학교가 날 싫어해.' },
        { say: '그냥 게으른 거 아냐?', tier: 'meh', face: 'calm', answer: '…맞아. 근데 그걸 대놓고 말하는 건 반칙이야.' },
      ],
    },
    {
      id: 'cupramen',
      open: '밤 편의점에 신상 컵라면 나왔대. 이게 요즘 내 인생의 낙이야.',
      replies: [
        { say: '오늘 밤 같이 가자', tier: 'great', remember: 'cupramen', answer: '…좋아. 국물은 내가 먼저. 뜨거우니까 식힐 시간도 줘야 해.' },
        { say: '몸에 안 좋잖아', tier: 'good', face: 'think', answer: '알아. 그래서 생선 얻어먹는 날엔 안 먹어. 균형이야. 나름.' },
        { say: '라면 안 먹어', tier: 'meh', face: 'calm', answer: '부자구나. 자취생한테 라면은 주식이야. 이해 못 해도 돼.' },
      ],
    },
    {
      id: 'desk-cup',
      open: '책상 끝에 컵 있으면 손으로 밀고 싶어져. 이해해? 떨어뜨린 적은 없어. 아직.',
      replies: [
        { say: '떨어지기 전에 내가 치울게', tier: 'great', face: 'laugh', answer: '…똑똑하네. 그게 나랑 사이좋게 지내는 비결이야.' },
        { say: '왜 그러는 거야?', tier: 'good', face: 'think', answer: '몰라. 거기 있으니까. 산이 있어서 오르는 거랑 비슷해.' },
        { say: '그건 좀 민폐야', tier: 'meh', face: 'sorry', answer: '…알아. 그래서 참고 있잖아. 칭찬은 안 해 줘도 돼.' },
      ],
    },
    {
      id: 'snail',
      open: '비 오는 날 길에 달팽이 있잖아. 밟을까 봐 까치발로 걸어. 그게 제일 피곤해.',
      replies: [
        { say: '내가 앞에서 치워 줄게', tier: 'great', remember: 'snail-guard', face: 'shy', answer: '…너 은근 쓸모 있다. 아, 칭찬이야. 잘 안 하는 거야.' },
        { say: '그냥 다른 길로 가', tier: 'good', answer: '다른 길에도 있어. 비 오는 날 동네는 달팽이 거야. 난 집에 있을래.' },
        { say: '달팽이 귀엽지 않아?', tier: 'meh', face: 'calm', answer: '…귀여운 건 인정. 근데 미끈거려. 그게 싫은 거야.' },
      ],
    },
    {
      id: 'library-nap',
      open: '도서관 제일 안쪽 책장 사이. 거기가 동네에서 제일 조용해. 들키기 전까진.',
      replies: [
        { say: '그 자리 비밀로 해 줄게', tier: 'great', remember: 'library-spot', face: 'shy', answer: ['…고마워. 베아트리스는 냄새로 찾아내지만.', '그래도 사람 입으로 새는 건 막아야지. 너 믿을게.'] },
        { say: '거기서 공부는 해?', tier: 'good', face: 'think', answer: ['해. 책 펴고 첫 줄 읽어. 그다음은 기억 안 나.', '눈 뜨면 책이 베개가 돼 있어. 신기하지.'] },
        { say: '도서관은 자는 데 아니야', tier: 'meh', face: 'calm', answer: '…그 말, 오늘만 세 번째 들었어. 같은 목소리로.' },
      ],
    },
    {
      id: 'roommate',
      open: '힘멜이랑 자취방 같이 쓰는 거 알아? 걔 아침마다 거울 보고 인사 연습해.',
      replies: [
        { say: '둘이 사이좋구나', tier: 'great', remember: 'roommate', face: 'think', answer: ['…좋은 건 아니고. 시끄러워.', '근데 내가 늦게 들어오면 불 하나는 켜 둬. 그건 고마워.', '걔한텐 말하지 마. 기어오르니까.'] },
        { say: '방세는 누가 내?', tier: 'good', face: 'laugh', answer: '반반. 근데 걔가 자꾸 이번 달은 내 차례래. 계산은 내가 더 잘하는데.' },
        { say: '시끄러우면 이사 가', tier: 'meh', face: 'calm', answer: '…이사는 귀찮아. 짐 싸는 것도 상자 버리는 것도.' },
      ],
    },
    {
      id: 'fish-market',
      open: '어시장 럭스 좌판 알지? 장 끝날 무렵 가면 꼬리 토막이 남아. 그게 내 몫이야.',
      replies: [
        { say: '그 시간 맞추는 게 기술이네', tier: 'great', remember: 'lux-tail', face: 'laugh', answer: ['…알아주는구나. 너무 일찍 가면 안 줘.', '너무 늦으면 다른 고양이가 먹어. 진짜 고양이.', '타이밍이 학점보다 중요해.'] },
        { say: '돈 내고 사 먹어', tier: 'good', face: 'sorry', answer: '…낼 때도 있어. 동전으로. 럭스가 세다가 웃어.' },
        { say: '꼬리는 먹을 데 없잖아', tier: 'meh', face: 'calm', answer: '모르는 소리. 꼬리 쪽 살이 제일 쫄깃해. 너한텐 안 알려 준 걸로 해.' },
      ],
    },
    {
      id: 'gossip-rule',
      open: '나 소문 팔 때 규칙 있어. 아무거나 안 팔아. 궁금해?',
      replies: [
        { say: '궁금해. 무슨 규칙?', tier: 'great', remember: 'gossip-rule', face: 'calm', answer: ['누가 울었다는 건 안 팔아. 누가 아프다는 것도.', '웃긴 거, 맛있는 거, 고양이 나온 거만 팔아.', '…귀찮아서 그래. 착해서가 아니라.'] },
        { say: '돈 되는 건 다 팔 줄', tier: 'good', face: 'think', answer: '돈 되는 거 다 팔면 동네가 시끄러워져. 시끄러우면 낮잠을 못 자.' },
        { say: '소문은 다 나빠', tier: 'meh', face: 'sorry', answer: '…그럴 수도. 그래서 고르는 거야. 고르는 게 제일 귀찮아.' },
      ],
    },
    {
      id: 'night-shift',
      open: '편의점 야간 알바 하거든. 새벽 세 시쯤이 제일 조용해. 형광등 소리만 나.',
      replies: [
        { say: '끝나는 시간에 마중 갈게', tier: 'great', remember: 'night-shift', face: 'shy', answer: ['…새벽에? 너 진짜 이상해.', '…빵 하나 남겨 둘게. 폐기 아니고 새 거로. 내 돈으로.'] },
        { say: '안 졸려?', tier: 'good', face: 'laugh', answer: '낮에 다 자 놨어. 이게 내 계산이야. 수업만 빼면 완벽해.' },
        { say: '밤 알바는 힘들잖아', tier: 'meh', face: 'calm', answer: '힘들어. 근데 손님이 없어서 좋아. 말 안 해도 되니까.' },
      ],
    },
    {
      id: 'exam',
      open: '다음 주 시험이야. 아직 책 안 폈어. 근데 걱정은 안 해. 이상하지.',
      replies: [
        { say: '같이 공부하자. 내가 깨울게', tier: 'great', remember: 'exam-help', face: 'smile', answer: ['…감시자가 생겼네. 귀찮게.', '좋아. 대신 졸면 꼬리로 신호 줄게. 깨우지 말라는 뜻이야.'] },
        { say: '벼락치기 잘해?', tier: 'good', face: 'think', answer: ['응. 한 번 읽으면 대충 기억해.', '…이건 비밀이야. 알려지면 다들 기대해. 그게 제일 귀찮아.'] },
        { say: '그러다 낙제해', tier: 'meh', face: 'calm', answer: '…낙제하면 일 년 더 여기 살면 되지. 나쁘지 않아.' },
      ],
    },
    {
      id: 'wallet',
      open: '이번 달 생활비 계산했어. 컵라면 기준으로 열아홉 개. 생선은 계산에 없어.',
      replies: [
        { say: '생선은 내가 가끔 줄게', tier: 'great', face: 'wow', answer: ['…진짜? 그럼 계산 다시 해야겠다.', '컵라면 열아홉 개, 생선은 너. …좋은 달이네.'] },
        { say: '알바비는 어디 갔어?', tier: 'good', face: 'sorry', answer: '꽃차랑 책값. 그리고 빈 상자 사려다가 공짜로 얻었어. 그건 이득.' },
        { say: '아껴 써야지', tier: 'meh', face: 'calm', answer: '…아끼는 중이야. 숨 쉬는 것도 천천히 쉬어.' },
      ],
    },
    {
      id: 'kneading',
      open: '…아까 네 담요 위에서 손 움직인 거, 봤어? 못 본 걸로 해.',
      replies: [
        { say: '귀여웠어. 계속해도 돼', tier: 'great', remember: 'kneading', face: 'shy', answer: ['…귀엽다는 말 금지. 그건 버릇이야.', '폭신한 거 보면 손이 먼저 가. 기분 좋을 때만.', '…아, 방금 그건 말 안 한 걸로.'] },
        { say: '빵 반죽하는 줄 알았어', tier: 'good', face: 'laugh', answer: '…비슷해. 근데 빵은 안 나와. 기분만 나와.' },
        { say: '담요 늘어나잖아', tier: 'meh', face: 'sorry', answer: '…미안. 발톱은 안 세웠어. 그건 지켰어.' },
      ],
    },
    {
      id: 'appear',
      open: '…있었어. 아까부터. 네가 못 봤을 뿐이야. 나 원래 이래.',
      replies: [
        { say: '언제부터 있었어?', tier: 'great', face: 'laugh', answer: ['네가 당근 밭 둘째 줄 돌 때부터.', '말 걸까 하다가 귀찮아서 따라만 왔어. 그게 더 귀찮았어.'] },
        { say: '깜짝 놀랐잖아', tier: 'good', face: 'sorry', answer: '…미안. 발소리를 내려고 해도 안 나. 고양이라서. 방울이라도 달까.' },
        { say: '좀 무서워', tier: 'meh', face: 'calm', answer: '…무서운 건 아니야. 그냥 조용한 거야. 차이가 커.' },
      ],
    },
    {
      id: 'fav-season',
      open: '계절 중에 제일 좋은 거 정했어? 난 정했어. 고민은 오 초 했어.',
      replies: [
        { say: '가을이지? 볕이 딱 좋아', tier: 'great', remember: 'autumn-sun', face: 'wow', answer: ['…맞혔어. 어떻게 알았어.', '뜨겁지도 않고 따뜻해. 고양이용 볕이야.', '그리고 전어 굽는 냄새. 그것도 커.'] },
        { say: '겨울, 이불 속', tier: 'good', face: 'think', answer: '이불도 강해. 근데 이불은 나가기 싫어져서 문제야. 시험 날엔 특히.' },
        { say: '여름 바다', tier: 'meh', face: 'calm', answer: '…더워. 털 있는 사람 입장도 생각해 줘.' },
      ],
    },
    {
      id: 'roof-stars',
      open: '자취방 지붕, 밤엔 낮의 볕이 남아서 따뜻해. 거기 누우면 별이 많아.',
      replies: [
        { say: '나도 올라가 보고 싶어', tier: 'great', remember: 'roof-stars', face: 'shy', answer: ['…사다리는 삐걱거려. 조용히 와.', '힘멜이 깨면 별 이름 강의 시작해. 그건 피해야 해.'] },
        { say: '별 이름 알아?', tier: 'good', face: 'think', answer: '몰라. 이름은 내가 붙여. 저건 생선구이자리. 저건 컵라면자리.' },
        { say: '지붕은 위험해', tier: 'meh', face: 'calm', answer: '…고양이는 지붕에서 안 떨어져. 대학생은 가끔 떨어지지만.' },
      ],
    },
    {
      id: 'tail',
      open: '내 꼬리, 내 말 안 들어. 얼굴은 멀쩡한데 꼬리가 다 말해 버려.',
      replies: [
        { say: '그래서 꼬리를 믿을게', tier: 'great', remember: 'tail-secret', face: 'shy', answer: ['…그러면 곤란한데.', '아, 지금도 흔들리지. 그건 바람 탓이야. 바람.'] },
        { say: '꼬리로 기분 알 수 있어?', tier: 'good', face: 'think', answer: '세우면 좋은 거. 탁탁 치면 귀찮은 거. 크게 흔들면… 그건 비밀.' },
        { say: '그냥 감추면 되잖아', tier: 'meh', face: 'sorry', answer: '…해 봤어. 깔고 앉았더니 저렸어. 하루 종일.' },
      ],
    },
    {
      id: 'home-letter',
      open: '고향에서 소포 왔어. 말린 생선이랑 편지. 편지는 세 줄. 밥 먹어라, 자라, 자지 마라.',
      replies: [
        { say: '말린 생선, 같이 구울까?', tier: 'great', remember: 'home-letter', face: 'smile', answer: ['…그러자. 혼자 구우면 연기만 많아.', '너 오면 고향 얘기 조금 해 줄게. 조금만. 귀찮으니까.'] },
        { say: '자라, 자지 마라?', tier: 'good', face: 'laugh', answer: '밤엔 자고 낮엔 자지 말래. 우리 집은 날 잘 알아.' },
        { say: '답장은 했어?', tier: 'meh', face: 'sorry', answer: '…아직. 쓰려고 하면 졸려. 이번 주엔 할게. 아마.' },
      ],
    },
    {
      id: 'good-ears',
      open: '귀가 좋아서 동네 소리가 다 들려. 근데 들은 걸 다 말하진 않아.',
      replies: [
        { say: '그럼 안 말한 건 어디 둬?', tier: 'great', face: 'think', answer: ['…좋은 질문이네. 상자에 넣어.', '진짜 상자 말고 머릿속에. 꽉 차면 낮잠 자면서 정리해.'] },
        { say: '내 소리도 들려?', tier: 'good', face: 'shy', answer: '…응. 너 발소리는 멀리서도 알아. 신경 쓴 건 아니고. 귀가 좋아서야.' },
        { say: '엿듣는 거 아냐?', tier: 'meh', face: 'calm', answer: '…들리는 거랑 듣는 건 달라. 난 귀를 접을 수도 없어.' },
      ],
    },
    {
      id: 'lazy-smart',
      open: '게으른 것도 기술이야. 제일 적게 움직이고 제일 많이 얻는 거. 연구 중이야.',
      replies: [
        { say: '그래서 시험은 잘 보는구나', tier: 'great', face: 'laugh', answer: ['…들켰네. 수업은 안 가도 요점은 알아.', '이거 소문내면 안 돼. 다들 노트 빌려 달라고 와.'] },
        { say: '그 기술 나도 배울래', tier: 'good', face: 'think', answer: '첫째 수업. 일단 앉아. 둘째 수업. 볕 쪽으로 앉아. 끝. 수강료는 생선.' },
        { say: '그냥 게으른 거잖아', tier: 'meh', face: 'calm', answer: '…말로 하면 그렇게 돼. 그래서 말 안 하는 거야.' },
      ],
    },
    {
      id: 'bath',
      open: '목욕은 싫어. 물이 싫은 게 아니라 젖은 털이 싫은 거야. 차이가 있어.',
      replies: [
        { say: '수건 따뜻하게 데워 줄게', tier: 'great', face: 'wow', answer: ['…따뜻한 수건? 그거면 생각해 볼게.', '그래도 비누는 냄새 없는 거로. 코가 예민해.'] },
        { say: '그럼 머리는 어떻게 감아?', tier: 'good', face: 'sorry', answer: '…빨리. 아주 빨리. 그리고 볕에 오래 앉아 있어.' },
        { say: '목욕 용품 선물할까?', tier: 'meh', face: 'calm', answer: '…그건 전쟁 선포야. 하지 마.' },
      ],
    },
    {
      id: 'milk',
      open: '샹크스 선장님 주점 가면 낮엔 우유를 따라 줘. 데워서. 고양이 취급이야.',
      replies: [
        { say: '데운 우유 좋아하잖아', tier: 'great', remember: 'milk-warm', face: 'shy', answer: ['…좋아해. 근데 그렇게 말하면 진짜 고양이 같잖아.', '그래도 좋아해. 꿀 조금 넣으면 더 좋고.'] },
        { say: '닐라네 우유일걸', tier: 'good', face: 'think', answer: '맞아. 그래서 달리기 내기 걸리면 손해야. 이기면 우유, 지면 우유값.' },
        { say: '주점에서 우유를?', tier: 'meh', face: 'calm', answer: '…낮이잖아. 그리고 선장님 주는 건 다 맛있어.' },
      ],
    },
    {
      id: 'future',
      open: '졸업하면 뭐 할 거냐고 다들 물어. 대답하기 귀찮아서 모른다고 해.',
      replies: [
        { say: '진짜 대답은 뭔데?', tier: 'great', remember: 'future-talk', face: 'calm', answer: ['…이 동네에 있고 싶어.', '볕 자리 다 알고, 생선 주는 사람 있고, 소문도 많고.', '…그리고 아는 사람도 있고. 그게 다야.'] },
        { say: '모르는 것도 괜찮아', tier: 'good', face: 'smile', answer: '…그 말 처음 들었어. 다들 빨리 정하래. 너는 느려서 좋아.' },
        { say: '그래도 계획은 세워야지', tier: 'meh', face: 'sorry', answer: '…알아. 계획 세우는 계획은 세웠어. 다음 주에.' },
      ],
    },
    {
      id: 'ears',
      when: { ch: 2 },
      open: '…뭘 그렇게 봐. 귀? 처음 보는 사람은 만지면 안 돼. 너는… 아직 생각 중.',
      replies: [
        { say: '허락할 때까지 안 만질게', tier: 'great', remember: 'ear-wait', face: 'shy', answer: '…그 말이 제일 귀찮지 않아. 오래 안 걸릴지도. 아마.' },
        { say: '솔직히 만져 보고 싶어', tier: 'good', face: 'laugh', answer: '솔직하네. 솔직한 건 점수 줄게. 만지는 건 아직 안 돼.' },
        { say: '진짜 귀야?', tier: 'meh', face: 'calm', answer: '…진짜야. 지금 너 쪽으로 돌아간 것도 진짜고. 보지 마.' },
      ],
    },
    {
      id: 'unlit',
      when: { ch: 3 },
      open: '요즘 담배에 불 안 붙여. 물고만 있어. 왜인지 알아? …몰라도 돼.',
      replies: [
        { say: '끊는 중이구나. 응원할게', tier: 'great', remember: 'quit-try', face: 'shy', answer: ['…들켰네. 귀찮게 응원은.', '그래도, 고마워. 진짜로. 두 번은 안 말해.'] },
        { say: '멋있어 보이려고?', tier: 'good', face: 'laugh', answer: '그런 건 기력이 남는 사람이 하는 거야. 난 그냥 입이 심심해서.' },
        { say: '그냥 버려', tier: 'meh', face: 'calm', answer: '…그게 쉬우면 진작 했지. 천천히 할게. 내 속도로.' },
      ],
    },
    {
      id: 'love-ears',
      when: { love: 'dating' },
      open: '{me}. …귀. 만져도 돼. 오늘만. 아니, 앞으로도. 말 바꾸기 전에 빨리.',
      replies: [
        { say: '살살 만질게', tier: 'great', face: 'shy', answer: ['…응. 거기. 뒤쪽.', '…아. 골골 소리 나는 건 내 의지가 아니야. 진짜로.'] },
        { say: '진짜 그래도 돼?', tier: 'good', face: 'smile', answer: '허락 기다려 준 사람이니까. 기다려 준 사람한테만이야.' },
        { say: '나중에 할게', tier: 'meh', face: 'sorry', answer: '…그래. 근데 이런 허락은 자주 안 나와. 아쉬워해.' },
      ],
    },
    {
      id: 'love-morning',
      when: { love: 'dating' },
      open: '요즘 아침에 가끔 일어나. 네가 볕 쬐러 나오는 시간이라서. …우연이야.',
      replies: [
        { say: '내일도 그 시간에 나올게', tier: 'great', face: 'shy', answer: ['…그럼 나도 우연히 나올게.', '우연이 매일이면 그건 약속이지. 알아. 그냥 둬.'] },
        { say: '아침 수업도 가겠네', tier: 'good', face: 'laugh', answer: '…그건 별개야. 너 보고 다시 자러 가.' },
        { say: '무리하지 마', tier: 'meh', face: 'calm', answer: '…무리 아니야. 졸린 건 맞지만. 그건 원래야.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비다. 꼬리 젖었어. 오늘은 휴강이야. 내가 정했어.',
      replies: [
        { say: '처마 밑으로 같이 가자', tier: 'great', answer: ['…응. 항구 창고 처마가 명당이야.', '붙어 서. 넓진 않아. 넓으면 안 붙잖아.'] },
        { say: '수건 빌려줄까?', tier: 'good', answer: '꼬리부터 닦을게. 귀는 내가 할 거야. 손대지 마.' },
        { say: '비 오는 날 좋은데', tier: 'meh', face: 'calm', answer: '…너는 꼬리가 없으니까 그런 말을 하지. 부럽다, 진짜로.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈… 발 시려. {me}, 네가 밟은 자리만 따라 밟을 거야. 앞장서.',
      replies: [
        { say: '천천히 걸을게', tier: 'great', answer: '…응. 보폭 줄여. 내 발 작아. 이런 날엔 네가 쓸모 있네.' },
        { say: '업어 줄까?', tier: 'good', face: 'shy', answer: '…그건 너무 귀엽잖아. 소문나. 잔나가 볼 거야. 그냥 걸을게.' },
        { say: '눈사람 만들자!', tier: 'meh', face: 'calm', answer: '만드는 건 귀찮아. 구경은 해 줄게. 코는 내가 떨어뜨릴 거고.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '볕 좋다. 오늘은 할 일이 하나야. 볕 쬐기. 너도 할래? 일정 비었으면.',
      replies: [
        { say: '네 옆자리 비었어?', tier: 'great', face: 'shy', answer: ['…비었어. 원래 안 비우는데.', '방파제 돌이 데워졌어. 앉으면 엉덩이부터 따뜻해.'] },
        { say: '난 밭일 해야 해', tier: 'good', face: 'think', answer: '부지런하네. 끝나고 와. 볕은 오후에도 있어. 내가 지키고 있을게.' },
        { say: '그건 일이 아니잖아', tier: 'meh', face: 'calm', answer: '…일이야. 제일 중요한 일. 다들 몰라서 그래.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '해가 숨었어. 볕 자리 찾아 동네를 세 바퀴 돌았어. 오늘 운동 끝.',
      replies: [
        { say: '빵집 오븐 옆은 어때?', tier: 'great', face: 'wow', answer: ['…천재야? 거기 있었네.', '빵 냄새는 덤. 프리렌이 졸고 있으면 더 조용해.'] },
        { say: '오늘은 쉬어', tier: 'good', answer: '응. 흐린 날은 졸리기 딱 좋아. 맑아도 졸리지만.' },
        { say: '운동 더 해', tier: 'meh', face: 'sorry', answer: '…오늘 할당량은 채웠어. 내일 거까지.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이라 꽃가루 날려. 귀가 간지러워. 재채기하면 귀가 펄럭여. 웃지 마.',
      replies: [
        { say: '귀에 붙은 꽃잎 떼 줄까?', tier: 'great', face: 'shy', answer: ['…응. 살살. 귀 말고 꽃잎만.', '…고마워. 이번 건 소문 안 낼게. 내가 당한 거니까.'] },
        { say: '봄은 졸리지?', tier: 'good', answer: '원래 졸린데 더 졸려. 봄은 낮잠의 계절이야. 논문에 쓸 거야.' },
        { say: '재채기 귀엽던데', tier: 'meh', face: 'calm', answer: '…귀엽다는 말 금지라고 했지. 안 했나. 지금 했어.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '더워. 털이 원망스러워. 방파제 밑 그늘에 붙어 있을 거야. 찾지 마.',
      replies: [
        { say: '시원한 꽃차 사 올게', tier: 'great', face: 'wow', answer: ['…시원한 거? 여름엔 예외로 받아.', '얼음은 두 개만. 이가 시려. 고양이 이는 약해.'] },
        { say: '밤바다 보러 가자', tier: 'good', face: 'smile', answer: '밤이면 가. 오징어 배 불빛 세는 거 좋아해. 세다가 잠들지만.' },
        { say: '털 깎으면 되잖아', tier: 'meh', face: 'sorry', answer: '…그런 말 하는 거 아니야. 털은 자존심이야.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이다. 볕이 딱 고양이 온도야. 그리고 어디서 전어 굽는 냄새 나.',
      replies: [
        { say: '그 냄새 따라가 보자', tier: 'great', face: 'laugh', answer: ['…좋아. 코는 내가 맡을게.', '어시장 쪽이야. 럭스 좌판 뒤. 아마 반 토막은 얻을 수 있어.'] },
        { say: '도서관 가기 좋은 계절', tier: 'good', face: 'think', answer: '가을엔 도서관이 붐벼. 내 자리가 없어. 베아트리스는 좋아하겠지만.' },
        { say: '난 가을 타', tier: 'meh', face: 'calm', answer: '…그럼 볕 타. 그게 더 따뜻해. 내 방식이야.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '겨울엔 털이 부풀어. 뚱뚱해진 거 아니야. 컵라면 탓도 아니고. 털 탓이야.',
      replies: [
        { say: '따뜻해 보여서 좋은데', tier: 'great', face: 'shy', answer: ['…좋다고? 그럼 됐어.', '손 시리면 꼬리 빌려줄게. 오 초만. 길면 간지러워.'] },
        { say: '오른 대장간 앞 가 봐', tier: 'good', face: 'think', answer: '거기 최고야. 근데 오른 아저씨가 자꾸 망치질 소리로 쫓아내.' },
        { say: '좀 찐 것 같은데', tier: 'meh', face: 'sorry', answer: '…말 조심해. 고양이는 앙심이 길어. 사흘쯤.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '…새벽이야. 나 지금 자러 가는 길이야. 너는 일어나는 길이고. 엇갈렸네.',
      replies: [
        { say: '잘 자. 이따 낮에 봐', tier: 'great', face: 'smile', answer: ['…응. 낮에 보자. 오후에.', '많이 오후에. 해가 기울 때쯤. 그때 깨어 있을게.'] },
        { say: '같이 해 뜨는 거 보자', tier: 'good', face: 'think', answer: '…해 뜨는 거? 본 적 없어. 오늘 한 번은 봐 줄게. 졸면 깨워.' },
        { say: '밤새 뭐 했어?', tier: 'meh', face: 'calm', answer: '알바. 지붕. 소문 정리. 그리고 아무것도. 바빴어.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '저녁이다. 눈이 떠지기 시작해. 하루 중에 제일 덜 귀찮은 시간이야.',
      replies: [
        { say: '노을 보러 방파제 갈래?', tier: 'great', face: 'smile', answer: ['…가. 돌이 아직 데워져 있을 거야.', '노을은 반쯤 보고 반쯤은 졸 거야. 그게 제일 좋은 감상법이야.'] },
        { say: '저녁은 먹었어?', tier: 'good', face: 'sorry', answer: '컵라면 물 붓는 중이었어. 너 오길래 불었어. 괜찮아. 불어도 먹어.' },
        { say: '난 이제 피곤한데', tier: 'meh', face: 'calm', answer: '…우린 시간대가 반대네. 잘 쉬어. 나는 이제 시작이야.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤이다. 눈이 잘 보여. {me}, 편의점 갈 건데. 우연이야. 같이 갈래?',
      replies: [
        { say: '컵라면은 내가 살게', tier: 'great', remember: 'cupramen', face: 'wow', answer: '…오늘 너 부자야? 두 개 골라도 돼? 이 정도면 사치야.' },
        { say: '같이 걷기만 할게', tier: 'good', answer: '그것도 좋아. 밤길은 내가 앞장설게. 눈 좋거든.' },
        { say: '난 졸려서 잘래', tier: 'meh', face: 'calm', answer: '그래. 잘 자. 나는 이제부터 하루 시작이야.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제라 시끄러워. 먹을 거 사서 구석에서 먹을 거야. …너도 올래?',
      replies: [
        { say: '구석 자리 좋아. 같이 가', tier: 'great', answer: ['…알았어. 불꽃놀이는 방파제가 최고야.', '비밀 자리. 너만 알려 줄게. 귀는 접고 볼 거야.'] },
        { say: '꼬치 하나 사 줄게', tier: 'good', answer: '생선 꼬치면 받을게. 아니면 그냥 고마워만 할게.' },
        { say: '난 무대 앞이 좋아', tier: 'meh', face: 'calm', answer: '귀 아파. 다녀와. 나는 여기서 소리만 들을게.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '…{me}, 생선 냄새. 오늘 {fish}, 그거 잡았지? 코는 못 속여.',
      replies: [
        { say: '한 마리 줄게', tier: 'great', answer: '…진짜? 꼬리 흔들리는 거 보지 마. 오늘 컵라면은 쉰다.' },
        { say: '다음엔 같이 가자', tier: 'good', answer: '좋아. 너는 낚고, 나는 옆에서 자고. 분업이야.' },
        { say: '내가 다 먹을 거야', tier: 'meh', face: 'sorry', answer: '…그래. 냄새는 공짜니까 맡고만 있을게. 슬프다.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 벌써 돌아. 오늘 엄청 큰 놈 낚았다며? 잔나가 받아 적고 있더라.',
      replies: [
        { say: '네가 퍼뜨렸지?', tier: 'great', face: 'laugh', answer: '…아니야. 반은 맞아. 대신 내 몫 한 토막만. 공정한 거래야.' },
        { say: '운이 좋았어', tier: 'good', answer: '운도 실력이야. 나는 낮잠 자리 찾는 운이 좋고. 너는 그쪽.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙냄새 나. 오늘 밭일했구나. 부지런하다. 나랑 정반대야.',
      replies: [
        { say: '이랑 사이 흙 따뜻해', tier: 'great', answer: '…알아? 그거 고양이만 아는 건 줄 알았는데. 잠깐 누워 봐도 돼?' },
        { say: '허리 아파 죽겠어', tier: 'good', answer: ['이리 앉아. 볕 반쪽 줄게.', '꾹꾹 눌러 줄 수도 있어. 습관이야. 안마 아니야.'] },
        { say: '너도 좀 해 봐', tier: 'meh', face: 'calm', answer: '…응원은 할게. 누워서. 그게 내 최선이야.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '반짝… 눈부셔. {me}, 오늘 금별 나왔다며. 실눈 뜨고 보는 중이야.',
      replies: [
        { say: '제일 먼저 보여 주러 왔어', tier: 'great', face: 'shy', answer: '…나한테 먼저? 잔나보다? 이건 소문 안 낼게. 내 거야.' },
        { say: '운이 좋았나 봐', tier: 'good', answer: '정성 들인 사람한테 운도 오는 거야. 난 정성이 없어서 몰라.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '표정 안 좋다. 저기 볕 드는 데 같이 앉자. 말은 안 해도 돼.',
      replies: [
        { say: '…응. 잠깐만 앉을게', tier: 'great', face: 'smile', answer: ['…그래. 아무것도 안 해도 돼. 그게 내 전문이야.', '조용하면 볕 소리가 들려. 거짓말 아니야.'] },
        { say: '괜찮아, 별일 아니야', tier: 'good', answer: '그래. 그래도 따뜻한 거 한 잔 마시고 가. 오늘은 내가 살게. 싼 걸로.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '…{me}, 오늘 얼굴이 햇볕 같아. 눈부셔. 무슨 좋은 일 있어?',
      replies: [
        { say: '그냥 기분이 좋아', tier: 'great', face: 'smile', answer: '…그런 날이 제일 좋은 날이야. 이유 있는 날보다. 옆에 앉아.' },
        { say: '비밀이야', tier: 'good', face: 'think', answer: '흐음. 비밀이면 소문감인데. 오늘은 안 캘게. 귀찮으니까.' },
        { say: '네가 왜 궁금해?', tier: 'meh', face: 'calm', answer: '…안 궁금해. 그냥 물어봤어. 진짜로.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '들었어? 오늘 광장에서 결혼식. 잔나보다 내가 먼저 알았어. 귀가 좋거든.',
      replies: [
        { say: '하객 음식은 뭐였어?', tier: 'great', face: 'laugh', answer: '…역시 너 날 알아. 생선전 있었어. 세 개 먹었어. 축하는 그걸로 했어.' },
        { say: '부럽다…', tier: 'good', face: 'smile', answer: '그래? …나는 아침 결혼식만 아니면 괜찮을 것 같아. 아, 그냥 혼잣말.' },
        { say: '시끄러웠겠다', tier: 'meh', face: 'calm', answer: '응. 귀 접고 지나갔어. 축하는 멀리서 했어.' },
      ],
    },
    {
      id: 'op-birthday-news',
      when: { news: 'birthday' },
      open: '오늘 동네에 생일인 사람 있대. 소식판에 붙었어. 케이크 냄새 벌써 나.',
      replies: [
        { say: '같이 축하해 주러 가자', tier: 'great', face: 'smile', answer: ['…가. 축하는 짧게 하고.', '케이크는 생크림 부분만 조금. 그게 고양이의 예의야.'] },
        { say: '선물은 뭐 해?', tier: 'good', face: 'think', answer: '좋은 볕 자리 하나 알려 줄 거야. 돈 안 들고 제일 좋은 선물이야.' },
        { say: '모르는 사람이잖아', tier: 'meh', face: 'calm', answer: '…모르는 사람도 생일은 있어. 그냥 그렇다고.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기 잡혔다는 소문. 잔나 신문 일 면이래. …나도 보고 싶었는데.',
      replies: [
        { say: '구경 가자. 지금', tier: 'great', face: 'wow', answer: ['…같이? 좋아. 눈 크게 뜰게.', '먹을 수는 없겠지. 알아. 냄새만이라도.'] },
        { say: '네가 먼저 알았어?', tier: 'good', face: 'laugh', answer: '아니. 이번엔 잔나가 빨랐어. 분해. 낮잠 자느라.' },
        { say: '그냥 큰 생선이지', tier: 'meh', face: 'sorry', answer: '…그런 말 하면 바다가 섭섭해해. 나도 섭섭해.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마을 기록 깨졌대. 누가 깼는지는 소문으로 다 알아. 말할까 말까.',
      replies: [
        { say: '말 안 해도 돼. 축하만 해', tier: 'great', face: 'smile', answer: ['…그거 좋은 방법이네.', '축하는 공짜고, 소문은 커피 한 잔이야. 오늘은 공짜 쪽.'] },
        { say: '누군데? 궁금해', tier: 'good', face: 'think', answer: '…힌트. 그 사람 오늘 엄청 자랑하고 다녀. 금방 알게 돼.' },
        { say: '기록은 관심 없어', tier: 'meh', face: 'calm', answer: '나도. 낮잠 기록 말고는. 그건 내가 일등이야.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관에 뭐 기증했다며. 소문 들었어. 유리 상자 안에 들어간 거 봤어.',
      replies: [
        { say: '유리 상자, 부럽지?', tier: 'great', face: 'laugh', answer: ['…조금. 사방이 막혀 있잖아.', '근데 사람들이 들여다봐. 그건 싫어. 낮잠 못 자.'] },
        { say: '같이 보러 갈래?', tier: 'good', face: 'smile', answer: '조용한 데는 좋아. 박물관은 도서관보다 덜 쫓아내. 아직은.' },
        { say: '별거 아니야', tier: 'meh', face: 'calm', answer: '…별거야. 동네에 네 거 하나 남은 거잖아.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '배 타고 나갔다 왔다며. …멀미 안 했어? 난 배 생각만 해도 귀가 납작해져.',
      replies: [
        { say: '바다 생선 냄새 맡아 봐', tier: 'great', face: 'wow', answer: ['…킁. 진짜 먼바다 냄새다.', '배는 싫은데 이 냄새는 좋아. 모순이야. 알아.'] },
        { say: '다음엔 같이 가자', tier: 'good', face: 'sorry', answer: '…생각해 볼게. 생각만. 오래. 아주 오래.' },
        { say: '파도 엄청 높았어', tier: 'meh', face: 'calm', answer: '…말하지 마. 상상했어. 이미 멀미 나.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '증권 쪽에서 떨어졌다며. 소문 들었어. …컵라면 하나 나눠 줄까.',
      replies: [
        { say: '…고마워. 반만 먹을게', tier: 'great', face: 'smile', answer: ['…반 줄게. 국물은 내 거.', '돈은 오르기도 하고 떨어지기도 해. 볕도 그래. 내일 또 들어.'] },
        { say: '괜찮아. 다시 오를 거야', tier: 'good', face: 'think', answer: '그래. 그런 마음이면 됐어. 나는 통장이 원래 바닥이라 무서울 게 없어.' },
        { say: '소문 내지 마', tier: 'meh', face: 'calm', answer: '…안 내. 우는 소문은 안 판다고 했잖아. 그 비슷한 거야.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '카지노에서 땄다며. …오늘 생선은 네가 사는 거지? 소문은 공짜로 해 줄게.',
      replies: [
        { say: '좋아. 생선구이 쏠게', tier: 'great', face: 'laugh', answer: ['…말 바꾸기 없기. 지금 기억해 뒀어.', '껍질 바삭한 걸로. 두 마리면 감동하고.'] },
        { say: '운이 좋았을 뿐이야', tier: 'good', face: 'think', answer: '운 좋은 날엔 거기서 멈추는 게 제일 머리 좋은 거야. 알지?' },
        { say: '더 따러 갈 거야', tier: 'meh', face: 'sorry', answer: '…그건 별로야. 오늘 일은 오늘로 끝내. 고양이의 충고.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노에서 잃었다며. …표정 보니 맞네. 이리 와. 볕은 공짜야.',
      replies: [
        { say: '공짜 볕, 좋다', tier: 'great', face: 'smile', answer: ['…그치. 세상에서 제일 좋은 건 대개 공짜야.', '볕, 낮잠, 그리고 럭스의 꼬리 토막.'] },
        { say: '다음엔 딸 거야', tier: 'good', face: 'think', answer: '…그 말 하는 사람치고 딴 사람 별로 못 봤어. 소문으로는.' },
        { say: '위로는 됐어', tier: 'meh', face: 'calm', answer: '…위로 아니야. 그냥 자리 남아서 그래.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}, 생일이지. 알아. 소문이 아니라 내가 기억한 거야. …축하해.',
      replies: [
        { say: '기억해 줘서 고마워', tier: 'great', face: 'shy', answer: ['…귀찮아서 안 잊은 거야.', '자. 생선 모양 과자. 생선은 비싸서. 다음 달엔 진짜로.'] },
        { say: '선물은?', tier: 'good', face: 'laugh', answer: '오늘은 내 볕 자리 하루 다 줄게. 이건 큰 거야. 아무한테도 안 해.' },
        { say: '생일 별로 안 좋아해', tier: 'meh', face: 'calm', answer: '…그래도 오늘은 축하받아. 귀찮으면 가만히 있어. 내가 알아서 할게.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '…{other}, 오늘 좀 서먹해. 내가 낮잠 자리 빼앗았대. 먼저 누워 있었는데.',
      replies: [
        { say: '반쪽 나눠 쓰면 어때?', tier: 'great', face: 'think', answer: ['…반쪽. 너랑 하는 거.', '그래, 해 볼게. 귀찮지만 그게 제일 덜 귀찮겠다.'] },
        { say: '시간 지나면 풀릴 거야', tier: 'good', face: 'smile', answer: '응. 사흘이면 풀려. 고양이 앙심 기간이랑 같아.' },
        { say: '네가 잘못했네', tier: 'meh', face: 'sorry', answer: '…알아. 알아도 듣긴 싫어. 오늘만 편들어 주지.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other}, 만났어? 뭐 물어보지 않았어? 나한테서 들은 거 있냐고.',
      replies: [
        { say: '네 소문 물어보던데', tier: 'great', face: 'wow', answer: '…제보자가 소문이 되면 끝이야. 다음 커피는 두 잔 받아야겠다.' },
        { say: '아무 말도 안 했어', tier: 'good', answer: '잘했어. 너 입 무거운 거 마음에 들어. 기자 앞에선 그게 최고야.' },
        { say: '너 얘기 다 했어', tier: 'meh', face: 'sorry', answer: '…아. 이제 내 낮잠 자리 다 들켰겠다. 이사 가야 하나.' },
      ],
    },
    {
      id: 'op-lux',
      when: { bond: 'lux' },
      open: '{other}, 어시장에 있었지? 오늘 생선 한 토막 남겨 둔다고 했는데. 말 안 했어?',
      replies: [
        { say: '고양이 몫이라던데', tier: 'great', face: 'laugh', answer: '…고양이 취급이야. 근데 생선이면 싫지 않아. 지금 간다.' },
        { say: '바빠 보이던데', tier: 'good', answer: '그럼 좌판 끝나고 갈게. 그 시간엔 꼬리 토막이 남거든.' },
        { say: '생선 다 팔렸던데', tier: 'meh', face: 'sorry', answer: '…거짓말이지? 그렇다고 해 줘. 오늘 저녁이 걸렸어.' },
      ],
    },
    {
      id: 'op-himmel',
      when: { bond: 'himmel' },
      open: '{other}, 또 숨바꼭질 내기하재? 나는 이번에도 자고만 있을 건데.',
      replies: [
        { say: '그래서 매번 이기는 거구나', tier: 'great', face: 'laugh', answer: '…응. 아무도 자는 고양이를 못 찾아. 비법이야. 걔한텐 비밀.' },
        { say: '한 번 져 줘', tier: 'good', answer: '…귀찮은데. 뭐, 생선 걸면 생각해 볼게.' },
        { say: '그냥 이겨 줘서 고마워해', tier: 'meh', face: 'calm', answer: '고마울 일은 아니고. 그냥 졸렸을 뿐이야.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '…{other}, 만났어? 도서관에서 나 봤다고 안 했어? 오늘도 쫓겨났거든.',
      replies: [
        { say: '조용히만 자면 되잖아', tier: 'great', face: 'think', answer: '…골골 소리가 문제래. 그건 내 의지가 아니야. 억울해.' },
        { say: '이번 달 몇 번째야?', tier: 'good', face: 'laugh', answer: '세는 거 귀찮아서 안 세. 그쪽은 세더라. 기록 갱신이래.' },
        { say: '도서관은 공부하는 데야', tier: 'meh', face: 'calm', answer: '…알아. 공부하다 잔 거야. 순서는 맞잖아.' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other}, 또 들길 달리기 하재지? 지는 쪽이 우유 한 통. 나 그거 좀 걸렸어.',
      replies: [
        { say: '이번엔 이길 수 있어', tier: 'great', answer: '…응원 고마워. 나는 지름길로 갈 거야. 들키면 무효지만.' },
        { say: '우유 한 통은 내가 살게', tier: 'good', face: 'wow', answer: '…너 지금 내 편 하는 거지? 데워서 줘. 그럼 영원히 네 편이야.' },
        { say: '넌 못 이겨', tier: 'meh', face: 'sorry', answer: '…알아. 걔 다리가 반칙이야. 그래도 말은 좀 돌려서 해.' },
      ],
    },
    {
      id: 'op-with-himmel',
      when: { with: 'himmel' },
      open: '…{other}, 옆에서 또 동상 얘기 해. 나는 듣는 척하면서 자는 중이야.',
      replies: [
        { say: '동상 옆에 고양이도 넣자', tier: 'great', face: 'laugh', answer: ['…좋아. 발밑에 누워 있는 걸로.', '제일 편한 자세로 조각해 달라고 해. 그게 조건이야.'] },
        { say: '둘이 잘 어울려', tier: 'good', face: 'sorry', answer: '…어울리긴. 방세 문제로 싸우는 사이야. 그냥 오래 산 사이.' },
        { say: '시끄러우면 자리 옮겨', tier: 'meh', face: 'calm', answer: '…옮기는 것도 귀찮아. 그냥 귀 접을게.' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: '{other}, 수첩 꺼냈어. 나 지금 거래 중이야. {me}, 너도 소문 하나 줄래?',
      replies: [
        { say: '내 소문은 네가 지켜 줘', tier: 'great', face: 'shy', answer: ['…알았어. 네 건 안 팔아.', '그건 처음부터 내 거였어. 수첩엔 안 적혀.'] },
        { say: '커피 한 잔이면 줄게', tier: 'good', face: 'laugh', answer: '오, 시세 아네. 너 소문 장사 해도 되겠다. 내 밥줄은 건드리지 말고.' },
        { say: '난 소문 싫어', tier: 'meh', face: 'calm', answer: '…그래. 그럼 넌 듣기만 해. 그것도 귀한 거야.' },
      ],
    },
    {
      id: 'op-friend-wedding',
      when: { friendNews: 'wedding' },
      open: '네 친구 결혼한다며. 소문 들었어. 축가 같은 건 안 불러 줄 거야. 박수는 칠게.',
      replies: [
        { say: '같이 가 줄래?', tier: 'great', face: 'shy', answer: ['…하객으로? 옷은 한 벌밖에 없어.', '그래도 가. 생선전 나오면 몫 챙겨 둘게. 둘 몫.'] },
        { say: '박수면 충분해', tier: 'good', face: 'smile', answer: '응. 크게는 못 쳐. 조용히 오래 칠게. 그게 내 축하야.' },
        { say: '결혼식은 지루해', tier: 'meh', face: 'calm', answer: '…지루하면 졸면 돼. 축하하는 자리에서 조는 건 괜찮아. 아마.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-fish',
      when: { mem: 'fish-lover' },
      use: 'fish-lover',
      open: '구이가 최고라고 했지. 오늘 럭스한테 얻은 거, 한 토막 구워 왔어. 반만.',
      replies: [
        { say: '반이나? 고마워', tier: 'great', face: 'shy', answer: '…반은 큰 거야. 나한테는. 껍질은 내 거고.' },
        { say: '기억하고 있었어?', tier: 'good', answer: '생선 얘기는 안 잊어. 다른 건 다 잊어도.' },
      ],
    },
    {
      id: 'cb-warm',
      when: { mem: 'warm-drink' },
      use: 'warm-drink',
      open: '…{me}, 꽃차 사 준다고 한 거. 잊은 거 아니지? 나는 안 잊었어.',
      replies: [
        { say: '지금 사러 가자', tier: 'great', face: 'laugh', answer: '…좋아. 식혀서 마실 테니까 천천히 걸어도 돼. 같이.' },
        { say: '다음 주에 살게', tier: 'good', answer: '알았어. 그때까지 네 편 유지할게. 이자는 안 붙여.' },
      ],
    },
    {
      id: 'cb-gossip',
      when: { mem: 'gossip-ok' },
      use: 'gossip-ok',
      open: '오늘 소문, 너한테 먼저야. 우리 그렇게 하기로 했잖아. …잔나한텐 비밀.',
      replies: [
        { say: '뭔데? 빨리 말해 줘', tier: 'great', face: 'laugh', answer: '힘멜이 거울 앞에서 인사 연습하더라. …웃지 마. 아, 웃어도 돼.' },
        { say: '착한 소문이면 좋겠다', tier: 'good', answer: '착한 거야. 빵집에서 오늘 덤을 두 개 준대. 가 봐.' },
      ],
    },
    {
      id: 'cb-morning',
      when: { mem: 'morning-help' },
      use: 'morning-help',
      open: '…{me}, 오늘 아침 문 두드린 거 너지. 두 번째에 나갔어. 수업도 갔어.',
      replies: [
        { say: '대단해! 칭찬해 줄게', tier: 'great', face: 'shy', answer: '…칭찬은 짧게. 길면 쑥스러워. 아, 지금 그 정도면 괜찮아.' },
        { say: '수업은 들었어?', tier: 'good', face: 'think', answer: '…출석은 했어. 듣는 건 다음 단계야. 하나씩 해.' },
      ],
    },
    {
      id: 'cb-box',
      when: { mem: 'box-fan' },
      use: 'box-fan',
      open: '그때 상자 같이 들어간 거. 그 상자, 아직 자취방에 있어. 버릴 수가 없어서.',
      replies: [
        { say: '또 들어가자', tier: 'great', face: 'laugh', answer: '…좁다고 투덜거리지 마. 그것도 상자의 맛이야.' },
        { say: '그냥 상자잖아', tier: 'good', answer: '그냥 상자 아니야. 둘이 들어간 상자야. 다르거든.' },
      ],
    },
    {
      id: 'cb-library',
      when: { mem: 'library-spot' },
      use: 'library-spot',
      open: '도서관 자리, 비밀 지켜 줬지? 오늘 안 쫓겨났어. 처음으로. 너 덕분인 것 같아.',
      replies: [
        { say: '난 아무 말도 안 했어', tier: 'great', face: 'smile', answer: ['…알아. 그래서 고마운 거야.', '오늘은 끝까지 자고 책도 세 쪽 읽었어. 기적이지.'] },
        { say: '베아트리스가 봐준 거 아냐?', tier: 'good', face: 'think', answer: '…그럴지도. 담요가 덮여 있었어. 누가 덮었는지는 소문 안 낼래.' },
      ],
    },
    {
      id: 'cb-night-shift',
      when: { mem: 'night-shift' },
      use: 'night-shift',
      open: '새벽에 진짜 왔더라. 알바 끝나고 문 열었는데 네가 있어서… 놀랐어. 조금.',
      replies: [
        { say: '빵은 맛있었어', tier: 'great', face: 'shy', answer: ['…새 거로 샀어. 내 돈으로.', '그거 내 기준으로 큰 거야. 컵라면 두 개 값이야.'] },
        { say: '다음에 또 갈게', tier: 'good', face: 'smile', answer: '…자주는 오지 마. 익숙해지면 곤란해. 가끔만. 가끔은 꼭.' },
      ],
    },
    {
      id: 'cb-exam',
      when: { mem: 'exam-help' },
      use: 'exam-help',
      open: '시험 끝났어. 같이 공부한 거, 나왔어. 거의 다. 너 감시자 재능 있어.',
      replies: [
        { say: '잘 봤구나! 축하해', tier: 'great', face: 'laugh', answer: ['…응. 아마 잘 봤어.', '보답으로 낮잠 강의 한 번 해 줄게. 공짜로. 실습 위주로.'] },
        { say: '넌 원래 잘하잖아', tier: 'good', face: 'shy', answer: '…원래 잘하는 건 비밀이라고 했잖아. 근데 이번엔 너 덕분이 조금 섞였어.' },
      ],
    },
    {
      id: 'cb-stars',
      when: { mem: 'roof-stars' },
      use: 'roof-stars',
      open: '지붕 위에서 별 본 날. 너 생선구이자리 찾았다고 좋아했잖아. 그거 사실 대충 붙인 거야.',
      replies: [
        { say: '그래도 이제 내 별이야', tier: 'great', face: 'shy', answer: ['…그래. 그럼 그건 네 거 해.', '컵라면자리는 내 거. 둘이 나란히 떠 있어. 몰랐지.'] },
        { say: '대충이었어?', tier: 'good', face: 'laugh', answer: '…응. 별 이름은 원래 다 누가 대충 붙인 거야. 아마.' },
      ],
    },
    {
      id: 'cb-bench',
      when: { mem: 'bench-nap' },
      use: 'bench-nap',
      open: '광장 벤치 실험, 결과 정리했어. 공책에 한 줄 더 늘었어. 보여 줄까 말까.',
      replies: [
        { say: '보여 줘. 궁금해', tier: 'great', face: 'shy', answer: ['…관찰 둘. 옆에 누가 있으면 깨기 싫다.', '…끝. 더 묻지 마. 해석은 각자.'] },
        { say: '논문 진도 나갔네', tier: 'good', face: 'think', answer: '이 속도면 졸업은 십 년 뒤야. 괜찮아. 실험은 계속하면 되니까.' },
      ],
    },
    {
      id: 'cb-fish-share',
      when: { mem: 'fish-share' },
      use: 'fish-share',
      open: '그때 생선구이 반 토막. 그 포장지 아직 상자에 있어. 냄새는 빠졌어. 아쉽게도.',
      replies: [
        { say: '또 반 나눠 먹자', tier: 'great', face: 'smile', answer: ['…응. 이번엔 내가 살게.', '반 토막 살 돈은 있어. 한 마리는 없어. 그래서 반이야.'] },
        { say: '포장지를 왜 둬?', tier: 'good', face: 'think', answer: '…버리기 싫으니까. 이유는 그게 다야. 다 말하면 귀찮아져.' },
      ],
    },
    {
      id: 'cb-snail',
      when: { mem: 'snail-guard' },
      use: 'snail-guard',
      open: '…{me}, 오늘 비 와서 달팽이 많아. 기억하지? 앞에서 치워 준다고 한 거.',
      replies: [
        { say: '물론이지. 앞장설게', tier: 'great', face: 'shy', answer: ['…좋아. 풀숲 쪽으로 살살 옮겨 줘.', '나는 네 발자국만 따라갈게. 오늘은 그게 제일 안전해.'] },
        { say: '오늘은 업고 갈까?', tier: 'good', face: 'laugh', answer: '…그건 소문나. 잔나가 사진 찍어. 걸어갈게. 천천히.' },
      ],
    },
    {
      id: 'cb-quit',
      when: { mem: 'quit-try' },
      use: 'quit-try',
      open: '응원해 준다고 한 거. 그 뒤로 한 개비도 불 안 붙였어. …자랑은 아니야. 보고야.',
      replies: [
        { say: '대단하다. 진짜로', tier: 'great', face: 'shy', answer: ['…진짜로는 내 말버릇인데.', '뺏겼네. 괜찮아. 너면 써도 돼.'] },
        { say: '물고 있는 것도 그만둬', tier: 'good', face: 'think', answer: '…그건 다음 단계. 입이 심심할 때 대신할 걸 찾는 중이야.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}, 그거라며. 소문으로 들었어. 내가 캔 거 아니야.',
      replies: [
        { say: '그것까지 알아?', tier: 'great', face: 'laugh', remember: 'taste-heard', answer: '귀가 좋거든. 네 거는 잔나한테 안 팔았어. 그건 내 거라서.' },
        { say: '너도 좋아해?', tier: 'good', remember: 'taste-heard', answer: '…생선만큼은 아니지만. 네가 좋아하면 좀 좋아질 수도.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 걸은 거. 다리는 아팠는데 덜 귀찮았어. 이상하지.',
      replies: [
        { say: '또 같이 걷자', tier: 'great', face: 'shy', remember: 'outing-talk', answer: '…응. 볕 좋은 데서 쉬어 가는 조건으로. 그건 양보 못 해.' },
        { say: '너 중간에 졸았잖아', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '눈만 감았어. 귀는 깨어 있었어. 다 들었어. 네 혼잣말도.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이라며. 소문 들었어. …생선 큰 거 사 줄게. 통장이 허락하면.',
      replies: [
        { say: '마음만으로도 충분해', tier: 'great', face: 'smile', remember: 'bday-plan', answer: '…그럼 마음에 생선 하나 얹을게. 그게 내 방식이야.' },
        { say: '생선구이로 부탁해', tier: 'good', remember: 'bday-plan', answer: '알았어. 럭스한테 미리 말해 둘게. 제일 통통한 걸로.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '…너희 방 창가, 볕 잘 들더라. 그날 거기서 잔 거 아니야. 눈만 감은 거야.',
      replies: [
        { say: '또 놀러 와. 창가 비워 둘게', tier: 'great', face: 'shy', remember: 'date-talk', answer: '…응. 꾹꾹이는 덤이야. 이불 조심해.' },
        { say: '코 골던데?', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '골골이야. 코 고는 거랑 달라. 기분 좋을 때 나는 거야. …아.' },
      ],
    },
  ],
  chapters: [
    {
      title: '볕 자리 반쪽',
      hint: '한 번 이야기를 나누면 야니네코가 벤치 반쪽을 내줘요.',
      need: { days: 1 },
      scene: [
        '광장 벤치. 야니네코가 길게 누워 있다. 한쪽 귀만 움찔한다.',
        '입에는 불 안 붙은 담배 한 개비. 그냥 물고만 있다.',
        '"…누구야. 아, {me}. 새로 왔다는 사람."',
        '"소문 들었어. 밭 하나 받았다며. 부지런하겠네. 피곤하겠다."',
        '야니네코가 귀찮다는 듯 몸을 반쯤 접는다. 벤치 반쪽이 빈다.',
        '"앉든가. 말은 조금만 하고. 볕이 놀라."',
        '한동안 아무 말이 없다. 바람이 지나가고, 꼬리 끝만 까딱인다.',
        '"…이 벤치, 원래 혼자 쓰는 거야. 오늘은 예외."',
        '"내일도 예외일지는 몰라. 귀찮으면 안 해."',
        '야니네코가 눈을 감는다. 그래도 귀는 이쪽을 향해 있다.',
      ],
      replies: [
        { say: '고마워. 조용히 앉을게', tier: 'great', face: 'smile', answer: ['…좋아. 너 첫인상 괜찮다.', '소문으로 내 줄게. 좋은 쪽으로. 공짜로.'] },
        { say: '볕이 놀란다고?', tier: 'good', face: 'think', answer: '시끄러우면 구름이 와. 내 경험이야. 과학은 아니고.' },
        { say: '서서 있을게', tier: 'meh', face: 'calm', answer: '…그래. 다리 아프면 앉아. 자리는 안 도망가.' },
      ],
    },
    {
      title: '광장 벤치의 오후',
      hint: '오후(게임 시각 낮 한 시부터 다섯 시) 마을 광장에 가 보세요. 벤치 끝이 볕 명당이래요.',
      need: { days: 3, points: 20, visit: { area: 'village', from: 13, to: 17 } },
      scene: [
        '광장 벤치 오른쪽 끝. 야니네코가 눈을 반쯤 감고 앉아 있다.',
        '"왔네. 진짜 올 줄은 몰랐어. 귀찮을 텐데."',
        '"여기가 이 시간에 제일 따뜻해. 해가 시계탑을 넘어오거든."',
        '야니네코가 꼬리로 옆자리를 툭툭 친다.',
        '"…같이 쬐면 두 배로 따뜻할까 해서. 실험이야. 논문용."',
        '가방에서 구겨진 공책이 나온다. 표지엔 낮잠의 효율이라고 적혀 있다.',
        '첫 장엔 제목뿐이다. 야니네코가 연필로 한 줄을 천천히 적는다.',
        '"관찰 하나. 옆에 누가 있으면 잠이 늦게 온다."',
        '"…이상하지. 원래 볕만 있으면 바로 자는데."',
        '"방해된다는 뜻은 아니야. 그냥 기록이야. 과학이니까."',
        '공책이 덮인다. 불 없는 담배가 입가에서 까딱 흔들린다.',
      ],
      replies: [
        { say: '실험 결과는 어때?', tier: 'great', remember: 'bench-nap', face: 'shy', answer: ['…두 배까진 아니고. 한 배 반.', '아니, 그냥 따뜻해. 결론 끝.'] },
        { say: '같이 졸자', tier: 'good', remember: 'bench-nap', face: 'smile', answer: '좋아. 먼저 자는 사람이 이기는 거야. …벌써 졌어. 너 빠르다.' },
        { say: '눈부셔서 그늘로 갈래', tier: 'meh', remember: 'bench-nap', face: 'calm', answer: '…그래. 그늘도 나쁘진 않아. 나는 여기 있을게.' },
      ],
    },
    {
      title: '생선구이 반 토막',
      hint: '야니네코가 껍질 바삭한 생선구이 이야기를 했어요. 생선구이 하나를 들고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'grilledfish', take: true } },
      scene: [
        '생선구이를 내밀자 야니네코의 귀가 쫑긋 선다.',
        '꼬리가 멋대로 흔들린다. 본인은 모른 척한다.',
        '"…꼬리 보지 마. 이건 반사야. 내 의지가 아니야."',
        '야니네코가 담배를 빼서 주머니에 넣는다. 먹을 땐 안 문다.',
        '그러고는 생선을 정확히 반으로 가른다. 껍질 쪽이 조금 더 크다.',
        '"자. 반. 나는 원래 안 나눠. 럭스한테도 안 나눠."',
        '"자취하면 밥은 늘 혼자야. 컵라면은 둘이 먹기엔 작고."',
        '"…근데 혼자 먹으면 맛이 덜하더라. 요즘 알았어."',
        '다 먹고 나서 야니네코가 기름 묻은 포장지를 곱게 접는다.',
        '"이건 버리는 거 아니야. 상자에 넣을 거야. 자취방에 있는 거."',
        '"무슨 상자냐고? …버리기 싫은 거 넣는 상자. 그게 다야."',
      ],
      replies: [
        { say: '껍질 큰 쪽은 네가 먹어', tier: 'great', remember: 'fish-share', face: 'shy', answer: ['…너 진짜 날 너무 잘 알아. 무섭다.', '고마워. 진짜로.'] },
        { say: '같이 먹으니까 맛있다', tier: 'good', remember: 'fish-share', face: 'smile', answer: '그치. 이유는 몰라. 논문 주제 바꿀까 봐.' },
        { say: '난 배불러', tier: 'meh', remember: 'fish-share', face: 'calm', answer: '…그럼 내가 다 먹을게. 아깝잖아. 다음엔 배고플 때 와.' },
      ],
    },
    {
      title: '아무도 모르는 자리',
      hint: '야니네코와 볕 좋은 비밀 자리를 같이 쓰기로 하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'sun-spot' },
      scene: [
        '빵집 뒤 담벼락 아래. 오후의 돌이 따뜻하다.',
        '빵 굽는 냄새가 담 너머로 넘어온다. 바람은 여기까지 안 온다.',
        '"여기, 진짜 아무도 몰라. 잔나도. 베아트리스도. 힘멜은 당연히."',
        '"소문 장사하는 고양이가 소문 안 낸 유일한 거야."',
        '야니네코가 담벼락에 등을 기대고 눈을 감는다.',
        '"동네 사람들, 나한테 오는 이유는 대개 소문이야. 나쁜 건 아니야."',
        '"근데 소문 없는 날엔 아무도 안 와. 그래서 여기 와서 자."',
        '"혼자 있는 거 좋아해. 진짜로. …거의 진짜로."',
        '야니네코가 물고 있던 담배를 빼서 손가락으로 굴린다.',
        '"여기선 안 물어. 볕 냄새를 가리거든."',
        '"…너한테 알려 준 건 실수 아니야. 일부러야. 알아 둬."',
      ],
      replies: [
        { say: '소문 없어도 보러 올게', tier: 'great', face: 'shy', answer: ['…그런 말 하지 마. 믿게 되잖아.', '…믿을게. 귀찮지만. 이제 여긴 둘의 자리야.'] },
        { say: '왜 나한테 알려 줬어?', tier: 'good', face: 'think', answer: '…귀찮은 질문이네. 대답은 다음에. 지금은 볕이 아까워.' },
        { say: '좀 좁다', tier: 'meh', face: 'calm', answer: '좁으니까 붙어 앉는 거야. 상자랑 같은 원리. 몰랐어?' },
      ],
    },
    {
      title: '소문이 안 된 이야기',
      hint: '야니네코와 아주 가까워지면 소문으로 안 판 이야기를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤 편의점 앞 의자. 컵라면 두 개에서 김이 오른다.',
        '야니네코는 알바 조끼를 입은 채다. 쉬는 시간이라고 했다.',
        '"{me}. 나 요즘 잔나한테 소문 하나를 안 팔아. 제일 비싼 건데."',
        '"잔나가 냄새를 맡았어. 커피 세 잔까지 불렀어. 그래도 안 팔았어."',
        '"누가 누구를 좋아한다는 소문. …내 거라서 못 팔아."',
        '야니네코가 젓가락으로 면만 휘휘 젓는다. 귀가 붉다.',
        '"고양이가 좋아하는 사람 앞에선 어떻게 하는지 알아?"',
        '"모른 척해. 근데 자꾸 그 사람 가는 길에 앉아 있어."',
        '"…요즘 내가 그래. 우연 아니었어. 다."',
        '면이 다 불었다. 야니네코는 모르는 척 한 젓가락 뜬다.',
        '"꽃 같은 건 귀찮은데… 생선 가게 옆 꽃이면, 받을지도 몰라."',
      ],
      replies: [
        { say: '그 소문, 나도 알 것 같아', tier: 'great', face: 'shy', answer: ['…알면 됐어. 말로 하는 건 귀찮으니까.', '꼬리 보지 마. 진짜로.'] },
        { say: '누구 얘긴데?', tier: 'good', face: 'laugh', answer: '…너 머리 나쁜 척하는 거지. 나랑 똑같네. 라면 불어.' },
        { say: '라면 다 먹었어?', tier: 'meh', face: 'calm', answer: '…응. 다 먹었어. 너는 이야기를 안 먹었네. 다음에 다시 줄게.' },
      ],
    },
    {
      title: '평생 볕 자리',
      hint: '야니네코와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '아침이다. 야니네코가 먼저 와 있다. 눈은 반쯤 감겨 있지만.',
        '"…놀라지 마. 아침에 일어났어. 너 때문에. 대단하지."',
        '품에 낡은 과자 상자 하나를 안고 있다. 모서리가 해져 있다.',
        '"버리기 싫은 거 넣는 상자. 보여 준다고 했지. 아니, 안 했나."',
        '뚜껑을 연다. 벤치 낙엽 한 장, 접은 생선 포장지, 컵라면 뚜껑.',
        '"전부 너랑 있던 날 거야. 세어 보진 않았어. 귀찮아서."',
        '야니네코가 입에서 불 없는 담배를 빼서 상자 안에 눕힌다.',
        '"이것도 넣을게. 이제 입이 심심하면 네 이름 부르면 되니까."',
        '"생각해 봤는데, 제일 좋은 볕 자리는 담벼락 아래가 아니었어."',
        '"네 옆이었어. 그러니까… 평생 쓸 수 있으면 좋겠어."',
        '"반지 같은 건 귀찮은 건데… 네가 주면, 안 귀찮을 것 같아."',
        '꼬리가 크게 한 번 흔들린다. 이번엔 보지 말라는 말이 없다.',
      ],
      replies: [
        { say: '평생 반쪽은 네 거야', tier: 'great', face: 'shy', answer: ['…반쪽 말고 다. 아, 반은 너도 써.', '꼬리는… 봐도 돼. 오늘부터.'] },
        { say: '아침에 일어난 게 더 놀라워', tier: 'good', face: 'laugh', answer: '…그치. 기적이야. 이걸로 내 사랑 증명 끝이야. 다시는 안 해.' },
        { say: '조금만 더 천천히', tier: 'meh', face: 'smile', answer: '좋아. 천천히가 내 전문이야. 볕은 내일도 들어.' },
      ],
    },
  ],
  after: [
    '오늘 말 많이 했다. 이제 좀 잘게. 깨우지 마.',
    '…또 왔어? 볕 자리 반쪽은 아직 비어 있어.',
    '내일 또 와. 아니면 모레. 아무 때나. 나는 여기 있어.',
    '소문은 내일 줄게. 오늘 거는 다 떨어졌어.',
    '…아까부터 있었어. 너 다시 올 것 같아서. 우연이야.',
    '오늘 할 말은 다 했어. 이제 꼬리만 말할 거야. 보지 마.',
    '컵라면 물 부어 놨어. 삼 분 동안은 말 걸어도 돼.',
    '하아암… 너 목소리 들으면 졸려. 칭찬이야. 좋은 쪽으로.',
  ],
};
