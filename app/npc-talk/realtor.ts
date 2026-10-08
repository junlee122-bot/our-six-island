// 신형만 — 범마을 부동산 중개인. 손님에게는 해요체, 아내는 "미선이"/"여보".
// 지친 샐러리맨 가장: 계장 시절 영업 실적 일등 자랑, 퇴근 맥주 "크으", 미선이 쥔
// 용돈과 몰래 숨긴 비상금, 집 대출 삼십이 년, 발 냄새 얘기엔 펄쩍 뛰며 화제 돌리기.
// 그래도 가족이 제일(애들·강아지는 배경으로만, 이름 없이). 봉미선과 결혼한 사이라
// 플레이어와 연애하지 않는다: 장은 우정과 가족 이야기이고, 마지막 장은 미선이 몫이라
// 친구에게는 열리지 않는다(검사 때문에 love 조건만 둔다). 원작 대사는 옮기지 않고
// 말버릇·소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const REALTOR_TALK: NpcTalkBook = {
  npc: 'realtor',
  memories: {
    'family-first': '가족이 제일이라고 했어요',
    'beer-friend': '퇴근 맥주 친구가 되기로 했어요',
    'sales-story': '계장 시절 영업 일등 이야기를 들어 줬어요',
    'stash-secret': '비상금 비밀을 지켜 주기로 했어요',
    'foot-fine': '발 얘기는 안 하기로 했어요',
    'loan-cheer': '대출 삼십이 년을 응원했어요',
    'sunny-room': '햇볕 잘 드는 방이 좋다고 했어요',
    'monday-blues': '월요일 아침이 제일 힘들다고 했어요',
    'tie-pick': '넥타이를 골라 줬어요',
    'big-house': '언젠가 넓은 집에 살고 싶다고 했어요',
    'squid-night': '주점에서 오징어를 같이 구웠어요',
    'bar-night': '퇴근 후 주점 바에서 같이 한잔했어요',
    'family-table': '형만네 저녁 식탁에 초대받았어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 축하 이야기를 나눴어요',
  },
  talks: [
    {
      id: 'family-or-work',
      open: ['{me} 님, 하나만 여쭤볼게요. 일이 먼저예요, 가족이 먼저예요?', '영업맨한테는 아주 어려운 질문이거든요.'],
      replies: [
        { say: '당연히 가족이죠', tier: 'great', remember: 'family-first', answer: ['크으, 그 말 듣고 싶었어요! 일은 가족 먹여 살리려고 하는 거예요.', '계장 시절엔 그걸 자주 까먹었지만요.'] },
        { say: '둘 다 중요하죠', tier: 'good', answer: '모범 답안이네요. 면접 보셨으면 바로 합격이었겠어요.' },
        { say: '일이 먼저 아닌가요?', tier: 'meh', face: 'think', answer: '저도 한때 그랬어요. 그러다 미선이가 현관 비밀번호를 바꿨죠.' },
      ],
    },
    {
      id: 'sales-king',
      open: '혹시 제가 회사 다닐 때 영업 실적 일등이었다는 얘기, 했던가요?',
      replies: [
        { say: '처음 들어요! 어떻게요?', tier: 'great', remember: 'sales-story', answer: ['오오, 처음이시라니! 비결은 발이에요. 거래처를 발로 뛰었죠.', '…발 얘기는 여기까지요. 냄새 얘기 아니에요.'] },
        { say: '네 번쯤 들었어요', tier: 'good', face: 'laugh', answer: '하하, 그럼 다섯 번째는 짧게 할게요. 일등이었어요. 끝.' },
        { say: '지금은 중개인이잖아요', tier: 'meh', face: 'sorry', answer: '…그렇죠. 그래도 왕년이라는 게 있잖아요. 마음은 아직 계장이에요.' },
      ],
    },
    {
      id: 'stash',
      open: ['{me} 님, 입 무거우세요? 사실 비밀 금고가 하나 있어요.', '미선이 모르는… 아주 작은 비상금이요.'],
      replies: [
        { say: '절대 말 안 할게요', tier: 'great', remember: 'stash-secret', answer: '역시 {me} 님! 이건 남자들끼리의, 아니 친구끼리의 계약이에요.' },
        { say: '어디 숨겼는데요?', tier: 'good', face: 'think', answer: '그건 영업 비밀이에요. 책장… 아니, 아무 데도 아니에요!' },
        { say: '미선 씨한테 말할래요', tier: 'meh', face: 'sorry', answer: '아이고, 그것만은 봐주세요. 제 퇴근 맥주가 걸린 일이에요.' },
      ],
    },
    {
      id: 'beer-after',
      open: '퇴근하고 마시는 첫 모금 맥주, 그 맛 아세요? 크으, 하루가 녹아요.',
      replies: [
        { say: '언제 같이 한잔해요', tier: 'great', remember: 'beer-friend', answer: '좋죠! 주점 바 제 옆자리 비워 둘게요. 계산은… 그날 용돈 사정 봐서요.' },
        { say: '저는 주스파예요', tier: 'good', answer: '그것도 좋아요. 잔 부딪치는 소리만 나면 퇴근 기분 나거든요.' },
        { say: '술은 몸에 안 좋아요', tier: 'meh', face: 'sorry', answer: '미선이랑 똑같은 말씀을… 알아요, 딱 한 잔만 마실게요. 진짜로요.' },
      ],
    },
    {
      id: 'foot',
      open: '아니, 요즘 다들 제 구두 쪽을 쳐다보더라고요. {me} 님도 봤어요?',
      replies: [
        { say: '아무 냄새도 안 나요', tier: 'great', remember: 'foot-fine', answer: '그렇죠! 역시 {me} 님은 공정해요. 자, 그럼 이 얘긴 영원히 끝!' },
        { say: '구두가 멋져서 봤겠죠', tier: 'good', face: 'laugh', answer: '하하, 그렇죠? 미선이가 세일 때 골라 준 거예요. 자, 다른 얘기 해요.' },
        { say: '창문 좀 열까요?', tier: 'meh', face: 'wow', answer: '왜, 왜요? 그냥 환기죠? 환기요! 아, 오늘 날씨 좋네요!' },
      ],
    },
    {
      id: 'loan',
      open: '집 대출이 아직 삼십이 년 남았어요. 중개인이 제일 집 걱정이 많다니까요.',
      replies: [
        { say: '다 갚는 날 축하해요!', tier: 'great', remember: 'loan-cheer', answer: ['그날 오면 {me} 님도 꼭 와요. 동네잔치예요.', '…그때 제 머리카락이 남아 있으면 좋겠네요.'] },
        { say: '그래도 내 집이잖아요', tier: 'good', answer: '맞아요. 은행 반, 제 반이지만 불 켜진 창문은 다 제 거예요.' },
        { say: '그냥 월세 살지 그래요', tier: 'meh', face: 'think', answer: '하하, 중개인한테 그런 말씀을. 상담은 또 해 드릴게요.' },
      ],
    },
    {
      id: 'sunny-room',
      open: '집 보러 오시는 분들은 방 크기만 봐요. {me} 님은 뭘 먼저 보세요?',
      replies: [
        { say: '햇볕 드는 창이요', tier: 'great', remember: 'sunny-room', answer: '오오, 뭘 좀 아시네요! 남향 창 하나가 방 두 개 값을 해요.' },
        { say: '부엌이 넓은지요', tier: 'good', answer: '미선이랑 똑같네요. 우리 집 실세는 부엌에서 나와요.' },
        { say: '값이 싼지요', tier: 'meh', face: 'think', answer: '현실적이시네요. 싼 데는 이유가 있어요. 그 이유를 같이 봐요.' },
      ],
    },
    {
      id: 'monday',
      open: '{me} 님은 일주일 중에 언제가 제일 힘드세요? 저는 정해져 있어요.',
      replies: [
        { say: '월요일 아침이요', tier: 'great', remember: 'monday-blues', answer: '역시! 월요일 아침 넥타이는 왜 그렇게 무거울까요. 동지네요.' },
        { say: '저는 매일이 좋아요', tier: 'good', face: 'wow', answer: '와, 대단하세요. 그 비결 좀 계약서로 써 주세요.' },
        { say: '금요일 밤이요', tier: 'meh', face: 'think', answer: '금요일 밤이요? 그날은 퇴근 맥주 날인데… 사람마다 다르네요.' },
      ],
    },
    {
      id: 'allowance',
      open: '이번 달 용돈 협상도 결렬됐어요. 미선이가 저보다 영업을 잘해요.',
      replies: [
        { say: '그래도 든든하잖아요', tier: 'great', face: 'smile', answer: '…맞아요. 미선이 덕분에 집도 있고, 대출도 밀린 적이 없어요.' },
        { say: '다음 달엔 이길 거예요', tier: 'good', face: 'laugh', answer: '그 말 믿고 자료 준비할게요. 계장 시절 보고서 실력으로요.' },
        { say: '용돈은 왜 받아요?', tier: 'meh', face: 'think', answer: '그게… 우리 집은 미선이가 재무부 장관이라서요.' },
      ],
    },
    {
      id: 'tie',
      open: '{me} 님, 오늘 넥타이 어때요? 무늬 있는 거랑 줄무늬 중에 고민했어요.',
      replies: [
        { say: '딱 영업왕 넥타이네요', tier: 'great', remember: 'tie-pick', answer: '크으, 영업왕! 오늘 계약 세 건은 하겠어요. 미선이 안목이에요.' },
        { say: '줄무늬가 나았겠어요', tier: 'good', remember: 'tie-pick', answer: '역시 그렇죠? 내일은 줄무늬로 할게요. {me} 님 말 듣고요.' },
        { say: '넥타이 안 하면 안 돼요?', tier: 'meh', face: 'sorry', answer: '중개인한테 넥타이는 갑옷이에요. 벗으면 마음이 허전해요.' },
      ],
    },
    {
      id: 'big-house',
      open: '{me} 님은 꿈의 집이 있어요? 방이 몇 개고, 마당은 어떤지.',
      replies: [
        { say: '다 같이 모이는 넓은 집', tier: 'great', remember: 'big-house', answer: '좋네요! 식구 많은 집은 거실이 넓어야 해요. 도면 그려 둘게요.' },
        { say: '작아도 아늑한 집', tier: 'good', answer: '그것도 좋아요. 작은 집은 불 하나로 다 따뜻해지거든요.' },
        { say: '집은 그냥 잠자는 곳', tier: 'meh', face: 'think', answer: '하하, 그럼 침대 좋은 방부터 찾아 드릴게요. 잠도 중요하니까요.' },
      ],
    },
    {
      id: 'misun-praise',
      open: '미선이가 어제 제 도시락에 문어 소시지를 넣어 줬어요. 무슨 날인가 싶었죠.',
      replies: [
        { say: '사랑받고 계시네요', tier: 'great', face: 'shy', answer: '헤헤… 그런가요? 결혼하고 이렇게 오래 지나도 그건 설레요.' },
        { say: '무슨 날이었어요?', tier: 'good', face: 'think', answer: '아무 날도 아니래요. 그게 더 무서웠어요. 뭘 잘못했나 싶어서요.' },
        { say: '저도 하나 주세요', tier: 'meh', face: 'laugh', answer: '하하, 이건 안 돼요. 하나라도 남기면 미선이가 서운해해요.' },
      ],
    },
    {
      id: 'overtime',
      open: '계장 시절엔 야근이 일상이었어요. 집에 가면 다들 자고 있었죠.',
      replies: [
        { say: '지금은 저녁을 같이 먹죠', tier: 'great', face: 'smile', answer: '맞아요. 그래서 이 마을로 온 거예요. 저녁 밥상이 제일 큰 실적이에요.' },
        { say: '고생 많으셨어요', tier: 'good', answer: '…그 말 한마디면 돼요. 미선이도 그 말을 해 줬었어요.' },
        { say: '야근 수당은 받았어요?', tier: 'meh', face: 'sorry', answer: '그게… 그 얘긴 맥주 없이는 못 해요. 다음에 할게요.' },
      ],
    },
    {
      id: 'kids-photo',
      when: { ch: 2 },
      open: '{me} 님, 지갑 속 사진 보실래요? 우리 식구예요. 강아지까지 다 있어요.',
      replies: [
        { say: '다들 웃는 얼굴이네요', tier: 'great', remember: 'family-first', face: 'shy', answer: '그렇죠? 이 사진 보면 대출 삼십이 년도 거뜬해요.' },
        { say: '미선 씨가 제일 예뻐요', tier: 'good', face: 'laugh', answer: '하하, 그 말 미선이한테 꼭 전할게요. 오늘 반찬이 늘겠어요.' },
        { say: '사진이 흔들렸어요', tier: 'meh', answer: '애들이 가만히 있질 않아서요. 그것도 우리 집다운 거예요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비가 오네요. 구두가 다 젖었어요. 아, 냄새는 아니에요. 습기요, 습기.',
      replies: [
        { say: '물 잘 빠지는 집이 보이죠?', tier: 'great', answer: '오, 뭘 아시네요! 비 오는 날이 진짜 집 보는 날이에요.' },
        { say: '우산 빌려 드릴까요?', tier: 'good', answer: '고마워요. 미선이가 챙겨 줬는데 또 사무실에 놓고 왔어요.' },
        { say: '양말은 갈아 신으세요', tier: 'meh', face: 'wow', answer: '왜, 왜요? 아무 일 없어요. 자, 상담 하시죠!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 와요! 집 앞 눈 치우는 건 제 담당이에요. 허리가 벌써 아파요.',
      replies: [
        { say: '같이 치워 드릴게요', tier: 'great', answer: '정말요? 끝나면 어묵 국물 대접할게요. 비상금으로요.' },
        { say: '눈 덮인 마을 예뻐요', tier: 'good', answer: '그렇죠. 눈 오면 집집이 다 비싸 보여요. 직업병이에요.' },
        { say: '그냥 두면 녹아요', tier: 'meh', face: 'sorry', answer: '그러면 미선이가 녹지 않아요. 치워야 해요.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '아, 퇴근 시간이다… 오늘도 수고했다, 나 자신. {me} 님도 수고하셨어요.',
      replies: [
        { say: '주점 가서 한잔할까요?', tier: 'great', remember: 'beer-friend', answer: '크으, 그 말 기다렸어요! 딱 한 잔만이에요. 아마도요.' },
        { say: '집에 일찍 가셔야죠', tier: 'good', answer: '맞아요. 오늘은 저녁 식탁에 제가 좋아하는 생선구이래요.' },
        { say: '저는 아직 할 일이 많아요', tier: 'meh', face: 'sorry', answer: '아이고, 무리하지 마요. 저도 계장 시절에 그러다 쓰러질 뻔했어요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '하아암… 이른 아침이네요. 애들 깰까 봐 까치발로 나왔어요.',
      replies: [
        { say: '커피 한 잔 드릴까요?', tier: 'great', answer: '오, 살았다! {me} 님은 천사예요. 이제 눈이 다 떠졌어요.' },
        { say: '부지런하시네요', tier: 'good', answer: '가장은 부지런해야죠. 사실 강아지가 깨워서 일어났어요.' },
        { say: '더 주무시지 그래요', tier: 'meh', face: 'calm', answer: '그러고 싶은데 대출이 안 자요. 하하.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날이에요! 오늘은 미선이가 용돈을 조금 더 줬어요. 일 년에 몇 번 없는 날이에요.',
      replies: [
        { say: '오늘은 신나게 놀아요!', tier: 'great', answer: '그럼요! 오늘은 땅값 얘기 안 해요. 가족이랑 노점 다 돌 거예요.' },
        { say: '얼마나 더 받으셨어요?', tier: 'good', face: 'laugh', answer: '그건 비밀이에요. 맥주 두 잔 정도라고만 해 둘게요.' },
        { say: '저는 그냥 쉬려고요', tier: 'meh', face: 'calm', answer: '그것도 축제죠. 쉬는 게 제일 큰 선물이에요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '어, 바다 냄새! {me} 님, 오늘 {fish} 낚으셨죠? 구우면 맥주 안주로 딱인데요.',
      replies: [
        { say: '한 마리 나눠 드릴게요', tier: 'great', answer: '정말요? 크으, 오늘 저녁은 천국이에요! 미선이 몫도 남길게요.' },
        { say: '겨우 한 마리예요', tier: 'good', answer: '한 마리면 충분해요. 계약도 한 건씩 하는 거예요.' },
        { say: '생선 냄새 나요?', tier: 'meh', face: 'sorry', answer: '아, 아니요! 좋은 냄새예요. 제 발… 아니, 아무것도 아니에요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었어요! 오늘 엄청 큰 걸 낚으셨다면서요? 실적 일등이네요!',
      replies: [
        { say: '계장님 기록 깼어요?', tier: 'great', face: 'laugh', answer: '하하, 제 기록은 영업이라 안 깨져요. 그래도 오늘은 {me} 님이 일등!' },
        { say: '운이 좋았어요', tier: 'good', answer: '운도 실력이에요. 발로 뛴 사람한테만 오는 운이거든요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '{me} 님 손에 흙이 묻었네요. 밭일하셨구나. 땅을 아는 분이 집도 잘 봐요.',
      replies: [
        { say: '마당 있는 집이 좋아요', tier: 'great', answer: '역시! 텃밭 딸린 집, 다음 확장 때 꼭 보여 드릴게요.' },
        { say: '허리가 아파요', tier: 'good', answer: '저도요. 앉으세요. 의자 하나는 발키리 씨가 공짜로 고쳐 준 거예요.' },
        { say: '흙 털고 올게요', tier: 'meh', face: 'calm', answer: '괜찮아요. 부동산 바닥은 흙 밟는 일이 일이에요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me} 님, 금별 작물이요? 와, 반짝반짝하네요. 우리 동네 땅값 오르겠어요.',
      replies: [
        { say: '땅이 좋아서 그래요', tier: 'great', answer: '그쵸! 제가 늘 말했잖아요. 좋은 땅은 사람을 알아봐요.' },
        { say: '미선 씨한테 자랑할래요', tier: 'good', face: 'laugh', answer: '하하, 미선이는 그거 보면 시세부터 물어볼 거예요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘 어깨가 축 처졌네요. 월요일 아침의 제 얼굴이에요.',
      replies: [
        { say: '그냥 좀 지쳤어요', tier: 'great', face: 'smile', answer: ['그런 날엔 아무것도 하지 마요. 저녁 먹고 일찍 자요.', '내일은 오늘보다 넥타이가 가벼울 거예요.'] },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', answer: '그래도 커피 한 잔 하고 가요. 믹스지만 마음은 원두예요.' },
        { say: '맥주나 마실래요', tier: 'meh', face: 'think', answer: '그 마음 알아요. 근데 지친 날 맥주는 한 잔에서 끝내요. 경험담이에요.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me} 님, 오늘 생일이라면서요! 축하해요! 이건 제 비상금으로 산 거예요.',
      replies: [
        { say: '비상금을요? 감동이에요', tier: 'great', face: 'shy', answer: '쉿, 미선이한텐 비밀이에요. 친구 생일엔 비상금이 출동해요.' },
        { say: '고마워요, 형만 씨', tier: 'good', answer: '생일엔 가족이랑 맛있는 거 꼭 드세요. 그게 제일이에요.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '오늘 광장에서 결혼식 있었죠? 신혼집 상담은 수수료 없이 해 드려야겠어요.',
      replies: [
        { say: '결혼 선배로 한마디 해요', tier: 'great', answer: '싸워도 그날 안에 화해하기. 그거 하나면 돼요. 우리 집 규칙이에요.' },
        { say: '부러워요', tier: 'good', face: 'smile', answer: '{me} 님한테도 좋은 날이 와요. 그때 신혼집은 제가 찾아 드릴게요.' },
        { say: '대출부터 걱정되네요', tier: 'meh', face: 'sorry', answer: '…그건 저도 할 말이 없네요. 짧게 잡으라고 전해 줘요.' },
      ],
    },
    {
      id: 'op-misun',
      when: { bond: 'misun' },
      open: '{me} 님, 미선이 만났어요? 혹시 제 얘기 안 했어요? 맥주 얘기라든가.',
      replies: [
        { say: '형만 씨 칭찬하던데요', tier: 'great', face: 'shy', answer: '정말요? 헤헤… 오늘은 일찍 들어가야겠어요. 꽃이라도 사 갈까요.' },
        { say: '용돈 얘기 하던데요', tier: 'good', face: 'sorry', answer: '아이고, 동결이래요, 인상이래요? 아니, 듣지 않을래요.' },
        { say: '모르는 척할게요', tier: 'meh', answer: '현명하세요. 부부 일엔 모르는 게 약이에요.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '발키리 씨 공방 다녀오셨어요? 이번 확장 공사비, 혹시 깎아 준대요?',
      replies: [
        { say: '마감이 최고라던데요', tier: 'great', answer: '그건 인정이에요. 발키리 씨 일은 삼십 년 가요. 우리 대출처럼요.' },
        { say: '한 푼도 안 깎는대요', tier: 'good', face: 'sorry', answer: '역시… 계장 시절 협상 실력도 거기선 안 통해요.' },
        { say: '직접 물어보세요', tier: 'meh', face: 'wow', answer: '저, 저는 좀… 저번에 물어봤다가 의자만 하나 더 샀어요.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '{other} 선장님 만나셨죠? 오늘 밤 주점 바에 제 자리 있대요? 크으.',
      replies: [
        { say: '제일 좋은 자리래요', tier: 'great', answer: '역시 선장님! 오늘은 모험 이야기 안주 삼아 딱 한 잔이에요.' },
        { say: '외상은 안 된대요', tier: 'good', face: 'sorry', answer: '아니, 저 외상 안 해요! 비상금이 있… 아, 못 들은 걸로 해요.' },
        { say: '오늘은 집에 가세요', tier: 'meh', face: 'calm', answer: '…그 말이 맞네요. 미선이가 생선구이 한대요.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '{other} 씨 만났어요? 또 주식이 최고라고 했죠? 아니에요, 땅이에요.',
      replies: [
        { say: '땅은 도망 안 가죠', tier: 'great', answer: '그렇죠! 주식은 밤새 떨어져도 집은 아침에 그대로 있어요.' },
        { say: '둘 다 장단점이 있죠', tier: 'good', face: 'think', answer: '공정하시네요. 그래도 오늘 밤 주점에선 제가 이길 거예요.' },
        { say: '주식도 좋아 보이던데요', tier: 'meh', face: 'sorry', answer: '아이고, {me} 님까지… 대출 삼십이 년의 무게를 몰라서 그래요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-beer',
      when: { mem: 'beer-friend' },
      use: 'beer-friend',
      open: '{me} 님, 같이 한잔하기로 한 거 기억나요? 오늘 비상금 사정이 괜찮아요.',
      replies: [
        { say: '좋아요, 오늘 가요!', tier: 'great', answer: '크으! 첫 잔은 제가 살게요. 둘째 잔부터는 그날 운이에요.' },
        { say: '미선 씨 허락 받았어요?', tier: 'good', face: 'sorry', answer: '…받았다고 치죠. 딱 한 잔이니까요.' },
      ],
    },
    {
      id: 'cb-sales',
      when: { mem: 'sales-story' },
      use: 'sales-story',
      open: '{me} 님은 제 영업 얘기를 처음처럼 들어 줬죠. 그래서 오늘은 속편이에요.',
      replies: [
        { say: '속편 기대돼요!', tier: 'great', answer: ['비 오는 날 거래처 앞에서 세 시간 기다렸어요. 결국 계약했죠.', '그날 구두는… 그 얘긴 빼고요.'] },
        { say: '짧게 부탁해요', tier: 'good', face: 'laugh', answer: '하하, 요약하면 이겼다! 끝. 영업은 결론부터예요.' },
        { say: '또 일등 얘기죠?', tier: 'meh', face: 'sorry', answer: '…들켰네요. 그래도 사실이에요. 진짜예요.' },
      ],
    },
    {
      id: 'cb-stash',
      when: { mem: 'stash-secret' },
      use: 'stash-secret',
      open: '{me} 님… 비상금 얘기, 미선이한테 안 하셨죠? 어제 책장 정리를 하더라고요.',
      replies: [
        { say: '한 마디도 안 했어요', tier: 'great', answer: '믿었어요! 친구 계약은 평생 유효해요. 장소만 옮기면 돼요.' },
        { say: '이제 그만 들키세요', tier: 'good', face: 'think', answer: '…그게 맞는 것 같기도 해요. 들켜도 미선이는 결국 웃거든요.' },
      ],
    },
    {
      id: 'cb-loan',
      when: { mem: 'loan-cheer' },
      use: 'loan-cheer',
      open: '{me} 님이 대출 갚는 날 축하해 준다고 했잖아요. 이번 달도 무사히 냈어요!',
      replies: [
        { say: '수고하셨어요, 가장님', tier: 'great', face: 'shy', answer: '가장님이라니… 크으, 이 말이 맥주보다 시원하네요.' },
        { say: '이제 삼십일 년 남았네요', tier: 'good', face: 'laugh', answer: '하하, 그렇게 세면 금방이에요. 금방… 이겠죠?' },
      ],
    },
    {
      id: 'cb-room',
      when: { mem: 'sunny-room' },
      use: 'sunny-room',
      open: '햇볕 드는 창이 좋다고 하셨죠? 남향 거실 도면 하나 따로 챙겨 뒀어요.',
      replies: [
        { say: '역시 영업왕이세요', tier: 'great', answer: '크으, 그 말에 오늘 하루가 보상받았어요. 다음 확장 때 꼭 봐요.' },
        { say: '기억하고 계셨어요?', tier: 'good', face: 'shy', answer: '영업맨은 손님 말을 잊지 않아요. 친구 말은 더 안 잊고요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님 좋아하는 게 {taste}라면서요? 미선이한테 메모해 달라고 했어요.',
      replies: [
        { say: '기억해 줘서 고마워요', tier: 'great', remember: 'taste-heard', answer: '손님 취향은 영업의 기본이에요. 친구 취향은 마음의 기본이고요.' },
        { say: '미선 씨가 메모해요?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '제 수첩은 매번 잃어버려서요. 우리 집 기록은 다 미선이 거예요.' },
        { say: '요즘은 좀 바뀌었어요', tier: 'meh', remember: 'taste-heard', answer: '앗, 그럼 다음에 알려 주세요. 메모 새로 해 둘게요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 돌아다닌 거 즐거웠어요. 외근인데 소풍 같더라고요.',
      replies: [
        { say: '또 같이 다녀요', tier: 'great', remember: 'outing-talk', answer: '좋아요! 다음엔 미선이 도시락 두 개 부탁해 볼게요.' },
        { say: '계속 집값 얘기했잖아요', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '하하, 직업병이에요. 다음엔 경치 얘기만 할게요. 노력해 볼게요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me} 님, 곧 생일이죠? 미선이가 케이크는 자기가 고른대요. 저는 계산 담당이고요.',
      replies: [
        { say: '다 같이 모이면 충분해요', tier: 'great', face: 'smile', remember: 'bday-plan', answer: '그 말 미선이한테 전할게요. 우리 식구 다 데리고 갈게요.' },
        { say: '케이크 좋아요!', tier: 'good', remember: 'bday-plan', answer: '그럼 제일 큰 걸로요. 비상금이 조금 울겠지만 괜찮아요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '명함 한 장',
      hint: '한 번 이야기를 나누면 형만이 명함을 건네요.',
      need: { days: 1 },
      scene: [
        '형만이 넥타이를 고쳐 매고 명함을 두 손으로 내민다.',
        '"범마을 부동산 신형만입니다. 계장 시절 버릇이라 명함이 많아요."',
        '"한 장 더 드릴게요. 하나는 집에 두세요. 급할 때 찾기 쉽게요."',
        '"집 넓히실 때든, 그냥 수다 떨고 싶을 때든 들러 주세요."',
      ],
      replies: [
        { say: '저도 잘 부탁드려요', tier: 'great', answer: '크으, 첫인사가 시원하네요! 이건 좋은 거래의 시작이에요.' },
        { say: '두 장이나요?', tier: 'good', face: 'laugh', answer: '하하, 한 장은 미선이 몫이에요. 부부가 번갈아 지키거든요.' },
        { say: '집은 아직 괜찮아요', tier: 'meh', face: 'calm', answer: '그래도 넣어 두세요. 수다 상담은 언제든 무료예요.' },
      ],
    },
    {
      title: '퇴근 후의 바',
      hint: '퇴근 뒤 저녁 여섯 시부터 밤 열 시 사이에 주점 바로 가 보세요. 형만이 한잔한대요.',
      need: { days: 3, points: 20, visit: { area: 'tavern', from: 18, to: 22 } },
      scene: [
        '주점 바 끝자리. 형만이 넥타이를 반쯤 풀고 잔을 든다.',
        '"크으! 이 한 모금을 위해 하루를 버텼어요."',
        '"{me} 님, 앉아요. 이 자리는 원래 혼자 앉는 자리인데 오늘은 둘이에요."',
        '"회사 다닐 땐 퇴근 후에도 상사랑 마셨거든요. 친구랑은 처음 같아요."',
        '샹크스가 말없이 오징어 한 접시를 밀어 준다.',
      ],
      replies: [
        { say: '오늘 하루도 수고했어요', tier: 'great', remember: 'bar-night', face: 'shy', answer: '…그 말, 미선이 말고 들은 건 오랜만이에요. 건배해요!' },
        { say: '딱 한 잔만이에요', tier: 'good', remember: 'bar-night', face: 'laugh', answer: '하하, 미선이 같은 말을! 네, 딱 한 잔. 진짜로요.' },
        { say: '저는 주스로 할게요', tier: 'meh', remember: 'bar-night', answer: '좋아요. 잔이 뭐든 부딪치면 퇴근이에요.' },
      ],
    },
    {
      title: '오징어 굽는 밤',
      hint: '형만이 맥주 안주로 오징어 얘기를 했어요. 오징어 한 마리를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'squid', take: true } },
      scene: [
        '오징어를 내밀자 형만의 눈이 반짝인다.',
        '"오징어! {me} 님, 뭘 좀 아시는 분이네요!"',
        '사무실 뒤 작은 화로에서 오징어가 동그랗게 말린다.',
        '"계장 시절 야근하고 나면 동기들이랑 이렇게 구웠어요."',
        '"다들 피곤한데도 이 냄새 맡으면 웃었죠. 그 맛에 버텼어요."',
        '"…아, 다리는 제가 먹어도 되죠? 제일 맛있는 데라서요."',
      ],
      replies: [
        { say: '다리 다 드세요', tier: 'great', remember: 'squid-night', face: 'laugh', answer: '크으! 친구 좋다는 게 이거죠. 몸통은 반 나눠요.' },
        { say: '동기들 보고 싶겠어요', tier: 'good', remember: 'squid-night', face: 'smile', answer: '가끔요. 그래도 지금은 {me} 님이 있잖아요.' },
        { say: '냄새가 좀 배겠어요', tier: 'meh', remember: 'squid-night', face: 'wow', answer: '오징어 냄새예요! 오징어요! 다른 냄새 아니에요!' },
      ],
    },
    {
      title: '지갑 속 사진',
      hint: '형만과 평소에 가족 이야기를 나눠 보세요. 가족이 먼저라고 하면 열려요.',
      need: { days: 9, points: 60, mem: 'family-first' },
      scene: [
        '퇴근길, 형만이 벤치에 앉아 낡은 지갑을 연다.',
        '"가족이 제일이라고 하셨죠. 그래서 {me} 님한텐 보여 주고 싶었어요."',
        '꼬깃꼬깃한 사진 속에서 미선과 아이들, 강아지가 웃고 있다.',
        '"계장 시절엔 이 사진만 보고 야근했어요. 집에 가면 다들 자니까요."',
        '"이 마을에 와서야 이 얼굴들을 깨어 있을 때 봐요. 그게 제 실적이에요."',
      ],
      replies: [
        { say: '제일 큰 실적이네요', tier: 'great', face: 'shy', answer: '…크으, 맥주도 없는데 목이 메네요. 고마워요, {me} 님.' },
        { say: '다들 형만 씨 닮았어요', tier: 'good', face: 'laugh', answer: '하하, 그 말 들으면 미선이가 섭섭해해요. 다 미선이 닮았어요.' },
        { say: '사진이 많이 낡았네요', tier: 'meh', answer: '그만큼 많이 봤다는 거예요. 새로 찍을 때 됐네요.' },
      ],
    },
    {
      title: '우리 집 식구',
      hint: '형만과 아주 친해지면 그가 집 저녁 식탁에 초대한대요.',
      need: { days: 13, points: 96 },
      scene: [
        '형만네 저녁 식탁. 찌개 냄새와 아이들 웃음소리가 가득하다.',
        '미선이 숟가락을 하나 더 놓는다. "{me} 님 자리예요."',
        '"여보, 오늘은 맥주 두 캔 허락할게요. 손님 왔으니까요."',
        '형만이 헛기침을 하고 잔을 든다.',
        '"{me} 님. 오늘부터 우리 집 식구예요. 이건 미선이랑 합의한 거예요."',
        '"도장은 없어도 이 계약은 평생이에요."',
      ],
      replies: [
        { say: '평생 계약, 받을게요', tier: 'great', remember: 'family-table', face: 'shy', answer: '크으… 여보, 들었지? 오늘은 세 캔이다! …아, 아니에요. 두 캔이요.' },
        { say: '찌개가 정말 맛있어요', tier: 'good', remember: 'family-table', face: 'laugh', answer: '그렇죠! 이 맛에 대출 삼십이 년도 버티는 거예요.' },
        { say: '폐 끼치는 거 아닐까요', tier: 'meh', remember: 'family-table', face: 'smile', answer: '식구끼리 폐가 어디 있어요. 다음 주에도 와요.' },
      ],
    },
    {
      title: '미선이에게 가는 길',
      hint: '형만의 마지막 이야기는 아내 미선이 몫이라, 친구에게는 닫혀 있어요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '퇴근길, 형만이 꽃집 앞에서 한참을 망설인다.',
        '"{me} 님, 이 꽃 어때요? 미선이 주려고요. 아무 날도 아닌데요."',
        '"계장 시절엔 기념일도 까먹었는데, 이젠 아무 날에 사고 싶어요."',
        '"집에 불이 켜져 있으면, 그게 제일 좋은 집이에요. 중개인이 보증해요."',
      ],
      replies: [
        { say: '미선 씨가 좋아할 거예요', tier: 'great', face: 'shy', answer: '헤헤… 용돈은 바닥났지만 마음은 부자예요. 다녀올게요!' },
        { say: '노란 꽃이 예뻐요', tier: 'good', answer: '오, 그걸로 할게요. {me} 님 안목을 믿어요.' },
        { say: '비상금으로 사요?', tier: 'meh', face: 'sorry', answer: '쉿! 들키면 꽃보다 꿀밤이 먼저예요.' },
      ],
    },
  ],
  after: [
    '오늘 상담은 여기까지예요. 내일 또 들러 주세요.',
    '크으, 말을 많이 했더니 목이 마르네요. 퇴근이 기다려져요.',
    '저 이제 들어가 봐야 해요. 늦으면 미선이가… 네, 아시죠.',
    '{me} 님, 조심히 가세요. 집에 불 켜 두는 거 잊지 마요.',
  ],
};
