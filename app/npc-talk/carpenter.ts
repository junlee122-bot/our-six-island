// 발키리 — 나무결 가구점 목수. 지금 대사(app/lounge-npc-lines-carpenter.ts,
// -love-, -extra-, -companion-lines-) 말투 그대로: 경상도 사투리 섞인 반말,
// "누나야", 띄어 쓴 강조("이. 결. 봐. 라."), ㄴㄴ, "헐리 가요", "어디
// 안전이라고", "감히 ~단 말이고 지금", "칭찬 아이다", 얼굴 빨간 건 "톱밥
// 먼지". 단단한 나무·도끼(연장)·매운 것을 좋아하고 꽃다발·달달한 차는 싫다.
// 말 거는 사람이 언니 동생일 수도 있어 플레이어를 한남이라 부르지 않고,
// "이 마을 한남들"만 놀린다. 장이 갈수록 츤데레가 누그러진다.
import type { NpcTalkBook } from './types.ts';

export const CARPENTER_TALK: NpcTalkBook = {
  npc: 'carpenter',
  memories: {
    'hardwood-fan': '단단한 참나무가 좋다고 했어요',
    'soft-wood': '가볍고 무른 나무가 좋다고 했어요',
    'axe-tool': '도끼는 장식이 아니라 연장이라고 맞장구쳤어요',
    'spicy-pal': '매운 거 잘 먹는다고 했어요',
    'no-bouquet': '꽃다발보다 화분이 낫다고 했어요',
    'fair-price': '흥정 안 하고 정가로 사겠다고 했어요',
    'fix-it': '부서진 건 고쳐 쓴다고 했어요',
    'termite-lore': '흰개미가 제일 무섭다는 얘기를 들었어요',
    'viral-help': '가구점 소문을 내 주겠다고 했어요',
    'firewood-lesson': '장작 패는 법을 배우고 싶다고 했어요',
    'signature': '가구 밑에 이름을 새기는 이유를 들었어요',
    'chair-dream': '마을 의자를 다 짜겠다는 꿈을 응원했어요',
    'measured': '의자 높이 맞춘다고 키를 재 줬어요',
    'woods-morning': '아침 숲에서 나무 시찰을 같이 했어요',
    'first-carve': '단단한 나무로 숟가락을 깎아 받았어요',
    'spicy-night': '매운탕을 같이 먹으며 땀을 뺐어요',
    'chair-promise': '이름 새긴 의자에 앉아 보기로 했어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-heard': '같이 나무 시찰 다닌 날을 이야기했어요',
    'bday-heard': '생일 선물로 뭘 짜 줄지 물어봤어요',
  },
  talks: [
    {
      id: 'wood-pick',
      open: '{me}, 니는 무슨 나무 좋아하노. 대충 말하믄 헐리 가요.',
      replies: [
        { say: '단단한 참나무!', tier: 'great', remember: 'hardwood-fan', answer: ['오. 니 뭘 좀 아네.', '단단한 나무는 깎기 힘들어도 백 년 간다. 칭찬 아이다.'] },
        { say: '가볍고 무른 게 좋아', tier: 'good', remember: 'soft-wood', answer: '소나무 같은 거? 다루기는 편타. 쉽게 상하는 게 흠이지만.' },
        { say: '나무가 다 나무지', tier: 'meh', face: 'calm', answer: '…다리 네 개면 다 의자인 줄 아는 소리 하네. 이. 결. 봐. 라.' },
      ],
    },
    {
      id: 'axe',
      open: '니도 이 도끼 장식인 줄 알았제? 다들 그라더라.',
      replies: [
        { say: '연장이잖아. 딱 보면 알지', tier: 'great', remember: 'axe-tool', answer: ['맞다! 장식 아이다, 연장이다.', '이거 하나로 장롱도 짠다. 니 쪼매 마음에 든다.'] },
        { say: '들어 봐도 돼?', tier: 'good', face: 'think', answer: '무겁다. 손목 나간다. …자루만 잡아 봐라. 자루만.' },
        { say: '좀 무서워', tier: 'meh', face: 'calm', answer: '무서븐 건 흰개미다. 도끼는 착하다. 누나야도 착하다. 아마.' },
      ],
    },
    {
      id: 'spicy',
      open: '{me}, 니 매운 거 잘 묵나? 거짓말하믄 다 티 난다.',
      replies: [
        { say: '매운 거라면 자신 있어', tier: 'great', remember: 'spicy-pal', answer: ['진짜가? 이. 거. 기. 억. 해. 둔. 다.', '언제 매운탕 한 그릇 하자. 누가 사냐꼬는 묻지 마라.'] },
        { say: '적당히 매운 정도만', tier: 'good', answer: '적당히가 제일 어렵다. 그래도 솔직하니까 봐준다.' },
        { say: '난 달달한 게 좋아', tier: 'meh', face: 'calm', answer: '달달한 거는 ㄴㄴ. 누나야 앞에서 잼 얘기하지 마래이.' },
      ],
    },
    {
      id: 'bouquet',
      open: '요새 꽃다발 들고 댕기는 거 유행이가? 니는 우째 생각하노.',
      replies: [
        { say: '꽃다발보다 화분이 낫지', tier: 'great', remember: 'no-bouquet', answer: ['오, 말 통하네. 화분은 살아 있다.', '화분 받침은 누나야가 짜 주께. 나무로. 튼튼하게.'] },
        { say: '받는 사람 마음이지', tier: 'good', face: 'think', answer: '…맞는 말이라 할 말이 없네. 누나야 마음은 ㄴㄴ다.' },
        { say: '꽃다발 예쁘잖아', tier: 'meh', face: 'calm', answer: '예쁘긴 하다. 사흘이면 시든다. 의자는 백 년 간다. 끝.' },
      ],
    },
    {
      id: 'haggle',
      open: '{me}, 니 눈빛이 꼭 깎아 달라는 눈빛이다. 맞제?',
      replies: [
        { say: '아니, 정가로 살게', tier: 'great', remember: 'fair-price', answer: ['…맞나. 흥정 안 하는 손님은 처음이다.', '감히 누나야를 감동시킨단 말이고 지금. 반칙이다.'] },
        { say: '쪼매만 안 될까?', tier: 'good', face: 'laugh', answer: '사투리 따라 하지 마라. 웃기다. …쪼매만이다. 쪼. 매.' },
        { say: '반값에 해 줘', tier: 'meh', face: 'calm', answer: '느그 어마이가 그래 흥정하라꼬 갈키드나? 흥정ㄴㄴ.' },
      ],
    },
    {
      id: 'broken-chair',
      open: '의자 다리 하나 부러지믄 니는 우짜노. 버리나, 고치나.',
      replies: [
        { say: '고쳐서 오래 쓰지', tier: 'great', remember: 'fix-it', answer: '그래, 그기 맞다. 이 마을 한남들은 부수고 새로 사 달라 칸다.' },
        { say: '누나야한테 들고 오지', tier: 'good', face: 'smile', answer: '누나야라 카지 마라. 그건 내 말이다. …들고 온나. 반값.' },
        { say: '새로 사면 되지', tier: 'meh', face: 'calm', answer: '그라믄 나무가 섭섭해한다. 다음엔 고쳐 봐라. 내가 갈키 주께.' },
      ],
    },
    {
      id: 'termite',
      open: '누나야가 이 세상에서 제일 무서버하는 게 뭔지 아나?',
      replies: [
        { say: '혹시… 흰개미?', tier: 'great', remember: 'termite-lore', answer: ['어. 우. 째. 알. 았. 노.', '그놈들은 소리도 없이 기둥을 다 묵는다. 진짜 무섭다.'] },
        { say: '이 마을 한남들?', tier: 'good', face: 'laugh', answer: '그건 무서븐 게 아이고 귀찮은 기다. 차원이 다르다.' },
        { say: '무서운 거 없잖아', tier: 'meh', face: 'think', answer: '있다. 말 안 할 끼다. 니가 알면 놀릴 거 아이가.' },
      ],
    },
    {
      id: 'viral',
      open: '마을 신문에 가구점 났더라. 니도 소문 좀 태아 도.',
      replies: [
        { say: '마을에 다 말하고 다닐게', tier: 'great', remember: 'viral-help', answer: ['…고맙다꼬는 안 한다.', '대신 니 의자 다리 하나는 공짜로 봐준다. 하나만.'] },
        { say: '잔나한테 부탁해 볼게', tier: 'good', answer: '잔나는 벌써 바이럴 마이 태아줬다. 니도 거들어라.' },
        { say: '난 말주변이 없어', tier: 'meh', face: 'calm', answer: '그럼 의자에 앉아서 좋다고만 해라. 그게 제일 큰 소문이다.' },
      ],
    },
    {
      id: 'firewood',
      open: '겨울 오기 전에 장작 패야 된다. 니 장작 패 봤나?',
      replies: [
        { say: '배우고 싶어. 갈켜 줘', tier: 'great', remember: 'firewood-lesson', answer: ['좋다. 힘으로 내리찍지 마라. 결 따라 가르는 기다.', '한 번에 안 쪼개지믄 니 탓 아이다. 나무 탓도 아이다.'] },
        { say: '누나야가 패 주면 안 돼?', tier: 'good', face: 'laugh', answer: '…이번만이다. 니 집 것도 패 놓으께. 고맙단 말은 됐다.' },
        { say: '추우면 난로 켜면 되지', tier: 'meh', face: 'calm', answer: '그 난로에 넣는 기 장작이다. 어디 안전이라고 그런 소리를.' },
      ],
    },
    {
      id: 'signature',
      open: '누나야가 짠 가구 밑엔 다 이름 새겨져 있다. 와 그런지 아나?',
      replies: [
        { say: '끝까지 책임지려고?', tier: 'great', remember: 'signature', answer: ['…맞다. 삐걱대믄 누가 짰는지 알고 찾아오라꼬.', '내 이름 걸고 짠 기다. 대충은 ㄴㄴ.'] },
        { say: '자랑하려고?', tier: 'good', face: 'laugh', answer: '그것도 쪼매 있다. 쪼매. 숨길 생각은 없다.' },
        { say: '도둑 맞을까 봐?', tier: 'meh', face: 'think', answer: '누나야 가구 훔쳐 갈 간 큰 사람은 이 마을에 없다.' },
      ],
    },
    {
      id: 'chair-dream',
      open: '누나야 꿈이 뭔지 아나. 이 마을 의자는 다 내 손으로 짜는 기다.',
      replies: [
        { say: '멋지다. 응원할게', tier: 'great', remember: 'chair-dream', answer: ['응원은 됐고. …아이다, 받아 둔다.', '광장 벤치부터 하나씩. 니 의자도 그 안에 들어 있다.'] },
        { say: '광장 벤치도 누나야 거야?', tier: 'good', answer: '반은 내 거다. 나머지 반은 이 마을 한남들이 부숴 놨다.' },
        { say: '그러다 손 다쳐', tier: 'meh', face: 'calm', answer: '걱정은 고맙다. 누나야 손은 장롱도 혼자 옮긴다. 됐제.' },
      ],
    },
    {
      id: 'hannam-sit',
      open: '이 마을 한남들은 의자에 앉는 법도 모른다. 우째 앉는지 아나?',
      replies: [
        { say: '뒤로 젖히고 흔들지?', tier: 'great', face: 'laugh', answer: ['정. 답. 그라다 다리 나간다.', '니는 그래 앉지 마래이. 누나야 눈물 난다.'] },
        { say: '바르게 앉으면 되지', tier: 'good', answer: '그래. 그 쉬운 걸 몬 한다. 니라도 바르게 앉아라.' },
        { say: '난 바닥이 편해', tier: 'meh', face: 'think', answer: '바닥도 누나야가 깔았다. 그래, 어디든 앉아라.' },
      ],
    },
    {
      id: 'sawdust',
      open: '톱밥 날리는 거 싫제? 손님들 다 코 막고 나가더라.',
      replies: [
        { say: '나무 냄새라 좋던데', tier: 'great', face: 'shy', answer: '…니 코는 쓸 만하네. 대패 밥은 향이 제일 진하다.' },
        { say: '마스크 하나 줘', tier: 'good', answer: '저기 걸려 있다. 쓰고 구경해라. 만지는 건 ㄴㄴ.' },
        { say: '응, 기침 나', tier: 'meh', face: 'sorry', answer: '…문 열어 놓으께. 환기다. 니 땜에 연 거 아이다.' },
      ],
    },
    {
      id: 'measure',
      when: { ch: 3 },
      open: '{me}, 가만 서 봐라. 키 좀 재자. 의자 높이 맞출라꼬. 다른 뜻 없다.',
      replies: [
        { say: '내 의자 짜 주는 거야?', tier: 'great', remember: 'measured', face: 'shy', answer: ['물어보지 마라. 얼굴 빨간 거 아이다.', '톱밥 먼지다. 가만 서 있어라.'] },
        { say: '까치발 해도 돼?', tier: 'good', face: 'laugh', answer: '하지 마라. 그라믄 의자 다리 길어져서 니 발이 안 닿는다.' },
        { say: '그냥 대충 해', tier: 'meh', face: 'calm', answer: '대충은 ㄴㄴ. 누나야 이름 걸고 짜는 기다.' },
      ],
    },
    {
      id: 'date-course',
      when: { love: 'dating' },
      open: '데이트 코스 정했다. 과수원, 목재소, 매운 떡볶이집. 이의 있나?',
      replies: [
        { say: '완벽해. 떡볶이는 내가 살게', tier: 'great', face: 'shy', answer: '…니가 산다꼬? 오늘 톱밥 먼지가 와 이래 많노.' },
        { say: '목재소는 왜 들러?', tier: 'good', face: 'think', answer: '좋은 결 들어왔나 봐야지. 니 것도 볼 끼다. 그래서 간다.' },
        { say: '꽃집도 들르자', tier: 'meh', face: 'calm', answer: '…생각해 보께. 니니까 생각만 해 보는 기다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 온다. 나무가 붓는다. {me}, 우산도 없이 왔나. 들어온나.',
      replies: [
        { say: '처마 밑에서 대패 구경할래', tier: 'great', answer: '빗소리 들으면서 대패질하믄 마음이 편타. 조용히 보기만 해라.' },
        { say: '우산 하나 빌려줘', tier: 'good', answer: '누나야가 짠 거 있다. 반납 필수. 안 갖고 오믄 찾아간다.' },
        { say: '비 오는 날 싫어', tier: 'meh', face: 'calm', answer: '서랍 뻑뻑해지는 날이다. 누나야도 싫다. 같이 싫어하자.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 온다. 나무가 조용해진다. 니도 좀 조용해 봐라.',
      replies: [
        { say: '썰매 하나 짜 줘', tier: 'great', answer: '얼라들 줄 섰다. 니도 줄 서라. …맨 앞에 서라.' },
        { say: '같이 장작 팰까?', tier: 'good', answer: '좋다. 결 따라 가르는 기다. 손 시리믄 난로 쬐고.' },
        { say: '추워서 못 나가겠어', tier: 'meh', face: 'calm', answer: '난로 옆에 앉아라. 거 내 자리다. …쪼매만 비키 주께.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽부터 머하노. 누나야는 벌써 도끼날 갈고 왔다.',
      replies: [
        { say: '새벽 나무 냄새 맡으러', tier: 'great', answer: ['…니 그거 아는 사람이가.', '이슬 맞은 나무가 향이 젤 진하다. 이. 거. 인. 정.'] },
        { say: '잠이 안 와서', tier: 'good', answer: '그럼 대패 소리 들어라. 사각사각. 금방 졸린다.' },
        { say: '그냥 지나가던 길', tier: 'meh', face: 'calm', answer: '그럼 지나가라. 문 아직 안 열었다. …한 개만 봐라.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 무대 내가 짰다. 튼튼하다. 뛰어도 된다. 니는 살살 뛰라.',
      replies: [
        { say: '무대 진짜 튼튼하더라', tier: 'great', answer: '당연하다. 이 마을 한남들 단체로 뛰어도 안 무너진다.' },
        { say: '같이 구경 가자', tier: 'good', answer: '누나야는 무대 밑에서 다리 점검한다. …끝나고 가 주께.' },
        { say: '떡이나 먹으러 갈래', tier: 'meh', face: 'think', answer: '떡은 좀 주라. 달달한 거 말고 떡만.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me}, 비린내 공방까지 난다. 오늘 {fish} 낚았제?',
      replies: [
        { say: '매운탕 끓여 먹자', tier: 'great', answer: '오. 니 말 잘한다. 고추는 누나야가 넣는다. 마이.' },
        { say: '낚싯대 손잡이 좀 봐줘', tier: 'good', answer: '갖고 온나. 손잡이는 새로 깎아 주께. 미끄럽지 않게.' },
        { say: '냄새 많이 나?', tier: 'meh', face: 'calm', answer: '많이 난다. 손 씻고 온나. 그라고 들어온나.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었다. 엄청난 놈 낚았다메? 마을이 시끄럽더라.',
      replies: [
        { say: '박제 받침 짜 줄래?', tier: 'great', answer: ['…이. 결. 좋. 은. 걸. 로.', '박물관 진열장도 누나야가 짰다. 영광인 줄 알아라.'] },
        { say: '운이 좋았어', tier: 'good', answer: '운도 실력이다. 칭찬 아이다. 그냥 사실이다.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 나왔다메. 그 반짝이는 거 올려 둘 선반 필요하제?',
      replies: [
        { say: '누나야 선반이면 좋지', tier: 'great', answer: '…니 거는 반값이다. 아니 원래 반값이었다. 말하지 마래이.' },
        { say: '그냥 팔 거야', tier: 'good', answer: '그래. 그 돈으로 가구 사라. 정가로. 흥정ㄴㄴ.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙 묻었네. 밭일했나. 니 밭 울타리 꼬라지는 봤나?',
      replies: [
        { say: '고쳐 주면 고맙지', tier: 'great', answer: '츠나데 언니 텃밭 고치고 남은 판자 있다. 내일 간다.' },
        { say: '허리가 아파', tier: 'good', answer: '허리 펴라. 그래 하믄 허리 나간다. 두 번 말 안 한다.' },
        { say: '울타리는 괜찮던데', tier: 'meh', face: 'think', answer: '괜찮기는. 바람 한 번이면 눕는다. 누나야 눈은 정확하다.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴이 와 그래 흐리노. …물어본 거 아이다. 입에서 나온 기다.',
      replies: [
        { say: '그냥 좀 지쳤어', tier: 'great', face: 'smile', answer: ['저 의자 앉아라. 제일 푹신한 기다.', '대패 소리 들으면서 쉬어라. 말 안 걸게.'] },
        { say: '괜찮아. 별거 아니야', tier: 'good', answer: '그래. 그래도 매운 거 한 그릇 묵고 가라. 땀 빼믄 낫다.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '오늘 와 이래 싱글벙글하노. 문틀에 머리 부딪힌다. 숙이라.',
      replies: [
        { say: '누나야 보러 와서', tier: 'great', face: 'shy', answer: '…톱밥 먼지다. 얼굴 빨간 거 아이다. 쳐다보지 마라.' },
        { say: '그냥 기분이 좋아', tier: 'good', answer: '좋을 때 의자 하나 사라. 기분 좋을 때 산 건 오래 간다.' },
        { say: '비밀이야', tier: 'meh', face: 'think', answer: '비밀? 독점ㄴㄴ 나빠요. …말하기 싫으믄 됐다.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}, 오늘 생일이라메. 누나야가 짠 거 있다. 나무 숟가락이다.',
      replies: [
        { say: '고마워. 평생 쓸게', tier: 'great', face: 'shy', answer: '평생 쓰믄 누나야가 평생 고쳐야 되네. …그래, 고쳐 주께.' },
        { say: '숟가락에 이름도 있네?', tier: 'good', face: 'laugh', answer: '내 이름 아이고 니 이름이다. 잘 봐라. 이. 름.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '결혼식 있었다메. 그 집 혼수 장롱 누나야가 짰다. 자랑 아이다.',
      replies: [
        { say: '그 장롱 진짜 멋있더라', tier: 'great', answer: '안다. 백 년 간다. 그 집 손주까지 쓸 끼다.' },
        { say: '부럽다…', tier: 'good', face: 'smile', answer: '부러우믄 니도 해라. 장롱은 누나야가 짜 주께. 정가로.' },
        { say: '결혼은 별로야', tier: 'meh', face: 'calm', answer: '…누나야도 그래 말하고 다녔다. 세상 일 모른다.' },
      ],
    },
    {
      id: 'op-museum',
      when: { news: 'museum' },
      open: '마을 소식 봤나. 박물관 진열장 또 채운다메. 그거 누나야 손이다.',
      replies: [
        { say: '진열장이 제일 볼만하던데', tier: 'great', answer: '니 보는 눈 있네. 유리 말고 나무 테두리 봐라. 그기 진짜다.' },
        { say: '뭐가 들어왔대?', tier: 'good', answer: '몰라도 된다. 진열장이 튼튼하믄 뭐든 들어온다.' },
      ],
    },
    {
      id: 'op-realtor',
      when: { bond: 'realtor' },
      open: '신형만 씨 만났나. 집 확장 공사 또 잡았다메. 누나야 손 하나다.',
      replies: [
        { say: '둘이 동업자라며?', tier: 'great', answer: ['그 사람은 집을 팔고 누나야는 짓는다.', '말은 많아도 계산은 정확하다. 그건 인정.'] },
        { say: '바빠서 힘들겠다', tier: 'good', answer: '누나야 바빠요. 근데 니 방 선반은 따로 봐준다.' },
        { say: '공사 소리 시끄러워', tier: 'meh', face: 'calm', answer: '망치 소리는 노래다. 니 귀가 아직 몬 따라온 기다.' },
      ],
    },
    {
      id: 'op-misun',
      when: { bond: 'misun' },
      open: '봉미선 실장 만났나. 또 공사비 깎아 달라 카더나?',
      replies: [
        { say: '흥정ㄴㄴ라고 전했어', tier: 'great', face: 'laugh', answer: '잘했다! 그 실장한텐 쪼매도 깎아 주믄 끝장이다.' },
        { say: '열심히 사는 분이던데', tier: 'good', face: 'think', answer: '…그건 맞다. 그래서 미워할 수가 없다. 깎아 주지도 않지만.' },
        { say: '쪼매 깎아 주지', tier: 'meh', face: 'calm', answer: '니까지 와 이라노. 독점ㄴㄴ, 흥정ㄴㄴ.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '샹크스 만났나. 또 잔치 한다메? 의자 부서지는 소리가 벌써 들린다.',
      replies: [
        { say: '수리비 미리 받아 둬', tier: 'great', face: 'laugh', answer: '니 천재가? 이번엔 선불이다. 우유로 때우믄 안대요.' },
        { say: '튼튼한 의자 짜 주면 되지', tier: 'good', answer: '짜 줬다. 그 사람들이 의자로 팔씨름을 한다. 우짜노.' },
        { say: '잔치 재밌잖아', tier: 'meh', face: 'calm', answer: '재밌다. 다음 날 누나야 일이 열 배다. 그것도 재밌나?' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '볼리바스 순경 만났나. 오늘도 내 도끼 검문하더라. 어디 안전이라고.',
      replies: [
        { say: '연장이라고 말해 줬어', tier: 'great', answer: ['잘했다! 장식 아이다, 연장이다.', '그 순경 의자도 누나야가 짰는데. 은혜도 모르고.'] },
        { say: '순경 일이니까 그렇지', tier: 'good', face: 'think', answer: '…알지. 그래도 매일은 너무한다. 내일은 도끼 등에 지고 간다.' },
        { say: '도끼 놓고 다니면?', tier: 'meh', face: 'calm', answer: '목수가 연장을 놓고 다니나. 그건 ㄴㄴ.' },
      ],
    },
    {
      id: 'op-ornn',
      when: { bond: 'ornn' },
      open: '{other} 영감 대장간 들렀나. 내 도끼날 또 투덜대면서 벼려 주더라.',
      replies: [
        { say: '투덜대도 솜씨는 최고잖아', tier: 'great', answer: '그건 인정. 그 영감 날 세운 도끼는 통나무가 알아서 갈라진다.' },
        { say: '둘이 투덜대는 거 닮았어', tier: 'good', face: 'laugh', answer: '…닮았다꼬? 감히 그런 소리를. 쪼매 닮긴 했다.' },
        { say: '대장간은 너무 더워', tier: 'meh', face: 'calm', answer: '덥다. 그래서 누나야는 날만 맡기고 바로 나온다.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '잔나 만났나. 그 기자가 우리 가게 또 신문에 올린다 카더라.',
      replies: [
        { say: '바이럴 마이 태아 주던데', tier: 'great', face: 'laugh', answer: '맞다. 누나야가 바이럴 마이 태아줬자나… 아니 잔나가 태아줬다.' },
        { say: '사진은 잘 나왔대?', tier: 'good', answer: '도끼 든 사진이다. 무섭다꼬 했는데 손님은 늘었다. 이상하제.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-hardwood',
      when: { mem: 'hardwood-fan' },
      use: 'hardwood-fan',
      open: '단단한 참나무 좋다 캤제. 오늘 좋은 결 하나 들어왔다. 니한테 먼저 보여 준다.',
      replies: [
        { say: '와, 결이 촘촘하다', tier: 'great', answer: ['보는 눈 있네. 이. 결. 봐. 라.', '이거 아무한테나 안 보여 준다. 니니까 보여 주는 기다.'] },
        { say: '기억하고 있었어?', tier: 'good', face: 'shy', answer: '…기억한 거 아이다. 장부에 적어 놨을 뿐이다.' },
      ],
    },
    {
      id: 'cb-axe',
      when: { mem: 'axe-tool' },
      use: 'axe-tool',
      open: '도끼는 연장이라 캐 준 거, 그 뒤로 누나야가 마을에서 써먹고 다닌다.',
      replies: [
        { say: '잘했어. 연장 맞잖아', tier: 'great', answer: '그래. 니 덕에 말싸움 세 번 이겼다. 고맙다꼬는 안 한다.' },
        { say: '누구랑 싸웠는데?', tier: 'good', face: 'laugh', answer: '볼리바스 순경. 오른 영감. 이 마을 한남들 전부.' },
      ],
    },
    {
      id: 'cb-bouquet',
      when: { mem: 'no-bouquet' },
      use: 'no-bouquet',
      open: '꽃다발보다 화분이 낫다 캤제. 화분 받침 짰다. 가지든가 말든가.',
      replies: [
        { say: '고마워. 창가에 둘게', tier: 'great', face: 'smile', answer: '햇볕 잘 드는 데 둬라. 물 흘리믄 바로 닦고.' },
        { say: '진짜 짜 줬네', tier: 'good', face: 'shy', answer: '자투리로 짠 기다. 버리기 아까버서. …그렇다꼬.' },
      ],
    },
    {
      id: 'cb-fair',
      when: { mem: 'fair-price' },
      use: 'fair-price',
      open: '정가로 산다 캤던 손님. 니 이름 장부 맨 위에 적어 놨다. 실수다.',
      replies: [
        { say: '실수 아닌 거 다 알아', tier: 'great', face: 'shy', answer: '…톱밥 먼지가 눈에 들어갔다. 쳐다보지 마라.' },
        { say: '그럼 할인해 줘', tier: 'good', face: 'laugh', answer: '그 말 하는 순간 장부에서 지운다. …쪼매는 깎아 주께.' },
      ],
    },
    {
      id: 'cb-termite',
      when: { mem: 'termite-lore' },
      use: 'termite-lore',
      open: '흰개미 얘기한 거 아무한테도 안 했제? 누나야 이미지 관리 중이다.',
      replies: [
        { say: '우리 둘만의 비밀이야', tier: 'great', face: 'smile', answer: '…그래. 비밀이다. 니 입이 의자보다 튼튼하네.' },
        { say: '잔나한테 살짝…', tier: 'good', face: 'wow', answer: '감히 누나야 약점을 판단 말이고 지금. …농담이제? 맞제?' },
      ],
    },
    {
      id: 'cb-dream',
      when: { mem: 'chair-dream' },
      use: 'chair-dream',
      open: '마을 의자 다 짜겠다는 꿈 말이다. 오늘 서른 번째 의자 짰다.',
      replies: [
        { say: '대단하다. 계속 응원할게', tier: 'great', answer: ['응원은 됐다 캤제. …받아 둔다. 두 번째다.', '서른한 번째는 아직 비워 놨다. 누구 건지는 비밀이다.'] },
        { say: '하나 앉아 봐도 돼?', tier: 'good', answer: '앉아 봐라. 바르게. 흔들지 말고.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 니 좋아하는 게 {taste}라메. 그거 올려 둘 선반 하나 짜 줄까?',
      replies: [
        { say: '짜 주면 매일 볼게', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '매일 볼 거믄 각 맞게 짜야겠네. 대충은 ㄴㄴ.' },
        { say: '어떻게 알았어?', tier: 'good', remember: 'taste-heard', answer: '마을 수첩에 다 적혀 있다. 누나야 눈은 정확하다.' },
        { say: '선반은 많아', tier: 'meh', remember: 'taste-heard', face: 'calm', answer: '…알았다. 그럼 의자다. 거절은 ㄴㄴ.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-heard' },
      open: '저번에 같이 나무 시찰 다닌 거. …재밌었다꼬는 안 한다. 나쁘진 않았다.',
      replies: [
        { say: '또 같이 가자', tier: 'great', remember: 'outing-heard', face: 'shy', answer: '…따라올 거면 조용히. 다음엔 숲 깊은 데 가자.' },
        { say: '누나야 길 잃었잖아', tier: 'good', remember: 'outing-heard', face: 'laugh', answer: '잃은 거 아이다. 새 나무 찾은 기다. 헷갈리지 마래이.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: '{me}, 곧 생일이라메. 뭐 짜 주까. 의자? 선반? 꽃은 ㄴㄴ.',
      replies: [
        { say: '누나야가 짜 주면 뭐든 좋아', tier: 'great', remember: 'bday-heard', face: 'shy', answer: '…그런 대답이 제일 곤란하다. 다 짜 주께. 됐나.' },
        { say: '작은 나무 상자!', tier: 'good', remember: 'bday-heard', answer: '상자? 좋다. 뚜껑에 니 이름 새겨 주께. 비밀 넣어 둬라.' },
      ],
    },
  ],
  chapters: [
    {
      title: '이. 름. 외. 아. 라.',
      hint: '한 번 이야기를 나누면 발키리가 자기 이름을 외우라고 해요.',
      need: { days: 1 },
      scene: [
        '나무결 가구점. 대패를 밀던 발키리가 고개도 안 들고 말한다.',
        '"니 누고? 손님이믄 손님답게 지갑부터 꺼내라."',
        '"발키리. 나무결 가구점 목수. 이. 름. 외. 아. 라."',
        '도끼를 벽에 걸면서 한 번 더 노려본다.',
        '"가구는 눈으로 봐라. 만지는 건 ㄴㄴ. 흥정도 ㄴㄴ."',
      ],
      replies: [
        { say: '발키리. 외웠어', tier: 'great', answer: ['…맞나. 한 번에 외운 손님은 처음이다.', '칭찬 아이다. 그냥 그렇다꼬.'] },
        { say: '이 의자 얼마야?', tier: 'good', face: 'think', answer: '정가다. 써 붙여 놨다. 깎아 달라 카믄 헐리 가요.' },
        { say: '도끼가 무서워', tier: 'meh', face: 'calm', answer: '장식 아이다, 연장이다. 사람한텐 안 쓴다. 나무한테만 쓴다.' },
      ],
    },
    {
      title: '아침 숲의 나무 시찰',
      hint: '아침 여섯 시부터 열한 시 사이에 숲에 가 보세요. 발키리가 나무 시찰을 한대요.',
      need: { days: 3, points: 20, visit: { area: 'woods', from: 6, to: 11 } },
      scene: [
        '아침 숲. 이슬 맺힌 나무 사이로 도끼를 멘 발키리가 걷고 있다.',
        '"…진짜 왔네. 산책 아이다. 나무 시찰이다. 헷갈리지 마래이."',
        '그녀가 큰 참나무 껍질을 손바닥으로 쓸어 본다.',
        '"이놈은 아직 안 벤다. 백 년은 더 서 있어야 된다."',
        '"좋은 목수는 벨 나무보다 안 벨 나무를 먼저 고르는 기다."',
        '"따라올 거면 조용히 따라와라. 숨소리도 쪼매만."',
      ],
      replies: [
        { say: '이 나무 지켜 줘서 고마워', tier: 'great', remember: 'woods-morning', face: 'shy', answer: '…니가 와 고맙노. 나무가 고마워해야지. 아이다, 됐다.' },
        { say: '숲 냄새 좋다', tier: 'good', remember: 'woods-morning', answer: '백 년 된 나무 냄새다. 숨 크게 쉬어라. 공짜다.' },
        { say: '다리 아파…', tier: 'meh', remember: 'woods-morning', face: 'calm', answer: '저 그루터기에 쪼매 앉아라. 징징대지 말고.' },
      ],
    },
    {
      title: '단단한 나무 한 토막',
      hint: '발키리가 단단한 나무 이야기를 했어요. 단단한 나무 하나를 가지고 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'hardwood', take: true } },
      scene: [
        '단단한 나무를 내밀자 발키리의 손이 멈춘다.',
        '"이. 거. 단. 단. 한. 나. 무. 니 이거 숲 깊은 데서 캤나?"',
        '그녀가 나이테를 손끝으로 하나하나 센다.',
        '"이 결은 거짓말을 안 한다. 비 많이 온 해, 가문 해, 다 보인다."',
        '말없이 칼을 들더니 작은 숟가락 하나를 깎기 시작한다.',
        '"…니 끼다. 남는 토막으로 깎은 기다. 그렇다꼬."',
      ],
      replies: [
        { say: '평생 아껴 쓸게', tier: 'great', remember: 'first-carve', face: 'shy', answer: '평생은 무슨. …삐걱대믄 갖고 온나. 그것도 평생 봐준다.' },
        { say: '손잡이에 무늬가 있네', tier: 'good', remember: 'first-carve', answer: '나뭇결 그대로 살린 기다. 칠은 안 했다. 결이 아까버서.' },
        { say: '숟가락은 많은데', tier: 'meh', remember: 'first-carve', face: 'calm', answer: '그럼 매운탕 묵을 때만 써라. 그건 받아 준다.' },
      ],
    },
    {
      title: '땀 빼는 매운탕',
      hint: '평소에 매운 음식 이야기가 나오면, 매운 거 잘 먹는다고 해 보세요.',
      need: { days: 9, points: 60, mem: 'spicy-pal' },
      scene: [
        '공방 문을 닫은 저녁. 발키리가 큰 냄비를 탁 내려놓는다.',
        '"매운 거 잘 묵는다 캤제. 오늘 그 말 검증한다."',
        '빨간 국물이 끓는다. 고추가 쪼매가 아니라 마이 들어갔다.',
        '"이 마을 한남들은 한 숟갈 묵고 다 도망갔다."',
        '둘이서 말없이 땀을 뻘뻘 흘리며 한 그릇을 비운다.',
        '"…니는 안 도망가네. 누나야 쪼매 놀랐다."',
      ],
      replies: [
        { say: '한 그릇 더!', tier: 'great', remember: 'spicy-night', face: 'laugh', answer: ['진짜가? 이. 거. 인. 정.', '다음엔 더 맵게 끓인다. 도망가믄 안대요.'] },
        { say: '맵지만 맛있어', tier: 'good', remember: 'spicy-night', face: 'smile', answer: '땀 빼고 나믄 머리가 맑다. 니도 알게 됐제.' },
        { say: '물… 물 좀…', tier: 'meh', remember: 'spicy-night', face: 'laugh', answer: '물 마시믄 더 맵다. 밥 묵어라. 됐다, 잘 버텼다.' },
      ],
    },
    {
      title: '판정 보류',
      hint: '발키리와 아주 가까워지면 그녀가 한 가지 판정을 바꿔요. 그 뒤엔 꽃다발 이야기도 달라질지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 밤 공방. 발키리가 대패를 내려놓고 한참 말이 없다.',
        '"{me}. 누나야가 한남 싫다 캤제. 그건 아직도 맞다."',
        '"근데 니 오면 대패가 멈춘다. 손이 와 이라노 진짜."',
        '그녀가 얼굴을 손등으로 문지른다. "…톱밥 먼지다."',
        '"꽃다발 들고 오는 한남이 젤 싫다 캤는데… 니는 생각해 보께."',
        '"생각만 해 본다꼬. 들고 온다꼬 다 받는 거 아이다."',
      ],
      replies: [
        { say: '그럼 언젠가 들고 올게', tier: 'great', face: 'shy', answer: ['…어디 안전이라고. 아이다, 그 말 아이다.', '오믄 받아 볼 수도 있다. 쪼. 매.'] },
        { say: '톱밥 먼지 맞아?', tier: 'good', face: 'shy', answer: '맞다. 맞다꼬. 쳐다보지 마라. …웃어도 된다.' },
        { say: '화분이 더 낫지 않아?', tier: 'meh', face: 'think', answer: '…그건 그렇다. 근데 오늘은 꽃 얘기를 하고 싶었다.' },
      ],
    },
    {
      title: '이름 새긴 의자',
      hint: '발키리와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '공방 한가운데 천을 덮은 무언가가 있다. 발키리가 천을 걷는다.',
        '"{me}. 니 이름 새긴 의자다. 앉아 봐라. 빨리. 부끄럽다꼬."',
        '"이건 시작이다. 장롱, 식탁, 의자 하나 더. 평생 쓸 가구 한 세트."',
        '"혼수란 말 아이다. …맞다. 혼수다. 됐나."',
        '"내가 한남이랑 연애를 하다니 했는데, 이젠 그 다음 생각까지 한다."',
        '"반지는 누나야가 몬 짠다. 그건 니가 알아서 해라."',
      ],
      replies: [
        { say: '의자 두 개 나란히 놓자', tier: 'great', remember: 'chair-promise', face: 'shy', answer: ['…두 번째 의자는 벌써 반 짰다.', '느그 엄마 전화번호대라. 인사는 드리야 될 거 아이가.'] },
        { say: '반지는 내가 준비할게', tier: 'good', remember: 'chair-promise', face: 'laugh', answer: '각 맞는 걸로 해라. 누나야 손가락 굵다꼬 놀리믄 안대요.' },
        { say: '아직은 천천히', tier: 'meh', remember: 'chair-promise', face: 'smile', answer: '서두르믄 가구도 삐걱댄다. 천천히 짜자. 대신 끝까지.' },
      ],
    },
  ],
  after: [
    '오늘 말 마이 했다. 내일 온나.',
    '누나야 입 아프다. 독점ㄴㄴ 나빠요.',
    '할 말 다 했다. 헐리 가요. …조심히 가고.',
    '또 왔나. 대패 소리나 듣고 가라. 말은 내일.',
    '가라. 또 온나. 아 오지 마라. …온나.',
  ],
};
