// 잔나 — 범마을 신문 기자(시장 거리 신문사). 밝은 방송 말투의 해요체("속보입니다!",
// "바람이 그러는데요"). 날씨 예보가 특기인데 자주 틀린다(정정 보도 농담). 바람·새·
// 깃털, 사람을 지켜 주고 싶은 마음, 큰 도시 신문사 수습 시절, 바람의 정령이라는
// 소문. 첫마디는 오늘 마을 소식을 취재하는 쪽으로 기운다. 우체부 신짜장을 몰래
// 좋아하는 건 살짝만. 가붕·럭스와는 예보 맞수. 원작 대사는 옮기지 않는다.
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
  },
  talks: [
    {
      id: 'forecast-trust',
      open: '{me} 님, 솔직하게요. 제 날씨 예보, 믿으세요? 인터뷰 아니에요. 진짜 궁금해서요.',
      replies: [
        { say: '난 늘 믿어', tier: 'great', remember: 'forecast-fan', answer: ['어머… 독자 한 분 확보! 아니, 제일 소중한 독자예요!', '내일 예보는 {me} 님 위해 두 번 확인할게요!'] },
        { say: '반쯤은 믿어', tier: 'good', face: 'laugh', answer: '반이면 높은 편이에요! 가붕 씨는 사분의 일이래요.' },
        { say: '우산은 늘 챙겨', tier: 'meh', face: 'sorry', answer: '…현명한 독자세요. 정정 보도 담당으로서 할 말이 없네요.' },
      ],
    },
    {
      id: 'quote',
      open: '내일 신문에 "이웃의 한마디" 코너가 있어요. {me} 님, 한마디만 해 주실래요?',
      replies: [
        { say: '이 마을이 좋아요!', tier: 'great', remember: 'gave-quote', answer: '받아 적었어요! 짧고 굵고 따뜻하고! 내일 일면 아래쪽이에요!' },
        { say: '오늘 밥이 맛있었어요', tier: 'good', face: 'laugh', answer: '하하, 생활 밀착형이네요! 독자들이 제일 좋아하는 종류예요.' },
        { say: '노코멘트', tier: 'meh', face: 'calm', answer: '…기자 인생 최대의 벽이네요. 다음엔 꼭 따낼 거예요!' },
      ],
    },
    {
      id: 'headline',
      open: '오늘 기사 제목이 안 나와요! "빵집 신메뉴 출시"… 너무 심심하죠? 도와줘요!',
      replies: [
        { say: '"마을이 고소해졌다"', tier: 'great', remember: 'headline-pal', answer: '그거예요! 바람이 무릎을 쳤어요! 제목 공동 작업자로 올릴게요!' },
        { say: '"빵 나왔다" 어때?', tier: 'good', face: 'laugh', answer: '하하! 짧긴 한데 힘이 있어요. 부제로 쓸게요!' },
        { say: '그냥 그대로 써', tier: 'meh', answer: '정직한 보도도 좋죠… 근데 독자는 맛있는 제목을 원해요!' },
      ],
    },
    {
      id: 'wind-spirit',
      open: '제가 바람의 정령이라는 소문이 있대요. {me} 님도 들으셨어요? 어이없죠?',
      replies: [
        { say: '그럼 예보가 왜 틀려?', tier: 'great', remember: 'wind-secret', face: 'laugh', answer: '바로 그거예요! 제가 늘 하는 반박이에요! 정령이면 다 맞혔겠죠!' },
        { say: '조금은 그럴 것 같아', tier: 'good', face: 'shy', answer: '…어머. 바람이 웃는 것 같은 건 기분 탓이에요. 아마도요.' },
        { say: '소문엔 관심 없어', tier: 'meh', face: 'think', answer: '기자 앞에서 그런 말을! 소문은 특종의 씨앗이라고요.' },
      ],
    },
    {
      id: 'feather-pen',
      open: '이 깃털 펜 예쁘죠? 갈매기가 창가에 떨어뜨리고 갔어요. 선물인 것 같아요.',
      replies: [
        { say: '갈매기가 팬인가 봐', tier: 'great', remember: 'feather-pen', answer: '그렇죠? 저도 그렇게 믿어요! 독자층이 하늘까지 넓어요!' },
        { say: '글씨가 잘 써져?', tier: 'good', answer: '마감 직전엔 펜이 저보다 빨라요. 바람 깃털이라 그런가 봐요.' },
        { say: '그냥 주운 거잖아', tier: 'meh', face: 'sorry', answer: '…사실 보도는 가끔 낭만이 없네요. 그래도 선물이에요!' },
      ],
    },
    {
      id: 'city-past',
      open: '저 큰 도시 신문사에서 수습 했었어요. 일 년 내내 커피만 날랐지만요.',
      replies: [
        { say: '그때 얘기 더 해 줘요', tier: 'great', remember: 'city-past', answer: ['뒷골목까지 취재 다녔어요. 아무도 안 듣는 이야기들이 있었거든요.', '그래서 여기선 다 들어 주고 싶어요. 작은 이야기까지요.'] },
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
        { say: '믿어요, 새는 다 알아', tier: 'great', remember: 'bird-friend', answer: '역시! 오늘 아침엔 참새가 시장 물가 소식을 줬어요. 정확했어요!' },
        { say: '그래서 예보가 틀리나?', tier: 'good', face: 'laugh', answer: '하하! 갈매기 제보는 좀 부정확해요. 걔들은 생선 생각만 하거든요.' },
        { say: '새는 시끄러워요', tier: 'meh', face: 'sorry', answer: '그건… 부정할 수 없네요. 아침 회의가 좀 길어요.' },
      ],
    },
    {
      id: 'post-office',
      open: '저 매일 아침 우체국 앞에 서 있는 거, 신문 받으려는 거예요. 그것뿐이에요. 진짜로요.',
      replies: [
        { say: '비밀은 지켜 줄게요', tier: 'great', remember: 'post-secret', face: 'shy', answer: '무, 무슨 비밀이요! …고마워요. 바람한테도 입단속 시킬게요.' },
        { say: '신짜장 씨 때문이죠?', tier: 'good', face: 'shy', answer: '쉿! 목소리가 너무 커요! 볼리바스 씨보다 커요!' },
        { say: '신문은 배달되잖아요', tier: 'meh', face: 'wow', answer: '…그, 그건 기자의 확인 습관이에요. 확인이요!' },
      ],
    },
    {
      id: 'correction',
      open: '어제 맑음이라고 썼는데 비가 왔어요. 오늘도 정정 보도 나가요. 창피해요.',
      replies: [
        { say: '고치는 게 더 멋있어요', tier: 'great', remember: 'correction-ok', face: 'smile', answer: '…{me} 님. 이 말 액자에 넣어서 책상에 걸어 둘 거예요.' },
        { say: '내일은 맞힐 거예요', tier: 'good', answer: '응원 감사합니다! 내일은 바람한테 두 번 물어볼게요!' },
        { say: '예보를 그만두면?', tier: 'meh', face: 'sorry', answer: '그건 안 돼요! 틀려도 계속 해야 언젠가 다 맞히죠!' },
      ],
    },
    {
      id: 'deadline',
      open: '마감 한 시간 전이에요! {me} 님, 이 원고 오타 좀 같이 봐 주실래요?',
      replies: [
        { say: '맡겨요, 다 찾을게요', tier: 'great', remember: 'deadline-help', answer: '세 개나 찾으셨어요! 오늘부터 객원 교정 기자로 임명합니다!' },
        { say: '응원만 할게요', tier: 'good', face: 'laugh', answer: '응원도 큰 힘이에요! 회오리처럼 쓰고 올게요!' },
        { say: '마감이 뭐예요?', tier: 'meh', face: 'wow', answer: '…기자 앞에서 그 말은 폭풍 경보급이에요. 부러워요.' },
      ],
    },
    {
      id: 'umbrella',
      open: '제 줄무늬 우산 보셨어요? 바람에 뒤집힌 게 벌써 몇 번째인지 몰라요.',
      replies: [
        { say: '그래도 꿋꿋하네요', tier: 'great', face: 'laugh', answer: '그렇죠! 이 우산이랑 저랑 닮았어요. 뒤집혀도 다시 펴요!' },
        { say: '새로 사요', tier: 'good', answer: '정이 들어서 못 버려요. 취재 현장을 다 함께 다녔거든요.' },
        { say: '우산 안 쓰면 되잖아요', tier: 'meh', face: 'think', answer: '그럼 깃털 펜이 젖어요! 기자의 생명이라고요.' },
      ],
    },
    {
      id: 'column',
      when: { ch: 3 },
      open: '{me} 님, 정식 제안이에요. 신문에 {me} 님 코너를 만들고 싶어요. 매주요!',
      replies: [
        { say: '좋아요, 같이 써요', tier: 'great', remember: 'own-column', face: 'shy', answer: '야호! 코너 이름은 같이 정해요. 첫 회는 제가 인터뷰할게요!' },
        { say: '무슨 코너인데요?', tier: 'good', answer: '"이 주의 이웃"이요. 근데 매주 {me} 님이에요. 편집장 권한이에요!' },
        { say: '부끄러워요', tier: 'meh', face: 'smile', answer: '그럼 사진은 뒷모습으로 할게요. 그래도 이름은 넣어요!' },
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
        { say: '선물 고민 중이에요', tier: 'good', answer: '꽃차 어때요? 아, 그건 제가 좋아하는 거네요. 취재 실수!' },
      ],
    },
    {
      id: 'op-festival-news',
      when: { news: 'festival' },
      open: '축제 특집호 마감 중이에요! {me} 님, 오늘 축제에서 제일 좋았던 거 하나만요!',
      replies: [
        { say: '다 같이 웃던 순간', tier: 'great', remember: 'gave-quote', answer: '…이걸 일면 제목으로 할게요. 사진보다 좋은 한 줄이에요.' },
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
        { say: '아직 못 봤어요', tier: 'good', answer: '그럼 한 부 드릴게요! 따끈따끈해요. 방금 인쇄했거든요.' },
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
        { say: '조용히 써 주세요', tier: 'great', face: 'smile', answer: '네. 이름은 빼고 짧게요. 찬바람은 제가 막아 줄 수 있으면 좋겠어요.' },
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
        { say: '비 와도 기사는 맑음', tier: 'great', remember: 'correction-ok', answer: '{me} 님! 그 말 오늘의 한 줄로 쓸게요! 기분은 맑음으로 정정!' },
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
        { say: '발자국 기사 써요', tier: 'good', answer: '좋아요! 오늘 광장에 제일 먼저 온 발자국을 추적해 볼게요.' },
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
        { say: '연 같이 날려요!', tier: 'great', answer: '좋아요! 바람한테 살짝 부탁해 둘게요. 우리 연이 제일 높이 갈 거예요!' },
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
        { say: '그냥 운이었어요', tier: 'good', answer: '운도 기사 거리예요! "행운의 밭" 특집으로 갈게요.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님, 오늘 얼굴이 맑음이에요! 무슨 좋은 일 있었어요? 제보 받아요!',
      replies: [
        { say: '잔나 만나서요', tier: 'great', face: 'shy', answer: '…속보입니다. 잔나 기자 얼굴이 빨개졌습니다. 이상입니다.' },
        { say: '그냥 날이 좋아서요', tier: 'good', answer: '그게 제일 좋은 소식이에요! 오늘 날씨 칸 옆에 써 둘게요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘은 기분이 흐림인가 봐요. 바람이 조용히 알려 줬어요.',
      replies: [
        { say: '좀 지쳤어요', tier: 'great', face: 'smile', answer: '그럼 오늘은 인터뷰 없어요. 제가 옆에서 바람막이 할게요.' },
        { say: '괜찮아요', tier: 'good', answer: '알겠어요. 그래도 내일 예보는 맑음이에요. {me} 님 쪽은 꼭요.' },
      ],
    },
    {
      id: 'op-sinjjajang',
      when: { bond: 'sinjjajang' },
      open: '{other} 씨 만나셨어요? 오늘… 무슨 얘기 했어요? 아니, 그냥요. 취재요.',
      replies: [
        { say: '잔나 얘기 하던데요', tier: 'great', face: 'shy', answer: '네, 네에? 뭐, 뭐라고요? 아니, 말하지 마세요! 아니, 해 주세요!' },
        { say: '배달 얘기만 했어요', tier: 'good', face: 'calm', answer: '…그렇죠. 성실하신 분이라. 그것도 좋은 소식이에요.' },
      ],
    },
    {
      id: 'op-gabung',
      when: { bond: 'gabung' },
      open: '가붕 씨가 오늘 예보 뭐라고 했어요? 이번 주 예보 대결 신문에 실려요!',
      replies: [
        { say: '잔나가 이길 거예요', tier: 'great', answer: '그 응원, 바람에 실어 등대까지 보낼게요! 이번 주는 꼭 이겨요!' },
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
        { say: '기사로 쓸 거예요?', tier: 'good', answer: '물론이죠! 제목은 "화분의 행방", 형사물 느낌으로요.' },
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
  ],
  callbacks: [
    {
      id: 'cb-forecast',
      when: { mem: 'forecast-fan' },
      use: 'forecast-fan',
      open: '{me} 님! 제 예보 믿는다고 하셨잖아요. 오늘 예보, {me} 님한테만 먼저 알려 드려요.',
      replies: [
        { say: '내일 날씨는요?', tier: 'great', answer: '내일은 맑음! …틀리면 제가 우산 들고 {me} 님 집 앞에 서 있을게요.' },
        { say: '틀려도 괜찮아요', tier: 'good', face: 'shy', answer: '…그 말이 제일 큰 힘이에요. 오늘 예보는 마음으로 썼어요.' },
      ],
    },
    {
      id: 'cb-quote',
      when: { mem: 'gave-quote' },
      use: 'gave-quote',
      open: '{me} 님이 해 주신 한마디, 독자 편지가 왔어요! 그 말 덕분에 힘이 났대요!',
      replies: [
        { say: '정말요? 신기하다', tier: 'great', answer: '말은 바람을 타고 멀리 가요. 그래서 기자가 좋아요!' },
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
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '취재 수첩에 적어 뒀어요. {me} 님이 좋아하는 건 {taste}! 맞죠?',
      replies: [
        { say: '정확한 보도예요', tier: 'great', remember: 'taste-heard', answer: '야호! 이번엔 틀리지 않았어요! 오늘 적중률 백 퍼센트!' },
        { say: '어디서 들었어요?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '취재원 보호예요! …사실 바람이 알려 줬어요.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-off' },
      open: '{me} 님, 그날 우리 방에서 보낸 시간이요. 저 그거 기사로 안 썼어요.',
      replies: [
        { say: '우리만의 비공개죠', tier: 'great', face: 'shy', remember: 'date-off', answer: '네. 제 인생 첫 비공개 특종이에요. 평생 안 실을 거예요.' },
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
        '잔나가 깃털 펜을 들고 수첩을 펼친다. 바람이 책장을 한 장 넘겨 준다.',
        '"새 이웃 소개 기사예요! 이름은 {me} 님. 첫인상은…"',
        '그녀가 고개를 갸웃하더니 웃는다. "순한 바람 같다. 이렇게 쓸게요!"',
        '"앞으로 {me} 님 소식은 제가 제일 먼저 전할 거예요. 각오하세요!"',
      ],
      replies: [
        { say: '예쁘게 써 줘요!', tier: 'great', answer: '물론이죠! 오늘 기사는 바람보다 가볍고 꽃보다 예쁘게!' },
        { say: '순한 바람이 뭐예요?', tier: 'good', face: 'think', answer: '같이 있으면 숨이 편해지는 바람이요. 칭찬이에요!' },
        { say: '기사는 좀 부담스러워', tier: 'meh', face: 'sorry', answer: '그럼 작은 칸에 쓸게요. 그래도 쓸 거예요. 기자니까요!' },
      ],
    },
    {
      title: '새벽 뒷산의 바람 읽기',
      hint: '새벽(게임 시각 새벽 다섯 시부터 여덟 시) 뒷산에 올라가 보세요. 바람을 읽는대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 5, to: 8 } },
      scene: [
        '뒷산 꼭대기, 잔나가 눈을 감고 두 팔을 벌리고 서 있다. 머리칼이 바람에 흩날린다.',
        '"왔어요? 쉿, 지금 바람이 말하는 중이에요."',
        '새 몇 마리가 그녀 주위를 한 바퀴 돌고 날아간다.',
        '"…동쪽에서 따뜻한 바람. 오늘은 맑음이에요. 이번엔 진짜예요."',
        '"사실 예보가 틀리는 건, 바람이 하는 말을 제가 다 못 알아들어서예요."',
        '"그래도 매일 와요. 언젠가 다 알아들으면 누구도 젖지 않게 할 수 있잖아요."',
      ],
      replies: [
        { say: '나도 같이 들어 볼래', tier: 'great', remember: 'dawn-wind', face: 'smile', answer: ['정말요? 그럼 눈 감아요. …들려요? 그게 아침 인사예요.', '내일부터 예보 공동 작성자예요. {me} 님이요!'] },
        { say: '오늘은 맞을 것 같아', tier: 'good', remember: 'dawn-wind', answer: '그렇죠? {me} 님이 옆에 있으니까 바람이 착하게 굴어요.' },
        { say: '추워요…', tier: 'meh', remember: 'dawn-wind', face: 'sorry', answer: '어머, 미안해요! 바람아, {me} 님 쪽은 좀 비켜 줘!' },
      ],
    },
    {
      title: '꽃차와 특종 회의',
      hint: '잔나가 꽃차를 좋아한대요. 꽃차 한 잔을 가지고 신문사로 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '꽃차를 건네자 잔나가 두 손으로 감싸 쥔다. "어머, 제가 제일 좋아하는 거예요!"',
        '신문사 창가, 원고 더미 사이에 찻잔 두 개가 놓인다.',
        '"오늘은 특종 회의예요. 참석자는 편집장 잔나, 그리고 {me} 님."',
        '그녀가 빈 수첩을 내민다. "{me} 님이 이 마을에서 지키고 싶은 걸 적어 주세요."',
        '"그게 다음 호 일면이에요. 제가 지키고 싶은 것도, 아마 같을 거예요."',
      ],
      replies: [
        { say: '이 마을 사람들 웃음', tier: 'great', remember: 'tea-scoop', face: 'shy', answer: '…같아요. 정말 같아요. 오늘 회의는 만장일치로 끝났어요!' },
        { say: '빵집 아침 냄새', tier: 'good', remember: 'tea-scoop', face: 'laugh', answer: '하하! 그것도 일면감이에요! 볼리바스 씨가 제일 좋아하겠네요.' },
        { say: '잘 모르겠어요', tier: 'meh', remember: 'tea-scoop', answer: '괜찮아요. 꽃차 다 마실 때까지 천천히 생각해요.' },
      ],
    },
    {
      title: '바람막이가 되고 싶어',
      hint: '잔나와 꿈 이야기를 나누면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'shield-wind' },
      scene: [
        '폭풍 경보가 내린 저녁, 잔나가 광장에서 우산 하나로 아이들을 집에 데려다주고 있다.',
        '우산이 또 뒤집힌다. 그래도 그녀는 웃으며 아이들 앞에 선다.',
        '"{me} 님, 전에 제 꿈 맞히셨잖아요. 바람막이 같은 사람."',
        '"기사를 쓰는 것도 그래서예요. 미리 알면 덜 다치니까요."',
        '"예보가 틀려도 포기 못 하는 이유예요. …바보 같죠?"',
      ],
      replies: [
        { say: '이미 바람막이예요', tier: 'great', face: 'shy', answer: '…{me} 님. 그 말, 수첩 맨 앞장에 적어 둘게요. 정정 없이요.' },
        { say: '우산 같이 들게요', tier: 'good', face: 'smile', answer: '고마워요. 둘이 들면 안 뒤집혀요. 아마도요!' },
        { say: '우산부터 바꿔요', tier: 'meh', face: 'laugh', answer: '하하! 이 우산도 저처럼 다시 펴져요. 그게 매력이에요!' },
      ],
    },
    {
      title: '정정 없는 예보',
      hint: '잔나와 아주 가까워지면 아무에게도 안 쓴 기사를 보여 줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤늦은 신문사, 잔나가 서랍 깊숙한 곳에서 원고 한 장을 꺼낸다.',
        '"이건 한 번도 안 실은 기사예요. 제목은… 아직 못 정했어요."',
        '원고엔 날씨 칸만 있다. "내일도 그 사람 곁은 맑음."',
        '"매일 예보가 틀리잖아요. 근데 이것만은 한 번도 안 틀렸어요."',
        '그녀가 원고로 얼굴을 반쯤 가린다. "…그 사람이 누군지는 비공개예요."',
      ],
      replies: [
        { say: '정정 없이 실어 줘요', tier: 'great', face: 'shy', answer: '…{me} 님. 꽃 한 다발 들고 오면 그날 일면에 실을게요.' },
        { say: '그 사람 운이 좋네요', tier: 'good', face: 'laugh', answer: '하하… 눈치가 없는 척하는 거죠? 그것도 귀여워요.' },
        { say: '내일 날씨는 뭔데요?', tier: 'meh', face: 'calm', answer: '…맑음이요. 이건 진짜로요. 이번 예보는 안 틀려요.' },
      ],
    },
    {
      title: '평생 단독 보도',
      hint: '잔나와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '뒷산 꼭대기, 바람이 잔잔하다. 잔나가 신문 한 부를 내민다. 인쇄는 한 장뿐이다.',
        '"속보입니다. 잔나 기자, {me} 님과 평생 함께하고 싶다고 밝혔습니다."',
        '"이건 우리 둘만 보는 신문이에요. 독점, 단독, 평생 연재."',
        '그녀가 깃털 하나를 {me} 손에 쥐여 준다. "바람이 맡긴 거예요. 이제 {me} 님 거예요."',
      ],
      replies: [
        { say: '평생 구독할게요', tier: 'great', face: 'laugh', answer: '속보! 구독자 한 명, 평생 계약! 오늘 바람이 제일 신났어요!' },
        { say: '반지는 내가 준비할게요', tier: 'good', face: 'shy', answer: '…그건 특종 중의 특종이에요. 그날은 꼭 맑음일 거예요.' },
        { say: '천천히 연재해요', tier: 'meh', face: 'smile', answer: '좋아요. 한 회씩, 매일이요. 마감은 없어요.' },
      ],
    },
  ],
  after: [
    '오늘 인터뷰는 끝! 내일 아침 신문에서 봬요!',
    '또 오셨네요! 제보는 언제나 환영이에요. 바람 편에 보내 주세요!',
    '마감이라 이만! 내일 예보는… 맑음! 아마도요.',
    '{me} 님, 조심히 가세요. 오늘 밤바람은 순할 거예요.',
  ],
};
