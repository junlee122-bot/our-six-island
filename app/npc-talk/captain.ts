// 샹크스 — 허풍 주점 주인, 먼바다 낚싯배 선장. 느긋하고 호탕한 반말("하하하",
// "다하하", "~거든", "~자!"). 잔치와 친구가 제일이고, 남의 허풍을 듣는 쪽을
// 좋아한다. 한 손으로 다 하고 티 내지 않는다. 언젠가 돌려받기로 한 모자
// 이야기는 넌지시만. 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
// 이야기 줄기: '출항'과 '돌아올 항구' — 왜 바다를 떠나 이 마을에 닻을 내렸는지,
// 그리고 {me}, 그의 돌아올 항구가 되기까지.
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
    'first-mate': '든든한 옛 부선장 이야기를 들었어요',
    'meat-friend': '고기 좋아하는 덩치 친구 이야기를 들었어요',
    'rival-cup': '칼 대신 잔으로 겨루던 맞수 이야기를 들었어요',
    'cabin-boy': '샹크스도 꼬마 견습 선원이었대요',
    'home-port': '나한테도 돌아갈 곳이 있다고 했어요',
    'see-you': '뱃사람은 잘 가 대신 또 보자고 한대요',
    'star-guide': '별 보고 길 찾는 법을 배웠어요',
    'tall-king': '허풍 주점의 허풍왕이 됐어요',
    'nap-buddy': '갑판 낮잠이 최고라는 데 맞장구쳤어요',
    'spinach-no': '시금치는 질색이래요',
    'laugh-why': '왜 늘 웃는지 들었어요',
    'anchor-why': '이 마을에 닻을 내린 이유를 조금 들었어요',
    'sail-talked': '같이 갈 항로를 다시 이야기했어요',
    'date-talk': '내 방에서 보낸 시간을 이야기했어요',
    'my-port': '샹크스의 돌아올 항구가 되기로 했어요',
  },
  talks: [
    {
      id: 'sea-or-land',
      open: '{me}, 너는 바다가 좋아, 땅이 좋아? 대답 따라 잔 크기가 달라진다. 하하!',
      replies: [
        { say: '당연히 바다지!', tier: 'great', remember: 'sea-lover', answer: ['다하하! 그럴 줄 알았다. 눈빛이 벌써 수평선 쪽이야.', '오늘 네 잔은 제일 큰 걸로 하지. 우유지만.'] },
        { say: '땅이 편해. 흔들리는 건 싫어', tier: 'good', remember: 'land-lover', answer: ['정직해서 좋다. 땅 위 친구도 내 친구지.', '배는 내가 몰면 돼. 넌 항구에서 손만 흔들어 줘.'] },
        { say: '둘 다 그냥 그래', tier: 'meh', face: 'think', answer: '음? 그럼 주점이 딱이네. 여긴 바다도 땅도 아닌 웃음 위거든.' },
      ],
    },
    {
      id: 'party-or-quiet',
      open: '오늘 밤 잔치를 열까 하는데… 너는 시끌벅적한 게 좋아, 조용한 게 좋아?',
      replies: [
        { say: '잔치! 다 불러!', tier: 'great', remember: 'party-yes', answer: ['좋다! 볼리바스한테 심판 서라고 하고, 의자는 발키리한테 미리 빌려 둬야지.', '…부서지면 또 혼나겠지만. 하하하!'] },
        { say: '조용히 한잔이 좋아', tier: 'good', remember: 'quiet-night', face: 'smile', answer: ['그것도 좋지. 잔치 끝나고 남은 사람끼리 마시는 한 잔.', '그게 제일 맛있거든. 소리 없이 잔만 부딪치는 거.'] },
        { say: '피곤해서 잘래', tier: 'meh', face: 'calm', answer: '그래, 푹 자. 잔치는 내일도 열 수 있다. 바다는 안 도망가.' },
      ],
    },
    {
      id: 'dream',
      open: '배 위에선 다들 꿈 이야기를 해. 너는 꿈이 뭐야, {me}?',
      replies: [
        { say: '마을 최고가 되는 거!', tier: 'great', remember: 'big-dream', answer: ['다하하! 큰 꿈이다. 비웃는 놈 있으면 데려와.', '내가 같이 웃어 줄게. 비웃음 말고, 응원하는 웃음으로.'] },
        { say: '그냥 즐겁게 사는 거', tier: 'good', face: 'smile', answer: '그게 제일 어려운 꿈이야. 나도 아직 항해 중이거든.' },
        { say: '꿈 같은 건 없어', tier: 'meh', face: 'think', answer: ['없으면 찾으면 되지. 서두를 거 없다.', '바다는 넓고, 꿈은 대개 엉뚱한 섬에서 주워 오는 거야.'] },
      ],
    },
    {
      id: 'hat',
      open: '벽에 걸린 저 낡은 모자 말이야. 내 거 아니다. 맡겨 둔 거지.',
      replies: [
        { say: '누구한테 맡긴 건데?', tier: 'great', remember: 'hat-story', face: 'smile', answer: ['언젠가 큰 사람이 돼서 돌려주러 올 녀석. 그날까진 내가 지킨다.', '…하하, 너무 진지했나? 우유 한 잔 더 줄게.'] },
        { say: '한번 써 봐도 돼?', tier: 'good', face: 'laugh', answer: ['하하하! 그건 안 돼. 주인이 정해진 모자거든.', '그 대신 내 망토는 빌려줄 수 있다. 좀 크지만.'] },
        { say: '그냥 버리지 그래', tier: 'meh', face: 'calm', answer: '…버릴 수 없는 것도 있는 법이야. 언젠가 너도 알게 될 거다.' },
      ],
    },
    {
      id: 'milk',
      open: '낮엔 술을 안 판다. 대신 우유가 있지. {me}, 우유로 건배할래?',
      replies: [
        { say: '건배! 우유도 좋아', tier: 'great', remember: 'milk-toast', answer: ['다하하! 그래야 내 친구지.', '잔이 뭐든 웃으면서 부딪치면 그게 잔치야.'] },
        { say: '꿀 넣어 줘', tier: 'good', answer: '오, 단골 주문이네. 꿀 한 숟갈, 아니 두 숟갈. 오늘은 특별히.' },
        { say: '우유는 좀…', tier: 'meh', face: 'think', answer: '하하, 그럼 주스다. 마시는 건 뭐든 좋아. 같이 마시는 게 중요하지.' },
      ],
    },
    {
      id: 'friends',
      open: '{me}, 보물섬이 있다면 뭘 찾고 싶어? 금? 보석?',
      replies: [
        { say: '같이 갈 친구들', tier: 'great', remember: 'friend-first', face: 'wow', answer: ['…하하하! 너 정말 마음에 든다.', '그거면 섬 하나쯤 안 찾아도 되겠다. 이미 찾았잖아.'] },
        { say: '당연히 금이지', tier: 'good', face: 'laugh', answer: '솔직하네! 금도 좋지. 찾으면 주점에서 한턱내는 거다?' },
        { say: '섬은 무서워', tier: 'meh', face: 'calm', answer: ['무서운 게 정상이야. 그래서 혼자 안 가는 거다.', '다 같이 가면 무섭지 않거든. 시끄러워서 무서울 틈이 없어.'] },
      ],
    },
    {
      id: 'big-catch',
      open: '먼바다엔 배만 한 고기가 산대. 허풍 같지? 근데 진짜야. 아마도.',
      replies: [
        { say: '내가 잡아 올게!', tier: 'great', remember: 'fish-big', answer: ['다하하! 그 말 기억해 둔다.', '잡으면 마을 잔치, 못 잡으면 네가 설거지다. 공평하지?'] },
        { say: '본 적 있어?', tier: 'good', face: 'think', answer: ['꼬리만 봤다. 배가 통째로 기울었지.', '그날 나도 처음으로 놀랐다. 선원들은 내가 놀란 데 더 놀랐고.'] },
        { say: '허풍이네', tier: 'meh', face: 'laugh', answer: '하하, 여긴 허풍 주점이야. 허풍인지 아닌지는 바다만 알지.' },
      ],
    },
    {
      id: 'one-hand',
      open: '한 손으로 생선 굽는 거 보여 줄까? 요령만 알면 쉽다.',
      replies: [
        { say: '보여 줘! 배울래', tier: 'great', remember: 'one-hand', answer: ['좋아. 뒤집을 때 손목만 쓰는 거야. 봐, 한 번에.', '…하하, 넌 두 손 써도 된다. 반칙 아니야.'] },
        { say: '두 손이 더 편하지 않아?', tier: 'good', face: 'smile', answer: '편하지. 근데 한 손이 비어 있으면 친구 어깨를 칠 수 있거든.' },
        { say: '생선 냄새 싫어', tier: 'meh', face: 'sorry', answer: '이런, 주점 주인한테 큰일 날 소리다. 문 쪽 자리 줄게. 바람 잘 통해.' },
      ],
    },
    {
      id: 'scar',
      open: '눈가 흉터? 다들 물어보더라. 궁금해?',
      replies: [
        { say: '말하기 싫으면 안 해도 돼', tier: 'great', face: 'smile', answer: ['…하하. 그 말이 제일 듣기 좋다.', '언젠가 술 말고 우유 마시면서 해 주지. 별 얘기 아니지만.'] },
        { say: '응, 무슨 일이었어?', tier: 'good', face: 'think', answer: ['옛날에 무모한 녀석한테 받은 거야.', '지금은 웃으면서 말할 수 있다. 그거면 됐지.'] },
        { say: '별로 안 궁금해', tier: 'meh', face: 'laugh', answer: '하하하! 그런 손님이 제일 편하다. 잔이나 비우자.' },
      ],
    },
    {
      id: 'crew',
      open: '배 한 척에 꼭 있어야 할 사람이 누군 줄 알아? 선장? 아니야.',
      replies: [
        { say: '요리사!', tier: 'great', remember: 'old-crew', answer: ['다하하! 정답이다. 밥 맛있는 배는 폭풍도 버텨.', '내 옛 배 요리사도 그랬지. 국자로 갑판을 다스렸어.'] },
        { say: '음악 하는 사람?', tier: 'good', answer: '오, 그것도 맞다. 노래 없는 항해는 길거든. 미쿠라도 태우고 싶다니까.' },
        { say: '돈 관리하는 사람', tier: 'meh', face: 'think', answer: '…미스 포츈 같은 말을 하네. 틀린 건 아닌데 재미가 없잖아. 하하.' },
      ],
    },
    {
      id: 'storm',
      open: '폭풍 오는 날 선장이 제일 먼저 하는 일이 뭔지 알아?',
      replies: [
        { say: '기다리는 거?', tier: 'great', remember: 'storm-wait', answer: ['그래! 바다를 아는 놈은 기다릴 줄 안다.', '넌 선장 감이네, {me}. 모자는 없지만.'] },
        { say: '돛을 접는 거?', tier: 'good', face: 'think', answer: '그것도 하지. 근데 그 전에 선원들 얼굴부터 본다. 겁먹은 놈 없나 하고.' },
        { say: '그냥 나가는 거!', tier: 'meh', face: 'wow', answer: ['하하하! 용감한 건 좋은데 그러다 고기밥 된다.', '다음엔 나랑 같이 기다리자. 기다리는 것도 용기야.'] },
      ],
    },
    {
      id: 'tall-tale',
      open: '허풍 주점 규칙 알지? 오늘 들은 최고의 허풍 하나 해 봐. 들어 줄게.',
      replies: [
        { say: '고래랑 팔씨름해서 이겼어', tier: 'great', remember: 'tall-king', face: 'laugh', answer: ['다하하하! 좋다, 오늘의 허풍왕은 너다!', '고래한테 내 안부도 전해 줘. 다음엔 나랑 붙자고.'] },
        { say: '잠깐, 생각 좀 해 볼게', tier: 'good', answer: '천천히 해. 좋은 허풍은 뜸을 들여야 맛있거든. 우유 식기 전에만.' },
        { say: '난 거짓말 못 해', tier: 'meh', face: 'smile', answer: '하하, 그런 녀석이 제일 무서운 허풍쟁이였어. 뭐, 그것도 좋지.' },
      ],
    },
    {
      id: 'promise-sail',
      when: { ch: 3 },
      open: '{me}, 언젠가 배 한 척 제대로 띄우면… 같이 갈래? 진지하게 묻는 거다.',
      replies: [
        { say: '갈게. 약속이야', tier: 'great', remember: 'sail-with', face: 'shy', answer: ['…하하. 약속했다? 선장은 약속 안 잊는다.', '첫 자리는 네 거다. 갑판 제일 앞, 바람 제일 먼저 맞는 데.'] },
        { say: '어디로 가는데?', tier: 'good', answer: '정한 데 없다. 그게 재밌는 거지. 가 보고 싶은 데 생기면 말해.' },
        { say: '멀미할 것 같아', tier: 'meh', face: 'laugh', answer: '하하하! 멀미약은 메르시 선생한테 잔뜩 받아 두마. 그럼 문제없지?' },
      ],
    },
    {
      id: 'first-mate',
      open: '옛 배에 말수 적은 부선장이 있었다. 내가 사고 치면 늘 뒤에서 수습했지.',
      replies: [
        { say: '샹크스 사고 많이 쳤구나', tier: 'great', remember: 'first-mate', face: 'laugh', answer: ['다하하하! 들켰네. 하루에 세 번은 쳤다.', '그 친구는 한숨 한 번에 다 정리했어. 든든했지.'] },
        { say: '지금도 연락해?', tier: 'good', remember: 'first-mate', face: 'smile', answer: ['바람 편에 가끔. 그 친구는 편지도 짧아.', '"잘 있다." 그게 다야. 그래도 그거면 충분하거든.'] },
        { say: '부선장이 선장 하지', tier: 'meh', face: 'think', answer: '하하, 그 친구도 그 말 들으면 웃을 거다. 아니, 한숨을 쉬겠구나.' },
      ],
    },
    {
      id: 'meat-friend',
      open: '고기 굽는 냄새만 나면 어디서든 나타나는 덩치 친구가 있었다. 지금 생각해도 웃기다.',
      replies: [
        { say: '그 친구 여기 오면 좋겠다', tier: 'great', remember: 'meat-friend', face: 'laugh', answer: ['오면 큰일 난다! 주점 고기가 하룻밤에 바닥나.', '…그래도 오면 좋겠네. 하하, 그 친구 웃음은 배를 흔들었거든.'] },
        { say: '고기 아직도 좋아해?', tier: 'good', remember: 'meat-friend', answer: '평생 손에서 고기를 안 놓을 녀석이다. 뼈다귀 들고 잘 정도니까.' },
        { say: '너무 많이 먹는 거 아냐?', tier: 'meh', face: 'calm', answer: '하하, 그 친구한텐 그게 기운이야. 잘 먹는 놈이 잘 버티지.' },
      ],
    },
    {
      id: 'rival-cup',
      open: '옛날에 날마다 결투하자고 찾아오던 맞수가 있었다. 결국 어떻게 됐는지 알아?',
      replies: [
        { say: '술 마시면서 친해졌지?', tier: 'great', remember: 'rival-cup', face: 'wow', answer: ['어떻게 알았어? 다하하! 칼 대신 잔을 부딪쳤지.', '이긴 놈도 진 놈도 없이 새벽까지. 그게 제일 좋은 승부야.'] },
        { say: '네가 이겼어?', tier: 'good', remember: 'rival-cup', face: 'think', answer: '글쎄. 그 친구는 자기가 이겼다고 하겠지. 그럼 그런 걸로 하자. 하하.' },
        { say: '무섭다…', tier: 'meh', face: 'calm', answer: '하하, 생긴 건 무서워도 속은 조용한 녀석이었다. 지금쯤 어디서 낮술 하겠지.' },
      ],
    },
    {
      id: 'cabin-boy',
      open: '나도 처음부터 선장이었던 건 아니다. 꼬마 견습 선원 시절이 있었지.',
      replies: [
        { say: '꼬마 샹크스 궁금해!', tier: 'great', remember: 'cabin-boy', face: 'shy', answer: ['하하… 시끄럽고, 겁 없고, 맨날 혼났지.', '대단한 선장 밑에서 갑판만 닦았다. 그때 배운 게 지금도 다 쓰여.'] },
        { say: '무슨 일 했어?', tier: 'good', remember: 'cabin-boy', answer: '갑판 닦기, 감자 깎기, 밧줄 감기. 그리고 어른들 허풍 듣기. 그게 제일 좋았다.' },
        { say: '상상이 안 돼', tier: 'meh', face: 'laugh', answer: '하하하! 나도 안 된다. 거울 볼 때마다 이 아저씨 누구냐 싶거든.' },
      ],
    },
    {
      id: 'cold-eyes',
      open: '어젯밤 손님 하나가 남의 친구를 놀리더라. 그래서 조용히 한마디 했지.',
      replies: [
        { say: '뭐라고 했는데?', tier: 'great', face: 'calm', answer: ['"그 말, 거둬라." 그 한마디.', '주점이 조용해지더라. …하하, 그다음엔 다 같이 우유 마셨다.'] },
        { say: '샹크스도 화를 내?', tier: 'good', face: 'think', answer: ['소리는 안 지른다. 그럴 필요가 없거든.', '친구를 건드리는 건, 웃고 넘길 일이 아니야. 그것뿐이다.'] },
        { say: '그냥 웃고 넘기지', tier: 'meh', face: 'sorry', answer: '웃는 거 좋아하지. 근데 친구 일엔 웃음이 안 나온다. 그건 못 고쳐.' },
      ],
    },
    {
      id: 'arm',
      open: '{me}, 한 손이라 불편하지 않냐고 다들 묻는데… 너는 안 묻네.',
      replies: [
        { say: '샹크스는 다 잘하잖아', tier: 'great', face: 'laugh', answer: ['다하하! 그렇지? 잔 닦기, 매듭, 생선 뒤집기까지.', '잃은 게 있으면 얻은 것도 있는 거야. 난 남는 장사를 했다.'] },
        { say: '물어봐도 돼?', tier: 'good', face: 'smile', answer: ['물어봐도 되는데, 대답은 시시하다.', '새 바람에 걸어 본 거야. 그 바람이 지금 잘 불고 있으면 됐지.'] },
        { say: '솔직히 궁금하긴 해', tier: 'meh', face: 'calm', answer: '하하, 그럼 언젠가 바다가 잔잔한 날에. 오늘은 파도가 좀 높다.' },
      ],
    },
    {
      id: 'spinach',
      open: '{me}, 비밀 하나 알려 줄까? 이 몸은 무서운 게 딱 하나 있다.',
      replies: [
        { say: '시금치지?', tier: 'great', remember: 'spinach-no', face: 'wow', answer: ['…어떻게 알았어! 그 쌉싸름한 초록이 말이야.', '바다 괴물보다 무섭다. 진짜다. 이건 허풍 아니야.'] },
        { say: '폭풍?', tier: 'good', face: 'think', answer: '폭풍은 기다리면 지나가. 근데 접시에 오른 시금치는 안 지나가거든.' },
        { say: '선장이 무서운 게 있어?', tier: 'meh', face: 'laugh', answer: '있다마다. 하하, 맞혀 보라고 한 건데. 힌트는 초록색이다.' },
      ],
    },
    {
      id: 'flowers',
      open: '주점 개업 날 누가 꽃다발을 보냈는데, 어디 둘지 몰라서 사흘을 들고 다녔다.',
      replies: [
        { say: '하하, 샹크스답다', tier: 'great', face: 'laugh', answer: ['그치? 결국 프리렌한테 맡겼다. 빵집 창가가 더 어울려서.', '꽃은 나한테 영 안 어울리거든. 군밤 봉지면 몰라도.'] },
        { say: '꽃 싫어해?', tier: 'good', face: 'think', answer: ['싫다기보단… 받으면 쑥스럽다. 내 손엔 잔이 더 익숙해.', '하하, 이상하지? 선장이 꽃 앞에서 쩔쩔매는 게.'] },
        { say: '꽃병에 꽂으면 되지', tier: 'meh', face: 'calm', answer: '주점에 꽃병이 없거든. 잔에 꽂았다가 손님이 마실 뻔했다.' },
      ],
    },
    {
      id: 'chestnut',
      open: '가을 화로에 군밤 터지는 소리, 그거 대포 소리보다 좋다. 너는 군밤 좋아해?',
      replies: [
        { say: '엄청 좋아해!', tier: 'great', face: 'laugh', answer: ['다하하! 오늘부터 군밤 동지다.', '화로 옆자리는 동지한테만 준다. 쓰레쉬가 앉아 있어도 비키라 할게.'] },
        { say: '까는 게 귀찮아', tier: 'good', face: 'smile', answer: '그럼 내가 까 주지. 한 손으로 까는 데는 마을에서 내가 일등이다.' },
        { say: '고구마가 더 좋아', tier: 'meh', face: 'think', answer: '하하, 고구마파였구나. 뭐, 화로는 넓으니까 같이 구우면 되지.' },
      ],
    },
    {
      id: 'laugh-why',
      open: '{me}, 내가 왜 맨날 웃는지 알아? 다들 생각이 없어서라는데.',
      replies: [
        { say: '웃으면 남도 웃으니까?', tier: 'great', remember: 'laugh-why', face: 'shy', answer: ['…하하. 정답에 꽤 가깝다.', '울 일 많은 바다에서 선장이 웃으면, 선원들이 버티거든. 그게 다야.'] },
        { say: '진짜 생각 없어서 아냐?', tier: 'good', face: 'laugh', answer: '다하하하! 반은 맞다. 나머지 반은 비밀이다.' },
        { say: '가끔 시끄러워', tier: 'meh', face: 'sorry', answer: '하하… 볼리바스도 그러더라. 조금 줄여 볼게. 아마 못 하겠지만.' },
      ],
    },
    {
      id: 'home-port',
      open: '뱃사람한텐 돌아갈 항구가 있어야 해. {me}, 너한텐 그런 데 있어?',
      replies: [
        { say: '이 마을이 그런 곳이야', tier: 'great', remember: 'home-port', face: 'smile', answer: ['…그래. 그럼 우린 같은 항구를 쓰는 사이네.', '다하하! 잔은 늘 채워 둘게. 언제 들어와도.'] },
        { say: '아직 찾는 중이야', tier: 'good', remember: 'home-port', face: 'think', answer: ['찾는 동안은 여기 정박해. 주점은 임시 항구로도 괜찮거든.', '그러다 정드는 거다. 나처럼.'] },
        { say: '그런 거 필요 없어', tier: 'meh', face: 'calm', answer: '하하, 젊을 땐 나도 그랬다. 근데 바람은 늘 돌아올 데를 가르쳐 주더라.' },
      ],
    },
    {
      id: 'anchor-why',
      open: '왜 먼바다 선장이 이 작은 마을에 주점을 열었냐고? …궁금해?',
      replies: [
        { say: '응, 진짜 궁금해', tier: 'great', remember: 'anchor-why', face: 'think', answer: ['떠나는 배는 많은데, 반겨 줄 항구는 적더라.', '그래서 내가 항구가 돼 보기로 했지. 하하, 거창하게 말하면 그렇다.'] },
        { say: '바다가 지겨워서?', tier: 'good', face: 'laugh', answer: '하하하! 바다가 지겨운 날은 안 온다. 그냥 닻 내릴 때가 된 거지.' },
        { say: '술값이 싸서?', tier: 'meh', face: 'laugh', answer: '다하하! 그건 맞다. 근데 우유는 더 싸다. 그래서 우유를 판다.' },
      ],
    },
    {
      id: 'see-you',
      open: '뱃사람은 헤어질 때 "잘 가"라고 안 한다. 뭐라고 하는 줄 알아?',
      replies: [
        { say: '"또 보자"?', tier: 'great', remember: 'see-you', face: 'laugh', answer: ['다하하! 맞다. 잘 가는 끝이고, 또 보자는 약속이거든.', '그러니 너도 나갈 때 꼭 그렇게 말해라.'] },
        { say: '"순풍을 빈다"?', tier: 'good', face: 'smile', answer: '오, 멋진 말 아는구나. 그것도 좋다. 근데 우린 더 짧게 한다.' },
        { say: '그냥 손 흔들지', tier: 'meh', face: 'calm', answer: '하하, 손 흔드는 것도 좋지. 한 손이면 충분하다. 나처럼.' },
      ],
    },
    {
      id: 'stars',
      open: '{me}, 밤하늘 보면서 길 찾는 법 알아? 배 위에선 별이 지도야.',
      replies: [
        { say: '가르쳐 줘!', tier: 'great', remember: 'star-guide', answer: ['좋아. 저기 제일 안 움직이는 별 보이지? 그게 북쪽이다.', '길 잃으면 그 별만 찾아. 그리고 주점 불빛을 찾고. 하하.'] },
        { say: '지도 쓰면 되잖아', tier: 'good', face: 'laugh', answer: '하하, 지도는 젖으면 끝이다. 별은 안 젖거든.' },
        { say: '별은 다 똑같아 보여', tier: 'meh', face: 'think', answer: '처음엔 다 그래. 자꾸 보다 보면 친구 얼굴처럼 구분된다.' },
      ],
    },
    {
      id: 'nap',
      open: '한낮에 갑판에 드러누워 자는 낮잠… 그게 인생 최고의 사치다. 동의하지?',
      replies: [
        { say: '완전 동의해', tier: 'great', remember: 'nap-buddy', face: 'laugh', answer: ['다하하! 낮잠 동지가 하나 더 늘었다.', '주점 뒤 해먹 빌려줄게. 쓰레쉬한테는 비밀이다.'] },
        { say: '일은 언제 해?', tier: 'good', face: 'think', answer: '일어나서 하지. 잘 자야 잘 웃고, 잘 웃어야 손님이 온다. 그게 장사다.' },
        { say: '낮잠은 시간 낭비야', tier: 'meh', face: 'calm', answer: '하하, 바쁜 사람이네. 그럼 내가 네 몫까지 자 둘게.' },
      ],
    },
    {
      id: 'volibas-contest',
      open: '이번 달 허풍 경연에서 볼리바스가 또 심판이다. 순경이 심판이라 다들 몸을 사리지.',
      replies: [
        { say: '나도 나갈래!', tier: 'great', face: 'laugh', answer: ['다하하! 좋다, 참가자 명단에 일등으로 적는다.', '규칙은 하나. 웃기면 이기고, 우기면 더 이긴다.'] },
        { say: '볼리바스 공정해?', tier: 'good', face: 'think', answer: ['엄청 공정하지. 근데 내 웃음소리만 반칙이래.', '웃는 게 무슨 반칙이냐고 했더니 수첩에 적더라. 하하.'] },
        { say: '구경만 할게', tier: 'meh', face: 'smile', answer: '구경꾼도 중요하다. 박수가 커야 허풍도 커지거든.' },
      ],
    },
    {
      id: 'carpenter-chairs',
      open: '어젯밤 잔치에서 의자가 또 둘 부서졌다. 발키리 얼굴을 어떻게 보지?',
      replies: [
        { say: '같이 사과하러 가 줄게', tier: 'great', face: 'shy', answer: ['…진짜? 고맙다. 군밤 한 봉지 들고 가자.', '발키리는 화내면서도 의자는 더 튼튼하게 만들어 주거든. 하하.'] },
        { say: '앉을 때 살살 앉아', tier: 'good', face: 'laugh', answer: '나는 살살 앉았지! 위에서 춤춘 녀석들이 문제다. 다하하!' },
        { say: '바닥에 앉으면 되지', tier: 'meh', face: 'think', answer: '갑판 시절엔 그랬지. 근데 손님한텐 그럴 수 없잖아.' },
      ],
    },
    {
      id: 'thresh-fireplace',
      open: '겨울만 되면 쓰레쉬가 벽난로 앞자리를 차지한다. 랜턴까지 옆에 두고.',
      replies: [
        { say: '샹크스가 양보해 주는구나', tier: 'great', face: 'smile', answer: ['양보라기보단… 그 사람도 어디 쉴 데가 있어야지.', '주점은 그런 데다. 좀 으스스한 손님도 손님이야. 하하.'] },
        { say: '비키라고 해!', tier: 'good', face: 'laugh', answer: '하하하! 해 봤지. 수집품 자랑을 한 시간 들었다. 다시는 안 한다.' },
        { say: '그 사람 좀 무서워', tier: 'meh', face: 'calm', answer: '웃는 게 좀 서늘하지. 그래도 군밤 하나 주면 잠잠해진다.' },
      ],
    },
    {
      id: 'frieren-milk',
      open: '프리렌은 주점에 와서 우유만 시키고 한참 앉아 있다. 말도 거의 안 해.',
      replies: [
        { say: '그것도 좋은 손님이야', tier: 'great', face: 'smile', answer: ['그래! 조용한 손님은 주점에 바닥짐 같은 거야.', '배가 안 뒤집히게 해 주지. 하하, 그 사람한테는 비밀이다.'] },
        { say: '무슨 생각 할까?', tier: 'good', face: 'think', answer: '아주 오래된 일행 생각 아닐까. 그 눈빛, 내가 좀 알거든.' },
        { say: '심심하겠다', tier: 'meh', face: 'calm', answer: '심심한 것도 쉬는 거다. 그 사람은 쉬는 데 아주 능숙하더라.' },
      ],
    },
    {
      id: 'realtor-bar',
      open: '신형만 씨가 퇴근하면 바 끝에 앉는다. 영업 무용담이 내 바다 얘기보다 길어.',
      replies: [
        { say: '샹크스가 들어 주는구나', tier: 'great', face: 'laugh', answer: ['당연하지! 남의 허풍 듣는 게 내 낙이다.', '계약 하나 따낸 얘기가 고래 잡은 얘기보다 짜릿하더라. 다하하!'] },
        { say: '집에 일찍 가야지', tier: 'good', face: 'think', answer: '그러니까 한 잔만 주고 보낸다. 미선 씨 잔소리는 폭풍보다 무섭대.' },
        { say: '지루하지 않아?', tier: 'meh', face: 'calm', answer: '하하, 지루한 허풍은 없다. 듣는 사람이 웃을 준비만 돼 있으면.' },
      ],
    },
    {
      id: 'rose-race',
      open: '미스 포츈이 다음 장날에 누가 큰 고기 낚나 내기하자더라. 넌 누구 편이야?',
      replies: [
        { say: '당연히 샹크스 편!', tier: 'great', face: 'laugh', answer: ['다하하! 의리 있네. 이기면 군밤 한 봉지 네 거다.', '지면…? 하하, 그건 미스 포츈 장부에 적히겠지.'] },
        { say: '미스 포츈이 이길 듯', tier: 'good', face: 'wow', answer: '하하, 냉정하네! 맞아, 그 사람 낚시는 계산이 정확하거든. 그래도 해 본다.' },
        { say: '둘 다 그만 싸워', tier: 'meh', face: 'smile', answer: '싸우는 거 아니다. 바다 사람끼리 노는 거야. 걱정 마.' },
      ],
    },
    {
      id: 'maehwa-snack',
      open: '예림이는 화투판 끝나면 꼭 주점에 들러서 안주를 나눠 먹는다. 그 사람 눈치 대단하지.',
      replies: [
        { say: '둘이 잘 맞나 봐', tier: 'great', face: 'smile', answer: ['판 읽는 사람이랑 바다 읽는 사람이니까.', '둘 다 기다릴 줄 알거든. 말 안 해도 통하는 게 있다.'] },
        { say: '무슨 안주 먹어?', tier: 'good', face: 'laugh', answer: '이긴 날엔 매운 거, 진 날엔 군밤. 표정 안 봐도 접시로 다 안다.' },
        { say: '화투 좀 배우고 싶어', tier: 'meh', face: 'think', answer: '하하, 그건 나한테 말고 예림이한테. 난 패만 보면 표정에 다 나온다.' },
      ],
    },
    {
      id: 'gamble-line',
      open: '{me}, 카지노 테이블 앉을 때 내 규칙 하나 알려 줄까?',
      replies: [
        { say: '알려 줘', tier: 'great', face: 'smile', answer: ['웃으면서 일어날 수 있을 만큼만 건다.', '바다도 판도 욕심내면 뒤집히거든. 다하하, 이건 진짜다.'] },
        { say: '크게 걸어야 크게 따지', tier: 'meh', face: 'calm', answer: '하하, 그런 녀석들이 다음 날 주점에서 우유를 외상으로 마시더라.' },
        { say: '난 구경만 해', tier: 'good', face: 'laugh', answer: '그게 제일 남는 장사다. 구경꾼은 절대 안 잃거든.' },
      ],
    },
    {
      id: 'flag',
      open: '주점 간판 새로 그리려는데, 웃는 해골 대신 뭘 넣을까? 너라면?',
      replies: [
        { say: '웃는 잔 두 개!', tier: 'great', face: 'laugh', answer: ['다하하! 좋다, 그걸로 한다.', '잔이 하나면 외롭잖아. 둘이 부딪쳐야 소리가 나지.'] },
        { say: '빨간 머리 그려', tier: 'good', face: 'shy', answer: '하하, 그건 좀 쑥스럽네. 근데 손님들이 길은 안 잃겠다.' },
        { say: '그냥 글씨만', tier: 'meh', face: 'think', answer: '깔끔하네. 근데 그럼 허풍 주점이 아니라 조용한 주점 같잖아.' },
      ],
    },
    {
      id: 'love-port',
      when: { love: 'dating' },
      open: '{me}, 요즘 바다에 나가면 자꾸 뒤를 돌아본다. 항구에 누가 서 있나 하고.',
      replies: [
        { say: '내가 서 있을게', tier: 'great', remember: 'my-port', face: 'shy', answer: ['…그래. 그럼 나는 무조건 돌아온다.', '선장한테 돌아올 이유가 생겼네. 하하, 이거 꽤 무겁다. 좋은 쪽으로.'] },
        { say: '같이 타면 되잖아', tier: 'good', face: 'laugh', answer: ['다하하! 그것도 맞다. 그럼 돌아볼 필요도 없지.', '근데 가끔은 네가 기다려 주는 것도 좋을 것 같다.'] },
        { say: '뒤 보다 넘어질라', tier: 'meh', face: 'laugh', answer: '하하하! 그건 걱정 마. 한 손으로도 난간은 잘 잡는다.' },
      ],
    },
    {
      id: 'chart-update',
      when: { ch: 5 },
      open: '새 해도에 표시 하나 더 했다. 이 마을 자리에 작은 등불 하나.',
      replies: [
        { say: '그게 무슨 뜻이야?', tier: 'great', face: 'smile', answer: ['돌아올 항구라는 뜻이다. 옛날 해도엔 없던 표시야.', '…네 덕분에 생긴 거지. 하하, 쑥스럽네.'] },
        { say: '내 집도 그려 줘', tier: 'good', face: 'laugh', answer: '그려 줬다. 등불 바로 옆, 제일 밝은 데. 잘 봐.' },
        { say: '해도가 너무 낡았다', tier: 'meh', face: 'calm', answer: '낡은 게 멋이야. 바닷물 먹은 만큼 이야기가 많은 거다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 오는 날은 주점이 꽉 차지. {me}, 젖었으면 난롯가로 와.',
      replies: [
        { say: '비 오는 날 좋아', tier: 'great', answer: ['다하하! 나도다. 빗소리가 박수 소리 같거든.', '오늘은 잔치 각이다. 다들 비 피하러 올 테니까.'] },
        { say: '수건 좀 줄래?', tier: 'good', face: 'laugh', answer: '여기. 망토로 닦아 줄까 했는데 그건 더 젖었다. 하하.' },
        { say: '빨리 그쳤으면', tier: 'meh', face: 'calm', answer: '그칠 거야. 비는 늘 그치지. 그동안 우유나 데워 줄게.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm', time: ['evening', 'night'] },
      open: '이 바람 소리 들려? 오늘 밤은 배들 다 묶었다. 이런 날은 덧문 걸고 노래나 하는 거야.',
      replies: [
        { say: '노래 시작해!', tier: 'great', answer: ['다하하! 좋다, 뱃노래로 간다.', '박자는 바람이 맞춰 줄 거다. 크게!'] },
        { say: '배는 괜찮을까?', tier: 'good', face: 'think', answer: '매듭은 내가 직접 묶었다. 한 손이지만 두 손보다 단단해. 걱정 마.' },
        { say: '무서워…', tier: 'meh', face: 'smile', answer: '여기 앉아. 폭풍은 밖에 있고, 우린 안에 있다. 그거면 됐지.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다! 바다에 눈 내리는 거 본 적 있어? 소리가 하나도 안 나.',
      replies: [
        { say: '보고 싶어', tier: 'great', remember: 'sea-lover', answer: ['그럼 이따 같이 선착장 가자.', '따뜻한 우유 두 잔 챙겨서. 하나는 한 손에, 하나는 네 손에.'] },
        { say: '눈사람 만들자', tier: 'good', face: 'laugh', answer: '좋지! 망토 둘러 주고 빨간 머리는 홍당무로 하자. 다하하!' },
        { say: '추워서 싫어', tier: 'meh', face: 'calm', answer: '하하, 그럼 난롯가 명당을 내주지. 쓰레쉬한테는 비밀이다.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny', time: 'day' },
      open: '맑다! 이런 날은 수평선 끝까지 보인다. {me}, 저 너머가 궁금하지 않아?',
      replies: [
        { say: '궁금해! 가 보고 싶어', tier: 'great', answer: ['다하하! 그 눈빛 좋다.', '언젠가 같이 가자. 오늘은 갑판에서 낮잠부터.'] },
        { say: '여기서 보는 게 좋아', tier: 'good', face: 'smile', answer: '그것도 좋지. 멀리 보는 데는 땅이 더 편하다.' },
        { say: '눈부셔', tier: 'meh', face: 'laugh', answer: '하하, 내 모자… 아니, 맡겨 둔 모자라도 있으면 씌워 줄 텐데.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날 바다는 뭘 숨기고 있다. 그래서 큰 놈이 잘 물지. 비밀이다.',
      replies: [
        { say: '지금 바로 낚으러 갈래', tier: 'great', answer: ['다하하! 바로 그거다.', '잡으면 첫 점은 나한테. 정보값이다.'] },
        { say: '진짜야?', tier: 'good', face: 'think', answer: '반은 진짜, 반은 허풍. 어느 쪽인지는 네가 확인해 봐.' },
        { say: '흐린 날은 기분이 처져', tier: 'meh', face: 'smile', answer: '그럼 주점에서 떠들자. 구름은 위에, 웃음은 여기.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽 물때다. 이 시간에 깨어 있는 놈은 뱃사람 아니면 잠 못 든 놈이지. 넌 어느 쪽?',
      replies: [
        { say: '뱃사람 쪽!', tier: 'great', answer: ['다하하! 좋다. 그럼 같이 닻줄 좀 감자.', '새벽 바다는 말이 없어. 그래서 좋다.'] },
        { say: '잠이 안 와서', tier: 'good', face: 'smile', answer: '그럼 데운 우유다. 꿀 한 숟갈 넣으면 금방 눈이 감길 거야.' },
        { say: '그냥 지나가던 길', tier: 'meh', face: 'calm', answer: '하하, 새벽 산책도 좋지. 바다 냄새 실컷 맡고 가.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening', weather: ['sunny', 'cloudy'] },
      open: '저녁 바람에 소금 냄새가 섞였다. 주점 문 활짝 열 시간이다! 첫 손님은 너다, {me}.',
      replies: [
        { say: '첫 잔은 내가 살게', tier: 'great', answer: ['다하하! 손님이 주인한테 사는 주점은 여기뿐이다.', '좋아, 받지. 대신 두 번째는 내가 산다.'] },
        { say: '오늘 메뉴 뭐야?', tier: 'good', face: 'smile', answer: '생선구이에 군밤. 그리고 허풍 한 접시. 그게 늘 메뉴다.' },
        { say: '잠깐만 있다 갈게', tier: 'meh', face: 'calm', answer: '잠깐이 길어지는 게 주점이다. 하하, 앉아 봐.' },
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
      id: 'op-spring',
      when: { season: 'spring', time: ['day', 'evening'] },
      open: '봄이다! 돛 손볼 때지. 겨우내 웅크린 배도 기지개를 켜야 하거든.',
      replies: [
        { say: '돛 꿰매는 거 도와줄게', tier: 'great', answer: ['다하하! 고맙다. 바늘은 네가, 매듭은 내가.', '한 손 두 손 합치면 세 손이다. 금방 끝나.'] },
        { say: '봄 도다리 먹고 싶다', tier: 'good', face: 'laugh', answer: '하하, 그 말 기다렸다! 오늘 저녁 구워 둘게.' },
        { say: '봄은 졸려', tier: 'meh', face: 'smile', answer: '봄 낮잠은 겨울잠보다 달다. 해먹 비어 있다.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', time: ['evening', 'night'] },
      open: '여름밤엔 주점 문을 다 열어 둔다. 파도 소리가 제일 좋은 안주거든.',
      replies: [
        { say: '바닷가에 상 펴자!', tier: 'great', answer: ['다하하! 좋다, 오늘은 모래 위 잔치다.', '오징어 배 불빛이 촛불 대신이다.'] },
        { say: '시원한 우유 줘', tier: 'good', face: 'smile', answer: '얼음 띄워서 준다. 여름엔 이게 최고야.' },
        { say: '모기가 많아', tier: 'meh', face: 'laugh', answer: '하하하! 그건 바다도 못 이긴다. 쑥 향 피워 둘게.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이다! 군밤 화로를 주점 앞에 내놨다. 지나가는 사람 다 한 줌씩이다.',
      replies: [
        { say: '나도 한 줌!', tier: 'great', answer: ['다하하! 너는 두 줌이다. 단골 특권이야.', '뜨거우니 조심해. 까 줄까?'] },
        { say: '갈치 철이기도 하지', tier: 'good', face: 'wow', answer: '오, 뭘 좀 아는구나! 은빛 갈치에 군밤이면 가을 잔치 완성이다.' },
        { say: '낙엽 쓸기 힘들겠다', tier: 'meh', face: 'calm', answer: '하하, 갑판 청소에 비하면 산책이다.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter', time: ['evening', 'night'] },
      open: '겨울밤이다. 난롯가엔 쓰레쉬가 또 앉아 있지만… 네 자리는 따로 비워 뒀다.',
      replies: [
        { say: '샹크스 옆자리면 돼', tier: 'great', face: 'shy', answer: ['…하하. 그럼 망토 반 덮어 줄게.', '한쪽 어깨밖에 안 덮지만, 그쪽이 제일 따뜻하다.'] },
        { say: '대구탕 있어?', tier: 'good', face: 'laugh', answer: '한 솥 끓여 놨다! 혼자 먹으면 맛없으니까 다 같이.' },
        { say: '춥다, 빨리 갈래', tier: 'meh', face: 'calm', answer: '그래, 따뜻하게 하고 가. 목도리 단단히 매.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 오늘은 다들 친구지. {me}, 노래 한 곡 할래? 내가 박수 칠게.',
      replies: [
        { say: '같이 부르자!', tier: 'great', answer: ['좋다! 박자 틀려도 크게!', '축제 노래는 크게 부르는 놈이 이기는 거다.'] },
        { say: '음치라서…', tier: 'good', face: 'laugh', answer: '하하, 나도다. 그래서 둘이 부르면 아무도 모른다니까.' },
        { say: '구경만 할래', tier: 'meh', face: 'calm', answer: '구경도 축제다. 대신 박수는 크게 쳐 줘.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '오, 바다 냄새! {me}, 오늘 {fish} 낚았지? 손맛 어땠어?',
      replies: [
        { say: '최고였어!', tier: 'great', answer: ['다하하! 그 얼굴 보니 알겠다.', '다음엔 먼바다 가자. 손맛이 차원이 달라.'] },
        { say: '겨우 건졌어', tier: 'good', answer: '겨우든 뭐든 건졌으면 이긴 거야. 오늘 저녁은 네 무용담 듣는 날이다.' },
        { say: '팔이 아파', tier: 'meh', face: 'sorry', answer: '하하, 처음엔 다 그래. 팔 말고 허리로 당기는 거다. 다음에 보여 주지.' },
      ],
    },
    {
      id: 'op-fish-sea',
      when: { fish: ['yellowtail', 'hairtail', 'bluefin', 'marlin', 'giantsquid'] },
      open: '{fish}? 그걸 낚았다고? {me}, 너 진짜 바다한테 사랑받는구나!',
      replies: [
        { say: '샹크스 주려고 잡았어', tier: 'great', face: 'wow', answer: ['…야, 그런 말 하면 선장 눈시울이 붉어진다.', '다하하! 오늘 밤 통구이다! 마을 사람 다 불러!'] },
        { say: '팔 빠지는 줄 알았어', tier: 'good', face: 'laugh', answer: '그 녀석들 힘이 장사지. 그래도 버텼으면 이긴 거다.' },
        { say: '운이 좋았나 봐', tier: 'meh', face: 'think', answer: '운도 실력이야. 근데 다음엔 실력이라고 우겨. 그게 뱃사람이다.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었다! 오늘 엄청난 놈을 낚았다며? 마을이 시끌시끌하던데.',
      replies: [
        { say: '내가 해냈어!', tier: 'great', remember: 'fish-big', answer: ['다하하하! 오늘 밤은 네 잔치다! 다들 불러라!', '술값은… 아니, 우유값은 내가 낸다!'] },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 실력이야. 바다가 너를 마음에 들어 한 거지.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙냄새가 나네. 오늘 밭일했구나? 땅 사람도 멋있지.',
      replies: [
        { say: '안주 거리 가져올게', tier: 'great', answer: ['하하하! 그 말 기다렸다.', '구워서 다 같이 나눠 먹자. 시금치만 빼고.'] },
        { say: '허리가 끊어질 것 같아', tier: 'good', face: 'sorry', answer: '그럼 앉아. 의자 하나 비워 뒀다. 오늘은 내가 다 날라 줄게.' },
        { say: '바다가 더 좋은데', tier: 'meh', face: 'think', answer: '하하, 바다 사람이 밭 매는 것도 멋있잖아. 둘 다 하면 되지.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me}, 오늘 금별 작물 나왔다며? 반짝반짝한 게 꼭 보물 같더라.',
      replies: [
        { say: '보물이니까 자랑하러 왔지', tier: 'great', answer: ['다하하! 보물은 자랑해야 맛이지!', '주점 선반 제일 높은 데 올려 줄게. 모자 옆자리다.'] },
        { say: '운이 좋았나 봐', tier: 'good', face: 'smile', answer: '정성 들인 놈한테 운도 오는 거야. 축하한다.' },
      ],
    },
    {
      id: 'op-high-mood',
      when: { mood: 'high' },
      open: '{me}, 오늘 얼굴이 순풍 받은 돛 같다! 무슨 좋은 일 있었어?',
      replies: [
        { say: '그냥 샹크스 보러 와서', tier: 'great', face: 'shy', answer: ['…하하, 그런 말은 반칙이다.', '볼리바스한테 이르기 전에 우유나 받아라.'] },
        { say: '오늘 일이 잘 풀렸어', tier: 'good', answer: '좋다! 잘 풀린 날엔 기분 좋게 한 잔. 그게 바다의 법이다.' },
        { say: '별일 없는데?', tier: 'meh', face: 'laugh', answer: '별일 없이 웃는 게 제일 큰 복이다. 다하하!' },
      ],
    },
    {
      id: 'op-low-mood',
      when: { mood: 'low' },
      open: '{me}, 오늘 얼굴이 좀 흐리다. 무슨 일 있어? 말 안 해도 되고.',
      replies: [
        { say: '그냥 좀 지쳤어', tier: 'great', face: 'smile', answer: ['그럼 여기 앉아. 아무것도 안 해도 된다.', '지친 날엔 주점이 항구야. 닻 내리고 쉬어.'] },
        { say: '괜찮아, 별일 아니야', tier: 'good', answer: '그래. 그래도 우유는 한 잔 마시고 가. 공짜다. 오늘만.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '들었어? 오늘 광장에서 결혼식 있었다며! 축하주는 우유로 돌리자!',
      replies: [
        { say: '축하 잔치 열자!', tier: 'great', answer: ['그래야지! 오늘 밤은 주점 문 활짝 연다.', '신랑 신부 자리는 제일 앞이다. 의자는 제일 튼튼한 걸로.'] },
        { say: '부럽다…', tier: 'good', face: 'smile', answer: '하하, 부러워하는 얼굴도 좋네. 너한테도 좋은 바람이 불 거다.' },
      ],
    },
    {
      id: 'op-news-birthday',
      when: { news: 'birthday' },
      open: '오늘 누구 생일이라며! 주점에선 생일이면 무조건 잔치다. 규칙이야.',
      replies: [
        { say: '케이크는 프리렌 빵집!', tier: 'great', answer: ['다하하! 좋다, 주문은 네가 해 와.', '초는 내가 켤게. 한 손으로도 금방이다.'] },
        { say: '선물은 뭐가 좋을까?', tier: 'good', face: 'think', answer: '같이 웃어 주는 게 제일이지. 그다음이 군밤이고.' },
        { say: '난 그 사람 잘 몰라', tier: 'meh', face: 'calm', answer: '그럼 오늘 알게 되면 되지. 잔치는 그러라고 있는 거다.' },
      ],
    },
    {
      id: 'op-news-legend',
      when: { news: 'legend' },
      open: '마을에 전설의 물고기가 잡혔단 소식이 돌더라! 허풍 주점이 들썩였다.',
      replies: [
        { say: '허풍 아니고 진짜래!', tier: 'great', answer: ['그러니까 더 대단한 거지! 다하하!', '오늘 밤 허풍 경연은 쉬자. 진짜를 이길 허풍이 없다.'] },
        { say: '샹크스도 잡아 봤어?', tier: 'good', face: 'think', answer: '꼬리만 봤다니까. 그 뒤로 매년 노리는 중이다. 하하.' },
        { say: '믿기 어려운데', tier: 'meh', face: 'laugh', answer: '하하, 바다는 원래 믿기 어려운 데다. 그래서 재밌지.' },
      ],
    },
    {
      id: 'op-news-record',
      when: { news: 'record' },
      open: '오늘 마을 기록이 하나 깨졌다며! 기록 깨진 날은 주점 벽에 금 하나 긋는다.',
      replies: [
        { say: '내가 그어도 돼?', tier: 'great', answer: ['물론이지! 칼 대신 분필이다.', '다하하! 삐뚤어져도 멋있다. 기록은 원래 삐뚤어진 데서 나와.'] },
        { say: '벽이 금투성이겠다', tier: 'good', face: 'laugh', answer: '그게 주점 역사다. 발키리는 질색하지만. 하하.' },
        { say: '누군지 모르겠어', tier: 'meh', face: 'calm', answer: '상관없다. 누가 깼든 마을 잔치다.' },
      ],
    },
    {
      id: 'op-news-museum',
      when: { news: 'museum' },
      open: '박물관에 새 물건이 들어왔다며? 옛 항해 도구면 좋겠는데.',
      replies: [
        { say: '같이 보러 가자', tier: 'great', answer: ['좋다! 낡은 나침반 있으면 내가 설명해 줄게.', '반은 진짜, 반은 허풍으로. 다하하!'] },
        { say: '샹크스 물건도 걸까?', tier: 'good', face: 'think', answer: '내 건… 아직 쓰는 중이라 안 된다. 모자는 더더욱 안 되고.' },
        { say: '박물관은 지루해', tier: 'meh', face: 'laugh', answer: '하하, 이야기 붙이면 안 지루하다. 내가 붙여 줄게.' },
      ],
    },
    {
      id: 'op-news-festival',
      when: { news: 'festival', time: ['day', 'evening'] },
      open: '축제 준비 소식이 광장에 붙었더라! 주점은 뭘 내놓을까?',
      replies: [
        { say: '생선 통구이!', tier: 'great', answer: ['다하하! 역시 아는구나.', '제일 큰 놈 잡아 와야겠다. 같이 갈래?'] },
        { say: '허풍 경연 열자', tier: 'good', face: 'laugh', answer: '좋지! 볼리바스한테 심판 또 부탁해야겠다.' },
        { say: '그냥 쉬어', tier: 'meh', face: 'calm', answer: '하하, 쉬는 축제도 좋다. 근데 난 못 쉬는 체질이라.' },
      ],
    },
    {
      id: 'op-friend-news',
      when: { friendNews: 'birthday' },
      open: '네 친구 하나가 오늘 생일이라며? 주점 끝자리 비워 둘게. 데려와.',
      replies: [
        { say: '고마워! 꼭 데려올게', tier: 'great', answer: ['다하하! 친구의 친구는 내 친구다.', '초 꽂을 군밤 하나 남겨 둘게.'] },
        { say: '부끄러워할 텐데', tier: 'good', face: 'smile', answer: '그럼 조용히 한 잔만. 생일엔 조용한 축하도 좋다.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '{me}, 먼바다 다녀왔다며! 얼굴에 바닷바람이 잔뜩 묻었다.',
      replies: [
        { say: '샹크스 생각 났어', tier: 'great', face: 'shy', answer: ['…하하, 바다에서 내 생각을 했다고?', '그거 뱃사람한텐 최고의 칭찬이다. 우유 한 잔 받아.'] },
        { say: '파도가 엄청 높았어', tier: 'good', face: 'wow', answer: '그래도 돌아왔잖아. 돌아오는 게 제일 큰 항해다.' },
        { say: '멀미 났어', tier: 'meh', face: 'laugh', answer: '다하하! 다들 처음엔 그래. 세 번째부턴 바다가 요람 된다.' },
      ],
    },
    {
      id: 'op-recent-fishing',
      when: { recent: 'fishing', time: ['day', 'evening'] },
      open: '요즘 낚시 자주 다니더라. 선착장 사람들이 다 네 얘기다.',
      replies: [
        { say: '샹크스 따라잡으려고', tier: 'great', answer: ['다하하! 따라잡히면 내가 설거지한다.', '근데 쉽지 않을 거다. 난 바다랑 오래 사귀었거든.'] },
        { say: '재밌어서', tier: 'good', face: 'smile', answer: '재밌는 게 제일이다. 손맛 들리면 못 끊는다.' },
        { say: '돈 벌려고', tier: 'meh', face: 'calm', answer: '하하, 그것도 이유지. 근데 바다는 돈 얘기하면 삐친다.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '{me}, 증권에서 순풍 탔다며! 축하한다. 근데 돛은 너무 크게 펴지 마라.',
      replies: [
        { say: '조심할게. 고마워', tier: 'great', face: 'smile', answer: ['그래. 순풍은 언제든 방향을 바꾸거든.', '오늘은 웃고, 내일은 다시 바람 보고. 그게 선장이다.'] },
        { say: '한턱낼게!', tier: 'good', face: 'laugh', answer: '다하하! 그럼 우유 큰 잔으로 두 개.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '증권에서 역풍 맞았다며. 괜찮다. 바다엔 역풍 없는 날이 없다.',
      replies: [
        { say: '고마워, 힘이 난다', tier: 'great', face: 'smile', answer: ['돛 고쳐 달면 된다. 배는 안 가라앉았잖아.', '오늘 우유는 공짜다. 역풍 맞은 날 전용이야.'] },
        { say: '다 잃은 것 같아', tier: 'good', face: 'sorry', answer: '다 잃은 사람은 여기 못 온다. 넌 왔잖아. 그럼 아직 남은 거다.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '테이블에서 땄다며! 좋다. 이제 웃으면서 일어서는 게 진짜 멋이다.',
      replies: [
        { say: '딱 멈췄어', tier: 'great', answer: ['다하하! 그게 선장 감이다.', '딴 돈은 닻처럼 꽉 붙들어 둬.'] },
        { say: '한 판만 더 할까?', tier: 'meh', face: 'calm', answer: '…하하. 그 한 판에 배 날린 사람 여럿 봤다. 오늘은 여기서 웃자.' },
        { say: '잔치 비용으로 쓸게', tier: 'good', face: 'laugh', answer: '좋은 데 쓰네! 의자 수리비도 좀 남겨 둬라.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '이번 주 테이블에서 좀 털렸구나. 괜찮다. 오늘은 그냥 웃고 쉬어.',
      replies: [
        { say: '다음엔 조금만 걸게', tier: 'great', face: 'smile', answer: ['그거면 됐다. 배운 게 있으면 잃은 게 아니야.', '따뜻한 우유다. 오늘은 공짜다.'] },
        { say: '미스 포츈한테 빌릴까', tier: 'meh', face: 'sorry', answer: '그건… 하하, 그 사람 장부는 바다보다 깊다. 하지 마라.' },
      ],
    },
    {
      id: 'op-museum-recent',
      when: { recent: 'museum' },
      open: '박물관에 네 이름이 걸렸다며! 잔치감이다!',
      replies: [
        { say: '주점에도 걸어 줘', tier: 'great', answer: ['다하하! 좋다, 모자 옆에 걸어 둔다.', '그 자리는 아무나 못 걸어. 영광인 줄 알아라.'] },
        { say: '쑥스러워', tier: 'good', face: 'smile', answer: '쑥스러운 얼굴이 제일 보기 좋다. 축하한다.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '미스 포츈 만났다며? 그 사람 또 내 외상 장부 얘기 안 했어?',
      replies: [
        { say: '둘이 무슨 사이야?', tier: 'great', face: 'think', answer: ['같은 바다를 아는 사이지. 서로 배를 몰아 봐서 말이 통해.', '장부만 빼면. 다하하!'] },
        { say: '했어. 많이', tier: 'good', face: 'laugh', answer: '하하하! 역시. 다음 달엔 꼭 갚는다고 전해 줘. 진짜다. 아마도.' },
        { say: '모르는 척했어', tier: 'meh', answer: '현명하다. 그 사람 앞에선 모르는 게 약이야. 하하.' },
      ],
    },
    {
      id: 'op-maehwa',
      when: { bond: 'maehwa' },
      open: '예림이 회관 다녀왔어? 오늘 판은 어땠대? 끝나면 안주 나눠 먹기로 했거든.',
      replies: [
        { say: '판 엄청 뜨거웠어', tier: 'great', answer: ['다하하! 그럼 오늘은 매운 안주다.', '예림이는 이긴 날에 매운 걸 찾거든.'] },
        { say: '조용하던데', tier: 'good', face: 'think', answer: '그런 날엔 그 사람 말수가 더 줄지. 따뜻한 차 한 주전자 끓여 둬야겠다.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '볼리바스 만났지? 그 친구가 또 내 웃음소리 단속한다고 안 했어?',
      replies: [
        { say: '경연 날짜 물어보더라', tier: 'great', answer: ['다하하! 역시 심판은 성실하다.', '이번엔 웃음소리 측정기라도 들고 오겠군.'] },
        { say: '진짜 단속한대', tier: 'good', face: 'laugh', answer: '하하하! 그럼 오늘은 속으로 웃어야겠다. …흐흐. 안 되네.' },
        { say: '순경은 무서워', tier: 'meh', face: 'smile', answer: '겉은 곰 같아도 속은 꿀이다. 우유 한 잔이면 금방 웃어.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '쓰레쉬네 잡화점 다녀왔어? 그 사람 또 새 수집품 들였다고 자랑하겠네.',
      replies: [
        { say: '낡은 나침반 들였대', tier: 'great', face: 'wow', answer: ['나침반? 그건 좀 보고 싶다.', '…값은 바다보다 깊겠지만. 하하.'] },
        { say: '랜턴만 반짝이더라', tier: 'good', face: 'laugh', answer: '그 랜턴, 겨울엔 벽난로 옆에서 더 반짝인다. 내 명당에서.' },
        { say: '좀 으스스했어', tier: 'meh', face: 'calm', answer: '하하, 그게 그 사람 인사다. 익숙해지면 정겹다.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '발키리 만났어? 혹시 의자 수리비 얘기 안 하던?',
      replies: [
        { say: '했어. 엄청 화났던데', tier: 'great', face: 'sorry', answer: ['…역시. 오늘 군밤 들고 사과하러 간다.', '같이 가 줄 거지? 넌 내 항해 동료잖아. 하하.'] },
        { say: '새 의자 만든대', tier: 'good', face: 'wow', answer: '진짜? 더 튼튼한 걸로? 그 사람 화내면서 일은 최고로 한다니까.' },
        { say: '그냥 망치질만 하던데', tier: 'meh', face: 'think', answer: '그게 더 무섭다. 하하… 오늘은 잔치 쉬어야겠다.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '프리렌네 빵집 들렀어? 그 사람 오늘 밤에도 우유 마시러 오려나.',
      replies: [
        { say: '빵 남은 거 가져온대', tier: 'great', answer: ['다하하! 그럼 오늘 안주는 빵이다.', '그 사람 빵은 이상하게 우유랑 잘 맞아.'] },
        { say: '졸려 보이던데', tier: 'good', face: 'smile', answer: '그럼 구석 자리 비워 둬야지. 거기서 자도 아무도 안 깨운다.' },
      ],
    },
    {
      id: 'op-realtor',
      when: { bond: 'realtor' },
      open: '신형만 씨 만났어? 오늘 계약 땄으면 이따 바에서 또 무용담이 길겠군.',
      replies: [
        { say: '땄대! 신났던데', tier: 'great', answer: ['다하하! 그럼 오징어 구워 둬야지.', '오늘 밤은 그 사람이 허풍왕이다.'] },
        { say: '피곤해 보였어', tier: 'good', face: 'think', answer: '그럼 한 잔만 주고 집에 보내야지. 가족이 기다리는 사람이니까.' },
      ],
    },
    {
      id: 'op-with-rose',
      when: { with: 'rose' },
      open: '보다시피 {other} 선장이랑 바다 얘기 중이다. 어느 배가 빠른지로 또 붙었지.',
      replies: [
        { say: '내가 심판 볼게!', tier: 'great', answer: ['다하하! 좋다. 공정하게 봐라.', '…근데 우유 한 잔 사면 내 편 들어 줄 거지?'] },
        { say: '둘 다 빨라', tier: 'good', face: 'laugh', answer: '하하하! 외교관이 따로 없네. 그 말에 둘 다 웃었다.' },
        { say: '방해 안 할게', tier: 'meh', face: 'smile', answer: '방해는 무슨. 손님이 끼어야 싸움이 아니라 잔치가 된다.' },
      ],
    },
    {
      id: 'op-with-volibas',
      when: { with: 'volibas' },
      open: '{other}, 이 친구가 {me}다. 다음 허풍 경연 우승 후보지. 하하!',
      replies: [
        { say: '우승은 내 거야', tier: 'great', answer: ['다하하하! 들었지, 심판? 벌써 허풍이 수준급이다.', '수첩에 적어 둬라. 우승 후보 일 번.'] },
        { say: '그런 적 없는데…', tier: 'good', face: 'laugh', answer: '하하, 겸손한 척하는 것도 허풍의 기술이다. 잘하네.' },
      ],
    },
    {
      id: 'op-with-carpenter',
      when: { with: 'carpenter' },
      open: '쉿, 저기 {other}. 의자 검사 중이다. 다리 하나 흔들리면 잔치는 끝이야.',
      replies: [
        { say: '튼튼해 보이는데?', tier: 'great', answer: ['다하하! 들었지? 손님 눈에도 튼튼하대.', '…아, 째려본다. 조용히 하자.'] },
        { say: '흔들리면 내가 고칠게', tier: 'good', face: 'wow', answer: '오, 든든하다! 근데 목수 앞에서 그 말은 위험하다. 하하.' },
      ],
    },
    {
      id: 'op-with-thresh',
      when: { with: 'thresh' },
      open: '{other}랑 수집품 얘기 듣는 중이다. 오늘은 낡은 사슬이래. 하하… 흥미롭지?',
      replies: [
        { say: '나도 듣고 싶어', tier: 'great', answer: ['다하하! 용감하다. 한 시간은 각오해라.', '중간에 군밤은 내가 까 줄게.'] },
        { say: '난 다음에…', tier: 'meh', face: 'laugh', answer: '하하, 현명하다. 나도 다음에 하고 싶었다.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '{other}랑 서먹하다며. 괜찮다. 바다에서도 같은 배 탄 놈끼리 제일 많이 싸워.',
      replies: [
        { say: '어떻게 화해해?', tier: 'great', face: 'smile', answer: ['우유 두 잔 시켜서 하나 밀어 줘. 말은 안 해도 된다.', '잔을 받으면 끝난 거야. 뱃사람 화해법이지.'] },
        { say: '내가 잘못한 것 같아', tier: 'good', face: 'think', answer: '그걸 아는 게 반이다. 나머지 반은 먼저 웃는 거고.' },
        { say: '신경 안 써', tier: 'meh', face: 'calm', answer: '…그래도 오래 두면 녹슨다. 닻줄도 친구도.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}! 오늘 네 생일이라며! 주점 문 활짝 연다. 오늘 주인공은 너다!',
      replies: [
        { say: '샹크스가 있어서 좋아', tier: 'great', face: 'shy', answer: ['…다하하, 생일인 사람이 선물을 주면 어떡해.', '좋다, 오늘 밤 우유는 끝없이다! 군밤도!'] },
        { say: '큰 고기 구워 줘!', tier: 'good', face: 'laugh', answer: '벌써 굽고 있다! 냄새 안 나? 다하하!' },
        { say: '조용히 지내고 싶어', tier: 'meh', face: 'smile', answer: '그럼 조용히. 촛불 하나, 우유 두 잔. 그것도 잔치다.' },
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
        { say: '고마워, 바로 갈게', tier: 'great', answer: ['다하하! 큰 놈 잡으면 첫 점은 나한테 가져와.', '그게 정보값이다.'] },
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
        { say: '요즘은 바다도 좋아졌어', tier: 'good', remember: 'sea-lover', face: 'wow', answer: ['오? 그 말 기다렸다.', '그럼 다음엔 배로 모시지. 멀미약은 내가 챙긴다.'] },
      ],
    },
    {
      id: 'cb-dream',
      when: { mem: 'big-dream' },
      use: 'big-dream',
      open: '마을 최고가 되겠다던 꿈, 아직 그대로지? 요즘 어디까지 왔어?',
      replies: [
        { say: '조금씩 가는 중이야', tier: 'great', answer: ['그거면 됐다. 큰 배도 한 번에 안 나가.', '조금씩 밀려가는 거야. 바람 탈 때까지.'] },
        { say: '솔직히 막막해', tier: 'good', face: 'think', answer: '막막한 날엔 주점 와. 허풍 한 판 하면 다시 길이 보인다.' },
      ],
    },
    {
      id: 'cb-hat',
      when: { mem: 'hat-story' },
      use: 'hat-story',
      open: '모자 얘기 기억하지? 어젯밤에 먼지 털어 뒀다. 주인이 언제 올지 모르니까.',
      replies: [
        { say: '꼭 돌려받길 바랄게', tier: 'great', face: 'smile', answer: ['…고맙다. 그날 오면 너도 불러 주지.', '잔치는 크게 할 거다. 마을이 떠나가게.'] },
        { say: '나도 맡겨 둘 거 있어?', tier: 'good', face: 'laugh', answer: '하하하! 네 건 아직 안 맡는다. 너는 네가 들고 다녀야 어울려.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 주점 메뉴에 슬쩍 넣어 볼까 고민 중이다.',
      replies: [
        { say: '넣어 주면 매일 올게', tier: 'great', remember: 'taste-heard', answer: ['다하하! 그럼 결정이다.', '메뉴판 맨 위에 적는다. 네 이름 붙여서.'] },
        { say: '어떻게 알았어?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '주점 주인은 귀가 밝거든. 마을 수첩에도 다 적혀 있고.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 돌아다닌 거 재밌었다. 너랑 걸으면 길이 짧아지더라.',
      replies: [
        { say: '또 같이 가자', tier: 'great', remember: 'outing-talk', answer: ['좋다! 다음엔 먼바다까지 가자.', '배는 내가, 웃음은 네가 맡는 거다.'] },
        { say: '네가 길을 잃었잖아', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: ['하하하! 그건 탐험이었다고 해 두자.', '선장은 길을 잃지 않아. 새로 찾을 뿐이지.'] },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 네 생일이지? 주점에서 뭐 해 줄까? 큰 고기 통구이 어때?',
      replies: [
        { say: '다 같이 모이면 그걸로 충분해', tier: 'great', face: 'smile', remember: 'bday-plan', answer: ['…하하, 역시 너다.', '그럼 의자 넉넉히 준비해 둔다. 발키리한테 미리 부탁해야겠다.'] },
        { say: '통구이 좋아!', tier: 'good', remember: 'bday-plan', answer: '좋아! 제일 큰 놈으로 잡아 온다. 약속이다.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '{me}, 네 방에서 보낸 시간 말이야. 배 선실보다 아늑하더라. 하하.',
      replies: [
        { say: '또 놀러 와', tier: 'great', face: 'shy', remember: 'date-talk', answer: ['…그래. 이번엔 군밤 들고 갈게.', '네 방 창가가 내 새 망대다.'] },
        { say: '망토 두고 갔더라', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '다하하! 일부러 두고 왔다. 다시 갈 핑계로.' },
      ],
    },
    {
      id: 'cb-friend',
      when: { mem: 'friend-first' },
      use: 'friend-first',
      open: '보물보다 친구라고 했던 거, 그 뒤로 나도 자주 생각났다.',
      replies: [
        { say: '지금도 그렇게 생각해', tier: 'great', face: 'smile', answer: ['그럼 우린 이미 부자다. 다하하!', '오늘 우유는 내가 산다.'] },
        { say: '금도 조금은 좋아', tier: 'good', face: 'laugh', answer: '하하하! 솔직해서 더 좋다. 금도 친구도 챙기자.' },
      ],
    },
    {
      id: 'cb-party',
      when: { mem: 'party-yes' },
      use: 'party-yes',
      open: '잔치 좋아한다던 {me}! 오늘 밤 잔치 연다. 네가 첫 번째로 들은 거다.',
      replies: [
        { say: '내가 사람 모아 올게!', tier: 'great', answer: ['다하하! 그럼 넌 오늘 갑판장이다.', '광장부터 시장 끝까지 다 불러!'] },
        { say: '의자는 괜찮아?', tier: 'good', face: 'sorry', answer: '…하하. 발키리한테 미리 사과해 뒀다. 반쯤.' },
      ],
    },
    {
      id: 'cb-quiet',
      when: { mem: 'quiet-night' },
      use: 'quiet-night',
      open: '조용한 밤이 좋다고 했지. 오늘은 손님 다 보내고 등불 하나만 켜 둘게.',
      replies: [
        { say: '그럼 늦게 올게', tier: 'great', face: 'smile', answer: ['그래. 문은 안 잠근다.', '말 없이 잔만 부딪치자. 그게 우리 대화법이다.'] },
        { say: '샹크스가 조용할 수 있어?', tier: 'good', face: 'laugh', answer: '하하하! 노력해 보마. …벌써 실패했네.' },
      ],
    },
    {
      id: 'cb-big-fish',
      when: { mem: 'fish-big' },
      use: 'fish-big',
      open: '큰 고기 잡겠다던 약속, 잊지 않았지? 먼바다에 큰 그림자가 다시 보였대.',
      replies: [
        { say: '같이 가자!', tier: 'great', answer: ['다하하! 그 말 기다렸다.', '배는 내가 몰고, 낚싯대는 네가 잡는다. 공평하지?'] },
        { say: '아직 실력이 부족해', tier: 'good', face: 'think', answer: '실력은 바다에서 느는 거다. 걱정 마, 옆에 내가 있다.' },
      ],
    },
    {
      id: 'cb-crew',
      when: { mem: 'old-crew' },
      use: 'old-crew',
      open: '옛 선원들 얘기 기억해? 어제 바람 편에 소식이 왔다. 다들 잘 지낸대.',
      replies: [
        { say: '다행이다!', tier: 'great', face: 'laugh', answer: ['그치? 다하하! 오늘은 그 녀석들 몫까지 마신다.', '우유로.'] },
        { say: '보고 싶겠다', tier: 'good', face: 'smile', answer: ['보고 싶지. 근데 바다는 다 이어져 있거든.', '언젠가 이 주점에 다 모일 날도 오겠지.'] },
      ],
    },
    {
      id: 'cb-first-mate',
      when: { mem: 'first-mate' },
      use: 'first-mate',
      open: '옛 부선장한테 편지가 왔다. 역시 짧더라. "사고 치지 마라." 다하하!',
      replies: [
        { say: '좋은 친구네', tier: 'great', face: 'smile', answer: ['그렇지. 짧은 말에 다 들어 있다.', '답장엔 너 얘기를 적었다. 사고 대신 좋은 친구가 생겼다고.'] },
        { say: '사고 쳤어?', tier: 'good', face: 'laugh', answer: '…의자 둘. 그건 비밀로 해 줘.' },
      ],
    },
    {
      id: 'cb-rival',
      when: { mem: 'rival-cup' },
      use: 'rival-cup',
      open: '칼 대신 잔으로 겨루던 맞수 얘기 했었지? {me}, 오늘 나랑 한판 할래? 우유로.',
      replies: [
        { say: '좋아, 덤벼!', tier: 'great', answer: ['다하하하! 좋다, 먼저 웃는 사람이 지는 거다.', '…벌써 내가 졌네.'] },
        { say: '배 터질 것 같은데', tier: 'good', face: 'laugh', answer: '하하, 그럼 군밤으로 하자. 더 빨리 까는 사람이 이긴다.' },
      ],
    },
    {
      id: 'cb-cabin-boy',
      when: { mem: 'cabin-boy' },
      use: 'cabin-boy',
      open: '꼬마 견습 선원 시절 얘기 기억해? 오늘 갑판 닦는 법 가르쳐 줄까?',
      replies: [
        { say: '샹크스 선배님!', tier: 'great', face: 'laugh', answer: ['다하하하! 선배님이라니, 듣기 좋다.', '좋아, 대걸레는 이렇게. 허리 말고 다리로.'] },
        { say: '청소는 싫어', tier: 'good', face: 'think', answer: '하하, 나도 싫었다. 근데 반짝이는 갑판은 꽤 기분 좋다.' },
      ],
    },
    {
      id: 'cb-home-port',
      when: { mem: 'home-port' },
      use: 'home-port',
      open: '돌아갈 항구 얘기 했었지. {me}, 요즘은 어때? 들어오고 싶은 데 생겼어?',
      replies: [
        { say: '이 주점이 그래', tier: 'great', face: 'shy', answer: ['…하하, 그런 말 들으려고 주점 연 거다.', '불은 늘 켜 둘게. 늦어도 괜찮다.'] },
        { say: '아직 모르겠어', tier: 'good', face: 'smile', answer: '모르는 동안은 여기서 쉬어. 그러다 보면 알게 돼.' },
      ],
    },
    {
      id: 'cb-storm',
      when: { mem: 'storm-wait' },
      use: 'storm-wait',
      open: '폭풍은 기다리는 거라고 했던 거 기억해? 요즘 너 얼굴에 작은 폭풍이 보여서.',
      replies: [
        { say: '기다리는 중이야', tier: 'great', face: 'smile', answer: ['잘하고 있다. 지나간다, 반드시.', '그동안 주점에서 같이 기다려 줄게.'] },
        { say: '들켰네', tier: 'good', face: 'think', answer: '선장은 날씨를 읽는 사람이다. 사람 얼굴도 날씨다.' },
      ],
    },
    {
      id: 'cb-sail',
      when: { mem: 'sail-with', noMem: 'sail-talked' },
      open: '배 같이 타기로 한 약속 말이야. 첫 항로를 정했다. 들어 볼래?',
      replies: [
        { say: '어디야? 빨리 말해!', tier: 'great', remember: 'sail-talked', answer: ['뒷산에서 보이는 저 끝 섬. 거기서 노을을 보고 돌아오는 거다.', '짧지만, 돌아오는 항해가 제일 좋거든.'] },
        { say: '멀지 않았으면', tier: 'good', face: 'laugh', remember: 'sail-talked', answer: '하하, 저녁밥 전에 돌아온다. 약속이다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '허풍 주점의 첫 잔',
      hint: '한 번 이야기를 나누면 샹크스가 잔 하나를 내밀어요.',
      need: { days: 1 },
      scene: [
        '저녁 무렵 허풍 주점. 문 위 종이 딸랑 울리고, 바다 냄새가 따라 들어온다.',
        '바 뒤에서 잔을 닦던 샹크스가 한 손으로 행주를 어깨에 척 걸친다.',
        '"오, 새 얼굴! 앉아, 앉아. 여기선 처음 온 사람이 제일 귀한 손님이다."',
        '그가 바 아래를 뒤적이더니 이 빠진 나무 잔 하나를 꺼낸다.',
        '"이거 말이야. 이 마을에 닻 내리고 처음 산 잔이다. 아무한테나 안 줘."',
        '"떠도는 배는 많아도, 반겨 주는 항구는 드물거든. 그래서 주점을 열었다."',
        '벽에는 낡은 해도, 선반 끝에는 먼지 하나 없는 낡은 밀짚모자가 걸려 있다.',
        '"저 모자? 하하, 그건 내 거 아니다. 언젠가 찾으러 올 녀석이 있어서."',
        '그가 잔에 따뜻한 우유를 찰랑하게 붓고, 꿀 한 숟갈을 툭 떨어뜨린다.',
        '"{me}, 너 웃는 소리가 마음에 들었다. 오늘부터 이건 네 잔이다."',
        '"규칙은 하나. 이 잔으로 마실 땐 무조건 웃을 것. 다하하!"',
      ],
      replies: [
        { say: '고마워, 잘 쓸게!', tier: 'great', remember: 'milk-toast', answer: ['다하하! 그럼 첫 잔은 우유로! 건배다, {me}!', '잔 부딪치는 소리, 이게 이 항구의 종소리다.'] },
        { say: '이가 빠졌는데?', tier: 'good', face: 'laugh', answer: ['그게 멋이야. 잔치 열 번은 버틴 잔이거든.', '너도 그렇게 버텨 봐. 이 빠져도 웃으면서.'] },
        { say: '잔은 내 거 쓸게', tier: 'meh', face: 'calm', answer: ['하하, 그래도 선반에 걸어 둔다.', '마음 바뀌면 언제든 꺼내. 항구는 안 닫는다.'] },
      ],
    },
    {
      title: '뒷산의 노을',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 뒷산에 올라가 보세요. 바다가 보인대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 17, to: 21 } },
      scene: [
        '뒷산 꼭대기. 풀잎이 바람에 눕고, 멀리서 갈매기 소리가 실려 온다.',
        '샹크스가 바위에 걸터앉아 한쪽 다리를 흔들고 있다. 망토 자락이 펄럭인다.',
        '"왔구나! 여기서 보면 바다가 다 보여. 옛날 내 배도 저 끝에서 왔지."',
        '그가 수평선 쪽을 턱으로 가리킨다. 해가 막 물에 닿으려 한다.',
        '"배 위에선 매일 이걸 봤는데, 땅에 내리니까 일부러 보러 와야 하더라."',
        '"처음 이 마을에 왔을 땐, 잠깐 물만 받고 떠날 생각이었다."',
        '"근데 이상하지. 떠나려고 돛을 펴는데 광장에서 웃음소리가 들리더라."',
        '"뱃사람한텐 그게 등대 불빛 같은 거야. 그래서 돛을 접었지. 하하."',
        '노을이 바다를 붉게 물들인다. 그의 머리색이랑 똑같다.',
        '"혼자 보기엔 아깝거든. 그래서 친구를 부르는 거다."',
        '그가 품에서 군밤 두 알을 꺼내 하나를 내민다. 아직 따뜻하다.',
      ],
      replies: [
        { say: '네 머리색 같아', tier: 'great', remember: 'sunset-hill', face: 'laugh', answer: ['다하하하! 그런 말 처음 들어 본다. …아니, 두 번째인가.', '좋은 날이다. 이 노을, 오늘부터 우리 둘 거다.'] },
        { say: '같이 봐서 좋다', tier: 'good', remember: 'sunset-hill', face: 'smile', answer: ['그치? 다음 노을도 같이 보자.', '약속은 안 해도 된다. 그냥 오면 돼.'] },
        { say: '바람이 차다', tier: 'meh', remember: 'sunset-hill', face: 'calm', answer: ['하하, 망토 반 줄게.', '한쪽 어깨밖에 안 덮지만 없는 것보단 낫다.'] },
      ],
    },
    {
      title: '군밤 굽는 밤',
      hint: '샹크스가 군밤 이야기를 했어요. 군밤 한 봉지를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'roastchestnut', take: true } },
      scene: [
        '늦가을 밤, 주점 앞 화로에서 숯이 탁탁 튄다.',
        '군밤 봉지를 내밀자 샹크스의 눈이 동그래진다. "오! 이거 내 최애다!"',
        '그가 화로 옆 나무 상자를 툭 차서 의자 삼아 내준다.',
        '한 손으로 군밤 껍질에 칼집을 내고, 엄지로 톡 눌러 깐다. 손놀림이 빠르다.',
        '"옛 선원들이랑 겨울 바다에서 이렇게 깠지. 다들 손 시리다고 투덜거렸어."',
        '"말없이 다 챙기던 부선장, 고기만 보면 달려들던 덩치 녀석…"',
        '"그 녀석들은 지금 각자 제 바다로 나갔다. 출항은 원래 그런 거야."',
        '그가 군밤 하나를 불빛에 비춰 본다. 껍질 속이 노랗게 빛난다.',
        '"근데 다들 떠나면, 누군가는 불 켜 놓고 기다려야 하잖아."',
        '"그래서 난 여기 남은 거다. 다들 언젠가 들를 수 있게. 하하, 멋있지?"',
        '화로 불빛이 그의 흉터를 스치고, 웃음이 조금 오래 머문다.',
        '"…근데 그 투덜거림이 그립더라. 이상하지?"',
      ],
      replies: [
        { say: '내가 투덜거려 줄까?', tier: 'great', remember: 'chestnut-night', face: 'laugh', answer: ['다하하하! 좋다, 마음껏 투덜거려!', '오늘 밤은 그게 제일 반가운 소리다.'] },
        { say: '하나도 안 이상해', tier: 'good', remember: 'chestnut-night', face: 'smile', answer: ['…그래. 고맙다.', '마지막 한 알은 네 거다. 선장 명령이야.'] },
        { say: '껍질 까기 귀찮다', tier: 'meh', remember: 'chestnut-night', face: 'calm', answer: ['하하, 그럼 내가 까 줄게.', '한 손이지만 빠르다. 봐.'] },
      ],
    },
    {
      title: '선장의 약속',
      hint: '샹크스와 배에 같이 타겠다는 약속을 나누면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'sail-with' },
      scene: [
        '주점 문을 닫은 늦은 밤. 등불 하나만 남기고 의자들을 다 올려 두었다.',
        '샹크스가 까치발을 들고 벽의 낡은 해도를 한 손으로 조심스레 내린다.',
        '"이건 옛 친구들이랑 그린 지도다. 반은 허풍이고 반은 진짜야."',
        '바다 얼룩, 술 자국, 누군가 그려 넣은 웃는 고기 그림이 빼곡하다.',
        '"여긴 폭풍에 돛대가 부러진 데. 여긴 덩치 녀석이 고기 굽다 불낸 데."',
        '"그리고 여기… 이 마을은 이 지도에 없다. 그땐 몰랐거든."',
        '그가 해도를 접어 선반에 올리고, 새하얀 종이 한 장을 펼친다.',
        '"너랑 배 타기로 했잖아. 그래서 새 지도를 그리려고."',
        '그가 펜을 내민다. 잉크 냄새와 바닷바람이 함께 섞인다.',
        '"출항할 때 첫 줄은 같이 타는 사람이 긋는 거다. 그게 내 배 규칙이야."',
        '"어디로 가고 싶은지. 그리고 어디로 돌아오고 싶은지."',
      ],
      replies: [
        { say: '이 마을에서 시작하자', tier: 'great', face: 'shy', answer: ['…하하. 출발점이자 돌아올 데로구나.', '좋다. 그럼 여기에 제일 먼저 등불 하나 그려 두자.'] },
        { say: '네가 가 보고 싶었던 데로', tier: 'good', face: 'laugh', answer: ['그런 데가 많아서 큰일이다. 다하하!', '그럼 종이를 더 사 와야겠네. 쓰레쉬네 가게에서.'] },
        { say: '그림을 못 그려', tier: 'meh', face: 'calm', answer: ['괜찮아. 비뚤어진 선이 제일 재밌는 길이 되거든.', '내 옛 지도도 다 삐뚤빼뚤하다.'] },
      ],
    },
    {
      title: '바다 너머의 이야기',
      hint: '샹크스와 아주 가까워지면 그가 아무한테도 안 한 이야기를 꺼내요. 그 뒤엔 꽃다발도 웃으며 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 밤, 손님이 다 간 주점. 빗소리가 창을 톡톡 두드린다.',
        '샹크스가 우유 두 잔을 내려놓고, 한 잔을 네 쪽으로 슥 민다.',
        '"{me}. 난 바다에서 많은 걸 찾았다. 친구, 보물, 흉터까지."',
        '"잃은 것도 있었지. 근데 그건 아깝지 않았다. 더 좋은 걸 남겼거든."',
        '그가 빈 소매를 무심히 툭 치고 웃는다. 아무렇지 않은 얼굴이다.',
        '"늘 떠나는 쪽이었다. 손 흔드는 사람을 뒤에 두고 출항하는 쪽."',
        '"근데 땅에 내리고 나서 처음으로 찾은 게 있어. 떠나기 싫은 이유."',
        '그가 잔을 만지작거리다 웃는다. 평소보다 조금 작은 웃음이다.',
        '선반 위 밀짚모자가 등불에 흔들려 그림자를 드리운다.',
        '"…아니다. 이건 다음에 말하지. 선장도 겁날 때가 있거든."',
        '"꽃 같은 건 쑥스러워서 싫다고 했는데… 네가 주는 건, 글쎄."',
        '그가 고개를 돌려 창밖 빗줄기를 본다. 귀 끝이 머리색처럼 붉다.',
      ],
      replies: [
        { say: '기다릴게. 천천히 해', tier: 'great', face: 'shy', answer: ['…다하하. 너한테는 못 당하겠다.', '꽃은 안 어울린다고 했었는데, 네가 주는 건 다르려나.', '그때는 웃으면서 받을게. 약속이다.'] },
        { say: '지금 말해 줘!', tier: 'good', face: 'laugh', answer: ['하하하! 급하네.', '바다 사람은 물때를 기다리는 법이다. 조금만.'] },
        { say: '피곤해서 먼저 갈게', tier: 'meh', face: 'calm', answer: ['그래, 조심히 가. 우산 가져가.', '…다음엔 꼭 말할게.'] },
      ],
    },
    {
      title: '같은 배를 탄 사람',
      hint: '샹크스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽 선착장. 물안개 사이로 샹크스의 빨간 머리가 먼저 보인다.',
        '작은 낚싯배 한 척이 밧줄에 묶여 출렁인다. 뱃머리에 새 이름이 칠해져 있다.',
        '"왔구나. 이 배, 오늘 처음 띄운다. 이름은 아직 비밀이다."',
        '그가 망토를 여미고 한동안 바다를 본다. 갈매기가 돛대에 내려앉는다.',
        '"전에 말 못 한 거. 땅에서 처음 찾은 거 말이야."',
        '"너였다. 하하, 말하고 나니까 별거 아니네."',
        '"평생 출항만 했던 놈이, 처음으로 돌아올 데를 갖고 싶어졌다."',
        '"{me}, 네가 내 항구다. 어디까지 나가도 너한테 돌아올 거다."',
        '그가 한 손을 내민다. 굳은살 박인, 따뜻하고 단단한 손이다.',
        '"이제 배든 주점이든, 같은 데 타고 가자. 끝까지."',
        '물안개가 걷히고, 뱃머리 이름이 드러난다. 그 글자는 네 이름이다.',
        '"…반지는 아직이다. 그건 둘이서 고르는 게 멋있잖아. 다하하!"',
      ],
      replies: [
        { say: '끝까지 같이 가자', tier: 'great', remember: 'my-port', face: 'laugh', answer: ['다하하하! 들었지, 바다야!', '오늘 밤은 평생 최고의 잔치다!', '…고맙다, {me}. 진심이다.'] },
        { say: '멀미약은 챙겨 줘', tier: 'good', remember: 'my-port', face: 'laugh', answer: ['하하하! 평생치 사 두지.', '반지는… 그건 네가 준비하는 걸로 할까? 농담이다. 같이 고르자.'] },
        { say: '아직은 천천히', tier: 'meh', remember: 'my-port', face: 'smile', answer: ['좋아. 천천히 가자.', '같은 배에만 있으면 돼. 바다는 넓고 시간도 많다.'] },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분히 했다. 우유 한 잔 더 하고 가.',
    '하하, 또 왔어? 반갑다. 잔은 늘 비워 두마.',
    '오늘 허풍은 다 들었다. 내일 새 걸로 가져와!',
    '바쁘면 가 봐. 주점은 안 도망간다. 다하하!',
    '또 보자, {me}. 뱃사람은 잘 가라고 안 한다.',
    '잔 닦는 중이다. 한 손으로도 반짝이지? 하하.',
    '오늘은 군밤이나 까면서 쉬자. 말은 내일 또 하고.',
    '불은 켜 둘게. 언제든 들어와라. 여긴 항구니까.',
  ],
};
