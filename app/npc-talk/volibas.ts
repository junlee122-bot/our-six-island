// 볼리바스 — 시장 거리 파출소 순경. 천둥 같은 목소리의 호탕한 반말, 수사 드라마
// 흉내("수상하군!", "수사 결과다"), 콧수염 쓸기, 곰 같은 덩치에 겨울이면 졸림
// (겨울잠 농담). 연어·민물고기·꿀·잼·프리렌네 빵에 약하고, 고향은 북쪽 설산.
// 폭풍이 오면 기운이 솟고, 밤마다 쓰레쉬 등불 상점을 지켜본다. 동네 사람에겐
// 한없이 다정하다. 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
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
  },
  talks: [
    {
      id: 'salmon-or-honey',
      open: '{me}, 중대한 질문이다. 연어냐, 꿀이냐. 신중하게 대답해라!',
      replies: [
        { say: '꿀 바른 연어구이!', tier: 'great', remember: 'honey-fan', answer: ['…천재다. 둘 다 고르는 자는 처음 봤다.', '크하하! 오늘 저녁 메뉴가 방금 정해졌다!'] },
        { say: '당연히 연어지', tier: 'good', remember: 'fish-fan', answer: '좋은 대답이다! 가을 강에서 뛰는 연어를 보면 너도 알 거다.' },
        { say: '둘 다 별로야', tier: 'meh', face: 'wow', answer: '…수상하군. 아주 수상해. 다음 질문까지 생각해 와라.' },
      ],
    },
    {
      id: 'cop-drama',
      open: '어젯밤 형사물 봤나? 범인이 마지막에 자백하는 장면! 같이 해 보자.',
      replies: [
        { say: '"증거는 이미 다 나왔어!"', tier: 'great', remember: 'drama-partner', answer: '오오! 눈빛 좋다! {me}, 너 파출소 들어와라. 진심이다.' },
        { say: '난 범인 역 할게', tier: 'good', face: 'laugh', answer: '크하하! 그럼 자백해라! …아, 너무 순순히 하면 재미가 없는데.' },
        { say: '그런 거 안 봐', tier: 'meh', face: 'sorry', answer: '이런. 인생의 반을 놓치고 있군. 다음 화는 파출소에서 같이 보자.' },
      ],
    },
    {
      id: 'moustache',
      open: '오늘 콧수염 어떠냐. 아침에 세 번 빗었다. 솔직하게 말해라. 수사다.',
      replies: [
        { say: '천둥처럼 위엄 있어', tier: 'great', remember: 'moustache-ok', answer: '크하하하! 바로 그 말이 듣고 싶었다! 오늘 하루는 무적이다!' },
        { say: '한쪽이 살짝 삐쳤어', tier: 'good', face: 'think', answer: '뭐라고? 거울, 거울! …정말이군. 정직한 시민이다. 고맙다.' },
        { say: '밀어 버리면 어때?', tier: 'meh', face: 'wow', answer: '그건 범죄다! 아니, 범죄는 아니지만 거의 범죄다!' },
      ],
    },
    {
      id: 'snow-home',
      open: '내 고향은 북쪽 설산이다. 눈이 지붕까지 쌓이고 번개가 산을 때렸지.',
      replies: [
        { say: '더 들려줘', tier: 'great', remember: 'snow-home', answer: ['밤마다 하늘이 번쩍했다. 무섭기보다 신났지.', '…여기 와서도 폭풍이 오면 그 산이 생각난다.'] },
        { say: '춥지 않았어?', tier: 'good', answer: '추웠다! 그래서 다들 덩치가 컸지. 이 털 칼라도 고향 거다.' },
        { say: '난 따뜻한 데가 좋아', tier: 'meh', face: 'calm', answer: '그래, 여기 마을이 딱 좋지. 나도 요즘은 그렇다.' },
      ],
    },
    {
      id: 'hibernation',
      open: '겨울만 되면 눈꺼풀이 천근이다. 이건 겨울잠이 아니다. 근무 피로다.',
      replies: [
        { say: '자는 동안 내가 지킬게', tier: 'great', remember: 'nap-guard', answer: '…{me}. 그런 말 처음 들었다. 임시 순경 배지라도 만들어 줘야겠군.' },
        { say: '그거 겨울잠 맞잖아', tier: 'good', face: 'laugh', answer: '쉿! 목소리 낮춰라. 그건 수사 기밀이다. 크하하!' },
        { say: '근무 중에 자면 안 돼', tier: 'meh', face: 'sorry', answer: '…맞는 말이다. 반박할 수가 없군. 꿀차 한 잔 더 마시겠다.' },
      ],
    },
    {
      id: 'storm-love',
      open: '{me}, 천둥 치는 날 어떠냐? 다들 숨는데 난 이상하게 기운이 난다.',
      replies: [
        { say: '나도 폭풍 좋아!', tier: 'great', remember: 'storm-friend', answer: '크하하하! 동지다! 다음 폭풍엔 파출소 창가에서 같이 구경하자!' },
        { say: '번개는 좀 무서워', tier: 'good', face: 'smile', answer: '괜찮다. 번개 치면 파출소로 와. 내 목소리가 천둥보다 크니까.' },
        { say: '그냥 맑은 게 좋아', tier: 'meh', answer: '맑은 날도 나쁘진 않지. 배지가 반짝이니까. 그래도 천둥이 좋다.' },
      ],
    },
    {
      id: 'lantern-shop',
      open: '쓰레쉬 등불 상점 말이다. 밤마다 초록 불이 깜박인다. 수상하지 않나?',
      replies: [
        { say: '같이 잠복하자', tier: 'great', remember: 'lantern-watch', answer: '좋다! 간식은 꿀빵, 암호는 "연어". 밤에 시장 거리 모퉁이다.' },
        { say: '그냥 등불 가게잖아', tier: 'good', face: 'think', answer: '그래, 그렇긴 하지. 근데 그 웃음소리가… 아니다. 감시는 계속한다.' },
        { say: '네가 더 수상해', tier: 'meh', face: 'wow', answer: '나, 나 말이냐? 순경을 의심하다니! …자수할 건 꿀 도둑질뿐이다.' },
      ],
    },
    {
      id: 'bread-line',
      open: '프리렌네 빵집은 아침에 늦게 연다. 그래서 늘 줄 맨 앞에서 기다리지.',
      replies: [
        { say: '내일 같이 줄 서자', tier: 'great', remember: 'bread-pal', answer: '좋다! 줄 서기는 질서의 기본이다. 꿀빵 하나는 내가 사겠다.' },
        { say: '무슨 빵이 제일 좋아?', tier: 'good', answer: '잼 듬뿍 든 둥근 빵이다. 프리렌한텐 비밀이다. 더 늦게 열까 봐.' },
        { say: '줄 서는 건 귀찮아', tier: 'meh', face: 'sorry', answer: '그래도 새치기는 안 된다! 그건 내가 제일 싫어하는 거다.' },
      ],
    },
    {
      id: 'lost-ring',
      open: '낙엽 쓸다 반지를 하나 주웠다. 주인이 아직 안 나타났다. 미제 사건이지.',
      replies: [
        { say: '주인 찾는 거 도울게', tier: 'great', remember: 'lost-ring', answer: '든든하군! 잔나한테 신문에 실어 달라고 하자. 단서는 안쪽 글자다.' },
        { say: '분명 소중한 거겠지', tier: 'good', face: 'think', answer: '그래. 그래서 매일 닦아 둔다. 돌려줄 때 빛나 있어야 하니까.' },
        { say: '그냥 가지면 안 돼?', tier: 'meh', face: 'wow', answer: '절대 안 된다! 분실물은 주인 거다. 이건 순경 수칙 첫 줄이다.' },
      ],
    },
    {
      id: 'justice',
      open: '{me}, 정의가 뭐라고 생각하냐. 크게 소리치는 거? 범인 잡는 거?',
      replies: [
        { say: '다친 사람 먼저 챙기는 거', tier: 'great', remember: 'justice-kind', face: 'smile', answer: ['…그래. 그거다. 나도 그렇게 배웠다.', '정의는 무서운 게 아니라 다정한 거다. 잊지 말자, 우리 둘 다.'] },
        { say: '나쁜 놈 잡는 거!', tier: 'good', answer: '크하하! 그것도 맞다! 근데 잡고 나서 밥은 먹여야 한다. 그게 내 방식이다.' },
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
      id: 'patrol-partner',
      when: { ch: 3 },
      open: '{me}. 공식적으로 묻겠다. 내 순찰 짝꿍이 되어 줄 수 있나?',
      replies: [
        { say: '영광이야, 순경님', tier: 'great', remember: 'patrol-pair', face: 'shy', answer: '크, 크흠! 그럼 내일부터다. 배지는… 내가 직접 깎아 만들겠다.' },
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
        { say: '우산 같이 쓰자', tier: 'great', answer: '…반도 안 들어가겠지만 고맙다. 마음만은 다 들어갔다!' },
        { say: '빗길 조심해', tier: 'good', answer: '그건 내가 할 말이다! 다리 위 미끄러운 데는 피해서 다녀라.' },
        { say: '비는 우울해', tier: 'meh', face: 'calm', answer: '그럼 파출소 와서 꿀차 마셔라. 빗소리 듣는 것도 나쁘지 않다.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '크하하하! 폭풍이다! 천둥이 칠 때마다 콧수염이 곤두선다! 기운이 펄펄 난다!',
      replies: [
        { say: '같이 천둥 구경하자!', tier: 'great', remember: 'storm-friend', answer: '좋다! 파출소 창가 명당을 내주지. 번쩍하면 같이 소리 지르는 거다!' },
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
        { say: '고향 생각나?', tier: 'good', remember: 'snow-home', answer: '…조금. 이 정도 눈은 고향에선 봄이다. 그래도 반갑군.' },
        { say: '그냥 자', tier: 'meh', face: 'sorry', answer: '근무 중엔 안 된다! …오 분만. 아니, 안 된다. 크흠.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '쉿. 잠복 중이다. 쓰레쉬 가게에 또 초록 불이 켜졌다. 수상하군.',
      replies: [
        { say: '나도 같이 볼게', tier: 'great', remember: 'lantern-watch', answer: '좋다, 파트너. 소리 내지 마라. …내 배에서 나는 소리는 무시하고.' },
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
      id: 'op-fish',
      when: { fish: ['trout', 'sweetfish', 'lenok', 'goldcarp'] },
      open: '킁킁… 이 냄새! {me}, 오늘 민물고기 잡았지? {fish}! 증거가 확실하다!',
      replies: [
        { say: '하나 줄까?', tier: 'great', answer: '정말이냐! 크하하! 이건 뇌물이 아니라 우정이다. 확실히 우정이다!' },
        { say: '코가 진짜 좋네', tier: 'good', answer: '순경의 코다. 범죄 냄새랑 생선 냄새는 절대 안 놓친다.' },
        { say: '안 줄 거야', tier: 'meh', face: 'sorry', answer: '…알고 있었다. 묻지도 않았다. 침도 안 흘렸다. 크흠.' },
      ],
    },
    {
      id: 'op-fish-any',
      when: { fish: true },
      open: '{me}, 오늘 낚시했나? 손에 비린내가 난다. 수사 결과다!',
      replies: [
        { say: '{fish} 잡았어!', tier: 'great', answer: '오오! 좋은 손맛이었겠군. 연어는 아직이냐? 연어 잡으면 꼭 말해라!' },
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
        { say: '천둥 북소리 들려줘!', tier: 'great', answer: '크하하! 좋다! 둥, 둥, 둥! 오늘 마을 전체가 춤추게 해 주지!' },
        { say: '수고가 많아', tier: 'good', face: 'smile', answer: '수고는 무슨. 다들 웃으면 그게 내 월급이다.' },
        { say: '시끄러워', tier: 'meh', face: 'sorry', answer: '…미안하다. 목소리를 줄여 보겠다. 줄인 게 이거다.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴에 먹구름이 꼈다. 무슨 일이냐. 순경한테 말해 봐라.',
      replies: [
        { say: '그냥 좀 지쳤어', tier: 'great', face: 'smile', answer: '그럼 오늘은 내가 지킨다. 넌 꿀차 마시고 쉬어라. 순경 명령이다.' },
        { say: '별일 아니야', tier: 'good', answer: '그래. 그래도 무슨 일 생기면 크게 불러라. 천둥보다 빨리 간다.' },
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
        { say: '네 걱정을 하던데', tier: 'great', face: 'think', answer: '…내 걱정을? 그 녀석이? 크흠. 오늘 감시는 조금만 하겠다.' },
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
        { say: '맛이 어땠어?', tier: 'great', answer: '…눈물이 났다. 이건 사건이다. 다음엔 네 몫도 굽겠다.' },
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
        { say: '정말 잘됐다!', tier: 'great', face: 'smile', answer: '울면서 고맙다고 하셨다. …콧수염에 이슬이 또 맺혔다.' },
        { say: '네 덕분이야', tier: 'good', face: 'shy', answer: '우리 덕분이다. 사건 종결! 이런 미제는 꼭 풀어야지.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '수사 결과, {me} 너는 {taste} 좋아한다더군. 맞나? 정보원은 비밀이다.',
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
        { say: '작전 내용이 뭔데?', tier: 'great', remember: 'bday-plan', answer: '꿀 케이크 호송, 북소리 축하, 그리고 비밀 하나. 기대해라!' },
        { say: '조용히 지나가도 돼', tier: 'good', face: 'smile', remember: 'bday-plan', answer: '그럼 조용히 꿀 케이크만 들고 가지. 그건 양보 못 한다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '파출소 신고 접수',
      hint: '한 번 이야기를 나누면 볼리바스가 파출소 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '볼리바스가 파출소 책상 위 두꺼운 장부를 쿵 펼친다.',
        '"신규 시민 등록이다! 이름, {me}. 특징… 웃는 얼굴이 수상하게 착함."',
        '그가 콧수염을 쓸며 펜을 꾹꾹 눌러 쓴다.',
        '"이 장부에 오르면 이 마을이 널 지킨다. 그러니까 내가 지킨다는 뜻이다."',
      ],
      replies: [
        { say: '든든하다, 고마워!', tier: 'great', answer: '크하하하! 그 말이면 충분하다! 무슨 일 있으면 크게 불러라!' },
        { say: '수상하게 착함이 뭐야?', tier: 'good', face: 'laugh', answer: '칭찬이다. 순경식 칭찬. 다들 처음엔 헷갈려 한다.' },
        { say: '등록 안 하면 안 돼?', tier: 'meh', face: 'think', answer: '이미 적었다. 지우개는 없다. 대신 꿀사탕 하나 주지.' },
      ],
    },
    {
      title: '등불 아래 잠복',
      hint: '밤(게임 시각 밤 아홉 시부터 자정) 시장 거리로 가 보세요. 잠복 중이래요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 21, to: 24 } },
      scene: [
        '시장 거리 모퉁이, 커다란 그림자가 화분 뒤에 웅크리고 있다. 전혀 숨겨지지 않았다.',
        '"쉿, {me}! 이쪽이다. 저 등불 상점, 오늘도 초록 불이다."',
        '그가 꿀빵 하나를 반으로 갈라 건넨다. "잠복의 기본은 간식이다."',
        '그때 등불 상점 문이 열리고, 쓰레쉬가 등불 하나를 들고 나온다.',
        '그는 골목 끝 어두운 계단에 등불을 걸어 두고 조용히 들어간다.',
        '"…저 계단, 할머니들이 밤에 자주 넘어지던 데다." 볼리바스가 중얼거린다.',
      ],
      replies: [
        { say: '쓰레쉬도 마을을 지키네', tier: 'great', remember: 'night-patrol', face: 'think', answer: ['…그런 것 같군. 오늘 수사 결과는 무혐의다.', '그래도 감시는 계속한다. 고맙다고 말할 핑계로.'] },
        { say: '꿀빵 맛있다', tier: 'good', remember: 'night-patrol', face: 'laugh', answer: '그렇지? 잠복은 이 맛이다. 다음 잠복에도 같이 와라.' },
        { say: '다리 저려', tier: 'meh', remember: 'night-patrol', answer: '나도다. 덩치가 커서 숨기가 힘들다. 크흠, 철수다.' },
      ],
    },
    {
      title: '잼 바른 빵의 오후',
      hint: '볼리바스가 달콤한 잼 얘기를 자주 해요. 잼 한 병을 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'jam', take: true } },
      scene: [
        '잼 병을 내밀자 볼리바스의 콧수염이 파르르 떨린다.',
        '"이, 이건… 증거물로 압수다! 아니, 선물로 감사히 받겠다!"',
        '파출소 난로 앞, 그가 프리렌네 빵에 잼을 산처럼 바른다.',
        '"고향에선 겨울 오기 전에 이렇게 먹었다. 배를 채워야 긴 겨울을 버티거든."',
        '"…지금은 버틸 겨울이 별로 무섭지 않다. 이 마을이 따뜻해서다."',
      ],
      replies: [
        { say: '나도 한 입 줘', tier: 'great', remember: 'jam-feast', face: 'laugh', answer: '물론이다! 제일 잼 많은 쪽이다. 순경의 배려다. 크하하!' },
        { say: '겨울엔 내가 깨워 줄게', tier: 'good', remember: 'jam-feast', face: 'shy', answer: '…그럼 겨울잠도 짧아지겠군. 그것도 나쁘지 않다.' },
        { say: '잼이 너무 많아', tier: 'meh', remember: 'jam-feast', answer: '잼은 많을수록 정의다. 이건 반박 불가다.' },
      ],
    },
    {
      title: '다정한 정의',
      hint: '볼리바스와 정의에 대해 이야기를 나누면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'justice-kind' },
      scene: [
        '비 오는 저녁, 볼리바스가 파출소 처마 밑에서 젖은 새끼 고양이를 품고 있다.',
        '"다친 데부터 봐야 한다고 했지, {me}. 그 말이 계속 생각나더라."',
        '"고향에선 강한 게 정의였다. 큰 소리, 큰 주먹. 나도 그렇게 컸다."',
        '"근데 여기 와서 알았다. 정의는 이렇게 작은 걸 품는 거다."',
        '고양이가 그의 털 칼라 속에서 작게 운다. 그의 목소리가 천둥보다 낮아진다.',
      ],
      replies: [
        { say: '넌 이미 다정한 순경이야', tier: 'great', face: 'shy', answer: '…크, 크흠. 그런 말 들으면 콧수염이 정리가 안 된다.' },
        { say: '고양이 이름 지어 주자', tier: 'good', face: 'smile', answer: '좋다. "꿀"이다. 이의 없지? 이의는 기각이다.' },
        { say: '감기 걸리겠다', tier: 'meh', answer: '나는 괜찮다. 털이 두꺼우니까. 너나 안으로 들어와라.' },
      ],
    },
    {
      title: '천둥 치는 밤의 고백',
      hint: '볼리바스와 아주 가까워지면 폭풍 치는 밤의 이야기를 들려줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '창밖에 번개가 친다. 볼리바스가 파출소 불을 끄고 창가에 나란히 앉는다.',
        '"{me}. 수사 결과를 보고하겠다. 아주 중대한 사건이다."',
        '"요즘 순찰 경로가 자꾸 네 집 쪽으로 휜다. 콧수염은 하루 다섯 번 빗는다."',
        '천둥이 울린다. 그의 목소리는 그보다 훨씬 작다.',
        '"…범인은 아직 못 밝혔다. 아니, 밝혔는데 말을 못 하겠다."',
      ],
      replies: [
        { say: '천천히 자백해도 돼', tier: 'great', face: 'shy', answer: '…크하하. 너한텐 못 당하겠다. 꽃 한 다발 들고 오면 그때 다 말하겠다.' },
        { say: '범인 나지?', tier: 'good', face: 'wow', answer: '수, 수사 기밀이다! …그렇게 빨리 맞히면 반칙이다.' },
        { say: '천둥 소리에 못 들었어', tier: 'meh', face: 'calm', answer: '…괜찮다. 다음엔 천둥 없는 날 다시 말하겠다.' },
      ],
    },
    {
      title: '종결되지 않을 사건',
      hint: '볼리바스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '볼리바스가 파출소 장부를 다시 펼친다. 맨 처음 {me} 이름을 적었던 쪽이다.',
        '"특징 칸을 고쳤다. \'수상하게 착함\' 옆에 한 줄 더."',
        '거기엔 삐뚤빼뚤한 글씨로 "볼리바스의 연인. 평생 경호 대상."',
        '"이 사건은 종결 안 한다. 평생 수사할 거다. 이의 있나?"',
      ],
      replies: [
        { say: '이의 없음!', tier: 'great', face: 'laugh', answer: '크하하하! 판결 확정이다! 오늘 밤 천둥이 쳐도 하나도 안 무섭다!' },
        { say: '반지는 증거물이야?', tier: 'good', face: 'shy', answer: '…그건 네가 정할 일이다. 내가 정하면 너무 떨려서 장부가 찢어진다.' },
        { say: '천천히 수사하자', tier: 'meh', face: 'smile', answer: '좋다. 서두를 거 없다. 겨울잠보다 긴 수사가 될 테니까.' },
      ],
    },
  ],
  after: [
    '오늘 면담은 끝이다! 순찰 다녀오겠다. 조심히 다녀라!',
    '또 왔나? 수상하군. 농담이다. 꿀차 한 잔 하고 가라.',
    '오늘 보고서는 다 썼다. "이상 무, {me} 웃음 확인." 크하하!',
    '하암… 아니, 안 존다. 근무 중이다. 내일 보자!',
  ],
};
