// 힘멜 — 시장 거리 빵집 알바생, 자칭 "마을의 용사". 폼 잡고 앞머리·외모 자랑을
// 하지만 누구에게나 다정한 반말. 광장에 자기 동상을 세우자는 청원(반복 농담),
// 늦잠 자는 사장 프리렌 대신 가게 문 열기, 사장님 꽃밭 마법을 좋아함, 성검 대신
// 빵칼, 멀리 사는 옛 친구들의 편지. 프리렌을 짝사랑하지만 그녀는 모른다.
// 이야기는 플레이어와 이어지고, 짝사랑은 조용히 다른 쪽으로 옮겨 간다.
// 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const HIMMEL_TALK: NpcTalkBook = {
  npc: 'himmel',
  memories: {
    'statue-sign': '동상 청원서에 서명해 줬어요',
    'statue-doubt': '동상은 좀 과하다고 했어요',
    'bangs-praise': '앞머리가 멋있다고 해 줬어요',
    'pose-pick': '동상 포즈를 골라 줬어요',
    'hero-kind': '작은 도움도 용사의 일이라고 맞장구쳤어요',
    'crush-cheer': '사장님을 향한 마음을 응원하기로 했어요',
    'crush-tease': '짝사랑을 살짝 놀렸어요',
    'flower-magic': '꽃밭 마법 이야기를 들었어요',
    'bread-knife': '빵칼 검술을 구경했어요',
    'letters': '멀리 사는 옛 친구들 이야기를 들었어요',
    'key-duty': '열쇠 당번을 도와주기로 했어요',
    'cape-fan': '망토가 잘 어울린다고 했어요',
    'hide-seek': '숨바꼭질 내기를 응원했어요',
    'dawn-shop': '새벽에 함께 빵집 문을 열었어요',
    'cosmos-gift': '코스모스를 선물했어요',
    'true-hero': '동상을 원하는 진짜 이유를 들었어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일에 축하 행진을 해 준대요',
    'date-talk': '내 방에서 보낸 시간을 이야기했어요',
  },
  talks: [
    {
      id: 'statue',
      open: '{me}, 광장 한가운데 비어 있지? 거기 내 동상이 서면 딱인데.',
      replies: [
        { say: '서명할게! 어디다 써?', tier: 'great', remember: 'statue-sign', face: 'laugh', answer: ['역시 {me}! 여기, 맨 위 칸.', '역사에 남을 서명이야. 내 이름 바로 옆에.'] },
        { say: '동상은 좀 과하지 않아?', tier: 'good', remember: 'statue-doubt', face: 'think', answer: '과해야 기억에 남지. 작게 만들면 아무도 안 봐.' },
        { say: '돈은 누가 내?', tier: 'meh', face: 'sorry', answer: '…그건 아직 청원 단계라서. 모금은 다음 단계야.' },
      ],
    },
    {
      id: 'bangs',
      open: '잠깐. 오늘 앞머리 어때? 바람이 왼쪽에서 불어서 신경 쓰였거든.',
      replies: [
        { say: '완벽해. 용사 같아', tier: 'great', remember: 'bangs-praise', face: 'laugh', answer: '그렇지? 거울한테도 물어봤는데 너랑 같은 대답이었어.' },
        { say: '오른쪽이 살짝 떴어', tier: 'good', face: 'wow', answer: '앗. 고마워. 이런 걸 말해 주는 게 진짜 동료야.' },
        { say: '잘 모르겠는데', tier: 'meh', face: 'calm', answer: '괜찮아. 모르는 사람 눈에도 멋있으면 그게 진짜야.' },
      ],
    },
    {
      id: 'pose',
      open: '동상 포즈를 셋으로 좁혔어. 칼 들기, 손 흔들기, 앞머리 넘기기.',
      replies: [
        { say: '앞머리 넘기기!', tier: 'great', remember: 'pose-pick', face: 'laugh', answer: '알아보는구나! 바람까지 조각으로 새겨 달라고 할 거야.' },
        { say: '손 흔드는 게 다정해', tier: 'good', remember: 'pose-pick', face: 'smile', answer: '다정한 용사라… 좋다. 지나가는 사람한테 인사하는 동상.' },
        { say: '그냥 서 있는 걸로', tier: 'meh', face: 'think', answer: '그건 너무 겸손해. 용사는 조금 뻔뻔해야 해.' },
      ],
    },
    {
      id: 'small-deed',
      open: '오늘 시장에서 할머니 짐을 들어 드렸어. 작은 일이지만 용사의 일이야.',
      replies: [
        { say: '작은 일이 제일 커', tier: 'great', remember: 'hero-kind', face: 'shy', answer: ['…너 그거 알아? 그 말, 내가 제일 듣고 싶던 말이야.', '마왕은 없어도 무거운 짐은 매일 있거든.'] },
        { say: '나도 같이 도울래', tier: 'good', remember: 'hero-kind', face: 'smile', answer: '좋아! 그럼 오늘부터 너도 용사단이야. 망토는 나중에.' },
        { say: '그것도 용사야?', tier: 'meh', face: 'calm', answer: '그럼. 칼 휘두르는 것만 용사면 이 마을엔 용사가 없게?' },
      ],
    },
    {
      id: 'crush',
      open: '{me}, 비밀 하나. 사장님… 아, 아니다. 아니, 들어 줘. 나 사장님 좋아해.',
      replies: [
        { say: '응원할게, 힘멜', tier: 'great', remember: 'crush-cheer', face: 'shy', answer: '…고마워. 근데 사장님은 꽃을 꽂아 둬도 몰라. 그게 또 귀여워.' },
        { say: '다 티 나던데?', tier: 'good', remember: 'crush-tease', face: 'wow', answer: '진짜? 근데 왜 사장님만 몰라? …아, 사장님이니까.' },
        { say: '그걸 왜 나한테 말해', tier: 'meh', face: 'sorry', answer: '…용사도 털어놓을 데가 필요해. 봇치는 나보다 더 떨거든.' },
      ],
    },
    {
      id: 'flower-magic',
      open: '사장님이 꽃밭 피우는 마법 본 적 있어? 쓸모없대. 난 그게 제일 좋아.',
      replies: [
        { say: '왜 제일 좋아?', tier: 'great', remember: 'flower-magic', face: 'think', answer: ['쓸모없는 걸 좋아하는 사람은 다정하거든.', '그 마법 쓸 때 사장님 얼굴이 제일 편해 보여.'] },
        { say: '나도 보고 싶다', tier: 'good', remember: 'flower-magic', face: 'smile', answer: '축제 날 졸라 봐. 일 년에 한 번은 보여 줘.' },
        { say: '쓸모없으면 별로지', tier: 'meh', face: 'calm', answer: '그런가? 꽃은 원래 먹지도 못하는데 다들 좋아하잖아.' },
      ],
    },
    {
      id: 'bread-knife',
      open: '이게 내 검이야. 빵칼. 성검은 못 뽑았지만 이걸로 바게트는 다 베어.',
      replies: [
        { say: '검술 보여 줘!', tier: 'great', remember: 'bread-knife', face: 'laugh', answer: '좋아, 잘 봐. 하나, 둘… 봐, 바게트가 여덟 조각. 단면도 멋있지?' },
        { say: '빵칼도 멋있네', tier: 'good', face: 'smile', answer: '그렇지? 검은 뭘 지키느냐가 중요해. 이건 아침밥을 지켜.' },
        { say: '그냥 칼이잖아', tier: 'meh', face: 'think', answer: '그냥 칼로 진짜 용사가 될 수도 있는 거야. 두고 봐.' },
      ],
    },
    {
      id: 'letters',
      open: '편지 왔어! 멀리 사는 옛 친구들. 하나는 술 얘기, 하나는 받침대 얘기.',
      replies: [
        { say: '어떤 친구들이야?', tier: 'great', remember: 'letters', face: 'laugh', answer: ['술 좋아하는 착한 녀석이랑, 말수 적은 튼튼한 아저씨.', '둘 다 멀리 있어도 내 편이야. 든든하지.'] },
        { say: '받침대가 뭐야?', tier: 'good', remember: 'letters', face: 'wow', answer: '동상 받침대! 깎아 준대. 근데 몇 년째 깎는 중이래.' },
        { say: '답장은 썼어?', tier: 'meh', face: 'sorry', answer: '…아직. 멋있는 첫 문장을 고민하다 보면 한 달이 가.' },
      ],
    },
    {
      id: 'key-duty',
      open: '사장님은 오늘도 늦잠. 그래서 열쇠는 늘 내 주머니에 있어. 무겁다, 책임감.',
      replies: [
        { say: '내가 도와줄게', tier: 'great', remember: 'key-duty', face: 'smile', answer: '진짜? 그럼 너는 간판 담당. 용사단 첫 임무야!' },
        { say: '깨우면 안 돼?', tier: 'good', face: 'laugh', answer: '세 번 두드리면 한 번 대답해. 그 한 번이 "오 분만"이야.' },
        { say: '사장 바꿔야겠다', tier: 'meh', face: 'sorry', answer: '안 돼! …아, 너무 크게 말했다. 그냥, 난 이 가게가 좋아.' },
      ],
    },
    {
      id: 'cape',
      open: '망토 새로 다렸어. 바람 불 때 펄럭이는 각도가 중요하거든.',
      replies: [
        { say: '진짜 잘 어울려', tier: 'great', remember: 'cape-fan', face: 'laugh', answer: '그 말 들으려고 아침부터 다렸지. 보람 있다!' },
        { say: '빵집에서 덥지 않아?', tier: 'good', face: 'think', answer: '좀 더워. 근데 용사는 계절보다 망토가 먼저야.' },
        { say: '밀가루 묻겠다', tier: 'meh', face: 'sorry', answer: '…벌써 묻었어. 하얀 무늬라고 생각하기로 했어.' },
      ],
    },
    {
      id: 'hide-seek',
      open: '야니네코랑 숨바꼭질 내기 중이야. 또 지면 동상 서명 받으러 같이 가 준대.',
      replies: [
        { say: '이겨! 응원할게', tier: 'great', remember: 'hide-seek', face: 'laugh', answer: '좋아! 이번엔 햇볕 드는 데부터 찾아 볼 거야. 거기 꼭 있거든.' },
        { say: '져도 이득 아니야?', tier: 'good', face: 'think', answer: '…어? 그러네. 근데 용사는 일부러 지지 않아.' },
        { say: '그거 무슨 내기야', tier: 'meh', face: 'calm', answer: '청년끼리의 진지한 승부야. 이유는 잊었어.' },
      ],
    },
    {
      id: 'mirror',
      open: '{me}, 솔직히 말해 봐. 나 잘생겼지? 아니, 대답 안 해도 알아.',
      replies: [
        { say: '마을에서 제일', tier: 'great', face: 'laugh', answer: '동상 청원서에 그 문장 그대로 넣어도 돼? 추천사로!' },
        { say: '착한 게 더 멋있어', tier: 'good', face: 'shy', answer: '…그런 말은 반칙이야. 폼 잡을 틈을 안 주잖아.' },
        { say: '평범한데', tier: 'meh', face: 'sorry', answer: '…용사는 상처받지 않아. 오늘만 조금 받을게.' },
      ],
    },
    {
      id: 'shift',
      when: { ch: 3 },
      open: '이상해. 요즘 가게에 꽃을 꽂을 때, 사장님 말고 다른 얼굴이 떠올라.',
      replies: [
        { say: '…누구 얼굴인데?', tier: 'great', face: 'shy', answer: ['그걸 묻다니, 용사를 너무 몰아붙인다.', '…답은 지금 눈앞에 있을지도. 아, 못 들은 걸로 해.'] },
        { say: '마음은 변하기도 해', tier: 'good', face: 'think', answer: '응. 사장님을 좋아한 시간도 소중해. 그래도 지금은 지금이야.' },
        { say: '꽃집 주인 아니야?', tier: 'meh', face: 'laugh', answer: '아니야! …하하, 너 진짜 둔하다. 사장님만큼.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침, {me}! 해보다 먼저 일어난 용사 둘이네. 빵집 문 같이 열래?',
      replies: [
        { say: '간판은 내가 걸게', tier: 'great', remember: 'key-duty', face: 'laugh', answer: '좋아! 열쇠는 내가, 간판은 네가. 완벽한 용사단이야.' },
        { say: '사장님은 아직 자?', tier: 'good', face: 'smile', answer: '응. 오늘은 상자 안에서 자고 있었어. 머리만 넣고.' },
        { say: '난 더 잘래', tier: 'meh', face: 'calm', answer: '그래, 푹 자. 용사가 대신 아침을 지켜 둘게.' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비다! 망토가 무거워졌어. 그래도 벗진 않아. 우산 없으면 내 거 써.',
      replies: [
        { say: '같이 쓰자', tier: 'great', face: 'shy', answer: '…좋아. 근데 내 쪽이 좀 젖어도 돼. 앞머리만 지켜 줘.' },
        { say: '넌 어쩌고?', tier: 'good', face: 'smile', answer: '용사는 비 좀 맞아도 괜찮아. 감기는 좀 무섭지만.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 왔어! 광장에 눈사람 용사 만들자. 동상 연습이라고 생각하면 돼.',
      replies: [
        { say: '앞머리도 만들자!', tier: 'great', remember: 'pose-pick', face: 'laugh', answer: '역시 넌 알아! 고드름으로 앞머리 내리면 딱이야.' },
        { say: '손 시려워', tier: 'good', face: 'smile', answer: '여기, 빵집에서 갓 나온 빵. 손난로 대신 들고 있어.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening', weather: ['sunny', 'cloudy'] },
      open: '노을 아래 서 봤어. 어때, 지금 이 각도. 동상 각도로 쓸 만하지?',
      replies: [
        { say: '그림 같아', tier: 'great', remember: 'bangs-praise', face: 'laugh', answer: '그림! 동상 다음엔 초상화 청원도 해야겠다.' },
        { say: '해가 눈부셔', tier: 'good', face: 'smile', answer: '그럼 내 그림자 쪽으로 와. 용사의 그늘이야.' },
        { say: '배고프다', tier: 'meh', face: 'calm', answer: '…남은 빵 있어. 폼은 접고 같이 먹자.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 오늘 서명이 제일 많이 모이는 날이야. 그리고 사장님 마법도!',
      replies: [
        { say: '서명 받는 거 도와줄게', tier: 'great', remember: 'statue-sign', face: 'laugh', answer: '고마워! 네가 서 있으면 서명이 두 배로 모일 거야.' },
        { say: '꽃밭 마법 같이 보자', tier: 'good', remember: 'flower-magic', face: 'shy', answer: '응. 맨 앞자리 맡아 둘게. 일 년 기다린 거야.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish} 낚았어? 대단한데! 용사단 식량 담당으로 임명할게.',
      replies: [
        { say: '영광입니다, 용사님', tier: 'great', face: 'laugh', answer: '하하! 좋아, 임명식은 동상 제막식 때 같이 하자.' },
        { say: '빵이랑 바꿀래?', tier: 'good', face: 'smile', answer: '좋지. 사장님한테 생선 빵 실험은 하지 말자고 할게.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었어! 오늘 기록급 물고기 잡았다며? 동상은 너부터 세워야겠다.',
      replies: [
        { say: '둘이 나란히 세우자', tier: 'great', face: 'shy', answer: '…나란히. 그거 좋다. 청원서 제목을 바꿔야겠어.' },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 실력이야. 용사도 반은 운으로 먹고살아.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 왔구나. 흙 묻은 얼굴도 용사 같아. 정말이야.',
      replies: [
        { say: '너도 해 볼래?', tier: 'great', face: 'laugh', answer: '좋아! 괭이도 검이랑 비슷하겠지? …아닌가.' },
        { say: '빵 재료 키우는 중', tier: 'good', face: 'smile', answer: '그럼 우리 빵의 뿌리는 너네 밭이네. 고마워.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물? 반짝반짝하다. 내 동상 받침대에 박으면 어울리겠는데.',
      replies: [
        { say: '하나 줄게', tier: 'great', face: 'wow', answer: '진짜? 아니, 넣어 둬. 마음만 받을게. 진짜 용사는 그래.' },
        { say: '팔아서 동상 지어', tier: 'good', face: 'laugh', answer: '하하! 그럼 첫 모금은 너야. 받침대에 이름 새겨 줄게.' },
        { say: '그건 안 돼', tier: 'meh', face: 'calm', answer: '알아, 농담이야. 반짝이는 건 원래 주인한테 어울려.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 좀 처져 보여. 용사가 할 수 있는 거 있어? 뭐든 말해.',
      replies: [
        { say: '그냥 옆에 있어 줘', tier: 'great', face: 'shy', answer: '그건 제일 쉬운 임무야. 폼도 안 잡을게. 그냥 있을게.' },
        { say: '웃긴 얘기 해 줘', tier: 'good', face: 'laugh', answer: '오늘 거울 보고 인사하다 손님한테 들켰어. …웃었지? 됐다.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '얼굴이 환하다! 좋은 일 있었지? 용사는 그런 거 한눈에 알아봐.',
      replies: [
        { say: '너 봐서 그래', tier: 'great', face: 'shy', answer: '…그런 대사는 내가 할 거였는데. 선수 뺏겼다.' },
        { say: '그냥 날씨가 좋아서', tier: 'good', face: 'smile', answer: '그것도 좋은 일이야. 용사는 작은 행운도 세어 둬.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '결혼 소식 들었어? 광장에서 식 올린대. …동상 자리는 비켜 주겠지?',
      replies: [
        { say: '오늘은 양보해', tier: 'great', face: 'laugh', answer: '물론! 용사는 축하할 땐 확실히 비켜. 꽃도 내가 날라 줄 거야.' },
        { say: '부럽지?', tier: 'good', face: 'shy', answer: '…조금. 언젠가 나도 저기 서 보고 싶어. 망토 입고.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '마을에 전설 같은 소식이 돌던데! 전설은 원래 용사 담당인데 말이야.',
      replies: [
        { say: '다음 전설은 너야', tier: 'great', face: 'laugh', answer: '그 말 청원서 맨 앞에 붙여도 돼? 진짜 붙일 거야.' },
        { say: '질투해?', tier: 'good', face: 'sorry', answer: '아니야! …조금. 좋은 소식이니 같이 기뻐하자.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '사장님 만났어? 일어나 계셨어? 나한텐 오늘 한마디도 안 했는데.',
      replies: [
        { say: '네 꽃 예쁘대', tier: 'great', remember: 'crush-cheer', face: 'shy', answer: '…진짜? 그 말이면 일주일 버텨. 아니, 한 달.' },
        { say: '졸고 계시던데', tier: 'good', face: 'laugh', answer: '역시. 그래도 깨어 있는 날 만났으면 운 좋은 거야.' },
      ],
    },
    {
      id: 'op-bocchi',
      when: { bond: 'bocchi' },
      open: '봇치 봤어? 내 연애 상담 해 주다가 오늘도 먼저 쓰러졌어.',
      replies: [
        { say: '이번엔 내가 들어 줄게', tier: 'great', face: 'smile', answer: '고마워. 넌 안 쓰러지지? …다행이다. 그럼 처음부터 말할게.' },
        { say: '봇치 공연 가자', tier: 'good', face: 'laugh', answer: '좋아! 맨 앞에서 박수 치면 봇치가 녹아내리겠지만.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '도서관 다녀왔어? 베아트리스가 내 얘기 했지. 떠든다고. 억울해.',
      replies: [
        { say: '좀 크긴 해, 목소리', tier: 'great', face: 'laugh', answer: '…용사의 목소리는 원래 멀리 가. 다음엔 속삭여 볼게.' },
        { say: '같이 사과하러 갈까', tier: 'good', face: 'smile', answer: '좋아. 빵 하나 들고 가자. 책 위엔 절대 안 올리고.' },
      ],
    },
    {
      id: 'op-yanineko',
      when: { bond: 'yanineko' },
      open: '야니네코 만났구나. 걔 어디 숨어 있었어? 아니, 말하지 마. 반칙이야.',
      replies: [
        { say: '햇볕 드는 데', tier: 'great', remember: 'hide-seek', face: 'wow', answer: '역시! …앗, 말했네. 이번 판은 무효로 하자.' },
        { say: '비밀이야', tier: 'good', face: 'laugh', answer: '의리 있네. 그런 동료가 좋아. 내가 찾아낼게.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-statue',
      when: { mem: 'statue-sign' },
      use: 'statue-sign',
      open: '네 서명 덕분에 청원서가 두 장째야! 한 장은 거의 내 글씨지만.',
      replies: [
        { say: '한 장 더 채우자', tier: 'great', face: 'laugh', answer: '좋아! 오늘 광장 한 바퀴 돌자. 용사단 출동!' },
        { say: '네 글씨가 많네', tier: 'good', face: 'sorry', answer: '…열정의 증거야. 그래도 너 같은 진짜 서명이 제일 빛나.' },
      ],
    },
    {
      id: 'cb-crush',
      when: { mem: 'crush-cheer' },
      use: 'crush-cheer',
      open: '응원해 준 거 기억나? 사장님한테 꽃 줬어. 꽃병이 어디 있냐고만 하더라.',
      replies: [
        { say: '그래도 받았잖아', tier: 'great', face: 'shy', answer: '…그렇지? 받았어. 그거면 오늘은 용사가 이긴 거야.' },
        { say: '직접 말해 봐', tier: 'good', face: 'think', answer: '말하면… 사장님은 "응" 하고 잘 것 같아. 그게 무서워.' },
      ],
    },
    {
      id: 'cb-tease',
      when: { mem: 'crush-tease' },
      use: 'crush-tease',
      open: '{me}, 저번에 다 티 난다고 했지. 확인해 봤어. 모두 알더라. 사장님 빼고.',
      replies: [
        { say: '그게 매력이지', tier: 'great', face: 'laugh', answer: '하하… 맞아. 둔한 사장님, 티 나는 용사. 잘 어울리지?' },
        { say: '미안, 놀려서', tier: 'good', face: 'smile', answer: '아니야. 덕분에 숨기려다 앞머리만 망가지는 일은 없어졌어.' },
      ],
    },
    {
      id: 'cb-bangs',
      when: { mem: 'bangs-praise', time: ['day', 'evening'] },
      use: 'bangs-praise',
      open: '네가 앞머리 칭찬한 날부터 같은 방향으로만 넘겨. 오늘도 그 방향이야.',
      replies: [
        { say: '오늘도 멋있어', tier: 'great', face: 'laugh', answer: '그렇지? 이 방향은 이제 "{me} 방향"이라고 부를래.' },
        { say: '반대도 해 봐', tier: 'good', face: 'wow', answer: '모험이네… 좋아, 내일 반대로 넘기고 올게. 평가해 줘.' },
      ],
    },
    {
      id: 'cb-letters',
      when: { mem: 'letters' },
      use: 'letters',
      open: '옛 친구들한테 답장 썼어! 너 얘기도 넣었어. 용사단 새 단원이라고.',
      replies: [
        { say: '정식 단원이야?', tier: 'great', face: 'laugh', answer: '그럼! 망토는 없지만 마음은 있잖아. 그게 더 중요해.' },
        { say: '뭐라고 썼어?', tier: 'good', face: 'shy', answer: '착하고, 웃음이 좋고… 됐어, 여기까지. 나머진 비밀.' },
      ],
    },
    {
      id: 'cb-knife',
      when: { mem: 'bread-knife' },
      use: 'bread-knife',
      open: '빵칼 검술, 그날 이후로 신기술 생겼어. 식빵을 종이처럼 얇게!',
      replies: [
        { say: '보여 줘!', tier: 'great', face: 'laugh', answer: '자, 봐. …너무 얇아서 하나 날아갔다. 그것도 기술이야.' },
        { say: '두꺼운 게 맛있어', tier: 'good', face: 'think', answer: '…그건 그래. 신기술은 동상 제막식 때만 쓰자.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 용사는 동료 취향을 외워 둬.',
      replies: [
        { say: '기억해 줘서 고마워', tier: 'great', remember: 'taste-heard', face: 'smile', answer: '당연하지. 다음 신메뉴 회의 때 슬쩍 밀어 볼게.' },
        { say: '어떻게 알았어?', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '용사의 정보망이야. 사실 그냥 잘 들었어.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸은 날, 나 폼을 한 번도 안 잡았더라. 집에 와서 알았어.',
      replies: [
        { say: '그게 더 좋았어', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…그래? 그럼 다음에도 폼은 집에 두고 나갈게.' },
        { say: '다음엔 망토 입고 가', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '좋아! 펄럭이는 각도 연구해 둘게. 기대해.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일이지? 용사단이 광장에서 축하 행진을 할 거야. 단원은 나 혼자지만.',
      replies: [
        { say: '혼자여도 좋아', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '…그럼 두 배로 크게 걸을게. 망토도 두 배로 펄럭이고.' },
        { say: '빵이면 충분해', tier: 'good', remember: 'bday-plan', face: 'smile', answer: '빵도 행진도 둘 다 해 줄게. 용사는 욕심이 많아.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에 갔던 날, 거울이 있었는데 한 번도 안 봤어. 신기하지?',
      replies: [
        { say: '나만 봤어?', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…응. 용사도 가끔은 솔직해져. 오늘이 그날이야.' },
        { say: '앞머리 괜찮았어', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '다행이다! 확인 못 해서 밤새 걱정했거든.' },
      ],
    },
  ],
  chapters: [
    {
      title: '열쇠 당번 용사',
      hint: '한 번 이야기를 나누면 힘멜이 동상 청원서를 내밀어요.',
      need: { days: 1 },
      scene: [
        '힘멜이 빵칼을 칼집처럼 허리에 차고 빵집 앞에 서 있다.',
        '"안녕! 나는 힘멜. 마을의 용사이자, 이 빵집의 열쇠 당번이야."',
        '그가 앞머리를 한 번 넘기고 종이 한 장을 내민다.',
        '"광장 동상 청원서야. 부담 갖지 마. 서명하면 역사에 남을 뿐이야."',
      ],
      replies: [
        { say: '좋아, 서명할게!', tier: 'great', remember: 'statue-sign', face: 'laugh', answer: '최고야! 첫 만남에 서명이라니. 넌 좋은 사람이야.' },
        { say: '생각해 볼게', tier: 'good', face: 'smile', answer: '천천히 해. 청원서는 도망 안 가. 나도 안 가고.' },
        { say: '동상이 왜 필요해?', tier: 'meh', remember: 'statue-doubt', face: 'think', answer: '…좋은 질문이야. 답은 나중에. 아주 나중에.' },
      ],
    },
    {
      title: '새벽의 열쇠',
      hint: '새벽(게임 시각 다섯 시부터 여덟 시) 시장 거리에 가 보세요. 힘멜이 빵집 문을 열어요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 5, to: 8 } },
      scene: [
        '아직 어두운 시장 거리. 힘멜이 빵집 자물쇠에 열쇠를 꽂는다.',
        '"왔구나! 새벽의 용사단, 출동이야."',
        '가게 안은 조용하다. 안쪽 의자에서 프리렌이 앉은 채 자고 있다.',
        '"쉿. 사장님은 깨우지 말자. 오븐은 내가 데울게."',
        '"이 시간이 좋아. 아무도 모르게 누군가의 아침을 지키는 거."',
      ],
      replies: [
        { say: '그게 진짜 용사네', tier: 'great', remember: 'dawn-shop', face: 'shy', answer: '…그 말, 동상보다 좋다. 오늘 첫 빵은 네 거야.' },
        { say: '간판은 내가 걸게', tier: 'good', remember: 'dawn-shop', face: 'smile', answer: '고마워. 둘이 하니까 해가 뜨기 전에 끝났어.' },
        { say: '너무 졸려…', tier: 'meh', remember: 'dawn-shop', face: 'laugh', answer: '하하, 사장님 옆에서 좀 자. 둘이 나란히 졸면 귀엽겠다.' },
      ],
    },
    {
      title: '코스모스 한 송이',
      hint: '힘멜이 가게에 꽂을 꽃을 찾고 있어요. 코스모스를 가지고 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'cosmos', take: true } },
      scene: [
        '코스모스를 내밀자 힘멜이 두 손으로 조심스레 받는다.',
        '"이거… 늘 사장님한테 주려고 내가 사 오던 꽃이야."',
        '"근데 받는 쪽이 되니까 기분이 이상하네. 좋은 쪽으로."',
        '그는 꽃을 빵집 창가가 아니라 자기 망토 깃에 꽂는다.',
        '"이건 가게용 아니야. 용사용이야. 오늘 하루 자랑하고 다닐래."',
      ],
      replies: [
        { say: '잘 어울려', tier: 'great', remember: 'cosmos-gift', face: 'laugh', answer: '그렇지? 광장 한 바퀴 돌고 올게. 너도 같이 가!' },
        { say: '사장님 드려도 돼', tier: 'good', remember: 'cosmos-gift', face: 'think', answer: '…아니. 이건 네가 준 거니까. 내가 가질래.' },
        { say: '길가에 피어 있었어', tier: 'meh', remember: 'cosmos-gift', face: 'smile', answer: '길가 꽃이 제일 씩씩해. 나랑 닮았네.' },
      ],
    },
    {
      title: '동상을 원하는 이유',
      hint: '작은 도움도 용사의 일이라는 힘멜의 말에 맞장구치면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'hero-kind' },
      scene: [
        '밤의 광장. 힘멜이 비어 있는 가운데 자리에 선다.',
        '"동상 말이야. 사실 멋있어 보이려고만 그러는 건 아니야."',
        '"사장님은 오래 살잖아. 먼 훗날 여기 지나가다 웃었으면 했어."',
        '그가 잠깐 말을 멈추고 앞머리를 만지작거린다.',
        '"근데 요즘은… 지금 옆에 있는 사람이랑 웃는 게 더 좋아."',
        '"동상 없어도 될 것 같아. 오늘 같은 밤이 있으면."',
      ],
      replies: [
        { say: '나도 오늘이 좋아', tier: 'great', remember: 'true-hero', face: 'shy', answer: '…다행이다. 용사가 처음으로 폼 안 잡고 한 말이었어.' },
        { say: '동상도 세우자', tier: 'good', remember: 'true-hero', face: 'laugh', answer: '하하! 그래, 청원은 계속할게. 이유가 하나 늘었을 뿐이야.' },
        { say: '사장님한텐 말했어?', tier: 'meh', remember: 'true-hero', face: 'think', answer: '…아니. 이제는 말 안 해도 될 것 같아. 이상하지.' },
      ],
    },
    {
      title: '망토를 벗은 용사',
      hint: '힘멜과 아주 가까워지면 그가 망토 없이 찾아와요. 그 뒤엔 꽃다발도 받을지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '오늘 힘멜은 망토도, 빵칼도 없이 서 있다.',
        '"이상하지. 폼 잡을 게 하나도 없으니까 좀 떨린다."',
        '"용사는 원래 혼자 떠나는 거라고 생각했어. 근데 아니더라."',
        '"{me}, 너랑 있으면 그냥 힘멜이어도 괜찮아."',
        '"…꽃다발 같은 거 받으면, 광장 한가운데서 자랑할 거야. 미리 말해 둘게."',
      ],
      replies: [
        { say: '그냥 힘멜이 좋아', tier: 'great', face: 'shy', answer: '…반칙이야. 그 말 들으니까 앞머리가 다 상관없어졌어.' },
        { say: '망토도 좋은데', tier: 'good', face: 'laugh', answer: '하하! 그럼 내일은 다시 두르고 올게. 너 보라고.' },
        { say: '떨지 마', tier: 'meh', face: 'sorry', answer: '…노력할게. 용사도 처음 하는 모험은 떨려.' },
      ],
    },
    {
      title: '둘이서 가는 모험',
      hint: '힘멜과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽 광장. 동상 자리에 힘멜이 직접 만든 작은 나무 받침대가 있다.',
        '"동상 대신 이거. 위에 서 볼래? 둘이 서면 꽉 차."',
        '받침대에 오르자 그가 내 손을 잡고 해 뜨는 쪽을 본다.',
        '"앞으로 모든 모험, 너랑 가고 싶어. 끝까지."',
        '"반지라도 들고 오면 받아 줄래? …아, 또 먼저 말해 버렸다."',
      ],
      replies: [
        { say: '끝까지 같이 가자', tier: 'great', face: 'shy', answer: '…응. 용사의 모험은 이제 둘이서야. 동상보다 오래갈 거야.' },
        { say: '받침대 흔들려!', tier: 'good', face: 'laugh', answer: '하하! 그러니까 손 꼭 잡아. 그게 설계 의도야.' },
        { say: '천천히 생각할게', tier: 'meh', face: 'smile', answer: '응. 기다리는 것도 용사가 잘하는 일이야.' },
      ],
    },
  ],
  after: [
    '오늘은 여기까지! 용사도 빵 나르러 가야 해.',
    '또 왔네! 서명은 하루 한 번이면 충분해. 마음은 매번 고맙고.',
    '앞머리 확인 끝. 내일 또 보자, {me}.',
    '잘 가! 밤길 조심해. 무서우면 용사를 불러.',
  ],
};
