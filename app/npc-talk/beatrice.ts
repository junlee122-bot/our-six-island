// 베아트리스 — 언덕 도서관 사서, 수백 년 동안 도서관을 지켜 온 대정령(성인).
// 도도하고 까칠한데 정이 많은 반말. 모든 문장을 "~인 거야 / ~는 거야"로 끝내고
// 자기를 "베티"라 부른다. 연체에 가장 엄격하고, 책을 소중히 다루는 사람에게만
// 마음을 연다. 돌돌 만 머리, 꽃차와 단 과자와 화석, 밤이면 잠기는 닫힌 서고 문,
// 오래 기다린 "그 사람"과의 약속. 나세라와 독서 모임, 하쿠는 강 이야기 책 단골,
// 힘멜은 시끄럽다고 경고, 야니네코는 잔다고 쫓아낸다. 원작 대사는 쓰지 않는다.
// 이야기 줄기: 옛 주인이 남긴 책 한 권("그 사람이 오면 알게 될 것") — 대출증,
// 밤에 잠기는 문, 남이 우려 준 꽃차, 찢어진 그 책을 함께 고치기, 빈 페이지의
// 깨달음(알게 되는 게 아니라 고르는 것), 첫 장에 두 이름을 쓰는 계약.
import type { NpcTalkBook } from './types.ts';

export const BEATRICE_TALK: NpcTalkBook = {
  npc: 'beatrice',
  memories: {
    'never-late': '연체는 절대 안 하겠다고 약속했어요',
    'book-care': '책을 소중히 다룬다고 했어요',
    'tea-sweet': '꽃차에 단 과자를 곁들이자고 했어요',
    'fossil-fan': '화석 이야기를 좋아한다고 했어요',
    'curl-praise': '돌돌 만 머리가 멋지다고 했어요',
    'door-curious': '닫힌 서고 문을 궁금해했어요',
    'that-person': '오래 기다린 사람 이야기를 들었어요',
    'quiet-reader': '조용히 읽는 게 좋다고 했어요',
    'book-club': '수요일 독서 모임에 가 보기로 했어요',
    'brother': '먼 데 계신 오라버니 이야기를 들었어요',
    'bookmark': '책갈피를 꼭 쓰겠다고 했어요',
    'door-trick': '문을 이어 두는 장난 이야기를 들었어요',
    'library-card': '베티의 대출증을 처음 만들었어요',
    'night-shelf': '밤의 서고에서 잠긴 문 앞에 함께 섰어요',
    'tea-gift': '꽃차를 선물했어요',
    'mended-book': '찢어진 책을 함께 고쳤어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'date-talk': '방에서 함께 보낸 날을 이야기했어요',
    'bday-plan': '생일에 책 한 권을 골라 준대요',
    'no-spoiler': '결말은 끝까지 읽고 만나겠다고 했어요',
    'river-book': '사라진 강 이야기를 함께 궁금해했어요',
    'no-snail': '창틀 달팽이를 옮겨 주기로 했어요',
    'quiet-window': '여름 창문에 발을 쳐 주기로 했어요',
    'jam-talk': '잼은 듬뿍 바르는 게 좋다고 했어요',
    'long-lived': '빵집 사장과 오래된 사이라는 걸 들었어요',
    'not-alone': '자주 말 걸러 오겠다고 했어요',
    'call-betty': '처음으로 베티라고 불렀어요',
    'book-breath': '책들이 숨 쉬는 소리를 같이 들었어요',
    'fav-genre': '좋아할 책을 골라 달라고 했어요',
    'old-keeper': '도서관 옛 주인 이야기를 들었어요',
    'ribbon': '드레스 리본을 묶어 줬어요',
    'pumpkin-pie': '호박파이를 만들어 주기로 했어요',
    'post-help': '연체 도서 회수를 돕기로 했어요',
    'season-books': '계절마다 읽는 책 이야기를 들었어요',
    'betty-diary': '대출 장부가 일기라는 걸 들었어요',
    'small-promise': '내일도 오겠다고 작은 약속을 했어요',
    'read-aloud': '동화책을 소리 내 읽어 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
  },
  talks: [
    {
      id: 'overdue',
      open: '{me}, 연체가 왜 나쁜지 아는 거야? 책은 다음 사람을 기다리는 거야.',
      replies: [
        { say: '절대 연체 안 할게', tier: 'great', remember: 'never-late', face: 'smile', answer: ['말로는 다들 그러는 거야.', '…그래도 너는 믿어 보는 거야. 장부에 별표를 쳐 두는 거야.'] },
        { say: '하루쯤은 괜찮지 않아?', tier: 'meh', face: 'sorry', answer: '하루가 쌓여서 백 년이 되는 거야. 베티는 다 기억하는 거야.' },
        { say: '다음 사람이 누군데?', tier: 'good', face: 'think', answer: ['그건 비밀인 거야.', '그래도 기다리는 마음은 다 같은 거야. 베티가 제일 잘 아는 거야.'] },
      ],
    },
    {
      id: 'dog-ear',
      open: '책장을 접어서 읽던 데를 표시하는 사람이 있는 거야. 끔찍한 거야.',
      replies: [
        { say: '난 책갈피 써', tier: 'great', remember: 'bookmark', face: 'wow', answer: ['…제법인 거야. 책갈피를 쓰는 사람은 드문 거야.', '칭찬하는 거야. 두 번은 안 하는 거야.'] },
        { say: '읽던 데를 외우면 되지', tier: 'good', remember: 'book-care', answer: '그것도 책을 아끼는 방법인 거야. 머리가 좋은 거야.' },
        { say: '접는 게 편한데', tier: 'meh', face: 'sorry', answer: '편한 게 문제인 거야. 그 책은 평생 그 자국을 기억하는 거야.' },
      ],
    },
    {
      id: 'tea-time',
      open: '꽃차를 우린 거야. 과자도 있는 거야. 딱히 나눠 주려던 건 아닌 거야.',
      replies: [
        { say: '과자랑 같이 마시자', tier: 'great', remember: 'tea-sweet', face: 'shy', answer: ['…어쩔 수 없는 거야. 한 잔만인 거야.', '과자는 반만 주는 거야. 큰 쪽은 베티 거인 거야.'] },
        { say: '향이 좋다', tier: 'good', answer: '언덕 꽃을 말린 거야. 코가 좋은 사람은 싫지 않은 거야.' },
        { say: '난 커피가 좋아', tier: 'meh', face: 'calm', answer: '쓴 걸 왜 마시는지 모르겠는 거야. 수백 년째 모르겠는 거야.' },
      ],
    },
    {
      id: 'fossil',
      open: '이 고사리 화석은 베티보다 훨씬 나이가 많은 거야. 놀라운 거야.',
      replies: [
        { say: '화석 이야기 더 해 줘', tier: 'great', remember: 'fossil-fan', face: 'wow', answer: ['돌 속에 잎맥이 그대로 남은 거야. 아무도 안 읽은 책 같은 거야.', '…들어 주는 사람이 있으니 말이 길어지는 거야.'] },
        { say: '베티는 몇 살인데?', tier: 'meh', face: 'sorry', answer: '숙녀한테 그런 걸 묻는 게 아닌 거야. 대출 정지인 거야.' },
        { say: '돌이 예쁘네', tier: 'good', answer: '돌이 아니라 기록인 거야. 그래도 예쁜 건 맞는 거야.' },
      ],
    },
    {
      id: 'curls',
      open: '…왜 머리를 쳐다보는 거야. 이 모양은 매일 아침 공들이는 거야.',
      replies: [
        { say: '돌돌 말린 게 멋져', tier: 'great', remember: 'curl-praise', face: 'shy', answer: ['다, 당연한 거야. 베티의 머리는 언제나 흠잡을 데 없는 거야.', '…흥인 거야. 칭찬은 받아 두는 거야.'] },
        { say: '당겨 보고 싶다', tier: 'meh', face: 'sorry', answer: '손대면 서고 밖으로 날려 버리는 거야. 진심인 거야.' },
        { say: '얼마나 걸려?', tier: 'good', face: 'think', answer: '한 시간인 거야. 아침 해보다 먼저 일어나야 하는 거야.' },
      ],
    },
    {
      id: 'closed-door',
      open: '저 안쪽 문은 밤이 되면 저절로 잠기는 거야. 궁금해도 소용없는 거야.',
      replies: [
        { say: '안에 뭐가 있는데?', tier: 'good', remember: 'door-curious', face: 'think', answer: '아주 오래된 책들인 거야. 베티가 지키는 약속도 있는 거야.' },
        { say: '베티가 지키는 거면 됐어', tier: 'great', remember: 'door-curious', face: 'shy', answer: ['…묻지 않는 사람은 처음인 거야.', '그래서 오히려 더 말해 주고 싶어지는 거야. 이상한 거야.'] },
        { say: '몰래 들어가 볼까', tier: 'meh', face: 'sorry', answer: '문이 너를 엉뚱한 데로 보내 버리는 거야. 우물 속 같은 데인 거야.' },
      ],
    },
    {
      id: 'that-person',
      open: '베티는 누군가를 기다리는 거야. 아주 오래전 약속인 거야.',
      replies: [
        { say: '어떤 사람인데?', tier: 'great', remember: 'that-person', face: 'think', answer: ['얼굴도 이름도 모르는 거야. 오면 알 거라고만 들은 거야.', '…바보 같은 약속인 거야. 그래도 지키는 거야.'] },
        { say: '오래 기다렸겠다', tier: 'good', remember: 'that-person', answer: '수백 년인 거야. 책이 많아서 지루하진 않았던 거야. 정말인 거야.' },
        { say: '그냥 포기해', tier: 'meh', face: 'sorry', answer: '…약속은 포기하는 게 아닌 거야. 너는 모르는 거야.' },
      ],
    },
    {
      id: 'himmel-noise',
      open: '힘멜이 또 도서관에서 자기 동상 이야기를 크게 한 거야. 경고인 거야.',
      replies: [
        { say: '도서관에선 조용히지', tier: 'great', remember: 'quiet-reader', face: 'smile', answer: '말이 통하는 거야. 너한테는 경고장 안 쓰는 거야.' },
        { say: '힘멜 재밌잖아', tier: 'meh', face: 'calm', answer: '재미는 바깥에서 보는 거야. 여기선 책이 놀라는 거야.' },
        { say: '내가 대신 말해 줄게', tier: 'good', face: 'wow', answer: ['…부탁하는 거야.', '베티 말은 그 귀에 안 들어가는 모양인 거야. 빵 반죽만 들어가는 거야.'] },
      ],
    },
    {
      id: 'cat-nap',
      open: '고양이 귀 대학생이 서가 사이에서 또 자고 있었던 거야. 질린 거야.',
      replies: [
        { say: '담요라도 덮어 줬어?', tier: 'great', face: 'shy', answer: ['…덮어 준 거야. 감기 걸리면 책에 재채기하니까인 거야.', '그것뿐인 거야. 다른 이유는 없는 거야.'] },
        { say: '도서관이 편한가 봐', tier: 'good', answer: '편한 건 좋은 거야. 그래도 침대는 아닌 거야.' },
        { say: '나도 자고 싶다', tier: 'meh', face: 'sorry', answer: '너까지 그러면 베티는 울어 버리는 거야. 아니, 화내는 거야.' },
      ],
    },
    {
      id: 'brother',
      open: '오라버니는 베티보다 훨씬 대단한 정령인 거야. 털도 보송한 거야.',
      replies: [
        { say: '보고 싶겠다', tier: 'great', remember: 'brother', face: 'shy', answer: ['…조금인 거야. 아주 조금인 거야.', '먼 데 계셔도 편지는 오는 거야. 늘 꽃 냄새가 나는 거야.'] },
        { say: '털이 보송하다고?', tier: 'good', face: 'laugh', answer: '고양이 같은 모습일 때가 있는 거야. 무척 귀여운 거야.' },
        { say: '베티가 더 대단해', tier: 'meh', face: 'think', answer: '그건 아닌 거야. 오라버니를 모르니까 하는 말인 거야.' },
      ],
    },
    {
      id: 'book-club',
      open: '수요일 독서 모임에 자리가 하나 비는 거야. 딱히 너를 부르는 건 아닌 거야.',
      replies: [
        { say: '그 자리 내가 맡을게', tier: 'great', remember: 'book-club', face: 'smile', answer: ['…늦으면 안 되는 거야. 책은 다 읽고 오는 거야.', '기다리는 거야. 아니, 자리가 기다리는 거야.'] },
        { say: '무슨 책 읽어?', tier: 'good', answer: '이번엔 나세라가 고른 농사 기록인 거야. 의외로 재밌는 거야.' },
        { say: '난 듣기만 할게', tier: 'meh', face: 'calm', answer: '안 읽은 사람은 차만 마시는 거야. 그것도 규칙인 거야.' },
      ],
    },
    {
      id: 'door-trick',
      open: '아무 문이나 열었는데 여기가 나온 적 있는 거야? 베티 짓인 거야.',
      replies: [
        { say: '그래서 자꾸 오게 되는구나', tier: 'great', remember: 'door-trick', face: 'laugh', answer: ['…그건 네 발로 온 거야.', '문은 그렇게까지 안 하는 거야. 아마인 거야.'] },
        { say: '편하겠다', tier: 'good', answer: '편한 거야. 그래도 아무한테나 이어 주진 않는 거야.' },
        { say: '그거 무섭잖아', tier: 'meh', face: 'sorry', answer: '무서운 게 아니라 친절한 거야. 다들 오해하는 거야.' },
      ],
    },
    {
      id: 'contract',
      when: { ch: 3 },
      open: '{me}, 약속이란 건 책 맨 앞장에 쓰는 이름 같은 거라고 생각하는 거야.',
      replies: [
        { say: '내 이름도 써 줄래?', tier: 'great', face: 'shy', answer: ['…이미 쓴 거야. 연필로인 거야.', '지울 생각은 없는 거야. 연필인 건 그냥 버릇인 거야.'] },
        { say: '지울 수도 있어?', tier: 'good', face: 'think', answer: '지울 수는 있는 거야. 자국은 남는 거야. 그게 약속인 거야.' },
        { say: '어려운 얘기다', tier: 'meh', face: 'calm', answer: '쉬운 약속은 없는 거야. 그래서 귀한 거야.' },
      ],
    },
    {
      id: 'last-page',
      open: ['{me}, 책을 마지막 장부터 펴 보는 버릇이 있는 거야?', '신이치가 그러는 걸 보고 찻잔을 떨어뜨릴 뻔한 거야.'],
      replies: [
        { say: '첫 장부터 차례대로 읽어', tier: 'great', remember: 'no-spoiler', face: 'smile', answer: ['그게 책에 대한 예의인 거야.', '결말은 끝까지 걸어온 사람한테만 웃어 주는 거야.'] },
        { say: '궁금하면 못 참겠어', tier: 'meh', face: 'sorry', answer: ['…신이치랑 똑같은 거야.', '그럼 베티가 책 끝을 리본으로 묶어 두는 거야. 각오하는 거야.'] },
        { say: '베티는 어떻게 읽어?', tier: 'good', face: 'think', answer: '한 장에 차 한 모금인 거야. 결말까지 딱 한 주전자인 거야.' },
      ],
    },
    {
      id: 'river-book',
      open: ['하쿠가 빌려 가는 책은 늘 사라진 강 이야기인 거야.', '옛날엔 언덕 아래로 강이 흘렀다고 적혀 있는 거야.'],
      replies: [
        { say: '그 강 지금은 어디 있어?', tier: 'great', remember: 'river-book', face: 'think', answer: ['과수원 아래로 숨어 버린 거야. 땅속에서 아직 흐르는 거야.', '하쿠는 그 물소리를 듣고 사과나무를 키운다는 거야.', '…조금 부러운 이야기인 거야.'] },
        { say: '하쿠는 책을 잘 돌려줘?', tier: 'good', face: 'smile', answer: '한 번도 늦은 적 없는 거야. 책장에 물기 하나 없는 거야. 모범인 거야.' },
        { say: '강은 다 비슷하지 않아?', tier: 'meh', face: 'calm', answer: '같은 강은 두 번 없는 거야. 책도 두 번째 읽으면 다른 책인 거야.' },
      ],
    },
    {
      id: 'snail',
      open: '창틀에 달팽이가 붙어 있었던 거야. 비 온 다음 날마다 오는 거야.',
      replies: [
        { say: '내가 옮겨 줄게', tier: 'great', remember: 'no-snail', face: 'shy', answer: ['…부탁하는 거야. 멀리, 아주 멀리 풀숲 쪽으로인 거야.', '손은 꼭 씻고 오는 거야. 그다음에 고맙다고 하는 거야.'] },
        { say: '달팽이 귀엽잖아', tier: 'meh', face: 'sorry', answer: '책 귀퉁이를 갉아 먹은 전과가 있는 거야. 귀여움으론 용서 안 되는 거야.' },
        { say: '왜 그렇게 싫은데?', tier: 'good', face: 'think', answer: ['기어간 자국이 반짝이는 거야.', '책 위에 그 자국이 남으면 영영 안 지워지는 거야. 그래서인 거야.'] },
      ],
    },
    {
      id: 'cicada',
      open: '한여름 매미는 도서관 창문에 붙어서 우는 거야. 독서 방해인 거야.',
      replies: [
        { say: '창문에 발을 쳐 둘까?', tier: 'great', remember: 'quiet-window', face: 'wow', answer: ['…발인 거야? 바람은 들고 소리는 줄어드는 거야.', '제법 쓸 만한 생각인 거야. 여름이 오면 같이 다는 거야.'] },
        { say: '여름 소리잖아', tier: 'good', face: 'think', answer: '그건 아는 거야. 가을엔 귀뚜라미, 겨울에야 조용한 거야. 그래서 겨울이 좋은 거야.' },
        { say: '잡아다 줄까?', tier: 'meh', face: 'sorry', answer: '잡아 오면 더 가까이서 우는 거야! 절대 안 되는 거야.' },
      ],
    },
    {
      id: 'jam',
      open: ['비스킷에 잼을 얼마나 바르는 거야?', '베티는 비스킷이 안 보일 만큼인 거야. 그게 정답인 거야.'],
      replies: [
        { say: '나도 듬뿍 발라', tier: 'great', remember: 'jam-talk', face: 'laugh', answer: ['…취향이 맞는 거야. 드문 일인 거야.', '다음에 잼 병을 열 때 숟가락 하나 더 꺼내 두는 거야.'] },
        { say: '얇게 바르는 게 좋아', tier: 'good', face: 'think', answer: '얇게 바르면 비스킷 맛이 사는 거야. 그것도 학설인 거야. 인정만 하는 거야.' },
        { say: '단 건 별로야', tier: 'meh', face: 'calm', answer: '…수백 년 살면서 그런 말은 몇 번 못 들은 거야. 신기한 거야.' },
      ],
    },
    {
      id: 'old-friend-cafe',
      open: ['빵집 카페 사장도 베티만큼 오래 산 거야.', '오래 산 사람끼리는 말이 짧은 거야. 차만 마시고 오는 거야.'],
      replies: [
        { say: '말 안 해도 편한 사이구나', tier: 'great', remember: 'long-lived', face: 'smile', answer: ['그런 거야. 십 년쯤 안 봐도 어제 본 것 같은 거야.', '…너는 그렇게 오래 안 오면 안 되는 거야. 너는 다른 거야.'] },
        { say: '거기서 무슨 차 마셔?', tier: 'good', answer: '거기선 홍차인 거야. 꽃차는 베티가 직접 우린 게 제일인 거야.' },
        { say: '둘이 몇 살이야?', tier: 'meh', face: 'sorry', answer: '숙녀 둘한테 한꺼번에 실례인 거야. 대출 정지 두 배인 거야.' },
      ],
    },
    {
      id: 'used-to-alone',
      open: ['혼자 있는 건 익숙한 거야. 책은 말을 안 거니까 편한 거야.', '…왜 그런 얼굴로 보는 거야.'],
      replies: [
        { say: '그래도 내가 말 걸러 올게', tier: 'great', remember: 'not-alone', face: 'shy', answer: ['…시끄럽지만 않으면 되는 거야.', '책도 가끔은 누가 소리 내 읽어 주길 바라는 거야.', '베티 말이 아닌 거야. 책 말인 거야.'] },
        { say: '익숙한 거랑 좋은 건 달라', tier: 'good', face: 'think', answer: ['…그런 말은 어디서 배운 거야.', '반박할 책을 찾아보는 거야. 아마 없는 거야.'] },
        { say: '혼자가 편하면 다행이네', tier: 'meh', face: 'calm', answer: '…그런 거야. 다행인 거야. 정말인 거야.' },
      ],
    },
    {
      id: 'call-betty',
      open: '베티라고 불러도 된다고 허락한 적은 없는 거야. …아직 안 부른 거야?',
      replies: [
        { say: '베티, 이렇게?', tier: 'great', remember: 'call-betty', face: 'shy', answer: ['…부, 불렀으면 된 거야. 두 번은 안 불러도 되는 거야.', '아니, 불러도 되는 거야. 허락하는 거야. 특별히인 거야.'] },
        { say: '베아트리스 님이 좋을까?', tier: 'good', face: 'laugh', answer: '님은 너무 딱딱한 거야. 하쿠가 그렇게 불러서 베티 어깨가 굳는 거야.' },
        { say: '그냥 사서라고 할게', tier: 'meh', face: 'sorry', answer: '…사서인 건 맞는 거야. 맞는데 서운한 거야. 아니, 아무것도 아닌 거야.' },
      ],
    },
    {
      id: 'book-breath',
      open: ['조용히 해 보는 거야. 책들이 숨 쉬는 소리가 들리는 거야.', '대정령 귀에만 들리는 건지도 모르는 거야.'],
      replies: [
        { say: '…들리는 것 같아', tier: 'great', remember: 'book-breath', face: 'wow', answer: ['정말인 거야? 그럼 너도 책 편인 거야.', '오래된 책일수록 숨이 느린 거야. 베티처럼인 거야.'] },
        { say: '정령은 뭘 먹고 살아?', tier: 'good', face: 'think', answer: '공기 속 기운이랑, 꽃차랑, 단 과자인 거야. 뒤의 둘이 더 중요한 거야.' },
        { say: '난 아무것도 안 들려', tier: 'meh', face: 'calm', answer: '그럼 책장 넘기는 소리라도 듣는 거야. 그것도 숨소리인 거야.' },
      ],
    },
    {
      id: 'fav-genre',
      open: '{me}, 무슨 책을 좋아하는 거야? 사서로서 묻는 거야. 사적인 게 아닌 거야.',
      replies: [
        { say: '베티가 골라 주는 책', tier: 'great', remember: 'fav-genre', face: 'shy', answer: ['…그건 장르가 아닌 거야. 반칙인 거야.', '할 수 없는 거야. 다음 주까지 한 권 골라 두는 거야.'] },
        { say: '모험 이야기', tier: 'good', face: 'wow', answer: '모험책은 이층 오른쪽인 거야. 힘멜이 거기만 너덜너덜하게 만든 거야.' },
        { say: '책은 잘 안 읽어', tier: 'meh', face: 'sorry', answer: '…도서관에 와서 할 말이 아닌 거야. 그림책부터 시작하는 거야.' },
      ],
    },
    {
      id: 'old-keeper',
      open: ['이 도서관은 원래 베티 것이 아니었던 거야.', '옛 주인이 열쇠를 맡기고 떠난 거야. 지키라고만 한 거야.'],
      replies: [
        { say: '그 사람이 그리워?', tier: 'great', remember: 'old-keeper', face: 'think', answer: ['…그립다기보다는, 묻고 싶은 게 많은 거야.', '왜 베티한테 맡겼는지, 언제까지인지 말인 거야.', '대답은 아직 한 줄도 안 온 거야.'] },
        { say: '잘 지키고 있잖아', tier: 'good', face: 'shy', answer: '당연한 거야. 먼지 한 톨도 허락 안 하는 거야. …칭찬은 받아 두는 거야.' },
        { say: '맡기고 떠나다니 너무해', tier: 'meh', face: 'calm', answer: '…너무한 건 맞는 거야. 그래도 남이 그러면 편들고 싶어지는 거야.' },
      ],
    },
    {
      id: 'ribbon',
      open: '드레스 리본이 또 풀린 거야. …묶는 거 도와줄 수 있는 거야?',
      replies: [
        { say: '나비 모양으로 묶을게', tier: 'great', remember: 'ribbon', face: 'shy', answer: ['…손재주가 있는 거야. 양쪽 길이가 똑같은 거야.', '그웬한테 배운 거야? 타고난 거야? 둘 다 칭찬인 거야.'] },
        { say: '매일 혼자 묶어?', tier: 'good', face: 'think', answer: '매일인 거야. 수백 년 묶다 보니 눈 감고도 하는 거야. 오늘만 안 된 거야.' },
        { say: '그냥 풀어 두면 안 돼?', tier: 'meh', face: 'sorry', answer: '숙녀의 리본은 장식이 아니라 각오인 거야. 모르는 거야.' },
      ],
    },
    {
      id: 'pumpkin',
      open: ['언덕 텃밭 할머니가 호박을 또 놓고 간 거야.', '베티는 호박을 요리할 줄 모르는 거야. 곤란한 거야.'],
      replies: [
        { say: '호박파이 만들어 줄게', tier: 'great', remember: 'pumpkin-pie', face: 'wow', answer: ['…호박파이인 거야? 그건 좋아하는 거야.', '빵집 오븐을 빌리는 거야. 프리렌한테는 베티가 말해 두는 거야.'] },
        { say: '할머니랑 친해?', tier: 'good', face: 'laugh', answer: '이웃인 거야. 할머니는 베티를 꼬맹이라고 부르는 거야. 수백 살한테 말인 거야.' },
        { say: '그냥 쪄 먹어', tier: 'meh', face: 'calm', answer: '찐 호박도 달긴 한 거야. 그래도 정성이 모자란 거야.' },
      ],
    },
    {
      id: 'herb-book',
      open: '의원 선생이 옛 약초 도감을 빌려 간 거야. 책에 약 냄새가 밸까 걱정인 거야.',
      replies: [
        { say: '선생님은 조심히 볼 거야', tier: 'great', remember: 'book-care', face: 'calm', answer: ['…그건 아는 거야. 장갑 끼고 넘기는 사람인 거야.', '사람 살리는 데 쓰이는 책은 행복한 거야. 그건 인정하는 거야.'] },
        { say: '도감에 뭐가 있어?', tier: 'good', face: 'think', answer: '산기슭 약초 백 가지인 거야. 그림 색은 베티가 덧칠한 거야. 비밀인 거야.' },
        { say: '약 냄새 나면 어때', tier: 'meh', face: 'sorry', answer: '책은 냄새를 평생 기억하는 거야. 그 책은 이제 쑥 냄새 책인 거야.' },
      ],
    },
    {
      id: 'postman',
      open: ['우체부가 연체 도서를 받으러 갔다가 빈손으로 온 거야.', '집주인이 자는 척을 했다는 거야. 야니네코인 거야.'],
      replies: [
        { say: '내가 받아 올게', tier: 'great', remember: 'post-help', face: 'smile', answer: ['…부탁하는 거야. 문을 세 번 두드리고 이름을 부르는 거야.', '그래도 안 나오면 베티가 문을 이어서 직접 가는 거야.'] },
        { say: '우체부도 고생이네', tier: 'good', face: 'think', answer: '편지 배달 사이에 해 주는 거라 고마운 거야. 과자를 챙겨 주는 거야.' },
        { say: '자는 척 귀엽다', tier: 'meh', face: 'calm', answer: '귀여운 걸로 연체가 지워지면 도서관은 망하는 거야.' },
      ],
    },
    {
      id: 'season-books',
      open: ['베티는 계절마다 읽는 책이 정해져 있는 거야.', '봄엔 시집, 여름엔 무서운 이야기, 가을엔 두꺼운 역사책인 거야.'],
      replies: [
        { say: '겨울엔?', tier: 'great', remember: 'season-books', face: 'shy', answer: ['겨울엔 그림책인 거야. 난로 앞에서 읽는 거야.', '…웃으면 안 되는 거야. 그림책이 제일 어려운 책인 거야.'] },
        { say: '나도 따라 읽어 볼래', tier: 'good', face: 'smile', answer: '좋은 거야. 지금 계절 책부터 꺼내 주는 거야. 반납은 계절 안에인 거야.' },
        { say: '계절이랑 무슨 상관이야', tier: 'meh', face: 'calm', answer: '책도 제철이 있는 거야. 과일이랑 똑같은 거야. 하쿠도 그렇다는 거야.' },
      ],
    },
    {
      id: 'ledger-diary',
      open: '대출 장부를 일기처럼 쓰는 거야. 누가 무슨 책을 빌렸는지가 그날 일인 거야.',
      replies: [
        { say: '내 이름도 자주 있어?', tier: 'great', remember: 'betty-diary', face: 'shy', answer: ['…세어 본 적 없는 거야. 아니, 꽤 많은 거야.', '네 이름 옆에는 날씨까지 적어 둔 거야. 왜인지는 모르는 거야.'] },
        { say: '진짜 일기는 안 써?', tier: 'good', face: 'think', answer: '쓰면 너무 길어지는 거야. 수백 년이면 서가 하나가 일기로 차는 거야.' },
        { say: '장부가 일기라니 쓸쓸하다', tier: 'meh', face: 'sorry', answer: '…쓸쓸한 게 아니라 정확한 거야. 너는 말을 좀 고르는 거야.' },
      ],
    },
    {
      id: 'small-promise',
      open: '{me}, 약속 하나만 하는 거야. 아주 작은 거야. 내일도 여기 오는 거야.',
      replies: [
        { say: '응, 약속할게', tier: 'great', remember: 'small-promise', face: 'shy', answer: ['…쉽게 대답하는 거야. 그래도 적어 두는 거야.', '작은 약속을 지키는 사람이 큰 약속도 지키는 거야. 베티는 아는 거야.'] },
        { say: '바쁘면 어떡해?', tier: 'good', face: 'think', answer: '바쁘면 문 앞에서 손이라도 흔들고 가는 거야. 그것도 오는 거야.' },
        { say: '약속은 부담스러워', tier: 'meh', face: 'calm', answer: '…그럼 약속 말고 예정인 거야. 예정은 조금 어겨도 되는 거야.' },
      ],
    },
    {
      id: 'read-aloud',
      when: { ch: 4 },
      open: '{me}, 소리 내서 책 읽어 줄 수 있는 거야? 눈이 피곤한 건 아닌 거야.',
      replies: [
        { say: '어떤 책 읽어 줄까?', tier: 'great', remember: 'read-aloud', face: 'shy', answer: ['…이걸로 하는 거야. 얇은 동화책인 거야.', '천천히 읽는 거야. 베티가 잠들면 그건 네 목소리 탓인 거야.'] },
        { say: '베티가 읽어 줘', tier: 'good', face: 'laugh', answer: '베티가 읽으면 너는 금방 자는 거야. 다들 그런 거야. 신기한 거야.' },
        { say: '목이 좀 아파', tier: 'meh', face: 'sorry', answer: '…꽃차 한 잔 주는 거야. 그다음에 다시 묻는 거야.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 오는 날은 종이가 눅눅해지는 거야. 우산은 문밖에 두는 거야.',
      replies: [
        { say: '빗소리 들으며 읽자', tier: 'great', remember: 'quiet-reader', face: 'smile', answer: ['…좋은 생각인 거야. 창가 자리를 내주는 거야.', '오늘만인 거야. 내일은 모르는 거야.'] },
        { say: '수건 가져왔어', tier: 'good', answer: '준비성이 있는 거야. 손부터 닦고 책을 만지는 거야.' },
        { say: '그냥 들고 들어가면 안 돼?', tier: 'meh', face: 'sorry', answer: '물 한 방울이 책 한 권을 망치는 거야. 안 되는 거야.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 오는 날은 난로 옆자리를 내주는 거야. 베티가 착해서가 아닌 거야.',
      replies: [
        { say: '고마워, 베티', tier: 'great', face: 'shy', answer: '고, 고맙다는 말은 필요 없는 거야. 장갑이나 벗는 거야.' },
        { say: '같이 앉자', tier: 'good', answer: '…자리가 넓으니까 상관없는 거야. 꽃차도 데우는 거야.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '방금 안쪽 서고 문이 잠긴 거야. 이 시간까지 있다니 제법인 거야.',
      replies: [
        { say: '베티 혼자 심심할까 봐', tier: 'great', remember: 'door-curious', face: 'shy', answer: ['시, 심심하지 않은 거야.', '…그래도 등불은 하나 더 켜 주는 거야.'] },
        { say: '책 반납하러 왔어', tier: 'good', answer: '기특한 거야. 마감 전에 온 건 칭찬하는 거야.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '해 뜨기 전인 거야. 베티는 지금 머리 마는 중인 거야. 보지 마는 거야.',
      replies: [
        { say: '안 볼게. 기다릴게', tier: 'great', face: 'smile', answer: '…예의가 있는 거야. 한 시간만 기다리는 거야.' },
        { say: '벌써 예쁜데', tier: 'good', remember: 'curl-praise', face: 'shy', answer: '아, 아직 반밖에 안 만 거야! 그런 말은 다 끝나고 하는 거야.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날에도 도서관은 여는 거야. 시끄러운 게 싫은 사람도 있는 거야.',
      replies: [
        { say: '나도 여기 있을래', tier: 'great', remember: 'quiet-reader', face: 'shy', answer: '…마음대로 하는 거야. 축제 과자는 반 나눠 주는 거야.' },
        { say: '잠깐만 같이 나가자', tier: 'good', face: 'think', answer: '…딱 한 바퀴인 거야. 사람 많은 데선 손 놓지 않는 거야.' },
        { say: '축제엔 놀아야지', tier: 'meh', face: 'calm', answer: '놀다 온 사람도 책은 반납하는 거야. 잊지 않는 거야.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish} 냄새가 나는 거야. 도서관에 생선을 들고 오면 안 되는 거야.',
      replies: [
        { say: '밖에 두고 올게', tier: 'great', face: 'smile', answer: '말을 잘 듣는 거야. 손도 씻고 오는 거야. 그러면 들여보내는 거야.' },
        { say: '물고기 도감 있어?', tier: 'good', answer: '세 번째 서가인 거야. 그림이 많아서 너도 읽을 수 있는 거야.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물을 거둔 거야? 농사 기록 책에 적어 둘 만한 거야.',
      replies: [
        { say: '베티가 적어 줘', tier: 'great', face: 'smile', answer: '…특별히 적는 거야. 네 이름도 같이 남는 거야. 영원히인 거야.' },
        { say: '나세라한테 자랑할래', tier: 'good', answer: '독서 모임에서 말하면 되는 거야. 나세라가 기뻐하는 거야.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴이 눅눅한 책장 같은 거야. 무슨 일인 거야.',
      replies: [
        { say: '그냥 좀 지쳤어', tier: 'great', face: 'think', answer: ['…앉는 거야. 꽃차 우려 주는 거야.', '말하기 싫으면 안 해도 되는 거야. 책 넘기는 소리만 들리는 거야.'] },
        { say: '괜찮아', tier: 'good', answer: '괜찮다는 말은 연체 변명이랑 똑같은 거야. 다 티 나는 거야.' },
      ],
    },
    {
      id: 'op-museum',
      when: { news: 'museum' },
      open: '박물관에 새 화석이 들어왔다는 소식인 거야. 딱히 궁금한 건 아닌 거야.',
      replies: [
        { say: '같이 보러 가자', tier: 'great', remember: 'fossil-fan', face: 'shy', answer: '…어쩔 수 없는 거야. 도서관 닫고 잠깐만 가는 거야.' },
        { say: '어떤 화석일까', tier: 'good', face: 'think', answer: '조개면 좋겠는 거야. 아니, 고사리여도 좋은 거야. 다 좋은 거야.' },
      ],
    },
    {
      id: 'op-nasera',
      when: { bond: 'nasera' },
      open: '{other}, 만난 거야? 이번 주 책을 벌써 두 번 읽었다는 거야. 모범인 거야.',
      replies: [
        { say: '나도 본받을게', tier: 'great', remember: 'book-club', face: 'smile', answer: '좋은 마음가짐인 거야. 수요일에 자리 비워 두는 거야.' },
        { say: '둘이 사이좋더라', tier: 'good', face: 'shy', answer: '책 친구인 거야. 그 이상도 이하도 아닌 거야. 소중할 뿐인 거야.' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '하쿠가 오래된 강 이야기 책을 또 빌려 간 거야. 반납은 늘 제때인 거야.',
      replies: [
        { say: '하쿠도 책을 아끼는구나', tier: 'great', face: 'smile', answer: '그런 거야. 책장을 물처럼 조용히 넘기는 거야. 마음에 드는 거야.' },
        { say: '강 이야기 재밌어?', tier: 'good', answer: '강은 오래 사는 거야. 베티랑 비슷해서 읽을 만한 거야.' },
      ],
    },
    {
      id: 'op-himmel',
      when: { bond: 'himmel' },
      open: '힘멜이랑 이야기한 거야? 그 목소리가 언덕까지 들린 거야. 시끄러운 거야.',
      replies: [
        { say: '조용히 하라고 할게', tier: 'great', face: 'laugh', answer: '…부탁하는 거야. 경고장이 벌써 세 장인 거야.' },
        { say: '그래도 착하잖아', tier: 'good', face: 'think', answer: '착한 건 아는 거야. 착하고 시끄러운 거야. 둘 다인 거야.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '신이치가 또 추리소설 결말을 말해 버린 거야. 대출 정지 직전인 거야.',
      replies: [
        { say: '난 결말 안 물어볼게', tier: 'great', face: 'smile', answer: '현명한 거야. 결말은 마지막 장에서 만나는 거야.' },
        { say: '범인 누구였는데?', tier: 'meh', face: 'sorry', answer: '…너까지 그러는 거야? 둘 다 출입 금지인 거야.' },
      ],
    },
    {
      id: 'op-yanineko',
      when: { bond: 'yanineko' },
      open: '야니네코랑 이야기한 거야? 빌린 책을 베개로 쓰지 말라고 전하는 거야.',
      replies: [
        { say: '꼭 전할게', tier: 'great', face: 'smile', answer: ['…부탁하는 거야.', '베개가 없으면 베티가 하나 사 주겠다고도 전하는 거야. 진심인 거야.'] },
        { say: '푹신해 보이긴 하지', tier: 'meh', face: 'sorry', answer: '책은 베개가 아닌 거야! 둘 다 출입 경고인 거야.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄바람에 꽃가루가 서가까지 들어온 거야. 재채기가 멈추지 않는 거야.',
      replies: [
        { say: '창문 닫아 줄게', tier: 'great', face: 'smile', answer: ['…고마운 거야. 오른쪽 창은 뻑뻑하니까 세게 미는 거야.', '꽃은 좋은데 가루는 싫은 거야. 베티는 복잡한 거야.'] },
        { say: '꽃차 재료 따러 가자', tier: 'good', face: 'wow', answer: '언덕 꽃은 지금이 제일 향이 좋은 거야. 바구니는 두 개 챙기는 거야.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', time: 'day' },
      open: '한낮에 매미가 창문에 또 붙은 거야. 오늘만 세 번째인 거야.',
      replies: [
        { say: '내가 살살 쫓아 줄게', tier: 'great', face: 'laugh', answer: '…살살인 거야. 다치게 하면 그것대로 마음이 불편한 거야.' },
        { say: '시원한 화채 먹자', tier: 'good', face: 'wow', answer: '화채인 거야? …수박 많이 든 걸로 하는 거야. 그럼 매미는 잊어 주는 거야.' },
        { say: '여름이니 참아', tier: 'meh', face: 'calm', answer: '수백 번째 여름이어도 못 참는 건 못 참는 거야.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: ['가을 독서 모임 신청자가 넘치는 거야.', '의자가 모자라는 거야. 베티 의자를 내줄까 고민인 거야.'],
      replies: [
        { say: '난 바닥에 앉을게', tier: 'great', face: 'shy', answer: '…방석을 깔아 주는 거야. 베티 옆자리인 거야. 다른 뜻은 없는 거야.' },
        { say: '가구점에 의자 부탁할까', tier: 'good', face: 'think', answer: '발키리한테 말인 거야? 무섭지만 솜씨는 좋은 거야. 같이 가 주는 거야.' },
        { say: '모임을 둘로 나누면 되지', tier: 'meh', face: 'calm', answer: '나세라랑 베티가 갈라지는 건 안 되는 거야. 그건 규칙인 거야.' },
      ],
    },
    {
      id: 'op-winter-eve',
      when: { season: 'winter', time: 'evening' },
      open: '겨울 저녁은 해가 빨리 지는 거야. 등불 심지를 갈아 두는 중인 거야.',
      replies: [
        { say: '불 붙이는 거 도울게', tier: 'great', face: 'smile', answer: ['…불똥이 책에 튀지 않게 하는 거야.', '그래, 그렇게 손으로 가리는 거야. 잘 배운 거야.'] },
        { say: '난로 앞에 앉아도 돼?', tier: 'good', answer: '그 자리는 원래 베티 자리인 거야. 반만 빌려주는 거야.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny', time: 'day' },
      open: '볕이 좋아서 젖었던 책을 창가에 펼쳐 말리는 거야.',
      replies: [
        { say: '한 장씩 넘겨 줄게', tier: 'great', face: 'smile', answer: ['…바람 방향으로 넘기는 거야. 그래야 안 구겨지는 거야.', '손이 빠른 거야. 둘이라 금방 끝나는 거야.'] },
        { say: '이 책 왜 젖었어?', tier: 'good', face: 'think', answer: '힘멜이 반죽 묻은 손으로 들고 온 거야. 닦다가 이렇게 된 거야.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날은 책 읽기 제일 좋은 날인 거야. 눈부시지도 눅눅하지도 않은 거야.',
      replies: [
        { say: '오늘은 오래 있을게', tier: 'great', remember: 'quiet-reader', face: 'shy', answer: '…마음대로 하는 거야. 문 닫을 때까지 있으면 꽃차 주는 거야.' },
        { say: '구름 냄새 나', tier: 'good', face: 'laugh', answer: '구름에 냄새는 없는 거야. …있는 것 같기도 한 거야. 시인 같은 말인 거야.' },
      ],
    },
    {
      id: 'op-storm-night',
      when: { weather: 'storm', time: 'night' },
      open: '바람에 서고 문이 덜컹거리는 거야. 무서운 건 아닌 거야. 문이 떠는 거야.',
      replies: [
        { say: '옆에 있을게', tier: 'great', face: 'shy', answer: ['…있고 싶으면 있는 거야.', '등불을 하나 더 켜는 거야. 그러면 문도 조금 덜 떠는 거야.'] },
        { say: '창문 단단히 잠글게', tier: 'good', face: 'smile', answer: '고마운 거야. 걸쇠는 위아래 둘인 거야. 꼼꼼히 하는 거야.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '반납 마감 종이 울린 거야. 오늘 마지막 손님은 너인 거야.',
      replies: [
        { say: '문 닫는 거 도울게', tier: 'great', face: 'smile', answer: ['…의자를 책상 위에 올리는 거야. 조용히인 거야.', '둘이 하니까 종소리가 끝나기 전에 끝난 거야.'] },
        { say: '아슬아슬했다', tier: 'good', face: 'laugh', answer: '아슬아슬해도 마감 전인 거야. 베티는 공정한 거야.' },
      ],
    },
    {
      id: 'op-festival-night',
      when: { festival: true, time: 'night' },
      open: '축제 불꽃 소리가 서고까지 들리는 거야. 창으로 보면 조금 보이는 거야.',
      replies: [
        { say: '창가에서 같이 보자', tier: 'great', face: 'shy', answer: '…창가 자리는 하나뿐인 거야. 좁아도 괜찮으면 앉는 거야.' },
        { say: '언덕 위로 나가 볼까', tier: 'good', face: 'wow', answer: '…잠깐인 거야. 불꽃 끝나면 바로 들어오는 거야. 손은 안 놓는 거야.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['{me}, 오늘 생일인 거야?', '…도서관 규칙상 생일인 사람은 한 권 더 빌릴 수 있는 거야.'],
      replies: [
        { say: '그런 규칙이 있었어?', tier: 'great', face: 'shy', answer: ['방금 생긴 거야. 베티가 정한 거야.', '축하하는 거야. 크게는 말 안 하는 거야. 도서관이니까인 거야.'] },
        { say: '축하해 줘서 고마워', tier: 'good', face: 'smile', answer: '…고마운 건 아는 거야. 그러니 오늘은 연체료도 면제인 거야.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '마을에 혼례 소식이 있는 거야. 축하 책갈피를 만들어 보낼 생각인 거야.',
      replies: [
        { say: '같이 만들자', tier: 'great', face: 'smile', answer: ['…꽃잎은 네가 붙이는 거야. 베티는 글씨를 쓰는 거야.', '오래오래 같은 책을 읽으라고 적는 거야.'] },
        { say: '베티는 결혼 생각 있어?', tier: 'good', face: 'shy', answer: '그, 그런 걸 왜 묻는 거야! 책갈피나 마저 만드는 거야.' },
        { say: '선물이 소박하다', tier: 'meh', face: 'calm', answer: '책갈피는 평생 쓰는 거야. 소박한 게 오래가는 거야.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기를 낚았다는 소식인 거야. 도서관 기록에 올려야 하는 거야.',
      replies: [
        { say: '기록하는 거 구경할래', tier: 'great', face: 'wow', answer: ['…옆에서 보는 거야. 날짜, 날씨, 낚은 사람 이름인 거야.', '이 장부는 수백 년 뒤에도 남는 거야. 대단한 일인 거야.'] },
        { say: '전설이 진짜였구나', tier: 'good', face: 'think', answer: '책에 적힌 건 가끔 진짜인 거야. 그래서 책을 아끼는 거야.' },
      ],
    },
    {
      id: 'op-friend-bday',
      when: { friendNews: 'birthday' },
      open: '오늘 생일인 친구가 있다는 거야. 그림책 한 권을 골라 둘 생각인 거야.',
      replies: [
        { say: '베티가 직접 전해 줘', tier: 'great', face: 'shy', answer: '…직접인 거야? 문 앞에 두고 오는 게 아니라인 거야? 노력해 보는 거야.' },
        { say: '포장 도와줄게', tier: 'good', face: 'smile', answer: '꽃무늬 종이가 서랍에 있는 거야. 리본은 베티가 묶는 거야.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 온 거야? 손톱에 흙이 낀 거야. 책 만지기 전에 씻는 거야.',
      replies: [
        { say: '깨끗이 씻고 올게', tier: 'great', face: 'smile', answer: ['…잘 듣는 거야. 비누는 문 옆에 있는 거야.', '나세라 농사 기록 다음 권을 꺼내 둔 거야. 씻고 오면 주는 거야.'] },
        { say: '흙 냄새 좋잖아', tier: 'good', face: 'think', answer: '흙 냄새는 나쁘지 않은 거야. 종이 냄새랑 섞이면 문제인 거야.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '큰 걸 낚았다는 소문이 언덕까지 온 거야. 물고기 도감에 크기를 적어 두는 거야.',
      replies: [
        { say: '베티가 적어 주니 기뻐', tier: 'great', face: 'shy', answer: '…기록은 사서 일인 거야. 기쁘라고 하는 게 아닌 거야. 기쁘면 된 거야.' },
        { say: '그림도 그려 줘', tier: 'good', face: 'laugh', answer: '그림은 자신 없는 거야. 지난번 그린 붕어가 감자 같다고 들은 거야.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me}, 오늘 표정이 갓 들어온 새 책 같은 거야. 좋은 일이 있는 거야?',
      replies: [
        { say: '베티 보러 와서 그래', tier: 'great', face: 'shy', answer: ['…그런 말은 조용히 하는 거야. 도서관인 거야.', '아니, 하지 말라는 건 아닌 거야. 조용히인 거야.'] },
        { say: '그냥 날이 좋아', tier: 'good', face: 'smile', answer: '날이 좋은 건 좋은 거야. 그 기분 그대로 책 반납도 하는 거야.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼 바다에 다녀온 거야? 바다 너머 이야기는 책에 별로 없는 거야.',
      replies: [
        { say: '본 걸 다 말해 줄게', tier: 'great', face: 'wow', answer: ['…천천히 말하는 거야. 베티가 받아 적는 거야.', '네 이야기가 도서관 책이 되는 거야. 영광인 줄 아는 거야.'] },
        { say: '멀미가 심했어', tier: 'good', face: 'sorry', answer: '…꽃차 우려 주는 거야. 속을 달래는 데 좋은 거야.' },
        { say: '그냥 바다였어', tier: 'meh', face: 'calm', answer: '그냥 바다는 없는 거야. 보는 눈이 게으른 거야.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노에서 잃었다는 소문인 거야. 베티는 놀라지 않은 거야.',
      replies: [
        { say: '반성하는 중이야', tier: 'great', face: 'think', answer: ['…반성하는 사람한테 줄 책이 있는 거야. 확률 이야기인 거야.', '읽으면 다신 안 가고 싶어지는 거야. 아마인 거야.'] },
        { say: '다음엔 딸 거야', tier: 'meh', face: 'sorry', answer: '그 말을 수백 년 들은 거야. 딴 사람은 아직 못 본 거야.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '주식이 올랐다는 거야? 도서관에 새 서가 하나 들이는 건 어떤 거야.',
      replies: [
        { say: '서가 하나 기부할게', tier: 'great', face: 'laugh', answer: ['…농담이었던 거야. 진짜로 할 줄은 몰랐던 거야.', '네 이름 새긴 판을 붙이는 거야. 작게인 거야.'] },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 실력인 거야. 그래도 책 읽는 실력은 운이 아닌 거야.' },
      ],
    },
    {
      id: 'op-with-yanineko',
      when: { with: 'yanineko' },
      open: ['{other}, 또 여기서 졸고 있었던 거야.', '…깨우지 말고 조용히 말하는 거야. 시험 기간이라는 거야.'],
      replies: [
        { say: '담요 가져다줄게', tier: 'great', face: 'shy', answer: '…두 번째 서랍인 거야. 베티 거 아니고 손님용인 거야. 아마인 거야.' },
        { say: '깨워서 보낼까?', tier: 'good', face: 'think', answer: '오늘은 봐주는 거야. 공부하다 잔 건 자는 척이랑 다른 거야.' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: '{other}, 같이 있던 거야. 옛날 이야기를 하다 보니 차가 식은 거야.',
      replies: [
        { say: '나도 듣고 싶어', tier: 'great', face: 'smile', answer: ['…오래 걸리는 이야기인 거야. 백 년쯤 거슬러 가는 거야.', '앉는 거야. 새 차를 우리는 거야.'] },
        { say: '방해했나?', tier: 'good', face: 'shy', answer: '방해가 아닌 거야. 오래 산 둘은 말이 느려서 끼어들 틈이 많은 거야.' },
      ],
    },
    {
      id: 'op-with-himmel',
      when: { with: 'himmel' },
      open: '{other}, 지금 도서관 안이라는 걸 잊은 거야. 목소리를 줄이라고 하는 거야.',
      replies: [
        { say: '쉿, 힘멜', tier: 'great', face: 'laugh', answer: '…네 말은 듣는 거야. 불공평한 거야. 그래도 고마운 거야.' },
        { say: '오늘은 무슨 얘기야?', tier: 'good', face: 'think', answer: '또 자기 동상 이야기인 거야. 이번엔 망토 주름이 몇 겹인지인 거야.' },
      ],
    },
    {
      id: 'op-with-tsunade',
      when: { with: 'tsunade' },
      open: '{other}, 텃밭 일 끝나고 들른 거야. 베티를 또 꼬맹이라고 부른 거야.',
      replies: [
        { say: '할머니한텐 꼬맹이지', tier: 'great', face: 'laugh', answer: ['…그 말에 반박할 책이 없는 거야.', '할머니 앞에선 베티도 차를 먼저 따르는 거야. 예의인 거야.'] },
        { say: '베티가 더 오래 살았잖아', tier: 'good', face: 'think', answer: '나이는 그런 거야. 그런데 할머니는 할머니인 거야. 이상한 거야.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '{other}, 그쪽이랑 좀 서먹한 거야. …베티 탓은 아닌 거야. 아마인 거야.',
      replies: [
        { say: '먼저 손 내밀어 보자', tier: 'great', face: 'think', answer: ['…먼저인 거야? 어려운 거야.', '그래도 책갈피에 쪽지를 끼워 보내 보는 거야. 그게 베티 방식인 거야.'] },
        { say: '내가 가운데 설게', tier: 'good', face: 'shy', answer: '…부탁하는 거야. 그쪽이 아직 화났으면 너만 들어가는 거야.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-late',
      when: { mem: 'never-late' },
      use: 'never-late',
      open: '연체 안 한다고 했던 거야. 장부를 봤는데, 정말 한 번도 없는 거야.',
      replies: [
        { say: '약속했잖아', tier: 'great', face: 'shy', answer: '…약속을 지키는 사람은 좋은 거야. 아주 좋은 거야. 그뿐인 거야.' },
        { say: '사실 아슬아슬했어', tier: 'good', face: 'laugh', answer: '아슬아슬해도 제때면 되는 거야. 정직해서 봐주는 거야.' },
      ],
    },
    {
      id: 'cb-tea',
      when: { mem: 'tea-sweet' },
      use: 'tea-sweet',
      open: '꽃차에 과자를 곁들이자고 했던 거야. 오늘은 맛탕을 준비한 거야.',
      replies: [
        { say: '베티 최고야', tier: 'great', face: 'shy', answer: '최, 최고인 건 당연한 거야. 식기 전에 먹는 거야.' },
        { say: '맛탕이랑 꽃차라니', tier: 'good', face: 'think', answer: '의외로 어울리는 거야. 베티가 수백 년 동안 연구한 거야.' },
      ],
    },
    {
      id: 'cb-fossil',
      when: { mem: 'fossil-fan' },
      use: 'fossil-fan',
      open: '화석 이야기를 좋아한다고 했던 거야. 서가 뒤에서 조개 화석을 찾은 거야.',
      replies: [
        { say: '보여 줘!', tier: 'great', face: 'wow', answer: '두 손으로 조심히 드는 거야. …그래, 그렇게 드는 거야.' },
        { say: '서가 뒤에 왜 있었어?', tier: 'good', face: 'think', answer: '수백 년 전에 베티가 숨긴 거야. 잊어버렸던 거야. 비밀인 거야.' },
      ],
    },
    {
      id: 'cb-door',
      when: { mem: 'door-curious', ch: 2 },
      use: 'door-curious',
      open: '닫힌 서고 문, 아직 궁금한 거야? 손잡이 정도는 만져 봐도 되는 거야.',
      replies: [
        { say: '베티가 허락하면', tier: 'great', face: 'shy', answer: ['…허락하는 거야. 차갑지 않은 거야?', '너한텐 문이 화를 안 내는 거야. 베티도 처음 보는 거야.'] },
        { say: '열어 봐도 돼?', tier: 'good', face: 'think', answer: '그건 아직인 거야. 손잡이까지인 거야. 순서가 있는 거야.' },
      ],
    },
    {
      id: 'cb-person',
      when: { mem: 'that-person' },
      use: 'that-person',
      open: '기다리는 사람 이야기, 기억하는 거야? …요즘은 기다리는 게 덜 힘든 거야.',
      replies: [
        { say: '왜 덜 힘들어?', tier: 'great', face: 'shy', answer: '그, 그건 묻지 않는 거야. 도서관이 시끄러워서 그런 거야. 그런 거야.' },
        { say: '다행이다', tier: 'good', answer: '다행인 거야. …같이 기다려 주는 사람이 있으면 그런 거야.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}, 그렇다고 들은 거야. 관련 책을 찾아 둔 거야.',
      replies: [
        { say: '베티가 골라 준 거야?', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '…남는 시간에 고른 거야. 반납 기한은 넉넉히 주는 거야.' },
        { say: '그런 책도 있어?', tier: 'good', remember: 'taste-heard', face: 'smile', answer: '도서관에 없는 책은 없는 거야. 베티를 무시하면 안 되는 거야.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일인 거야? 책 한 권을 골라 두는 거야. 영구 대출인 거야.',
      replies: [
        { say: '영구 대출이라니!', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '도서관 역사상 처음인 거야. 자랑하고 다니면 안 되는 거야.' },
        { say: '무슨 책이야?', tier: 'good', remember: 'bday-plan', face: 'think', answer: '받는 날까지 비밀인 거야. 포장지는 꽃무늬인 거야.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에 다녀온 뒤로 책장이 잘 안 넘어가는 거야. 네 탓인 거야.',
      replies: [
        { say: '책임질게', tier: 'great', remember: 'date-talk', face: 'shy', answer: ['…말만으로는 안 되는 거야.', '다음에도 부르는 거야. 그게 책임인 거야.'] },
        { say: '내 방에 책장 둘게', tier: 'good', remember: 'date-talk', face: 'smile', answer: '그건 좋은 생각인 거야. 책은 베티가 골라 주는 거야.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸었던 날, 신발에 언덕 흙이 묻어 온 거야. 털기 아까웠던 거야.',
      replies: [
        { say: '또 같이 걷자', tier: 'great', remember: 'outing-talk', face: 'shy', answer: ['…다음엔 책을 안 들고 가는 거야. 손이 비어야 하는 거야.', '이유는 묻지 않는 거야.'] },
        { say: '흙은 털어야지', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '…맞는 말이라 화나는 거야. 턴 거야. 아쉽게인 거야.' },
      ],
    },
    {
      id: 'cb-bookmark',
      when: { mem: 'bookmark' },
      use: 'bookmark',
      open: '책갈피 쓴다고 했던 거야. 베티가 하나 만든 거야. 눌러 말린 꽃인 거야.',
      replies: [
        { say: '고마워, 아껴 쓸게', tier: 'great', face: 'shy', answer: ['…아끼라고 준 게 아니라 쓰라고 준 거야.', '닳으면 또 만들어 주는 거야. 꽃은 언덕에 많은 거야.'] },
        { say: '무슨 꽃이야?', tier: 'good', face: 'think', answer: '코스모스인 거야. 가을 끝물에 딴 거야. 색이 오래가는 거야.' },
      ],
    },
    {
      id: 'cb-brother',
      when: { mem: 'brother' },
      use: 'brother',
      open: ['오라버니한테서 편지가 온 거야.', '네 이야기를 썼더니 답장에 네 안부를 묻는 거야.'],
      replies: [
        { say: '내 얘기 뭐라고 썼는데?', tier: 'great', face: 'shy', answer: ['그, 그건 비밀인 거야.', '…시끄럽지 않은 손님이 하나 있다고만 쓴 거야. 그게 다인 거야.'] },
        { say: '안부 전해 줘', tier: 'good', face: 'smile', answer: '전하는 거야. 오라버니는 답장이 느린 거야. 한 계절쯤 걸리는 거야.' },
      ],
    },
    {
      id: 'cb-club',
      when: { mem: 'book-club' },
      use: 'book-club',
      open: '독서 모임 자리를 맡겠다고 한 거야. 이번 수요일에도 비워 둔 거야.',
      replies: [
        { say: '책 다 읽어 왔어', tier: 'great', face: 'smile', answer: ['…정말인 거야? 나세라가 놀라는 얼굴이 기대되는 거야.', '다 읽은 사람은 과자를 먼저 고르는 거야. 그것도 규칙인 거야.'] },
        { say: '반만 읽었어', tier: 'good', face: 'laugh', answer: '정직한 거야. 반만 읽은 사람은 과자도 반인 거야.' },
        { say: '깜빡했어', tier: 'meh', face: 'sorry', answer: '…차만 마시는 거야. 다음 주엔 잊지 않는 거야.' },
      ],
    },
    {
      id: 'cb-snail',
      when: { mem: 'no-snail' },
      use: 'no-snail',
      open: '달팽이 옮겨 준다고 했던 거야. 오늘 창틀에 또 온 거야.',
      replies: [
        { say: '바로 옮길게', tier: 'great', face: 'laugh', answer: ['…고마운 거야. 이번엔 개울 건너편까지 보내는 거야.', '돌아오는 데 한 계절은 걸릴 거야. 그 정도면 충분한 거야.'] },
        { say: '이번엔 베티가 해 봐', tier: 'good', face: 'sorry', answer: '…못 하는 거야. 미끌한 건 정령도 무서운 거야. 비밀인 거야.' },
      ],
    },
    {
      id: 'cb-river',
      when: { mem: 'river-book' },
      use: 'river-book',
      open: ['사라진 강 이야기, 기억하는 거야?', '하쿠가 과수원 우물에서 강물 소리를 들었다는 거야.'],
      replies: [
        { say: '같이 들으러 가자', tier: 'great', face: 'wow', answer: ['…과수원까지인 거야? 먼 거야. 그래도 가는 거야.', '하쿠가 사과도 준다고 한 거야. 그건 덤인 거야.'] },
        { say: '정말 아직 흐르는구나', tier: 'good', face: 'think', answer: '책에 적힌 건 다 이유가 있는 거야. 오래 기다리면 들리는 거야.' },
      ],
    },
    {
      id: 'cb-alone',
      when: { mem: 'not-alone' },
      use: 'not-alone',
      open: '말 걸러 오겠다고 했던 거야. …정말 자주 와서 놀란 거야.',
      replies: [
        { say: '약속했으니까', tier: 'great', face: 'shy', answer: ['…약속을 그렇게 쉽게 지키면 곤란한 거야.', '베티가 혼자 있는 법을 잊어버리는 거야. 네 책임인 거야.'] },
        { say: '귀찮았어?', tier: 'good', face: 'think', answer: '귀찮은 거야. 아주 조금인 거야. 그 조금이 없으면 이상한 거야.' },
      ],
    },
    {
      id: 'cb-genre',
      when: { mem: 'fav-genre' },
      use: 'fav-genre',
      open: '골라 달라던 책, 골라 둔 거야. 일곱 번 바꾼 거야. 아니, 한 번에 고른 거야.',
      replies: [
        { say: '무슨 책이야?', tier: 'great', face: 'wow', answer: ['별을 따라 집을 찾아가는 이야기인 거야.', '…베티가 처음 혼자 읽은 책인 거야. 소중히 읽는 거야.'] },
        { say: '일곱 번이나?', tier: 'good', face: 'laugh', answer: '못 들은 거야. 한 번에 고른 거야. 베티는 망설이지 않는 거야.' },
      ],
    },
    {
      id: 'cb-curl',
      when: { mem: 'curl-praise' },
      use: 'curl-praise',
      open: '머리 멋지다고 했던 거야. 오늘은 한 바퀴 더 만 거야. 눈치챈 거야?',
      replies: [
        { say: '오늘 더 예쁘다', tier: 'great', face: 'shy', answer: ['…알아본 거야? 정말인 거야?', '흥, 당연한 거야. 그래도 알아봐 준 건 기억하는 거야.'] },
        { say: '오래 걸렸겠다', tier: 'good', face: 'laugh', answer: '한 시간 반인 거야. 해보다 일찍 일어난 거야. 졸린 거야.' },
      ],
    },
    {
      id: 'cb-promise',
      when: { mem: 'small-promise' },
      use: 'small-promise',
      open: '작은 약속, 지킨 거야. 장부 네 이름 옆에 동그라미를 친 거야.',
      replies: [
        { say: '동그라미 더 모을게', tier: 'great', face: 'smile', answer: ['…모으는 거야? 그럼 장부를 한 권 더 사야 하는 거야.', '기쁜 게 아닌 거야. 장부값 걱정인 거야.'] },
        { say: '동그라미가 상이야?', tier: 'good', face: 'think', answer: '상은 아닌 거야. 기록인 거야. 기록이 상보다 오래 남는 거야.' },
      ],
    },
    {
      id: 'cb-diary',
      when: { mem: 'betty-diary' },
      use: 'betty-diary',
      open: '장부에 네 날씨를 적는다고 했던 거야. 오늘 칸에는 {weather}, 이렇게 쓴 거야.',
      replies: [
        { say: '베티 기분도 적어 줘', tier: 'great', face: 'shy', answer: ['…기분은 장부에 적는 게 아닌 거야.', '그래도 오늘은 구석에 맑음이라고 써 두는 거야. 날씨 말고인 거야.'] },
        { say: '꼼꼼하다', tier: 'good', face: 'smile', answer: '사서는 다 꼼꼼한 거야. 너한테만 그런 게 아닌 거야. 아마인 거야.' },
      ],
    },
    {
      id: 'cb-pie',
      when: { mem: 'pumpkin-pie' },
      use: 'pumpkin-pie',
      open: '호박파이 만들어 준다고 했던 거야. 접시를 닦아 둔 거야. 재촉은 아닌 거야.',
      replies: [
        { say: '내일 구워 올게', tier: 'great', face: 'wow', answer: ['…내일인 거야. 오늘 밤 잠이 안 오는 거야.', '꽃차는 베티가 우리는 거야. 그게 공평한 거야.'] },
        { say: '조금만 기다려 줘', tier: 'good', face: 'calm', answer: '기다리는 건 잘하는 거야. 수백 년 경력인 거야.' },
      ],
    },
    {
      id: 'cb-read',
      when: { mem: 'read-aloud' },
      use: 'read-aloud',
      open: '지난번 읽어 준 동화, 결말을 베티가 못 들은 거야. 잠든 게 아닌 거야.',
      replies: [
        { say: '처음부터 다시 읽을게', tier: 'great', face: 'shy', answer: ['…처음부터인 거야? 그럼 또 잠들 거야. 아니, 안 자는 거야.', '창가로 오는 거야. 담요는 베티가 가져오는 거야.'] },
        { say: '결말만 말해 줄까?', tier: 'good', face: 'think', answer: '신이치처럼 굴면 안 되는 거야. 결말은 네 목소리로 듣는 거야.' },
      ],
    },
  ],
  chapters: [
    {
      title: '대출증 한 장',
      hint: '한 번 이야기를 나누면 베아트리스가 대출증을 만들어 줘요.',
      need: { days: 1 },
      scene: [
        '언덕 꼭대기 도서관. 문을 열자 종이와 마른 꽃 냄새가 밀려온다.',
        '높은 서가 사이로 햇빛이 비스듬히 들고, 먼지가 금가루처럼 뜬다.',
        '카운터 너머, 머리를 돌돌 만 작은 사서가 고개도 들지 않는다.',
        '"들어왔으면 문부터 닫는 거야. 바람이 책장을 넘기는 거야."',
        '그녀가 서랍에서 빈 카드 한 장을 꺼내 카운터 위로 민다.',
        '"이름을 또박또박 쓰는 거야. 번지면 처음부터 다시 쓰는 거야."',
        '"책은 두 권까지, 기한은 일주일인 거야. 어기면 찾아가는 거야."',
        '펜을 내려놓자, 그녀가 카드를 들어 창 쪽 빛에 비춰 본다.',
        '"…글씨가 나쁘지 않은 거야. 이 도서관 회원으로 인정하는 거야."',
        '쿵. 작은 얼굴이 새겨진 도장이 카드 한구석에 찍힌다.',
        '"베티는 베아트리스인 거야. 여기 사서인 거야. 기억해 두는 거야."',
        '카드를 건네주던 그녀가, 아주 잠깐 안쪽 닫힌 문을 바라본다.',
      ],
      replies: [
        { say: '책 소중히 볼게', tier: 'great', remember: 'library-card', face: 'shy', answer: ['…처음부터 그런 말을 하는 사람은 드문 거야.', '기억해 두는 거야. 장부 맨 뒷장에 따로 적는 거야.'] },
        { say: '도장 귀엽다', tier: 'good', remember: 'library-card', face: 'smile', answer: '베티 얼굴을 새긴 거야. 귀여운 건 당연한 거야.' },
        { say: '일주일은 짧은데', tier: 'meh', remember: 'library-card', face: 'calm', answer: '짧으면 빨리 읽는 거야. 그것도 공부인 거야.' },
      ],
    },
    {
      title: '밤의 서고',
      hint: '밤(게임 시각 저녁 여덟 시부터 자정) 뒷산 언덕 도서관에 가 보세요. 문이 잠기는 시간이래요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 20, to: 24 } },
      scene: [
        '밤의 언덕. 도서관 창 하나에만 노란 등불이 흔들린다.',
        '문을 밀자 삐걱 소리가 서가 사이를 길게 돌아 나간다.',
        '베아트리스가 등불을 들고 안쪽 서고 문 앞에 서 있다.',
        '"…정말 온 거야. 이 시간에 오는 사람은 처음인 거야."',
        '무늬 없는 나무 문. 손잡이엔 오래 쥔 자국이 반들반들하다.',
        '찰칵. 아무도 손대지 않았는데 문이 저 혼자 잠긴다.',
        '"매일 밤 이 소리를 듣는 거야. 수백 년 동안 혼자 들은 거야."',
        '"이 안엔 옛 주인이 남긴 책들이 있는 거야. 베티가 지키는 거야."',
        '"언젠가 올 그 사람한테 건네라고 한 책도 한 권 있는 거야."',
        '그녀가 등불을 문 앞 바닥에 내려놓고 두 손을 모은다.',
        '"…오늘은 혼자 듣지 않은 거야. 이상한 기분인 거야."',
        '등불이 조금, 아주 조금 내 쪽으로 밀려온다.',
      ],
      replies: [
        { say: '내일 밤에도 올까?', tier: 'great', remember: 'night-shelf', face: 'shy', answer: ['…마음대로 하는 거야.', '등불은 두 개 켜 두는 거야. 혹시 모르니까인 거야.'] },
        { say: '문 안엔 뭐가 있어?', tier: 'good', remember: 'night-shelf', face: 'think', answer: '아직은 말할 수 없는 거야. 언젠가는 말해 주는 거야. 아마인 거야.' },
        { say: '좀 으스스하다', tier: 'meh', remember: 'night-shelf', face: 'calm', answer: '겁쟁이인 거야. …그럼 문까지 데려다주는 거야.' },
      ],
    },
    {
      title: '꽃차 한 봉지',
      hint: '베아트리스는 꽃차를 좋아해요. 꽃차를 가지고 언덕 도서관에 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '오후의 도서관. 창가에 놓인 찻잔 하나가 비어 있다.',
        '꽃차 봉지를 카운터에 올려놓자, 베아트리스의 손이 멈춘다.',
        '"…이건 베티가 제일 좋아하는 차인 거야. 누구한테 들은 거야?"',
        '그녀가 봉지를 열어 코끝에 대 본다. 언덕 들꽃 냄새가 퍼진다.',
        '찻잔 두 개를 꺼냈다가, 하나를 넣었다가, 다시 꺼낸다.',
        '"찻잔이 두 개 나온 건 오랜만인 거야. 먼지부터 닦는 거야."',
        '주전자에서 김이 오르는 동안, 그녀는 창밖만 본다.',
        '"옛 주인은 차를 우려 주는 사람이 아니었던 거야."',
        '"그래서 베티는 늘 혼자 우려서 혼자 마신 거야. 익숙한 거야."',
        '"…남이 가져온 차를 마시는 건 처음일지도 모르는 거야."',
        '그녀가 단 과자 접시를 내 쪽으로 반 뼘 밀어 놓는다.',
        '"같이 마시는 거야. 거절은 안 받는 거야. 규칙인 거야."',
      ],
      replies: [
        { say: '내가 우려 줄게', tier: 'great', remember: 'tea-gift', face: 'shy', answer: ['물은 너무 뜨거우면 안 되는 거야.', '…그래, 잘하는 거야. 누구한테 배운 것보다 나은 거야.'] },
        { say: '베티가 좋아할 것 같았어', tier: 'good', remember: 'tea-gift', face: 'smile', answer: '눈치가 빠른 거야. 그건 칭찬인 거야. 받아 두는 거야.' },
        { say: '남아서 가져왔어', tier: 'meh', remember: 'tea-gift', face: 'calm', answer: '…남은 거라도 베티한테 온 건 좋은 거야. 흥인 거야.' },
      ],
    },
    {
      title: '찢어진 책',
      hint: '베아트리스에게 책을 소중히 다룬다는 걸 보여 주면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'book-care' },
      scene: [
        '카운터 위에 표지가 반쯤 찢어진 낡은 책 한 권이 놓여 있다.',
        '베아트리스가 그 앞에서 두 손을 꼭 쥐고 서 있다.',
        '"닫힌 서고에서 떨어진 거야. 옛 주인이 남긴 바로 그 책인 거야."',
        '"밤사이 선반이 기울었던 거야. …베티가 못 지킨 거야."',
        '"책을 아끼는 사람한테만 이 일을 맡기는 거야. 너인 거야."',
        '얇게 푼 풀, 부드러운 붓, 다림질한 한지가 나란히 놓인다.',
        '둘이서 찢어진 장을 한 장씩 맞춘다. 그녀의 손끝이 떨린다.',
        '맞붙인 장 사이로, 빛바랜 글씨 한 줄이 드러난다.',
        '그 사람이 오면 너는 알게 되리라. 뒤는 하얗게 비어 있다.',
        '"…이게 전부인 거야. 수백 년을 이 한 줄로 기다린 거야."',
        '그녀가 웃는 것도 우는 것도 아닌 얼굴로 책을 쓰다듬는다.',
        '"풀이 마를 때까지 누르고 있는 거야. 손 떼면 안 되는 거야."',
        '"…네 손은 책이 무서워하지 않는 손인 거야. 드문 거야."',
      ],
      replies: [
        { say: '베티한테 배운 거야', tier: 'great', remember: 'mended-book', face: 'shy', answer: ['…그런 말은 반칙인 거야.', '풀이 마를 때까지 옆에 있는 거야. 오래 걸려도인 거야.'] },
        { say: '다 고쳤다!', tier: 'good', remember: 'mended-book', face: 'smile', answer: '아직 마르는 중인 거야. 그래도 잘한 거야. 인정하는 거야.' },
        { say: '새 책 사면 안 돼?', tier: 'meh', remember: 'mended-book', face: 'sorry', answer: '이 책은 이 한 권뿐인 거야. 고쳐 쓰는 게 도서관인 거야.' },
      ],
    },
    {
      title: '기다림의 끝',
      hint: '베아트리스와 아주 가까워지면 그녀가 기다림 이야기를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '해 질 녘. 창가 자리에 노을이 길게 눕는다.',
        '베아트리스가 고친 그 책을 펼쳐 두고, 읽지도 않고 앉아 있다.',
        '"요즘 베티는 이상한 거야. 문소리만 나면 고개가 돌아가는 거야."',
        '"수백 년 동안 들어온 사람은 많았던 거야. 다 손님이었던 거야."',
        '"그 사람이면 알 거라고 했는데, 아무도 아니었던 거야."',
        '그녀가 하얀 페이지를 한 장, 또 한 장 천천히 넘긴다.',
        '"…어쩌면 알게 되는 게 아니라, 고르는 거였는지도 모르는 거야."',
        '"결말을 안 써 둔 건, 베티더러 쓰라는 뜻이었을지도 모르는 거야."',
        '"네가 문을 열고 들어올 때마다, 베티 가슴이 시끄러운 거야."',
        '"도서관에선 조용히 하는 게 규칙인데 말인 거야."',
        '그녀가 책을 탁 덮고 고개를 돌린다. 귀 끝이 빨갛다.',
        '창밖 언덕에는 들꽃이 한창이다. 한 다발쯤 꺾어도 될 만큼.',
      ],
      replies: [
        { say: '내가 그 사람이면 좋겠다', tier: 'great', face: 'shy', answer: ['…꽃다발이라도 들고 오면 생각해 보는 거야.', '꽃차 꽃이면 더 좋은 거야. 아무 말도 안 한 거야.'] },
        { say: '앞으로도 올게', tier: 'good', face: 'smile', answer: '매일 오는 거야. 연체 없이인 거야. 그게 조건인 거야.' },
        { say: '그 사람은 곧 올 거야', tier: 'meh', face: 'think', answer: '…모르는 거야. 너는 정말 아무것도 모르는 거야.' },
      ],
    },
    {
      title: '닫힌 서고의 약속',
      hint: '베아트리스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '밤인데도 안쪽 서고 문이 활짝 열려 있다.',
        '처음 보는 방. 천장까지 닿은 서가, 둥근 창, 낡은 흔들의자.',
        '베아트리스가 문턱에 서서 나를 기다리고 있다.',
        '"오늘부터 이 문은 너한테는 잠기지 않는 거야. 베티가 정한 거야."',
        '방 한가운데 책상 위에, 함께 고친 그 책이 펼쳐져 있다.',
        '"그 사람이 오면 알게 된다고 했던 거야. 끝내 몰랐던 거야."',
        '"그래서 베티가 정하기로 한 거야. 기다린 게 누구였는지인 거야."',
        '그녀가 펜을 내밀며, 하얀 첫 장을 손가락으로 톡 두드린다.',
        '"여기 네 이름을 쓰는 거야. 그 옆에 베티 이름을 쓰는 거야."',
        '"…이건 계약인 거야. 평생 연체 금지인 거야. 알아들은 거야?"',
        '목소리는 도도한데, 펜을 쥔 그녀의 손이 조금 떨린다.',
        '창밖 언덕의 밤바람이 들어와, 빈 책장을 한 장 넘긴다.',
      ],
      replies: [
        { say: '평생 반납 안 할게', tier: 'great', face: 'shy', answer: ['…그건 연체가 아니라 영구 대출인 거야.', '특별히 허락하는 거야. 도서관 역사상 단 한 번인 거야.'] },
        { say: '같이 채워 나가자', tier: 'good', face: 'smile', answer: ['한 장씩인 거야. 서두르면 안 되는 거야.', '시간은 많은 거야. 이제는 둘이 쓰는 시간인 거야.'] },
        { say: '계약은 좀 무섭다', tier: 'meh', face: 'think', answer: '무서운 게 아니라 약속인 거야. 베티는 꼭 지키는 거야.' },
      ],
    },
  ],
  after: [
    '오늘은 충분히 이야기한 거야. 책이나 읽는 거야.',
    '또 온 거야? …자리는 비워 둔 거야. 조용히 앉는 거야.',
    '할 말은 다 한 거야. 내일 오는 거야. 연체하지 말고인 거야.',
    '흥, 딱히 배웅하는 건 아닌 거야. 문 닫는 김인 거야.',
    '꽃차가 아직 따뜻한 거야. …마시고 가도 되는 거야.',
    '오늘 이야기는 장부에 적어 둔 거야. 다음 장은 내일인 거야.',
    '{me}, 나갈 때 문은 조용히 닫는 거야. 그거면 된 거야.',
  ],
};
