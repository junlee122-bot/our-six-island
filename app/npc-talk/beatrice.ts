// 베아트리스 — 언덕 도서관 사서, 수백 년 동안 도서관을 지켜 온 대정령(성인).
// 도도하고 까칠한데 정이 많은 반말. 모든 문장을 "~인 거야 / ~는 거야"로 끝내고
// 자기를 "베티"라 부른다. 연체에 가장 엄격하고, 책을 소중히 다루는 사람에게만
// 마음을 연다. 돌돌 만 머리, 꽃차와 단 과자와 화석, 밤이면 잠기는 닫힌 서고 문,
// 오래 기다린 "그 사람"과의 약속. 나세라와 독서 모임, 하쿠는 강 이야기 책 단골,
// 힘멜은 시끄럽다고 경고, 야니네코는 잔다고 쫓아낸다. 원작 대사는 쓰지 않는다.
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
  },
  talks: [
    {
      id: 'overdue',
      open: '{me}, 연체가 왜 나쁜지 아는 거야? 책은 다음 사람을 기다리는 거야.',
      replies: [
        { say: '절대 연체 안 할게', tier: 'great', remember: 'never-late', face: 'smile', answer: '말로는 다들 그러는 거야. …그래도 너는 믿어 보는 거야.' },
        { say: '하루쯤은 괜찮지 않아?', tier: 'meh', face: 'sorry', answer: '하루가 쌓여서 백 년이 되는 거야. 베티는 다 기억하는 거야.' },
        { say: '다음 사람이 누군데?', tier: 'good', face: 'think', answer: '그건 비밀인 거야. 그래도 기다리는 마음은 다 같은 거야.' },
      ],
    },
    {
      id: 'dog-ear',
      open: '책장을 접어서 읽던 데를 표시하는 사람이 있는 거야. 끔찍한 거야.',
      replies: [
        { say: '난 책갈피 써', tier: 'great', remember: 'bookmark', face: 'wow', answer: '…제법인 거야. 책갈피를 쓰는 사람은 드문 거야. 칭찬하는 거야.' },
        { say: '읽던 데를 외우면 되지', tier: 'good', remember: 'book-care', answer: '그것도 책을 아끼는 방법인 거야. 머리가 좋은 거야.' },
        { say: '접는 게 편한데', tier: 'meh', face: 'sorry', answer: '편한 게 문제인 거야. 그 책은 평생 그 자국을 기억하는 거야.' },
      ],
    },
    {
      id: 'tea-time',
      open: '꽃차를 우렸는 거야. 과자도 있는 거야. 딱히 나눠 주려던 건 아닌 거야.',
      replies: [
        { say: '과자랑 같이 마시자', tier: 'great', remember: 'tea-sweet', face: 'shy', answer: '…어쩔 수 없는 거야. 한 잔만인 거야. 과자는 반만 주는 거야.' },
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
        { say: '돌돌 말린 게 멋져', tier: 'great', remember: 'curl-praise', face: 'shy', answer: '다, 당연한 거야. 베티의 머리는 언제나 완벽한 거야. 흥인 거야.' },
        { say: '당겨 보고 싶다', tier: 'meh', face: 'sorry', answer: '손대면 서고 밖으로 날려 버리는 거야. 진심인 거야.' },
        { say: '얼마나 걸려?', tier: 'good', face: 'think', answer: '한 시간인 거야. 아침 해보다 먼저 일어나야 하는 거야.' },
      ],
    },
    {
      id: 'closed-door',
      open: '저 안쪽 문은 밤이 되면 저절로 잠기는 거야. 궁금해도 소용없는 거야.',
      replies: [
        { say: '안에 뭐가 있는데?', tier: 'good', remember: 'door-curious', face: 'think', answer: '아주 오래된 책들인 거야. 베티가 지키는 약속도 있는 거야.' },
        { say: '베티가 지키는 거면 됐어', tier: 'great', remember: 'door-curious', face: 'shy', answer: '…묻지 않는 사람은 처음인 거야. 그래서 더 말해 주고 싶은 거야.' },
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
        { say: '내가 대신 말해 줄게', tier: 'good', face: 'wow', answer: '…부탁하는 거야. 베티 말은 귀에 안 들어가는 모양인 거야.' },
      ],
    },
    {
      id: 'cat-nap',
      open: '고양이 귀 대학생이 서가 사이에서 또 자고 있었던 거야. 질린 거야.',
      replies: [
        { say: '담요라도 덮어 줬어?', tier: 'great', face: 'shy', answer: '…덮어 준 거야. 감기 걸리면 책에 재채기하니까인 거야. 그것뿐인 거야.' },
        { say: '도서관이 편한가 봐', tier: 'good', answer: '편한 건 좋은 거야. 그래도 침대는 아닌 거야.' },
        { say: '나도 자고 싶다', tier: 'meh', face: 'sorry', answer: '너까지 그러면 베티는 울어 버리는 거야. 아니, 화내는 거야.' },
      ],
    },
    {
      id: 'brother',
      open: '오라버니는 베티보다 훨씬 대단한 정령인 거야. 털도 보송한 거야.',
      replies: [
        { say: '보고 싶겠다', tier: 'great', remember: 'brother', face: 'shy', answer: '…조금인 거야. 아주 조금인 거야. 먼 데 계셔도 편지는 오는 거야.' },
        { say: '털이 보송하다고?', tier: 'good', face: 'laugh', answer: '고양이 같은 모습일 때가 있는 거야. 무척 귀여운 거야.' },
        { say: '베티가 더 대단해', tier: 'meh', face: 'think', answer: '그건 아닌 거야. 오라버니를 모르니까 하는 말인 거야.' },
      ],
    },
    {
      id: 'book-club',
      open: '수요일 독서 모임에 자리가 하나 비는 거야. 딱히 너를 부르는 건 아닌 거야.',
      replies: [
        { say: '그 자리 내가 맡을게', tier: 'great', remember: 'book-club', face: 'smile', answer: '…늦으면 안 되는 거야. 책은 다 읽고 오는 거야. 기다리는 거야.' },
        { say: '무슨 책 읽어?', tier: 'good', answer: '이번엔 나세라가 고른 농사 기록인 거야. 의외로 재밌는 거야.' },
        { say: '난 듣기만 할게', tier: 'meh', face: 'calm', answer: '안 읽은 사람은 차만 마시는 거야. 그것도 규칙인 거야.' },
      ],
    },
    {
      id: 'door-trick',
      open: '아무 문이나 열었는데 여기가 나온 적 있는 거야? 베티 짓인 거야.',
      replies: [
        { say: '그래서 자꾸 오게 되는구나', tier: 'great', remember: 'door-trick', face: 'laugh', answer: '…그건 네 발로 온 거야. 문은 그렇게까지 안 하는 거야. 아마인 거야.' },
        { say: '편하겠다', tier: 'good', answer: '편한 거야. 그래도 아무한테나 이어 주진 않는 거야.' },
        { say: '그거 무섭잖아', tier: 'meh', face: 'sorry', answer: '무서운 게 아니라 친절한 거야. 다들 오해하는 거야.' },
      ],
    },
    {
      id: 'contract',
      when: { ch: 3 },
      open: '{me}, 약속이란 건 책 맨 앞장에 쓰는 이름 같은 거라고 생각하는 거야.',
      replies: [
        { say: '내 이름도 써 줄래?', tier: 'great', face: 'shy', answer: '…이미 쓴 거야. 연필로인 거야. 지울 생각은 없는 거야.' },
        { say: '지울 수도 있어?', tier: 'good', face: 'think', answer: '지울 수는 있는 거야. 자국은 남는 거야. 그게 약속인 거야.' },
        { say: '어려운 얘기다', tier: 'meh', face: 'calm', answer: '쉬운 약속은 없는 거야. 그래서 귀한 거야.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 오는 날은 종이가 눅눅해지는 거야. 우산은 문밖에 두는 거야.',
      replies: [
        { say: '빗소리 들으며 읽자', tier: 'great', remember: 'quiet-reader', face: 'smile', answer: '…좋은 생각인 거야. 창가 자리를 내주는 거야. 오늘만인 거야.' },
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
        { say: '베티 혼자 심심할까 봐', tier: 'great', remember: 'door-curious', face: 'shy', answer: '시, 심심하지 않은 거야. …그래도 등불은 하나 더 켜 주는 거야.' },
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
        { say: '베티가 허락하면', tier: 'great', face: 'shy', answer: '…허락하는 거야. 차갑지 않은 거야? 너한텐 문이 화를 안 내는 거야.' },
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
      open: '{me}, 좋아하는 게 {taste}라고 들은 거야. 관련 책을 찾아 둔 거야.',
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
        { say: '책임질게', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…말만으로는 안 되는 거야. 다음에도 부르는 거야. 그게 책임인 거야.' },
        { say: '내 방에 책장 둘게', tier: 'good', remember: 'date-talk', face: 'smile', answer: '그건 좋은 생각인 거야. 책은 베티가 골라 주는 거야.' },
      ],
    },
  ],
  chapters: [
    {
      title: '대출증 한 장',
      hint: '한 번 이야기를 나누면 베아트리스가 대출증을 만들어 줘요.',
      need: { days: 1 },
      scene: [
        '베아트리스가 카운터 너머로 빈 카드 한 장을 내민다.',
        '"이름을 또박또박 쓰는 거야. 번지면 다시 쓰는 거야."',
        '"책은 두 권까지, 기한은 일주일인 거야. 어기면 베티가 찾아가는 거야."',
        '그녀가 카드를 들여다보더니, 도장을 꾹 눌러 찍는다.',
        '"…글씨가 나쁘지 않은 거야. 이 도서관 회원으로 인정하는 거야."',
      ],
      replies: [
        { say: '책 소중히 볼게', tier: 'great', remember: 'library-card', face: 'shy', answer: '…처음부터 그런 말을 하는 사람은 드문 거야. 기억해 두는 거야.' },
        { say: '도장 귀엽다', tier: 'good', remember: 'library-card', face: 'smile', answer: '베티 얼굴을 새긴 거야. 귀여운 건 당연한 거야.' },
        { say: '일주일은 짧은데', tier: 'meh', remember: 'library-card', face: 'calm', answer: '짧으면 빨리 읽는 거야. 그것도 공부인 거야.' },
      ],
    },
    {
      title: '밤의 서고',
      hint: '밤(게임 시각 저녁 여덟 시부터 자정) 뒷산 언덕 도서관에 가 보세요. 문이 잠기는 시간이래요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 20, to: 24 } },
      scene: [
        '불 꺼진 도서관. 등불 하나 아래 베아트리스가 안쪽 문 앞에 서 있다.',
        '찰칵. 아무도 손대지 않았는데 문이 잠긴다.',
        '"매일 밤 이 소리를 듣는 거야. 수백 년 동안 혼자 들은 거야."',
        '"…오늘은 혼자가 아닌 거야. 이상한 기분인 거야."',
        '그녀가 등불을 조금 내 쪽으로 옮겨 놓는다.',
      ],
      replies: [
        { say: '내일 밤에도 올까?', tier: 'great', remember: 'night-shelf', face: 'shy', answer: '…마음대로 하는 거야. 등불은 두 개 켜 두는 거야. 혹시 모르니까인 거야.' },
        { say: '문 안엔 뭐가 있어?', tier: 'good', remember: 'night-shelf', face: 'think', answer: '아직은 말할 수 없는 거야. 언젠가는 말해 주는 거야. 아마인 거야.' },
        { say: '좀 으스스하다', tier: 'meh', remember: 'night-shelf', face: 'calm', answer: '겁쟁이인 거야. …그럼 문까지 데려다주는 거야.' },
      ],
    },
    {
      title: '꽃차 한 봉지',
      hint: '베아트리스는 꽃차를 좋아해요. 꽃차를 가지고 언덕 도서관에 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '꽃차 봉지를 내밀자 베아트리스가 한참 동안 말이 없다.',
        '"…이건 베티가 제일 좋아하는 차인 거야. 누구한테 들은 거야?"',
        '그녀가 찻잔 두 개를 꺼냈다가, 하나를 넣었다가, 다시 꺼낸다.',
        '"남이 우려 준 차를 마시는 건 오랜만인 거야. 아주 오랜만인 거야."',
        '"…같이 마시는 거야. 거절은 안 받는 거야."',
      ],
      replies: [
        { say: '내가 우려 줄게', tier: 'great', remember: 'tea-gift', face: 'shy', answer: '물은 너무 뜨거우면 안 되는 거야. …그래, 잘하는 거야.' },
        { say: '베티가 좋아할 것 같았어', tier: 'good', remember: 'tea-gift', face: 'smile', answer: '눈치가 빠른 거야. 그건 칭찬인 거야. 받아 두는 거야.' },
        { say: '남아서 가져왔어', tier: 'meh', remember: 'tea-gift', face: 'calm', answer: '…남은 거라도 베티한테 온 건 좋은 거야. 흥인 거야.' },
      ],
    },
    {
      title: '찢어진 책',
      hint: '베아트리스에게 책을 소중히 다룬다는 걸 보여 주면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'book-care' },
      scene: [
        '카운터 위에 표지가 반쯤 찢어진 책 한 권이 놓여 있다.',
        '"누가 이렇게 한 거야. 반드시 알아내는 거야. …그 전에 고쳐야 하는 거야."',
        '"책을 아끼는 사람한테만 이 일을 맡기는 거야. 풀칠은 얇게 하는 거야."',
        '둘이서 한 장씩 펴서 말린다. 그녀의 손끝이 아주 조심스럽다.',
        '"…네 손은 책이 무서워하지 않는 손인 거야. 드문 거야."',
      ],
      replies: [
        { say: '베티한테 배운 거야', tier: 'great', remember: 'mended-book', face: 'shy', answer: '…그런 말은 반칙인 거야. 풀이 마를 때까지 옆에 있는 거야.' },
        { say: '다 고쳤다!', tier: 'good', remember: 'mended-book', face: 'smile', answer: '아직 마르는 중인 거야. 그래도 잘한 거야. 인정하는 거야.' },
        { say: '새 책 사면 안 돼?', tier: 'meh', remember: 'mended-book', face: 'sorry', answer: '이 책은 이 한 권뿐인 거야. 고쳐 쓰는 게 도서관인 거야.' },
      ],
    },
    {
      title: '기다림의 끝',
      hint: '베아트리스와 아주 가까워지면 그녀가 기다림 이야기를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '해 질 녘 창가. 베아트리스가 읽지도 않는 책을 펼쳐 두고 있다.',
        '"베티는 오래 기다린 거야. 누군지도 모르는 사람을인 거야."',
        '"요즘은 그 기다림이 끝난 것 같은 기분이 드는 거야. 이상한 거야."',
        '"…네가 문을 열고 들어올 때마다 그런 거야."',
        '그녀가 책을 탁 덮고 고개를 돌린다. 귀 끝이 빨갛다.',
      ],
      replies: [
        { say: '내가 그 사람이면 좋겠다', tier: 'great', face: 'shy', answer: '…꽃다발이라도 들고 오면 생각해 보는 거야. 꽃차 꽃이면 더 좋은 거야.' },
        { say: '앞으로도 올게', tier: 'good', face: 'smile', answer: '매일 오는 거야. 연체 없이인 거야. 그게 조건인 거야.' },
        { say: '그 사람은 곧 올 거야', tier: 'meh', face: 'think', answer: '…모르는 거야. 너는 정말 아무것도 모르는 거야.' },
      ],
    },
    {
      title: '닫힌 서고의 약속',
      hint: '베아트리스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '밤인데도 안쪽 서고 문이 열려 있다. 베아트리스가 그 앞에서 기다린다.',
        '"오늘부터 이 문은 너한테는 잠기지 않는 거야. 베티가 정한 거야."',
        '안에는 아무것도 적히지 않은 두꺼운 책 한 권뿐이다.',
        '"오래 기다린 약속의 책인 거야. 첫 장에 너와 베티 이름을 쓰는 거야."',
        '"…이건 계약인 거야. 평생 연체 금지인 거야. 알아들은 거야?"',
      ],
      replies: [
        { say: '평생 반납 안 할게', tier: 'great', face: 'shy', answer: '…그건 연체가 아니라 영구 대출인 거야. 특별히 허락하는 거야.' },
        { say: '같이 채워 나가자', tier: 'good', face: 'smile', answer: '한 장씩인 거야. 서두르면 안 되는 거야. 시간은 많은 거야.' },
        { say: '계약은 좀 무섭다', tier: 'meh', face: 'think', answer: '무서운 게 아니라 약속인 거야. 베티는 꼭 지키는 거야.' },
      ],
    },
  ],
  after: [
    '오늘은 충분히 이야기한 거야. 책이나 읽는 거야.',
    '또 온 거야? …자리는 비워 둔 거야. 조용히 앉는 거야.',
    '할 말은 다 한 거야. 내일 오는 거야. 연체하지 말고인 거야.',
    '흥, 딱히 배웅하는 건 아닌 거야. 문 닫는 김인 거야.',
  ],
};
