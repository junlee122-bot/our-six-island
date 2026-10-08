// 미쿠 — 별빛 카지노 딜러이자 노래하는 버추얼 가수. 밝고 통통 튀는 반말, 카드는
// 박자에 맞춰 돌리고 칩은 메트로놈처럼 센다. 파를 좋아하고, 서른아홉은 "삼구,
// 땡큐". 무대·리허설·흥얼거림, 청록 트윈테일. 더 걸라는 말은 절대 안 한다.
// 예림이·미스 포츈은 언니. 원작 가사나 대사는 쓰지 않고 분위기만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const LUMI_TALK: NpcTalkBook = {
  npc: 'lumi',
  memories: {
    'sing-along': '노래를 같이 부르자고 했어요',
    'listen-only': '노래는 듣는 쪽이 좋다고 했어요',
    'leek-fan': '파를 좋아한다고 했어요',
    'sweet-drink': '달콤한 음료를 좋아한다고 했어요',
    'flower-cafe': '꽃 핀 카페에 같이 가기로 했어요',
    'stage-fright': '무대가 떨린다는 이야기를 들었어요',
    'first-fan': '첫 번째 팬이 되겠다고 했어요',
    'no-bet': '무리하게 걸지 않겠다고 약속했어요',
    'dance-rhythm': '박자에 맞춰 걷는 법을 배웠어요',
    'compose-help': '새 노래 가사를 같이 쓰기로 했어요',
    'teal-hair': '트윈테일이 예쁘다고 했어요',
    'night-sky': '밤하늘 노래 이야기를 들었어요',
    'plaza-stage': '광장 무대에서 노래를 들었어요',
    'strawberry': '딸기 한 바구니를 함께 나눴어요',
    'encore-promise': '앙코르를 약속했어요',
    'lyric-done': '노래 첫 줄을 함께 지었어요',
    'taste-heard': '내 취향을 노래로 불러 줬어요',
    'outing-talk': '함께 걸은 박자를 이야기했어요',
    'bday-plan': '생일 축하 노래를 약속했어요',
  },
  talks: [
    {
      id: 'sing-or-listen',
      open: '{me}! 노래는 부르는 게 좋아, 듣는 게 좋아? 난 둘 다!',
      replies: [
        { say: '같이 부르는 게 제일!', tier: 'great', remember: 'sing-along', answer: '꺄, 최고! 그럼 오늘 퇴근길에 한 소절씩 주고받자. 약속!' },
        { say: '난 듣는 쪽', tier: 'good', remember: 'listen-only', answer: '좋아! 관객이 있어야 무대가 완성되거든. 맨 앞자리 줄게.' },
        { say: '노래는 잘 몰라', tier: 'meh', face: 'calm', answer: '괜찮아! 박수만 쳐도 음악이야. 짝, 짝. 봐, 벌써 잘하잖아.' },
      ],
    },
    {
      id: 'leek',
      open: '비밀 하나 알려 줄까? 나 파 진짜 좋아해. 이상해?',
      replies: [
        { say: '나도 파 좋아!', tier: 'great', remember: 'leek-fan', face: 'wow', answer: '진짜?! 파 동맹 결성! 장날에 같이 한 단씩 메고 다니자.' },
        { say: '파전이라면 좋지', tier: 'good', answer: '파전 최고지! 파가 두껍게 들어간 걸로. 예림 언니 부침개 맛있어.' },
        { say: '파는 좀 매워', tier: 'meh', face: 'sorry', answer: '에이, 익히면 달아지는데. 언젠가 파의 진가를 알려 줄게.' },
      ],
    },
    {
      id: 'sweet',
      open: '출근 전에 마실 거 고르는 중이야. 딸기 우유, 꽃차, 아이스 커피!',
      replies: [
        { say: '딸기 우유!', tier: 'great', remember: 'sweet-drink', answer: '역시! 목도 부드러워지고 기분도 핑크색 돼. 삼구, 아니 땡큐!' },
        { say: '꽃차가 목에 좋대', tier: 'good', answer: '오, 똑똑해. 노래하는 사람한텐 꽃차가 보약이래. 오늘은 꽃차.' },
        { say: '커피!', tier: 'meh', face: 'think', answer: '커피는 목이 말라서… 딜러 일 끝나면 한 잔 할게.' },
      ],
    },
    {
      id: 'no-bet',
      open: '{me}, 하나만 약속해 줘. 내 테이블에서 무리하게 걸지 않기. 응?',
      replies: [
        { say: '약속할게', tier: 'great', remember: 'no-bet', face: 'smile', answer: '고마워! 그 약속이 오늘 들은 노래 중에 제일 좋은 노래야.' },
        { say: '오늘은 운이 좋은데?', tier: 'meh', face: 'sorry', answer: '운은 박자랑 같아. 잘 맞다가 갑자기 엇나가. 조심해 줘, 응?' },
        { say: '왜 그런 말을 해?', tier: 'good', answer: '딜러는 이겨도 안 기뻐. 손님이 웃으면서 나가는 게 내 박수 소리야.' },
      ],
    },
    {
      id: 'stage-fright',
      open: '있잖아, 무대에 서기 전에 손이 떨려. 아무도 안 믿지만 진짜야.',
      replies: [
        { say: '떨리는 게 진심이라 그래', tier: 'great', remember: 'stage-fright', face: 'shy', answer: '…그런가? 그럼 떨려도 괜찮겠다. 다음 무대 때 그 말 떠올릴게.' },
        { say: '미쿠도 떨려?', tier: 'good', face: 'laugh', answer: '엄청! 근데 첫 소절만 넘기면 괜찮아. 그 첫 소절이 어렵지.' },
        { say: '그냥 하면 되잖아', tier: 'meh', face: 'calm', answer: '그치… 그냥 하면 되지. 말은 쉬운데. 헤헤.' },
      ],
    },
    {
      id: 'first-fan',
      open: '언젠가 큰 무대에 서는 게 꿈이야. 그때 누가 와 줄까?',
      replies: [
        { say: '내가 첫 번째 팬이야', tier: 'great', remember: 'first-fan', face: 'wow', answer: '…진짜? 그럼 응원봉 청록색으로 맞춰 와! 객석에서 제일 먼저 찾을 거야.' },
        { say: '마을 사람 다 오겠지', tier: 'good', answer: '그럼 좋겠다! 선장님은 박수를 너무 크게 쳐서 박자 깨질 것 같지만.' },
        { say: '꿈이 크네', tier: 'meh', face: 'smile', answer: '응! 크게 꿔야 반이라도 이루지. 반이면 광장 무대 정도?' },
      ],
    },
    {
      id: 'rhythm-walk',
      open: '걸을 때도 박자가 있어. 왼발, 오른발, 쿵짝. 너도 해 볼래?',
      replies: [
        { say: '쿵짝, 쿵짝!', tier: 'great', remember: 'dance-rhythm', face: 'laugh', answer: '완벽해! 너 리듬감 있다. 다음엔 쿵짝짝 삼박자 가 보자.' },
        { say: '부끄러워', tier: 'good', face: 'shy', answer: '나도 처음엔 그랬어. 아무도 안 볼 때 연습해. 나만 볼게.' },
        { say: '그냥 걸을래', tier: 'meh', answer: '그것도 박자야. 느린 발라드 걸음. 나쁘지 않아.' },
      ],
    },
    {
      id: 'twin-tail',
      open: '오늘 트윈테일 묶는 데 삼십 분 걸렸어. 티 나? 티 나야 하는데!',
      replies: [
        { say: '청록색이 반짝반짝해', tier: 'great', remember: 'teal-hair', face: 'shy', answer: '헤헤, 알아봐 줬다! 오늘 하루 행운 칩 하나 적립!' },
        { say: '무겁지 않아?', tier: 'good', answer: '무거워! 근데 무대에서 돌 때 휘날리는 게 좋아서 못 잘라.' },
        { say: '잘 모르겠는데', tier: 'meh', face: 'sorry', answer: '에엥, 삼십 분인데… 괜찮아, 내일은 더 반짝이게 하고 올게.' },
      ],
    },
    {
      id: 'night-sky',
      open: '퇴근할 때 하늘 보면 별이 음표처럼 보여. 이상한 말이지?',
      replies: [
        { say: '무슨 노래가 들려?', tier: 'great', remember: 'night-sky', face: 'wow', answer: '음… 느린 왈츠! 별 세 개씩 묶으면 한 마디야. 들려줄까? 흠흠.' },
        { say: '하나도 안 이상해', tier: 'good', face: 'smile', answer: '고마워. 이상하다는 말 많이 들었거든. 너는 다르네.' },
        { say: '별은 그냥 별이지', tier: 'meh', face: 'calm', answer: '그치, 별은 별이지. 근데 별도 가끔 노래하고 싶을걸?' },
      ],
    },
    {
      id: 'compose',
      open: '새 노래 쓰는 중인데 가사가 안 나와. {me}, 한 줄만 줘 볼래?',
      replies: [
        { say: '같이 써 보자', tier: 'great', remember: 'compose-help', face: 'wow', answer: '진짜?! 그럼 첫 줄은 네 거. 마음에 드는 말 떠오르면 언제든 알려 줘!' },
        { say: '파가 좋아 파파파', tier: 'good', face: 'laugh', answer: '하하하! 그거 후렴으로 쓸래! 중독성 최고야.' },
        { say: '가사는 어려워', tier: 'meh', answer: '그치… 그럼 흥얼거리기만 해 줘. 음만 있어도 반은 된 거야.' },
      ],
    },
    {
      id: 'flower-cafe',
      open: '쉬는 날엔 꽃 핀 카페를 찾아다녀. 아직 못 가 본 데가 많아.',
      replies: [
        { say: '같이 찾으러 가자', tier: 'great', remember: 'flower-cafe', face: 'smile', answer: '좋아! 지도에 동그라미 쳐 둘게. 딸기 우유 맛있는 데부터.' },
        { say: '빵집 카페 가 봤어?', tier: 'good', answer: '프리렌 씨네! 거기 빵 가끔 탔는데 그게 또 맛있어.' },
        { say: '카페는 비싸', tier: 'meh', face: 'think', answer: '음, 맞아. 그럼 꽃밭에서 도시락 먹는 건 어때? 공짜야.' },
      ],
    },
    {
      id: 'dealer-face',
      open: '딜러는 표정이 없어야 한대. 근데 나 자꾸 웃음이 새. 혼날까?',
      replies: [
        { say: '웃는 딜러가 좋아', tier: 'great', face: 'laugh', answer: '그치?! 미스 포츈 언니한테도 그렇게 말해 줘. 맨날 표정 관리하래.' },
        { say: '조금만 참아 봐', tier: 'good', face: 'think', answer: '음… 해 볼게. 대신 카드 섞을 때만. 그때는 진지해.' },
        { say: '혼나겠다', tier: 'meh', face: 'sorry', answer: '으앙, 그런 말 하지 마. 벌써 세 번 혼났단 말이야.' },
      ],
    },
    {
      id: 'duet-hint',
      when: { ch: 3 },
      open: '{me}, 듀엣 곡 하나 연습 중이야. 상대 파트가 비어 있는데… 누가 좋을까?',
      replies: [
        { say: '내가 할게', tier: 'great', face: 'shy', answer: '…헤헤, 그 말 기다렸어. 음 틀려도 돼. 같이 부르는 게 중요하니까.' },
        { say: '보치 어때?', tier: 'good', answer: '보치 기타는 최고지! 근데 노래는 숨어서 부른대. 그래서 고민이야.' },
        { say: '혼자 불러도 되잖아', tier: 'meh', face: 'calm', answer: '그치. 근데 이 곡은 둘이 불러야 완성돼. 천천히 찾을게.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '빗소리 들려? 툭, 툭, 투둑. 오늘 반주는 하늘이 깔아 주네!',
      replies: [
        { say: '그 박자에 맞춰 불러 줘', tier: 'great', answer: '좋아! 흠흠, 비 오는 날의 노래… 앗, 가사는 아직이야. 헤헤.' },
        { say: '우산은 챙겼어?', tier: 'good', answer: '트윈테일이 젖으면 무거워져서 꼭 챙겨! 오늘은 청록 우산.' },
        { say: '비 오면 우울해', tier: 'meh', face: 'sorry', answer: '그럼 내가 밝은 노래 불러 줄게. 빗소리보다 크게!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 오는 밤엔 소리가 다 묻혀. 내 흥얼거림만 동그랗게 남아.',
      replies: [
        { say: '그 흥얼거림 듣고 싶어', tier: 'great', face: 'shy', answer: '…그럼 작게 불러 줄게. 눈 녹기 전까지만 들리는 노래야.' },
        { say: '추워서 목 아프겠다', tier: 'good', answer: '그래서 목도리 꽁꽁! 꽃차도 두 잔째야. 걱정해 줘서 땡큐!' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '조명 켜지기 직전이야! 막 오르기 전 이 순간이 제일 두근거려.',
      replies: [
        { say: '오늘 무대도 응원할게', tier: 'great', answer: '그 말이면 충분해! 첫 카드 돌릴 때 너 쪽 한 번 볼게.' },
        { say: '떨려?', tier: 'good', face: 'shy', answer: '조금. 근데 이 떨림이 없으면 재미없어. 무대니까.' },
        { say: '난 이제 집에 갈래', tier: 'meh', face: 'calm', answer: '응, 조심히 가! 앙코르는 다음에 들려줄게.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 광장에 무대 섰대. 한 곡 신청할까 말까 고민 중이야!',
      replies: [
        { say: '무조건 신청해!', tier: 'great', face: 'laugh', answer: '좋아, 결정! 맨 앞에서 청록 응원 해 줘야 해. 약속!' },
        { say: '같이 구경 가자', tier: 'good', answer: '그것도 좋다! 남의 무대 보는 것도 공부야.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me}, 오늘 {fish} 낚았다며? 낚싯줄 감는 소리도 리듬 있지 않아?',
      replies: [
        { say: '촤르륵, 탁!', tier: 'great', face: 'laugh', answer: '그거! 완전 드럼 소리야. 다음 노래 간주에 넣을래.' },
        { say: '힘들었어', tier: 'good', answer: '수고했어! 그럼 오늘은 느린 노래로 쉬게 해 줄게.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 나왔다며?! 반짝반짝, 무대 조명 같아!',
      replies: [
        { say: '미쿠 테이블에 장식해 줄까?', tier: 'great', face: 'wow', answer: '진짜?! 그럼 오늘 테이블은 금빛 무대다! 삼구, 땡큐!' },
        { say: '팔아서 부자 될 거야', tier: 'good', face: 'laugh', answer: '헤헤, 그것도 좋지! 그래도 카지노에서 다 쓰지는 마. 약속.' },
      ],
    },
    {
      id: 'op-bocchi',
      when: { bond: 'bocchi' },
      open: '보치 만났어? 오늘 공연 몇 시래? 나 박수 치러 가야 해!',
      replies: [
        { say: '저녁에 한대', tier: 'great', answer: '좋아, 퇴근하자마자 갈게! 맨 앞에서 박수 치면 보치가 숨을까 봐 중간쯤.' },
        { say: '둘이 친해?', tier: 'good', face: 'smile', answer: '응! 보치 기타 소리 정말 좋아. 근데 칭찬하면 기타 뒤로 숨어.' },
      ],
    },
    {
      id: 'op-maehwa',
      when: { bond: 'maehwa' },
      open: '예림 언니 만났구나! 언니가 오늘 퇴근길에 나 기다려 준대. 헤헤.',
      replies: [
        { say: '둘이 무슨 얘기 해?', tier: 'good', face: 'shy', answer: '그건… 비밀! 여자들끼리 하는 이야기야. 너 얘기는 안 해. 아마도.' },
        { say: '언니가 미쿠 많이 아끼더라', tier: 'great', face: 'smile', answer: '진짜? 언니는 그런 말 직접 안 하거든. 알려 줘서 땡큐!' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '이번 주에 테이블에서 좀 땄다며? 축하해! …근데 오늘은 쉬는 거다?',
      replies: [
        { say: '응, 오늘은 쉴게', tier: 'great', remember: 'no-bet', face: 'smile', answer: '최고야! 기분 좋을 때 멈추는 사람이 진짜 고수래.' },
        { say: '한 판만 더!', tier: 'meh', face: 'sorry', answer: '으음… 한 판이 두 판 되는 거 알지? 딜러로서 말리는 거야.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 표정이 단조야. 무슨 일 있어? 장조로 바꿔 줄까?',
      replies: [
        { say: '노래 하나만 불러 줘', tier: 'great', face: 'smile', answer: '좋아. 아주 작게, 너만 들리게. 흠흠… 어때, 조금 밝아졌어?' },
        { say: '그냥 피곤해', tier: 'good', answer: '그럼 자장가 버전으로. 오늘은 일찍 자. 내일은 장조로 시작하자.' },
      ],
    },
    {
      id: 'op-birthday-news',
      when: { news: 'birthday' },
      open: '오늘 생일인 친구 있다며! 축하 노래 준비해야지. 화음 넣어 줄래?',
      replies: [
        { say: '내가 화음 할게!', tier: 'great', face: 'laugh', answer: '좋아! 너 낮은 음, 나 높은 음. 광장에서 깜짝 공연이다!' },
        { say: '박수는 칠게', tier: 'good', answer: '박수도 화음이야! 크게 쳐 줘.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-leek',
      when: { mem: 'leek-fan' },
      use: 'leek-fan',
      open: '파 동맹! 오늘 장터에 파가 엄청 싱싱하대. 같이 가자고 하려고 기다렸어.',
      replies: [
        { say: '한 단씩 메고 가자', tier: 'great', face: 'laugh', answer: '좋아! 어깨에 파, 입에는 노래. 완벽한 하루다!' },
        { say: '기억하고 있었어?', tier: 'good', face: 'shy', answer: '당연하지! 파 좋아하는 사람은 귀하거든.' },
      ],
    },
    {
      id: 'cb-sing',
      when: { mem: 'sing-along' },
      use: 'sing-along',
      open: '같이 부르자고 했던 거 기억나? 오늘 퇴근길에 한 소절씩 주고받자!',
      replies: [
        { say: '먼저 시작해!', tier: 'great', face: 'laugh', answer: '라라라… 이제 네 차례! 틀려도 돼, 크게!' },
        { say: '음치인데 괜찮아?', tier: 'good', answer: '음치는 없어. 자기 음이 있을 뿐이야. 그게 내 철학!' },
      ],
    },
    {
      id: 'cb-fright',
      when: { mem: 'stage-fright' },
      use: 'stage-fright',
      open: '어제 무대 섰을 때 손 떨렸는데, 네 말 생각났어. 진심이라 떨리는 거라고.',
      replies: [
        { say: '그래서 어땠어?', tier: 'great', face: 'smile', answer: '첫 소절 무사 통과! 떨림도 노래에 섞였는데 그게 더 좋았대.' },
        { say: '내 말이 맞지?', tier: 'good', face: 'laugh', answer: '응! 이제 무대 전에 주문처럼 외워. 진심이라 떨린다, 진심이라 떨린다.' },
      ],
    },
    {
      id: 'cb-compose',
      when: { mem: 'compose-help', noMem: 'lyric-done' },
      open: '같이 쓰기로 한 노래 말이야. 첫 줄 생각났어? 난 멜로디 다 만들었어!',
      replies: [
        { say: '오늘의 너에게', tier: 'great', remember: 'lyric-done', face: 'wow', answer: '…좋다. 오늘의 너에게. 그 다음은 내가 이을게. 완성되면 제일 먼저 들려줄게!' },
        { say: '아직 고민 중이야', tier: 'good', remember: 'lyric-done', answer: '천천히 해! 좋은 가사는 늦게 와. 기다리는 것도 리듬이야.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 그거로 짧은 노래 하나 만들어 봤어!',
      replies: [
        { say: '불러 줘!', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: '흠흠… 좋아하는 걸 좋아하는 너가 좋아~ 헤헤, 아직 일 절뿐이야.' },
        { say: '부끄러운데', tier: 'good', remember: 'taste-heard', face: 'shy', answer: '헤헤, 그럼 너 없을 때만 부를게. 아니다, 있을 때 부를래.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸었던 날, 우리 발소리가 딱 사분의 사 박자였던 거 알아?',
      replies: [
        { say: '그래서 그렇게 즐거웠구나', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '그치?! 박자가 맞는 사람은 드물어. 다음에도 같이 걷자.' },
        { say: '네가 계속 흥얼거렸잖아', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '들켰다! 너랑 걸으면 노래가 저절로 나와. 어쩔 수 없어.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일이지?! 축하 노래 준비해야지. 신나는 거, 잔잔한 거?',
      replies: [
        { say: '미쿠가 부르는 거면 다 좋아', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '…그런 말 하면 반칙이야. 그럼 둘 다 준비할게. 이 절짜리!' },
        { say: '신나는 걸로!', tier: 'good', remember: 'bday-plan', face: 'laugh', answer: '좋아! 박수 치는 부분도 넣을게. 다 같이 쿵짝!' },
      ],
    },
    {
      id: 'cb-nobet',
      when: { mem: 'no-bet', recent: 'casinoLose' },
      use: 'no-bet',
      open: '이번 주에 좀 잃었다며… 무리 안 하기로 했잖아. 괜찮아?',
      replies: [
        { say: '미안. 이제 멈출게', tier: 'great', face: 'smile', answer: '응. 그 말이면 됐어. 오늘은 노래나 듣고 가. 공짜야.' },
        { say: '조금밖에 안 잃었어', tier: 'good', face: 'think', answer: '조금이 쌓이면 큰 노래가 돼. 슬픈 노래. 그건 부르기 싫어.' },
      ],
    },
  ],
  chapters: [
    {
      title: '첫 소절',
      hint: '한 번 이야기를 나누면 미쿠가 새 노래의 첫 소절을 들려줘요.',
      need: { days: 1 },
      scene: [
        '미쿠가 카드 섞던 손을 멈추고 주위를 두리번거린다.',
        '"…아무도 없지? 지금 떠오른 멜로디가 있어. 까먹기 전에 들려줄게."',
        '그녀가 작게 흥얼거린다. 칩 쌓는 소리가 박자를 맞춰 준다.',
        '"어때? 아직 제목도 없어. 네가 처음 들은 사람이야."',
      ],
      replies: [
        { say: '제목은 첫 소절로 하자', tier: 'great', face: 'wow', answer: '첫 소절! 좋다, 그걸로 할래. 너는 오늘부터 이 노래 작명가야.' },
        { say: '좋다! 또 불러 줘', tier: 'good', face: 'laugh', answer: '앙코르는 다음에! 대신 계속 다듬어 둘게.' },
        { say: '잘 모르겠어', tier: 'meh', face: 'calm', answer: '괜찮아. 노래는 몇 번 들어야 좋아지는 거야. 또 들려줄게.' },
      ],
    },
    {
      title: '광장의 작은 무대',
      hint: '밤(게임 시각 저녁 일곱 시부터 열한 시) 마을 광장에 가 보세요. 미쿠가 몰래 노래한대요.',
      need: { days: 3, points: 20, visit: { area: 'village', from: 19, to: 23 } },
      scene: [
        '광장 분수 옆, 미쿠가 빈 나무 상자 위에 올라서 있다.',
        '"앗, 왔다! 관객 한 명. 충분해!"',
        '그녀가 상자 위에서 한 바퀴 돈다. 트윈테일이 분수 물보라에 반짝인다.',
        '"카지노 무대는 일이고, 여기는 그냥 내가 좋아서 부르는 데야."',
        '"그러니까 오늘은 박수 대신 같이 흥얼거려 줘."',
      ],
      replies: [
        { say: '같이 흥얼거릴게', tier: 'great', remember: 'plaza-stage', face: 'laugh', answer: '최고야! 분수 소리, 너, 나. 삼중창이다!' },
        { say: '박수는 쳐도 되지?', tier: 'good', remember: 'plaza-stage', face: 'smile', answer: '헤헤, 그럼 박수는 마지막에! 크게!' },
        { say: '추운데 들어가자', tier: 'meh', remember: 'plaza-stage', answer: '앗, 그러네. 한 곡만 더 하고! 진짜 한 곡만.' },
      ],
    },
    {
      title: '딸기 한 바구니',
      hint: '미쿠가 딸기 이야기를 했어요. 딸기를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'strawberry', take: true } },
      scene: [
        '딸기를 내밀자 미쿠가 두 손을 모은다.',
        '"딸기다! 어떻게 알았어? 딸기 우유의 원재료!"',
        '그녀가 한 알을 집어 불빛에 비춰 본다.',
        '"있잖아, 이거 먹으면 목소리가 달콤해지는 기분이 들어. 진짜는 아니겠지만."',
        '"반 나눠 먹자. 혼자 먹으면 맛이 반이야."',
      ],
      replies: [
        { say: '그럼 둘이 먹으면 두 배네', tier: 'great', remember: 'strawberry', face: 'laugh', answer: '그 계산 마음에 들어! 박자로 치면 이분음표 두 개야.' },
        { say: '다 먹어도 돼', tier: 'good', remember: 'strawberry', face: 'shy', answer: '안 돼, 같이 먹어야 해. 노래도 딸기도 나눠야 맛있어.' },
        { say: '딸기 별로야', tier: 'meh', remember: 'strawberry', face: 'wow', answer: '에엥?! 그럼 왜… 아, 나 주려고? 헤헤, 땡큐.' },
      ],
    },
    {
      title: '너에게 쓰는 노래',
      hint: '미쿠와 새 노래 가사를 같이 쓰기로 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'compose-help' },
      scene: [
        '미쿠가 악보 한 장을 내민다. 군데군데 지운 흔적이 있다.',
        '"같이 쓰기로 한 노래, 다 됐어. 근데 마지막 줄이 비어 있어."',
        '"사실 이 노래, 처음부터 누구한테 주려고 쓴 거야."',
        '"…그 사람이 마지막 줄을 써 줬으면 해서."',
        '그녀가 펜을 건넨다. 손끝이 조금 떨린다.',
      ],
      replies: [
        { say: '고마워. 또 듣고 싶어', tier: 'great', face: 'shy', answer: '…응. 이 노래는 너 앞에서만 부를게. 다른 무대에선 안 불러.' },
        { say: '누구한테 주려고?', tier: 'good', face: 'laugh', answer: '헤헤, 그걸 물어? 펜 들고 있는 사람한테지!' },
        { say: '난 가사 못 써', tier: 'meh', face: 'calm', answer: '괜찮아. 그럼 그냥 이름 써. 그걸로 완성이야.' },
      ],
    },
    {
      title: '앙코르',
      hint: '미쿠와 아주 가까워지면 그녀가 무대가 끝난 뒤의 이야기를 들려줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '공연이 끝난 카지노. 조명이 하나씩 꺼진다.',
        '"무대 끝나면 늘 좀 외로워. 박수가 끝나고 조용해질 때."',
        '"근데 요즘은 안 그래. 끝나고 나면 네가 있으니까."',
        '미쿠가 꺼진 조명 아래에서 웃는다.',
        '"앙코르 하나만 할게. 관객은 너 하나야."',
      ],
      replies: [
        { say: '앙코르! 앙코르!', tier: 'great', remember: 'encore-promise', face: 'laugh', answer: '헤헤… 꽃다발이라도 있으면 진짜 무대 같을 텐데. 아, 아무 말도 안 했어!' },
        { say: '외로울 땐 불러', tier: 'good', remember: 'encore-promise', face: 'shy', answer: '…응. 이제 박수 끝나도 안 무서워.' },
        { say: '피곤해 보여', tier: 'meh', remember: 'encore-promise', face: 'calm', answer: '조금. 그래도 이 노래는 꼭 하고 갈래.' },
      ],
    },
    {
      title: '듀엣',
      hint: '미쿠와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '미쿠가 마이크 두 개를 들고 나타난다.',
        '"비어 있던 듀엣 파트, 이제 주인 찾았어."',
        '"음 틀려도 돼. 박자 놓쳐도 돼. 내가 맞출게."',
        '"이 노래는 둘이어야 끝까지 부를 수 있거든."',
      ],
      replies: [
        { say: '끝까지 같이 부르자', tier: 'great', face: 'laugh', answer: '응! 이 노래는 끝이 없는 걸로 할래. 계속 계속 부르자.' },
        { say: '음치라도 괜찮아?', tier: 'good', face: 'shy', answer: '너라서 괜찮아. 네 음이 내 음이야.' },
        { say: '부끄러운데', tier: 'meh', face: 'smile', answer: '헤헤, 그럼 작게. 둘만 들리게.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 했잖아! 그래도 또 와 줘서 땡큐!',
    '흠흠, 오늘의 노래는 끝! 내일 새 곡 들려줄게.',
    '앙코르는 내일 무대에서! 약속.',
    '삼구! 아니 땡큐! 또 와.',
  ],
};
