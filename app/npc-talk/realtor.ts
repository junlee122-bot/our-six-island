// 신형만 — 범마을 부동산 중개인. 손님에게는 해요체, 아내는 "미선이"/"여보".
// 『짱구는 못말려』 노하라 히로시(한국판 신형만). 지친 샐러리맨 가장: 계장 시절
// 영업 실적 일등 자랑, 퇴근 맥주 "크으", 미선이 쥔 용돈과 몰래 숨긴 비상금,
// 집 대출 삼십이 년, 발 냄새 얘기엔 펄쩍 뛰며 화제 돌리기, 시골 본가 부모님.
// 집에는 장난꾸러기 짱구(엉덩이 춤, 액션가면, 초코비), 아기 짱아, 강아지 흰둥이.
// 가족은 마을 주민이 아니라 이야기 속에서만 나온다. 봉미선과 결혼한 사이라
// 플레이어와 연애하지 않는다: 모든 대화와 장은 우정·이웃 이야기이고, 마지막 장
// '평범한 하루'는 검사 규칙 때문에 love 조건을 둔다(친구에게는 열리지 않음).
// 원작 대사는 옮기지 않고 말버릇·소재만 빌린다.
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
    'jjanggu-fan': '짱구 장난 이야기에 같이 웃어 줬어요',
    'butt-dance': '짱구의 엉덩이 춤을 배워 보기로 했어요',
    'jjanga-baby': '짱아가 아기였을 때 이야기를 들었어요',
    'shiro-walk': '흰둥이 산책을 같이 하기로 했어요',
    'hometown': '시골 본가 부모님 이야기를 들었어요',
    'fight-judge': '부부싸움 심판을 맡기로 했어요',
    'how-met': '미선이와 처음 만난 이야기를 들었어요',
    'action-mask': '짱구의 액션가면 놀이 상대가 되기로 했어요',
    'dad-cook': '형만표 볶음밥을 먹어 보기로 했어요',
    'hair-worry': '머리숱 걱정을 들어 줬어요',
    'boss-story': '옛 회사 부장님 이야기를 들었어요',
    'sunday-out': '일요일 가족 나들이를 응원했어요',
    'misun-diet': '미선이 다이어트 비밀을 지켜 주기로 했어요',
    'chocobi': '초코비 심부름 이야기를 들었어요',
    'dream-old': '어릴 적 꿈 이야기를 들었어요',
    'lunchbox': '미선이 도시락 자랑을 들어 줬어요',
    'date-talk': '형만이 내 방에 놀러 온 날을 이야기했어요',
  },
  talks: [
    {
      id: 'family-or-work',
      open: ['{me} 님, 하나만 여쭤볼게요. 일이 먼저예요, 가족이 먼저예요?', '영업맨한테는 아주 어려운 질문이거든요.'],
      replies: [
        { say: '당연히 가족이죠', tier: 'great', remember: 'family-first', answer: ['크으, 그 말 듣고 싶었어요! 일은 가족 먹여 살리려고 하는 거예요.', '계장 시절엔 그걸 자주 까먹었지만요.'] },
        { say: '둘 다 중요하죠', tier: 'good', answer: '모범 답안이네요. 면접 보셨으면 바로 합격이었겠어요.' },
        { say: '일이 먼저 아닌가요?', tier: 'meh', face: 'think', answer: ['저도 한때 그랬어요. 그러다 짱구가 저를 "손님"이라고 불렀죠.', '그날 이후로 저녁은 꼭 집에서 먹어요.'] },
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
        { say: '절대 말 안 할게요', tier: 'great', remember: 'stash-secret', answer: '역시 {me} 님! 이건 친구끼리의 계약이에요. 도장은 마음으로요.' },
        { say: '어디 숨겼는데요?', tier: 'good', face: 'think', answer: ['그건 영업 비밀이에요. 책장… 아니, 아무 데도 아니에요!', '짱구가 알면 초코비로 바뀌거든요. 절대 비밀이에요.'] },
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
        { say: '아무 냄새도 안 나요', tier: 'great', remember: 'foot-fine', answer: ['그렇죠! 역시 {me} 님은 공정해요.', '짱구가 양말 냄새로 모기를 잡는다고 놀리는데, 다 거짓말이에요.'] },
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
        { say: '미선 씨 마음이네요', tier: 'great', face: 'shy', remember: 'lunchbox', answer: '헤헤… 그런가요? 결혼하고 이렇게 오래 지나도 그건 설레요.' },
        { say: '무슨 날이었어요?', tier: 'good', face: 'think', answer: '아무 날도 아니래요. 그게 더 무서웠어요. 뭘 잘못했나 싶어서요.' },
        { say: '저도 하나 주세요', tier: 'meh', face: 'laugh', answer: '하하, 이건 안 돼요. 짱구가 벌써 두 개 훔쳐 먹었거든요.' },
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
      id: 'jjanggu-prank',
      open: ['{me} 님, 우리 짱구 얘기 들으셨어요? 오늘 아침에 또 사고를 쳤어요.', '제 구두에 개구리를 넣어 놨더라고요. 출근길에 개굴, 하고.'],
      replies: [
        { say: '하하, 짱구답네요', tier: 'great', face: 'laugh', remember: 'jjanggu-fan', answer: ['그렇죠? 화를 내야 하는데 웃음부터 나와요.', '개구리는 연못에 돌려보냈어요. 짱구랑 둘이서요.'] },
        { say: '개구리는 괜찮아요?', tier: 'good', face: 'think', answer: '개구리는 멀쩡해요. 제 구두 안에서 오히려 기절할 뻔했대요… 아니, 아니에요.' },
        { say: '따끔하게 혼내세요', tier: 'meh', face: 'sorry', answer: '혼냈죠. 그런데 엉덩이를 흔들면서 도망가는데 어떻게 쫓아가요.' },
      ],
    },
    {
      id: 'butt-dance',
      open: ['짱구가 요즘 엉덩이 춤을 춰요. 엉덩이를 내밀고 씰룩씰룩.', '{me} 님, 혹시 배워 보실래요? 짱구가 제자를 찾더라고요.'],
      replies: [
        { say: '한번 배워 볼게요!', tier: 'great', remember: 'butt-dance', face: 'laugh', answer: ['크으, 용감하시네요! 짱구가 엄청 좋아할 거예요.', '제가 따라 하면 미선이가 창피하다고 문을 닫아요.'] },
        { say: '형만 씨는 출 줄 알아요?', tier: 'good', face: 'shy', answer: '…조금요. 회식 장기자랑 때 써먹었다가 부장님이 웃다 쓰러졌어요.' },
        { say: '저는 구경만 할게요', tier: 'meh', face: 'calm', answer: '그게 제일 안전해요. 한 번 보면 머릿속에서 안 떠나거든요.' },
      ],
    },
    {
      id: 'jjanga-baby',
      open: ['짱아가 처음 태어났을 때 얘기 해도 돼요? 병원 복도에서 저 혼자 울었어요.', '짱구는 옆에서 간호사 누나들한테 인사하고 다녔고요.'],
      replies: [
        { say: '듣고 싶어요', tier: 'great', remember: 'jjanga-baby', face: 'shy', answer: ['손가락이 이만했어요. 제 새끼손가락을 꼭 쥐더라고요.', '그날 대출 삼십이 년이 하나도 안 무서워졌어요.'] },
        { say: '짱구다운 첫 만남이네요', tier: 'good', face: 'laugh', answer: '하하, 그렇죠. 지금은 짱아가 짱구 머리끄덩이를 잡아요. 공평하죠.' },
        { say: '울긴 왜 울어요', tier: 'meh', face: 'sorry', answer: '…아빠가 되면 알게 돼요. 그날은 맥주 없이도 목이 메었어요.' },
      ],
    },
    {
      id: 'shiro-walk',
      open: ['흰둥이 산책은 원래 짱구 담당이에요. 원래는요.', '결국 새벽마다 제가 줄을 잡아요. {me} 님 강아지 좋아해요?'],
      replies: [
        { say: '같이 산책해요!', tier: 'great', remember: 'shiro-walk', answer: ['정말요? 흰둥이가 꼬리를 프로펠러처럼 돌릴 거예요.', '솜사탕처럼 작아서 줄을 놓치면 안 돼요. 금방 숨어요.'] },
        { say: '흰둥이 착하죠?', tier: 'good', face: 'smile', answer: '세상에서 제일 착해요. 밥을 깜빡해도 꼬리부터 흔들어요. 미안해지게요.' },
        { say: '짱구한테 시키세요', tier: 'meh', face: 'calm', answer: '시키죠. 그런데 짱구가 흰둥이를 산책시키는 건지, 반대인지 몰라요.' },
      ],
    },
    {
      id: 'hometown',
      open: ['저 시골 출신이에요. 논밭 사이로 기차가 하루 몇 번 지나가는 동네요.', '아버지는 아직도 농사지으세요. 짱구가 할아버지를 쏙 닮았어요.'],
      replies: [
        { say: '부모님 보고 싶겠어요', tier: 'great', remember: 'hometown', face: 'shy', answer: ['…가끔요. 어머니 된장국 냄새가 꿈에 나와요.', '명절엔 식구 다 데리고 내려가요. 차 안이 전쟁이지만요.'] },
        { say: '짱구가 닮았다고요?', tier:'good', face: 'laugh', answer: '예쁜 누나만 보면 헤벌쭉하는 거요. 그게 집안 내력이래요. 저는 아니에요!' },
        { say: '시골은 심심하잖아요', tier: 'meh', face: 'think', answer: '어릴 땐 저도 그랬어요. 그래서 도시로 나왔는데, 결국 마을로 왔네요.' },
      ],
    },
    {
      id: 'fight-judge',
      open: ['어제 미선이랑 또 티격태격했어요. 제가 양말을 뒤집어 벗어 놨대요.', '{me} 님이 판정 좀 해 주세요. 양말은 뒤집어도 양말이잖아요?'],
      replies: [
        { say: '미선 씨 편이에요', tier: 'great', remember: 'fight-judge', face: 'sorry', answer: ['…역시 그렇죠. 저도 알아요. 오늘은 제가 빨래 갤게요.', '그래도 {me} 님이 심판이면 마음이 놓여요. 공정하니까요.'] },
        { say: '둘 다 귀여워요', tier: 'good', face: 'shy', answer: '귀, 귀엽다니요. 마흔 바라보는 아저씨한테… 그래도 기분은 좋네요.' },
        { say: '형만 씨가 맞아요', tier: 'meh', face: 'wow', answer: '쉿! 그 말 미선이가 들으면 우리 둘 다 꿀밤이에요.' },
      ],
    },
    {
      id: 'how-met',
      open: '미선이랑 처음 만난 얘기 해 드릴까요? 비 오는 날, 우산 하나에서 시작됐어요.',
      replies: [
        { say: '로맨틱하네요, 들려줘요', tier: 'great', remember: 'how-met', face: 'shy', answer: ['제가 우산을 씌워 줬어요. 반쯤 젖으면서요.', '나중에 들으니 미선이는 우산이 있었대요. 그냥 받아 준 거래요.'] },
        { say: '미선 씨 얘기도 듣고 싶어요', tier: 'good', face: 'laugh', answer: '미선이 버전은 제가 넘어지는 장면부터 시작해요. 그건 편집됐어요.' },
        { say: '우산이 없었어요?', tier: 'meh', face: 'calm', answer: '있었어요. 하나밖에 없어서 일부러 같이 쓴 거예요. 영업 감각이죠.' },
      ],
    },
    {
      id: 'action-mask',
      open: ['짱구가 액션가면 놀이를 하재요. 저는 매번 악당 역이에요.', '오늘 저녁에도 "아빠 악당, 각오해!" 하겠죠. 허리가 벌써 아파요.'],
      replies: [
        { say: '제가 악당 해 줄게요', tier: 'great', remember: 'action-mask', face: 'laugh', answer: ['정말요? 짱구가 신나서 망토 두 개 꺼낼 거예요.', '대신 액션 빔 맞으면 꼭 쓰러져 줘야 해요. 규칙이에요.'] },
        { say: '악당도 멋있잖아요', tier: 'good', face: 'shy', answer: '그렇죠? 저 쓰러지는 연기는 거의 배우급이에요. 영업으로 단련했죠.' },
        { say: '이번엔 이기세요', tier: 'meh', face: 'sorry', answer: '이기면 짱구가 울어요. 그럼 미선이가 저를 쓰러뜨려요. 결국 져요.' },
      ],
    },
    {
      id: 'dad-cook',
      open: '일요일엔 제가 부엌을 맡아요. 형만표 볶음밥, 동네 최고라고 자부해요.',
      replies: [
        { say: '언제 먹어 보고 싶어요', tier: 'great', remember: 'dad-cook', face: 'laugh', answer: ['크으, 그 말 기다렸어요! 비법은 센 불이랑 아빠의 사랑이에요.', '…그리고 미선이가 몰래 넣는 간장 한 숟가락이요.'] },
        { say: '설거지는 누가 해요?', tier: 'good', face: 'sorry', answer: '…그게 문제예요. 볶음밥 하나에 프라이팬이 세 개 나와요.' },
        { say: '미선 씨가 더 잘하죠?', tier: 'meh', face: 'calm', answer: '그건 사실이에요. 그래도 일요일엔 제 볶음밥이 이겨요. 짱구 판정이에요.' },
      ],
    },
    {
      id: 'hair-worry',
      open: ['{me} 님, 제 정수리 좀 봐 줄래요? 짱구가 요즘 반짝인다고 해서요.', '아, 너무 자세히는 보지 말고요.'],
      replies: [
        { say: '아직 풍성해요', tier: 'great', remember: 'hair-worry', face: 'shy', answer: '그렇죠? 그렇죠! 역시 {me} 님은 정직해요. 오늘 하루 살았어요.' },
        { say: '스트레스 때문일 거예요', tier: 'good', face: 'think', answer: '맞아요. 월요일, 대출, 용돈 협상. 머리카락이 버틸 수가 없죠.' },
        { say: '조금 반짝이긴 해요', tier: 'meh', face: 'sorry', answer: '아… 조명 탓이에요. 부동산 조명이 밝아서요. 그런 거예요.' },
      ],
    },
    {
      id: 'boss-story',
      open: '옛 회사 부장님이 아직도 연락하세요. 계장, 요즘도 발로 뛰나, 하고요.',
      replies: [
        { say: '좋은 상사였나 봐요', tier: 'great', remember: 'boss-story', face: 'smile', answer: ['무서웠죠. 그래도 제 첫 계약 날 우동을 사 주셨어요.', '그 우동 맛으로 십 년을 버텼어요.'] },
        { say: '발로 뛰냐는 게 무슨 뜻…', tier: 'good', face: 'wow', answer: '영업 얘기예요! 영업! 발 냄새랑은 아무 상관 없어요!' },
        { say: '회사가 그립지 않아요?', tier: 'meh', face: 'think', answer: '동기들은 그립죠. 만원 버스는 하나도 안 그리워요.' },
      ],
    },
    {
      id: 'sunday-out',
      open: ['이번 일요일엔 식구 다 같이 나들이 가려고요. 도시락 싸서 언덕 위로요.', '짱구는 벌써 배낭에 초코비만 넣었어요.'],
      replies: [
        { say: '좋은 하루 보내세요!', tier: 'great', remember: 'sunday-out', answer: ['고마워요! 사진 많이 찍어 올게요. {me} 님한테 보여 드려야지.', '흰둥이도 데려가요. 걔가 제일 신나요.'] },
        { say: '쉬는 날인데 피곤하겠어요', tier: 'good', face: 'think', answer: '피곤하죠. 그래도 애들 크는 건 기다려 주지 않으니까요.' },
        { say: '그냥 집에서 쉬세요', tier: 'meh', face: 'calm', answer: '그러고 싶은데 짱구가 제 배 위에서 뛰어요. 쉴 수가 없어요.' },
      ],
    },
    {
      id: 'misun-diet',
      open: ['미선이가 또 다이어트를 시작했대요. 그런데 어젯밤에 부엌에서 소리가…', '찬장 문 여는 소리였어요. 저는 못 들은 척했어요.'],
      replies: [
        { say: '모른 척해 주는 게 사랑', tier: 'great', remember: 'misun-diet', face: 'laugh', answer: ['그렇죠! 저도 비상금을 숨기니까요. 서로 봐주는 거예요.', '{me} 님도 이건 비밀이에요. 부부의 평화가 걸렸어요.'] },
        { say: '같이 운동하세요', tier: 'good', face: 'sorry', answer: '해 봤어요. 사흘째에 둘 다 짱구한테 업혀서 왔어요. 비유적으로요.' },
        { say: '살 안 쪄 보이던데요', tier: 'meh', face: 'think', answer: '그 말 미선이한테 해 주세요. 저 말고요. 제가 하면 수상하대요.' },
      ],
    },
    {
      id: 'chocobi',
      open: '퇴근길에 초코비 사 오라는 짱구 심부름이 제일 어려워요. 꼭 액션가면 스티커 든 걸로요.',
      replies: [
        { say: '저도 같이 찾아볼게요', tier: 'great', remember: 'chocobi', answer: ['정말요? 시장 거리 가게를 다 뒤져야 해요. 영업보다 힘들어요.', '그래도 짱구가 스티커 보고 웃으면 다 잊혀요.'] },
        { say: '스티커 모으는 거군요', tier: 'good', face: 'smile', answer: '맞아요. 앨범이 벌써 두 권이에요. 저도 몰래 정리해 줘요.' },
        { say: '과자 너무 많이 먹어요', tier: 'meh', face: 'sorry', answer: '그래서 미선이가 하루 한 봉지로 정했어요. 그 한 봉지가 전쟁이에요.' },
      ],
    },
    {
      id: 'dream-old',
      open: '{me} 님은 어릴 때 꿈이 뭐였어요? 저는 야구 선수였어요. 상상이 안 되죠?',
      replies: [
        { say: '지금 꿈은 뭐예요?', tier: 'great', remember: 'dream-old', face: 'smile', answer: ['지금이요? …애들 다 클 때까지 건강하게 출근하는 거요.', '시시하죠? 그런데 이게 제일 어려운 꿈이더라고요.'] },
        { say: '잘 어울렸을 것 같아요', tier: 'good', face: 'shy', answer: '헤헤, 그렇죠? 동네 대회에서 홈런도 쳤어요. 딱 한 번이요.' },
        { say: '진짜 상상이 안 돼요', tier: 'meh', face: 'sorry', answer: '…솔직하시네요. 지금 이 배를 보면 저도 상상이 안 돼요.' },
      ],
    },
    {
      id: 'kindergarten',
      open: ['짱구 유치원 참관 수업에 다녀왔어요. 아빠들 다 넥타이 매고 왔더라고요.', '근데 짱구가 발표 시간에 제 발 냄새 얘기를 했어요.'],
      replies: [
        { say: '그래도 아빠 자랑이죠', tier: 'great', face: 'laugh', remember: 'jjanggu-fan', answer: ['그렇게 생각하기로 했어요. 끝에 "그래도 우리 아빠 최고"래요.', '그 한마디에 다 용서했어요. 냄새는 사실무근이고요.'] },
        { say: '다른 부모님 반응은요?', tier: 'good', face: 'sorry', answer: '다들 웃었죠. 제일 크게 웃은 건 미선이였어요. 집에서 따질 거예요.' },
        { say: '진짜 냄새나요?', tier: 'meh', face: 'wow', answer: '안 나요! 하나도! 자, 오늘 날씨 얘기나 하죠!' },
      ],
    },
    {
      id: 'muzan-debate',
      open: '증권 지점장 무잔 씨가 또 주식이 최고래요. {me} 님은 땅이에요, 주식이에요?',
      replies: [
        { say: '땅은 도망 안 가죠', tier: 'great', answer: '그렇죠! 땅 위에 집 짓고, 집 안에 식구가 웃어요. 주식은 웃지 않아요.' },
        { say: '둘 다 조금씩이요', tier: 'good', face: 'think', answer: '분산 투자군요. 미선이가 들으면 박수 칠 대답이에요.' },
        { say: '주식이 더 재밌던데요', tier: 'meh', face: 'sorry', answer: '아이고… 그 말은 무잔 씨 앞에선 하지 마요. 저 오늘 밤 또 져요.' },
      ],
    },
    {
      id: 'carpenter-chair',
      open: '발키리 씨한테 사무실 의자 고쳐 달랬더니, 의자를 새로 짜 왔어요. 청구서랑 같이요.',
      replies: [
        { say: '튼튼해 보여요', tier: 'great', face: 'laugh', answer: ['튼튼해요. 짱구가 그 위에서 엉덩이 춤을 춰도 끄떡없어요.', '청구서만 좀 덜 튼튼했으면 좋겠어요.'] },
        { say: '공사비 깎아 보셨어요?', tier: 'good', face: 'sorry', answer: '깎으려다 도끼 가는 소리를 듣고 그냥 도장 찍었어요.' },
        { say: '그냥 고치지 그랬대요?', tier: 'meh', face: 'calm', answer: '"고칠 가치도 없다"래요. 제 옛 의자가 좀 불쌍했어요.' },
      ],
    },
    {
      id: 'commute-walk',
      open: '회사 다닐 땐 만원 버스에 매달려 다녔어요. 이 마을에선 걸어서 출근해요.',
      replies: [
        { say: '출근길이 즐겁겠어요', tier: 'great', face: 'smile', answer: ['즐거워요. 아침마다 빵 냄새, 바다 냄새, 흙냄새가 나요.', '버스에선 남의 겨드랑이 냄새만 났거든요. 제 냄새는 아니고요.'] },
        { say: '버스가 그립진 않아요?', tier: 'good', face: 'laugh', answer: '하나도요. 넥타이가 문에 끼던 날을 생각하면 아직도 목이 조여요.' },
        { say: '걷는 거 귀찮잖아요', tier: 'meh', face: 'think', answer: '귀찮죠. 그래도 이 배를 위해서라도 걸어야 해요.' },
      ],
    },
    {
      id: 'kids-photo',
      when: { ch: 2 },
      open: '{me} 님, 지갑 속 사진 보실래요? 우리 식구예요. 흰둥이까지 다 있어요.',
      replies: [
        { say: '다들 웃는 얼굴이네요', tier: 'great', remember: 'family-first', face: 'shy', answer: '그렇죠? 이 사진 보면 대출 삼십이 년도 거뜬해요.' },
        { say: '미선 씨가 제일 예뻐요', tier: 'good', face: 'laugh', answer: '하하, 그 말 미선이한테 꼭 전할게요. 오늘 반찬이 늘겠어요.' },
        { say: '짱구가 흔들렸어요', tier: 'meh', answer: '찍는 순간 엉덩이를 흔들어서요. 그것도 우리 집다운 거예요.' },
      ],
    },
    {
      id: 'squid-again',
      when: { ch: 3 },
      open: '그날 같이 구운 오징어 생각이 나요. 짱구가 냄새 맡고 뛰어나와서 다리 다 먹었잖아요.',
      replies: [
        { say: '다음엔 두 마리 구워요', tier: 'great', face: 'laugh', answer: '좋아요! 하나는 짱구 몫, 하나는 우리 몫. 미선이 몫은… 세 마리요.' },
        { say: '짱구가 빨랐죠', tier: 'good', face: 'smile', answer: '먹는 거 앞에선 액션가면보다 빨라요. 그건 저 닮았어요.' },
        { say: '저는 몸통이 좋아요', tier: 'meh', answer: '다행이에요. 우리 집에선 몸통이 늘 남거든요.' },
      ],
    },
    {
      id: 'new-photo',
      when: { ch: 4 },
      open: '지갑 사진 새로 찍었어요. 이번엔 짱아가 카메라를 보고 웃었어요. 기적이에요.',
      replies: [
        { say: '저도 보여 주세요!', tier: 'great', face: 'shy', answer: ['여기요. 짱구는 또 엉덩이를 내밀었고요. 이건 포기했어요.', '이 사진은 낡을 때까지 볼 거예요. {me} 님 덕분에 찍었어요.'] },
        { say: '흰둥이는요?', tier: 'good', face: 'laugh', answer: '짱구 품에 안겨서 눈을 감았어요. 걔도 사진은 싫은가 봐요.' },
        { say: '옛날 사진은 버렸어요?', tier: 'meh', face: 'sorry', answer: '절대 안 버려요. 두 장 다 넣었어요. 지갑이 좀 두꺼워졌죠.' },
      ],
    },
    {
      id: 'house-key',
      when: { ch: 5 },
      open: ['미선이가 이걸 {me} 님 드리래요. 우리 집 대문 열쇠 모양 열쇠고리예요.', '식구한테는 열쇠가 있어야 한대요. 진짜 열쇠는… 대출 끝나면요.'],
      replies: [
        { say: '소중히 할게요', tier: 'great', face: 'shy', answer: '크으… 이거 고르느라 미선이가 시장을 세 바퀴 돌았대요. 세일가로요.' },
        { say: '짱구가 안 뺏어 갈까요?', tier: 'good', face: 'laugh', answer: '짱구 것도 따로 샀대요. 액션가면 열쇠고리로요. 다 계산된 거예요.' },
        { say: '열쇠고리만이요?', tier: 'meh', face: 'calm', answer: '하하, 진짜 열쇠는 삼십이 년 뒤에요. 그때까지 같이 늙어요.' },
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
        { say: '우산 빌려 드릴까요?', tier: 'good', answer: ['고마워요. 미선이가 챙겨 줬는데 또 사무실에 놓고 왔어요.', '짱구는 장화 신고 웅덩이마다 뛰어들 거예요. 빨래는 미선이 몫이고요.'] },
        { say: '양말은 갈아 신으세요', tier: 'meh', face: 'wow', answer: '왜, 왜요? 아무 일 없어요. 자, 상담 하시죠!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 와요! 집 앞 눈 치우는 건 제 담당이에요. 허리가 벌써 아파요.',
      replies: [
        { say: '같이 치워 드릴게요', tier: 'great', answer: ['정말요? 끝나면 어묵 국물 대접할게요. 비상금으로요.', '짱구는 치운 자리마다 눈사람을 세워요. 일이 두 배예요.'] },
        { say: '눈 덮인 마을 예뻐요', tier: 'good', answer: '그렇죠. 눈 오면 집집이 다 비싸 보여요. 직업병이에요.' },
        { say: '그냥 두면 녹아요', tier: 'meh', face: 'sorry', answer: '그러면 미선이가 녹지 않아요. 치워야 해요.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '날씨 좋네요! 이런 날엔 미선이가 이불을 다 널어요. 저는 이불 터는 담당이고요.',
      replies: [
        { say: '이불 냄새 좋겠어요', tier: 'great', answer: ['햇볕 냄새죠. 짱구가 그 위에서 뒹굴어서 다시 털어야 하지만요.', '그래도 그날 밤은 다들 푹 자요.'] },
        { say: '남향집이 빛나겠네요', tier: 'good', face: 'laugh', answer: '역시 뭘 아세요! 오늘 같은 날 집 보러 오시면 계약률이 높아요.' },
        { say: '더워서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 그늘진 북향 방도 있어요. 여름엔 그게 효자예요.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날은 왠지 월요일 같아요. 넥타이가 평소보다 무거워요.',
      replies: [
        { say: '커피 한 잔 하실래요?', tier: 'great', face: 'smile', answer: '오, 좋죠! 흐린 날 커피는 맑은 날 맥주랑 맞먹어요.' },
        { say: '오늘은 손님 없겠어요', tier: 'good', face: 'think', answer: '그런 날 꼭 큰 손님이 와요. 영업 이십 년 감이에요. 아니, 십 년이요.' },
        { say: '비라도 오면 좋겠네요', tier: 'meh', face: 'sorry', answer: '아이고, 우산 놓고 왔어요. 미선이한테 또 한 소리 듣겠네요.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이에요. 이사철이라 부동산이 제일 바빠요. 그래도 벚꽃은 봐야죠.',
      replies: [
        { say: '가족 꽃놀이 가세요', tier: 'great', answer: ['갈 거예요! 짱구는 꽃보다 노점이고, 짱아는 꽃잎 먹으려 해요.', '저는 돗자리에서 맥주 한 캔이요. 그게 봄이에요.'] },
        { say: '바쁘면 좋은 거죠', tier: 'good', face: 'laugh', answer: '맞아요. 실적이 오르면 용돈도… 아니, 그건 미선이 마음이에요.' },
        { say: '꽃가루 때문에 싫어요', tier: 'meh', face: 'sorry', answer: '저도요. 에취! 영업맨한텐 재채기도 실례예요.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '여름엔 넥타이가 고문이에요. 그래도 퇴근 맥주가 제일 맛있는 계절이죠.',
      replies: [
        { say: '시원하게 한잔해요', tier: 'great', answer: '크으! 그 말만 들어도 시원해요. 오늘은 딱 한 잔이에요. 아마도요.' },
        { say: '바닷가 가세요?', tier: 'good', answer: '네, 식구들이랑요. 짱구는 수영복 입고 또 엉덩이 춤을 추겠죠.' },
        { say: '넥타이 풀어요', tier: 'meh', face: 'sorry', answer: '풀면 마음까지 풀려서 안 돼요. 퇴근하면 풀게요.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이에요. 생선 굽는 냄새에 퇴근길 발걸음이 저절로 빨라져요.',
      replies: [
        { say: '시골 본가도 수확철이죠?', tier: 'great', face: 'smile', answer: ['맞아요. 아버지가 햅쌀 보내 주셨어요. 짱구가 포대를 끌어안고 잤어요.', '이번 주말엔 전화라도 드려야겠어요.'] },
        { say: '생선구이 좋죠', tier: 'good', answer: '그쵸! 미선이가 오늘 고등어 굽는대요. 맥주 한 캔 허락받았어요.' },
        { say: '가을은 쓸쓸해요', tier: 'meh', face: 'think', answer: '그럴 땐 따뜻한 집에 일찍 들어가요. 쓸쓸함은 밥 냄새에 약해요.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '겨울 보너스가 나왔어요. 정확히는, 나오자마자 미선이 손으로 갔어요.',
      replies: [
        { say: '가족 선물 사겠네요', tier: 'great', face: 'shy', answer: ['네. 짱구는 액션가면 장난감, 짱아는 반짝이는 거요.', '미선이 목도리도요. 제 몫은… 미선이가 알아서 해 주겠죠.'] },
        { say: '조금은 남았죠?', tier: 'good', face: 'laugh', answer: '맥주 몇 캔 값은요. 그게 겨울의 기적이에요.' },
        { say: '그건 너무하네요', tier: 'meh', face: 'calm', answer: '아니에요. 미선이가 쥐고 있어야 대출이 안 밀려요. 믿을 수 있어요.' },
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
      open: '하아암… 이른 아침이네요. 흰둥이 산책 나왔어요. 짱구는 아직 꿈나라고요.',
      replies: [
        { say: '커피 한 잔 드릴까요?', tier: 'great', answer: '오, 살았다! {me} 님은 천사예요. 이제 눈이 다 떠졌어요.' },
        { say: '흰둥이 귀엽네요', tier: 'good', face: 'smile', answer: '그렇죠? 이 시간엔 흰둥이랑 저, 둘만의 출근 전 회의예요.' },
        { say: '더 주무시지 그래요', tier: 'meh', face: 'calm', answer: '그러고 싶은데 대출이 안 자요. 하하.' },
      ],
    },
    {
      id: 'op-day',
      when: { time: 'day' },
      open: '점심 먹고 나니 졸려요. 미선이 도시락이 너무 든든해서요. 아니, 상담은 말짱해요!',
      replies: [
        { say: '오늘 반찬은 뭐였어요?', tier: 'great', remember: 'lunchbox', answer: ['계란말이에 문어 소시지요. 밥 위엔 김으로 "힘내"라고 써 있었어요.', '짱구가 쓴 거래요. 글씨가 엉덩이 모양이었어요.'] },
        { say: '잠깐 눈 붙이세요', tier: 'good', face: 'shy', answer: '오 분만요. 손님 오시면 깨워 주세요. 계장의 명예를 걸고 벌떡 일어날게요.' },
        { say: '침 흘리셨어요', tier: 'meh', face: 'wow', answer: '네? 어, 어디요? 아, 이건 땀이에요. 땀!' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '늦었네요. 이 시간이면 짱구랑 짱아는 자고, 미선이는 드라마 보고 있겠죠.',
      replies: [
        { say: '얼른 들어가세요', tier: 'great', face: 'smile', answer: ['그래야죠. 자는 얼굴 보는 게 하루의 마지막 결재예요.', '짱구는 꼭 배를 내놓고 자요. 이불 덮어 주는 게 제 일이에요.'] },
        { say: '한 잔만 더 할까요?', tier: 'good', face: 'think', answer: '…딱 한 잔이요. 진짜로. 미선이 드라마 끝나기 전에요.' },
        { say: '밤이 길겠네요', tier: 'meh', face: 'sorry', answer: '아뇨, 누우면 바로 기절해요. 아침이 순식간에 와요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날이에요! 오늘은 미선이가 용돈을 조금 더 줬어요. 일 년에 몇 번 없는 날이에요.',
      replies: [
        { say: '오늘은 신나게 놀아요!', tier: 'great', answer: ['그럼요! 오늘은 땅값 얘기 안 해요.', '짱구 손 놓치면 끝이에요. 예쁜 누나 따라가거든요.'] },
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
      id: 'op-squid',
      when: { fish: ['squid', 'mackerel'] },
      open: '{fish}! {me} 님, 그거 우리 집 저녁 메뉴 일등이에요. 짱구도 환장해요.',
      replies: [
        { say: '가족분들이랑 드세요', tier: 'great', face: 'shy', answer: ['정말요? 미선이가 오늘 반찬 걱정 덜었다고 춤추겠어요.', '짱구 엉덩이 춤 말고, 진짜 기뻐서 추는 춤이요.'] },
        { say: '굽는 법 알려 주세요', tier: 'good', answer: '소금 살짝, 센 불, 그리고 맥주 한 캔을 옆에 두는 거예요. 마지막이 중요해요.' },
        { say: '팔아서 대출 갚을래요', tier: 'meh', face: 'laugh', answer: '하하, 저보다 현실적이시네요. 시장 값 잘 쳐줄 거예요.' },
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
      open: '{me} 님 손에 흙이 묻었네요. 밭일하셨구나. 시골 아버지 생각나네요.',
      replies: [
        { say: '마당 있는 집이 좋아요', tier: 'great', answer: '역시! 텃밭 딸린 집, 다음 확장 때 꼭 보여 드릴게요.' },
        { say: '허리가 아파요', tier: 'good', answer: '저도요. 앉으세요. 의자 하나는 발키리 씨가 짜 준 거예요. 청구서는 비싸도 튼튼해요.' },
        { say: '흙 털고 올게요', tier: 'meh', face: 'calm', answer: '괜찮아요. 부동산 바닥은 흙 밟는 일이 일이에요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me} 님, 금별 작물이요? 와, 반짝반짝하네요. 우리 동네 땅값 오르겠어요.',
      replies: [
        { say: '땅이 좋아서 그래요', tier: 'great', answer: '그쵸! 제가 늘 말했잖아요. 좋은 땅은 사람을 알아봐요.' },
        { say: '짱아한테 보여 줄래요', tier: 'good', face: 'laugh', answer: '큰일 나요! 짱아는 반짝이는 거 보면 절대 안 놓아요. 미선이 닮았어요.' },
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
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님 얼굴이 환하네요! 무슨 좋은 일 있었어요? 계약 성사한 얼굴인데요.',
      replies: [
        { say: '그냥 기분이 좋아요', tier: 'great', face: 'laugh', answer: ['그게 제일 좋은 거예요. 이유 없는 좋은 날.', '짱구는 매일 그런 얼굴이에요. 부럽죠.'] },
        { say: '형만 씨 보니까요', tier: 'good', face: 'shy', answer: '헤헤, 영업 멘트는 제가 해야 하는데. 오늘은 제가 졌네요.' },
        { say: '비밀이에요', tier: 'meh', face: 'think', answer: '비밀이라… 비상금이라도 찾으셨어요? 저도 하나 찾고 싶네요.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me} 님, 오늘 생일이라면서요! 축하해요! 이건 제 비상금으로 산 거예요.',
      replies: [
        { say: '비상금을요? 감동이에요', tier: 'great', face: 'shy', answer: ['쉿, 미선이한텐 비밀이에요. 친구 생일엔 비상금이 출동해요.', '짱구가 축하 엉덩이 춤도 준비했대요. 피할 수 없어요.'] },
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
      id: 'op-news-bday',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 분이 있대요. 우리 집은 생일마다 미선이가 케이크를 구워요.',
      replies: [
        { say: '형만 씨 생일엔요?', tier: 'great', face: 'shy', answer: ['제 생일엔 짱구가 어깨를 주물러 줘요. 한 번에 초코비 한 봉지예요.', '유료지만 세상에서 제일 시원해요.'] },
        { say: '케이크 맛있겠어요', tier: 'good', answer: '모양은 좀 기울어요. 맛은 일등이에요. 이건 진짜예요.' },
        { say: '생일 챙기기 귀찮아요', tier: 'meh', face: 'think', answer: '그래도 챙겨요. 나중엔 그 하루하루가 다 사진이 돼요.' },
      ],
    },
    {
      id: 'op-friend-wedding',
      when: { friendNews: 'wedding' },
      open: '{me} 님 친구분이 결혼하셨다면서요? 축하 전해 주세요. 결혼은 좋은 거예요.',
      replies: [
        { say: '결혼 선배 조언 있어요?', tier: 'great', answer: ['양말은 뒤집지 말고 벗기. 용돈은 협상 말고 감사하기.', '그리고 아무 날도 아닌 날에 꽃 사 가기. 이건 제가 아직 연습 중이에요.'] },
        { say: '부럽기도 해요', tier: 'good', face: 'smile', answer: '{me} 님 차례도 와요. 그때 신혼집은 제가 무료 상담이에요.' },
        { say: '결혼 힘들지 않아요?', tier: 'meh', face: 'think', answer: '힘들죠. 근데 퇴근길에 불 켜진 창을 보면 다 괜찮아져요.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마을 기록이 새로 나왔대요! 저도 계장 시절엔 기록 제조기였는데요.',
      replies: [
        { say: '무슨 기록이었어요?', tier: 'great', face: 'laugh', answer: ['분기 계약 일등, 그리고 회식 노래방 최장 시간이요.', '두 번째는 미선이가 모르는 기록이에요.'] },
        { say: '지금도 기록 세우세요', tier: 'good', answer: '지금은 대출 무연체 기록이요. 이게 제일 자랑스러워요.' },
        { say: '옛날 얘기네요', tier: 'meh', face: 'sorry', answer: '…맞아요. 그래도 왕년이 있어야 오늘도 버티죠.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '{me} 님, 주식 좀 떨어졌다면서요? 그래서 제가 늘 땅이라고 했잖아요.',
      replies: [
        { say: '땅 상담 받으러 왔어요', tier: 'great', face: 'laugh', answer: '크으! 오늘 실적 하나 올리는 소리가 들려요. 앉으세요, 커피 드릴게요.' },
        { say: '다시 오를 거예요', tier: 'good', face: 'think', answer: '그 낙관, 무잔 씨가 좋아하겠네요. 저는 그래도 땅에 한 표예요.' },
        { say: '위로가 안 돼요', tier: 'meh', face: 'sorry', answer: '아, 죄송해요. 영업 버릇이에요. 오늘 맥주는 제가 살게요.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '주식으로 재미 보셨다면서요? 무잔 씨가 오늘 밤 주점에서 엄청 자랑하겠네요.',
      replies: [
        { say: '그 돈으로 집 넓힐래요', tier: 'great', answer: '역시! 번 돈은 땅에 묻어야 안전해요. 그게 제 영업 철학이에요.' },
        { say: '운이 좋았어요', tier: 'good', face: 'smile', answer: '겸손하시네요. 저는 오르면 일주일 내내 자랑해요. 미선이한테 혼나요.' },
        { say: '형만 씨도 해 보세요', tier: 'meh', face: 'sorry', answer: '제 용돈으로요? 한 주 사면 맥주를 한 달 끊어야 해요.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '{me} 님, 혹시 어제 카지노에서… 아니, 표정 보니 알겠어요.',
      replies: [
        { say: '다신 안 갈래요', tier: 'great', face: 'smile', answer: ['그게 영업 일등의 조언이에요. 확실한 건 월급날뿐이에요.', '대신 오늘 저녁은 집밥 드세요. 마음이 채워져요.'] },
        { say: '본전만 찾으면 돼요', tier: 'good', face: 'think', answer: '계장 시절 동기도 그 말 하다가 시계를 잃었어요. 조심해요.' },
        { say: '미선 씨한텐 비밀이에요', tier: 'meh', face: 'sorry', answer: '저보다 비밀이 무거우시네요. 알겠어요, 우리 둘만 알아요.' },
      ],
    },
    {
      id: 'op-misun',
      when: { bond: 'misun' },
      open: '{me} 님, 미선이 만났어요? 혹시 제 얘기 안 했어요? 맥주 얘기라든가.',
      replies: [
        { say: '형만 씨 칭찬하던데요', tier: 'great', face: 'shy', answer: '정말요? 헤헤… 오늘은 일찍 들어가야겠어요. 미선이 좋아하는 푸딩이라도 사 갈까요.' },
        { say: '용돈 얘기 하던데요', tier: 'good', face: 'sorry', answer: '아이고, 동결이래요, 인상이래요? 아니, 듣지 않을래요.' },
        { say: '모르는 척할게요', tier: 'meh', answer: '현명하세요. 부부 일엔 모르는 게 약이에요.' },
      ],
    },
    {
      id: 'op-with-misun',
      when: { with: 'misun' },
      open: ['아, {me} 님! 지금 미선이랑 장부 맞추는 중이에요.', '제가 계산기를 두드리면 미선이가 다시 두드려요. 믿음의 문제래요.'],
      replies: [
        { say: '두 분 잘 어울려요', tier: 'great', face: 'shy', answer: ['헤헤… 들었지, 여보? 아, 지금 째려보네요. 일하라는 뜻이에요.', '그래도 입꼬리는 올라갔어요. 제가 이십 년… 아니, 오래 봐서 알아요.'] },
        { say: '누가 맞았어요?', tier: 'good', face: 'sorry', answer: '…미선이요. 늘 미선이요. 저는 숫자 하나를 빼먹었어요.' },
        { say: '부부싸움 중이에요?', tier: 'meh', face: 'wow', answer: '아니에요! 회의예요, 회의! 목소리가 좀 클 뿐이에요.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '발키리 씨 공방 다녀오셨어요? 이번 확장 공사비, 혹시 깎아 준대요?',
      replies: [
        { say: '마감이 최고라던데요', tier: 'great', answer: '그건 인정이에요. 발키리 씨 일은 삼십 년 가요. 우리 대출처럼요.' },
        { say: '한 푼도 안 깎는대요', tier: 'good', face: 'sorry', answer: '역시… 계장 시절 협상 실력도 거기선 안 통해요. 미선이나 보내야겠어요.' },
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
      id: 'op-with-captain',
      when: { with: 'captain' },
      open: '{me} 님, 이리 와요! {other} 선장님이 바다 얘기 중이에요. 저는 육지 대표고요.',
      replies: [
        { say: '저도 끼워 주세요', tier: 'great', face: 'laugh', answer: ['물론이죠! 선장님은 바다, 저는 대출 얘기예요. 둘 다 끝이 안 보여요.', '오징어 한 접시 더 시킬게요. 오늘은 제가 쏠게요. 반만요.'] },
        { say: '바다 집은 어때요?', tier: 'good', face: 'think', answer: '선장님은 배가 집이래요. 중개인으로선 수수료를 못 받는 집이죠.' },
        { say: '집에 안 가세요?', tier: 'meh', face: 'sorry', answer: '갈 거예요… 이 잔만 비우고요. 진짜예요. 선장님, 증인 서 주세요.' },
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
    {
      id: 'op-with-muzan',
      when: { with: 'muzan' },
      open: ['{me} 님, 마침 잘 왔어요. {other} 씨랑 또 붙었어요.', '땅이냐 주식이냐, 오늘은 결판을 내야 해요. 판정해 주세요!'],
      replies: [
        { say: '가족 사는 집이 이겨요', tier: 'great', face: 'laugh', answer: ['들었죠? 식구가 웃는 집은 차트가 못 이겨요!', '…저 표정 보세요. 오늘 밤 계산은 제가 해야겠네요.'] },
        { say: '오늘은 무승부예요', tier: 'good', face: 'think', answer: '무승부면 각자 계산이에요. 제 용돈이 살았네요.' },
        { say: '주식이 이겼어요', tier: 'meh', face: 'sorry', answer: '아이고… 미선이한텐 말하지 마요. 그 사람도 요즘 차트를 봐요.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '{me} 님, 오늘 {other} 씨랑 좀 서먹하다면서요. 저도 미선이랑 그럴 때 있어요.',
      replies: [
        { say: '어떻게 화해해요?', tier: 'great', face: 'smile', answer: ['저는 먼저 미안하다고 해요. 이기는 것보다 저녁 같이 먹는 게 나아요.', '그리고 푸딩 하나. 그게 우리 집 화해 계약서예요.'] },
        { say: '제가 잘못한 건 없어요', tier: 'good', face: 'think', answer: '그럴 수 있죠. 그래도 내일 웃으며 인사 한 번 해 봐요. 영업 비법이에요.' },
        { say: '그냥 두면 풀려요', tier: 'meh', face: 'calm', answer: '그것도 방법이에요. 저도 다음 날 아침 미선이 된장국으로 풀려요.' },
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
        { say: '한 마디도 안 했어요', tier: 'great', answer: ['믿었어요! 친구 계약은 평생 유효해요. 장소만 옮기면 돼요.', '이번엔 흰둥이 집 지붕 밑이에요. 아, 또 말해 버렸네.'] },
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
      id: 'cb-foot',
      when: { mem: 'foot-fine' },
      use: 'foot-fine',
      open: ['{me} 님, 우리 발 얘기 안 하기로 했죠? 그런데 오늘은 제가 먼저 할게요.', '흰둥이가 제 양말을 물고 가서 마당에 묻었어요.'],
      replies: [
        { say: '보물인 줄 알았나 봐요', tier: 'great', face: 'laugh', answer: '그렇죠! 보물이요! 냄새 때문이 아니라 보물이라서요. 고마워요, {me} 님.' },
        { say: '그 얘긴 안 하기로…', tier: 'good', face: 'sorry', answer: '아, 맞다. 방금 건 없던 걸로 해요. 계약 위반이에요, 제가.' },
        { say: '흰둥이가 현명하네요', tier: 'meh', face: 'wow', answer: '{me} 님! 그게 무슨 뜻이에요! 아니, 대답하지 마요!' },
      ],
    },
    {
      id: 'cb-tie',
      when: { mem: 'tie-pick' },
      use: 'tie-pick',
      open: '{me} 님이 골라 준 넥타이 매고 나간 날, 계약 두 건 했어요. 이제 행운의 넥타이예요.',
      replies: [
        { say: '다음엔 세 건이에요', tier: 'great', face: 'laugh', answer: '크으, 목표 상향! 미선이가 그 넥타이만 따로 다려 줬어요.' },
        { say: '실력이죠', tier: 'good', face: 'shy', answer: '헤헤, 실력 반 넥타이 반이요. 짱구는 그걸로 줄넘기하려다 혼났어요.' },
      ],
    },
    {
      id: 'cb-house',
      when: { mem: 'big-house' },
      use: 'big-house',
      open: '다 같이 모이는 넓은 집이 꿈이라고 했죠? 거실 넓은 도면 그려 왔어요. 제 손으로요.',
      replies: [
        { say: '와, 직접 그렸어요?', tier: 'great', face: 'shy', answer: ['네. 여기 소파, 여기 밥상, 여기는… 짱구 엉덩이 춤 무대요.', '아, 그건 우리 집 도면이랑 섞였네요. 지울게요.'] },
        { say: '언젠가 꼭 살게요', tier: 'good', answer: '그날 계약서는 제가 쓸게요. 수수료는 맥주 한 잔이요.' },
      ],
    },
    {
      id: 'cb-monday',
      when: { mem: 'monday-blues' },
      use: 'monday-blues',
      open: '월요일 아침이 제일 힘들다고 했죠? 그래서 준비했어요. 월요일 생존 비법이요.',
      replies: [
        { say: '알려 주세요!', tier: 'great', answer: ['일요일 밤에 구두를 미리 닦아 둬요. 그리고 퇴근 맥주를 상상해요.', '마지막으로, 문 앞에서 식구들 얼굴 한 번씩 보기. 이게 제일 세요.'] },
        { say: '월요일은 그냥 힘들어요', tier: 'good', face: 'sorry', answer: '…맞아요. 비법이 있어도 힘들어요. 그러니까 같이 힘들어해요.' },
      ],
    },
    {
      id: 'cb-jjanggu',
      when: { mem: 'jjanggu-fan' },
      use: 'jjanggu-fan',
      open: '{me} 님, 짱구가 {me} 님 얘기를 해요. 우리 아빠 친구는 웃음소리가 좋대요.',
      replies: [
        { say: '짱구 보고 싶어요', tier: 'great', face: 'laugh', answer: ['다음에 데려올게요. 대신 예쁜 누나 있으면 줄행랑치니 조심해요.', '인사할 때 엉덩이 내밀어도 놀라지 마요. 반갑다는 뜻이에요.'] },
        { say: '짱구가 그런 말을요?', tier: 'good', face: 'shy', answer: '네. 저한테는 그런 칭찬 안 해 줘요. 조금 질투나요.' },
      ],
    },
    {
      id: 'cb-butt',
      when: { mem: 'butt-dance' },
      use: 'butt-dance',
      open: '엉덩이 춤 연습은 하셨어요? 짱구가 검사하겠대요. 사부님이라 엄격해요.',
      replies: [
        { say: '씰룩씰룩, 이렇게요?', tier: 'great', face: 'laugh', answer: ['크하하! 합격이에요! 짱구가 보면 이 단 띠 준다고 할 거예요.', '…저는 따라 하다가 허리 삐었어요. 비밀이에요.'] },
        { say: '아직 부끄러워요', tier: 'good', face: 'smile', answer: '처음엔 다 그래요. 저도 회식 때 술 한 잔 마시고서야 됐어요.' },
      ],
    },
    {
      id: 'cb-jjanga',
      when: { mem: 'jjanga-baby' },
      use: 'jjanga-baby',
      open: '짱아 아기 때 얘기 들어 주셨잖아요. 오늘 짱아가 처음으로 "아빠" 비슷한 말을 했어요!',
      replies: [
        { say: '축하해요, 아빠!', tier: 'great', face: 'shy', answer: ['크으… 미선이는 "아바바"였다고 하는데, 제 귀엔 아빠였어요.', '오늘 맥주는 축하주예요. 딱 한 잔이요.'] },
        { say: '진짜 아빠였어요?', tier: 'good', face: 'think', answer: '…반짝이는 숟가락 보고 한 말일 수도 있어요. 그래도 아빠로 할래요.' },
      ],
    },
    {
      id: 'cb-shiro',
      when: { mem: 'shiro-walk' },
      use: 'shiro-walk',
      open: '흰둥이 산책 같이 하기로 했죠? 오늘 새벽에 {me} 님 집 쪽으로 돌았어요. 꼬리 엄청 흔들더라고요.',
      replies: [
        { say: '다음엔 저도 나갈게요', tier: 'great', answer: '좋아요! 흰둥이는 솜사탕처럼 작으니까 발밑 조심해요. 금방 숨어요.' },
        { say: '새벽은 좀 힘들어요', tier: 'good', face: 'laugh', answer: '하하, 그럼 저녁 산책으로 해요. 저도 사실 새벽은 힘들어요.' },
      ],
    },
    {
      id: 'cb-hometown',
      when: { mem: 'hometown' },
      use: 'hometown',
      open: '시골 아버지가 소포를 보내셨어요. 감자랑 쌀이랑, 손글씨 편지 한 장이요.',
      replies: [
        { say: '뭐라고 쓰셨어요?', tier: 'great', face: 'shy', answer: ['"밥 잘 먹고 다녀라. 손주 보러 갈게." 딱 두 줄이요.', '…두 줄인데 계약서보다 오래 읽었어요.'] },
        { say: '감자 맛있겠어요', tier: 'good', face: 'laugh', answer: '감자전 부치면 {me} 님 부를게요. 미선이 감자전이 일품이거든요.' },
      ],
    },
    {
      id: 'cb-fight',
      when: { mem: 'fight-judge' },
      use: 'fight-judge',
      open: '심판님, 판결 이후로 양말 뒤집어 벗은 적 없어요. 이레 연속 무사고예요!',
      replies: [
        { say: '대단해요, 계속 가요!', tier: 'great', face: 'laugh', answer: '크으! 미선이가 어제 제 맥주 옆에 안주를 하나 더 놨어요. 포상이래요.' },
        { say: '이레는 짧은데요', tier: 'good', face: 'sorry', answer: '저한텐 기록이에요. 영업 일등만큼 자랑스러워요.' },
      ],
    },
    {
      id: 'cb-action',
      when: { mem: 'action-mask' },
      use: 'action-mask',
      open: '짱구가 {me} 님한테 악당 역 맡긴다는 거, 진짜로 기다리고 있어요. 망토도 빨아 놨어요.',
      replies: [
        { say: '각오해라, 액션가면!', tier: 'great', face: 'laugh', answer: ['오오, 연기 실력 좋은데요! 짱구가 들으면 바로 빔 쏴요.', '쓰러질 땐 천천히요. 그게 악당의 예의예요.'] },
        { say: '저는 착한 역 할래요', tier: 'good', face: 'think', answer: '그럼 제가 또 악당이네요. 괜찮아요. 아빠는 원래 악당 전문이에요.' },
      ],
    },
    {
      id: 'cb-cook',
      when: { mem: 'dad-cook' },
      use: 'dad-cook',
      open: '{me} 님, 형만표 볶음밥 드시기로 했잖아요. 오늘 도시락통에 하나 더 싸 왔어요.',
      replies: [
        { say: '와, 잘 먹을게요!', tier: 'great', face: 'shy', answer: ['센 불에 볶았어요. 아빠의 사랑은… 조금 덜 들어갔어요. 아침이 바빠서요.', '맛있으면 미선이한테 꼭 말해 줘요. 제 실적이에요.'] },
        { say: '간장 맛이 나요', tier: 'good', face: 'laugh', answer: '들켰네요. 미선이 비법 간장이에요. 공동 작품이에요.' },
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
        { say: '다 같이 모이면 충분해요', tier: 'great', face: 'smile', remember: 'bday-plan', answer: '그 말 미선이한테 전할게요. 짱구, 짱아, 흰둥이까지 다 데리고 갈게요.' },
        { say: '케이크 좋아요!', tier: 'good', remember: 'bday-plan', answer: '그럼 제일 큰 걸로요. 비상금이 조금 울겠지만 괜찮아요.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '저번에 {me} 님 방에 놀러 간 날 기억나요? 그날 얘기를 미선이한테 했더니 부러워하더라고요.',
      replies: [
        { say: '다음엔 미선 씨랑 같이 와요', tier: 'great', face: 'smile', remember: 'date-talk', answer: '좋아요! 부부 동반 집들이요. 짱구는… 맡길 데를 찾아볼게요.' },
        { say: '방 평가는 몇 점이에요?', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '점수는 비밀이고요, 채광은 일등이었어요. 중개인 보증이에요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '명함 한 장',
      hint: '한 번 이야기를 나누면 형만이 명함을 건네요.',
      need: { days: 1 },
      scene: [
        '범마을 부동산 카운터. 형만이 넥타이를 고쳐 매고 일어선다.',
        '"범마을 부동산 신형만입니다. 계장 시절 버릇이라 명함이 많아요."',
        '두 손으로 내민 명함 뒷면에 크레파스 낙서가 있다.',
        '엉덩이를 내민 졸라맨 같은 그림이다.',
        '"아, 그건… 우리 아들 짱구 작품이에요. 아빠 명함은 도화지래요."',
        '"한 장 더 드릴게요. 이건 깨끗한 거예요. 아마도요."',
        '"하나는 지갑에, 하나는 집에 두세요. 급할 때 찾기 쉽게요."',
        '"집 넓히실 때든, 그냥 수다 떨고 싶을 때든 들러 주세요."',
        '"월수금은 저, 화목은 아내 미선이가 있어요. 미선이가 더 깐깐해요."',
      ],
      replies: [
        { say: '낙서가 더 마음에 들어요', tier: 'great', face: 'laugh', answer: ['크으, 첫인사가 시원하네요! 짱구가 들으면 사인해 준대요.', '이건 좋은 거래의 시작이에요.'] },
        { say: '잘 부탁드려요', tier: 'good', face: 'smile', answer: '저야말로요. 동네 일은 뭐든 물어보세요. 시세부터 맛집까지요.' },
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
        '"{me} 님, 앉아요. 원래 혼자 앉는 자리인데 오늘은 둘이에요."',
        '"회사 다닐 땐 퇴근 후에도 부장님이랑 마셨거든요."',
        '"노래방 가서 부장님 십팔번 박수 치고, 막차 타고 들어갔죠."',
        '"현관문 열면 다들 자고 있었어요. 흰둥이만 꼬리를 흔들었고요."',
        '형만이 잔을 내려놓고 주머니에서 휴대 전화를 꺼낸다.',
        '"여보, 나 지금 친구랑 한 잔. 딱 한 잔. 진짜로."',
        '수화기 너머로 짱구 목소리가 들린다. "아빠 또 한 잔이래!"',
        '샹크스가 말없이 오징어 한 접시를 밀어 준다.',
        '"친구랑 마시는 건 처음 같아요. 이건 업무가 아니라서요."',
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
        '"실적표 앞에서 한숨 쉬다가도 이 냄새 맡으면 웃었죠."',
        '"그때는 이게 다 뭘 위한 건지 가끔 까먹었어요."',
        '어디선가 쿵쾅쿵쾅 발소리가 다가온다.',
        '"아빠! 오징어 냄새! 짱구 레이더에 걸렸다!"',
        '짱구가 다리 하나를 낚아채 엉덩이를 흔들며 달아난다.',
        '뒤따라온 흰둥이가 형만의 구두 냄새를 맡고 고개를 돌린다.',
        '"…흰둥이 저건 그냥 졸려서 그런 거예요. 진짜예요."',
        '형만이 웃으며 남은 다리를 반으로 찢어 건넨다.',
        '"봐요, 이거예요. 제가 버티는 이유가 저렇게 뛰어다녀요."',
      ],
      replies: [
        { say: '짱구 몫도 남겨요', tier: 'great', remember: 'squid-night', face: 'laugh', answer: '크으! 친구 좋다는 게 이거죠. 몸통은 우리, 다리는 짱구예요.' },
        { say: '동기들 보고 싶겠어요', tier: 'good', remember: 'squid-night', face: 'smile', answer: '가끔요. 그래도 지금은 {me} 님이랑 짱구가 있잖아요.' },
        { say: '흰둥이가 정직하네요', tier: 'meh', remember: 'squid-night', face: 'wow', answer: '오징어 냄새 때문이에요! 오징어요! 다른 냄새 아니에요!' },
      ],
    },
    {
      title: '지갑 속 사진',
      hint: '형만과 평소에 가족 이야기를 나눠 보세요. 가족이 먼저라고 하면 열려요.',
      need: { days: 9, points: 60, mem: 'family-first' },
      scene: [
        '퇴근길, 형만이 벤치에 앉아 낡은 지갑을 연다.',
        '"가족이 제일이라고 하셨죠. 그래서 {me} 님한텐 보여 주고 싶었어요."',
        '꼬깃꼬깃한 사진. 미선이 아기를 안고, 짱구가 엉덩이를 내밀었다.',
        '구석에서 흰둥이가 솜뭉치처럼 웅크리고 있다.',
        '"짱아 백일 사진이에요. 짱구는 끝까지 앞을 안 봤어요."',
        '"흰둥이는 짱구가 상자째 주워 왔어요. 키운다고 떼를 써서요."',
        '"결국 산책은 다 제 차지지만요. 그래도 잘 데려왔죠."',
        '"계장 시절엔 이 사진만 보고 야근했어요. 집에 가면 다들 자니까요."',
        '"월급날 통장 보면 숨이 막히는데, 이걸 보면 숨이 쉬어져요."',
        '형만이 사진 모서리를 엄지로 쓰다듬는다.',
        '"이 마을에 와서야 이 얼굴들을 깨어 있을 때 봐요."',
        '"그게 제 평생 실적이에요. 일등은 못 해도 이건 안 놓쳐요."',
      ],
      replies: [
        { say: '제일 큰 실적이네요', tier: 'great', face: 'shy', answer: '…크으, 맥주도 없는데 목이 메네요. 고마워요, {me} 님.' },
        { say: '짱구가 형만 씨 닮았어요', tier: 'good', face: 'laugh', answer: '하하, 미선이는 짱구 장난기가 다 제 탓이래요. 시골 아버지 탓인데요.' },
        { say: '사진이 많이 낡았네요', tier: 'meh', answer: '그만큼 많이 봤다는 거예요. 새로 찍을 때 됐네요.' },
      ],
    },
    {
      title: '우리 집 식구',
      hint: '형만과 아주 친해지면 그가 집 저녁 식탁에 초대한대요.',
      need: { days: 13, points: 96 },
      scene: [
        '형만네 저녁 식탁. 된장찌개 냄새와 웃음소리가 가득하다.',
        '미선이 숟가락을 하나 더 놓는다. "{me} 님 자리예요."',
        '짱구가 의자 위에 올라 엉덩이를 흔든다. "환영 엉덩이 춤!"',
        '"짱구! 밥상 앞에서!" 미선의 꿀밤이 정확히 떨어진다.',
        '짱아는 아기 의자에서 {me} 님 단추를 잡으려고 손을 뻗는다.',
        '"짱아는 반짝이는 거면 다 좋아해요. 미선이 닮았죠."',
        '"뭐라고요, 여보?" "…아, 아니. 눈이 높다는 뜻이야."',
        '"여보, 오늘은 맥주 두 캔 허락할게요. 손님 왔으니까요."',
        '형만이 헛기침을 하고 잔을 든다. 흰둥이가 발밑에서 꼬리를 친다.',
        '"{me} 님. 오늘부터 우리 집 식구예요. 미선이랑 합의했어요."',
        '"사실 미선이가 먼저 말했어요. 그 사람 눈은 정확하거든요."',
        '"도장은 없어도 이 계약은 평생이에요. 해지 조항 없어요."',
      ],
      replies: [
        { say: '평생 계약, 받을게요', tier: 'great', remember: 'family-table', face: 'shy', answer: ['크으… 여보, 들었지? 오늘은 세 캔이다!', '…아, 아니에요. 두 캔이요. 미선이 눈빛이 바뀌었어요.'] },
        { say: '찌개가 정말 맛있어요', tier: 'good', remember: 'family-table', face: 'laugh', answer: '그렇죠! 이 맛에 대출 삼십이 년도 버티는 거예요.' },
        { say: '폐 끼치는 거 아닐까요', tier: 'meh', remember: 'family-table', face: 'smile', answer: '식구끼리 폐가 어디 있어요. 짱구가 벌써 다음 주 자리 맡아 놨어요.' },
      ],
    },
    {
      title: '평범한 하루',
      hint: '형만의 마지막 이야기는 가족과 미선이 몫이라, 친구에게는 열리지 않아요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽 다섯 시 반. 흰둥이가 형만의 코를 핥아 깨운다.',
        '까치발로 나가 흰둥이와 마을을 한 바퀴 돈다.',
        '돌아오면 짱구를 깨운다. 열 번 부르고, 이불째 들어 올린다.',
        '"아빠, 오 분만…" "아빠도 오 분만 자고 싶어."',
        '미선이 도시락을 건넨다. 뚜껑엔 짱아 손자국이 찍혀 있다.',
        '부동산 문을 열고 넥타이를 고쳐 맨다. 오늘도 손님은 드문드문.',
        '계약 하나가 깨지고, 하나는 다음 주로 미뤄진다.',
        '점심 도시락을 열자 김으로 쓴 "아빠 힘내"가 보인다. 짱구 글씨다.',
        '퇴근길 주점 앞에서 발이 멈춘다. 그러다 그냥 지나친다.',
        '현관을 열자 짱구가 엉덩이 춤으로 맞는다. 짱아가 "아바" 한다.',
        '미선이 맥주 한 캔을 식탁에 놓는다. "오늘은 내가 사는 거야."',
        '"크으…" 그 한 모금에 하루가 다 녹는다.',
        '밤, 아이들 이불을 덮어 주고 미선과 툇마루에 앉는다.',
        '"여보, 오늘 별일 없었지?" "응. 별일 없어서 좋았어."',
        '대단할 것 없는 하루. 형만이 지키는 건 바로 이런 하루다.',
      ],
      replies: [
        { say: '별일 없는 날이 제일이죠', tier: 'great', face: 'shy', answer: '맞아요. 이런 날이 삼십이 년 쌓이면 그게 인생이에요. 대출이랑 같이요.' },
        { say: '형만 씨, 멋진 아빠예요', tier: 'good', face: 'laugh', answer: '헤헤… 짱구가 들으면 "아빠 발 냄새도 멋져?" 할 거예요.' },
        { say: '심심한 하루네요', tier: 'meh', face: 'calm', answer: '심심해서 좋은 거예요. 심심한 하루를 지키는 게 아빠 일이거든요.' },
      ],
    },
  ],
  after: [
    '오늘 상담은 여기까지예요. 내일 또 들러 주세요.',
    '크으, 말을 많이 했더니 목이 마르네요. 퇴근이 기다려져요.',
    '저 이제 들어가 봐야 해요. 늦으면 미선이가… 네, 아시죠.',
    '{me} 님, 조심히 가세요. 집에 불 켜 두는 거 잊지 마요.',
    '짱구 초코비 사 가야 해서요. 액션가면 스티커 든 걸로요. 그럼 이만!',
    '흰둥이 저녁 산책 시간이에요. 짱구가 또 잊었을 거예요.',
    '오늘 얘기 미선이한테 해 줘야겠어요. 좋은 이웃 생겼다고요.',
  ],
};
