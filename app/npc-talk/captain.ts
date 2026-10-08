// 샹크스 — 허풍 주점 주인, 먼바다 낚싯배 선장. 느긋하고 호탕한 반말("하하하",
// "다하하", "~거든", "~자!"). 잔치와 친구가 제일이고, 남의 허풍을 듣는 쪽을
// 좋아한다. 한 손으로 다 하고 티 내지 않는다. 언젠가 돌려받기로 한 모자
// 이야기는 넌지시만. 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const CAPTAIN_TALK: NpcTalkBook = {
  npc: 'captain',
  memories: {
    'sea-lover': '바다가 좋다고 했어요',
    'land-lover': '흔들리지 않는 땅이 편하다고 했어요',
    'party-yes': '시끌벅적한 잔치를 좋아한다고 했어요',
    'quiet-night': '조용한 밤이 좋다고 했어요',
    'big-dream': '언젠가 큰 꿈을 이루고 싶다고 했어요',
    'hat-story': '오래된 모자 이야기를 들었어요',
    'milk-toast': '우유로 건배를 했어요',
    'friend-first': '친구가 제일 소중하다고 했어요',
    'fish-big': '언젠가 큰 고기를 잡겠다고 했어요',
    'one-hand': '한 손 요리 비법을 배웠어요',
    'sail-with': '배에 같이 타겠다고 약속했어요',
    'sunset-hill': '뒷산에서 노을을 함께 봤어요',
    'chestnut-night': '군밤을 나눠 먹은 밤이 있어요',
    'old-crew': '옛 선원들 이야기를 들었어요',
    'storm-wait': '폭풍은 기다리는 거라고 배웠어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 잔치 이야기를 나눴어요',
  },
  talks: [
    {
      id: 'sea-or-land',
      open: '{me}, 너는 바다가 좋아, 땅이 좋아? 대답 따라 잔 크기가 달라진다. 하하!',
      replies: [
        { say: '당연히 바다지!', tier: 'great', remember: 'sea-lover', answer: '다하하! 그럴 줄 알았다. 오늘 네 잔은 제일 큰 걸로 하지.' },
        { say: '땅이 편해. 흔들리는 건 싫어', tier: 'good', remember: 'land-lover', answer: '정직해서 좋다. 땅 위 친구도 내 친구지. 배는 내가 몰면 돼.' },
        { say: '둘 다 그냥 그래', tier: 'meh', answer: '음? 그럼 주점이 딱이네. 여긴 바다도 땅도 아닌 웃음 위거든.' },
      ],
    },
    {
      id: 'party-or-quiet',
      open: '오늘 밤 잔치를 열까 하는데… 너는 시끌벅적한 게 좋아, 조용한 게 좋아?',
      replies: [
        { say: '잔치! 다 불러!', tier: 'great', remember: 'party-yes', answer: ['좋다! 볼리바스한테 심판 서라고 하고, 의자는 발키리한테 미리 빌려 둬야지.', '…부서지면 또 혼나겠지만. 하하하!'] },
        { say: '조용히 한잔이 좋아', tier: 'good', remember: 'quiet-night', answer: '그것도 좋지. 잔치 끝나고 남은 사람끼리 마시는 한 잔이 제일 맛있거든.' },
        { say: '피곤해서 잘래', tier: 'meh', face: 'calm', answer: '그래, 푹 자. 잔치는 내일도 열 수 있다. 바다는 안 도망가.' },
      ],
    },
    {
      id: 'dream',
      open: '배 위에선 다들 꿈 이야기를 해. 너는 꿈이 뭐야, {me}?',
      replies: [
        { say: '마을 최고가 되는 거!', tier: 'great', remember: 'big-dream', answer: '다하하! 큰 꿈이다. 비웃는 놈 있으면 데려와. 내가 같이 웃어 줄게.' },
        { say: '그냥 즐겁게 사는 거', tier: 'good', answer: '그게 제일 어려운 꿈이야. 나도 아직 항해 중이거든.' },
        { say: '꿈 같은 건 없어', tier: 'meh', face: 'think', answer: '없으면 찾으면 되지. 서두를 거 없다. 바다는 넓으니까.' },
      ],
    },
    {
      id: 'hat',
      open: '벽에 걸린 저 낡은 모자 말이야. 내 거 아니다. 맡겨 둔 거지.',
      replies: [
        { say: '누구한테 맡긴 건데?', tier: 'great', remember: 'hat-story', answer: ['언젠가 큰 사람이 돼서 돌려주러 올 녀석. 그날까진 내가 지킨다.', '…하하, 너무 진지했나? 우유 한 잔 더 줄게.'] },
        { say: '한번 써 봐도 돼?', tier: 'good', face: 'laugh', answer: '하하하! 그건 안 돼. 그 대신 내 망토는 빌려줄 수 있다. 좀 크지만.' },
        { say: '그냥 버리지 그래', tier: 'meh', face: 'calm', answer: '…버릴 수 없는 것도 있는 법이야. 언젠가 너도 알게 될 거다.' },
      ],
    },
    {
      id: 'milk',
      open: '낮엔 술을 안 판다. 대신 우유가 있지. {me}, 우유로 건배할래?',
      replies: [
        { say: '건배! 우유도 좋아', tier: 'great', remember: 'milk-toast', answer: '다하하! 그래야 내 친구지. 잔이 뭐든 웃으면서 부딪치면 그게 잔치야.' },
        { say: '꿀 넣어 줘', tier: 'good', answer: '오, 단골 주문이네. 꿀 한 숟갈, 아니 두 숟갈. 오늘은 특별히.' },
        { say: '우유는 좀…', tier: 'meh', answer: '하하, 그럼 주스다. 마시는 건 뭐든 좋아. 같이 마시는 게 중요하지.' },
      ],
    },
    {
      id: 'friends',
      open: '{me}, 보물섬이 있다면 뭘 찾고 싶어? 금? 보석?',
      replies: [
        { say: '같이 갈 친구들', tier: 'great', remember: 'friend-first', answer: '…하하하! 너 정말 마음에 든다. 그거면 섬 하나쯤 안 찾아도 되겠다.' },
        { say: '당연히 금이지', tier: 'good', answer: '솔직하네! 금도 좋지. 찾으면 주점에서 한턱내는 거다?' },
        { say: '섬은 무서워', tier: 'meh', face: 'calm', answer: '무서운 게 정상이야. 그래서 혼자 안 가는 거다. 다 같이 가면 무섭지 않거든.' },
      ],
    },
    {
      id: 'big-catch',
      open: '먼바다엔 배만 한 고기가 산대. 허풍 같지? 근데 진짜야. 아마도.',
      replies: [
        { say: '내가 잡아 올게!', tier: 'great', remember: 'fish-big', answer: '다하하! 그 말 기억해 둔다. 잡으면 마을 잔치, 못 잡으면 네가 설거지다.' },
        { say: '본 적 있어?', tier: 'good', face: 'think', answer: '꼬리만 봤다. 배가 통째로 기울었지. 그날 나도 처음으로 놀랐다.' },
        { say: '허풍이네', tier: 'meh', face: 'laugh', answer: '하하, 여긴 허풍 주점이야. 허풍인지 아닌지는 바다만 알지.' },
      ],
    },
    {
      id: 'one-hand',
      open: '한 손으로 생선 굽는 거 보여 줄까? 요령만 알면 쉽다.',
      replies: [
        { say: '보여 줘! 배울래', tier: 'great', remember: 'one-hand', answer: '좋아. 뒤집을 때 손목만 쓰는 거야. 봐, 한 번에. …하하, 넌 두 손 써도 된다.' },
        { say: '두 손이 더 편하지 않아?', tier: 'good', face: 'smile', answer: '편하지. 근데 한 손이 비어 있으면 친구 어깨를 칠 수 있거든.' },
        { say: '생선 냄새 싫어', tier: 'meh', face: 'sorry', answer: '이런, 주점 주인한테 큰일 날 소리다. 문 쪽 자리 줄게. 바람 잘 통해.' },
      ],
    },
    {
      id: 'scar',
      open: '눈가 흉터? 다들 물어보더라. 궁금해?',
      replies: [
        { say: '말하기 싫으면 안 해도 돼', tier: 'great', face: 'smile', answer: '…하하. 그 말이 제일 듣기 좋다. 언젠가 술 말고 우유 마시면서 해 주지.' },
        { say: '응, 무슨 일이었어?', tier: 'good', face: 'think', answer: '옛날에 무모한 녀석한테 받은 거야. 지금은 웃으면서 말할 수 있다. 그거면 됐지.' },
        { say: '별로 안 궁금해', tier: 'meh', face: 'laugh', answer: '하하하! 그런 손님이 제일 편하다. 잔이나 비우자.' },
      ],
    },
    {
      id: 'crew',
      open: '배 한 척에 꼭 있어야 할 사람이 누군 줄 알아? 선장? 아니야.',
      replies: [
        { say: '요리사!', tier: 'great', remember: 'old-crew', answer: '다하하! 정답이다. 밥 맛있는 배는 폭풍도 버텨. 내 옛 배 요리사도 그랬지.' },
        { say: '음악 하는 사람?', tier: 'good', answer: '오, 그것도 맞다. 노래 없는 항해는 길거든. 미쿠라도 태우고 싶다니까.' },
        { say: '돈 관리하는 사람', tier: 'meh', face: 'think', answer: '…미스 포츈 같은 말을 하네. 틀린 건 아닌데 재미가 없잖아. 하하.' },
      ],
    },
    {
      id: 'storm',
      open: '폭풍 오는 날 선장이 제일 먼저 하는 일이 뭔지 알아?',
      replies: [
        { say: '기다리는 거?', tier: 'great', remember: 'storm-wait', answer: '그래! 바다를 아는 놈은 기다릴 줄 안다. 넌 선장 감이네, {me}.' },
        { say: '돛을 접는 거?', tier: 'good', answer: '그것도 하지. 근데 그 전에 선원들 얼굴부터 본다. 겁먹은 놈 없나 하고.' },
        { say: '그냥 나가는 거!', tier: 'meh', face: 'wow', answer: '하하하! 용감한 건 좋은데 그러다 고기밥 된다. 다음엔 나랑 같이 기다리자.' },
      ],
    },
    {
      id: 'tall-tale',
      open: '허풍 주점 규칙 알지? 오늘 들은 최고의 허풍 하나 해 봐. 들어 줄게.',
      replies: [
        { say: '고래랑 팔씨름해서 이겼어', tier: 'great', face: 'laugh', answer: '다하하하! 좋다, 오늘의 허풍왕은 너다! 고래한테 내 안부도 전해 줘.' },
        { say: '잠깐, 생각 좀 해 볼게', tier: 'good', answer: '천천히 해. 좋은 허풍은 뜸을 들여야 맛있거든. 우유 식기 전에만.' },
        { say: '난 거짓말 못 해', tier: 'meh', face: 'smile', answer: '하하, 그런 녀석이 제일 무서운 허풍쟁이였어. 뭐, 그것도 좋지.' },
      ],
    },
    {
      id: 'promise-sail',
      when: { ch: 3 },
      open: '{me}, 언젠가 배 한 척 제대로 띄우면… 같이 갈래? 진지하게 묻는 거다.',
      replies: [
        { say: '갈게. 약속이야', tier: 'great', remember: 'sail-with', face: 'shy', answer: '…하하. 약속했다? 선장은 약속 안 잊는다. 첫 자리는 네 거다.' },
        { say: '어디로 가는데?', tier: 'good', answer: '정한 데 없다. 그게 재밌는 거지. 가 보고 싶은 데 생기면 말해.' },
        { say: '멀미할 것 같아', tier: 'meh', face: 'laugh', answer: '하하하! 멀미약은 츠나데 할머니한테 잔뜩 사 두마. 그럼 문제없지?' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 오는 날은 주점이 꽉 차지. {me}, 젖었으면 난롯가로 와.',
      replies: [
        { say: '비 오는 날 좋아', tier: 'great', answer: '다하하! 나도다. 빗소리가 박수 소리 같거든. 오늘은 잔치 각이다.' },
        { say: '수건 좀 줄래?', tier: 'good', answer: '여기. 망토로 닦아 줄까 했는데 그건 더 젖었다. 하하.' },
        { say: '빨리 그쳤으면', tier: 'meh', face: 'calm', answer: '그칠 거야. 비는 늘 그치지. 그동안 우유나 데워 줄게.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다! 바다에 눈 내리는 거 본 적 있어? 소리가 하나도 안 나.',
      replies: [
        { say: '보고 싶어', tier: 'great', remember: 'sea-lover', answer: '그럼 이따 같이 선착장 가자. 따뜻한 우유 두 잔 챙겨서.' },
        { say: '추워서 싫어', tier: 'meh', face: 'calm', answer: '하하, 그럼 난롯가 명당을 내주지. 쓰레쉬한테는 비밀이다.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '오, 바다 냄새! {me}, 오늘 {fish} 낚았지? 손맛 어땠어?',
      replies: [
        { say: '최고였어!', tier: 'great', answer: '다하하! 그 얼굴 보니 알겠다. 다음엔 먼바다 가자. 손맛이 차원이 달라.' },
        { say: '겨우 건졌어', tier: 'good', answer: '겨우든 뭐든 건졌으면 이긴 거야. 오늘 저녁은 네 무용담 듣는 날이다.' },
        { say: '팔이 아파', tier: 'meh', face: 'sorry', answer: '하하, 처음엔 다 그래. 팔 말고 허리로 당기는 거다. 다음에 보여 주지.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었다! 오늘 엄청난 놈을 낚았다며? 마을이 시끌시끌하던데.',
      replies: [
        { say: '내가 해냈어!', tier: 'great', remember: 'fish-big', answer: '다하하하! 오늘 밤은 네 잔치다! 다들 불러라! 술값은… 아니, 우유값은 내가 낸다!' },
        { say: '운이 좋았어', tier: 'good', answer: '운도 실력이야. 바다가 너를 마음에 들어 한 거지.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙냄새가 나네. 오늘 밭일했구나? 땅 사람도 멋있지.',
      replies: [
        { say: '안주 거리 가져올게', tier: 'great', answer: '하하하! 그 말 기다렸다. 구워서 다 같이 나눠 먹자.' },
        { say: '허리가 끊어질 것 같아', tier: 'good', answer: '그럼 앉아. 의자 하나 비워 뒀다. 오늘은 내가 다 날라 줄게.' },
        { say: '바다가 더 좋은데', tier: 'meh', face: 'think', answer: '하하, 바다 사람이 밭 매는 것도 멋있잖아. 둘 다 하면 되지.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me}, 오늘 금별 작물 나왔다며? 반짝반짝한 게 꼭 보물 같더라.',
      replies: [
        { say: '보물이니까 자랑하러 왔지', tier: 'great', answer: '다하하! 보물은 자랑해야 맛이지! 주점 선반 제일 높은 데 올려 줄게.' },
        { say: '운이 좋았나 봐', tier: 'good', answer: '정성 들인 놈한테 운도 오는 거야. 축하한다.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 오늘은 다들 친구지. {me}, 노래 한 곡 할래? 내가 박수 칠게.',
      replies: [
        { say: '같이 부르자!', tier: 'great', answer: '좋다! 박자 틀려도 크게! 축제 노래는 크게 부르는 놈이 이기는 거다.' },
        { say: '음치라서…', tier: 'good', answer: '하하, 나도다. 그래서 둘이 부르면 아무도 모른다니까.' },
        { say: '구경만 할래', tier: 'meh', face: 'calm', answer: '구경도 축제다. 대신 박수는 크게 쳐 줘.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤바다는 조용해서 좋아. 이런 밤엔 옛 친구들 생각이 나거든.',
      replies: [
        { say: '옛 친구들 얘기 해 줘', tier: 'great', remember: 'old-crew', answer: ['다들 시끄럽고, 잘 먹고, 잘 웃었지. 지금은 각자 바다에 있다.', '…{me}, 너도 꽤 시끄러운 편이라 마음에 들어.'] },
        { say: '나도 조용한 밤이 좋아', tier: 'good', remember: 'quiet-night', answer: '그럼 오늘은 말 없이 잔만 부딪치자. 그것도 대화야.' },
        { say: '졸려…', tier: 'meh', face: 'calm', answer: '하하, 들어가 자. 밤바다는 내가 지키고 있을게.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '미스 포츈 만났다며? 그 사람 또 내 외상 장부 얘기 안 했어?',
      replies: [
        { say: '했어. 많이', tier: 'good', face: 'laugh', answer: '하하하! 역시. 다음 달엔 꼭 갚는다고 전해 줘. 진짜다. 아마도.' },
        { say: '둘이 무슨 사이야?', tier: 'great', answer: '같은 바다를 아는 사이지. 서로 배를 몰아 봐서 말이 통해. 장부만 빼면.' },
        { say: '모르는 척했어', tier: 'meh', answer: '현명하다. 그 사람 앞에선 모르는 게 약이야. 하하.' },
      ],
    },
    {
      id: 'op-maehwa',
      when: { bond: 'maehwa' },
      open: '예림이 회관 다녀왔어? 오늘 판은 어땠대? 끝나면 안주 나눠 먹기로 했거든.',
      replies: [
        { say: '판 엄청 뜨거웠어', tier: 'great', answer: '다하하! 그럼 오늘은 매운 안주다. 예림이는 이긴 날에 매운 걸 찾거든.' },
        { say: '조용하던데', tier: 'good', answer: '그런 날엔 그 사람 말수가 더 줄지. 따뜻한 차 한 주전자 끓여 둬야겠다.' },
      ],
    },
    {
      id: 'op-low-mood',
      when: { mood: 'low' },
      open: '{me}, 오늘 얼굴이 좀 흐리다. 무슨 일 있어? 말 안 해도 되고.',
      replies: [
        { say: '그냥 좀 지쳤어', tier: 'great', face: 'smile', answer: '그럼 여기 앉아. 아무것도 안 해도 된다. 지친 날엔 주점이 항구야.' },
        { say: '괜찮아, 별일 아니야', tier: 'good', answer: '그래. 그래도 우유는 한 잔 마시고 가. 공짜다. 오늘만.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '들었어? 오늘 광장에서 결혼식 있었다며! 축하주는 우유로 돌리자!',
      replies: [
        { say: '축하 잔치 열자!', tier: 'great', answer: '그래야지! 오늘 밤은 주점 문 활짝 연다. 신랑 신부 자리는 제일 앞이다.' },
        { say: '부럽다…', tier: 'good', face: 'smile', answer: '하하, 부러워하는 얼굴도 좋네. 너한테도 좋은 바람이 불 거다.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-sea',
      when: { mem: 'sea-lover' },
      use: 'sea-lover',
      open: '{me}, 저번에 바다가 좋다고 했지? 오늘 물때가 딱 좋다. 귀띔해 주는 거다.',
      replies: [
        { say: '고마워, 바로 갈게', tier: 'great', answer: '다하하! 큰 놈 잡으면 첫 점은 나한테 가져와. 그게 정보값이다.' },
        { say: '기억하고 있었어?', tier: 'good', face: 'shy', answer: '친구 말은 안 잊는다. 그게 내 몇 안 되는 장점이거든.' },
      ],
    },
    {
      id: 'cb-land',
      when: { mem: 'land-lover' },
      use: 'land-lover',
      open: '땅이 편하다던 {me}! 오늘은 갑판 말고 주점 바닥에 단단히 앉혀 주지.',
      replies: [
        { say: '역시 날 잘 알아', tier: 'great', answer: '하하하! 손님 취향은 선장 기억력의 기본이다.' },
        { say: '요즘은 바다도 좋아졌어', tier: 'good', remember: 'sea-lover', answer: '오? 그 말 기다렸다. 그럼 다음엔 배로 모시지.' },
      ],
    },
    {
      id: 'cb-dream',
      when: { mem: 'big-dream' },
      use: 'big-dream',
      open: '마을 최고가 되겠다던 꿈, 아직 그대로지? 요즘 어디까지 왔어?',
      replies: [
        { say: '조금씩 가는 중이야', tier: 'great', answer: '그거면 됐다. 큰 배도 한 번에 안 나가. 조금씩 밀려가는 거야.' },
        { say: '솔직히 막막해', tier: 'good', face: 'think', answer: '막막한 날엔 주점 와. 허풍 한 판 하면 다시 길이 보인다.' },
      ],
    },
    {
      id: 'cb-hat',
      when: { mem: 'hat-story' },
      use: 'hat-story',
      open: '모자 얘기 기억하지? 어젯밤에 먼지 털어 뒀다. 주인이 언제 올지 모르니까.',
      replies: [
        { say: '꼭 돌려받길 바랄게', tier: 'great', face: 'smile', answer: '…고맙다. 그날 오면 너도 불러 주지. 잔치는 크게 할 거다.' },
        { say: '나도 맡겨 둘 거 있어?', tier: 'good', face: 'laugh', answer: '하하하! 네 건 아직 안 맡는다. 너는 네가 들고 다녀야 어울려.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 주점 메뉴에 슬쩍 넣어 볼까 고민 중이다.',
      replies: [
        { say: '넣어 주면 매일 올게', tier: 'great', remember: 'taste-heard', answer: '다하하! 그럼 결정이다. 이름은 "{me} 특선". 어때?' },
        { say: '어떻게 알았어?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '주점 주인은 귀가 밝거든. 마을 수첩에도 다 적혀 있고.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 돌아다닌 거 재밌었다. 너랑 걸으면 길이 짧아지더라.',
      replies: [
        { say: '또 같이 가자', tier: 'great', remember: 'outing-talk', answer: '좋다! 다음엔 먼바다까지 가자. 배는 내가, 웃음은 네가 맡는 거다.' },
        { say: '네가 길을 잃었잖아', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '하하하! 그건 탐험이었다고 해 두자. 선장은 길을 잃지 않아. 새로 찾을 뿐이지.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 네 생일이지? 주점에서 뭐 해 줄까? 큰 고기 통구이 어때?',
      replies: [
        { say: '다 같이 모이면 그걸로 충분해', tier: 'great', face: 'smile', remember: 'bday-plan', answer: '…하하, 역시 너다. 그럼 의자 넉넉히 준비해 둔다.' },
        { say: '통구이 좋아!', tier: 'good', remember: 'bday-plan', answer: '좋아! 제일 큰 놈으로 잡아 온다. 약속이다.' },
      ],
    },
    {
      id: 'cb-friend',
      when: { mem: 'friend-first' },
      use: 'friend-first',
      open: '보물보다 친구라고 했던 거, 그 뒤로 나도 자주 생각났다.',
      replies: [
        { say: '지금도 그렇게 생각해', tier: 'great', face: 'smile', answer: '그럼 우린 이미 부자다. 다하하! 오늘 우유는 내가 산다.' },
        { say: '금도 조금은 좋아', tier: 'good', face: 'laugh', answer: '하하하! 솔직해서 더 좋다. 금도 친구도 챙기자.' },
      ],
    },
  ],
  chapters: [
    {
      title: '허풍 주점의 첫 잔',
      hint: '한 번 이야기를 나누면 샹크스가 잔 하나를 내밀어요.',
      need: { days: 1 },
      scene: [
        '샹크스가 바 아래에서 이 빠진 잔 하나를 꺼낸다.',
        '"이거 말이야. 주점 열고 처음 산 잔이다. 아무한테나 안 줘."',
        '"근데 {me}, 너 웃는 소리가 마음에 들었거든. 오늘부터 네 잔이다."',
        '"규칙은 하나. 이 잔으로 마실 땐 무조건 웃을 것. 하하!"',
      ],
      replies: [
        { say: '고마워, 잘 쓸게!', tier: 'great', remember: 'milk-toast', answer: '다하하! 그럼 첫 잔은 우유로! 건배다, {me}!' },
        { say: '이가 빠졌는데?', tier: 'good', face: 'laugh', answer: '그게 멋이야. 잔치 열 번은 버틴 잔이거든. 너도 그렇게 버텨 봐.' },
        { say: '잔은 내 거 쓸게', tier: 'meh', face: 'calm', answer: '하하, 그래도 선반에 걸어 둔다. 마음 바뀌면 언제든 꺼내.' },
      ],
    },
    {
      title: '뒷산의 노을',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 뒷산에 올라가 보세요. 바다가 보인대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 17, to: 21 } },
      scene: [
        '뒷산 꼭대기, 바다 쪽으로 해가 기운다. 샹크스가 바위에 걸터앉아 있다.',
        '"왔구나. 여기서 보면 바다가 다 보여. 옛날 내 배도 저 끝에서 왔지."',
        '"배 위에선 매일 이걸 봤는데, 땅에 내리니까 일부러 보러 와야 하더라."',
        '"그래서 친구를 부르는 거야. 혼자 보기엔 아깝거든."',
        '노을이 바다를 붉게 물들인다. 그의 머리색이랑 똑같다.',
      ],
      replies: [
        { say: '네 머리색 같아', tier: 'great', remember: 'sunset-hill', face: 'laugh', answer: '다하하하! 그런 말 처음 들어 본다. …아니, 두 번째인가. 좋은 날이다.' },
        { say: '같이 봐서 좋다', tier: 'good', remember: 'sunset-hill', face: 'smile', answer: '그치? 다음 노을도 같이 보자. 약속은 안 해도 된다. 그냥 오면 돼.' },
        { say: '바람이 차다', tier: 'meh', remember: 'sunset-hill', answer: '하하, 망토 반 줄게. 한쪽 어깨밖에 안 덮지만 없는 것보단 낫다.' },
      ],
    },
    {
      title: '군밤 굽는 밤',
      hint: '샹크스가 군밤 이야기를 했어요. 군밤 한 봉지를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'roastchestnut', take: true } },
      scene: [
        '군밤 봉지를 내밀자 샹크스의 눈이 동그래진다.',
        '"오! 이거 내 최애다. 어떻게 알았어?"',
        '화로 앞에 둘러앉아 군밤 껍질을 깐다. 그가 한 손으로 능숙하게 깐다.',
        '"옛 선원들이랑 겨울 바다에서 이렇게 깠지. 다들 손이 시려서 투덜거렸어."',
        '"근데 그 투덜거림이 그립더라. 이상하지?"',
      ],
      replies: [
        { say: '내가 투덜거려 줄까?', tier: 'great', remember: 'chestnut-night', face: 'laugh', answer: '다하하하! 좋다, 마음껏 투덜거려! 오늘 밤은 그게 제일 반가운 소리다.' },
        { say: '하나도 안 이상해', tier: 'good', remember: 'chestnut-night', face: 'smile', answer: '…그래. 고맙다. 마지막 한 알은 네 거다. 선장 명령이야.' },
        { say: '껍질 까기 귀찮다', tier: 'meh', remember: 'chestnut-night', answer: '하하, 그럼 내가 까 줄게. 한 손이지만 빠르다. 봐.' },
      ],
    },
    {
      title: '선장의 약속',
      hint: '샹크스와 배에 같이 타겠다는 약속을 나누면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'sail-with' },
      scene: [
        '주점 문을 닫은 뒤, 샹크스가 벽의 낡은 해도를 내린다.',
        '"이건 옛 친구들이랑 그린 지도다. 반은 허풍이고 반은 진짜야."',
        '"너랑 배 타기로 했잖아. 그래서 새 지도를 그리려고."',
        '그가 빈 종이를 펼치고 펜을 건넨다.',
        '"첫 줄은 네가 그어. 어디로 가고 싶은지."',
      ],
      replies: [
        { say: '네가 가 보고 싶었던 데로', tier: 'great', face: 'shy', answer: '…그런 데가 많아서 큰일이다. 다하하! 그럼 종이를 더 사 와야겠네.' },
        { say: '마을 한 바퀴부터!', tier: 'good', face: 'laugh', answer: '하하하! 좋다, 작은 항해부터. 큰 바다는 그다음이다.' },
        { say: '그림을 못 그려', tier: 'meh', answer: '괜찮아. 비뚤어진 선이 제일 재밌는 길이 되거든.' },
      ],
    },
    {
      title: '바다 너머의 이야기',
      hint: '샹크스와 아주 가까워지면 그가 아무한테도 안 한 이야기를 꺼내요. 그 뒤엔 꽃다발도 웃으며 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 밤, 손님이 다 간 주점. 샹크스가 우유 두 잔을 내려놓는다.',
        '"{me}. 난 바다에서 많은 걸 찾았다. 친구, 보물, 흉터까지."',
        '"근데 땅에 내리고 나서 처음으로 찾은 게 있어."',
        '그가 잔을 만지작거리다 웃는다. 평소보다 조금 작은 웃음이다.',
        '"…아니다. 이건 다음에 말하지. 선장도 겁날 때가 있거든."',
      ],
      replies: [
        { say: '기다릴게. 천천히 해', tier: 'great', face: 'shy', answer: '…다하하. 너한테는 못 당하겠다. 꽃은 안 어울린다고 했었는데, 네가 주는 건 다르려나.' },
        { say: '지금 말해 줘!', tier: 'good', face: 'laugh', answer: '하하하! 급하네. 바다 사람은 물때를 기다리는 법이다. 조금만.' },
        { say: '피곤해서 먼저 갈게', tier: 'meh', face: 'calm', answer: '그래, 조심히 가. …다음엔 꼭 말할게.' },
      ],
    },
    {
      title: '같은 배를 탄 사람',
      hint: '샹크스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '샹크스가 선착장 끝에 서 있다. 망토가 바람에 펄럭인다.',
        '"전에 말 못 한 거. 땅에서 처음 찾은 거 말이야."',
        '"너였다. 하하, 말하고 나니까 별거 아니네."',
        '"이제 배든 주점이든, 같은 데 타고 가자. 끝까지."',
      ],
      replies: [
        { say: '끝까지 같이 가자', tier: 'great', face: 'laugh', answer: '다하하하! 들었지, 바다야! 오늘 밤은 평생 최고의 잔치다!' },
        { say: '멀미약은 챙겨 줘', tier: 'good', face: 'laugh', answer: '하하하! 평생치 사 두지. 반지는… 그건 네가 준비하는 걸로 할까?' },
        { say: '아직은 천천히', tier: 'meh', face: 'smile', answer: '좋아. 천천히 가자. 같은 배에만 있으면 돼.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분히 했다. 우유 한 잔 더 하고 가.',
    '하하, 또 왔어? 반갑다. 잔은 늘 비워 두마.',
    '오늘 허풍은 다 들었다. 내일 새 걸로 가져와!',
    '바쁘면 가 봐. 주점은 안 도망간다. 다하하!',
  ],
};
