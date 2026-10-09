// 볼리바스 — 시장 거리 파출소 순경. 천둥 같은 목소리의 호탕한 반말, 수사 드라마
// 흉내("수상하군!", "수사 결과다"), 콧수염 쓸기, 곰 같은 덩치에 겨울이면 졸림
// (겨울잠 농담). 연어·민물고기·꿀·잼·프리렌네 빵에 약하고, 고향은 북쪽 설산.
// 폭풍이 오면 기운이 솟고, 밤마다 쓰레쉬 등불 상점을 지켜본다. 동네 사람에겐
// 한없이 다정하다. 대장장이 오른과는 같은 북쪽 얼음 땅 출신이라 말없이 통하고,
// 고향 어른들은 그를 '천둥 부르는 곰'이라 불렀다는 옛이야기를 품고 있다.
// 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const VOLIBAS_TALK: NpcTalkBook = {
  npc: 'volibas',
  memories: {
    'honey-fan': '꿀이 최고라고 같이 외쳤어요',
    'fish-fan': '연어가 최고라고 맞장구쳤어요',
    'drama-partner': '형사물 대사를 같이 연습했어요',
    'moustache-ok': '콧수염이 멋지다고 칭찬했어요',
    'snow-home': '설산 고향 이야기를 들었어요',
    'nap-guard': '겨울잠 자는 동안 마을을 지켜 주기로 했어요',
    'storm-friend': '폭풍 치는 날이 좋다고 했어요',
    'lantern-watch': '등불 상점 잠복을 같이 하기로 했어요',
    'bread-pal': '빵집 아침 줄을 같이 서기로 했어요',
    'lost-ring': '주인 잃은 반지 이야기를 들었어요',
    'justice-kind': '정의는 다정한 거라고 했어요',
    'line-keeper': '새치기는 못 참는다고 했어요',
    'patrol-pair': '순찰 짝꿍이 되기로 했어요',
    'night-patrol': '밤 순찰을 함께 돌았어요',
    'jam-feast': '잼 바른 빵을 나눠 먹었어요',
    'taste-heard': '내 취향을 수사 기록에 적어 뒀어요',
    'outing-talk': '함께 다닌 날을 순찰 일지에 적었어요',
    'bday-plan': '생일 경호 작전을 세웠어요',
    'ornn-kin': '대장장이 오른과 같은 고향이라고 들었어요',
    'armwrestle': '닐라와의 팔씨름 심판을 서 주기로 했어요',
    'tall-tale': '허풍 경연에 같이 나가기로 했어요',
    'clinic-pal': '메르시 의원에 같이 가 주기로 했어요',
    'old-whistle': '할아버지 호루라기 이야기를 들었어요',
    'soft-voice': '목소리 낮추는 연습을 도와줬어요',
    'bee-dream': '은퇴하면 벌통을 치고 싶대요',
    'river-paw': '강에서 연어 잡던 이야기를 들었어요',
    'bear-legend': '천둥 부르는 곰의 옛이야기를 들었어요',
    'lightning-scar': '어깨의 번개 흉터 이야기를 들었어요',
    'letter-home': '고향에 보낼 편지를 같이 썼어요',
    'aurora': '북쪽 하늘의 빛 이야기를 들었어요',
    'quiet-day': '사건 없는 날이 좋은 날이라고 했어요',
    'date-talk': '데이트 날을 비밀 조서에 적었대요',
  },
  talks: [
    {
      id: 'salmon-or-honey',
      open: '{me}, 중대한 질문이다. 연어냐, 꿀이냐. 신중하게 대답해라!',
      replies: [
        { say: '꿀 바른 연어구이!', tier: 'great', remember: 'honey-fan', answer: ['…천재다. 둘 다 고르는 자는 처음 봤다.', '크하하! 오늘 저녁 메뉴가 방금 정해졌다!'] },
        { say: '당연히 연어지', tier: 'good', remember: 'fish-fan', answer: ['좋은 대답이다! 가을 강에서 뛰는 연어를 보면 너도 알 거다.', '그 은빛… 생각만 해도 콧수염이 떨린다.'] },
        { say: '둘 다 별로야', tier: 'meh', face: 'wow', answer: '…수상하군. 아주 수상해. 다음 질문까지 생각해 와라.' },
      ],
    },
    {
      id: 'cop-drama',
      open: '어젯밤 형사물 봤나? 범인이 마지막에 자백하는 장면! 같이 해 보자.',
      replies: [
        { say: '"증거는 이미 다 나왔어!"', tier: 'great', remember: 'drama-partner', answer: ['오오! 눈빛 좋다!', '{me}, 너 파출소 들어와라. 진심이다. 의자는 내가 하나 더 들이마.'] },
        { say: '난 범인 역 할게', tier: 'good', face: 'laugh', answer: '크하하! 그럼 자백해라! …아, 너무 순순히 하면 재미가 없는데.' },
        { say: '그런 거 안 봐', tier: 'meh', face: 'sorry', answer: '이런. 인생의 반을 놓치고 있군. 다음 화는 파출소에서 같이 보자.' },
      ],
    },
    {
      id: 'moustache',
      open: '오늘 콧수염 어떠냐. 아침에 세 번 빗었다. 솔직하게 말해라. 수사다.',
      replies: [
        { say: '천둥처럼 위엄 있어', tier: 'great', remember: 'moustache-ok', answer: '크하하하! 바로 그 말이 듣고 싶었다! 오늘 하루는 무적이다!' },
        { say: '한쪽이 살짝 삐쳤어', tier: 'good', face: 'think', answer: ['뭐라고? 거울, 거울!', '…정말이군. 정직한 시민이다. 고맙다.'] },
        { say: '밀어 버리면 어때?', tier: 'meh', face: 'wow', answer: '그건 범죄다! 아니, 범죄는 아니지만 거의 범죄다!' },
      ],
    },
    {
      id: 'snow-home',
      open: '내 고향은 북쪽 설산이다. 눈이 지붕까지 쌓이고 번개가 산을 때렸지.',
      replies: [
        { say: '더 들려줘', tier: 'great', remember: 'snow-home', answer: ['밤마다 하늘이 번쩍했다. 무섭기보다 신났지.', '얼음 위를 맨발로 뛰어다녔다. 발바닥이 곰 발바닥이 됐다.', '…여기 와서도 폭풍이 오면 그 산이 생각난다.'] },
        { say: '춥지 않았어?', tier: 'good', answer: '추웠다! 그래서 다들 덩치가 컸지. 이 털 칼라도 고향 거다.' },
        { say: '난 따뜻한 데가 좋아', tier: 'meh', face: 'calm', answer: '그래, 여기 마을이 딱 좋지. 나도 요즘은 그렇다.' },
      ],
    },
    {
      id: 'hibernation',
      open: '겨울만 되면 눈꺼풀이 천근이다. 이건 겨울잠이 아니다. 근무 피로다.',
      replies: [
        { say: '자는 동안 내가 지킬게', tier: 'great', remember: 'nap-guard', face: 'shy', answer: ['…{me}. 그런 말 처음 들었다.', '임시 순경 배지라도 만들어 줘야겠군. 진짜다.'] },
        { say: '그거 겨울잠 맞잖아', tier: 'good', face: 'laugh', answer: '쉿! 목소리 낮춰라. 그건 수사 기밀이다. 크하하!' },
        { say: '근무 중에 자면 안 돼', tier: 'meh', face: 'sorry', answer: '…맞는 말이다. 반박할 수가 없군. 꿀차 한 잔 더 마시겠다.' },
      ],
    },
    {
      id: 'storm-love',
      open: '{me}, 천둥 치는 날 어떠냐? 다들 숨는데 난 이상하게 기운이 난다.',
      replies: [
        { say: '나도 폭풍 좋아!', tier: 'great', remember: 'storm-friend', answer: ['크하하하! 동지다!', '다음 폭풍엔 파출소 창가에서 같이 구경하자!'] },
        { say: '번개는 좀 무서워', tier: 'good', face: 'smile', answer: '괜찮다. 번개 치면 파출소로 와. 내 목소리가 천둥보다 크니까.' },
        { say: '그냥 맑은 게 좋아', tier: 'meh', answer: '맑은 날도 나쁘진 않지. 배지가 반짝이니까. 그래도 천둥이 좋다.' },
      ],
    },
    {
      id: 'lantern-shop',
      open: '쓰레쉬 등불 상점 말이다. 밤마다 초록 불이 깜박인다. 수상하지 않나?',
      replies: [
        { say: '같이 잠복하자', tier: 'great', remember: 'lantern-watch', answer: ['좋다! 간식은 꿀빵, 암호는 "연어".', '밤에 시장 거리 모퉁이다. 늦으면 꿀빵은 내가 먹는다.'] },
        { say: '그냥 등불 가게잖아', tier: 'good', face: 'think', answer: '그래, 그렇긴 하지. 근데 그 웃음소리가… 아니다. 감시는 계속한다.' },
        { say: '네가 더 수상해', tier: 'meh', face: 'wow', answer: '나, 나 말이냐? 순경을 의심하다니! …자수할 건 꿀 도둑질뿐이다.' },
      ],
    },
    {
      id: 'bread-line',
      open: '프리렌네 빵집은 아침에 늦게 연다. 그래서 늘 줄 맨 앞에서 기다리지.',
      replies: [
        { say: '내일 같이 줄 서자', tier: 'great', remember: 'bread-pal', answer: '좋다! 줄 서기는 질서의 기본이다. 꿀빵 하나는 내가 사겠다.' },
        { say: '무슨 빵이 제일 좋아?', tier: 'good', answer: ['잼 듬뿍 든 둥근 빵이다.', '프리렌한텐 비밀이다. 알면 더 늦게 열까 봐.'] },
        { say: '줄 서는 건 귀찮아', tier: 'meh', face: 'sorry', answer: '그래도 새치기는 안 된다! 그건 내가 제일 싫어하는 거다.' },
      ],
    },
    {
      id: 'lost-ring',
      open: '낙엽 쓸다 반지를 하나 주웠다. 주인이 아직 안 나타났다. 미제 사건이지.',
      replies: [
        { say: '주인 찾는 거 도울게', tier: 'great', remember: 'lost-ring', answer: ['든든하군! 잔나한테 신문에 실어 달라고 하자.', '단서는 안쪽에 새긴 글자다. 다 닳아서 반쯤만 읽힌다.'] },
        { say: '분명 소중한 거겠지', tier: 'good', face: 'think', answer: '그래. 그래서 매일 닦아 둔다. 돌려줄 때 빛나 있어야 하니까.' },
        { say: '그냥 가지면 안 돼?', tier: 'meh', face: 'wow', answer: '절대 안 된다! 분실물은 주인 거다. 이건 순경 수칙 첫 줄이다.' },
      ],
    },
    {
      id: 'justice',
      open: '{me}, 정의가 뭐라고 생각하냐. 크게 소리치는 거? 범인 잡는 거?',
      replies: [
        { say: '다친 사람 먼저 챙기는 거', tier: 'great', remember: 'justice-kind', face: 'smile', answer: ['…그래. 그거다. 나도 그렇게 배웠다.', '정의는 무서운 게 아니라 다정한 거다. 잊지 말자, 우리 둘 다.'] },
        { say: '나쁜 놈 잡는 거!', tier: 'good', answer: ['크하하! 그것도 맞다!', '근데 잡고 나서 밥은 먹여야 한다. 그게 내 방식이다.'] },
        { say: '잘 모르겠어', tier: 'meh', face: 'calm', answer: '모르는 게 정직한 거다. 같이 순찰하다 보면 알게 될 거다.' },
      ],
    },
    {
      id: 'line-cutter',
      open: '오늘 시장에서 새치기범을 잡았다. 범인은… 갈매기였다. 수사 결과다.',
      replies: [
        { say: '새치기는 용서 못 해', tier: 'great', remember: 'line-keeper', answer: '그렇지! 너도 질서의 편이군. 갈매기한텐 훈방 조치했다.' },
        { say: '갈매기가 배고팠나 봐', tier: 'good', face: 'laugh', answer: '그래서 생선 꼬리 하나 줬다. 순경도 가끔은 마음이 약하다.' },
        { say: '그게 사건이야?', tier: 'meh', answer: '사건이다! 작은 사건을 잡아야 큰 사건이 안 생긴다. 크흠.' },
      ],
    },
    {
      id: 'bug-prank',
      open: '…비밀 하나 말해 줄까. 이 덩치로 벌레 장난이 제일 무섭다.',
      replies: [
        { say: '비밀 지켜 줄게', tier: 'great', face: 'shy', answer: '고맙다. 이건 우리 둘만의 기밀이다. 증거 인멸 완료!' },
        { say: '꿀벌은 괜찮아?', tier: 'good', face: 'think', answer: '꿀벌은 동료다! 꿀을 만들어 주잖아. 그건 벌레가 아니라 은인이다.' },
        { say: '등에 붙었다!', tier: 'meh', face: 'wow', answer: '으아악! …농담이었나? 수상하군, {me}. 아주 수상해!' },
      ],
    },
    {
      id: 'ornn-kin',
      open: '산기슭 대장장이 오른 말이다. 그 녀석도 북쪽 얼음 땅 출신이다.',
      replies: [
        { say: '둘이 무슨 사이야?', tier: 'great', remember: 'ornn-kin', face: 'think', answer: ['…아주 오래된 사이다. 형제 같기도 하고, 앙숙 같기도 하고.', '만나면 세 마디로 끝난다. "왔냐." "왔다." "먹어라."', '그 세 마디에 할 말이 다 들어 있다. 고향 사람은 그렇다.'] },
        { say: '대장간 소리 천둥 같지', tier: 'good', face: 'laugh', answer: '그렇다! 그 망치 소리 들으면 마음이 편하다. 본인한텐 말 마라.' },
        { say: '무뚝뚝해서 무섭던데', tier: 'meh', face: 'calm', answer: '겉만 그렇다. 내 호루라기 고리도 말없이 고쳐 줬다. 돈도 안 받고.' },
      ],
    },
    {
      id: 'nilah-wrestle',
      open: '목장 닐라가 또 팔씨름을 걸어 왔다. 결과는… 무승부다. 늘 무승부다.',
      replies: [
        { say: '다음엔 내가 심판 볼게', tier: 'great', remember: 'armwrestle', face: 'laugh', answer: ['좋다! 공정한 제삼자가 필요했다!', '닐라는 자기가 이겼다고 우기고, 나는 무승부라고 우긴다.', '…네가 보면 진실이 밝혀지겠지. 조금 겁나는군.'] },
        { say: '사실 진 거 아니야?', tier: 'good', face: 'sorry', answer: '수, 수사 기밀이다! 손목이 좀 저린 건 날씨 탓이다.' },
        { say: '팔씨름 왜 해?', tier: 'meh', answer: '고향에선 인사였다. 손을 맞잡으면 서로 힘을 안다. 그거면 친구다.' },
      ],
    },
    {
      id: 'captain-tales',
      open: '허풍 주점에서 허풍 경연이 열린다. 심판은 나, 주인장은 선장이다.',
      replies: [
        { say: '나도 출전할래!', tier: 'great', remember: 'tall-tale', answer: ['크하하! 좋다! 출전 시민 등록!', '규칙은 하나. 허풍은 크게, 거짓말은 하지 않기.', '…그 차이가 뭐냐고? 웃기면 허풍이고 울리면 거짓말이다.'] },
        { say: '선장 허풍이 제일 크지', tier: 'good', face: 'laugh', answer: '고래를 맨손으로 들었다더군. 그래서 내가 들어 보라고 했지. 술통을.' },
        { say: '허풍은 싫어', tier: 'meh', face: 'think', answer: '그럼 관객석으로 와라. 웃는 사람도 꼭 필요하다.' },
      ],
    },
    {
      id: 'mercy-clinic',
      open: '메르시 의원 단골이 됐다. 순찰하다 넘어지고, 부딪치고, 또 넘어지고.',
      replies: [
        { say: '다음엔 같이 가 줄게', tier: 'great', remember: 'clinic-pal', face: 'shy', answer: ['…{me}. 사실 주사가 좀 무섭다.', '이 덩치로 그런 말 하긴 그렇지만. 옆에 있어 주면 든든하겠다.'] },
        { say: '조심 좀 해!', tier: 'good', face: 'sorry', answer: '메르시도 똑같이 말한다. 그 말 들을 때마다 붕대가 하나씩 는다.' },
        { say: '덩치에 비해 약하네', tier: 'meh', face: 'wow', answer: '약한 게 아니다! 길이 좁은 거다! 이 마을 골목은 곰용이 아니다.' },
      ],
    },
    {
      id: 'valkyrie-axe',
      open: '가구점 발키리가 또 도끼를 메고 시장에 왔다. 검문했다가 한 소리 들었다.',
      replies: [
        { say: '목수 연장이잖아', tier: 'great', face: 'think', answer: ['…알고 있다. 그래도 날이 번쩍하면 몸이 먼저 나간다.', '대신 오늘은 사과하고, 파출소 의자 수리를 맡겼다.', '튼튼하게 만들어 주더군. 내가 앉아도 끄떡없다.'] },
        { say: '뭐라고 했는데?', tier: 'good', face: 'laugh', answer: '"순경 아저씨 콧수염이나 검문하쇼." …그 말에 반박을 못 했다.' },
        { say: '둘 다 무서워', tier: 'meh', face: 'sorry', answer: '나는 안 무섭다! 발키리도 사실 다정하다. 의자 다리는 둥글게 깎더군.' },
      ],
    },
    {
      id: 'makima-cart',
      open: '장날마다 그 행상인 수레 뒤를 따라간다. 마키마 말이다. 산책이다. 그냥.',
      replies: [
        { say: '뭐가 그렇게 수상해?', tier: 'great', face: 'think', answer: ['미소가 너무 반듯하다. 물건값도 너무 반듯하고.', '…근데 이상하게 다 정직한 장사다. 그래서 더 수상하다.', '수사란 원래 그런 거다. 증거가 없을수록 눈을 크게 뜬다.'] },
        { say: '그냥 친해지고 싶은 거지?', tier: 'good', face: 'shy', answer: '아, 아니다! 순경이 행상인이랑 친해지면 곤란하다. …아마.' },
        { say: '들키지 않았어?', tier: 'meh', face: 'sorry', answer: '첫날부터 들켰다. "순경님 덩치는 수레보다 커요." 맞는 말이다.' },
      ],
    },
    {
      id: 'old-whistle',
      open: '이 호루라기 보이나? 할아버지 거다. 소리가 쉬어도 안 바꾼다.',
      replies: [
        { say: '옛것엔 이유가 있지', tier: 'great', remember: 'old-whistle', face: 'smile', answer: ['그렇다! 바로 그거다!', '할아버지는 눈보라 속에서 이걸로 길 잃은 사람을 불렀다.', '새 호루라기는 소리는 맑아도, 그 눈보라를 모른다.'] },
        { say: '한번 불어 봐', tier: 'good', face: 'laugh', answer: '삐이… 쉭. 봐라, 쉬었다. 그래도 시장 고양이들은 다 알아듣는다.' },
        { say: '새로 하나 사', tier: 'meh', face: 'calm', answer: '새것이 다 좋은 건 아니다. 이건 내 고집이다. 고칠 생각 없다.' },
      ],
    },
    {
      id: 'soft-voice',
      open: '어제 주점에서 박수를 쳤더니 봇치가 무대 뒤로 숨었다. 내 박수가 천둥이라.',
      replies: [
        { say: '작게 치는 연습 하자', tier: 'great', remember: 'soft-voice', face: 'shy', answer: ['…좋다. 이렇게? 짝. 아니, 이렇게? 짝.', '어렵군. 범인 잡는 것보다 어렵다.', '그래도 봇치가 다시 무대에 서면 좋겠다. 연습하겠다.'] },
        { say: '봇치는 기뻤을 거야', tier: 'good', face: 'smile', answer: '그럴까? 숨은 채로 기타를 한 줄 더 쳐 주긴 하더군.' },
        { say: '박수 치지 마', tier: 'meh', face: 'sorry', answer: '…그건 너무 가혹하다. 좋은 노래엔 박수가 정의다.' },
      ],
    },
    {
      id: 'bee-dream',
      open: '봄에 츠나데 할머니 텃밭 벌통을 지켜 드렸다. 벌들이 나를 안 쏘더군.',
      replies: [
        { say: '벌도 순경을 알아보네', tier: 'great', remember: 'bee-dream', face: 'shy', answer: ['크하하! 그런가!', '…사실 꿈이 하나 있다. 늙으면 설산 아래 벌통을 치는 거다.', '꿀 한 숟가락, 빵 한 조각. 그거면 평생 행복하다.'] },
        { say: '꿀은 얻어 왔어?', tier: 'good', face: 'laugh', answer: '한 병 받았다! 수고비다. 뇌물 아니다. 츠나데 할머니가 그랬다.' },
        { say: '벌은 무섭던데', tier: 'meh', face: 'calm', answer: '가만히 있으면 괜찮다. 벌도 마을 사람이다. 예의만 지키면 된다.' },
      ],
    },
    {
      id: 'river-paw',
      open: '하쿠네 과수원 옆 강 말이다. 가을이면 연어가 거슬러 오른다.',
      replies: [
        { say: '맨손으로 잡아 봤어?', tier: 'great', remember: 'river-paw', face: 'laugh', answer: ['…고향에선 그랬다. 강에 서 있으면 연어가 손에 뛰어들었다.', '여기선 안 한다. 하쿠가 과수원 앞에서 그러지 말랬다.', '대신 거슬러 오르는 걸 구경한다. 포기 안 하는 놈들이다.'] },
        { say: '연어는 왜 거슬러 올라?', tier: 'good', face: 'think', answer: '태어난 곳으로 돌아가는 거다. 멀어도, 물이 세도. 존경스럽다.' },
        { say: '물고기엔 관심 없어', tier: 'meh', face: 'sorry', answer: '…그럼 단풍이라도 봐라. 과수원 사과도 그때 제일 맛있다.' },
      ],
    },
    {
      id: 'lost-box',
      open: '파출소 분실물 상자를 정리했다. 장갑 한 짝, 틀니, 그리고 오리 한 마리.',
      replies: [
        { say: '오리?!', tier: 'great', face: 'laugh', answer: ['연못 청둥오리다. 스스로 들어가서 안 나온다.', '분실물인지 자수범인지 아직 판단 중이다.', '빵 부스러기를 주면 꽥 하고 대답은 한다. 협조적이다.'] },
        { say: '틀니 주인은 찾았어?', tier: 'good', face: 'think', answer: '찾았다. 웃으면서 받아 가셨다. 아니, 웃으려고 받아 가셨다.' },
        { say: '다 버리면 안 돼?', tier: 'meh', face: 'wow', answer: '안 된다! 장갑 한 짝도 누군가의 겨울이다.' },
      ],
    },
    {
      id: 'quiet-day',
      open: '사건 일지를 쓰는데 오늘도 "이상 무"다. 형사물 같은 일은 하나도 없다.',
      replies: [
        { say: '그게 제일 좋은 날이지', tier: 'great', remember: 'quiet-day', face: 'smile', answer: ['…그래. 맞다. 젊을 땐 큰 사건이 멋진 줄 알았다.', '지금은 이 세 글자가 제일 자랑스럽다. 이상 무.'] },
        { say: '심심하겠다', tier: 'good', face: 'laugh', answer: '심심할 틈이 없다! 오늘도 고양이 둘, 우산 하나, 오리 하나다.' },
        { say: '사건 하나 만들어 줄까?', tier: 'meh', face: 'wow', answer: '수상하군! 지금 그 말, 조서에 적어 둔다. 농담이다. 반쯤.' },
      ],
    },
    {
      id: 'bear-legend',
      open: '고향 어른들이 해 주던 옛이야기가 있다. 천둥을 부르는 큰 곰 이야기다.',
      replies: [
        { say: '끝까지 들려줘', tier: 'great', remember: 'bear-legend', face: 'think', answer: ['그 곰이 울면 하늘이 울고, 그 곰이 걸으면 산이 울렸다더군.', '사람들은 무서워하면서도 폭풍이 오면 그 곰을 기다렸다.', '…어른들은 날 보고 그 곰을 닮았다고 웃었다. 크흠.'] },
        { say: '혹시 그 곰이 너야?', tier: 'good', face: 'wow', answer: '하, 하하! 수사 기밀이다! …콧수염 있는 곰은 이야기에 없었다.' },
        { say: '무서운 얘기 싫어', tier: 'meh', face: 'calm', answer: '무서운 얘기가 아니다. 지켜 주는 곰이었다. 그래도 그만하마.' },
      ],
    },
    {
      id: 'lightning-scar',
      open: '어깨에 번개 모양 흉터가 있다. 어릴 때 폭풍 속에 서 있다가 생겼다.',
      replies: [
        { say: '안 아팠어?', tier: 'great', remember: 'lightning-scar', face: 'shy', answer: ['아팠다. 근데 이상하게 무섭진 않았다.', '그날부터 천둥이 치면 피가 끓는다. 친구가 생긴 기분이다.', '…메르시는 그 얘길 들으면 한숨을 쉰다. 왜일까.'] },
        { say: '폭풍 속엔 왜 서 있었어?', tier: 'good', face: 'think', answer: '하늘이 뭐라고 하는지 들어 보려고. 대답은 아직 못 들었다.' },
        { say: '그건 위험해!', tier: 'meh', face: 'sorry', answer: '…안다. 너는 절대 따라 하지 마라. 순경 명령이다.' },
      ],
    },
    {
      id: 'helping-hand',
      open: '오늘 장보러 오신 할머니 짐을 세 번 들어 드렸다. 근무 시간의 절반이다.',
      replies: [
        { say: '그것도 순경 일이지', tier: 'great', face: 'smile', answer: ['그렇지! 범인보다 무거운 장바구니가 더 많은 마을이다.', '나는 이 마을이 그래서 좋다.'] },
        { say: '팔 아프겠다', tier: 'good', face: 'laugh', answer: '이 팔로? 크하하! 배추 열 포기도 거뜬하다. 무는 좀 무겁더군.' },
        { say: '일은 언제 해?', tier: 'meh', face: 'think', answer: '이게 일이다. 수배 전단은 밤에 붙인다. 오리가 도와준다.' },
      ],
    },
    {
      id: 'janna-bear',
      open: '잔나가 또 내 기사를 썼다. 제목이 "곰 같은 순경, 오리를 체포하다".',
      replies: [
        { say: '제목 좋은데!', tier: 'great', face: 'laugh', answer: ['…사실 나도 좋다. 오려서 파출소 벽에 붙였다.', '오리는 체포가 아니라 보호다. 정정 보도는 요구 안 했다.'] },
        { say: '곰은 좀 심했네', tier: 'good', face: 'think', answer: '틀린 말은 아니라서 항의를 못 했다. 거울을 보니 곰이더군.' },
        { say: '신문 안 봐', tier: 'meh', face: 'sorry', answer: '봐라! 잔나 기사는 날씨만 빼면 다 정확하다.' },
      ],
    },
    {
      id: 'letter-home',
      open: '신짜장이 고향행 편지 없냐고 묻더군. 써야 하는데 첫 줄이 안 나온다.',
      replies: [
        { say: '같이 써 보자', tier: 'great', remember: 'letter-home', face: 'shy', answer: ['…고맙다. 첫 줄은 "잘 있다"로 하자.', '둘째 줄은 "좋은 마을이다". 셋째 줄은… "친구가 생겼다".', '이 정도면 어른들도 안심하겠군. 신짜장한테 맡기겠다.'] },
        { say: '고향엔 누가 있어?', tier: 'good', face: 'think', answer: '눈 덮인 산, 얼어붙은 강, 그리고 잔소리 많은 어른들. 다 그립다.' },
        { say: '그냥 안 써도 되잖아', tier: 'meh', face: 'calm', answer: '안 쓰면 걱정한다. 걱정 끼치는 건 순경답지 않다.' },
      ],
    },
    {
      id: 'aurora',
      open: '겨울밤 북쪽 하늘엔 빛이 흐른다. 초록, 보라. 하늘에 강이 생긴 것 같지.',
      replies: [
        { say: '나도 보고 싶다', tier: 'great', remember: 'aurora', face: 'smile', answer: ['언젠가 보여 주마. 털 칼라 두 개 챙겨서.', '그 빛 아래선 다들 목소리를 낮춘다. 나도 그렇다.', '…신기하지. 천둥 같은 놈이 조용해지는 유일한 하늘이다.'] },
        { say: '쓰레쉬 등불 색이네', tier: 'good', face: 'wow', answer: '…그러고 보니! 그래서 자꾸 눈이 가는 건가. 수사 방향을 재검토한다.' },
        { say: '별이 더 좋아', tier: 'meh', face: 'calm', answer: '여기 별도 좋다. 순찰 끝나고 올려다보면 하루가 정리된다.' },
      ],
    },
    {
      id: 'summer-heat',
      open: '설산 출신한테 여름은 사건이다. 어제는 개울에 발 담그고 순찰했다.',
      replies: [
        { say: '얼음물 갖다줄게', tier: 'great', face: 'laugh', answer: ['정말이냐! 너는 시민의 귀감이다!', '얼음은 정의다. 여름에는 특히 정의롭다.'] },
        { say: '털 칼라 벗으면 되잖아', tier: 'good', face: 'wow', answer: '이건 제복이다! 그리고 고향 거다. 땀이 나도 지킨다.' },
        { say: '난 여름이 좋은데', tier: 'meh', face: 'sorry', answer: '…부럽다. 나는 여름엔 그늘만 골라 다니는 곰이다.' },
      ],
    },
    {
      id: 'casino-coin',
      open: '카지노 앞 순찰은 하지만 안에는 안 들어간다. 동전 한 닢도 아깝거든.',
      replies: [
        { say: '그 돈으로 꿀 사야지', tier: 'great', face: 'laugh', answer: ['크하하! 정확하다! 동전 한 닢이면 꿀빵이 반 개다.', '반 개도 정의다. 함부로 걸 수 없다.'] },
        { say: '한 판도 안 해 봤어?', tier: 'good', face: 'shy', answer: '…딱 한 번. 이겼다. 너무 신나서 소리를 질렀더니 쫓겨났다.' },
        { say: '재밌는데 아깝다', tier: 'meh', face: 'calm', answer: '즐기는 건 좋다. 다만 집에 갈 차비는 꼭 남겨라. 순경 부탁이다.' },
      ],
    },
    {
      id: 'patrol-partner',
      when: { ch: 3 },
      open: '{me}. 공식적으로 묻겠다. 내 순찰 짝꿍이 되어 줄 수 있나?',
      replies: [
        { say: '영광이야, 순경님', tier: 'great', remember: 'patrol-pair', face: 'shy', answer: ['크, 크흠! 그럼 내일부터다.', '배지는… 내가 직접 깎아 만들겠다. 오른한테 쇠를 좀 얻어 와서.'] },
        { say: '간식 주면 할게', tier: 'good', face: 'laugh', answer: '크하하! 꿀빵 하루 두 개. 거래 성립이다!' },
        { say: '난 아침잠이 많아', tier: 'meh', answer: '나도 겨울엔 그렇다. 그럼 저녁 순찰만 같이 하자. 그거면 된다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비다! 빗속 추격전은 형사물의 꽃이지. 근데 내 우비가 좀 작다.',
      replies: [
        { say: '우산 같이 쓰자', tier: 'great', face: 'shy', answer: '…반도 안 들어가겠지만 고맙다. 마음만은 다 들어갔다!' },
        { say: '빗길 조심해', tier: 'good', answer: '그건 내가 할 말이다! 다리 위 미끄러운 데는 피해서 다녀라.' },
        { say: '비는 우울해', tier: 'meh', face: 'calm', answer: '그럼 파출소 와서 꿀차 마셔라. 빗소리 듣는 것도 나쁘지 않다.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '크하하하! 폭풍이다! 천둥이 칠 때마다 콧수염이 곤두선다!',
      replies: [
        { say: '같이 천둥 구경하자!', tier: 'great', remember: 'storm-friend', answer: ['좋다! 파출소 창가 명당을 내주지.', '번쩍하면 같이 소리 지르는 거다! 하나, 둘…'] },
        { say: '다들 무사할까?', tier: 'good', face: 'think', answer: '걱정 마라. 순찰은 두 배로 돈다. 파출소 문도 활짝 열어 뒀다.' },
        { say: '난 집에 갈래', tier: 'meh', face: 'smile', answer: '현명하다! 실내 대피는 시민의 의무다. 나는 빼고. 조심히 가라!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다. 발자국 수사하기 딱 좋은 날이지. 근데… 하암, 졸리다.',
      replies: [
        { say: '눈사람 불심검문 하자', tier: 'great', answer: '크하하! 좋다! 코가 진짜 당근인지 확인해야 한다. 가자!' },
        { say: '고향 생각나?', tier: 'good', remember: 'snow-home', face: 'think', answer: '…조금. 이 정도 눈은 고향에선 봄이다. 그래도 반갑군.' },
        { say: '그냥 자', tier: 'meh', face: 'sorry', answer: '근무 중엔 안 된다! …오 분만. 아니, 안 된다. 크흠.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날이군. 형사물이라면 오늘 사건이 터진다. 콧수염도 곱슬해졌다.',
      replies: [
        { say: '같이 탐문 수사 가자', tier: 'great', answer: ['좋다! 첫 탐문지는 빵집이다.', '목격자는 프리렌, 증거물은 잼빵. 수사는 원래 배부르게 하는 거다.'] },
        { say: '콧수염 곱슬한 거 귀여워', tier: 'good', face: 'shy', answer: '귀, 귀엽다니! 순경한테 그런 말 하면… 한 번 더 해도 된다.' },
        { say: '흐리면 기운 없어', tier: 'meh', face: 'calm', answer: '그럼 오후를 기다려라. 먹구름 냄새가 난다. 천둥이 기운을 줄 거다.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '맑다! 배지에 광을 냈더니 햇빛이 반사돼서 갈매기가 도망갔다.',
      replies: [
        { say: '갈매기 퇴치 성공이네', tier: 'great', face: 'laugh', answer: ['크하하! 새치기범 갈매기 놈이다. 오늘은 줄을 섰더군.', '배지의 힘이다. 아니, 햇볕의 힘인가.'] },
        { say: '선글라스는?', tier: 'good', answer: '모자에 걸어 뒀다. 쓰면 안 보인다. 멋은 걸어 두는 거다.' },
        { say: '천둥이 없어서 아쉽지?', tier: 'meh', face: 'think', answer: '…조금. 그래도 이런 날은 시장 사람들이 웃는다. 그게 낫다.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '쉿. 잠복 중이다. 쓰레쉬 가게에 또 초록 불이 켜졌다. 수상하군.',
      replies: [
        { say: '나도 같이 볼게', tier: 'great', remember: 'lantern-watch', answer: ['좋다, 파트너. 소리 내지 마라.', '…내 배에서 나는 소리는 무시하고.'] },
        { say: '밤인데 안 졸려?', tier: 'good', answer: '밤엔 귀가 밝아진다. 곰처럼. 졸린 건 겨울뿐이다.' },
        { say: '쓰레쉬 착한 사람이야', tier: 'meh', face: 'think', answer: '…알고 있다. 그래도 지켜보는 게 내 일이다. 그 녀석도 안다.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽 순찰이다! 이 시간에 깨어 있는 자는 성실한 자 아니면 수상한 자!',
      replies: [
        { say: '성실한 쪽이야!', tier: 'great', answer: '크하하! 모범 시민 확인! 빵집 줄에 내 앞자리를 양보하지.' },
        { say: '아직 못 잤어', tier: 'good', face: 'sorry', answer: '이런. 그럼 순찰 끝나면 집까지 바래다주겠다. 경호다.' },
        { say: '수상한 쪽', tier: 'meh', face: 'wow', answer: '자수하다니! 정직하군. 처벌은 꿀차 한 잔 마시기다.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '해 질 녘이다. 드라마에선 이 시간에 꼭 일이 터지지. 오늘은 조용하군.',
      replies: [
        { say: '노을 같이 보자', tier: 'great', face: 'shy', answer: ['…순찰 중이지만. 오 분만이다.', '노을빛이 배지에 비치니까 꼭 불붙은 것 같군. 좋다.'] },
        { say: '저녁은 먹었어?', tier: 'good', face: 'laugh', answer: '아직이다! 연어구이 생각만 세 번 했다. 정의도 저녁은 먹는다.' },
        { say: '조용하면 지루하지', tier: 'meh', face: 'calm', answer: '조용한 게 제일이다. 사건 없는 저녁이 내 월급이다.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이다! 겨울 내내 졸던 눈이 번쩍 떠졌다. 오늘 순찰은 두 바퀴다!',
      replies: [
        { say: '겨울잠에서 깼구나', tier: 'great', face: 'laugh', answer: ['겨울잠이 아니다! 근무 피로 회복이다!', '…아무튼 개운하다. 꿀벌들도 일어났더군. 동료들이다.'] },
        { say: '봄바람 조심해', tier: 'good', answer: '빨래 날아가는 사건이 벌써 둘이다. 하나는 내 양말이었다.' },
        { say: '봄엔 나른해', tier: 'meh', face: 'sorry', answer: '그건 이해한다. 나는 겨울에, 너는 봄에. 교대로 지키자.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', time: 'day' },
      open: '덥다… 털 칼라가 원망스럽다. 이건 더위가 아니라 범죄다.',
      replies: [
        { say: '그늘로 같이 가자', tier: 'great', face: 'smile', answer: ['{me}… 너는 생명의 은인이다.', '그늘 순찰도 순찰이다. 기록엔 그렇게 적겠다.'] },
        { say: '빙수 먹으러 갈래?', tier: 'good', face: 'wow', answer: '빙수! 꿀 얹은 거로! 근무 중이지만 이건 응급 상황이다.' },
        { say: '나는 시원한데', tier: 'meh', face: 'sorry', answer: '…부럽군. 설산 사람은 여름에 약하다. 숨길 수 없는 진실이다.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이다. 강에 연어가 오를 철이지. 근무 중인데 자꾸 강 쪽으로 걷는다.',
      replies: [
        { say: '강 쪽 순찰 같이 가자', tier: 'great', remember: 'fish-fan', face: 'laugh', answer: ['크하하! 순전히 순찰이다! 연어 구경은 덤이다!', '…한 마리만 뛰어오르면 박수는 작게 치겠다.'] },
        { say: '먹성도 늘었지?', tier: 'good', face: 'shy', answer: '겨울 준비다. 곰이냐고? 묻지 마라. 수사 기밀이다.' },
        { say: '낙엽만 많아', tier: 'meh', face: 'calm', answer: '낙엽 아래 분실물이 숨어 있다. 쓸면 보물이 나온다.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter', time: ['evening', 'night'] },
      open: '하암… 겨울 저녁은 눈꺼풀이 쇳덩이다. 난로 앞에서 조서를 쓰는 중이다.',
      replies: [
        { say: '꿀차 끓여 줄게', tier: 'great', face: 'shy', answer: ['…고맙다. 너 덕분에 오늘 겨울잠은 미뤄졌다.', '조서 마지막 줄에 적겠다. "따뜻한 시민 방문."'] },
        { say: '잠깐 눈 붙여', tier: 'good', face: 'sorry', answer: '오 분만. 아니, 십 분. 누가 오면 깨워라. 오리 말고.' },
        { say: '그거 겨울잠 맞지?', tier: 'meh', face: 'wow', answer: '아, 아니다! 근무 피로다! 크흠. 목소리 좀 낮춰라.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: ['trout', 'sweetfish', 'lenok', 'goldcarp'] },
      open: '킁킁… 이 냄새! {me}, 오늘 민물고기 잡았지? {fish}! 증거가 확실하다!',
      replies: [
        { say: '하나 줄까?', tier: 'great', answer: ['정말이냐! 크하하!', '이건 뇌물이 아니라 우정이다. 확실히 우정이다!'] },
        { say: '코가 진짜 좋네', tier: 'good', answer: '순경의 코다. 범죄 냄새랑 생선 냄새는 절대 안 놓친다.' },
        { say: '안 줄 거야', tier: 'meh', face: 'sorry', answer: '…알고 있었다. 묻지도 않았다. 침도 안 흘렸다. 크흠.' },
      ],
    },
    {
      id: 'op-fish-any',
      when: { fish: true },
      open: '{me}, 오늘 낚시했나? 손에 비린내가 난다. 수사 결과다!',
      replies: [
        { say: '{fish}, 잡았어!', tier: 'great', answer: '오오! 좋은 손맛이었겠군. 연어는 아직이냐? 연어 잡으면 꼭 말해라!' },
        { say: '겨우 한 마리야', tier: 'good', answer: '한 마리면 충분하다. 범인도 하나씩 잡는 거다.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '속보를 접수했다! 오늘 엄청난 놈을 낚았다며? 현장 조사 나왔다!',
      replies: [
        { say: '진짜 내가 잡았어!', tier: 'great', answer: '크하하하! 마을 기록이다! 파출소 게시판에 사진 붙여 주지!' },
        { say: '팔이 아직 떨려', tier: 'good', face: 'smile', answer: '영광의 상처다. 메르시한테 가 봐라. 나도 자주 간다.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙냄새가 난다. 밭일했군. 땀 흘린 시민은 순경이 존경한다!',
      replies: [
        { say: '꿀벌이 많이 왔어', tier: 'great', answer: '오! 꿀벌은 동료다. 밭에 꿀벌 오면 좋은 밭이다. 수사 결과다.' },
        { say: '허리가 아파', tier: 'good', answer: '앉아라. 파출소 의자는 튼튼하다. 내가 앉아도 안 부서진다.' },
        { say: '그냥 그랬어', tier: 'meh', face: 'calm', answer: '그런 날도 있지. 그래도 밭은 거짓말을 안 한다.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '반짝이는 걸 봤다! 금별 작물이라니, 도둑맞지 않게 경호해 주지!',
      replies: [
        { say: '경호 부탁해!', tier: 'great', answer: '맡겨라! 오늘 순찰 경로에 네 밭을 두 번 넣겠다!' },
        { say: '운이 좋았어', tier: 'good', answer: '정성이다. 운은 정성 들인 밭에만 들른다.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 인파 관리 중이다! 즐기되 질서 있게! …북은 내가 친다!',
      replies: [
        { say: '천둥 북소리 들려줘!', tier: 'great', answer: ['크하하! 좋다! 둥, 둥, 둥!', '오늘 마을 전체가 춤추게 해 주지!'] },
        { say: '수고가 많아', tier: 'good', face: 'smile', answer: '수고는 무슨. 다들 웃으면 그게 내 월급이다.' },
        { say: '시끄러워', tier: 'meh', face: 'sorry', answer: '…미안하다. 목소리를 줄여 보겠다. 줄인 게 이거다.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴에 먹구름이 꼈다. 무슨 일이냐. 순경한테 말해 봐라.',
      replies: [
        { say: '그냥 좀 지쳤어', tier: 'great', face: 'smile', answer: ['그럼 오늘은 내가 지킨다.', '넌 꿀차 마시고 쉬어라. 순경 명령이다. 거부권 없다.'] },
        { say: '별일 아니야', tier: 'good', answer: '그래. 그래도 무슨 일 생기면 크게 불러라. 천둥보다 빨리 간다.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '오늘 얼굴이 맑음이다! 잔나 예보보다 정확하군. 좋은 일 있었나?',
      replies: [
        { say: '너 만나서 좋아', tier: 'great', face: 'shy', answer: ['크, 크흠! 갑자기 그러면 곤란하다.', '…오늘 일지에 적겠다. "시민 기분 맑음. 순경 기분 더 맑음."'] },
        { say: '그냥 날이 좋아', tier: 'good', face: 'laugh', answer: '그럼 됐다! 이유 없는 기쁨이 제일 오래간다.' },
        { say: '비밀이야', tier: 'meh', face: 'wow', answer: '수상하군! …하지만 좋은 비밀은 수사하지 않는다. 지켜 주마.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}! 오늘 파출소는 공식 경축일이다! 생일 축하한다! 둥, 둥!',
      replies: [
        { say: '경축일까지야?', tier: 'great', face: 'laugh', answer: ['물론이다! 장부에도 빨간 글씨로 적었다.', '선물은 꿀 케이크다. 경호하면서 들고 왔다. 한 입도 안 먹었다.'] },
        { say: '고마워, 순경님', tier: 'good', face: 'shy', answer: '…순경님이라니. 오늘은 그냥 볼리바스로 축하하겠다.' },
        { say: '조용히 넘어가려 했는데', tier: 'meh', face: 'sorry', answer: '이런, 북은 좀 작게 치겠다. 그래도 축하는 크게 한다.' },
      ],
    },
    {
      id: 'op-news-record',
      when: { news: 'record' },
      open: '오늘 마을 신문 봤나? 새 기록이 나왔다더군. 잔나가 아침부터 뛰어다녔다.',
      replies: [
        { say: '대단한 기록이었어', tier: 'great', answer: '그렇지! 기록 세운 시민은 파출소 게시판 명예의 전당에 올린다!' },
        { say: '신문은 안 읽었어', tier: 'meh', face: 'think', answer: '읽어라! 정보가 수사의 시작이다. 날씨 칸은… 반만 믿고.' },
      ],
    },
    {
      id: 'op-news-wedding',
      when: { news: 'wedding' },
      open: '오늘 결혼식이 있었다! 하객 질서 유지는 내가 맡았지. 눈물은… 안 흘렸다.',
      replies: [
        { say: '울었구나', tier: 'great', face: 'shy', answer: '…콧수염에 맺힌 건 이슬이다. 그렇게 보고서에 썼다.' },
        { say: '수고했어', tier: 'good', answer: '좋은 날 지키는 게 제일 보람 있다. 오늘은 사건 하나 없었다.' },
      ],
    },
    {
      id: 'op-news-legend',
      when: { news: 'legend' },
      open: '전설의 물고기가 잡혔다는 소식이다! 이건 사건이다. 특급 사건!',
      replies: [
        { say: '고향 전설도 생각나?', tier: 'great', face: 'think', answer: ['…났다. 고향에도 전설이 많았다. 곰 이야기, 얼음 이야기.', '전설이란 건 누군가 지켜봐 줘서 남는 거다. 오늘처럼.'] },
        { say: '같이 구경 가자', tier: 'good', face: 'laugh', answer: '좋다! 현장 보존은 내가 맡는다. 줄은 한 줄로!' },
        { say: '물고기는 관심 없어', tier: 'meh', face: 'sorry', answer: '…그건 좀 슬프군. 연어라도 좋아해 보면 어떠냐.' },
      ],
    },
    {
      id: 'op-friend-news',
      when: { friendNews: 'birthday' },
      open: '마을 소식에 생일인 사람이 있더군. 파출소에선 생일에 꿀사탕을 준다.',
      replies: [
        { say: '같이 축하하러 가자', tier: 'great', face: 'smile', answer: ['좋다! 꿀사탕 두 개 챙긴다.', '하나는 생일 주인 거, 하나는… 같이 간 너 거다.'] },
        { say: '그런 규칙이 있어?', tier: 'good', face: 'laugh', answer: '방금 만들었다. 순경 규칙은 다정할수록 오래간다.' },
        { say: '난 잘 모르는 사람이야', tier: 'meh', face: 'calm', answer: '그럼 이참에 알면 되지. 이 마을은 그렇게 넓어진다.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '첩보가 들어왔다. 요즘 카지노에서 좀 잃었다며? 표정이 수상하더라니.',
      replies: [
        { say: '이제 안 갈게', tier: 'great', face: 'smile', answer: ['그 결심이면 됐다. 잃은 건 수업료다.', '남은 동전으로 꿀빵 사라. 그건 절대 안 잃는다.'] },
        { say: '다음엔 딸 거야', tier: 'meh', face: 'sorry', answer: '…그 말이 제일 수상하다. 차비는 꼭 남겨라. 순경 부탁이다.' },
        { say: '어떻게 알았어?', tier: 'good', face: 'think', answer: '순경은 다 안다. 사실 미스 포츈이 웃으면서 말해 줬다.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다 다녀왔다며? 대단하다. 나는 배만 타면 콧수염까지 멀미한다.',
      replies: [
        { say: '다음엔 같이 가자', tier: 'great', face: 'wow', answer: ['배, 배를? 크흠. 네가 간다면… 노는 내가 젓겠다.', '땅이 안 보여도 너는 보이니까 괜찮겠지.'] },
        { say: '바다 위 천둥 멋지더라', tier: 'good', face: 'think', answer: '…그건 부럽다. 바다 위 번개는 하늘 끝까지 간다던데.' },
        { say: '멀미는 약 먹으면 돼', tier: 'meh', face: 'sorry', answer: '먹어 봤다. 약까지 멀미했다. 순경은 땅이 좋다.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관에 뭘 기증했다며? 증거물 보관처럼 소중히 모아 두는 곳이지.',
      replies: [
        { say: '옛것은 지켜야지', tier: 'great', face: 'smile', answer: ['그렇다! 옛것엔 다 이유가 있다.', '내 호루라기도 언젠가 거기 가겠지. 아직은 내가 분다.'] },
        { say: '구경 같이 갈래?', tier: 'good', face: 'laugh', answer: '좋다! 유리장 앞에선 목소리를 낮추겠다. 연습해 뒀다.' },
        { say: '그냥 공간 비우려고', tier: 'meh', face: 'calm', answer: '그래도 좋은 일이다. 누군가는 그걸 보고 웃을 테니까.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '…크흠. 오늘 {other}, 그 사람이랑 좀 서먹하다. 내가 너무 크게 말했나.',
      replies: [
        { say: '먼저 사과해 봐', tier: 'great', face: 'think', answer: ['…그래야겠지. 순경이 먼저 숙이면 마을이 편하다.', '꿀빵 하나 들고 가겠다. 사과엔 꿀이 들어가야 한다.'] },
        { say: '내일이면 괜찮을 거야', tier: 'good', face: 'smile', answer: '그렇겠지. 폭풍도 하루면 지나간다. 나도 그렇다.' },
        { say: '네 목소리 크긴 해', tier: 'meh', face: 'sorry', answer: '…알고 있다. 봇치한테도 혼났다. 고치는 중이다.' },
      ],
    },
    {
      id: 'op-with-ornn',
      when: { with: 'ornn' },
      open: '…왔냐. 아, 너한테 한 말 아니다. {other}, 그 녀석이랑 인사 중이었다.',
      replies: [
        { say: '그게 인사야?', tier: 'great', face: 'laugh', answer: ['그렇다. 고향식 인사다. "왔냐." "왔다." 끝.', '말이 짧을수록 정이 깊다. 북쪽 얼음 땅 사람은 그렇다.'] },
        { say: '둘이 형제 같아', tier: 'good', face: 'think', answer: '…그런 말 가끔 듣는다. 둘 다 부정은 안 한다. 긍정도 안 하고.' },
        { say: '둘 다 덩치가 커', tier: 'meh', face: 'calm', answer: '그래서 대장간 문을 둘이 같이 못 지나간다. 한 명씩이다.' },
      ],
    },
    {
      id: 'op-with-nilah',
      when: { with: 'nilah' },
      open: '{me}! 마침 잘 왔다. {other}, 이 친구랑 팔씨름 판정 좀 해라. 무승부지?',
      replies: [
        { say: '공정하게 무승부!', tier: 'great', face: 'laugh', answer: ['크하하! 들었지! 무승부다!', '…닐라 표정이 무섭군. 오늘은 여기서 해산이다.'] },
        { say: '닐라가 이긴 것 같은데', tier: 'good', face: 'sorry', answer: '…정직한 시민이군. 판결에 승복한다. 이번만.' },
        { say: '난 아무것도 못 봤어', tier: 'meh', face: 'think', answer: '목격자 진술 거부라. 현명하군. 순경도 가끔 그러고 싶다.' },
      ],
    },
    {
      id: 'op-with-mercy',
      when: { with: 'mercy' },
      open: '아, {me}. 지금 치료받는 중이다. {other}, 붕대 좀 살살… 아야.',
      replies: [
        { say: '손 잡아 줄까?', tier: 'great', face: 'shy', answer: ['…잡아 주면 고맙겠다.', '이 덩치가 붕대 하나에 떨고 있다니. 조서엔 적지 마라.'] },
        { say: '또 어디서 넘어졌어?', tier: 'good', face: 'sorry', answer: '골목 모퉁이다. 고양이를 피하다가. 고양이는 무사하다.' },
        { say: '엄살이 심하네', tier: 'meh', face: 'wow', answer: '엄살이 아니다! 상처가 크다! …작긴 하지만 크다!' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: '쉿. {other}, 이 사장한테 내일 언제 여는지 묻는 중이다. 대답이 느리다.',
      replies: [
        { say: '내가 대신 물어볼게', tier: 'great', face: 'laugh', answer: ['고맙다! 넌 수사의 귀재다.', '…"아마 점심쯤"이라는군. 아마가 제일 무서운 말이다.'] },
        { say: '그냥 기다려', tier: 'good', face: 'calm', answer: '그래, 기다림도 수사다. 잼빵을 위해서라면 겨울도 기다린다.' },
        { say: '빵집 매일 가?', tier: 'meh', face: 'shy', answer: '…매일은 아니다. 하루 거르면 그다음 날 두 번 간다.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '{other}, 만났나? 이번 허풍 경연 주제가 "내가 잡은 제일 큰 것"이란다.',
      replies: [
        { say: '넌 뭐 잡았는데?', tier: 'great', face: 'laugh', answer: ['범인 마흔둘, 갈매기 하나, 오리 하나.', '…그리고 연어. 이건 허풍 아니다. 고향 강에서다.'] },
        { say: '선장이 또 고래 얘기 하겠다', tier: 'good', answer: '고래는 지난번에 했다. 이번엔 바다 괴물을 낚았다더군.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '발키리 만났다며? 혹시 나 욕하던가? 도끼 검문 건으로 말이다.',
      replies: [
        { say: '의자 잘 쓰냐던데', tier: 'great', face: 'shy', answer: ['…그래? 잘 쓰고 있다. 아주 튼튼하다.', '크흠. 다음 검문 땐 도끼날만 보고 넘어가겠다.'] },
        { say: '콧수염 얘기 하던데', tier: 'good', face: 'wow', answer: '또 콧수염이냐! 이건 표적 수사다! …멋지다고 했겠지?' },
      ],
    },
    {
      id: 'op-makima',
      when: { bond: 'makima' },
      open: '{other}, 그 행상인이랑 말했나? 혹시 내 얘기는 안 하던가?',
      replies: [
        { say: '순경님 귀엽대', tier: 'great', face: 'wow', answer: ['귀, 귀엽다고? 그건… 수사 교란이다!', '…오늘은 미행을 쉬겠다. 마음을 정리해야 한다.'] },
        { say: '좋은 물건 샀어', tier: 'good', face: 'think', answer: '값은 정직했나? 정직했다면… 더 수상하다. 크흠.' },
        { say: '비밀이야', tier: 'meh', face: 'sorry', answer: '너까지! 이 마을엔 비밀이 너무 많다.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '메르시 만났다며? 혹시 내 붕대 얘기 했나? 비밀로 해 달랬는데.',
      replies: [
        { say: '걱정하던데', tier: 'great', face: 'shy', answer: ['…그런가. 그럼 오늘은 골목을 천천히 돌겠다.', '고마운 사람이다. 치료비로 꿀 한 병 두고 와야겠군.'] },
        { say: '엄살쟁이래', tier: 'meh', face: 'sorry', answer: '…반박하지 않겠다. 그분 앞에선 늘 진다.' },
      ],
    },
    {
      id: 'op-ornn',
      when: { bond: 'ornn' },
      open: '{other}, 만났나? 그 녀석이 무슨 말 하던가. 세 마디 넘었나?',
      replies: [
        { say: '네 안부 묻던데', tier: 'great', face: 'think', answer: ['…그 녀석이? 크흠. 그럼 답장해야지.', '"잘 있다." 이렇게 전해라. 그 녀석은 다 알아듣는다.'] },
        { say: '한 마디도 안 했어', tier: 'good', face: 'laugh', answer: '크하하! 그게 그 녀석이다. 말 대신 망치가 대답한다.' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '닐라 만났나? 내가 팔씨름 졌다고 하면 믿지 마라. 무승부다.',
      replies: [
        { say: '무승부라고 하던데?', tier: 'great', face: 'wow', answer: ['정말이냐! 닐라가 드디어 인정했군!', '…아니, 날 놀리는 건가. 수상하군.'] },
        { say: '네가 졌다던데', tier: 'meh', face: 'sorry', answer: '거짓 진술이다! …재경기를 신청하겠다. 손목 좀 풀고.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '빵집 다녀왔나? 오늘 잼빵은 나왔냐? 이건 수사가 아니라 순수한 궁금증이다.',
      replies: [
        { say: '네 몫 남겨 달랬어', tier: 'great', answer: '{me}! 넌 진짜 시민 중의 시민이다! 순찰 끝나면 바로 간다!' },
        { say: '벌써 다 팔렸던데', tier: 'meh', face: 'sorry', answer: '…이건 비극이다. 내일은 한 시간 더 일찍 가겠다.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '{other}, 만났다며? 무슨 얘기 했나. 수상한 말은 없었고?',
      replies: [
        { say: '네 걱정을 하던데', tier: 'great', face: 'think', answer: ['…내 걱정을? 그 녀석이?', '크흠. 오늘 감시는 조금만 하겠다.'] },
        { say: '등불 하나 샀어', tier: 'good', answer: '등불은 죄가 없다. 그래도 밤에 이상하게 웃으면 바로 신고해라.' },
        { say: '비밀이야', tier: 'meh', face: 'wow', answer: '수, 수상하군! 너까지 그 녀석 편이냐!' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '잔나 만났나? 오늘 예보 뭐라더냐. 맑음이라고 했으면 우비부터 챙겨라.',
      replies: [
        { say: '맑음이래', tier: 'great', face: 'laugh', answer: '크하하! 그럼 비다! 수사 결과다. 우비 꺼내 두마.' },
        { say: '잔나 예보 잘 맞아', tier: 'good', answer: '…가끔은. 근데 제보는 늘 정확하다. 그건 믿을 만하다.' },
      ],
    },
    {
      id: 'op-sinjjajang',
      when: { bond: 'sinjjajang' },
      open: '{other}, 오늘 봤나? 순찰 길이랑 배달 길이 겹쳐서 하루 세 번은 만난다.',
      replies: [
        { say: '둘이 잘 어울려', tier: 'great', answer: '크하하! 동료다! 그 친구 배달 가방 무거울 땐 내가 들어 준다.' },
        { say: '잔나가 늘 기다리던데', tier: 'good', face: 'think', answer: '…그건 나도 눈치챘다. 수사 결과는 비공개다. 순경도 눈치는 있다.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '신이치가 또 단서를 보내왔다. 그 친구랑 나랑 합치면 못 푸는 사건이 없지.',
      replies: [
        { say: '나도 수사팀 끼워 줘', tier: 'great', answer: '좋다! 오늘부터 특별 수사팀 셋이다. 첫 사건은 사라진 꿀단지다.' },
        { say: '무슨 사건인데?', tier: 'good', face: 'think', answer: '광장 화분이 매일 조금씩 옮겨진다. …범인은 바람일지도 모른다.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-honey',
      when: { mem: 'honey-fan' },
      use: 'honey-fan',
      open: '{me}! 꿀 바른 연어구이 말이다. 진짜 만들어 봤다. 결과 보고한다.',
      replies: [
        { say: '맛이 어땠어?', tier: 'great', answer: ['…눈물이 났다. 이건 사건이다.', '다음엔 네 몫도 굽겠다. 꿀은 두 배로.'] },
        { say: '진짜 했어?', tier: 'good', face: 'laugh', answer: '순경은 말한 건 한다! 그게 수사의 기본이다.' },
      ],
    },
    {
      id: 'cb-drama',
      when: { mem: 'drama-partner' },
      use: 'drama-partner',
      open: '지난번 자백 장면 연습 말이다. 이번 화에 똑같은 대사가 나왔다! 소름 돋았다.',
      replies: [
        { say: '우리가 작가였네', tier: 'great', face: 'laugh', answer: '크하하하! 그렇다! 다음 대사도 같이 짜 보자, 파트너!' },
        { say: '범인은 누구였어?', tier: 'good', face: 'think', answer: '집사였다. 늘 집사다. 그래서 난 쓰레쉬를 의심하는 거다.' },
      ],
    },
    {
      id: 'cb-snow-home',
      when: { mem: 'snow-home' },
      use: 'snow-home',
      open: '고향 이야기 들어 줬던 거 기억난다. 어젯밤 설산 꿈을 꿨다. 네가 나왔다.',
      replies: [
        { say: '나도 가 보고 싶어', tier: 'great', face: 'shy', answer: '…언젠가 데려가겠다. 털 칼라 하나 더 챙겨서.' },
        { say: '꿈에서 뭐 했어?', tier: 'good', face: 'laugh', answer: '눈사람을 불심검문했다. 너는 증인이었다. 크하하!' },
      ],
    },
    {
      id: 'cb-storm',
      when: { mem: 'storm-friend' },
      use: 'storm-friend',
      open: '폭풍 좋아하는 동지! 바람 냄새가 바뀌었다. 곧 천둥이 온다. 예감이다.',
      replies: [
        { say: '창가 자리 맡아 둘게', tier: 'great', answer: '크하하! 좋다! 꿀차는 내가 끓인다. 번쩍하면 같이 외치는 거다!' },
        { say: '잔나 예보랑 반대네', tier: 'good', face: 'laugh', answer: '그럼 더 확실하다! 크하하, 잔나한텐 비밀이다.' },
      ],
    },
    {
      id: 'cb-bread',
      when: { mem: 'bread-pal' },
      use: 'bread-pal',
      open: '{me}, 빵집 줄 같이 서기로 한 거 기억하지? 내일 아침 제일 앞자리다.',
      replies: [
        { say: '알람 맞춰 둘게', tier: 'great', answer: '좋다! 늦으면 파출소에서 깨우러 간다. 천둥 목소리로.' },
        { say: '꿀빵은 네가 사', tier: 'good', face: 'laugh', answer: '약속은 약속이다. 두 개 사겠다. 하나는 내 거고.' },
      ],
    },
    {
      id: 'cb-ring',
      when: { mem: 'lost-ring' },
      use: 'lost-ring',
      open: '그 반지 말이다! 주인 찾았다! 잔나 신문 보고 할머니 한 분이 오셨다.',
      replies: [
        { say: '정말 잘됐다!', tier: 'great', face: 'smile', answer: ['울면서 고맙다고 하셨다.', '할아버지가 젊을 때 주신 거라더군. …콧수염에 이슬이 또 맺혔다.'] },
        { say: '네 덕분이야', tier: 'good', face: 'shy', answer: '우리 덕분이다. 사건 종결! 이런 미제는 꼭 풀어야지.' },
      ],
    },
    {
      id: 'cb-ornn',
      when: { mem: 'ornn-kin' },
      use: 'ornn-kin',
      open: '오른 얘기 들어 줬었지. 어제 그 녀석이 대장간에서 뭘 하나 내밀더군.',
      replies: [
        { say: '뭐였는데?', tier: 'great', face: 'shy', answer: ['쇠로 만든 작은 곰이다. 콧수염까지 새겼다.', '"닮았다." 한 마디 하고 들어갔다. …파출소 책상에 올려 뒀다.'] },
        { say: '세 마디 넘었어?', tier: 'good', face: 'laugh', answer: '딱 한 마디였다! 기록 경신이다. 반대 방향으로.' },
      ],
    },
    {
      id: 'cb-wrestle',
      when: { mem: 'armwrestle' },
      use: 'armwrestle',
      open: '심판 서 주기로 한 거 기억하지? 닐라가 오늘 저녁 재경기를 신청했다.',
      replies: [
        { say: '공정하게 볼게', tier: 'great', face: 'laugh', answer: ['좋다! 공정함이 정의다!', '…근데 진짜 공정하면 내가 질 수도 있다. 그래도 좋다.'] },
        { say: '너 응원할게', tier: 'good', face: 'shy', answer: '심판이 응원하면 안 된다! …속으로만 해라.' },
      ],
    },
    {
      id: 'cb-tall-tale',
      when: { mem: 'tall-tale' },
      use: 'tall-tale',
      open: '허풍 경연 출전 등록했었지? 오늘 밤이다! 준비한 허풍 있나?',
      replies: [
        { say: '번개를 병에 담았어', tier: 'great', face: 'wow', answer: ['크하하하! 좋다! 그건 우승감이다!', '…나도 한번 해 보고 싶었던 거다. 심판 점수 몰아주겠다. 농담이다.'] },
        { say: '아직 생각 중이야', tier: 'good', answer: '선장 말로는 진심이 섞인 허풍이 제일 크다더군. 힌트다.' },
      ],
    },
    {
      id: 'cb-clinic',
      when: { mem: 'clinic-pal' },
      use: 'clinic-pal',
      open: '{me}, 같이 의원 가 주기로 한 거… 오늘이다. 주사 맞는 날이다.',
      replies: [
        { say: '손 꼭 잡아 줄게', tier: 'great', face: 'shy', answer: ['…고맙다. 눈은 감고 있겠다.', '끝나면 사탕 받는다더군. 그건 너 주겠다. 용감한 건 너니까.'] },
        { say: '순경이 겁쟁이네', tier: 'good', face: 'sorry', answer: '겁이 아니라 신중함이다! …둘 다일지도 모른다.' },
      ],
    },
    {
      id: 'cb-whistle',
      when: { mem: 'old-whistle' },
      use: 'old-whistle',
      open: '할아버지 호루라기 말이다. 어제 안개 낀 항구에서 그걸로 길 잃은 배를 불렀다.',
      replies: [
        { say: '할아버지처럼 했네', tier: 'great', face: 'smile', answer: ['…그래. 그 생각이 들었다.', '쉰 소리였는데 배가 정확히 따라왔다. 옛것은 역시 다르다.'] },
        { say: '소리가 들렸대?', tier: 'good', face: 'laugh', answer: '들렸단다. 갈매기들도 다 따라왔다. 그건 계획에 없었다.' },
      ],
    },
    {
      id: 'cb-bee',
      when: { mem: 'bee-dream' },
      use: 'bee-dream',
      open: '벌통 꿈 얘기 했었지. 츠나데 할머니가 작은 벌통 하나 줄까 하시더라.',
      replies: [
        { say: '파출소 옥상에 두자', tier: 'great', face: 'laugh', answer: ['크하하! 꿀벌 순경대다!', '수상한 놈이 오면 벌들이 먼저 알려 주겠지. 완벽… 아니, 훌륭한 계획이다.'] },
        { say: '꿈이 가까워졌네', tier: 'good', face: 'shy', answer: '…그렇군. 설산 아래는 아니어도, 여기도 고향 같다.' },
      ],
    },
    {
      id: 'cb-legend',
      when: { mem: 'bear-legend' },
      use: 'bear-legend',
      open: '천둥 부르는 곰 이야기 기억하나? 어젯밤 천둥에 그 이야기가 떠올랐다.',
      replies: [
        { say: '이제 그 곰이 마을을 지키네', tier: 'great', face: 'shy', answer: ['…{me}. 그런 말을 하면 곤란하다.', '콧수염이 떨려서 정리가 안 된다. 그래도 고맙다.'] },
        { say: '곰이 꿈에 나왔어?', tier: 'good', face: 'laugh', answer: '나왔다. 꿀빵을 달라더군. 한 개 줬다. 아깝지 않았다.' },
      ],
    },
    {
      id: 'cb-letter',
      when: { mem: 'letter-home' },
      use: 'letter-home',
      open: '같이 쓴 편지에 답장이 왔다! 신짜장이 눈길을 헤치고 가져다줬다.',
      replies: [
        { say: '뭐라고 왔어?', tier: 'great', face: 'smile', answer: ['"친구가 누구냐. 데려와라." 딱 세 줄이다.', '…고향 어른들은 말이 짧다. 근데 데려오라는 건 진심이다.'] },
        { say: '신짜장 고생했네', tier: 'good', answer: '그래서 꿀차 한 잔 대접했다. 잔나도 따라와서 두 잔이 됐다.' },
      ],
    },
    {
      id: 'cb-lantern',
      when: { mem: 'lantern-watch' },
      use: 'lantern-watch',
      open: '잠복 파트너! 보고할 게 있다. 쓰레쉬가 등불 하나를 파출소 앞에 걸었다.',
      replies: [
        { say: '고맙다고 해야지', tier: 'great', face: 'think', answer: ['…해야겠지. 꿀빵 들고 가겠다.', '그래도 감시는 계속한다. 이제는 서로 지켜보는 사이다.'] },
        { say: '수상한 등불이야?', tier: 'good', face: 'laugh', answer: '초록 불이다. 수상하다. 근데 밤길이 밝아졌다. 그건 인정한다.' },
      ],
    },
    {
      id: 'cb-nap',
      when: { mem: 'nap-guard' },
      use: 'nap-guard',
      open: '겨울잠 동안 지켜 주겠다던 약속 기억하나? 임시 배지를 만들어 왔다.',
      replies: [
        { say: '임무 완수할게!', tier: 'great', face: 'laugh', answer: ['크하하! 든든하다!', '배지 뒤에 새겼다. "볼리바스가 믿는 시민." 잃어버리지 마라.'] },
        { say: '진짜 겨울잠 자려고?', tier: 'good', face: 'shy', answer: '…근무 피로 회복이다. 사흘만. 아니, 이틀.' },
      ],
    },
    {
      id: 'cb-moustache',
      when: { mem: 'moustache-ok' },
      use: 'moustache-ok',
      open: '전에 콧수염 칭찬해 줬지. 그 뒤로 그웬 미용실에서 다듬기 시작했다.',
      replies: [
        { say: '더 멋져졌어', tier: 'great', face: 'shy', answer: ['크, 크흠! 역시 보는 눈이 있다.', '그웬이 "곰털 손질은 처음"이라더군. 칭찬으로 받아들였다.'] },
        { say: '원래가 더 좋았는데', tier: 'good', face: 'think', answer: '…그런가? 그럼 다음 달엔 조금 덜 다듬겠다. 정직한 의견 고맙다.' },
      ],
    },
    {
      id: 'cb-patrol',
      when: { mem: 'patrol-pair' },
      use: 'patrol-pair',
      open: '짝꿍 배지가 완성됐다! 오른한테 쇠를 얻어서 직접 깎았다. 받아라.',
      replies: [
        { say: '평생 달고 다닐게', tier: 'great', face: 'shy', answer: ['…평생이라니. 크흠. 그럼 나도 평생 순찰하겠다.', '삐뚤어진 건 일부러다. 손으로 만든 증거다.'] },
        { say: '모양이 좀 삐뚤어', tier: 'good', face: 'laugh', answer: '그게 매력이다! 오른도 그렇게 말했다. 한 마디로.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '수사 결과, {me} 너는 {taste}, 그걸 좋아한다더군. 맞나? 정보원은 비밀이다.',
      replies: [
        { say: '맞아, 어떻게 알았어?', tier: 'great', remember: 'taste-heard', answer: '크하하! 순경 수첩에 다 있다. 다음 순찰 땐 하나 챙겨 오지.' },
        { say: '뒷조사한 거야?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '뒷조사가 아니라 관심이다! 아주 다르다. 크흠.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 다닌 날, 순찰 일지에 적었다. "오늘 이상 무. 아주 즐거움."',
      replies: [
        { say: '또 같이 순찰하자', tier: 'great', remember: 'outing-talk', answer: '좋다! 다음엔 강가 쪽이다. 연어 철이니까. 순전히 순찰이다.' },
        { say: '일지에 그런 걸 써?', tier: 'good', face: 'shy', remember: 'outing-talk', answer: '…쓰면 안 되나? 사실이니까 쓴 거다. 크흠.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '첩보 입수! 곧 네 생일이라더군. 생일 경호 작전을 세워 뒀다.',
      replies: [
        { say: '작전 내용이 뭔데?', tier: 'great', remember: 'bday-plan', answer: ['꿀 케이크 호송, 북소리 축하, 그리고 비밀 하나.', '비밀은 비밀이다. 기대해라!'] },
        { say: '조용히 지나가도 돼', tier: 'good', face: 'smile', remember: 'bday-plan', answer: '그럼 조용히 꿀 케이크만 들고 가지. 그건 양보 못 한다.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '…저번 데이트 말이다. 조서에는 안 적었다. 대신 비밀 수첩에 적었다.',
      replies: [
        { say: '뭐라고 적었어?', tier: 'great', face: 'shy', remember: 'date-talk', answer: ['"천둥 없음. 근데 심장이 천둥."', '…더는 못 읽어 준다. 수사 기밀이다.'] },
        { say: '나도 일기에 썼어', tier: 'good', face: 'wow', remember: 'date-talk', answer: '정말이냐! 그럼 기록이 둘이다. 이건 확실한 사실이 됐다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '파출소 신고 접수',
      hint: '한 번 이야기를 나누면 볼리바스가 파출소 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '시장 거리 파출소. 낡은 종이 문 위에서 땡그랑 운다.',
        '난로 위 주전자에서 꿀차 냄새가 올라온다.',
        '볼리바스가 책상 위 두꺼운 장부를 쿵 펼친다. 먼지가 살짝 인다.',
        '"신규 시민 등록이다! 이름, {me}."',
        '그가 펜 끝을 혀에 대려다 멈칫하고, 콧수염을 한 번 쓸어 넘긴다.',
        '"특징… 웃는 얼굴이 수상하게 착함."',
        '펜이 종이를 꾹꾹 누르는 소리가 천둥 치기 전 빗방울 같다.',
        '"이 장부는 우리 할아버지 때부터 쓰던 거다. 종이가 누렇지?"',
        '"여기 오르면 이 마을이 널 지킨다. 그러니까 내가 지킨다는 뜻이다."',
        '그가 장부를 덮고, 책상 서랍에서 꿀사탕 하나를 꺼내 내민다.',
      ],
      replies: [
        { say: '든든하다, 고마워!', tier: 'great', answer: ['크하하하! 그 말이면 충분하다!', '무슨 일 있으면 크게 불러라. 천둥보다 빨리 간다!'] },
        { say: '수상하게 착함이 뭐야?', tier: 'good', face: 'laugh', answer: ['칭찬이다. 순경식 칭찬.', '다들 처음엔 헷갈려 한다. 나중엔 다들 자랑하더군.'] },
        { say: '등록 안 하면 안 돼?', tier: 'meh', face: 'think', answer: '이미 적었다. 지우개는 없다. 대신 꿀사탕 하나 더 주지.' },
      ],
    },
    {
      title: '등불 아래 잠복',
      hint: '밤(게임 시각 밤 아홉 시부터 자정) 시장 거리로 가 보세요. 잠복 중이래요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 21, to: 24 } },
      scene: [
        '밤의 시장 거리. 좌판은 다 접혔고, 가로등 몇 개만 졸고 있다.',
        '모퉁이 화분 뒤에 커다란 그림자가 웅크리고 있다. 전혀 숨겨지지 않았다.',
        '"쉿, {me}! 이쪽이다. 저 등불 상점, 오늘도 초록 불이다."',
        '그가 꿀빵 하나를 반으로 갈라 건넨다. "잠복의 기본은 간식이다."',
        '꿀빵을 씹는 소리가 너무 커서 둘 다 동시에 멈춘다.',
        '그때 등불 상점 문이 열리고, 쓰레쉬가 등불 하나를 들고 나온다.',
        '초록 불빛이 골목을 천천히 지나 어두운 계단 앞에서 멈춘다.',
        '쓰레쉬는 계단 난간에 등불을 걸어 두고, 낮게 웃으며 들어간다.',
        '"…저 계단, 할머니들이 밤에 자주 넘어지던 데다." 볼리바스가 중얼거린다.',
        '그가 수첩을 꺼내 무언가 적다가, 줄을 긋고 다시 적는다.',
        '"수사 일지. 오늘의 용의자… 아니, 오늘의 이웃."',
      ],
      replies: [
        { say: '쓰레쉬도 마을을 지키네', tier: 'great', remember: 'night-patrol', face: 'think', answer: ['…그런 것 같군. 오늘 수사 결과는 무혐의다.', '그래도 감시는 계속한다. 고맙다고 말할 핑계로.'] },
        { say: '꿀빵 맛있다', tier: 'good', remember: 'night-patrol', face: 'laugh', answer: ['그렇지? 잠복은 이 맛이다.', '다음 잠복에도 같이 와라. 꿀빵은 두 개 챙기겠다.'] },
        { say: '다리 저려', tier: 'meh', remember: 'night-patrol', answer: '나도다. 덩치가 커서 숨기가 힘들다. 크흠, 철수다.' },
      ],
    },
    {
      title: '잼 바른 빵의 오후',
      hint: '볼리바스가 달콤한 잼 얘기를 자주 해요. 잼 한 병을 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'jam', take: true } },
      scene: [
        '늦가을 오후, 파출소 난로가 탁탁 소리를 낸다.',
        '잼 병을 내밀자 볼리바스의 콧수염이 파르르 떨린다.',
        '"이, 이건… 증거물로 압수다! 아니, 선물로 감사히 받겠다!"',
        '그가 서랍에서 프리렌네 둥근 빵을 꺼낸다. 아침 줄 맨 앞에서 산 거란다.',
        '숟가락 대신 커다란 손가락으로 잼을 산처럼 바른다.',
        '"고향에선 겨울 오기 전에 이렇게 먹었다. 꿀이든 잼이든 배부르게."',
        '"배를 채워야 긴 겨울을 버티거든. 눈이 지붕을 덮으면 밖에 못 나가니까."',
        '창밖으로 첫 낙엽이 파출소 유리창에 붙었다 떨어진다.',
        '"그땐 겨울이 길고 무서웠다. 어른들은 천둥이 겨울을 깨운다고 했지."',
        '그가 빵을 한 입 베어 물고, 한참 말없이 씹는다.',
        '"…지금은 버틸 겨울이 별로 무섭지 않다. 이 마을이 따뜻해서다."',
      ],
      replies: [
        { say: '나도 한 입 줘', tier: 'great', remember: 'jam-feast', face: 'laugh', answer: ['물론이다! 제일 잼 많은 쪽이다.', '순경의 배려다. 크하하! 손가락 자국은 못 본 걸로 해라.'] },
        { say: '겨울엔 내가 깨워 줄게', tier: 'good', remember: 'jam-feast', face: 'shy', answer: '…그럼 겨울잠도 짧아지겠군. 그것도 나쁘지 않다.' },
        { say: '잼이 너무 많아', tier: 'meh', remember: 'jam-feast', answer: '잼은 많을수록 정의다. 이건 반박 불가다.' },
      ],
    },
    {
      title: '다정한 정의',
      hint: '볼리바스와 정의에 대해 이야기를 나누면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'justice-kind' },
      scene: [
        '비 오는 저녁. 시장 거리 처마마다 빗물이 줄줄이 떨어진다.',
        '파출소 처마 밑, 볼리바스가 쪼그려 앉아 무언가를 품고 있다.',
        '털 칼라 사이로 젖은 새끼 고양이 머리가 쏙 나온다.',
        '"쉿. 골목 하수구 옆에서 떨고 있었다. 다친 데부터 봤다."',
        '"다친 데부터 봐야 한다고 했지, {me}. 그 말이 계속 생각나더라."',
        '그가 커다란 손으로 고양이 귀를 덮어 빗소리를 막아 준다.',
        '"고향에선 강한 게 정의였다. 큰 소리, 큰 주먹, 큰 걸음."',
        '"폭풍처럼 몰아치는 게 지키는 거라고 배웠다. 나도 그렇게 컸다."',
        '멀리서 천둥이 낮게 구른다. 그는 오늘만큼은 하늘을 보지 않는다.',
        '"근데 여기 와서 알았다. 정의는 이렇게 작은 걸 품는 거다."',
        '고양이가 그의 털 칼라 속에서 작게 운다.',
        '그의 목소리가 천둥보다, 빗소리보다 낮아진다. "괜찮다. 이제 괜찮다."',
      ],
      replies: [
        { say: '넌 이미 다정한 순경이야', tier: 'great', face: 'shy', answer: ['…크, 크흠.', '그런 말 들으면 콧수염이 정리가 안 된다. 고양이도 웃는 것 같군.'] },
        { say: '고양이 이름 지어 주자', tier: 'good', face: 'smile', answer: ['좋다. "꿀"이다. 이의 없지?', '이의는 기각이다. 파출소 명예 순경으로 임명한다.'] },
        { say: '감기 걸리겠다', tier: 'meh', answer: '나는 괜찮다. 털이 두꺼우니까. 너나 안으로 들어와라.' },
      ],
    },
    {
      title: '천둥 치는 밤의 고백',
      hint: '볼리바스와 아주 가까워지면 폭풍 치는 밤의 이야기를 들려줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '폭풍이 마을을 두드리는 밤. 파출소 창이 덜컹거린다.',
        '고양이 꿀이 난로 앞 바구니에서 몸을 동그랗게 만다.',
        '창밖에 번개가 친다. 볼리바스가 파출소 불을 끄고 창가에 나란히 앉는다.',
        '번쩍할 때마다 그의 옆얼굴과 콧수염이 하얗게 빛난다.',
        '"고향 어른들은 날 천둥 부르는 곰이라 불렀다. 폭풍이 오면 신이 났거든."',
        '"폭풍은 늘 내 편이었다. 오늘도 기운이 펄펄 난다."',
        '"…근데 이상하다. 오늘은 기운이 나는데 손이 떨린다."',
        '"{me}. 수사 결과를 보고하겠다. 아주 중대한 사건이다."',
        '"요즘 순찰 경로가 자꾸 네 집 쪽으로 휜다. 콧수염은 하루 다섯 번 빗는다."',
        '천둥이 크게 울린다. 그의 목소리는 그보다 훨씬 작다.',
        '"…범인은 아직 못 밝혔다. 아니, 밝혔는데 말을 못 하겠다."',
        '그가 창유리에 맺힌 빗방울을 손가락으로 하나씩 이어 그린다.',
      ],
      replies: [
        { say: '천천히 자백해도 돼', tier: 'great', face: 'shy', answer: ['…크하하. 너한텐 못 당하겠다.', '꽃 한 다발 들고 오면 그때 다 말하겠다. 약속이다. 순경의 약속.'] },
        { say: '범인 나지?', tier: 'good', face: 'wow', answer: ['수, 수사 기밀이다!', '…그렇게 빨리 맞히면 반칙이다. 증거는 꽃다발로 내라.'] },
        { say: '천둥 소리에 못 들었어', tier: 'meh', face: 'calm', answer: '…괜찮다. 다음엔 천둥 없는 날 다시 말하겠다.' },
      ],
    },
    {
      title: '종결되지 않을 사건',
      hint: '볼리바스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '맑게 갠 아침. 지난밤 폭풍이 마을 지붕을 깨끗이 씻어 놓았다.',
        '파출소 문 위 낡은 종이 오늘따라 맑게 울린다.',
        '볼리바스가 할아버지 때부터 쓰던 장부를 다시 펼친다.',
        '맨 처음 {me} 이름을 적었던 쪽. 꿀차 자국이 동그랗게 남아 있다.',
        '"특징 칸을 고쳤다. \'수상하게 착함\' 옆에 한 줄 더."',
        '거기엔 삐뚤빼뚤한 글씨로 "볼리바스의 연인. 평생 경호 대상."',
        '책상 위엔 오른이 만들어 준 쇠 곰이 있고, 그 옆에 고양이 꿀이 잔다.',
        '"고향에선 폭풍처럼 사는 게 곰의 일이라고 했다."',
        '"근데 폭풍도 돌아갈 데가 있어야 하더군. 그게 너다."',
        '그가 할아버지 호루라기를 꺼내, 아주 작게 한 번 분다.',
        '"이 사건은 종결 안 한다. 평생 수사할 거다. 이의 있나?"',
      ],
      replies: [
        { say: '이의 없음!', tier: 'great', face: 'laugh', answer: ['크하하하! 판결 확정이다!', '오늘 밤 천둥이 쳐도 하나도 안 무섭다. 아니, 원래 안 무서웠지만 더 안 무섭다!'] },
        { say: '반지는 증거물이야?', tier: 'good', face: 'shy', answer: ['…그건 네가 정할 일이다.', '내가 정하면 너무 떨려서 장부가 찢어진다. 할아버지 장부인데.'] },
        { say: '천천히 수사하자', tier: 'meh', face: 'smile', answer: '좋다. 서두를 거 없다. 겨울잠보다 긴 수사가 될 테니까.' },
      ],
    },
  ],
  after: [
    '오늘 면담은 끝이다! 순찰 다녀오겠다. 조심히 다녀라!',
    '또 왔나? 수상하군. 농담이다. 꿀차 한 잔 하고 가라.',
    '오늘 보고서는 다 썼다. "이상 무, {me} 웃음 확인." 크하하!',
    '하암… 아니, 안 존다. 근무 중이다. 내일 보자!',
    '분실물 상자 오리가 꽥 한다. 너한테 인사하는 거다.',
    '오늘 일지에 네 이름을 또 적었다. 좋은 일로.',
    '순찰 경로 확인 중이다. 네 집 앞은 이미 넣었다. 두 번.',
  ],
};
