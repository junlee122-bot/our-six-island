// 예림이 — 범마을 회관 화투방 마담. 느긋하고 낮게 깔리는 반말("~거든", "~잖니",
// "~지?", 가끔 "자기"). 판과 사람을 한눈에 읽고, 돈과 의리는 차갑게 셈하고,
// 차와 집밥은 따뜻하게. 광·비광·쌍피·고/스톱·밑장 같은 판 말을 섞는다. 밑장
// 빼는 사람은 질색, 정직하게 치는 사람은 은근히 감싼다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const MAEHWA_TALK: NpcTalkBook = {
  npc: 'maehwa',
  memories: {
    'honest-hand': '정직하게 치는 게 좋다고 했어요',
    'go-player': '늘 고를 외치는 쪽이라고 했어요',
    'stop-player': '적당히 멈출 줄 안다고 했어요',
    'tea-lover': '차를 좋아한다고 했어요',
    'homecook': '집밥이 제일이라고 했어요',
    'rain-pancake': '비 오는 날 부침개를 같이 먹기로 했어요',
    'bi-gwang': '비광에 정이 간다고 했어요',
    'face-read': '얼굴을 읽혀 봤어요',
    'secret-kept': '비밀 하나를 지켜 주기로 했어요',
    'learn-hwatu': '화투를 배우고 싶다고 했어요',
    'songpyeon': '송편을 같이 빚자고 했어요',
    'night-stall': '시장 거리 포장마차에서 한잔했어요',
    'flower-tea': '꽃차를 대접했어요',
    'last-hand': '마지막 패 이야기를 들었어요',
    'quiet-win': '조용히 이기는 게 멋있다고 했어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일상 이야기를 나눴어요',
    'date-talk': '데이트한 날을 이야기했어요',
  },
  talks: [
    {
      id: 'go-or-stop',
      open: '{me}, 하나 묻자. 판이 잘 풀릴 때 너는 고야, 스톱이야?',
      replies: [
        { say: '멈출 때를 아는 게 실력이지', tier: 'great', remember: 'stop-player', answer: '…괜찮네. 그 말 할 줄 아는 사람, 이 회관에 셋도 안 돼.' },
        { say: '당연히 고!', tier: 'good', remember: 'go-player', face: 'laugh', answer: '후후, 시원하다. 근데 자기, 세 번째 고부터는 내가 말린다?' },
        { say: '화투 잘 몰라', tier: 'meh', face: 'calm', answer: '모르면 구경부터 해. 판 보는 눈이 먼저 생겨야 손도 따라오거든.' },
      ],
    },
    {
      id: 'honest',
      open: '오늘도 밑장 빼다 걸린 손님이 있었어. 넌 그런 거 어떻게 생각하니?',
      replies: [
        { say: '지더라도 정직하게 치는 게 좋아', tier: 'great', remember: 'honest-hand', face: 'smile', answer: '…그래. 그런 사람 손은 내가 안 놔. 기억해 둘게.' },
        { say: '안 걸리면 실력 아냐?', tier: 'meh', face: 'think', answer: '후후, 그 말 회관 밖에서만 해. 내 앞에선 다 보이거든.' },
        { say: '걸리면 어떻게 돼?', tier: 'good', answer: '판에서 빠지지. 영원히. 내 판은 사람을 두 번 안 받아.' },
      ],
    },
    {
      id: 'tea',
      open: '차 우렸어. 보리차, 유자차, 국화차. 뭐 마실래?',
      replies: [
        { say: '언니가 골라 줘', tier: 'great', remember: 'tea-lover', face: 'smile', answer: '…얼굴 보니 오늘은 국화차네. 마음이 좀 뜨겁거든, 자기.' },
        { say: '유자차!', tier: 'good', remember: 'tea-lover', answer: '단 거 좋아하는구나. 꿀 한 숟갈 더 넣어 줄게. 오늘만.' },
        { say: '차는 별로야', tier: 'meh', face: 'calm', answer: '그럼 물. 회관에선 목마른 채로 판 앞에 앉는 거 아니야.' },
      ],
    },
    {
      id: 'homecook',
      open: '저녁 뭐 먹었니? 바깥 밥만 먹으면 판에서 손이 떨려.',
      replies: [
        { say: '직접 해 먹었어', tier: 'great', remember: 'homecook', face: 'wow', answer: '어머, 기특해라. 다음엔 나도 한 숟갈 줘. 남이 한 밥이 제일 맛있거든.' },
        { say: '아직 안 먹었어', tier: 'good', answer: '그럴 줄 알았다. 부엌에 된장국 남았어. 앉아, 데워 줄게.' },
        { say: '과자로 때웠어', tier: 'meh', face: 'sorry', answer: '…자기, 그러면 판에서 진다. 내일은 밥 먹고 와.' },
      ],
    },
    {
      id: 'bi-gwang',
      open: '다들 비광을 싫어하잖니. 광인데 대접을 못 받아. 넌 어때?',
      replies: [
        { say: '그래서 더 정이 가', tier: 'great', remember: 'bi-gwang', face: 'smile', answer: '…나랑 똑같네. 비 맞으면서도 우산 쓰고 버티는 패라서 좋아.' },
        { say: '점수 깎이니까 싫어', tier: 'good', answer: '솔직하네. 판에선 그게 맞아. 정은 판 밖에서 주는 거고.' },
        { say: '무슨 패인지 모르겠어', tier: 'meh', answer: '비 오는 날 우산 쓴 사람 그려진 패. 다음에 보여 줄게.' },
      ],
    },
    {
      id: 'read-face',
      open: '자기 얼굴 한번 읽어 볼까? 거짓말은 못 하겠다, 내 앞에선.',
      replies: [
        { say: '읽어 봐. 숨길 거 없어', tier: 'great', remember: 'face-read', face: 'think', answer: ['음… 오늘 좋은 일 하나, 걱정 하나. 걱정은 별거 아니고.', '…맞지? 후후, 패보다 얼굴이 쉬워.'] },
        { say: '무서워, 하지 마', tier: 'good', face: 'laugh', answer: '후후, 겁먹은 얼굴도 다 읽혀. 괜찮아, 나쁜 건 안 보여.' },
        { say: '그런 거 안 믿어', tier: 'meh', answer: '믿든 말든 판은 그렇게 돌아가. 언젠가 내 말 생각날 거야.' },
      ],
    },
    {
      id: 'learn',
      open: '판 구경만 하는 사람이 제일 많이 배워. 너, 한 수 배워 볼래?',
      replies: [
        { say: '언니한테 배우고 싶어', tier: 'great', remember: 'learn-hwatu', face: 'smile', answer: '좋아. 첫 수업은 손 씻기야. 패는 깨끗한 손에서 정직해지거든.' },
        { say: '돈 잃을까 봐 싫어', tier: 'good', answer: '현명하다. 그럼 콩으로 해. 콩 잃는 건 안 아프잖니.' },
        { say: '난 이미 잘 쳐', tier: 'meh', face: 'think', answer: '…그 말 하는 사람치고 잘 치는 사람 못 봤어. 후후.' },
      ],
    },
    {
      id: 'quiet-win',
      open: '판에서 제일 무서운 사람이 누군 줄 알아? 소리치는 사람? 아니야.',
      replies: [
        { say: '조용히 이기는 사람', tier: 'great', remember: 'quiet-win', face: 'wow', answer: '…맞아. 너 생각보다 판을 아네. 그런 사람이 제일 무서워.' },
        { say: '돈 많은 사람?', tier: 'good', answer: '돈 많은 사람은 오히려 쉬워. 잃어도 웃으니까 얼굴이 다 보이거든.' },
        { say: '언니?', tier: 'meh', face: 'laugh', answer: '후후, 그건 판 밖에서 하는 말이고. 판 안에선 나도 조심해.' },
      ],
    },
    {
      id: 'secret',
      open: '회관에선 별말이 다 들려. 근데 난 들은 걸 안 옮겨. 너는 비밀 잘 지키니?',
      replies: [
        { say: '언니 비밀은 무덤까지', tier: 'great', remember: 'secret-kept', face: 'shy', answer: '…그럼 하나 말해 줄까. 나 사실 화투보다 뜨개질이 더 좋아. 비밀이다.' },
        { say: '노력은 해', tier: 'good', answer: '노력이면 됐어. 지키겠다고 큰소리치는 사람이 제일 먼저 흘려.' },
        { say: '난 입이 가벼워', tier: 'meh', face: 'laugh', answer: '후후, 솔직해서 좋다. 그럼 너한텐 날씨 이야기만 할게.' },
      ],
    },
    {
      id: 'songpyeon',
      open: '명절엔 회관 사람들이랑 송편을 빚거든. 자기도 빚어 볼래?',
      replies: [
        { say: '같이 빚자!', tier: 'great', remember: 'songpyeon', face: 'smile', answer: '좋아. 예쁘게 빚으면 예쁜 짝 만난대. 너는 신경 좀 써야겠다. 후후.' },
        { say: '먹는 것만 할게', tier: 'good', face: 'laugh', answer: '먹는 사람도 있어야지. 대신 맛 평가는 정직하게 해.' },
        { say: '손이 둔해서…', tier: 'meh', answer: '괜찮아. 못생긴 송편이 더 기억에 남거든.' },
      ],
    },
    {
      id: 'bad-day',
      open: '오늘 판이 좀 험했어. 다들 독해서. …너는 오늘 어땠니?',
      replies: [
        { say: '언니 얘기 먼저 들을게', tier: 'great', face: 'shy', answer: '…자기 참. 그럼 차 한 잔 마실 동안만 털어놓을게. 딱 그만큼만.' },
        { say: '나도 별로였어', tier: 'good', answer: '그럼 오늘은 둘 다 스톱. 내일 새 판 돌리자.' },
        { say: '난 좋았는데!', tier: 'meh', face: 'calm', answer: '그래, 다행이다. 좋은 기운 좀 나눠 줘. 여기 놓고 가.' },
      ],
    },
    {
      id: 'rain-pancake',
      open: '비 오는 날엔 부침개 부쳐서 회관 사람들이랑 나눠 먹거든. 넌 뭐가 좋아?',
      replies: [
        { say: '김치전!', tier: 'great', remember: 'rain-pancake', answer: '역시. 김치전 아는 사람이랑은 말이 통해. 다음 비 오면 불러 줄게.' },
        { say: '파전!', tier: 'good', remember: 'rain-pancake', answer: '미쿠가 들으면 좋아하겠다. 파 얘기만 나오면 걔가 달려오거든.' },
        { say: '기름진 건 싫어', tier: 'meh', answer: '그럼 너는 차 담당. 부침개 옆엔 꼭 따뜻한 차가 있어야 하거든.' },
      ],
    },
    {
      id: 'outside-table',
      when: { ch: 3 },
      open: '{me}, 요즘은 판 끝나고 네 얼굴부터 찾게 돼. …이상하지?',
      replies: [
        { say: '나도 언니부터 찾아', tier: 'great', face: 'shy', answer: '…그 말은 판에서 쓰는 패가 아니야. 그러니까 믿을게.' },
        { say: '내가 보고 싶었구나', tier: 'good', face: 'laugh', answer: '후후, 그렇게 대놓고 읽으면 반칙이야. 그래도 틀린 말은 아니고.' },
        { say: '피곤해서 그래', tier: 'meh', face: 'calm', answer: '…그런가. 차나 마시자.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 온다. 부침개 냄새 나지? 회관 부엌에서 지금 막 부쳤어.',
      replies: [
        { say: '한 장만 줘!', tier: 'great', remember: 'rain-pancake', answer: '한 장은 무슨, 두 장 가져가. 비 오는 날 인심은 넉넉해야지.' },
        { say: '비광 생각난다', tier: 'good', remember: 'bi-gwang', face: 'smile', answer: '…너도? 오늘 같은 날엔 그 패가 제일 예뻐 보여.' },
        { say: '비 싫어', tier: 'meh', answer: '그래도 오늘은 손님이 많아. 비 피하러 다들 판으로 오거든.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 오네. 소나무에 눈 쌓이면 일월 송학 같지 않니?',
      replies: [
        { say: '첫 광이네', tier: 'great', face: 'wow', answer: '…알아듣는구나. 그럼 오늘 첫 차는 네 몫이야. 유자차.' },
        { say: '그냥 추워', tier: 'meh', face: 'calm', answer: '그래, 춥지. 난롯가 앉아. 판은 손이 녹은 다음이야.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤 깊은 판은 사람을 잡아먹어. {me}, 너는 왜 아직 안 들어갔니?',
      replies: [
        { say: '언니 보러 왔지', tier: 'great', face: 'shy', answer: '…말은 잘해. 보리차 한 잔만 하고 들어가. 판은 안 된다.' },
        { say: '잠이 안 와서', tier: 'good', answer: '그럼 국화차. 마음 가라앉히는 데는 그만한 게 없거든.' },
        { say: '한 판만 하고 갈래', tier: 'meh', face: 'think', answer: '…안 돼. 이 시간에 잡는 패는 다 독이야. 내일 와.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제날엔 판을 안 열어. 다들 밖에서 웃고 있잖니. 그게 더 큰 판이야.',
      replies: [
        { say: '언니도 같이 나가자', tier: 'great', face: 'smile', answer: '…그럴까. 오늘만. 대신 사진은 찍지 마. 판 밖 얼굴은 비싸거든.' },
        { say: '심심하지 않아?', tier: 'good', answer: '심심한 게 좋아. 일 년에 며칠 안 되는 휴가거든.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손끝에 흙이 묻었네. 오늘 밭일했구나? 그 손은 정직한 손이야.',
      replies: [
        { say: '언니 반찬 하라고 가져올게', tier: 'great', remember: 'homecook', face: 'smile', answer: '…자기 참. 그럼 나는 밥을 지어 놓을게. 같이 먹자.' },
        { say: '힘들었어', tier: 'good', answer: '그럼 오늘은 판 말고 차. 몸 쓴 날엔 머리를 쉬게 해야 해.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 나왔다며? 판으로 치면 광 세 장 들어온 거야.',
      replies: [
        { say: '삼광이다!', tier: 'great', face: 'laugh', answer: '후후, 맞아. 근데 그럴 때일수록 스톱할 줄 알아야 해. 오늘은 쉬어.' },
        { say: '운이 좋았어', tier: 'good', answer: '운은 준비된 손에만 와. 너 손이 좋은 거야.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '…비린내. {me}, 오늘 {fish} 잡았지? 미안한데 회관엔 안 들고 와 줄래?',
      replies: [
        { say: '구워서 가져올게', tier: 'great', answer: '…구우면 얘기가 달라지지. 생선구이엔 흰밥이야. 밥은 내가 할게.' },
        { say: '미안, 손 씻고 올게', tier: 'good', face: 'smile', answer: '착하네. 비누는 문 옆에 있어. 판 앞엔 깨끗한 손만.' },
        { say: '날생선도 맛있는데', tier: 'meh', face: 'sorry', answer: '…그건 너나 먹어. 난 날 건 패든 생선이든 싫어.' },
      ],
    },
    {
      id: 'op-lumi',
      when: { bond: 'lumi' },
      open: '미쿠 만났니? 걔 오늘 퇴근길에 할 말 있다더라. 연애 얘기겠지, 또.',
      replies: [
        { say: '무슨 얘긴지 궁금해', tier: 'good', face: 'laugh', answer: '후후, 그건 비밀. 들은 건 안 옮긴다고 했잖니.' },
        { say: '둘이 정말 친하구나', tier: 'great', face: 'smile', answer: '같은 밤을 일하는 사이니까. 해 뜰 때 같이 퇴근하는 사람은 각별해.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '샹크스 만나고 왔구나. 그 사람 또 외상 늘렸지? 얼굴 보니 알겠어.',
      replies: [
        { say: '판 끝나고 안주 나눈다며?', tier: 'great', face: 'smile', answer: '…그 사람 입 가볍다. 응, 이긴 날엔 매운 거. 진 날엔 국물.' },
        { say: '외상은 몰라', tier: 'good', answer: '모르는 게 나아. 그 사람 장부는 미스 포츈 담당이야. 난 안 엮일래.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 얼굴에 패가 다 보여. 안 좋은 패. 무슨 일 있었니?',
      replies: [
        { say: '그냥 좀 힘들어', tier: 'great', face: 'smile', answer: '…그럼 오늘은 이야기하지 마. 차 우리는 소리만 듣고 있어. 그것도 쉬는 거야.' },
        { say: '언니한텐 못 숨기네', tier: 'good', answer: '못 숨기지. 대신 아무한테도 안 말해. 그게 내 판 규칙이야.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '광장에서 결혼식 올렸다며? 판에선 평생 같이 칠 짝을 만난 거지.',
      replies: [
        { say: '언니는 짝 없어?', tier: 'good', face: 'shy', answer: '…그건 패 까 보기 전엔 모르는 거야. 후후.' },
        { say: '진심으로 축하할 일이야', tier: 'great', answer: '그래. 오늘은 회관에서 떡 돌리자. 좋은 날엔 다 같이 먹어야지.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-honest',
      when: { mem: ['honest-hand', 'face-read'] },
      use: 'face-read',
      open: '저번에 지더라도 정직하게 친다고 했지? 그 뒤로 네 판을 몰래 봤어. 진짜더라.',
      replies: [
        { say: '언니 앞이라서가 아니야', tier: 'great', face: 'shy', answer: '…알아. 그래서 좋은 거야. 그런 손은 오래 봐도 질리지 않거든.' },
        { say: '몰래 보지 마!', tier: 'good', face: 'laugh', answer: '후후, 그게 내 일이야. 대신 네 판은 이제 안 볼게. 믿으니까.' },
      ],
    },
    {
      id: 'cb-go',
      when: { mem: 'go-player' },
      use: 'go-player',
      open: '고만 외친다던 {me}. 요즘도 고니? 얼굴 보니 아직 안 다쳤나 보네.',
      replies: [
        { say: '요즘은 스톱도 해', tier: 'great', remember: 'stop-player', face: 'wow', answer: '어머, 컸네. 멈출 줄 아는 사람이 판을 오래 앉아 있어.' },
        { say: '여전히 고!', tier: 'good', face: 'laugh', answer: '후후, 못 말려. 그래도 세 번째 고는 내가 말린다. 약속 기억하지?' },
      ],
    },
    {
      id: 'cb-tea',
      when: { mem: 'tea-lover' },
      use: 'tea-lover',
      open: '차 좋아한다고 했잖니. 오늘 새로 들어온 꽃차가 있어. 너 먼저 줄게.',
      replies: [
        { say: '언니가 기억해 줘서 좋다', tier: 'great', face: 'smile', answer: '…자기 취향은 판보다 쉽게 외워져. 이상하지.' },
        { say: '무슨 꽃이야?', tier: 'good', answer: '국화랑 동백. 겨울 패 두 장 섞은 맛이야. 마셔 봐.' },
      ],
    },
    {
      id: 'cb-pancake',
      when: { mem: 'rain-pancake', weather: ['rain', 'storm'] },
      use: 'rain-pancake',
      open: '비 오면 부침개 같이 먹자고 했던 거 기억나? 오늘이 그날이야. 앉아.',
      replies: [
        { say: '기억해 줘서 고마워', tier: 'great', face: 'smile', answer: '약속은 패랑 달라서 버리는 게 아니거든. 뜨거울 때 먹어.' },
        { say: '막걸리는?', tier: 'good', face: 'laugh', answer: '후후, 회관에선 안 돼. 대신 식혜 줄게. 내가 담근 거야.' },
      ],
    },
    {
      id: 'cb-secret',
      when: { mem: 'secret-kept' },
      use: 'secret-kept',
      open: '그 비밀, 아직 안 옮겼더라. 회관에 아무 소문도 없어. …고마워.',
      replies: [
        { say: '뜨개질한 거 보여 줘', tier: 'great', face: 'shy', answer: '…이거. 목도리야. 아직 반밖에 못 떴어. 다 뜨면 누구 줄지 고민 중이고.' },
        { say: '당연하지', tier: 'good', answer: '당연한 걸 지키는 사람이 드물어. 그래서 고마운 거야.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 수첩에 적혀 있더라. 판보다 쉽게 읽혀.',
      replies: [
        { say: '다음엔 언니 취향도 알려 줘', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '…내 건 비밀. 대신 하나만. 따뜻한 거면 다 좋아.' },
        { say: '들켰네', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '후후, 숨길 생각도 없었잖니. 그런 정직함이 좋아.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 걸은 거, 생각보다 좋더라. 회관 밖 공기도 나쁘지 않네.',
      replies: [
        { say: '다음엔 바닷가 가자', tier: 'great', remember: 'outing-talk', face: 'smile', answer: '…좋아. 대신 비린내 나는 데는 오래 안 있을 거야.' },
        { say: '언니가 계속 차 얘기만 했어', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '후후, 차 얘기가 제일 안전하거든. 다음엔 다른 얘기도 해 볼게.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에서 마신 차 말이야. 회관 차보다 맛있었어. 왜인지 모르겠네.',
      replies: [
        { say: '같이 마셔서 그래', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…알아. 그래서 모르는 척한 거야. 후후.' },
        { say: '내 찻잎이 좋아서?', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '그건 아니야. 찻잎은 내 게 더 좋아. 그러니까… 알지?' },
      ],
    },
  ],
  chapters: [
    {
      title: '첫 패',
      hint: '한 번 이야기를 나누면 예림이가 패 한 장을 뒤집어 보여 줘요.',
      need: { days: 1 },
      scene: [
        '예림이가 화투 부채를 접고, 패 한 장을 테이블에 엎어 놓는다.',
        '"회관에 처음 오는 사람한테 늘 하는 거야. 이 패가 뭔지 맞혀 봐."',
        '"맞히든 못 맞히든 상관없어. 대답하는 얼굴을 보는 거니까."',
        '그녀의 눈이 조용히 내 얼굴을 훑는다.',
      ],
      replies: [
        { say: '모르겠어. 솔직히', tier: 'great', remember: 'face-read', face: 'smile', answer: '…좋은 얼굴이네. 모르는 걸 모른다고 하는 사람, 오랜만이야. 이건 이월 매조.' },
        { say: '광이다!', tier: 'good', face: 'laugh', answer: '후후, 틀렸어. 근데 자신 있는 얼굴은 나쁘지 않아.' },
        { say: '이런 거 왜 해?', tier: 'meh', face: 'calm', answer: '판에 앉힐 사람인지 보려고. 넌… 일단 차부터 마시자.' },
      ],
    },
    {
      title: '포장마차의 밤',
      hint: '밤(게임 시각 저녁 여덟 시부터 자정)에 시장 거리로 가 보세요. 예림이가 퇴근길에 들른대요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 20, to: 24 } },
      scene: [
        '시장 거리 끝, 포장마차 불빛 아래 예림이가 혼자 앉아 있다.',
        '"왔네. 판 끝나면 여기서 국수 한 그릇 해. 아무도 날 모르는 척해 주거든."',
        '"회관에선 마담이지만, 여기선 그냥 국수 먹는 사람이야."',
        '그녀가 젓가락 하나를 건넨다.',
        '"…같이 먹을래? 오늘은 내가 살게. 판 얘기는 금지."',
      ],
      replies: [
        { say: '판 말고 언니 얘기 해 줘', tier: 'great', remember: 'night-stall', face: 'shy', answer: '…어려운 주문이네. 그럼 국수 다 먹을 때까지만. 천천히 먹어.' },
        { say: '잘 먹을게!', tier: 'good', remember: 'night-stall', face: 'smile', answer: '후후, 맛있게 먹는 얼굴이 제일 읽기 쉬워. 좋다.' },
        { say: '국수 별로야', tier: 'meh', remember: 'night-stall', answer: '그럼 어묵 국물. 밤바람엔 따뜻한 게 필요해.' },
      ],
    },
    {
      title: '꽃차 한 잔',
      hint: '예림이가 꽃차 이야기를 했어요. 꽃차를 한 잔 가지고 회관에 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '꽃차를 내밀자 예림이의 손이 잠깐 멈춘다.',
        '"…이걸 나한테? 회관에서 차는 내가 우리는 거야. 받는 건 처음이네."',
        '그녀가 찻잔을 두 손으로 감싼다. 판에서는 한 번도 못 본 모습이다.',
        '"이상하다. 남이 우린 차는 맛을 모르겠어. 마음이 먼저 와서."',
        '"…고마워, {me}. 오늘은 패 안 읽을게. 그냥 마실게."',
      ],
      replies: [
        { say: '언니도 쉬어야지', tier: 'great', remember: 'flower-tea', face: 'shy', answer: '…자기 때문에 판 밖 얼굴이 자꾸 나와. 곤란한데. 싫진 않아.' },
        { say: '맛은 어때?', tier: 'good', remember: 'flower-tea', face: 'smile', answer: '조금 쓰고, 많이 따뜻해. 딱 좋은 차야.' },
        { say: '그냥 남아서 줬어', tier: 'meh', remember: 'flower-tea', face: 'calm', answer: '…후후, 거짓말 서툴다. 얼굴에 다 쓰여 있어.' },
      ],
    },
    {
      title: '밑장의 기억',
      hint: '예림이에게 정직하게 치는 사람이 좋다고 말해 보세요. 그녀가 옛이야기를 꺼낼 거예요.',
      need: { days: 9, points: 60, mem: 'honest-hand' },
      scene: [
        '판이 끝난 회관. 예림이가 마지막 패를 정리하다 손을 멈춘다.',
        '"옛날에 말이야. 나도 밑장 빼는 손을 믿은 적이 있어."',
        '"다 잃었지. 돈보다 사람을 잃은 게 더 컸어."',
        '"그 뒤로 판을 쥐었어. 다시는 아무도 내 판에서 속지 않게."',
        '"…그래서 네가 정직하게 친다고 했을 때, 좀 놀랐어. 반가워서."',
      ],
      replies: [
        { say: '언니 판은 내가 지킬게', tier: 'great', face: 'shy', answer: '…말은. 그래도 그 말, 패처럼 엎어 두지 않고 잘 간직할게.' },
        { say: '말해 줘서 고마워', tier: 'good', face: 'smile', answer: '이 얘기 아는 사람 이제 둘이야. 나랑 너. 판에선 이걸 동맹이라고 해.' },
        { say: '다 지난 일이야', tier: 'meh', face: 'calm', answer: '…그래. 지난 패는 다시 안 섞여. 맞는 말이야.' },
      ],
    },
    {
      title: '마지막 패',
      hint: '예림이와 아주 가까워지면 그녀가 엎어 둔 마지막 패를 보여 줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '예림이가 패 한 장을 손바닥 위에 올려 둔다. 엎어진 채로.',
        '"판마다 마지막 한 장은 안 까고 두는 버릇이 있어. 아무도 몰라."',
        '"그 패가 뭔지는 나도 안 봐. 보면 판이 끝나 버리니까."',
        '"…근데 요즘은 좀 까 보고 싶어. 이상하지, 자기?"',
      ],
      replies: [
        { say: '같이 까 볼까?', tier: 'great', face: 'shy', answer: '…아직. 꽃이라도 한 다발 들고 오면, 그때 같이 까자. 후후.' },
        { say: '안 까도 괜찮아', tier: 'good', face: 'smile', answer: '그 말이 제일 듣고 싶었어. 근데 이상하게 더 까고 싶어지네.' },
        { say: '무슨 패인데?', tier: 'meh', face: 'think', answer: '모른다니까. 그러니까 마지막 패지.' },
      ],
    },
    {
      title: '판 밖의 약속',
      hint: '예림이와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '예림이가 엎어 둔 마지막 패를 내 손에 쥐여 준다.',
        '"같이 까자며. 하나, 둘."',
        '패를 뒤집자 팔월 공산, 달이 뜬 광이다.',
        '"…역시. 늘 이거였을 것 같았어. 밤에 혼자 보던 달."',
        '"이제 혼자 안 봐도 되겠네. 판 밖에서도, 자기랑."',
      ],
      replies: [
        { say: '이제 달은 같이 보자', tier: 'great', face: 'shy', answer: '…응. 이건 판에서 하는 약속 아니야. 그러니까 평생 가.' },
        { say: '광이네! 이겼다', tier: 'good', face: 'laugh', answer: '후후, 그래. 이번 판은 둘 다 이긴 걸로 하자.' },
        { say: '천천히 가자', tier: 'meh', face: 'smile', answer: '좋아. 급하게 치는 판은 늘 아쉽거든.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 여기까지. 차 식기 전에 마시고 가.',
    '또 왔네. 얼굴만 봐도 됐어. 판은 내일.',
    '자기, 할 말 다 했잖니. 들어가서 쉬어.',
    '후후, 오늘은 패 다 깠어. 남은 건 없어.',
  ],
};
