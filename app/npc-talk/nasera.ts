// 나세라 — 시장 거리 농협 조합장. 사막 나라 슈리마의 옛 서고 관리자 출신.
// 무뚝뚝하고 규칙에 엄격한 하십시오체. 작물·책 이야기가 나오면 말이 길어지다가
// "이야기가 길어지니 생략합니다"로 끊는다. 매입 장부·퇴비·표본을 매일 쌓고,
// 천 년 넘은 기록을 읽고, 시드는 걸 싫어한다. 성격 급한 남동생의 편지, 자칼 귀
// 투구, 고향 맛 대추야자. 칭찬은 드물고, 칭찬할 땐 칭찬이라고 말한다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const NASERA_TALK: NpcTalkBook = {
  npc: 'nasera',
  memories: {
    'stack-daily': '매일 조금씩 쌓는 게 좋다고 했어요',
    'book-friend': '오래된 책을 좋아한다고 했어요',
    'brother-letter': '동생 편지에 답장하라고 권했어요',
    'compost-help': '퇴비 쌓는 걸 돕겠다고 했어요',
    'dates-home': '대추야자 이야기를 들었어요',
    'helmet-ok': '투구가 잘 어울린다고 했어요',
    'no-wither': '시든 잎을 바로 따겠다고 약속했어요',
    'old-record': '천 년 된 작황 기록 이야기를 들었어요',
    'rule-keeper': '규칙은 지키라고 있는 거라고 했어요',
    'carrot-talk': '당근 강의를 끝까지 들었어요',
    'dawn-field': '새벽 이슬 밭을 함께 걸었어요',
    'shell-record': '암모나이트 화석을 기록에 남겼어요',
    'taste-heard': '내 취향을 장부 여백에 적어 뒀대요',
    'outing-heard': '같이 걸은 순찰 이야기를 했어요',
    'bday-heard': '생일 날짜를 장부에 적어 뒀대요',
    'lost-library': '모래에 묻힌 고향 서고 이야기를 들었어요',
    'brother-kind': '동생이 급한 만큼 정도 많다고 했어요',
    patient: '기다리는 것도 일이라고 했어요',
    'keep-names': '마을 옛 이름을 알려 주기로 했어요',
    'reading-club': '조용한 독서 모임에 끼고 싶다고 했어요',
    'dog-friend': '창구 앞 떠돌이 개 이야기를 들었어요',
    'date-heard': '내 방에서 보낸 시간을 장부에 적었대요',
    'letter-sent': '동생에게 보낼 편지를 함께 부쳤어요',
  },
  talks: [
    {
      id: 'stack-daily',
      open: ['{me}, 하나 묻겠습니다.', '한 번에 크게 하는 것과 매일 조금씩 하는 것. 어느 쪽입니까.'],
      replies: [
        { say: '매일 조금씩 쌓는 쪽', tier: 'great', remember: 'stack-daily', face: 'smile', answer: ['좋은 대답입니다. 칭찬입니다. 자주 안 합니다.', '매일 쌓으면 언젠가 산이 됩니다. 제 퇴비 더미가 증거입니다.'] },
        { say: '그때그때 달라요', tier: 'good', face: 'think', answer: '정직하군요. 다만 작물은 그때그때를 봐주지 않습니다.' },
        { say: '한 번에 몰아서 해요', tier: 'meh', face: 'calm', answer: '한 번에 쌓은 건 한 번에 무너집니다. 기록이 그렇게 말합니다.' },
      ],
    },
    {
      id: 'old-books',
      open: '도서관에 오래된 농서가 들어왔습니다. 종이가 모래처럼 바스러집니다.',
      replies: [
        { say: '저도 같이 읽고 싶어요', tier: 'great', remember: 'book-friend', face: 'wow', answer: ['…같이 말입니까. 조용히 넘기겠다면 허락합니다.', '장갑은 제가 빌려 드리겠습니다. 규칙입니다.'] },
        { say: '무슨 내용이에요?', tier: 'good', face: 'think', answer: ['거름 이야기만 삼십 쪽입니다. 첫 장은 소똥의 등급으로 시작해서…', '이야기가 길어지니 생략합니다.'] },
        { say: '책은 졸려요', tier: 'meh', face: 'calm', answer: '그럼 잠은 집에서 주무십시오. 서고 의자는 딱딱합니다.' },
      ],
    },
    {
      id: 'brother',
      open: '동생에게서 또 편지가 왔습니다. 화가 잔뜩 났습니다. 늘 그렇습니다.',
      replies: [
        { say: '천천히라도 답장해 줘요', tier: 'great', remember: 'brother-letter', face: 'smile', answer: ['천천히는 제 특기입니다. 오늘 밤 한 줄 쓰겠습니다.', '내일 한 줄 더. 그렇게 쌓으면 한 통이 됩니다.'] },
        { say: '왜 화가 났대요?', tier: 'good', face: 'think', answer: '제가 지난 답장에 당근 이야기만 썼기 때문입니다. 유익했는데.' },
        { say: '그냥 두면 풀리겠죠', tier: 'meh', face: 'calm', answer: '그 아이는 그냥 두면 더 탑니다. 모래바람 같은 성격입니다.' },
      ],
    },
    {
      id: 'compost',
      open: '퇴비 더미에 오늘 한 삽을 더 얹었습니다. 몇 삽째인지 압니까.',
      replies: [
        { say: '내일은 제가 한 삽 얹을게요', tier: 'great', remember: 'compost-help', face: 'wow', answer: ['…좋습니다. 장부에 당신 몫 칸을 따로 만들겠습니다.', '삽은 창고 왼쪽 두 번째입니다. 늦지 마십시오.'] },
        { say: '장부에 다 적혀 있죠?', tier: 'good', face: 'smile', answer: '물론입니다. 첫 삽부터 전부. 지금은 말하지 않겠습니다. 비밀입니다.' },
        { say: '냄새가 좀 나요', tier: 'meh', face: 'calm', answer: '냄새는 일하는 중이라는 뜻입니다. 흙이 되는 냄새입니다.' },
      ],
    },
    {
      id: 'dates',
      open: '시장에 대추야자가 들어오면 알려 주십시오. 고향 맛입니다.',
      replies: [
        { say: '고향 이야기 더 해 주세요', tier: 'great', remember: 'dates-home', face: 'smile', answer: ['모래 위 서고, 그늘 아래 대추야자 나무. 오후엔 그 그늘에서 읽었습니다.', '…이 정도만. 그리우면 일이 손에 안 잡힙니다.'] },
        { say: '꼭 알려 드릴게요', tier: 'good', face: 'smile', answer: '고맙습니다. 쓰레쉬 잡화점에 들어오면 값부터 따질 겁니다. 습관입니다.' },
        { say: '그게 무슨 맛이에요?', tier: 'meh', face: 'think', answer: '달고, 끈적하고, 따뜻합니다. 설명하기 어렵습니다. 먹어 보십시오.' },
      ],
    },
    {
      id: 'helmet',
      open: '제 투구를 보는 눈치군요. 귀 모양 장식입니다. 묻고 싶은 게 있습니까.',
      replies: [
        { say: '잘 어울려요. 멋있어요', tier: 'great', remember: 'helmet-ok', face: 'shy', answer: '…그런 말은 처음 듣습니다. 다들 무섭다고만 합니다. 기록해 두겠습니다.' },
        { say: '줄 서게 하려고 쓰는 거죠?', tier: 'good', face: 'laugh', answer: '정확합니다. 이걸 쓰면 새치기가 사라집니다. 효과가 입증됐습니다.' },
        { say: '무거워 보여요', tier: 'meh', face: 'calm', answer: '무겁습니다. 서고의 기록만큼은 아닙니다.' },
      ],
    },
    {
      id: 'wither',
      open: '오늘 순찰 중에 시든 잎을 세 장 봤습니다. 누구 밭인지는 말하지 않겠습니다.',
      replies: [
        { say: '제 밭이면 바로 딸게요', tier: 'great', remember: 'no-wither', face: 'smile', answer: '좋습니다. 저는 뭔가 시드는 걸 보는 게 싫습니다. 이유는 묻지 마십시오.' },
        { say: '혹시 제 밭이에요?', tier: 'good', face: 'think', answer: '…아닙니다. 당신 밭은 깔끔합니다. 봤습니다. 이건 칭찬입니다.' },
        { say: '잎 세 장쯤이야', tier: 'meh', face: 'calm', answer: '세 장이 서른 장 되는 데 사흘 걸립니다. 기록이 그렇습니다.' },
      ],
    },
    {
      id: 'old-record',
      open: '천 년 전 작황 기록을 읽었습니다. 그때도 장마가 늦으면 다들 걱정했습니다.',
      replies: [
        { say: '천 년 전에도 똑같았네요', tier: 'great', remember: 'old-record', face: 'wow', answer: ['그렇습니다. 사람도 비도 크게 안 변합니다.', '그래서 기록이 쓸모 있습니다. 미래는 옛 장부에 다 있습니다.'] },
        { say: '그런 기록이 어디 있어요?', tier: 'good', face: 'think', answer: ['서고 맨 안쪽 칸입니다. 모래 먼지를 털고 옮겨 온 것들입니다.', '이야기가 길어지니 생략합니다.'] },
        { say: '옛날 일은 잘 몰라요', tier: 'meh', face: 'calm', answer: '모르는 건 죄가 아닙니다. 읽지 않는 게 아쉬울 뿐입니다.' },
      ],
    },
    {
      id: 'rules',
      open: '창구 규칙을 하나 더 붙였습니다. 다들 규칙이 너무 많다고 합니다.',
      replies: [
        { say: '규칙은 지키라고 있는 거죠', tier: 'great', remember: 'rule-keeper', face: 'smile', answer: '맞습니다. 그 말을 게시판 맨 위에 붙이고 싶습니다. 당신 이름으로.' },
        { say: '무슨 규칙인데요?', tier: 'good', face: 'think', answer: '흙은 털고 가져온다. 흙 무게까지 사지는 않습니다. 당연한 규칙입니다.' },
        { say: '좀 줄이면 안 돼요?', tier: 'meh', face: 'calm', answer: '줄이는 것도 규칙을 정해야 합니다. 그러면 하나가 늡니다.' },
      ],
    },
    {
      id: 'carrot',
      open: ['당근 이야기를 하겠습니다. 당근은 원래 보라색이었다는 기록이 있고…', '아. 바쁘십니까.'],
      replies: [
        { say: '아니요, 끝까지 들을게요', tier: 'great', remember: 'carrot-talk', face: 'wow', answer: ['…앉으십시오. 오래 걸립니다.', '보라에서 노랑, 노랑에서 주황. 그 사이에 오백 년이 있습니다.'] },
        { say: '짧게만 해 주세요', tier: 'good', face: 'smile', answer: '짧게 말하면 당근은 대단합니다. 나머지는 이야기가 길어지니 생략합니다.' },
        { say: '사실 좀 바빠요', tier: 'meh', face: 'calm', answer: '알겠습니다. 당근은 기다려 줍니다. 땅속에서 잘.' },
      ],
    },
    {
      id: 'price',
      open: '이번 주 배추 매입가를 정해야 합니다. {me}, 농사짓는 입장에서 말해 보십시오.',
      replies: [
        { say: '품질대로 정직하게요', tier: 'great', face: 'smile', answer: '그게 농협입니다. 금별은 금별 값, 은별은 은별 값. 정이 끼면 장부가 틀립니다.' },
        { say: '저한테만 조금 높게요', tier: 'meh', face: 'calm', answer: '안 됩니다. 규칙입니다. …시세를 하루 먼저 알려 드리는 건 됩니다.' },
        { say: '시세를 먼저 볼게요', tier: 'good', face: 'think', answer: '좋은 습관입니다. 잔나 신문 셋째 면입니다. 제가 직접 씁니다.' },
      ],
    },
    {
      id: 'sun',
      open: '고향에선 태양을 모셨습니다. 여기 해는 다정합니다. 조금 싱겁기도 합니다.',
      replies: [
        { say: '싱거운 해도 좋아요', tier: 'great', face: 'smile', answer: '…그렇군요. 작물에게도 이 정도가 맞습니다. 저도 익숙해지는 중입니다.' },
        { say: '사막은 얼마나 더워요?', tier: 'good', face: 'think', answer: '한낮엔 그림자도 숨습니다. 그래서 서고는 다 땅 밑에 있었습니다.' },
        { say: '더운 건 질색이에요', tier: 'meh', face: 'calm', answer: '그럼 사막엔 오지 마십시오. 대신 물은 꼭 마시십시오.' },
      ],
    },
    {
      id: 'specimen',
      open: '표본실에 씨앗 표본을 하나 더 쌓았습니다. 이번엔 이 마을 토종 콩입니다.',
      replies: [
        { say: '언젠가 천 년 기록이 되겠네요', tier: 'great', face: 'wow', answer: '…그렇습니다. 그래서 쌓습니다. 천 년 뒤 누가 읽을 겁니다.' },
        { say: '표본실 구경해도 돼요?', tier: 'good', face: 'smile', answer: '조용히 하신다면. 숨도 천천히 쉬십시오. 먼지가 날립니다.' },
        { say: '콩은 그냥 먹는 거 아니에요?', tier: 'meh', face: 'calm', answer: '먹습니다. 다만 한 줌은 남겨 둡니다. 그게 기록입니다.' },
      ],
    },
    {
      id: 'sand-library',
      open: ['고향 서고 이야기를 하겠습니다. 짧게.', '모래 폭풍 한 번에 입구가 묻혔습니다. 책은 아직 그 밑에 있습니다.'],
      replies: [
        { say: '그래서 지금도 기록하시는군요', tier: 'great', remember: 'lost-library', face: 'calm', answer: ['…그렇습니다. 잃은 만큼 새로 적습니다.', '여기 서고는 땅 위에 지었습니다. 모래가 없으니까요.'] },
        { say: '꺼낼 방법은 없어요?', tier: 'good', face: 'think', answer: ['언젠가는. 동생이 삽을 들고 가겠다고 편지에 씁니다.', '그 아이는 삽보다 성질이 먼저 나갑니다. 말리는 중입니다.'] },
        { say: '책이야 또 사면 되죠', tier: 'meh', face: 'sorry', answer: '사서 되는 책이 아니었습니다. 손으로 옮긴 유일본들이었습니다.' },
      ],
    },
    {
      id: 'brother-temper',
      open: ['동생 이야기를 묻는 사람은 드뭅니다. 다들 편지 봉투만 봐도 뜨겁다고 합니다.', '{me}, 성격 급한 사람을 어떻게 생각합니까.'],
      replies: [
        { say: '급한 만큼 정도 많더라고요', tier: 'great', remember: 'brother-kind', face: 'wow', answer: ['…맞습니다. 어릴 때 제 대신 싸움을 다 맡았던 아이입니다.', '저는 책을 읽고, 그 아이는 문 앞을 지켰습니다. 오래.'] },
        { say: '조합장님이랑 반대네요', tier: 'good', face: 'smile', answer: '정반대입니다. 그래서 둘이 합치면 한 사람 몫이 됩니다. 고향 말입니다.' },
        { say: '저는 좀 피곤해요', tier: 'meh', face: 'calm', answer: '저도 가끔 그렇습니다. 그래도 답장은 씁니다. 형제니까.' },
      ],
    },
    {
      id: 'patience',
      open: '씨앗을 심고 날마다 흙을 파 보는 사람이 있습니다. 그러면 싹이 안 납니다.',
      replies: [
        { say: '기다리는 것도 일이죠', tier: 'great', remember: 'patient', face: 'smile', answer: ['정확합니다. 기다림은 손을 놓는 게 아니라 지키는 겁니다.', '저는 천 년도 기다려 봤습니다. 비유입니다. 대체로.'] },
        { say: '저도 파 본 적 있어요', tier: 'good', face: 'laugh', answer: '정직하군요. 다음부턴 장부를 펴십시오. 날짜를 세면 손이 덜 갑니다.' },
        { say: '궁금한데 어떡해요', tier: 'meh', face: 'think', answer: '궁금하면 옆 이랑에 하나 더 심으십시오. 그걸 파 보십시오.' },
      ],
    },
    {
      id: 'keep-names',
      open: '마을 옛 지명을 정리하고 있습니다. 아무도 안 부르는 이름은 금방 사라집니다.',
      replies: [
        { say: '제가 아는 이름도 알려 드릴게요', tier: 'great', remember: 'keep-names', face: 'wow', answer: ['좋습니다. 구술 기록도 기록입니다. 받아 적겠습니다.', '잊히는 것보다 나쁜 건 없습니다. 시드는 것보다도.'] },
        { say: '어떤 이름들이에요?', tier: 'good', face: 'think', answer: ['뒷산 너머 우물골, 항구 옆 소금밭. 다들 처음 듣는다고 합니다.', '이야기가 길어지니 생략합니다. 목록은 서고에 있습니다.'] },
        { say: '지금 이름이면 충분해요', tier: 'meh', face: 'calm', answer: '지금은요. 지금 이름도 언젠가 옛 이름이 됩니다.' },
      ],
    },
    {
      id: 'frieren-years',
      open: '프리렌 씨는 천 년을 살았다고 합니다. 저는 천 년 치 기록을 읽었습니다. 다릅니다.',
      replies: [
        { say: '살아 본 것과 읽은 것이요?', tier: 'great', face: 'think', answer: ['그렇습니다. 그 사람은 많이 잊었다고 합니다. 저는 잊지 않으려고 적습니다.', '…둘 중 누가 나은지는 아직 모르겠습니다.'] },
        { say: '두 분 다 대단해요', tier: 'good', face: 'shy', answer: '저는 대단하지 않습니다. 성실할 뿐입니다. 그 사람은 늦잠이 대단합니다.' },
        { say: '천 년은 너무 길어요', tier: 'meh', face: 'calm', answer: '길지요. 그래서 하루씩 나눠 적습니다. 그러면 견딜 만합니다.' },
      ],
    },
    {
      id: 'reading-club',
      open: '베아트리스 씨와 독서 모임을 합니다. 일주일에 한 번. 둘 다 말이 없습니다.',
      replies: [
        { say: '조용한 모임, 저도 끼고 싶어요', tier: 'great', remember: 'reading-club', face: 'smile', answer: ['…자리는 있습니다. 첫째 규칙, 책장은 소리 없이 넘긴다.', '둘째 규칙, 과자 부스러기 금지. 그 사람이 정했습니다.'] },
        { say: '말 없으면 뭘 해요?', tier: 'good', face: 'think', answer: '읽습니다. 다 읽으면 한 줄씩 적어 교환합니다. 그게 대화입니다.' },
        { say: '그게 모임이에요?', tier: 'meh', face: 'calm', answer: '모임입니다. 같은 방에 있으면 모임입니다. 규칙상.' },
      ],
    },
    {
      id: 'misun-haggle',
      open: '봉미선 씨가 오늘도 한 푼을 깎으러 왔습니다. 세 번째 방문입니다.',
      replies: [
        { say: '규칙대로 한 푼도 안 되죠', tier: 'great', face: 'laugh', answer: ['안 됩니다. 대신 덤으로 시든 잎 따는 법을 알려 줬습니다.', '그 사람은 그걸 덤이라고 생각하지 않았습니다.'] },
        { say: '살림하는 분이라 그래요', tier: 'good', face: 'smile', answer: '압니다. 그래서 시세표를 제일 먼저 보여 줍니다. 깎지는 않습니다.' },
        { say: '한 푼쯤 깎아 주세요', tier: 'meh', face: 'calm', answer: '한 푼이 쌓이면 산이 됩니다. 제 신조를 거꾸로 쓰면 안 됩니다.' },
      ],
    },
    {
      id: 'parcel',
      open: '신짜장 씨가 동생 편지를 배달해 줍니다. 봉투가 늘 구겨져 있습니다.',
      replies: [
        { say: '서둘러 오느라 그렇겠죠', tier: 'great', face: 'smile', answer: ['그 사람 탓이 아닙니다. 동생이 봉투를 세게 붙입니다.', '성격이 봉투에도 묻어 납니다. 그래도 매번 펴서 보관합니다.'] },
        { say: '배달이 빠르긴 해요', tier: 'good', face: 'think', answer: '빠릅니다. 짜장면 그릇과 편지가 같은 가방에 있는 건 문제입니다.' },
        { say: '구긴 건 버리세요', tier: 'meh', face: 'sorry', answer: '버리지 않습니다. 동생 글씨는 하나도 버리지 않습니다.' },
      ],
    },
    {
      id: 'mentor-rule',
      open: '츠나데 선생님이 오늘 창구에 와서 제 장부를 들여다보셨습니다. 아무 말 없이.',
      replies: [
        { say: '말 없는 게 칭찬이에요', tier: 'great', face: 'shy', answer: ['…그렇게 생각하겠습니다. 틀린 칸이 있으면 바로 말씀하시는 분입니다.', '오늘 장부는 맞았습니다. 세 번 확인했습니다.'] },
        { say: '긴장하셨겠어요', tier: 'good', face: 'sorry', answer: '했습니다. 펜을 두 번 떨어뜨렸습니다. 기록하지 마십시오.' },
        { say: '술 냄새 나지 않았어요?', tier: 'meh', face: 'calm', answer: '그 질문은 창구에서 받지 않습니다. 스승님 체면이 있습니다.' },
      ],
    },
    {
      id: 'stray-dog',
      open: '창구 앞에 떠돌이 개가 자꾸 와서 잡니다. 내쫓지 않았습니다.',
      replies: [
        { say: '조합장님을 좋아하나 봐요', tier: 'great', remember: 'dog-friend', face: 'shy', answer: ['…귀 모양이 비슷해서 그렇다는 말을 들었습니다. 투구입니다.', '물그릇은 하나 놓아 두었습니다. 규칙 위반은 아닙니다.'] },
        { say: '이름은 지어 줬어요?', tier: 'good', face: 'think', answer: '장부라고 부릅니다. 매일 같은 자리에 오니까.' },
        { say: '위생은 괜찮아요?', tier: 'meh', face: 'calm', answer: '창구 밖입니다. 매입 작물엔 닿지 않습니다. 확인했습니다.' },
      ],
    },
    {
      id: 'seed-vault',
      open: '농협 지하에 씨앗 금고를 만들었습니다. 흉년이 와도 다시 심을 수 있게.',
      replies: [
        { say: '시들어도 다시 시작할 수 있네요', tier: 'great', face: 'wow', answer: ['그렇습니다. 그게 이 금고의 목적입니다.', '고향에선 그걸 못 했습니다. 그래서 여기선 먼저 합니다.'] },
        { say: '열쇠는 누가 가져요?', tier: 'good', face: 'think', answer: '저와 장부입니다. 장부에 비밀번호가… 아닙니다. 지금 건 잊으십시오.' },
        { say: '흉년이 오겠어요?', tier: 'meh', face: 'calm', answer: '모릅니다. 모르니까 준비합니다. 기록이 가르친 겁니다.' },
      ],
    },
    {
      id: 'fav-crop',
      open: '{me}, 작물 중에 하나만 고르라면 무엇을 고르겠습니까. 업무상 묻습니다.',
      replies: [
        { say: '조합장님이 고르는 걸로요', tier: 'great', face: 'laugh', answer: ['그건 반칙입니다. …그래도 말하겠습니다. 수수입니다.', '사막에서도 자랍니다. 버티는 작물입니다. 이야기가 길어지니 생략합니다.'] },
        { say: '딸기요, 달잖아요', tier: 'good', face: 'smile', answer: '좋은 선택입니다. 첫 꽃을 따 주면 열매가 큽니다. 아끼지 마십시오.' },
        { say: '작물은 다 똑같아요', tier: 'meh', face: 'sorry', answer: '…창구에서 그 말은 하지 마십시오. 직원들이 웁니다.' },
      ],
    },
    {
      id: 'scale',
      open: '매입 저울을 새로 맞췄습니다. 깃털 하나도 잡힙니다.',
      replies: [
        { say: '정직한 저울이 최고죠', tier: 'great', face: 'smile', answer: ['그렇습니다. 고향 서고에선 마음도 저울에 달았다는 옛말이 있습니다.', '…이건 기록에만 있는 이야기입니다. 무섭게 듣지 마십시오.'] },
        { say: '깃털 값도 쳐 주세요', tier: 'good', face: 'laugh', answer: '깃털은 매입 품목이 아닙니다. 목장으로 가십시오. 농담입니다.' },
        { say: '대충 달아도 되는데', tier: 'meh', face: 'calm', answer: '대충은 장부에 없는 단어입니다.' },
      ],
    },
    {
      id: 'desert-stars',
      open: '사막의 밤엔 별로 길을 찾았습니다. 서고 천장에도 별 지도를 그려 두었습니다.',
      replies: [
        { say: '여기 별도 같이 봐요', tier: 'great', face: 'shy', answer: ['…여기 하늘은 습기가 있어 흐립니다. 그래도 같이라면.', '별 이름을 하나씩 알려 드리겠습니다. 짧게. 아마도.'] },
        { say: '별 지도는 지금도 있어요?', tier: 'good', face: 'think', answer: '모래 밑에 있습니다. 머릿속엔 다 있습니다. 옮겨 그리는 중입니다.' },
        { say: '밤엔 자야죠', tier: 'meh', face: 'calm', answer: '맞습니다. 저도 그 말을 들어야 합니다.' },
      ],
    },
    {
      id: 'gems',
      open: '광산에서 나온 보석을 들고 오는 사람이 있습니다. 농협은 보석을 사지 않습니다.',
      replies: [
        { say: '그래도 좋아하시잖아요', tier: 'great', face: 'shy', answer: ['…들켰습니까. 매입은 안 하고 구경만 합니다. 오래.', '결정은 층층이 자랍니다. 쌓은 것의 모양입니다.'] },
        { say: '어디 팔면 돼요?', tier: 'good', face: 'think', answer: '잡화점이나 박물관입니다. 쓰레쉬 씨에게 팔면 값을 꼭 비교하십시오.' },
        { say: '그냥 돌 아니에요?', tier: 'meh', face: 'calm', answer: '돌은 싫어합니다. 보석은 다릅니다. 이야기가 길어지니 생략합니다.' },
      ],
    },
    {
      id: 'lantern-shop',
      open: '쓰레쉬 씨 가게에 등불이 새로 걸렸습니다. 밤새 켜 둡니다. 기름이 아깝습니다.',
      replies: [
        { say: '그 집 등불이 길잡이래요', tier: 'great', face: 'think', answer: ['…그렇다면 인정하겠습니다. 길 잃는 사람이 줄면 좋은 일입니다.', '씨앗 값은 인정하지 않습니다.'] },
        { say: '두 분 은근히 친하죠', tier: 'good', face: 'laugh', answer: '친하지 않습니다. 장날마다 다툴 뿐입니다. 거의 매주 봅니다.' },
        { say: '등불은 멋있던데요', tier: 'meh', face: 'calm', answer: '멋은 장부에 안 적힙니다. 기름값은 적힙니다.' },
      ],
    },
    {
      id: 'kimchi',
      open: '김장철 배추 매입이 끝났습니다. 남은 배추로 저도 김치를 담갔습니다. 처음입니다.',
      replies: [
        { say: '맛은 어땠어요?', tier: 'great', face: 'smile', answer: ['책대로 했습니다. 소금 비율까지. 맛있었습니다. 놀랐습니다.', '고향엔 이런 음식이 없습니다. 쌓아 두고 익히는 음식. 마음에 듭니다.'] },
        { say: '저도 한 포기 주세요', tier: 'good', face: 'think', answer: '한 포기는 됩니다. 장부에 적습니다. 무료 칸에.' },
        { say: '사 먹는 게 편해요', tier: 'meh', face: 'calm', answer: '편합니다. 다만 익어 가는 걸 지켜보는 재미는 못 삽니다.' },
      ],
    },
    {
      id: 'helmet-off',
      when: { ch: 5 },
      open: '요즘 마감 뒤엔 투구를 벗고 장부를 봅니다. 당신이 처음 본 뒤로 그렇게 됐습니다.',
      replies: [
        { say: '그 얼굴, 저만 알아도 돼요?', tier: 'great', face: 'shy', answer: ['…창구 직원들도 압니다. 그래도 제일 먼저 본 건 당신입니다.', '장부에 그렇게 적혀 있습니다.'] },
        { say: '편해 보여서 좋아요', tier: 'good', face: 'smile', answer: '편합니다. 귀가 덜 무겁습니다. 투구 말입니다.' },
        { say: '투구가 더 낫던데요', tier: 'meh', face: 'calm', answer: '그럼 내일은 쓰겠습니다. 오늘은 그냥 두겠습니다.' },
      ],
    },
    {
      id: 'brother-meet',
      when: { ch: 5 },
      open: '동생이 언젠가 이 마을에 오겠다고 했습니다. 오면 창구가 시끄러워질 겁니다.',
      replies: [
        { say: '저도 꼭 인사할게요', tier: 'great', face: 'wow', answer: ['…그 아이는 낯선 사람에게 으르렁댑니다. 말로만.', '당신에겐 아닐 겁니다. 편지에 당신 이야기를 많이 썼으니까요.'] },
        { say: '마을 구경시켜 드려요', tier: 'good', face: 'smile', answer: '그러겠습니다. 시장, 서고, 그리고 당신 밭. 순서는 장부대로.' },
        { say: '조용한 게 낫지 않아요?', tier: 'meh', face: 'think', answer: '조용한 게 낫습니다. 그래도 그 아이 목소리는 가끔 그립습니다.' },
      ],
    },
    {
      id: 'love-ledger',
      when: { love: 'dating' },
      open: '{me}. 오늘 장부를 쓰다가 당신 이름 옆에 동그라미를 두 개 쳤습니다. 실수입니다.',
      replies: [
        { say: '실수 아닌 거 다 알아요', tier: 'great', face: 'shy', answer: ['…그렇습니다. 실수 아닙니다. 고치지 않겠습니다.', '내일은 세 개가 될지도 모릅니다. 규칙상 상한은 없습니다.'] },
        { say: '저도 동그라미 그릴래요', tier: 'good', face: 'smile', answer: '좋습니다. 펜은 제 것을 쓰십시오. 잉크가 오래 갑니다.' },
        { say: '지우셔도 돼요', tier: 'meh', face: 'calm', answer: '펜으로 썼습니다. 안 지워집니다. 그게 다행입니다.' },
      ],
    },
    {
      id: 'brother-reply',
      when: { mem: 'letter-sent' },
      open: ['동생 편지가 요즘 덜 구겨져서 옵니다.', '신짜장 씨가 봉투가 얌전해졌다고 놀랍니다. 저도 놀랍니다.'],
      replies: [
        { say: '마음이 풀린 거예요', tier: 'great', face: 'shy', answer: ['…그런 것 같습니다. 지난 편지엔 제 장부 걱정까지 했습니다.', '그 아이가 걱정을 하다니. 기록해 두었습니다. 두 줄로.'] },
        { say: '무슨 이야기가 왔어요?', tier: 'good', face: 'think', answer: '고향 하늘 이야기입니다. 모래가 조금 걷혔다고. 이야기가 길어지니 생략합니다.' },
        { say: '봉투는 원래 구겨지죠', tier: 'meh', face: 'calm', answer: '그 아이 봉투는 원래 찢어졌습니다. 구겨진 건 진보입니다.' },
      ],
    },
    {
      id: 'two-names',
      when: { ch: 4 },
      open: '{me}. 장부 맨 끝에 빈 칸이 하나 있습니다. 무엇을 적을지 아직 정하지 않았습니다.',
      replies: [
        { say: '제 이름은 어때요?', tier: 'great', face: 'shy', answer: '…그건 이미 앞쪽에 여러 번 있습니다. 끝에도 적으면 너무 많습니다. 아마도.' },
        { say: '오늘 날씨라도 적어요', tier: 'good', face: 'smile', answer: '{weather}. 적었습니다. 당신과 이야기한 날의 날씨입니다.' },
        { say: '비워 두는 것도 좋죠', tier: 'meh', face: 'think', answer: '비워 두면 자꾸 보게 됩니다. 그게 문제입니다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '{weather}입니다. 고향에선 비가 축제였습니다. 여기선 배수로 점검일입니다.',
      replies: [
        { say: '배수로 같이 봐 드릴게요', tier: 'great', face: 'smile', answer: '좋습니다. 삽은 두 자루 있습니다. 규칙상 우비도 입으십시오.' },
        { say: '오늘은 물 안 줘도 되죠?', tier: 'good', face: 'think', answer: '됩니다. 규칙 위반이 아닙니다. 대신 지지대는 확인하십시오.' },
        { say: '비 오면 그냥 쉬어요', tier: 'meh', face: 'calm', answer: '쉬는 것도 좋습니다. 창고 문만 두 번 잠그고 쉬십시오.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈입니다. 모래처럼 쌓이는데 녹습니다. 그 점이 낫습니다.',
      replies: [
        { say: '겨울 시금치는 더 달아지죠', tier: 'great', face: 'wow', answer: '…그걸 압니까. 추위를 먹고 답니다. 오늘은 칭찬을 두 번 하겠습니다.' },
        { say: '고향엔 눈이 없죠?', tier: 'good', face: 'smile', answer: '없습니다. 처음 봤을 때 모래가 하얘진 줄 알았습니다. 비밀입니다.' },
        { say: '추워서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 장갑을 끼십시오. 손이 시들면 일을 못 합니다.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '{me}, 일찍 나왔군요. 이슬 마르기 전 잎 색이 제일 정직합니다.',
      replies: [
        { say: '그래서 일찍 나왔어요', tier: 'great', face: 'smile', answer: '해 뜨기 전에 밭을 보는 사람은 믿을 만합니다. 장부에 동그라미를 칩니다.' },
        { say: '잠이 안 와서요', tier: 'good', face: 'think', answer: '그럼 그 시간을 쓰십시오. 사막에선 이 시간에 일을 끝냈습니다.' },
        { say: '아직 졸려요', tier: 'meh', face: 'calm', answer: '그럼 돌아가 주무십시오. 졸린 눈으로는 시든 잎이 안 보입니다.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '이 시간엔 창구를 닫습니다. 규칙입니다. …책 한 장만 더 읽고 가겠습니다.',
      replies: [
        { say: '무슨 책이에요?', tier: 'great', face: 'smile', answer: ['천 년 전 농서입니다. 지금 읽는 장은 물길 이야기입니다.', '…이야기가 길어지니 생략합니다. 늦었습니다.'] },
        { say: '저도 그만 들어갈게요', tier: 'good', answer: '잘 생각했습니다. 밤늦게 다니면 내일 수확이 늦습니다.' },
        { say: '한 장만 더 이야기해요', tier: 'meh', face: 'think', answer: '한 장은 한 장입니다. 그 이상은 규칙 위반입니다.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '오늘은 창구를 닫았습니다. 축제 날까지 일하면 다들 제 투구를 무서워합니다.',
      replies: [
        { say: '오늘은 투구 벗고 놀아요', tier: 'great', face: 'shy', answer: '…벗는 건 안 됩니다. 대신 귀를 조금 숙이겠습니다. 축제니까.' },
        { say: '품평회 심사하시죠?', tier: 'good', face: 'smile', answer: '오후에 합니다. 공정합니다. 친해도 봐주지 않습니다. 빵도 안 받습니다.' },
        { say: '축제는 시끄러워요', tier: 'meh', face: 'calm', answer: '동의합니다. 도서관은 열려 있습니다. 오늘은 텅 비었을 겁니다.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish} 낚았다고 들었습니다. 생선은 농협 매입 품목이 아닙니다. 유감입니다.',
      replies: [
        { say: '그래도 자랑하러 왔어요', tier: 'great', face: 'laugh', answer: '…자랑은 받겠습니다. 매입은 안 됩니다. 기다린 인내는 농사와 같습니다.' },
        { say: '퇴비로는 안 될까요?', tier: 'good', face: 'think', answer: '생선 거름은 상급입니다. 다만 냄새 민원이 들어옵니다. 소량만.' },
        { say: '그럼 어디 팔죠?', tier: 'meh', face: 'calm', answer: '어시장입니다. 저는 생선 값은 모릅니다. 모르는 건 말하지 않습니다.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '큰 놈을 낚았다는 소문이 창구까지 왔습니다. 기록은 남겼습니까.',
      replies: [
        { say: '조합장님 장부에 적어 줘요', tier: 'great', face: 'smile', answer: '농협 장부엔 칸이 없습니다. …제 개인 장부에 적겠습니다. 오늘 날짜로.' },
        { say: '박물관에 물어볼게요', tier: 'good', answer: '좋습니다. 기록은 남겨야 기록입니다. 말로만 하면 모래처럼 흩어집니다.' },
        { say: '그냥 운이었어요', tier: 'meh', face: 'think', answer: '운도 매일 낚싯대를 드리운 사람한테 옵니다. 쌓은 덕입니다.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '오늘 금별을 거뒀군요. 흙부터 수확 시기까지 다 맞아야 나오는 겁니다.',
      replies: [
        { say: '매일 조금씩 돌봤어요', tier: 'great', face: 'wow', answer: '그게 답입니다. 칭찬입니다. 오늘은 아끼지 않겠습니다. 잘했습니다.' },
        { say: '농협에 팔러 올게요', tier: 'good', face: 'smile', answer: '금별은 금별 값을 받습니다. 흙만 털어 오십시오.' },
        { say: '저도 왜 나왔는지 몰라요', tier: 'meh', face: 'think', answer: '모르면 기록하십시오. 다음에도 나오게 하려면 이유를 알아야 합니다.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '{me}. 손에 흙이 묻었군요. 오늘 몇 포대입니까.',
      replies: [
        { say: '조합장님만큼은 아니에요', tier: 'great', face: 'laugh', answer: '당연합니다. 저는 아침에 마흔 포대를 쌓았습니다. 그래도 수고했습니다.' },
        { say: '세어 보진 않았어요', tier: 'good', face: 'think', answer: '세십시오. 세어야 쌓입니다. 장부 한 권 드리겠습니다. 무료입니다.' },
        { say: '허리가 아파요', tier: 'meh', face: 'calm', answer: '이랑 간격을 넓히십시오. 허리는 시들면 잘 안 돌아옵니다.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}. 잎이 처진 작물 같은 얼굴입니다. 물은 마셨습니까.',
      replies: [
        { say: '좀 지쳤어요', tier: 'great', face: 'smile', answer: ['그럼 오늘은 쌓지 마십시오. 쉬는 날도 장부에 적습니다.', '…창구 옆자리가 비어 있습니다. 앉았다 가십시오.'] },
        { say: '물부터 마실게요', tier: 'good', answer: '좋습니다. 사람도 시듭니다. 시들면 제가 싫습니다.' },
        { say: '괜찮아요, 그냥요', tier: 'meh', face: 'think', answer: '괜찮다는 말은 기록하지 않습니다. 내일 다시 보겠습니다.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}, 오늘이 생일이라고 장부에 있습니다. 축하합니다. 짧게 말해서 미안합니다.',
      replies: [
        { say: '기억해 주셔서 고마워요', tier: 'great', face: 'shy', answer: '기억이 아니라 기록입니다. …둘 다라고 해 두겠습니다. 축하합니다.' },
        { say: '조금만 길게 해 주세요', tier: 'good', face: 'think', answer: '…올해도 시들지 말고, 매일 조금씩. 이게 제가 아는 제일 긴 축하입니다.' },
        { say: '생일은 별거 없어요', tier: 'meh', face: 'calm', answer: '별거 있습니다. 하루 더 쌓인 날이 아니라 한 해가 쌓인 날입니다.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '마을에 혼례 소식이 있습니다. 축하 떡에 들어갈 쌀은 농협에서 냈습니다.',
      replies: [
        { say: '쌀도 축하에 한몫했네요', tier: 'great', face: 'smile', answer: '그렇습니다. 제가 직접 골랐습니다. 금별 쌀입니다. 뿌듯합니다.' },
        { say: '조합장님은 결혼 생각 없어요?', tier: 'good', face: 'shy', answer: '…그건 매입 문의가 아닙니다. 창구에서 받지 않는 질문입니다.' },
        { say: '저는 떡만 먹을래요', tier: 'meh', face: 'laugh', answer: '그래도 됩니다. 떡은 많습니다. 제가 장부로 확인했습니다.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '오늘 마을 소식에 새 기록이 올랐습니다. 기록이 쌓이는 날은 기분이 좋습니다.',
      replies: [
        { say: '서고에도 남겨 두세요', tier: 'great', face: 'smile', answer: '이미 적었습니다. 천 년 뒤에 누가 오늘을 궁금해할지도 모릅니다.' },
        { say: '박물관도 구경 갈래요', tier: 'good', answer: '좋습니다. 진열장 유리는 만지지 마십시오. 지문도 기록입니다.' },
        { say: '저랑은 상관없어요', tier: 'meh', face: 'think', answer: '지금은요. 매일 쌓다 보면 당신 이름도 오를 겁니다.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '{other} 씨를 만났습니까. 도서관에 빌린 책을 아직 안 돌려줬습니다. 백 일째입니다.',
      replies: [
        { say: '대신 말해 드릴게요', tier: 'great', face: 'laugh', answer: '고맙습니다. 그 사람에겐 백 일이 하루라 합니다. 규칙은 규칙입니다.' },
        { say: '책 친구라면서요', tier: 'good', face: 'shy', answer: '친구입니다. 그래서 더 엄격합니다. 친구라고 연체료를 빼 주진 않습니다.' },
        { say: '천천히 돌려주겠죠', tier: 'meh', face: 'calm', answer: '천천히가 천 년이면 곤란합니다. 저도 그만큼은 못 기다립니다.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '{other} 씨 가게에 다녀왔군요. 또 씨앗을 농협보다 싸게 팔았을 겁니다.',
      replies: [
        { say: '농협 씨앗이 발아율은 좋죠', tier: 'great', face: 'smile', answer: '정확합니다. 싼 씨앗은 싸게 자랍니다. 기록이 증명합니다.' },
        { say: '둘이 사이좋게 지내요', tier: 'good', face: 'think', answer: '좋게 지냅니다. 장날마다 다툴 뿐입니다. 그게 사이좋은 겁니다.' },
        { say: '거기가 더 싸던데요', tier: 'meh', face: 'calm', answer: '…알고 있습니다. 가격표를 보십시오. 그리고 봉투 무게도.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 씨가 이번 주 시세 공지를 신문에 실어 줬습니다. 오타 없이.',
      replies: [
        { say: '조합장님 원고가 정확해서죠', tier: 'great', face: 'shy', answer: '…원고는 세 번 검토했습니다. 그래도 공은 그 사람 몫입니다.' },
        { say: '시세는 매주 보고 있어요', tier: 'good', face: 'smile', answer: '좋은 습관입니다. 셋째 면 아래쪽입니다. 작게 실려도 중요합니다.' },
        { say: '신문은 잘 안 봐요', tier: 'meh', face: 'calm', answer: '그럼 게시판이라도 보십시오. 제가 매일 아침 붙입니다.' },
      ],
    },
    {
      id: 'op-maehwa',
      when: { bond: 'maehwa' },
      open: '{other} 씨와 이야기했습니까. 이번 회관 차 모임엔 대추야자차를 가져가려 합니다.',
      replies: [
        { say: '고향 맛 나누는 거네요', tier: 'great', face: 'smile', answer: '그렇습니다. 그 사람은 뭐든 맛있게 마셔 줍니다. 그래서 가져갑니다.' },
        { say: '저도 끼워 주세요', tier: 'good', face: 'think', answer: '모임 규칙상 회원 추천이 필요합니다. …제가 추천하겠습니다.' },
        { say: '차는 다 비슷하던데요', tier: 'meh', face: 'calm', answer: '다릅니다. 이야기가 길어지니 생략합니다. 마셔 보면 압니다.' },
      ],
    },
    {
      id: 'op-tsunade',
      when: { bond: 'tsunade' },
      open: '{other} 선생님을 뵀습니까. 옛 스승님입니다. 아직도 저를 아이 취급하십니다.',
      replies: [
        { say: '그만큼 아끼시는 거죠', tier: 'great', face: 'shy', answer: '…그렇게 받아들이겠습니다. 장부에는 안 적겠습니다. 마음에 적겠습니다.' },
        { say: '무엇을 배웠어요?', tier: 'good', face: 'think', answer: '버티는 법입니다. 모래바람 앞에서도, 장부 앞에서도. 나머지는 생략합니다.' },
        { say: '술 이야기만 하시던데요', tier: 'meh', face: 'laugh', answer: '그것도 가르침입니다. 반면교사라고 합니다. 제가 한 말은 아닙니다.' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '{other} 씨가 과수원 사과를 대 줬습니다. 상자마다 무게가 똑같습니다. 좋습니다.',
      replies: [
        { say: '정직한 사람이네요', tier: 'great', face: 'smile', answer: '그렇습니다. 과일도 사람도 시든 데가 없습니다. 칭찬입니다.' },
        { say: '올해 사과 시세는요?', tier: 'good', face: 'think', answer: '내일 신문에 나옵니다. 하루 먼저 알려 드리는 건… 이번만입니다.' },
        { say: '사과는 별로예요', tier: 'meh', face: 'calm', answer: '그럼 배를 드십시오. 그 사람은 배도 잘 키웁니다.' },
      ],
    },
    {
      id: 'op-sinjjajang',
      when: { bond: 'sinjjajang' },
      open: '{other} 씨를 봤습니까. 오늘 소포가 하나 왔다고 합니다. 봉투 모양이 익숙합니다.',
      replies: [
        { say: '동생분 편지 같아요', tier: 'great', face: 'wow', answer: ['…그런 것 같습니다. 봉투가 또 구겨졌다고 하더군요.', '마감 뒤에 열겠습니다. 업무 중엔 안 됩니다. 규칙입니다.'] },
        { say: '짜장면도 같이 왔대요', tier: 'good', face: 'laugh', answer: '그건 제가 시킨 겁니다. 편지보다 먼저 받겠습니다. 식으니까.' },
        { say: '소포는 별거 없겠죠', tier: 'meh', face: 'calm', answer: '모든 소포는 별거 있습니다. 누가 보냈으니까.' },
      ],
    },
    {
      id: 'op-misun',
      when: { bond: 'misun' },
      open: '{other} 씨와 이야기했군요. 혹시 제 시세표 이야기를 했습니까.',
      replies: [
        { say: '시세가 정확하대요', tier: 'great', face: 'shy', answer: ['…그 사람이 칭찬을 했습니까. 기록해 두겠습니다. 드문 일입니다.', '그래도 내일 또 깎으러 올 겁니다.'] },
        { say: '한 푼만 깎아 달래요', tier: 'good', face: 'laugh', answer: '전해 들은 흥정은 받지 않습니다. 직접 오라고 하십시오. 그래도 안 됩니다.' },
        { say: '별말 없었어요', tier: 'meh', face: 'think', answer: '별말이 없으면 내일 큰 말이 옵니다. 대비하겠습니다.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '{other} 씨를 만났군요. 이번 주 독서 모임 책을 정했다고 하던가요.',
      replies: [
        { say: '두꺼운 책이라던데요', tier: 'great', face: 'smile', answer: ['좋습니다. 두꺼울수록 좋습니다. 일주일이면 됩니다.', '그 사람은 사흘이면 읽습니다. 저는 쪽마다 적으니 늦습니다.'] },
        { say: '저도 같이 읽을래요', tier: 'good', face: 'think', answer: '좋습니다. 서고에 한 권 더 있습니다. 반납은 칠 일 안에.' },
        { say: '책 얘긴 못 들었어요', tier: 'meh', face: 'calm', answer: '그 사람은 책 이야기를 아낍니다. 저처럼. 아니, 저보다.' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: '{other} 씨와 서고 이야기를 하던 참입니다. 백 일째 연체 이야기는 아닙니다.',
      replies: [
        { say: '그럼 무슨 이야기예요?', tier: 'great', face: 'think', answer: ['오래된 마법서 분류 이야기입니다. 그 사람이 직접 본 책이 많습니다.', '…이야기가 길어지니 생략합니다. 연체는 여전합니다.'] },
        { say: '두 분 사이 좋아 보여요', tier: 'good', face: 'shy', answer: '책 친구입니다. 연체만 빼면 좋은 이용자입니다.' },
        { say: '방해했나요?', tier: 'meh', face: 'calm', answer: '아닙니다. 그 사람은 듣다 졸고 있었습니다.' },
      ],
    },
    {
      id: 'op-with-thresh',
      when: { with: 'thresh' },
      open: '{other} 씨와 씨앗 값 이야기 중입니다. 결론은 안 납니다. 매주 그렇습니다.',
      replies: [
        { say: '저는 농협 편이에요', tier: 'great', face: 'laugh', answer: '들었습니까. 증인이 생겼습니다. 장부에 적겠습니다.' },
        { say: '두 분 다 일리 있어요', tier: 'good', face: 'think', answer: '공정하군요. 마음에 듭니다. 그래도 발아율은 농협이 높습니다.' },
        { say: '싼 데서 살래요', tier: 'meh', face: 'sorry', answer: '…자유입니다. 대신 싹이 안 나면 저한테 오십시오. 원인을 기록하겠습니다.' },
      ],
    },
    {
      id: 'op-with-tsunade',
      when: { with: 'tsunade' },
      open: '{other} 선생님과 차를 마시는 중입니다. 차입니다. 정말입니다.',
      replies: [
        { say: '스승님 앞이라 긴장하셨네요', tier: 'great', face: 'shy', answer: ['…티가 납니까. 등이 펴지는 건 어쩔 수 없습니다.', '선생님 앞에선 아직 견습생입니다.'] },
        { say: '저도 한 잔 주세요', tier: 'good', face: 'smile', answer: '대추야자차입니다. 단 걸 싫어하시면 물을 타십시오.' },
        { say: '정말 차 맞아요?', tier: 'meh', face: 'calm', answer: '제 잔은 차입니다. 선생님 잔은 묻지 마십시오.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '오늘 {other} 씨와 말이 엇갈렸습니다. 장부엔 안 적었습니다. 적기 싫었습니다.',
      replies: [
        { say: '내일 먼저 인사해 봐요', tier: 'great', face: 'think', answer: ['…먼저 말입니까. 동생에게도 늘 제가 먼저 썼습니다.', '그렇게 하겠습니다. 어색하면 날씨 이야기부터.'] },
        { say: '무슨 일이었어요?', tier: 'good', face: 'sorry', answer: '사소한 일입니다. 사소한 게 쌓이면 산이 되니 문제입니다.' },
        { say: '그냥 두면 풀려요', tier: 'meh', face: 'calm', answer: '그럴 수도 있습니다. 저는 그냥 두는 게 서툽니다.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring', time: ['dawn', 'day'] },
      open: '봄입니다. 씨앗 매입 장부가 하루에 한 권씩 찹니다. 좋은 계절입니다.',
      replies: [
        { say: '저도 오늘 씨앗 심었어요', tier: 'great', face: 'smile', answer: ['날짜를 적어 두십시오. 싹이 날 때까지 파 보지 말고.', '기다림은 장부가 도와줍니다.'] },
        { say: '봄나물은 언제 캐요?', tier: 'good', face: 'think', answer: '지금입니다. 일주일 늦으면 억셉니다. 시들기 전에.' },
        { say: '봄은 졸려요', tier: 'meh', face: 'calm', answer: '봄 햇살 탓입니다. 사막 햇살은 졸 틈을 안 줬습니다.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', weather: 'sunny' },
      open: '여름 햇볕입니다. 고향 생각이 납니다. 그래도 이건 다정한 편입니다.',
      replies: [
        { say: '물 꼭 챙겨 드세요', tier: 'great', face: 'shy', answer: '…제가 할 말을 당신이 했습니다. 마시겠습니다. 지금.' },
        { say: '사막은 더 더웠죠?', tier: 'good', face: 'think', answer: '그림자도 숨었습니다. 서고가 땅 밑에 있었던 이유입니다.' },
        { say: '더워서 일 못 하겠어요', tier: 'meh', face: 'calm', answer: '그럼 아침에 하십시오. 해는 기다려 주지 않지만 새벽은 기다려 줍니다.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을입니다. 창고에 포대가 산처럼 쌓였습니다. 제일 좋아하는 풍경입니다.',
      replies: [
        { say: '매일 쌓은 결과네요', tier: 'great', face: 'smile', answer: ['그렇습니다. 봄부터 하루도 안 빠졌습니다. 칭찬입니다. 우리 모두에게.', '오늘은 칭찬을 아끼지 않겠습니다.'] },
        { say: '품평회 준비는요?', tier: 'good', face: 'think', answer: '심사표를 다시 썼습니다. 공정합니다. 친해도 봐주지 않습니다.' },
        { say: '포대 나르기 힘들어요', tier: 'meh', face: 'sorry', answer: '수레를 쓰십시오. 농협 수레는 빌려 드립니다. 기록하고.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter', time: ['evening', 'night'] },
      open: '겨울 저녁입니다. 땅이 쉬는 동안 저는 밀린 농서를 읽습니다. 세 권째입니다.',
      replies: [
        { say: '한 권 빌려 주세요', tier: 'great', face: 'smile', answer: ['좋습니다. 반납 기한은 칠 일. 겨울엔 열흘로 해 드립니다.', '추운 날엔 책장이 천천히 넘어갑니다. 이상한 일입니다.'] },
        { say: '쉬지는 않으세요?', tier: 'good', face: 'think', answer: '읽는 게 쉬는 겁니다. 땅도 쉬면서 속을 채웁니다.' },
        { say: '겨울엔 그냥 자요', tier: 'meh', face: 'calm', answer: '그것도 좋습니다. 봄에 일찍 일어나기만 하십시오.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening', weather: ['sunny', 'cloudy'] },
      open: '노을이 모래색입니다. 고향 서고는 이 시각에 문을 닫았습니다.',
      replies: [
        { say: '잠깐 같이 봐요', tier: 'great', face: 'calm', answer: ['…좋습니다. 장부는 잠깐 덮겠습니다.', '동생과 서고 계단에서 이걸 보곤 했습니다. 그 아이는 늘 먼저 일어났습니다.'] },
        { say: '오늘 장부는 맞았어요?', tier: 'good', face: 'smile', answer: '맞았습니다. 한 줄 더 쌓였습니다. 그래서 노을이 더 좋습니다.' },
        { say: '배고파요', tier: 'meh', face: 'laugh', answer: '그럼 가십시오. 저녁은 제때 먹는 겁니다. 규칙입니다.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐립니다. 모종 옮기기 좋은 날입니다. 잎 뒷면에 진딧물도 보십시오.',
      replies: [
        { say: '오늘 바로 옮길게요', tier: 'great', face: 'smile', answer: '좋습니다. 뿌리 흙을 털지 마십시오. 이사도 짐째 하는 게 덜 시듭니다.' },
        { say: '진딧물은 어떻게 잡아요?', tier: 'good', face: 'think', answer: ['물에 비누를 조금. 아니면 무당벌레. 농서 넷째 권에…', '이야기가 길어지니 생략합니다.'] },
        { say: '흐린 날은 우울해요', tier: 'meh', face: 'calm', answer: '작물은 좋아합니다. 사람만 우울합니다. 차라도 드십시오.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me}, 얼굴이 금별 같습니다. 무슨 좋은 일이 있었습니까.',
      replies: [
        { say: '조합장님 보러 와서요', tier: 'great', face: 'shy', answer: '…그런 대답은 장부 어느 칸에 적어야 합니까. 일단 여백에 적겠습니다.' },
        { say: '오늘 일이 잘 풀렸어요', tier: 'good', face: 'smile', answer: '좋습니다. 잘 풀린 날은 적어 두십시오. 안 풀리는 날 꺼내 봅니다.' },
        { say: '그냥 기분이 좋아요', tier: 'meh', face: 'think', answer: '이유 없는 기쁨은 기록하기 어렵습니다. 그래도 좋습니다.' },
      ],
    },
    {
      id: 'op-birthday-news',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 사람이 있습니다. 농협에서 떡 한 판을 보냈습니다. 규칙입니다.',
      replies: [
        { say: '그런 규칙 좋네요', tier: 'great', face: 'smile', answer: ['제가 만들었습니다. 생일은 한 해가 쌓인 날입니다. 그냥 넘기면 안 됩니다.', '동생 생일엔 대추야자를 부칩니다. 매년.'] },
        { say: '떡은 무슨 떡이에요?', tier: 'good', face: 'think', answer: '시루떡입니다. 쌀은 금별입니다. 이것도 규칙입니다.' },
        { say: '저도 떡 주세요', tier: 'meh', face: 'laugh', answer: '당신 생일에 드리겠습니다. 장부에 날짜가 있으면.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관에 다녀왔다고 들었습니다. 오래된 것들을 잘 보고 왔습니까.',
      replies: [
        { say: '화석 앞에 오래 있었어요', tier: 'great', face: 'wow', answer: ['좋습니다. 글자 없는 기록입니다. 오래 볼 가치가 있습니다.', '설명판에 틀린 연대가 하나 있습니다. 제보는 제가 했습니다.'] },
        { say: '조합장님도 자주 가요?', tier: 'good', face: 'smile', answer: '휴일마다 갑니다. 진열 순서가 바뀌면 바로 압니다.' },
        { say: '좀 지루했어요', tier: 'meh', face: 'calm', answer: '처음엔 그렇습니다. 천 년쯤 지나면 재미있어집니다. 비유입니다.' },
      ],
    },
    {
      id: 'op-stock',
      when: { recent: 'stockUp' },
      open: '증권 지점에 다녀왔다고 들었습니다. 오른 숫자는 장부에 적었습니까.',
      replies: [
        { say: '적었어요, 내린 날도요', tier: 'great', face: 'smile', answer: '좋습니다. 오른 날만 적는 장부는 거짓말 장부입니다.' },
        { say: '조합장님도 해요?', tier: 'good', face: 'think', answer: '안 합니다. 저는 흙에 쌓습니다. 흙은 하루 만에 반 토막 나지 않습니다.' },
        { say: '오늘은 운이 좋았어요', tier: 'meh', face: 'calm', answer: '운은 기록이 안 됩니다. 이유를 적어 두십시오.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기 소식이 마을에 돌았습니다. 오래 산 것들은 다 사연이 있습니다.',
      replies: [
        { say: '기록으로 남겨야겠네요', tier: 'great', face: 'smile', answer: ['그렇습니다. 전설도 적지 않으면 그냥 소문입니다.', '날짜, 날씨, 잡은 사람. 세 칸이면 됩니다.'] },
        { say: '몇 살쯤 됐을까요?', tier: 'good', face: 'think', answer: '비늘 테를 세면 압니다. 나무 나이테처럼. 이야기가 길어지니 생략합니다.' },
        { say: '물고기엔 관심 없어요', tier: 'meh', face: 'calm', answer: '저도 매입은 안 합니다. 그래도 기록엔 관심 있습니다.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-book',
      when: { mem: 'book-friend' },
      use: 'book-friend',
      open: '같이 읽겠다던 농서, 기억합니까. 장갑 두 켤레를 준비해 뒀습니다.',
      replies: [
        { say: '오늘 바로 가요', tier: 'great', face: 'smile', answer: '좋습니다. 창가 자리를 맡아 두었습니다. 우연은 아닙니다.' },
        { say: '장갑까지 준비하셨어요?', tier: 'good', face: 'shy', answer: '규칙입니다. …당신 손 크기도 대충 기록해 뒀습니다.' },
        { say: '다음 주에 가도 돼요?', tier: 'meh', face: 'calm', answer: '됩니다. 책은 천 년도 기다렸습니다. 일주일쯤이야.' },
      ],
    },
    {
      id: 'cb-brother',
      when: { mem: 'brother-letter' },
      use: 'brother-letter',
      open: '동생에게 답장을 보냈습니다. 당신 말대로 천천히. 이번엔 당근 이야기를 뺐습니다.',
      replies: [
        { say: '잘하셨어요', tier: 'great', face: 'smile', answer: '답장이 벌써 왔습니다. 성격이 급해서. 덜 화났습니다. 당신 덕입니다.' },
        { say: '대신 뭘 쓰셨어요?', tier: 'good', face: 'think', answer: '감자 이야기입니다. …같은 문제라고 하더군요.' },
      ],
    },
    {
      id: 'cb-compost',
      when: { mem: 'compost-help' },
      use: 'compost-help',
      open: '당신이 얹은 퇴비 한 삽, 장부에 따로 적혀 있습니다. 오늘도 얹겠습니까.',
      replies: [
        { say: '네, 삽 주세요', tier: 'great', face: 'smile', answer: '창고 왼쪽 두 번째입니다. 이제 당신 칸이 두 줄이 됐습니다.' },
        { say: '오늘은 쉬어도 될까요?', tier: 'good', face: 'calm', answer: '됩니다. 쉬는 날도 적습니다. 빈칸이 아니라 쉰 칸입니다.' },
      ],
    },
    {
      id: 'cb-dates',
      when: { mem: 'dates-home' },
      use: 'dates-home',
      open: '대추야자 이야기를 했던 뒤로 시장 과일 상자를 자꾸 들여다봅니다. 당신 탓입니다.',
      replies: [
        { say: '들어오면 제가 사 올게요', tier: 'great', face: 'shy', answer: '…값은 제가 내겠습니다. 아니, 이번엔 받겠습니다. 고맙습니다.' },
        { say: '직접 키워 볼까요?', tier: 'good', face: 'think', answer: ['이 기후에선 어렵습니다. 온실 온도를 맞추려면…', '이야기가 길어지니 생략합니다. 그래도 고려하겠습니다.'] },
      ],
    },
    {
      id: 'cb-helmet',
      when: { mem: 'helmet-ok' },
      use: 'helmet-ok',
      open: '투구가 어울린다고 했던 말. 그 뒤로 거울을 한 번 더 보게 됐습니다.',
      replies: [
        { say: '오늘도 멋있어요', tier: 'great', face: 'shy', answer: '…두 번째입니다. 기록이 쌓이는군요. 곤란합니다.' },
        { say: '귀가 반짝이네요', tier: 'good', face: 'smile', answer: '닦았습니다. 이유는 묻지 마십시오.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라고 했습니까. 장부 여백에 적어 두었습니다. 업무상입니다.',
      replies: [
        { say: '여백에 저도 있네요', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '…여백은 원래 비워 두는 곳입니다. 당신만 예외입니다.' },
        { say: '업무상이요?', tier: 'good', remember: 'taste-heard', face: 'think', answer: '업무상입니다. 매입 품목을 정할 때 참고합니다. …아마도.' },
        { say: '그런 것도 적어요?', tier: 'meh', remember: 'taste-heard', face: 'calm', answer: '전부 적습니다. 서고 사람의 버릇입니다.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-heard' },
      open: '같이 걸었던 날, 순찰 경로가 평소보다 길어졌습니다. 원인 조사 중입니다.',
      replies: [
        { say: '원인은 저 아니에요?', tier: 'great', remember: 'outing-heard', face: 'shy', answer: '…조사 결과는 아직 발표하지 않겠습니다. 규칙입니다.' },
        { say: '또 같이 걸어요', tier: 'good', remember: 'outing-heard', face: 'smile', answer: '좋습니다. 순찰이 아니라 산책으로 적겠습니다.' },
        { say: '다리가 아팠어요', tier: 'meh', remember: 'outing-heard', face: 'calm', answer: '다음엔 짧게 돌겠습니다. 약속은 못 합니다.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: '{me}, 생일이 곧이라고 들었습니다. 날짜를 장부에 적었습니다. 펜으로.',
      replies: [
        { say: '안 잊으시겠네요', tier: 'great', remember: 'bday-heard', face: 'smile', answer: '잊는 건 제 규칙에 없습니다. 그날 창구를 조금 일찍 닫겠습니다.' },
        { say: '선물은 퇴비만 아니면 돼요', tier: 'good', remember: 'bday-heard', face: 'laugh', answer: '…후보에서 하나 지웠습니다. 남은 후보는 비밀입니다.' },
        { say: '조용히 넘어가도 돼요', tier: 'meh', remember: 'bday-heard', face: 'calm', answer: '조용히 축하하겠습니다. 저는 원래 조용합니다.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-heard' },
      open: '당신 방에 다녀온 날을 장부에 적었습니다. 칸 이름은 아직 못 정했습니다.',
      replies: [
        { say: '데이트라고 적어요', tier: 'great', remember: 'date-heard', face: 'shy', answer: '…그 단어는 장부에 없습니다. 지금 생겼습니다. 펜으로.' },
        { say: '방이 정돈돼 있었죠?', tier: 'good', remember: 'date-heard', face: 'smile', answer: '서고처럼 정돈돼 있었습니다. 합격입니다. 두 번 말합니다.' },
        { say: '그냥 방문이라고 해요', tier: 'meh', remember: 'date-heard', face: 'calm', answer: '방문. 알겠습니다. …괄호 안에 조금 더 적겠습니다.' },
      ],
    },
    {
      id: 'cb-wither',
      when: { mem: 'no-wither' },
      use: 'no-wither',
      open: '시든 잎을 바로 따겠다던 약속, 지켜졌습니다. 순찰 중에 확인했습니다.',
      replies: [
        { say: '매일 아침 보고 있어요', tier: 'great', face: 'smile', answer: ['보입니다. 당신 밭은 늘 푸릅니다. 칭찬입니다.', '시드는 걸 안 봐도 되니 순찰이 편합니다. 고맙습니다.'] },
        { say: '검사받는 기분이에요', tier: 'good', face: 'laugh', answer: '검사 맞습니다. 합격입니다. 앞으로도 그렇게.' },
      ],
    },
    {
      id: 'cb-carrot',
      when: { mem: 'carrot-talk' },
      use: 'carrot-talk',
      open: '당근 강의를 끝까지 들은 사람은 당신이 처음이었습니다. 둘째 강의가 있습니다.',
      replies: [
        { say: '오늘도 끝까지 들을게요', tier: 'great', face: 'wow', answer: ['…앉으십시오. 오늘은 무입니다. 무는 원래 바닷가에서 왔다는 설이…', '이야기가 길어지니 생략합니다. 아니, 오늘은 다 하겠습니다.'] },
        { say: '요약본은 없어요?', tier: 'good', face: 'think', answer: '요약하면 무도 대단합니다. 나머지는 서고에 적어 두었습니다.' },
      ],
    },
    {
      id: 'cb-rules',
      when: { mem: 'rule-keeper' },
      use: 'rule-keeper',
      open: '규칙은 지키라고 있다던 당신 말, 게시판 맨 위에 붙였습니다. 이름은 뺐습니다.',
      replies: [
        { say: '이름도 붙여 주세요', tier: 'great', face: 'shy', answer: '…다음 판에 넣겠습니다. 작은 글씨로. 규칙상 작게.' },
        { say: '다들 읽던가요?', tier: 'good', face: 'smile', answer: '읽습니다. 미선 씨는 두 번 읽고 그래도 깎아 달라고 했습니다.' },
      ],
    },
    {
      id: 'cb-old-record',
      when: { mem: 'old-record' },
      use: 'old-record',
      open: '천 년 전 작황 기록 이야기, 기억합니까. 올해 장마가 그 기록과 날짜가 같았습니다.',
      replies: [
        { say: '기록이 미래를 맞혔네요', tier: 'great', face: 'wow', answer: ['맞혔다기보다 반복된 겁니다. 그래도 미리 배수로를 팠습니다.', '옛 장부가 올해 밭을 지켰습니다. 기분이 좋습니다.'] },
        { say: '우연 아니에요?', tier: 'good', face: 'think', answer: '우연도 천 년 쌓이면 법칙이 됩니다. 제 의견입니다.' },
      ],
    },
    {
      id: 'cb-dawn',
      when: { mem: 'dawn-field' },
      use: 'dawn-field',
      open: '새벽 이슬 밭을 같이 걸었던 날 이후로, 새벽 순찰 장부에 칸이 하나 늘었습니다.',
      replies: [
        { say: '그 칸, 계속 채울게요', tier: 'great', face: 'smile', answer: '좋습니다. 이슬 마르기 전에 오십시오. 해가 뜨면 잎이 꾸밉니다.' },
        { say: '요즘은 늦잠 잤어요', tier: 'good', face: 'calm', answer: '알고 있습니다. 빈칸이 있었습니다. 쉬는 칸으로 고쳐 두겠습니다.' },
      ],
    },
    {
      id: 'cb-shell',
      when: { mem: 'shell-record' },
      use: 'shell-record',
      open: '그 암모나이트, 아직 갖고 있습니까. 제 장부엔 당신 이름 옆에 그려 두었습니다.',
      replies: [
        { say: '창가에 두고 매일 봐요', tier: 'great', face: 'shy', answer: '…좋습니다. 매일 보면 소용돌이가 한 바퀴씩 더 보입니다.' },
        { say: '그림도 그리셨어요?', tier: 'good', face: 'think', answer: '기록입니다. 그림이 아닙니다. 소용돌이가 조금 비뚤어졌습니다.' },
      ],
    },
    {
      id: 'cb-library',
      when: { mem: 'lost-library' },
      use: 'lost-library',
      open: '모래에 묻힌 서고 이야기를 한 뒤로, 목록을 다시 쓰기 시작했습니다. 기억나는 책부터.',
      replies: [
        { say: '저도 받아 적을게요', tier: 'great', face: 'wow', answer: ['…좋습니다. 제가 부르면 적으십시오. 첫 권은 물길의 책입니다.', '묻힌 책도 제목이 남으면 완전히 잃은 게 아닙니다.'] },
        { say: '몇 권이나 기억나요?', tier: 'good', face: 'think', answer: '아직 삼백 권입니다. 남은 건 만 권 넘습니다. 매일 조금씩.' },
      ],
    },
    {
      id: 'cb-brother-kind',
      when: { mem: 'brother-kind' },
      use: 'brother-kind',
      open: '급한 만큼 정도 많다던 말, 동생에게 편지로 전했습니다. 답장은 짧았습니다.',
      replies: [
        { say: '뭐라고 왔어요?', tier: 'great', face: 'shy', answer: ['한 줄입니다. 누가 그런 소리를 했냐고.', '…글씨가 평소보다 덜 눌려 있었습니다. 좋아한 겁니다.'] },
        { say: '짧아도 답장이네요', tier: 'good', face: 'smile', answer: '그렇습니다. 그 아이에겐 긴 답장입니다.' },
      ],
    },
    {
      id: 'cb-patient',
      when: { mem: 'patient' },
      use: 'patient',
      open: '기다리는 것도 일이라던 당신. 요즘 밭에서 흙 파 보는 손이 줄었더군요.',
      replies: [
        { say: '장부에 날짜를 세고 있어요', tier: 'great', face: 'smile', answer: '좋습니다. 그 장부, 다 쓰면 보여 주십시오. 칭찬을 미리 해 둡니다.' },
        { say: '사실 한 번 파 봤어요', tier: 'good', face: 'laugh', answer: '…압니다. 흙이 한 군데 다르게 덮여 있었습니다. 넘어가겠습니다.' },
      ],
    },
    {
      id: 'cb-names',
      when: { mem: 'keep-names' },
      use: 'keep-names',
      open: '옛 이름을 알려 주겠다던 약속, 기다리고 있었습니다. 펜은 준비했습니다.',
      replies: [
        { say: '뒷산 바위를 장군바위래요', tier: 'great', face: 'wow', answer: ['장군바위. 적었습니다. 처음 듣는 이름입니다. 귀한 기록입니다.', '이 이름은 이제 안 사라집니다. 당신 덕입니다.'] },
        { say: '아직 못 알아 왔어요', tier: 'good', face: 'calm', answer: '괜찮습니다. 이름은 기다려 줍니다. 부르는 사람만 있으면.' },
      ],
    },
    {
      id: 'cb-club',
      when: { mem: 'reading-club' },
      use: 'reading-club',
      open: '독서 모임 자리를 하나 마련했습니다. 베아트리스 씨가 허락했습니다. 조건부로.',
      replies: [
        { say: '조건이 뭐예요?', tier: 'great', face: 'laugh', answer: ['과자 금지, 한숨 금지, 그리고 그 사람을 꼬마라고 부르지 말 것.', '마지막이 제일 중요하다고 했습니다. 세 번.'] },
        { say: '책은 뭘로 할까요?', tier: 'good', face: 'think', answer: '이번 달은 옛 지도책입니다. 그림이 많습니다. 당신을 배려했습니다.' },
      ],
    },
    {
      id: 'cb-dog',
      when: { mem: 'dog-friend' },
      use: 'dog-friend',
      open: '창구 앞 그 개 말입니다. 오늘은 제 발치에서 잤습니다. 장부 위가 아니라 다행입니다.',
      replies: [
        { say: '이제 식구네요', tier: 'great', face: 'shy', answer: ['식구는 장부에 적어야 합니다. …적었습니다.', '저녁엔 서고 문 앞까지 따라옵니다. 동생 같습니다. 짖는 게.'] },
        { say: '밥은 챙겨 주세요?', tier: 'good', face: 'smile', answer: '하루 두 번입니다. 정해진 시각에. 그 개가 저보다 시간을 잘 압니다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '장부의 첫 줄',
      hint: '한 번 이야기를 나누면 나세라가 장부에 새 줄을 써요.',
      need: { days: 1 },
      scene: [
        '나세라가 두꺼운 장부를 펼치고 펜 뚜껑을 연다. 자칼 귀 투구가 살짝 기운다.',
        '"이름을 말하십시오. 아니, 압니다. {me}. 적겠습니다."',
        '펜 끝이 종이를 긁는 소리만 창구에 남는다. 글씨가 반듯하다.',
        '"이 장부에 적힌 건 오래 남습니다. 서고에서 배운 겁니다."',
        '책상 구석에 구겨진 봉투 하나가 펴진 채 눌려 있다. 글씨가 거칠다.',
        '"…그건 동생 편지입니다. 신경 쓰지 마십시오. 늘 화가 나 있습니다."',
        '"농협 규칙은 게시판에 있습니다. 제일 중요한 건 하나입니다."',
        '"매일 조금씩. 그걸 지키면 나머지는 따라옵니다."',
        '그녀가 장부를 덮으려다 멈추고, 이름 옆에 작은 점을 하나 찍는다.',
        '"점은 표시입니다. 오늘 처음 온 사람. 잊지 않으려고."',
      ],
      replies: [
        { say: '매일 조금씩, 지킬게요', tier: 'great', face: 'smile', answer: ['좋습니다. 첫 줄에 동그라미를 쳤습니다. 이건 드문 일입니다.', '점 위에 동그라미. 장부에선 꽤 높은 등급입니다.'] },
        { say: '규칙이 하나뿐이에요?', tier: 'good', face: 'think', answer: '제일 중요한 게 하나입니다. 나머지는 마흔일곱 개입니다.' },
        { say: '장부는 좀 무섭네요', tier: 'meh', face: 'calm', answer: '무섭지 않습니다. 정직할 뿐입니다. 익숙해질 겁니다.' },
      ],
    },
    {
      title: '이슬 마르기 전',
      hint: '새벽(게임 시각 새벽 다섯 시부터 아침 여덟 시) 텃밭에 가 보세요. 나세라가 이슬 순찰을 돌아요.',
      need: { days: 3, points: 20, visit: { area: 'farm', from: 5, to: 8 } },
      scene: [
        '새벽 텃밭. 이슬이 이랑마다 맺혀 있다. 나세라가 허리를 숙여 잎을 들여다본다.',
        '"왔군요. 이 시간 잎 색이 제일 정직합니다. 해가 뜨면 다들 꾸밉니다."',
        '그녀가 시든 잎 하나를 조심스럽게 따서 주머니에 넣는다.',
        '"버리지 않습니다. 퇴비 더미에 얹습니다. 시든 것도 다음 흙이 됩니다."',
        '"사막에선 아무것도 오래 푸르지 않았습니다. 그래서 시드는 게 싫습니다."',
        '그녀가 잠시 말을 멈추고 이랑 끝을 본다. 해가 아직 산 뒤에 있다.',
        '"서고 입구에 동생이 가꾸던 작은 밭이 있었습니다. 수수 몇 줄."',
        '"모래가 덮던 날, 그 아이가 맨손으로 수수를 붙잡고 있었습니다."',
        '"다 시들었습니다. 그 뒤로 그 아이는 화를 내고, 저는 기록을 했습니다."',
        '이슬 한 방울이 그녀의 투구 귀 끝에서 떨어진다.',
        '"…이건 순찰 기록에 안 적는 이야기입니다."',
      ],
      replies: [
        { say: '여긴 제가 같이 지킬게요', tier: 'great', remember: 'dawn-field', face: 'wow', answer: ['…같이 말입니까. 그럼 순찰 장부에 이름을 하나 더 적겠습니다.', '여기 밭은 시들게 두지 않겠습니다. 둘이면 됩니다.'] },
        { say: '이슬이 예쁘네요', tier: 'good', remember: 'dawn-field', face: 'smile', answer: '예쁩니다. 그리고 금방 마릅니다. 그래서 이 시간에 옵니다.' },
        { say: '너무 일찍이에요', tier: 'meh', remember: 'dawn-field', face: 'calm', answer: '그래도 왔습니다. 그게 중요합니다. 내려가서 주무십시오.' },
      ],
    },
    {
      title: '소용돌이 기록',
      hint: '나세라가 오래된 화석을 기록하고 싶대요. 광산에서 암모나이트 화석을 찾아 가져가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'fossil-shell' } },
      scene: [
        '암모나이트 화석을 내밀자 나세라가 펜을 내려놓는다. 한참 말이 없다.',
        '"…이건 서고의 어떤 기록보다 오래됐습니다. 글자 없는 기록입니다."',
        '그녀가 돋보기를 꺼내 소용돌이를 한 바퀴씩 따라가며 장부에 옮긴다.',
        '"한 겹씩 쌓아서 이 모양이 됐습니다. 매일 조금씩. 수백만 년 동안."',
        '"이걸 만든 생물 이름은 아무도 모릅니다. 그래도 모양은 남았습니다."',
        '그녀가 펜을 쥔 손에 힘을 준다. 글씨가 조금 진해진다.',
        '"저는 시드는 것도 싫지만, 잊히는 게 더 싫습니다."',
        '"동생이 편지에 씁니다. 누나는 책만 기억하고 사람은 잊는다고."',
        '"…틀린 말은 아닙니다. 그래서 요즘은 사람도 적습니다."',
        '"받지는 않겠습니다. 기록했으니 됐습니다. 당신이 가지십시오."',
        '"대신 장부에는 이렇게 적었습니다. 가져온 사람, {me}."',
      ],
      replies: [
        { say: '기록에 제 이름이 남네요', tier: 'great', remember: 'shell-record', face: 'smile', answer: ['남습니다. 천 년 뒤에 누가 읽어도 당신 이름이 나옵니다.', '잊히지 않게. 그게 제가 할 수 있는 일입니다.'] },
        { say: '동생분 말은 틀렸어요', tier: 'good', remember: 'shell-record', face: 'shy', answer: '…그렇게 말해 주니 고맙습니다. 그 아이에게도 언젠가 증명하겠습니다.' },
        { say: '그냥 돌 같던데요', tier: 'meh', remember: 'shell-record', face: 'calm', answer: '돌이 아닙니다. …이야기가 길어지니 생략합니다. 소중히 하십시오.' },
      ],
    },
    {
      title: '쌓인 것들',
      hint: '나세라와 평소 이야기하다 매일 조금씩 쌓는 게 좋다고 답해 보세요. 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'stack-daily' },
      scene: [
        '창고 뒤편. 나세라가 천을 걷자 낡은 장부들이 탑처럼 쌓여 있다.',
        '"이 마을에 와서 쓴 장부입니다. 하루도 빠지지 않았습니다."',
        '"서고를 떠날 때 모든 걸 두고 왔습니다. 그래서 여기서 다시 쌓았습니다."',
        '장부 탑 옆에 끈으로 묶은 봉투 다발이 따로 있다. 우표가 없다.',
        '"…동생에게 쓴 답장입니다. 매일 한 통. 부친 건 그중 몇 통뿐입니다."',
        '"모래가 오던 날, 그 아이는 서고 문을 닫으러 남았습니다. 저는 책을 들고 나왔고."',
        '"그 아이가 늦게 빠져나왔을 때, 저는 미안하다는 말 대신 책 수를 셌습니다."',
        '"그 뒤로 화를 냅니다. 화낼 만합니다. 그래서 이 봉투들을 못 부칩니다."',
        '"당신이 매일 조금씩이 좋다고 했을 때, 이걸 보여 줘도 되겠다고 생각했습니다."',
        '그녀가 맨 위 장부를 펼친다. 여러 칸에 같은 이름이 적혀 있다. {me}.',
        '"이것도 쌓인 겁니다. 이건 부칠 필요가 없어서 다행입니다."',
      ],
      replies: [
        { say: '봉투, 하나만 부쳐 봐요', tier: 'great', face: 'think', answer: ['…하나만. 가장 최근 것으로.', '신짜장 씨에게 맡기겠습니다. 구겨지지 않게 부탁해서.'] },
        { say: '제 이름이 이렇게 많았어요?', tier: 'good', face: 'shy', answer: '…업무상입니다. 매입 기록입니다. 대부분은. 나머지는 묻지 마십시오.' },
        { say: '먼지가 많아요', tier: 'meh', face: 'calm', answer: '먼지도 시간입니다. 털지 않겠습니다.' },
      ],
    },
    {
      title: '매입 품목이 아닌 것',
      hint: '나세라와 아주 가까워지면 그녀가 장부에 없는 칸 이야기를 해요. 꽃다발을 생각해 두세요.',
      need: { days: 13, points: 96 },
      scene: [
        '창구 마감 뒤. 나세라가 투구를 벗어 책상 위에 내려놓는다. 처음 보는 모습이다.',
        '책상 위에 구겨지지 않은 봉투 하나. 동생 글씨다.',
        '"답장이 왔습니다. 부친 지 이틀 만에. 성격이 급해서."',
        '"화를 안 냈습니다. 한 줄입니다. 누나가 웃는다니 됐다, 라고."',
        '"…제가 웃는다고 누가 썼는지 물었습니다. 저는 당신 이야기를 썼습니다."',
        '그녀가 봉투를 장부 맨 앞장 사이에 조심스럽게 끼운다.',
        '"{me}. 하나 말해 두겠습니다. 꽃다발은 농협 매입 품목이 아닙니다."',
        '"그래서 장부에 칸이 없습니다. 값을 매길 수도 없습니다."',
        '"…그런데 누가 가져온다면, 저는 그래도 기록할 겁니다. 따로, 펜으로."',
        '그녀가 시선을 장부로 내린다. 귀 끝이 조금 붉다.',
        '"꽃은 시듭니다. 그래도 기록하면 안 잊힙니다. 그러니 괜찮습니다."',
        '"이건 규칙이 아닙니다. 그냥 말해 둡니다."',
      ],
      replies: [
        { say: '칸은 제가 만들게요', tier: 'great', remember: 'letter-sent', face: 'shy', answer: ['…좋습니다. 꽃이 시들기 전에 오십시오. 시드는 건 싫습니다.', '동생에게도 그렇게 전하겠습니다. 다음 편지에.'] },
        { say: '어떤 꽃을 좋아해요?', tier: 'good', remember: 'letter-sent', face: 'think', answer: '사막에서 피는 꽃은 드뭅니다. 그러니 무엇이든 귀합니다. 힌트입니다.' },
        { say: '투구 벗으니 낯설어요', tier: 'meh', remember: 'letter-sent', face: 'calm', answer: '저도 낯섭니다. 다시 쓰겠습니다. …잠깐만 더 있다가.' },
      ],
    },
    {
      title: '두 사람의 장부',
      hint: '나세라와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '나세라가 새 장부 한 권을 내민다. 표지에 아무것도 쓰여 있지 않다.',
        '"새 규칙을 하나 만들었습니다. 이 장부는 둘이 씁니다. 하루에 한 줄씩."',
        '"첫 줄은 제가 썼습니다. 오늘 날씨, {weather}. 함께 있었던 사람, {me}."',
        '"둘째 장엔 동생 편지를 붙였습니다. 허락은 받았습니다. 화내면서."',
        '편지 귀퉁이에 거친 글씨가 보인다. 누나 잘 부탁한다.',
        '"모래에 묻힌 서고는 못 꺼냈습니다. 대신 여기서 새 서고를 쌓았습니다."',
        '"천 년 치 기록을 다 읽어 봤지만, 이렇게 쓰고 싶은 장부는 처음입니다."',
        '그녀가 펜을 건넨다. 손이 조금 떨린다.',
        '"이 장부는 잊히지 않을 겁니다. 매일 쓰니까. 시들지도 않을 겁니다."',
        '"끝 장에는 빈칸을 남겨 두었습니다. 반지 하나 들어갈 만큼."',
        '"서두르진 않습니다. 기다리는 건 제 특기입니다. 그래도 너무 오래는 말고."',
      ],
      replies: [
        { say: '매일 한 줄씩, 평생 쓸게요', tier: 'great', face: 'shy', answer: ['…평생. 그 말을 첫 장 맨 위에 옮겨 적겠습니다. 지울 수 없게.', '동생에게도 알리겠습니다. 이번엔 바로 부칩니다.'] },
        { say: '빈칸, 제가 채울게요', tier: 'good', face: 'smile', answer: '기다리겠습니다. 매일 조금씩 쌓다 보면 그날도 옵니다.' },
        { say: '글씨가 못생겨서 걱정이에요', tier: 'meh', face: 'laugh', answer: '상관없습니다. 정직한 글씨면 됩니다. 당신 글씨는 정직합니다.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분히 쌓였습니다. 내일 창구에서 봅시다.',
    '또 왔군요. 싫지는 않습니다. 용건은 내일 하십시오.',
    '장부를 덮었습니다. 할 말이 남았다면 내일 한 줄로.',
    '물은 줬습니까. 그것만 확인하고 가십시오.',
    '이야기가 길어지니 오늘은 생략합니다. 내일 이어서.',
    '오늘 대화는 장부에 적었습니다. 두 번 적을 칸은 없습니다.',
    '창구는 닫았습니다. 그래도 인사는 받겠습니다. 조심히 가십시오.',
    '동생 답장을 쓰러 갑니다. 오늘은 당근 이야기를 빼겠습니다.',
    '시든 잎 하나 없이 하루가 갔습니다. 좋은 날입니다.',
  ],
};
