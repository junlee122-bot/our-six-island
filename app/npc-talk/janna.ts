// 잔나 — 범마을 신문 기자(시장 거리 신문사). 밝은 방송 말투의 해요체("속보입니다!",
// "바람이 그러는데요"). 날씨 예보가 특기인데 자주 틀린다(정정 보도 농담). 바람·새·
// 깃털, 사람을 지켜 주고 싶은 마음, 큰 도시 신문사 수습 시절, 바람의 정령이라는
// 소문. 첫마디는 오늘 마을 소식을 취재하는 쪽으로 기운다. 우체부 신짜장을 몰래
// 좋아하는 건 살짝만. 가붕·럭스와는 예보 맞수. 원작 대사는 옮기지 않는다.
// 이야기 여섯 장은 하나의 실: 첫 기사 → 새벽 바람 → 지키고 싶은 것 → 폭풍 속
// 바람막이 → 고친 적 없는 날씨 칸 → 단 한 장 찍은 신문과 하얀 깃털.
import type { NpcTalkBook } from './types.ts';

export const JANNA_TALK: NpcTalkBook = {
  npc: 'janna',
  memories: {
    'forecast-fan': '잔나의 예보를 믿는다고 했어요',
    'gave-quote': '신문에 실릴 한마디를 해 줬어요',
    'headline-pal': '기사 제목을 같이 지었어요',
    'wind-secret': '바람의 정령 소문을 같이 웃어넘겼어요',
    'feather-pen': '깃털 펜 이야기를 들었어요',
    'city-past': '큰 도시 수습기자 시절 이야기를 들었어요',
    'shield-wind': '누군가를 지키는 게 꿈이라고 들었어요',
    'bird-friend': '새들이 소식을 물어 온다고 믿어 줬어요',
    'post-secret': '우체국 앞 비밀을 지켜 주기로 했어요',
    'correction-ok': '정정 보도도 멋있다고 했어요',
    'deadline-help': '마감 날 오타를 찾아 줬어요',
    'own-column': '신문에 내 코너가 생기기로 했어요',
    'dawn-wind': '새벽 뒷산에서 바람을 함께 읽었어요',
    'tea-scoop': '꽃차를 마시며 특종 회의를 했어요',
    'taste-heard': '내 취향을 취재 수첩에 적어 줬어요',
    'date-off': '데이트는 기사로 안 쓰기로 했어요',
    'bday-plan': '생일 축하 기사를 약속받았어요',
    'kite-pal': '뒷산에서 연을 같이 날리기로 했어요',
    'wind-name': '바람마다 붙인 이름을 들었어요',
    'storm-song': '폭풍 밤에 부르는 노래를 듣고 싶다고 했어요',
    'alley-story': '실리지 못한 뒷골목 기사를 싣자고 했어요',
    'taste-team': '빵집 시식회 맛 평가를 맡기로 했어요',
    'night-beat': '카지노의 밤 취재 이야기를 들었어요',
    'hair-wind': '바람에 날린 머리도 예쁘다고 했어요',
    'cat-news': '고양이 소식 칸을 좋아한다고 했어요',
    'press-pal': '인쇄기 돌풍이를 보러 가기로 했어요',
    'quiet-news': '평화로운 날이 제일 좋은 기사라고 했어요',
    'fav-breeze': '가을 저녁 바람을 좋아한다고 했어요',
    'asked-janna': '잔나가 언제 행복한지 물어봤어요',
    'bet-cheer': '가붕과의 예보 내기를 응원했어요',
    'feather-box': '아끼는 하얀 깃털 이야기를 들었어요',
    'letter-reply': '익명 편지에 답장을 실어 보라고 했어요',
    'star-watch': '신문사 지붕에서 별을 보기로 했어요',
    'outing-talk': '함께 취재 다닌 날을 이야기했어요',
  },
  talks: [
    {
      id: 'forecast-trust',
      open: '{me} 님, 솔직하게요. 제 날씨 예보, 믿으세요? 인터뷰 아니에요. 진짜 궁금해서요.',
      replies: [
        { say: '난 늘 믿어', tier: 'great', remember: 'forecast-fan', face: 'wow', answer: ['어머… 독자 한 분 확보! 아니, 제일 소중한 독자예요!', '내일 예보는 {me} 님 위해 두 번 확인할게요!'] },
        { say: '반쯤은 믿어', tier: 'good', face: 'laugh', answer: ['반이면 높은 편이에요! 가붕 씨는 사분의 일이래요.', '럭스 씨는… 묻지 않기로 했어요. 마음이 아파서요.'] },
        { say: '우산은 늘 챙겨', tier: 'meh', face: 'sorry', answer: '…현명한 독자세요. 정정 보도 담당으로서 할 말이 없네요.' },
      ],
    },
    {
      id: 'quote',
      open: '내일 신문에 "이웃의 한마디" 코너가 있어요. {me} 님, 한마디만 해 주실래요?',
      replies: [
        { say: '이 마을이 좋아요!', tier: 'great', remember: 'gave-quote', answer: ['받아 적었어요! 짧고 굵고 따뜻하고!', '내일 일면 아래쪽이에요. 제일 많이 읽히는 자리예요!'] },
        { say: '오늘 밥이 맛있었어요', tier: 'good', face: 'laugh', answer: '하하, 생활 밀착형이네요! 독자들이 제일 좋아하는 종류예요.' },
        { say: '노코멘트', tier: 'meh', face: 'calm', answer: '…기자 인생 최대의 벽이네요. 다음엔 꼭 따낼 거예요!' },
      ],
    },
    {
      id: 'headline',
      open: '오늘 기사 제목이 안 나와요! "빵집 신메뉴 출시"… 너무 심심하죠? 도와줘요!',
      replies: [
        { say: '"마을이 고소해졌다"', tier: 'great', remember: 'headline-pal', answer: ['그거예요! 바람이 무릎을 쳤어요!', '제목 공동 작업자로 {me} 님 이름 올릴게요!'] },
        { say: '"빵 나왔다" 어때?', tier: 'good', face: 'laugh', answer: '하하! 짧긴 한데 힘이 있어요. 부제로 쓸게요!' },
        { say: '그냥 그대로 써', tier: 'meh', face: 'think', answer: '정직한 보도도 좋죠… 근데 독자는 맛있는 제목을 원해요!' },
      ],
    },
    {
      id: 'wind-spirit',
      open: '제가 바람의 정령이라는 소문이 있대요. {me} 님도 들으셨어요? 어이없죠?',
      replies: [
        { say: '그럼 예보가 왜 틀려?', tier: 'great', remember: 'wind-secret', face: 'laugh', answer: ['바로 그거예요! 제가 늘 하는 반박이에요!', '정령이면 다 맞혔겠죠! 아니, 맞혀야죠!'] },
        { say: '조금은 그럴 것 같아', tier: 'good', face: 'shy', answer: '…어머. 바람이 웃는 것 같은 건 기분 탓이에요. 아마도요.' },
        { say: '소문엔 관심 없어', tier: 'meh', face: 'think', answer: '기자 앞에서 그런 말을! 소문은 특종의 씨앗이라고요.' },
      ],
    },
    {
      id: 'feather-pen',
      open: '이 깃털 펜 예쁘죠? 갈매기가 창가에 떨어뜨리고 갔어요. 선물인 것 같아요.',
      replies: [
        { say: '갈매기가 팬인가 봐', tier: 'great', remember: 'feather-pen', answer: ['그렇죠? 저도 그렇게 믿어요!', '독자층이 하늘까지 넓어요. 구독료는 생선으로 받아요!'] },
        { say: '글씨가 잘 써져?', tier: 'good', face: 'smile', answer: '마감 직전엔 펜이 저보다 빨라요. 바람 깃털이라 그런가 봐요.' },
        { say: '그냥 주운 거잖아', tier: 'meh', face: 'sorry', answer: '…사실 보도는 가끔 낭만이 없네요. 그래도 선물이에요!' },
      ],
    },
    {
      id: 'city-past',
      open: '저 큰 도시 신문사에서 수습 했었어요. 일 년 내내 커피만 날랐지만요.',
      replies: [
        { say: '그때 얘기 더 해 줘요', tier: 'great', remember: 'city-past', face: 'calm', answer: ['뒷골목까지 취재 다녔어요. 아무도 안 듣는 이야기들이 있었거든요.', '그래서 여기선 다 들어 주고 싶어요. 작은 이야기까지요.'] },
        { say: '지금은 편집장이잖아요', tier: 'good', face: 'laugh', answer: '맞아요! 기자도 저, 편집장도 저! 승진이 엄청 빨랐죠?' },
        { say: '커피는 잘 타요?', tier: 'meh', face: 'think', answer: '…그게 제일 늘었어요. 슬프게도요. 한 잔 드릴까요?' },
      ],
    },
    {
      id: 'protect',
      open: '{me} 님, 기자 말고 꿈이 있다면 뭘 것 같아요? 맞혀 보세요!',
      replies: [
        { say: '누군가를 지키는 사람', tier: 'great', remember: 'shield-wind', face: 'wow', answer: ['…어떻게 아셨어요? 아무한테도 말 안 했는데.', '바람막이 같은 사람이요. 찬바람 부는 날 앞에 서 주는.'] },
        { say: '기상 예보관?', tier: 'good', face: 'laugh', answer: '하하! 그건 이미 하고 있죠. 적중률만 빼면요!' },
        { say: '부자?', tier: 'meh', face: 'calm', answer: '그건 무잔 지점장님 꿈 같은데요. 저는 조금 달라요.' },
      ],
    },
    {
      id: 'birds',
      open: '아침마다 새들이 창가에 와요. 걔네가 소식을 물어 온다고 하면 믿으실래요?',
      replies: [
        { say: '믿어요, 새는 다 알아', tier: 'great', remember: 'bird-friend', answer: ['역시! 오늘 아침엔 참새가 시장 물가 소식을 줬어요.', '나세라 조합장님 시세표랑 똑같았어요. 정확했어요!'] },
        { say: '그래서 예보가 틀리나?', tier: 'good', face: 'laugh', answer: '하하! 갈매기 제보는 좀 부정확해요. 걔들은 생선 생각만 하거든요.' },
        { say: '새는 시끄러워요', tier: 'meh', face: 'sorry', answer: '그건… 부정할 수 없네요. 아침 회의가 좀 길어요.' },
      ],
    },
    {
      id: 'post-office',
      open: '저 매일 아침 우체국 앞에 서 있는 거, 신문 받으려는 거예요. 그것뿐이에요. 진짜로요.',
      replies: [
        { say: '비밀은 지켜 줄게요', tier: 'great', remember: 'post-secret', face: 'shy', answer: ['무, 무슨 비밀이요! …고마워요.', '바람한테도 입단속 시킬게요. 바람이 제일 수다쟁이거든요.'] },
        { say: '신짜장 씨 때문이죠?', tier: 'good', face: 'shy', answer: '쉿! 목소리가 너무 커요! 볼리바스 씨보다 커요!' },
        { say: '신문은 배달되잖아요', tier: 'meh', face: 'wow', answer: '…그, 그건 기자의 확인 습관이에요. 확인이요!' },
      ],
    },
    {
      id: 'correction',
      open: '어제 맑음이라고 썼는데 비가 왔어요. 오늘도 정정 보도 나가요. 창피해요.',
      replies: [
        { say: '고치는 게 더 멋있어요', tier: 'great', remember: 'correction-ok', face: 'smile', answer: ['…{me} 님.', '이 말 액자에 넣어서 책상에 걸어 둘 거예요. 진짜로요.'] },
        { say: '내일은 맞힐 거예요', tier: 'good', answer: '응원 감사합니다! 내일은 바람한테 두 번 물어볼게요!' },
        { say: '예보를 그만두면?', tier: 'meh', face: 'sorry', answer: '그건 안 돼요! 틀려도 계속 해야 언젠가 다 맞히죠!' },
      ],
    },
    {
      id: 'deadline',
      open: '마감 한 시간 전이에요! {me} 님, 이 원고 오타 좀 같이 봐 주실래요?',
      replies: [
        { say: '맡겨요, 다 찾을게요', tier: 'great', remember: 'deadline-help', answer: ['세 개나 찾으셨어요!', '오늘부터 객원 교정 기자로 임명합니다! 박수!'] },
        { say: '응원만 할게요', tier: 'good', face: 'laugh', answer: '응원도 큰 힘이에요! 회오리처럼 쓰고 올게요!' },
        { say: '마감이 뭐예요?', tier: 'meh', face: 'wow', answer: '…기자 앞에서 그 말은 폭풍 경보급이에요. 부러워요.' },
      ],
    },
    {
      id: 'umbrella',
      open: '제 줄무늬 우산 보셨어요? 바람에 뒤집힌 게 벌써 몇 번째인지 몰라요.',
      replies: [
        { say: '그래도 꿋꿋하네요', tier: 'great', face: 'laugh', answer: ['그렇죠! 이 우산이랑 저랑 닮았어요.', '뒤집혀도 다시 펴요. 그게 우리 둘의 장기예요!'] },
        { say: '새로 사요', tier: 'good', face: 'calm', answer: '정이 들어서 못 버려요. 취재 현장을 다 함께 다녔거든요.' },
        { say: '우산 안 쓰면 되잖아요', tier: 'meh', face: 'think', answer: '그럼 깃털 펜이 젖어요! 기자의 생명이라고요.' },
      ],
    },
    {
      id: 'kite',
      open: ['바람 좋은 날엔 뒷산에서 연을 날려요. 취재 핑계로요.', '{me} 님은 연 날려 본 적 있어요? 실 감는 게 진짜 어려워요!'],
      replies: [
        { say: '같이 날리러 가요!', tier: 'great', remember: 'kite-pal', answer: ['좋아요! 제 연 이름은 "호외"예요. 꼬리에 깃털을 달았어요.', '바람한테 미리 말해 둘게요. {me} 님 연부터 띄워 달라고요!'] },
        { say: '연은 나무에 걸리던데', tier: 'good', face: 'laugh', answer: ['하하! 제 연도 뒷산 소나무에 세 번 걸렸어요.', '그때마다 볼리바스 씨가 출동했어요. 사건 일지에 다 있대요.'] },
        { say: '바람 세면 위험해요', tier: 'meh', face: 'think', answer: '맞아요. 폭풍 오는 날은 연 대신 수첩만 들고 나가요. 약속해요.' },
      ],
    },
    {
      id: 'wind-names',
      open: '저 바람마다 이름 붙여 줘요. 아침 동풍은 "새벽이", 겨울 북풍은 "꽁꽁이"예요.',
      replies: [
        { say: '봄바람 이름은요?', tier: 'great', remember: 'wind-name', face: 'smile', answer: ['봄바람은 "살랑이"예요! 꽃잎 소식을 제일 먼저 물어 와요.', '{me} 님 바람도 하나 지어 드릴까요? …"포근이" 어때요?'] },
        { say: '이름 짓는 거 귀엽다', tier: 'good', face: 'shy', answer: '귀, 귀엽다니요! 기자의 정확한 분류 체계예요. 정확… 해요.' },
        { say: '바람은 다 같은 바람이죠', tier: 'meh', face: 'sorry', answer: '어머, 바람이 들으면 서운해해요. 오늘 머리 엄청 날릴걸요?' },
      ],
    },
    {
      id: 'storm-song',
      open: '폭풍 치는 밤엔 창가에서 노래를 흥얼거려요. 그럼 바람이 조금 순해지거든요.',
      replies: [
        { say: '나도 들어 보고 싶어요', tier: 'great', remember: 'storm-song', face: 'shy', answer: ['…아무한테도 안 불러 줬는데. 봇치 씨 기타보다 훨씬 못해요.', '그래도 다음 폭풍 밤엔 {me} 님 쪽 창문 보고 부를게요.'] },
        { say: '정말 순해져요?', tier: 'good', face: 'think', answer: '제 기분일 수도 있어요. 근데 무서운 밤엔 기분이 제일 중요하잖아요.' },
        { say: '그냥 자는 게 낫죠', tier: 'meh', face: 'laugh', answer: '하하, 그것도 맞아요. 근데 바람이 혼자 떠들면 쓸쓸할까 봐요.' },
      ],
    },
    {
      id: 'alley-story',
      open: ['수습 시절, 자운 뒷골목에 간 적 있어요. 공기가 탁한 동네였어요.', '거기 아이들 이야기를 기사로 썼는데, 한 줄도 안 실렸어요.'],
      replies: [
        { say: '그 기사 지금 실어요', tier: 'great', remember: 'alley-story', face: 'wow', answer: ['…{me} 님. 그 생각은 한 번도 못 해 봤어요.', '다음 호 귀퉁이에 실을게요. 늦게라도 들어 주는 사람이 있다고요.'] },
        { say: '속상했겠어요', tier: 'good', face: 'calm', answer: '많이요. 그래서 여기선 작은 소식도 다 실어요. 고양이 이사 소식까지요.' },
        { say: '도시는 원래 그래요', tier: 'meh', face: 'sorry', answer: '…그 말이 제일 싫었어요. 그래서 도시를 떠났나 봐요.' },
      ],
    },
    {
      id: 'tasting',
      open: '프리렌 씨 빵집 신메뉴 시식회 취재 가요! 근데 먹기만 하고 기사를 못 쓴 적이 많아요.',
      replies: [
        { say: '맛 평가는 제가 할게요', tier: 'great', remember: 'taste-team', answer: ['좋아요! 시식 전담 객원 기자! 프리렌 씨는 표정이 안 바뀌어요.', '대신 힘멜 씨가 옆에서 다 말해 줘요. "이번 건 자신작이래요!"'] },
        { say: '빵 냄새 기사 써요', tier: 'good', face: 'laugh', answer: '"오늘 시장 거리는 버터 맑음." 어때요? 날씨 칸에 넣을래요.' },
        { say: '다이어트 중이에요', tier: 'meh', face: 'sorry', answer: '아… 그럼 수첩만 들고 가세요. 저는 두 개 먹을게요. 죄송해요.' },
      ],
    },
    {
      id: 'prices',
      open: '나세라 조합장님 주간 시세표 받아 왔어요. 숫자는 정확한데 제목이 늘 고민이에요.',
      replies: [
        { say: '"감자가 웃었다" 어때?', tier: 'great', remember: 'headline-pal', face: 'laugh', answer: ['감자 값 내린 주에 딱이에요! 조합장님도 웃으실 거예요.', '…아마도요. 조합장님 웃는 건 예보보다 어려워요.'] },
        { say: '시세는 그냥 표로', tier: 'good', face: 'think', answer: '정직한 의견이에요. 표 옆에 작은 바람 그림만 넣을게요.' },
        { say: '시세는 안 봐요', tier: 'meh', face: 'sorry', answer: '어머, 장날 장보기 손해 봐요! 다음 호는 꼭 보세요. 진심이에요.' },
      ],
    },
    {
      id: 'casino-night',
      open: '카지노의 밤 특집은 미쿠 씨랑 같이 써요. 근데 저 카드 규칙을 하나도 몰라요.',
      replies: [
        { say: '규칙은 몰라도 돼요', tier: 'great', remember: 'night-beat', answer: ['그쵸? 저는 사람 얼굴을 써요. 이긴 사람, 진 사람, 웃는 사람.', '미쿠 씨가 그러는데 제가 제일 표정 관리를 못 한대요. 하하.'] },
        { say: '같이 배워요', tier: 'good', face: 'smile', answer: '좋아요! 지는 사람이 커피 사기예요. 수습 시절 실력 보여 줄게요.' },
        { say: '카지노는 위험해요', tier: 'meh', face: 'think', answer: '그래서 취재만 해요! 돈은 지갑에, 수첩은 손에. 기자 원칙이에요.' },
      ],
    },
    {
      id: 'gwen-hair',
      open: '그웬 씨가 광장 예보 전에 머리를 해 줘요. 근데 바람이 늘 다 날려 버려요.',
      replies: [
        { say: '날린 머리도 예뻐요', tier: 'great', remember: 'hair-wind', face: 'shy', answer: ['…정말요? 그웬 씨한테 꼭 전할게요. 원장님 기운 나시게요.', '사실 그웬 씨도 그랬어요. "잔나 씨 머리는 바람이 완성해요."'] },
        { say: '모자를 써 봐요', tier: 'good', face: 'laugh', answer: '모자는 세 개 날렸어요! 하나는 가붕 씨 등대 꼭대기에 걸려 있어요.' },
        { say: '머리 묶으면 되잖아요', tier: 'meh', face: 'calm', answer: '묶어도 풀어져요. 바람이 제 머리끈을 좋아하나 봐요.' },
      ],
    },
    {
      id: 'furniture',
      open: '발키리 씨 가구점 의자 기사를 썼더니 하루 만에 다 팔렸대요! 신문의 힘이에요!',
      replies: [
        { say: '잔나 기사 덕분이네요', tier: 'great', face: 'laugh', answer: ['헤헤, 그렇죠? 발키리 씨는 "그냥 의자가 좋아서"래요.', '그래서 다음 기사 제목은 "의자가 좋아서"로 정했어요!'] },
        { say: '나도 의자 사야겠다', tier: 'good', face: 'smile', answer: '서두르세요! 다음 의자는 나무를 말려야 해서 계절이 바뀌어야 나온대요.' },
        { say: '광고 아니에요?', tier: 'meh', face: 'sorry', answer: '아, 아니에요! 정직한 생활 정보예요. …정말이에요!' },
      ],
    },
    {
      id: 'tipster',
      open: '야니네코 씨가 제일 부지런한 제보자예요. 근데 제보 절반이 고양이 소식이에요.',
      replies: [
        { say: '고양이 소식 최고예요', tier: 'great', remember: 'cat-news', answer: ['그쵸! "고양이 소식" 칸을 따로 만들었어요. 반응이 일면보다 좋아요.', '오늘 소식은 "까망이, 생선 가게 앞에서 낮잠." 평화롭죠?'] },
        { say: '나머지 절반은요?', tier: 'good', face: 'laugh', answer: '자취방 라면 신메뉴 소식이요. 그것도 실어요. 대학생 독자 확보!' },
        { say: '그건 기사가 아니잖아요', tier: 'meh', face: 'think', answer: '작은 소식도 소식이에요. 큰 소식만 실으면 마을이 무서워 보여요.' },
      ],
    },
    {
      id: 'fortune',
      open: '쿠도 신이치 씨 점괘랑 제 예보, 내일 날씨를 두고 대결했어요. 결과는요…',
      replies: [
        { say: '잔나가 이겼죠?', tier: 'great', face: 'laugh', answer: ['…둘 다 틀렸어요! 신이치 씨는 "추리가 빗나간 날도 있지"래요.', '그래서 같이 정정 보도 냈어요. 처음으로 공동 정정이에요!'] },
        { say: '점괘가 이겼을 것 같은데', tier: 'good', face: 'sorry', answer: '어머, 정확한 추리네요. 신이치 씨 천막 앞에 줄이 더 길어졌어요.' },
        { say: '점은 안 믿어요', tier: 'meh', face: 'think', answer: '저도 반만 믿어요. 근데 제 예보도 반만 믿어 주시잖아요. 공평하죠?' },
      ],
    },
    {
      id: 'muzan-word',
      open: '무잔 지점장님은 주식 기사마다 꼭 한마디 얹어요. "오르는 날엔 내 이름을 크게."',
      replies: [
        { say: '내리는 날엔요?', tier: 'great', face: 'laugh', answer: ['"그날은 날씨 칸을 크게." 래요. 하하, 제 예보가 방패예요.', '그래도 그 한마디는 늘 실어요. 독자들이 제일 먼저 읽거든요.'] },
        { say: '주식은 어려워요', tier: 'good', face: 'think', answer: '저도요! 그래서 "오늘 증권가는 흐림"처럼 날씨로 써요. 알기 쉽게요.' },
        { say: '지점장님 무서워요', tier: 'meh', face: 'sorry', answer: '…조금요. 근데 신문은 첫 장부터 정독하세요. 의외로 성실한 독자예요.' },
      ],
    },
    {
      id: 'press-name',
      open: '신문사 인쇄기 이름이 "돌풍이"예요. 돌아갈 때 소리가 꼭 회오리 같거든요.',
      replies: [
        { say: '돌풍이 보러 가도 돼요?', tier: 'great', remember: 'press-pal', face: 'wow', answer: ['정말요? 돌풍이가 낯을 좀 가리는데… {me} 님이면 괜찮아요.', '잉크 냄새 맡으면 기분 좋아져요. 저만 그런가요?'] },
        { say: '이름 잘 지었네요', tier: 'good', face: 'smile', answer: '그쵸! 오른 씨가 고쳐 준 뒤로 소리가 더 씩씩해졌어요.' },
        { say: '그냥 기계잖아요', tier: 'meh', face: 'sorry', answer: '쉿! 돌풍이 듣겠어요. 삐지면 잉크를 엉뚱하게 뿌려요.' },
      ],
    },
    {
      id: 'quiet-day',
      open: '오늘은 아무 사건이 없었어요. {me} 님, 이런 날엔 신문에 뭘 쓰면 좋을까요?',
      replies: [
        { say: '"오늘도 평화" 크게요', tier: 'great', remember: 'quiet-news', face: 'smile', answer: ['…좋아요. 사실 그게 제일 좋은 기사예요.', '아무도 안 다치고, 다들 밥 잘 먹은 날. 일면감이에요.'] },
        { say: '날씨 칸을 크게요', tier: 'good', face: 'laugh', answer: '그럼 틀린 예보도 크게 나가요! 용기가 필요하네요.' },
        { say: '쉬면 되잖아요', tier: 'meh', face: 'think', answer: '기자는 쉬는 날도 바람 소리를 들어요. 버릇이에요.' },
      ],
    },
    {
      id: 'fav-breeze',
      open: '{me} 님은 어느 계절 바람이 제일 좋아요? 독자 설문이에요. 사실 제 궁금증이에요.',
      replies: [
        { say: '가을 저녁 바람이요', tier: 'great', remember: 'fav-breeze', face: 'wow', answer: ['저도요! 가을 저녁 바람은 소식을 멀리멀리 날라요.', '그래서 가을엔 신문이 잘 읽혀요. 바람이 책장을 넘겨 주거든요.'] },
        { say: '봄바람이요', tier: 'good', face: 'smile', answer: '꽃잎이랑 같이 오는 바람이죠! 재채기 주의보도 같이 나가요.' },
        { say: '바람은 다 추워요', tier: 'meh', face: 'sorry', answer: '어머… 그럼 {me} 님 쪽엔 바람막이를 세워 둘게요. 제가요.' },
      ],
    },
    {
      id: 'interview-her',
      open: '늘 제가 묻기만 하잖아요. 오늘은 {me} 님이 저한테 질문해 볼래요? 아무거나요!',
      replies: [
        { say: '언제 제일 행복해요?', tier: 'great', remember: 'asked-janna', face: 'shy', answer: ['어… 기자가 받는 질문 중에 제일 어렵네요.', '마감 끝내고 창문 열 때요. 바람이 "수고했다" 하는 것 같거든요.', '…아, 그리고 지금이요. 이건 받아 적지 마세요.'] },
        { say: '예보 적중률은요?', tier: 'good', face: 'laugh', answer: '영업 비밀입니다! 다음 질문 받겠습니다!' },
        { say: '질문 없어요', tier: 'meh', face: 'calm', answer: '그럼 제가 계속 물을게요. 기자의 숙명이에요.' },
      ],
    },
    {
      id: 'gabung-bet',
      open: '가붕 씨랑 내기했어요. 이번 주 예보 지는 쪽이 등대 계단 청소래요. 백 칸이요.',
      replies: [
        { say: '잔나가 이길 거예요', tier: 'great', remember: 'bet-cheer', answer: ['그 말 믿고 오늘은 바람한테 세 번 물어봤어요!', '혹시 지면… {me} 님, 걸레 하나만 같이 들어 줄래요?'] },
        { say: '가붕 씨 무릎이 정확하던데', tier: 'good', face: 'sorry', answer: '그 무릎! 비 오기 전날 쑤신대요. 기상 장비로는 반칙이에요!' },
        { say: '내기는 하지 마요', tier: 'meh', face: 'think', answer: '맞는 말이에요. 근데 가붕 씨가 먼저 외쳤어요. 온 항구가 다 들었어요.' },
      ],
    },
    {
      id: 'lux-sorry',
      open: '럭스 씨가 제 예보 믿고 배 띄웠다가 비 맞았대요. 사과하러 갈 건데 뭘 들고 갈까요?',
      replies: [
        { say: '꽃차랑 진심이요', tier: 'great', face: 'smile', answer: ['역시 그게 제일이죠. 럭스 씨는 화내도 금방 웃어요.', '"언니 예보는 반대로 들으면 돼요" 하면서요. …그건 좀 아파요.'] },
        { say: '생선 사러 가요', tier: 'good', face: 'laugh', answer: '어시장에서 사면 럭스 씨 매상이 오르니까요! 일석이조 사과예요!' },
        { say: '럭스 씨가 확인했어야죠', tier: 'meh', face: 'sorry', answer: '그래도 제 예보잖아요. 틀린 건 제가 책임져요. 기자니까요.' },
      ],
    },
    {
      id: 'feather-box',
      open: '깃털 모으는 상자가 있어요. 갈매기, 참새, 까치… 다 소식 하나씩 물어 온 애들이에요.',
      replies: [
        { say: '제일 아끼는 깃털은요?', tier: 'great', remember: 'feather-box', face: 'shy', answer: ['하얀 깃털 하나요. 이 마을에 온 첫날 어깨에 내려앉았어요.', '그날부터 여기가 집 같았어요. 바람이 "여기야" 하는 것 같아서요.'] },
        { say: '나도 하나 찾아 줄게요', tier: 'good', face: 'smile', answer: '정말요? 그럼 그 깃털엔 {me} 님 이름표를 달아 둘게요!' },
        { say: '털 날리지 않아요?', tier: 'meh', face: 'laugh', answer: '하하! 창문 열면 신문사 안에 눈이 오는 것 같아요. 그것도 운치예요.' },
      ],
    },
    {
      id: 'column',
      when: { ch: 3 },
      open: '{me} 님, 정식 제안이에요. 신문에 {me} 님 코너를 만들고 싶어요. 매주요!',
      replies: [
        { say: '좋아요, 같이 써요', tier: 'great', remember: 'own-column', face: 'shy', answer: ['야호! 코너 이름은 같이 정해요.', '첫 회는 제가 인터뷰할게요! 질문지는 벌써 세 장이에요!'] },
        { say: '무슨 코너인데요?', tier: 'good', face: 'think', answer: '"이 주의 이웃"이요. 근데 매주 {me} 님이에요. 편집장 권한이에요!' },
        { say: '부끄러워요', tier: 'meh', face: 'smile', answer: '그럼 사진은 뒷모습으로 할게요. 그래도 이름은 넣어요!' },
      ],
    },
    {
      id: 'post-letter',
      when: { ch: 2 },
      open: ['독자 편지 칸에 익명 편지가 왔어요. "매일 아침 우체국 앞에 서 계신 분께."', '…저 말고 또 누가 서 있나 봐요. 그렇죠? 그렇겠죠?'],
      replies: [
        { say: '답장을 실어 봐요', tier: 'great', remember: 'letter-reply', face: 'shy', answer: ['다, 답장이요? 신문에요? 온 마을이 보는데요?', '…짧게, 아주 짧게 쓸게요. "날씨 맑음. 내일도 서 있을 예정."'] },
        { say: '글씨체 보면 알겠죠', tier: 'good', face: 'wow', answer: '…볼리바스 씨 같은 소리 하지 마세요. 수사는 안 해요. 아마도요.' },
        { say: '장난 편지 아니에요?', tier: 'meh', face: 'sorry', answer: '그, 그럴 수도 있죠. 근데 장난이라도 기분은 맑음이에요.' },
      ],
    },
    {
      id: 'night-stars',
      when: { ch: 4 },
      open: '별 예보만은 한 번도 안 틀렸어요. 밤하늘은 거짓말을 안 하거든요. 오늘 같이 볼래요?',
      replies: [
        { say: '잔나 옆이면 좋아요', tier: 'great', remember: 'star-watch', face: 'shy', answer: ['…속보예요. 오늘 밤 신문사 지붕 위 예약 완료.', '방석은 제가 두 개 들고 갈게요. 바람은 순하게 부탁해 뒀어요.'] },
        { say: '별자리 알려 줘요', tier: 'good', face: 'smile', answer: '저기 큰 날개 모양 보여요? 제가 "바람새자리"라고 불러요. 비공식이에요.' },
        { say: '졸려요', tier: 'meh', face: 'calm', answer: '그럼 별은 제가 대신 봐 둘게요. 내일 아침 기사로 읽어 주세요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '속보입니다! 오늘 마을에 결혼식 소식이 있어요! {me} 님, 축하 한마디 부탁드려요!',
      replies: [
        { say: '오래오래 행복하세요!', tier: 'great', remember: 'gave-quote', answer: '받아 적었어요! 기사 맨 끝 줄로 쓸게요. 제일 좋은 자리예요!' },
        { say: '부럽네요', tier: 'good', face: 'shy', answer: '…저도요. 아, 이건 기사에 안 써요! 비공개예요!' },
        { say: '잘 모르는 사람이라', tier: 'meh', face: 'calm', answer: '그래도 축하는 바람처럼 퍼지는 거예요. 한마디만 더요!' },
      ],
    },
    {
      id: 'op-birthday',
      when: { news: 'birthday' },
      open: '오늘 생일인 이웃이 있대요! 바람이 알려 줬어요. 생일 축하 기사, 같이 쓸래요?',
      replies: [
        { say: '케이크 사진 넣어요!', tier: 'great', answer: '좋아요! 촛불 끄는 순간을 노릴게요. 셔터는 바람보다 빠르게!' },
        { say: '선물 고민 중이에요', tier: 'good', face: 'think', answer: '꽃차 어때요? 아, 그건 제가 좋아하는 거네요. 취재 실수!' },
      ],
    },
    {
      id: 'op-festival-news',
      when: { news: 'festival' },
      open: '축제 특집호 마감 중이에요! {me} 님, 오늘 축제에서 제일 좋았던 거 하나만요!',
      replies: [
        { say: '다 같이 웃던 순간', tier: 'great', remember: 'gave-quote', face: 'wow', answer: '…이걸 일면 제목으로 할게요. 사진보다 좋은 한 줄이에요.' },
        { say: '먹을 거요!', tier: 'good', face: 'laugh', answer: '하하! 정직한 시민의 목소리! 먹거리 지도 기사도 써야겠어요.' },
        { say: '아직 못 즐겼어요', tier: 'meh', answer: '그럼 지금 가요! 취재는 제가 할 테니 즐기는 건 {me} 님이 맡아요!' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '오늘 소식란에 전설 같은 이야기가 들어왔어요! 사실 확인 중인데… 떨려요!',
      replies: [
        { say: '같이 확인하러 가요', tier: 'great', answer: '역시 {me} 님! 특별 취재팀 결성이에요! 수첩 하나 더 챙길게요!' },
        { say: '진짜일까요?', tier: 'good', face: 'think', answer: '바람은 진짜래요. 근데 바람도 가끔 과장해요. 저처럼요.' },
        { say: '소문이겠죠', tier: 'meh', face: 'sorry', answer: '그렇게 말하면 기사가 한 줄로 끝나요! 상상은 해 줘요!' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '기록 경신 소식이에요! 오늘 신문 이면은 이걸로 꽉 찼어요. {me} 님도 보셨죠?',
      replies: [
        { say: '대단하더라고요!', tier: 'great', answer: '그쵸! 기록 기사는 쓰는 저도 신나요. 다음 기록은 {me} 님 차례예요!' },
        { say: '아직 못 봤어요', tier: 'good', face: 'smile', answer: '그럼 한 부 드릴게요! 따끈따끈해요. 방금 인쇄했거든요.' },
      ],
    },
    {
      id: 'op-museum',
      when: { news: 'museum' },
      open: '박물관에 새 전시품이 들어왔대요! 발견물 기사는 제가 제일 좋아하는 거예요!',
      replies: [
        { say: '사진 찍으러 같이 가요', tier: 'great', answer: '좋아요! 조명은 바람이, 셔터는 제가! {me} 님은 감탄 담당!' },
        { say: '어떤 물건이래요?', tier: 'good', face: 'think', answer: '아직 비밀이래요. 기자한테 비밀이라니, 더 궁금해요!' },
      ],
    },
    {
      id: 'op-breakup',
      when: { news: 'breakup' },
      open: '…오늘 소식 중에 슬픈 것도 있어요. 이런 건 쓰기가 제일 어려워요.',
      replies: [
        { say: '조용히 써 주세요', tier: 'great', face: 'smile', answer: ['네. 이름은 빼고 짧게요.', '찬바람은 제가 막아 줄 수 있으면 좋겠어요.'] },
        { say: '꼭 써야 해요?', tier: 'good', face: 'think', answer: '빼는 것도 기자의 일이에요. 오늘은 날씨 칸을 크게 할게요.' },
      ],
    },
    {
      id: 'op-friendnews',
      when: { friendNews: 'birthday' },
      open: '{me} 님 친구분 생일 소식이 들어왔어요! 축하 메시지 신문에 실어 드릴까요?',
      replies: [
        { say: '네, 크게 실어 주세요', tier: 'great', answer: '알겠습니다! 제일 큰 글씨로! 바람한테도 온 마을에 돌리라고 할게요!' },
        { say: '직접 말할래요', tier: 'good', face: 'smile', answer: '그게 제일 좋죠. 신문은 그 다음이에요. 멋지세요!' },
      ],
    },
    {
      id: 'op-friendnews-wedding',
      when: { friendNews: 'wedding' },
      open: '{me} 님 친구분 결혼 소식이에요! 하객 인터뷰, {me} 님이 첫 번째예요!',
      replies: [
        { say: '정말 기쁜 날이에요', tier: 'great', remember: 'gave-quote', answer: '얼굴에 다 쓰여 있어요! 이 표정 그대로 사진 한 장만요!' },
        { say: '울컥했어요', tier: 'good', face: 'shy', answer: '저도요… 기자는 울면 안 되는데. 펜이 젖었어요.' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '…비가 오네요. 제가 어제 맑음이라고 했죠. 네. 정정 보도 나갑니다.',
      replies: [
        { say: '비 와도 기사는 맑음', tier: 'great', remember: 'correction-ok', answer: ['{me} 님! 그 말 오늘의 한 줄로 쓸게요!', '날씨는 비, 기분은 맑음으로 정정합니다!'] },
        { say: '우산 같이 써요', tier: 'good', face: 'shy', answer: '고마워요. 제 우산은 방금 또 뒤집혔거든요.' },
        { say: '또 틀렸네요', tier: 'meh', face: 'sorry', answer: '…팩트 체크 감사합니다. 아프지만 정확해요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 소식입니다! 이번엔 맞혔어요! …사실 예보는 비였는데, 비슷하잖아요?',
      replies: [
        { say: '반은 맞았어요!', tier: 'great', face: 'laugh', answer: '그쵸! 물이 하늘에서 내린 건 맞으니까요! 적중으로 기록할게요!' },
        { say: '발자국 기사 써요', tier: 'good', face: 'smile', answer: '좋아요! 오늘 광장에 제일 먼저 온 발자국을 추적해 볼게요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침이에요! 새벽 바람이 오늘 첫 소식을 물어 왔어요. 들어 보실래요?',
      replies: [
        { say: '네, 첫 독자 할게요', tier: 'great', remember: 'bird-friend', answer: '오늘 첫 소식은… "{me} 님이 일찍 일어났다." 속보예요!' },
        { say: '졸려요…', tier: 'meh', face: 'smile', answer: '그럼 짧게요. 오늘은 맑음! 아마도요. 다시 주무셔도 돼요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 현장 생중계! 오늘 바람은 연날리기에 딱 좋아요! 이건 진짜 맞혀요!',
      replies: [
        { say: '연 같이 날려요!', tier: 'great', remember: 'kite-pal', answer: '좋아요! 바람한테 살짝 부탁해 둘게요. 우리 연이 제일 높이 갈 거예요!' },
        { say: '사진 찍어 드릴게요', tier: 'good', face: 'shy', answer: '어머, 기자가 찍히는 날이네요! 예쁘게 부탁해요!' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '특종이에요! {me} 님이 대어를 낚았다고 갈매기들이 난리예요! 인터뷰 부탁드려요!',
      replies: [
        { say: '바람 덕분이었어요', tier: 'great', face: 'shy', answer: '어머, 바람이 들으면 우쭐하겠어요. 제목은 "순풍이 도왔다"!' },
        { say: '실력이죠!', tier: 'good', face: 'laugh', answer: '당당한 한마디! 그대로 큰 글씨로 실을게요!' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '반짝이는 발견! 금별 작물 소식이에요! 이건 사진 없이는 못 써요!',
      replies: [
        { say: '제일 예쁜 걸로 찍어요', tier: 'great', answer: '고마워요! 햇빛 각도는 제가 맞출게요. 날씨 운은 오늘 좋아요!' },
        { say: '그냥 운이었어요', tier: 'good', face: 'smile', answer: '운도 기사 거리예요! "행운의 밭" 특집으로 갈게요.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님, 오늘 얼굴이 맑음이에요! 무슨 좋은 일 있었어요? 제보 받아요!',
      replies: [
        { say: '잔나 만나서요', tier: 'great', face: 'shy', answer: '…속보입니다. 잔나 기자 얼굴이 빨개졌습니다. 이상입니다.' },
        { say: '그냥 날이 좋아서요', tier: 'good', face: 'smile', answer: '그게 제일 좋은 소식이에요! 오늘 날씨 칸 옆에 써 둘게요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘은 기분이 흐림인가 봐요. 바람이 조용히 알려 줬어요.',
      replies: [
        { say: '좀 지쳤어요', tier: 'great', face: 'calm', answer: ['그럼 오늘은 인터뷰 없어요.', '제가 옆에서 바람막이 할게요. 말 안 해도 돼요.'] },
        { say: '괜찮아요', tier: 'good', face: 'smile', answer: '알겠어요. 그래도 내일 예보는 맑음이에요. {me} 님 쪽은 꼭요.' },
      ],
    },
    {
      id: 'op-sinjjajang',
      when: { bond: 'sinjjajang' },
      open: '{other} 씨 만나셨어요? 오늘… 무슨 얘기 했어요? 아니, 그냥요. 취재요.',
      replies: [
        { say: '잔나 얘기 하던데요', tier: 'great', face: 'shy', answer: ['네, 네에? 뭐, 뭐라고요?', '아니, 말하지 마세요! 아니, 해 주세요! 아니…'] },
        { say: '배달 얘기만 했어요', tier: 'good', face: 'calm', answer: '…그렇죠. 성실하신 분이라. 그것도 좋은 소식이에요.' },
      ],
    },
    {
      id: 'op-gabung',
      when: { bond: 'gabung' },
      open: '가붕 씨가 오늘 예보 뭐라고 했어요? 이번 주 예보 대결 신문에 실려요!',
      replies: [
        { say: '잔나가 이길 거예요', tier: 'great', remember: 'bet-cheer', answer: '그 응원, 바람에 실어 등대까지 보낼게요! 이번 주는 꼭 이겨요!' },
        { say: '가붕 씨는 맑음이래요', tier: 'good', face: 'think', answer: '…그럼 저는 흐림! 아니, 맑음? 정보가 너무 많아요!' },
      ],
    },
    {
      id: 'op-lux',
      when: { bond: 'lux' },
      open: '럭스 씨 만났어요? 또 제 예보 때문에 조업 망쳤다고 하던가요…',
      replies: [
        { say: '다음엔 믿겠대요', tier: 'great', face: 'wow', answer: '정말요? 그럼 내일 예보는 세 번 확인할게요! 신뢰는 소중해요!' },
        { say: '좀 화났던데요', tier: 'meh', face: 'sorry', answer: '…정정 보도에 사과문도 같이 실을게요. 꽃차 들고 가야겠어요.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '볼리바스 씨가 또 사건 제보를 했어요. 이번엔 화분이 사라졌대요!',
      replies: [
        { say: '바람이 옮긴 거 아녜요?', tier: 'great', face: 'laugh', answer: '하하! 그건… 사실 제가 바람한테 물어볼게요. 비공개로요.' },
        { say: '기사로 쓸 거예요?', tier: 'good', face: 'smile', answer: '물론이죠! 제목은 "화분의 행방", 형사물 느낌으로요.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '메르시 선생님이랑 건강 칼럼 쓰는 날이에요. {me} 님, 요즘 잘 주무세요?',
      replies: [
        { say: '네, 푹 자요', tier: 'great', answer: '모범 사례! 칼럼에 익명으로 실을게요. "이웃 씨는 잘 잔다."' },
        { say: '요즘 좀 피곤해요', tier: 'good', face: 'think', answer: '그럼 오늘 칼럼 주제는 그걸로! 선생님 처방도 받아 올게요.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄바람 특보! 꽃가루 주의보랑 꽃잎 소식이 같이 왔어요. {me} 님, 재채기 괜찮아요?',
      replies: [
        { say: '꽃잎 기사 써요!', tier: 'great', remember: 'wind-name', answer: ['좋아요! "살랑이가 꽃잎을 배달했다." 제목 어때요?', '신짜장 씨보다 빠른 배달부예요. …아, 이건 빼고요.'] },
        { say: '코가 간질해요', tier: 'good', face: 'sorry', answer: '꽃가루 주의보 적중이네요! 미안하지만 조금 기뻐요.' },
      ],
    },
    {
      id: 'op-summer-night',
      when: { season: 'summer', time: ['evening', 'night'] },
      open: '여름밤 특집! 반딧불이를 세는 중이에요. 근데 바람이 자꾸 흩어 놔요.',
      replies: [
        { say: '같이 세 줘요', tier: 'great', face: 'laugh', answer: ['고마워요! {me} 님은 왼쪽, 저는 오른쪽. …음, 많다! 많다로 할게요.', '정확한 숫자보다 예뻤다는 게 중요하죠. 기사에 그렇게 쓸게요.'] },
        { say: '덥지 않아요?', tier: 'good', face: 'calm', answer: '그래서 밤바람이 고마워요. 여름밤 바람은 마을의 부채예요.' },
        { say: '모기 많아요', tier: 'meh', face: 'sorry', answer: '…그것도 사실 보도네요. 모기 주의보 추가합니다.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을 수확 특집호 준비 중이에요! 나세라 조합장님 인터뷰를 또 거절당했어요.',
      replies: [
        { say: '같이 가서 부탁해요', tier: 'great', answer: ['정말요? {me} 님이 옆에 있으면 조합장님도 웃으실 것 같아요.', '질문은 딱 하나만요. "올해 제일 잘 자란 건 뭐예요?"'] },
        { say: '바쁘신가 봐요', tier: 'good', face: 'think', answer: '수확철엔 조합장님 시계가 두 배로 빨리 돌아요. 기다릴게요.' },
      ],
    },
    {
      id: 'op-winter-eve',
      when: { season: 'winter', time: ['evening', 'night'] },
      open: '겨울 북풍 "꽁꽁이" 출동이에요. {me} 님, 목도리 단단히 하세요!',
      replies: [
        { say: '잔나도 목도리 해요', tier: 'great', face: 'shy', answer: ['어머, 기자 걱정을 해 주시네요. …목도리 사러 가야겠어요.', '바람이랑 친하다고 안 추운 건 아니거든요. 사실 엄청 추워요.'] },
        { say: '연말 기사 써요?', tier: 'good', face: 'smile', answer: '올해 마을 소식 열 개를 고르는 중이에요! 후보에 {me} 님도 있어요.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '맑음입니다! 오늘 예보는… 맑음이었어요! 맞혔어요! 증인 해 주세요!',
      replies: [
        { say: '내가 증인이에요!', tier: 'great', remember: 'forecast-fan', answer: ['고마워요! 오늘 신문에 "증인 {me} 님" 넣을게요.', '가붕 씨한테 보여 줘야지. 이번 주 첫 승이에요!'] },
        { say: '어제 예보는요?', tier: 'meh', face: 'sorry', answer: '…그건 묻지 않기로 해요. 오늘은 좋은 날이니까요.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy', time: 'day' },
      open: '흐림이에요. 구름 많은 날엔 사진이 부드럽게 나와요. {me} 님, 한 장 찍어도 돼요?',
      replies: [
        { say: '예쁘게 찍어 줘요', tier: 'great', face: 'smile', answer: '찰칵! 구름이 조명을 잘해 줬어요. 이 사진은 제 수첩에 넣을게요.' },
        { say: '구름만 찍어요', tier: 'good', face: 'laugh', answer: '구름도 좋아요. 근데 {me} 님이 있어야 기사가 돼요.' },
        { say: '사진은 싫어요', tier: 'meh', face: 'sorry', answer: '알겠어요. 그럼 깃털 펜으로 뒷모습만 슬쩍 그릴게요.' },
      ],
    },
    {
      id: 'op-storm-night',
      when: { weather: 'storm', time: ['evening', 'night'] },
      open: '폭풍 밤이에요. 창문 잘 닫았어요? 저는 오늘 밤 신문사에서 바람이랑 이야기해요.',
      replies: [
        { say: '무서우면 불러요', tier: 'great', face: 'shy', answer: ['…고마워요. 사실 폭풍 소리는 조금 무서워요.', '근데 누가 그렇게 말해 주면 바람도 덜 화나는 것 같아요.'] },
        { say: '노래 불러요?', tier: 'good', face: 'smile', remember: 'storm-song', answer: '네. 아주 작게요. 바람이 들을 만큼만요.' },
      ],
    },
    {
      id: 'op-fishing',
      when: { recent: 'fishing' },
      open: '갈매기 제보예요! {me} 님 요즘 낚시 자주 다닌다고요. 낚시 날씨 알려 드릴까요?',
      replies: [
        { say: '네, 믿고 갈게요!', tier: 'great', answer: ['오후엔 서풍, 물결은 잔잔! …아마도요. 틀리면 럭스 씨한테 혼나요.', '{me} 님이 잡으면 낚시 칸에 크게 실을게요!'] },
        { say: '물고기한테 물어봐요', tier: 'good', face: 'laugh', answer: '하하! 물고기는 바람 얘기를 안 해 줘요. 입이 무거워요.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다 다녀오셨다면서요! 바닷바람은 어땠어요? 취재원 인터뷰 부탁드려요!',
      replies: [
        { say: '짭짤하고 시원했어요', tier: 'great', remember: 'gave-quote', answer: ['"짭짤하고 시원했다." 시인 같은 제보예요! 그대로 실을게요.', '저는 배만 타면 우산이 날아가요. 그래서 늘 부두에서 기다려요.'] },
        { say: '배 멀미했어요', tier: 'good', face: 'sorry', answer: '어머! 메르시 선생님 칼럼에 멀미 이야기 넣어 달라고 할게요.' },
      ],
    },
    {
      id: 'op-casino',
      when: { recent: 'casinoWin' },
      open: '카지노에서 크게 웃으셨다면서요! 미쿠 씨가 {me} 님 표정이 볼만했대요!',
      replies: [
        { say: '취재 금지예요!', tier: 'great', face: 'laugh', answer: ['하하! 알겠어요. 오늘 카지노 칸은 "바람 잔잔"으로만 쓸게요.', '그래도 이기든 지든 웃는 얼굴은 기사감이었대요.'] },
        { say: '운이 바람 같았어요', tier: 'good', face: 'think', answer: '오, 그 표현 좋아요! 운은 바람처럼 왔다 가요. 제 예보처럼요.' },
      ],
    },
    {
      id: 'op-stock',
      when: { recent: 'stockUp' },
      open: '증권가 소식이에요! 무잔 지점장님이 {me} 님 이야기를 슬쩍 하던데요.',
      replies: [
        { say: '무슨 이야기요?', tier: 'great', face: 'think', answer: ['"요즘 꽤 부지런하다"래요. 지점장님 칭찬은 드물어요.', '오늘 증권 칸 날씨는 "{me} 님 쪽 맑음"으로 할게요.'] },
        { say: '비밀로 해 줘요', tier: 'good', face: 'smile', answer: '물론이죠. 취재원 보호는 바람보다 단단해요.' },
      ],
    },
    {
      id: 'op-museum-trip',
      when: { recent: 'museum' },
      open: '박물관 다녀오셨죠? 기증하신 거 봤어요! 발견자 인터뷰, 지금 해도 돼요?',
      replies: [
        { say: '물론이죠!', tier: 'great', answer: ['야호! 첫 질문이요. "찾았을 때 무슨 소리를 냈나요?"', '…"오!" 좋아요. 그대로 큰 글씨로 실을게요.'] },
        { say: '별거 아니에요', tier: 'good', face: 'shy', answer: '발견은 늘 별거예요! 겸손한 발견자, 이것도 제목감이에요.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '속보입니다! 오늘은 {me} 님 생일입니다! 일면 비워 뒀어요! 한마디 해 주세요!',
      replies: [
        { say: '고마워요, 잔나!', tier: 'great', face: 'shy', answer: ['"고마워요, 잔나." …이건 기사 말고 제 수첩에만 쓸게요.', '오늘 예보는 무조건 맑음! 바람한테 단단히 일러뒀어요. 축하해요!'] },
        { say: '케이크는요?', tier: 'good', face: 'laugh', answer: '프리렌 씨 빵집에 미리 말해 뒀어요! 기자는 정보가 빠르거든요.' },
      ],
    },
    {
      id: 'op-with-sinjjajang',
      when: { with: 'sinjjajang' },
      open: '어, {me} 님! 지금 {other} 씨랑… 배달 취재 중이에요! 취재요!',
      replies: [
        { say: '취재 잘 하세요', tier: 'great', face: 'shy', answer: ['네, 네! 열심히 취재할게요! …{me} 님, 웃지 마세요.', '그, 오늘 날씨가 참 좋네요. 저 지금 무슨 말 하는 거예요?'] },
        { say: '나도 끼어도 돼요?', tier: 'good', face: 'laugh', answer: '그럼요! 셋이면 덜 떨려… 아니, 셋이면 취재가 풍성해요!' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: '{other} 씨 빵 시식 중이에요! {me} 님도 한 입 해요. 기사엔 맛 평가가 필요하거든요.',
      replies: [
        { say: '정말 맛있어요!', tier: 'great', remember: 'taste-team', answer: ['"정말 맛있다." 정직하고 강렬해요! 헤드라인 확정이에요.', '{other} 씨도 고개를 살짝 끄덕였어요. 엄청난 반응이에요.'] },
        { say: '조금 달아요', tier: 'good', face: 'think', answer: '오, 날카로운 미식 평이에요! 이것도 실을게요. 정직한 신문이니까요.' },
      ],
    },
    {
      id: 'op-with-gwen',
      when: { with: 'gwen' },
      open: '{other} 씨가 방금 머리를 해 줬어요! 바람아, 오늘만은 부탁해… 어때요?',
      replies: [
        { say: '방송 준비 완료네요', tier: 'great', remember: 'hair-wind', face: 'laugh', answer: ['고마워요! 이제 광장 예보 하러 가요. 오 분만 버텨 줘, 머리야!', '…벌써 한 가닥 날렸어요. {other} 씨 눈빛이 무서워요.'] },
        { say: '바람 불기 전에 사진!', tier: 'good', face: 'wow', answer: '찰칵! 기록 확보! 신문사 벽에 걸 거예요. 역사적 순간이에요.' },
      ],
    },
    {
      id: 'op-bond-nasera',
      when: { bond: 'nasera' },
      open: '{other} 씨 만나셨어요? 이번 주 시세표 아직 못 받았는데, 뭐라고 하셨어요?',
      replies: [
        { say: '배추 값이 내린대요', tier: 'great', answer: ['특종! 고마워요, {me} 님! 장날 전에 알리면 다들 좋아해요.', '조합장님한텐 제가 한 번 더 확인할게요. 사실 확인은 기본이니까요.'] },
        { say: '바빠 보이셨어요', tier: 'good', face: 'think', answer: '수확철이라 그래요. 꽃차 한 잔 들고 가 볼게요.' },
      ],
    },
    {
      id: 'op-bond-lumi',
      when: { bond: 'lumi' },
      open: '{other} 씨랑 얘기했어요? 오늘 밤 카지노 취재 같이 가기로 했거든요!',
      replies: [
        { say: '밤 취재 힘내요!', tier: 'great', remember: 'night-beat', answer: ['고마워요! {other} 씨는 카드를, 저는 수첩을 들고 가요.', '밤바람이 순하면 기사도 순하게 나와요. 오늘은 순할 거예요.'] },
        { say: '야근이네요', tier: 'good', face: 'sorry', answer: '기자에겐 밤도 낮이에요. …내일 아침엔 좀 자도 되겠죠?' },
      ],
    },
    {
      id: 'op-bond-yanineko',
      when: { bond: 'yanineko' },
      open: '{other} 씨 만났어요? 오늘 제보는 뭐였을까요. 또 고양이일 것 같아요.',
      replies: [
        { say: '고양이 맞아요', tier: 'great', remember: 'cat-news', face: 'laugh', answer: ['역시! 고양이 소식 칸 오늘도 개장이에요!', '이 정도면 고양이 전문 기자로 상 받겠어요.'] },
        { say: '라면이었어요', tier: 'good', face: 'wow', answer: '오, 의외의 전개! 자취 요리 칸으로 돌릴게요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일 하셨네요! 흙 냄새가 바람에 실려 왔어요. 오늘 수확 소식, 제보 받아요!',
      replies: [
        { say: '잘 자랐어요!', tier: 'great', answer: ['좋은 소식이에요! "{me} 님 밭, 풍년 예보" 이렇게 실을게요.', '…이건 예보라기보다 확정이네요. 처음 써 보는 확정 기사예요!'] },
        { say: '허리가 아파요', tier: 'good', face: 'sorry', answer: '어머, 메르시 선생님 칼럼에 스트레칭 기사 있어요! 오려 드릴게요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '오늘 {fish} 잡으셨다고요? 갈매기들이 벌써 소문냈어요!',
      replies: [
        { say: '사진 찍어 줘요', tier: 'great', answer: ['좋아요! {fish}, 그리고 {me} 님. 둘 다 웃어요! 찰칵!', '낚시 칸 오늘 주인공 확정이에요.'] },
        { say: '작은 거예요', tier: 'good', face: 'smile', answer: '크기는 상관없어요. 잡았다는 게 소식이에요!' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '…{me} 님, 저 오늘 {other} 씨랑 좀 서먹해요. 기사 하나 때문에요.',
      replies: [
        { say: '먼저 말 걸어 봐요', tier: 'great', face: 'think', answer: ['…그래야겠죠. 기자는 묻는 사람이니까, 먼저 묻는 것도 제 일이에요.', '"어제는 미안했어요"부터요. 정정 보도보다 쉬워요.'] },
        { say: '내일은 괜찮을 거예요', tier: 'good', face: 'calm', answer: '바람도 하룻밤 자면 방향이 바뀌니까요. 그렇게 믿을게요.' },
      ],
    },
    {
      id: 'op-dusk',
      when: { time: 'evening', weather: ['sunny', 'cloudy'] },
      open: '저녁 뉴스 시간이에요. 오늘 하루 정리, {me} 님 한 줄로 해 주실래요?',
      replies: [
        { say: '좋은 하루였어요', tier: 'great', remember: 'gave-quote', answer: ['"좋은 하루였다." 오늘의 마감 문장이에요.', '이런 문장으로 끝나는 날이 많았으면 좋겠어요. 정말로요.'] },
        { say: '피곤했어요', tier: 'good', face: 'calm', answer: '그럼 "수고했다"로 마감할게요. {me} 님한테 하는 말이에요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-forecast',
      when: { mem: 'forecast-fan' },
      use: 'forecast-fan',
      open: '{me} 님! 제 예보 믿는다고 하셨잖아요. 오늘 예보, {me} 님한테만 먼저 알려 드려요.',
      replies: [
        { say: '내일 날씨는요?', tier: 'great', answer: ['내일은 맑음!', '…틀리면 제가 우산 들고 {me} 님 집 앞에 서 있을게요.'] },
        { say: '틀려도 괜찮아요', tier: 'good', face: 'shy', answer: '…그 말이 제일 큰 힘이에요. 오늘 예보는 마음으로 썼어요.' },
      ],
    },
    {
      id: 'cb-quote',
      when: { mem: 'gave-quote' },
      use: 'gave-quote',
      open: '{me} 님이 해 주신 한마디, 독자 편지가 왔어요! 그 말 덕분에 힘이 났대요!',
      replies: [
        { say: '정말요? 신기하다', tier: 'great', face: 'wow', answer: '말은 바람을 타고 멀리 가요. 그래서 기자가 좋아요!' },
        { say: '부끄러워요', tier: 'good', face: 'shy', answer: '부끄러워 마세요! 편지는 액자에 넣어 신문사에 걸어 둘게요.' },
      ],
    },
    {
      id: 'cb-wind',
      when: { mem: 'wind-secret' },
      use: 'wind-secret',
      open: '바람의 정령 소문 기억하시죠? 그 소문이 이제 옆 마을까지 갔대요!',
      replies: [
        { say: '예보 틀리는 정령이요?', tier: 'great', face: 'laugh', answer: '하하하! 그거 정정 보도로 내야겠어요! 정령은 틀리지 않습니다!' },
        { say: '진짜 아니에요?', tier: 'good', face: 'shy', answer: '…{me} 님한테만 말하면, 바람이 제 말을 좀 잘 듣긴 해요.' },
      ],
    },
    {
      id: 'cb-city',
      when: { mem: 'city-past' },
      use: 'city-past',
      open: '큰 도시 수습 시절 동기한테 편지가 왔어요. 아직 커피 나른대요. 하하.',
      replies: [
        { say: '여기로 놀러 오라고 해요', tier: 'great', answer: '그럴까요? 이 마을 바람 맛을 보면 안 돌아갈 거예요!' },
        { say: '잔나는 잘 왔네요', tier: 'good', face: 'smile', answer: '네. 여기 와서 처음으로 제 기사를 썼거든요. 잘 왔어요.' },
      ],
    },
    {
      id: 'cb-birds',
      when: { mem: 'bird-friend' },
      use: 'bird-friend',
      open: '새들이 소식 물어 온다는 거 믿어 주셨죠? 오늘 참새가 {me} 님 소식을 물어 왔어요.',
      replies: [
        { say: '뭐라고 했어요?', tier: 'great', answer: '"좋은 사람이 오늘도 잘 지낸다." 참새 제보는 늘 정확해요!' },
        { say: '감시당하는 기분인데요', tier: 'good', face: 'laugh', answer: '하하! 취재원 보호 원칙은 지켜요. 새들도 입이 무거워요.' },
      ],
    },
    {
      id: 'cb-deadline',
      when: { mem: 'deadline-help' },
      use: 'deadline-help',
      open: '객원 교정 기자님! 지난번 오타 찾아 주신 원고, 독자 반응이 최고였어요!',
      replies: [
        { say: '언제든 또 불러요', tier: 'great', answer: '정말요? 그럼 마감 날마다 바람 편지 보낼게요!' },
        { say: '오타가 많았죠', tier: 'good', face: 'sorry', answer: '…그건 기사에 안 쓸게요. 편집장 권한이에요.' },
      ],
    },
    {
      id: 'cb-headline',
      when: { mem: 'headline-pal' },
      use: 'headline-pal',
      open: '{me} 님이랑 지은 제목 기억나요? 그 기사가 독자 투표 일등 했어요!',
      replies: [
        { say: '공동 작업자 만세!', tier: 'great', answer: ['만세! 상품은 꽃차 두 잔이에요. 한 잔은 {me} 님 거예요.', '다음 제목도 같이 지어요. 우리 둘이면 마감이 안 무서워요.'] },
        { say: '제목만 좋았던 거죠', tier: 'good', face: 'laugh', answer: '겸손 금지! 본문은 제가 쓰고, 기사는 {me} 님이 살렸어요.' },
      ],
    },
    {
      id: 'cb-feather',
      when: { mem: 'feather-pen' },
      use: 'feather-pen',
      open: '그 깃털 펜 기억하세요? 오늘 갈매기가 또 하나 두고 갔어요. {me} 님 거래요.',
      replies: [
        { say: '고마워, 갈매기야', tier: 'great', answer: ['하하! 갈매기가 창밖에서 고개를 끄덕였어요. 진짜예요!', '이제 {me} 님도 깃털 펜 기자단이에요. 회원은 둘뿐이에요.'] },
        { say: '잔나가 쓰지 그래요', tier: 'good', face: 'shy', answer: '…그럼 이걸로 {me} 님 기사를 쓸게요. 그게 제일 맞는 쓰임이에요.' },
      ],
    },
    {
      id: 'cb-post',
      when: { mem: 'post-secret' },
      use: 'post-secret',
      open: '{me} 님, 그 비밀 지켜 주고 계시죠? 오늘 신짜장 씨가 "좋은 아침" 했어요.',
      replies: [
        { say: '진전이네요!', tier: 'great', face: 'shy', answer: ['쉿! 진전이라니요! …네, 진전이에요. 두 마디였어요.', '내일은 날씨 얘기를 해 볼까 해요. 제 전문 분야니까요. 틀려도요.'] },
        { say: '비밀은 끝까지요', tier: 'good', face: 'laugh', answer: '든든해요! 바람한테도 끝까지라고 일러둘게요.' },
      ],
    },
    {
      id: 'cb-correction',
      when: { mem: 'correction-ok' },
      use: 'correction-ok',
      open: '고치는 게 더 멋있다는 말, 아직 책상에 붙어 있어요. 오늘 또 정정 보도 냈거든요.',
      replies: [
        { say: '오늘도 멋있었어요', tier: 'great', face: 'shy', answer: ['헤헤… 그 말 들으려고 틀린 건 아니에요. 진짜로요.', '그래도 이제 정정 보도 쓸 때 손이 안 떨려요. {me} 님 덕분이에요.'] },
        { say: '몇 번째예요?', tier: 'good', face: 'sorry', answer: '…세는 걸 그만뒀어요. 그것도 성장이에요!' },
      ],
    },
    {
      id: 'cb-kite',
      when: { mem: 'kite-pal' },
      use: 'kite-pal',
      open: '오늘 연 날리기 딱 좋은 바람이에요! 약속 기억하죠? "호외" 출동 준비 완료!',
      replies: [
        { say: '실 감기는 내가 할게요', tier: 'great', answer: ['든든해요! 저는 바람한테 부탁하는 담당!', '…와, 떴어요! 제일 높이 갔어요. 사진 찍었어요!'] },
        { say: '소나무만 피해요', tier: 'good', face: 'laugh', answer: '하하! 볼리바스 씨 출동은 이제 그만! 오늘은 소나무 반대쪽으로요.' },
      ],
    },
    {
      id: 'cb-storm-song',
      when: { mem: 'storm-song' },
      use: 'storm-song',
      open: '지난 폭풍 밤에요, 약속대로 {me} 님 쪽 창문 보고 노래했어요. 들렸어요?',
      replies: [
        { say: '바람이 순하던데요', tier: 'great', face: 'shy', answer: ['정말요? 그럼 노래가 닿은 거예요.', '…다음엔 창문 열고 부를게요. 아, 아니요. 감기 걸려요. 닫고요.'] },
        { say: '잠들어서 몰라요', tier: 'good', face: 'laugh', answer: '그럼 효과가 있었던 거예요! 푹 잤다는 건 바람이 착했다는 거니까요.' },
      ],
    },
    {
      id: 'cb-alley',
      when: { mem: 'alley-story' },
      use: 'alley-story',
      open: ['{me} 님 말대로 뒷골목 기사 실었어요.', '큰 도시에서 편지가 왔어요. 그 아이들 중 하나래요.'],
      replies: [
        { say: '뭐라고 했어요?', tier: 'great', face: 'wow', answer: ['"누가 우리 이야기를 기억해 줘서 고맙다."', '…{me} 님, 저 오늘 조금 울어도 돼요? 기자도 우는 날이 있어요.'] },
        { say: '늦게라도 닿았네요', tier: 'good', face: 'smile', answer: '네. 바람은 늦어도 꼭 도착해요. 신문도 그랬으면 좋겠어요.' },
      ],
    },
    {
      id: 'cb-wind-name',
      when: { mem: 'wind-name' },
      use: 'wind-name',
      open: '"포근이" 기억하세요? {me} 님 바람이요. 오늘 아침에 그 바람이 불었어요.',
      replies: [
        { say: '나 보러 왔나 봐요', tier: 'great', face: 'laugh', answer: ['맞아요! 바로 {me} 님 집 쪽으로 불어 갔어요. 정확한 보도예요.', '오늘 날씨 칸에 "포근이 출현"이라고 썼어요. 아무도 모르겠지만요.'] },
        { say: '어떻게 알아봐요?', tier: 'good', face: 'think', answer: '포근이는 꽃 냄새가 조금 나요. {me} 님 같아요. …아, 이건 비공개.' },
      ],
    },
    {
      id: 'cb-tasting',
      when: { mem: 'taste-team' },
      use: 'taste-team',
      open: '시식 전담 객원 기자님! 프리렌 씨 빵집에 새 빵 나왔어요. 출동이에요!',
      replies: [
        { say: '맛 평가 맡겨요', tier: 'great', answer: ['역시! 이번 건 프리렌 씨가 "꽤 오래 걸렸어"래요. 기대돼요.', '{me} 님 한 줄 평이 일면 아래 들어가요. 맛있게 써 주세요!'] },
        { say: '배부른데요', tier: 'good', face: 'laugh', answer: '그럼 반쪽만요! 시식은 기자의 의무예요. …제 핑계예요.' },
      ],
    },
    {
      id: 'cb-quiet',
      when: { mem: 'quiet-news' },
      use: 'quiet-news',
      open: '오늘 일면 제목, {me} 님 말대로 "오늘도 평화"로 했어요. 반응이 진짜 좋았어요.',
      replies: [
        { say: '평화가 특종이에요', tier: 'great', face: 'smile', answer: ['그 말 좋아요. 이제 그게 제 신조예요.', '바람이 조용한 날이 제일 좋은 날이에요. 예전엔 몰랐어요.'] },
        { say: '심심하다는 사람은요?', tier: 'good', face: 'laugh', answer: '볼리바스 씨 한 명이요! 사건이 없으면 서운하대요.' },
      ],
    },
    {
      id: 'cb-bet',
      when: { mem: 'bet-cheer' },
      use: 'bet-cheer',
      open: '가붕 씨랑 내기 결과 나왔어요! {me} 님 응원 덕분에… 무승부예요!',
      replies: [
        { say: '그럼 계단 반씩?', tier: 'great', face: 'laugh', answer: ['하하! 정확히 그렇게 됐어요. 오십 칸씩이요.', '가붕 씨는 걸레질하면서도 외쳤어요. "정의로운 계단이다!"'] },
        { say: '아쉽네요', tier: 'good', face: 'think', answer: '다음 주엔 꼭 이길 거예요. 바람한테 특별 훈련 부탁했어요.' },
      ],
    },
    {
      id: 'cb-letter',
      when: { mem: 'letter-reply' },
      use: 'letter-reply',
      open: '답장 실었어요… 그리고 오늘 아침, 신짜장 씨가 신문을 직접 건네줬어요.',
      replies: [
        { say: '그래서요, 그래서요?', tier: 'great', face: 'shy', answer: ['그래서라니요! …그냥 "잘 읽었어요" 한마디요.', '그 말에 하루 종일 예보가 다 맞았어요. 진짜예요. 이상하죠?'] },
        { say: '잘됐어요', tier: 'good', face: 'smile', answer: '네. 아주 조금요. 바람만큼요. 그 정도면 충분해요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '취재 수첩에 적어 뒀어요. {me} 님이 좋아하는 건 {taste}! 맞죠?',
      replies: [
        { say: '정확한 보도예요', tier: 'great', remember: 'taste-heard', answer: '야호! 이번엔 틀리지 않았어요! 오늘 적중률 백 퍼센트!' },
        { say: '어디서 들었어요?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '취재원 보호예요! …사실 바람이 알려 줬어요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '{me} 님이랑 동행 취재 다녀온 날 기사요, 독자 반응이 최고였어요!',
      replies: [
        { say: '또 같이 가요', tier: 'great', remember: 'outing-talk', answer: ['좋아요! 다음엔 뒷산 바람 취재요. 수첩 두 권 챙길게요.', '{me} 님이랑 다니면 바람이 순해요. 이것도 취재 결과예요.'] },
        { say: '내 이름도 나왔어요?', tier: 'good', face: 'shy', remember: 'outing-talk', answer: '공동 취재원으로요! 제일 굵은 글씨로 넣었어요.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-off' },
      open: '{me} 님, 그날 우리 방에서 보낸 시간이요. 저 그거 기사로 안 썼어요.',
      replies: [
        { say: '우리만의 비공개죠', tier: 'great', face: 'shy', remember: 'date-off', answer: ['네. 제 인생 첫 비공개 특종이에요.', '평생 안 실을 거예요. 제 수첩에만 있어요.'] },
        { say: '써도 됐는데', tier: 'good', face: 'laugh', remember: 'date-off', answer: '어머! 그럼 제목부터 고민해야겠어요. …아니요, 그냥 간직할래요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '바람이 그러는데요, 곧 {me} 님 생일이래요! 축하 기사 일면에 실어도 돼요?',
      replies: [
        { say: '일면이요? 좋아요!', tier: 'great', remember: 'bday-plan', answer: '확정! 그날 예보도 무조건 맑음으로 쓸 거예요. 틀려도요!' },
        { say: '작게만 실어 줘요', tier: 'good', face: 'smile', remember: 'bday-plan', answer: '알겠어요. 작게, 대신 제일 예쁜 글씨로요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '이웃의 첫 기사',
      hint: '한 번 이야기를 나누면 잔나가 취재 수첩을 펼쳐요.',
      need: { days: 1 },
      scene: [
        '시장 거리 신문사 앞. 잔나가 깃털 펜을 들고 수첩을 펼친다.',
        '바람 한 줄기가 지나가며 수첩 책장을 한 장 넘겨 준다.',
        '"고마워, 새벽이. …아, 바람이요. 제가 이름을 붙여 줬거든요."',
        '"속보입니다! 범마을에 새 이웃이 왔습니다. 이름은 {me} 님!"',
        '그녀가 펜 끝으로 턱을 톡톡 두드리며 한참을 바라본다.',
        '"첫인상은… 순한 바람 같다. 네, 이렇게 쓸게요."',
        '처마 위에서 참새 두 마리가 고개를 갸웃한다. 잔나가 웃는다.',
        '"새들도 동의한대요. 이 기사는 정정 보도 없을 거예요."',
        '그녀가 수첩 귀퉁이를 조심스레 접어 둔다. 아끼는 장에 하는 버릇이다.',
        '"앞으로 {me} 님 소식은 제가 제일 먼저 전할 거예요. 각오하세요!"',
      ],
      replies: [
        { say: '예쁘게 써 줘요!', tier: 'great', answer: ['물론이죠! 오늘 기사는 바람보다 가볍고 꽃보다 예쁘게!', '내일 아침 우체국 앞에서 제일 먼저 받아 보세요. 아, 저도 거기 있어요.'] },
        { say: '순한 바람이 뭐예요?', tier: 'good', face: 'think', answer: ['같이 있으면 숨이 편해지는 바람이요.', '칭찬이에요! 제 사전에서 제일 높은 칭찬이요.'] },
        { say: '기사는 좀 부담스러워', tier: 'meh', face: 'sorry', answer: '그럼 작은 칸에 쓸게요. 그래도 쓸 거예요. 기자니까요!' },
      ],
    },
    {
      title: '새벽 뒷산의 바람 읽기',
      hint: '새벽(게임 시각 새벽 다섯 시부터 여덟 시) 뒷산에 올라가 보세요. 바람을 읽는대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 5, to: 8 } },
      scene: [
        '새벽 뒷산 꼭대기. 풀잎마다 이슬이 맺혀 있고 하늘은 아직 연한 남색이다.',
        '잔나가 눈을 감고 두 팔을 벌린 채 서 있다. 머리칼이 바람에 흩날린다.',
        '"왔어요? 쉿, 지금 바람이 말하는 중이에요."',
        '새 몇 마리가 그녀 주위를 한 바퀴 돌고 마을 쪽으로 날아간다.',
        '"…동쪽에서 따뜻한 바람. 오늘은 맑음이에요. 이번엔 진짜예요."',
        '그녀가 수첩에 작게 적는다. 앞장들엔 고쳐 쓴 자국이 가득하다.',
        '"예보가 틀리는 건, 바람 말을 제가 다 못 알아들어서예요."',
        '"어릴 땐 다 들리는 줄 알았어요. 크면서 조금씩 잊었나 봐요."',
        '멀리 등대 불이 꺼지고, 항구 쪽에서 가붕 씨의 우렁찬 기지개가 들린다.',
        '"그래도 매일 와요. 다 알아들으면 누구도 젖지 않게 할 수 있잖아요."',
      ],
      replies: [
        { say: '나도 같이 들어 볼래', tier: 'great', remember: 'dawn-wind', face: 'smile', answer: ['정말요? 그럼 눈 감아요. …들려요? 그게 아침 인사예요.', '내일부터 예보 공동 작성자예요. {me} 님이요!'] },
        { say: '오늘은 맞을 것 같아', tier: 'good', remember: 'dawn-wind', face: 'laugh', answer: ['그렇죠? {me} 님이 옆에 있으니까 바람이 착하게 굴어요.', '오늘 예보 맞으면 공을 반 나눠 드릴게요.'] },
        { say: '추워요…', tier: 'meh', remember: 'dawn-wind', face: 'sorry', answer: '어머, 미안해요! 바람아, {me} 님 쪽은 좀 비켜 줘!' },
      ],
    },
    {
      title: '꽃차와 특종 회의',
      hint: '잔나가 꽃차를 좋아한대요. 꽃차 한 잔을 가지고 신문사로 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '꽃차를 건네자 잔나가 두 손으로 감싸 쥔다. "어머, 제가 제일 좋아하는 거예요!"',
        '신문사 안은 잉크 냄새로 가득하다. 구석에서 인쇄기 돌풍이가 쉬고 있다.',
        '창가, 원고 더미 사이에 찻잔 두 개가 놓인다. 꽃잎이 천천히 풀린다.',
        '"오늘은 특종 회의예요. 참석자는 편집장 잔나, 그리고 {me} 님."',
        '벽에는 깃털들이 줄지어 꽂혀 있다. 갈매기, 참새, 그리고 하얀 깃털 하나.',
        '"저 하얀 깃털은 이 마을에 온 첫날 어깨에 내려앉았어요. 제 보물이에요."',
        '그녀가 빈 수첩을 내민다. 앞쪽에 귀퉁이를 접어 둔 장이 하나 보인다.',
        '"아, 그건 {me} 님 첫 기사 장이에요. 못 본 걸로 해 주세요."',
        '"자, 이 마을에서 지키고 싶은 걸 하나 적어 주세요."',
        '"그게 다음 호 일면이에요. 제가 지키고 싶은 것도, 아마 같을 거예요."',
      ],
      replies: [
        { say: '이 마을 사람들 웃음', tier: 'great', remember: 'tea-scoop', face: 'shy', answer: ['…같아요. 정말 같아요.', '오늘 회의는 만장일치로 끝났어요! 꽃차 한 잔 더 해요.'] },
        { say: '빵집 아침 냄새', tier: 'good', remember: 'tea-scoop', face: 'laugh', answer: ['하하! 그것도 일면감이에요!', '프리렌 씨가 들으면 표정은 그대로지만 빵을 하나 더 주실 거예요.'] },
        { say: '잘 모르겠어요', tier: 'meh', remember: 'tea-scoop', face: 'calm', answer: '괜찮아요. 꽃차 다 마실 때까지 천천히 생각해요.' },
      ],
    },
    {
      title: '바람막이가 되고 싶어',
      hint: '잔나와 꿈 이야기를 나누면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'shield-wind' },
      scene: [
        '폭풍 경보가 내린 저녁. 광장의 깃발들이 한쪽으로 세차게 펄럭인다.',
        '잔나가 줄무늬 우산 하나로 아이들을 집에 데려다주고 있다.',
        '우산이 또 뒤집힌다. 그래도 그녀는 웃으며 아이들 앞에 선다.',
        '"자, 제 뒤로요! 바람은 제가 막을게요. 저 바람이랑 친하거든요!"',
        '마지막 아이가 집에 들어가고 나서야 그녀가 숨을 크게 내쉰다.',
        '흠뻑 젖은 품에서 수첩을 꺼내 확인한다. 다행히 안쪽은 말라 있다.',
        '"{me} 님, 전에 제 꿈 맞히셨잖아요. 바람막이 같은 사람."',
        '"수습 시절 뒷골목에서요, 아무도 막아 주지 않는 아이들을 봤어요."',
        '"기사를 쓰는 것도 그래서예요. 미리 알면 덜 다치니까요."',
        '바람이 잦아든다. 그녀가 뒤집힌 우산을 다시 펴서 하늘로 들어 올린다.',
        '"예보가 틀려도 포기 못 하는 이유예요. …바보 같죠?"',
      ],
      replies: [
        { say: '이미 바람막이예요', tier: 'great', face: 'shy', answer: ['…{me} 님.', '그 말, 수첩 맨 앞장에 적어 둘게요. 정정 없이요.'] },
        { say: '우산 같이 들게요', tier: 'good', face: 'smile', answer: ['고마워요. 둘이 들면 안 뒤집혀요. 아마도요!', '…봐요, 안 뒤집혔어요. 오늘 첫 적중이에요.'] },
        { say: '우산부터 바꿔요', tier: 'meh', face: 'laugh', answer: '하하! 이 우산도 저처럼 다시 펴져요. 그게 매력이에요!' },
      ],
    },
    {
      title: '정정 없는 예보',
      hint: '잔나와 아주 가까워지면 아무에게도 안 쓴 기사를 보여 줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤늦은 신문사. 돌풍이는 멈췄고 창밖엔 순한 밤바람만 분다.',
        '잔나가 서랍 깊숙한 곳에서 원고 한 장을 꺼낸다. 모서리가 닳아 있다.',
        '"이건 한 번도 안 실은 기사예요. 제목은… 아직 못 정했어요."',
        '원고엔 날씨 칸만 빼곡하다. 날짜마다 같은 문장이 적혀 있다.',
        '"내일도 그 사람 곁은 맑음."',
        '맨 첫 줄의 날짜는 수첩 귀퉁이를 접었던, 바로 그 첫 기사 날이다.',
        '"매일 예보가 틀리잖아요. 근데 이것만은 한 번도 안 틀렸어요."',
        '"정정 보도를 그렇게 많이 냈는데, 이 칸만은 고칠 일이 없었어요."',
        '원고 위에 하얀 깃털 하나가 살며시 놓여 있다. 그녀의 보물이다.',
        '그녀가 원고로 얼굴을 반쯤 가린다. "…그 사람이 누군지는 비공개예요."',
        '"아, 근데요. 꽃 같은 걸 받으면 비공개가 풀릴 수도 있대요. 바람이요."',
      ],
      replies: [
        { say: '정정 없이 실어 줘요', tier: 'great', face: 'shy', answer: ['…{me} 님.', '꽃 한 다발 들고 오면, 그날 일면에 실을게요. 약속이에요.'] },
        { say: '그 사람 운이 좋네요', tier: 'good', face: 'laugh', answer: '하하… 눈치 없는 척하는 거죠? 그것도 귀여워요.' },
        { say: '내일 날씨는 뭔데요?', tier: 'meh', face: 'calm', answer: '…맑음이요. 이건 진짜로요. 이번 예보는 안 틀려요.' },
      ],
    },
    {
      title: '평생 단독 보도',
      hint: '잔나와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '뒷산 꼭대기. 바람이 잔잔하고, 마을 지붕들이 아침 햇살에 반짝인다.',
        '잔나가 신문 한 부를 내민다. 인쇄는 단 한 장뿐이다.',
        '"돌풍이가 오늘은 딱 한 번만 돌아 줬어요. 이것만 찍으라고요."',
        '일면 제목이 큼직하다. "속보입니다."',
        '"잔나 기자, {me} 님과 평생 함께하고 싶다고 밝혔습니다."',
        '날씨 칸에는 고쳐 쓴 자국 하나 없이 "맑음"이 적혀 있다.',
        '"이건 우리 둘만 보는 신문이에요. 독점, 단독, 평생 연재."',
        '"틀린 예보는 앞으로도 많을 거예요. 근데 곁에 있겠다는 건 안 틀려요."',
        '그녀가 하얀 깃털을 손에 쥐여 준다. 이 마을에 처음 온 날의 깃털이다.',
        '"바람이 맡긴 거예요. 이제 {me} 님 거예요."',
        '새들이 두 사람 머리 위를 한 바퀴 돌고, 바람이 신문 귀퉁이를 넘긴다.',
      ],
      replies: [
        { say: '평생 구독할게요', tier: 'great', face: 'laugh', answer: ['속보! 구독자 한 명, 평생 계약!', '오늘 바람이 제일 신났어요. 들려요? 다들 박수 치는 소리예요.'] },
        { say: '반지는 내가 준비할게요', tier: 'good', face: 'shy', answer: ['…그건 특종 중의 특종이에요.', '그날은 꼭 맑음일 거예요. 오늘부터 매일 바람한테 부탁할게요.'] },
        { say: '천천히 연재해요', tier: 'meh', face: 'smile', answer: '좋아요. 한 회씩, 매일이요. 마감은 없어요.' },
      ],
    },
  ],
  after: [
    '오늘 인터뷰는 끝! 내일 아침 신문에서 봬요!',
    '또 오셨네요! 제보는 언제나 환영이에요. 바람 편에 보내 주세요!',
    '마감이라 이만! 내일 예보는… 맑음! 아마도요.',
    '{me} 님, 조심히 가세요. 오늘 밤바람은 순할 거예요.',
    '오늘 기사 마감 끝! {me} 님 덕분에 순풍이었어요.',
    '정정 보도 없는 하루 되세요! 제 예보만 빼고요.',
    '바람 편에 안부 전할게요. 돌풍이도 안녕이래요!',
  ],
};
