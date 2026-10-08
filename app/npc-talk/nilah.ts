// 닐라 — 닐라 목장 주인. 밝고 호쾌한 반말, 큰 웃음("하하!", "하하하!"),
// "재밌겠다! 한 판 붙어 볼래?" 내기·팔씨름·달리기를 좋아하고, 물 채찍과
// 물바가지 장난으로 동물 목욕을 한 번에 끝낸다. 웃음이 곧 힘이라 남이 웃으면
// 같이 신난다. 먼 바다를 건너온 모험가라 큰 상대와 겨루는 이야기는 웃으며
// 가볍게만. 원작 대사는 옮기지 않고 말투와 소재(기쁨, 물결, 바다 괴물)만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const NILAH_TALK: NpcTalkBook = {
  npc: 'nilah',
  memories: {
    'race-yes': '달리기 내기를 하자고 했어요',
    'arm-wrestle': '팔씨름 한 판을 약속했어요',
    'laugh-power': '웃음이 힘이 된다는 말에 맞장구쳤어요',
    'sea-story': '먼 바다를 건너온 이야기를 들었어요',
    'water-whip': '물 채찍 솜씨를 보여 달라고 했어요',
    'big-egg': '제일 큰 달걀을 같이 찾았어요',
    'spicy-stew': '매운탕을 좋아한다고 했어요',
    'calf-name': '막내 송아지 이름을 같이 지었어요',
    'dance-wave': '물결 춤을 같이 배웠어요',
    'monster-tale': '바다 괴물과 겨룬 이야기를 들었어요',
    'adventure-pal': '모험 짝꿍이 되기로 했어요',
    'dawn-milk': '새벽 축사에서 첫 우유를 마셨어요',
    'stew-night': '매운탕을 같이 끓여 먹은 밤이 있어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 내기 잔치 이야기를 나눴어요',
    'date-talk': '방에서 보낸 시간을 이야기했어요',
  },
  talks: [
    {
      id: 'race',
      open: '{me}! 재밌겠다! 저 사일로까지 달리기 한 판 붙어 볼래?',
      replies: [
        { say: '좋아! 봐주는 거 없기다', tier: 'great', remember: 'race-yes', answer: '하하하! 그 말 기다렸어! 지는 쪽이 우유 한 통 나르기다!' },
        { say: '천천히 걸어가면 안 돼?', tier: 'good', answer: '되지! 걸으면서 소들한테 인사하는 것도 모험이야, 하하!' },
        { say: '뛰는 건 싫어', tier: 'meh', face: 'calm', answer: '에이, 아쉽다! 그럼 응원이라도 크게 해 줘. 그것도 힘이 돼!' },
      ],
    },
    {
      id: 'arm',
      open: '팔 좀 보여 줘! 음, 좋은데? 언제 나랑 팔씨름 한 판 하자!',
      replies: [
        { say: '지금 당장 붙자!', tier: 'great', remember: 'arm-wrestle', answer: ['하하하! 좋아, 통 위에 팔 올려!', '…어? 생각보다 세다! 이건 무승부로 해 두자!'] },
        { say: '가붕보다 세?', tier: 'good', face: 'think', answer: '그건 아직 몰라! 스무 판 넘게 비겼거든. 다음엔 꼭 이긴다!' },
        { say: '팔 아플 것 같아', tier: 'meh', face: 'sorry', answer: '하하, 겁먹지 마! 살살 할게. 진짜로! 아마도!' },
      ],
    },
    {
      id: 'laugh',
      open: '{me}, 내 힘의 비결이 뭔지 알아? 근육? 아니야!',
      replies: [
        { say: '웃음이지?', tier: 'great', remember: 'laugh-power', answer: '정답! 하하하! 네가 웃으면 그것까지 다 내 힘이 돼. 그러니까 많이 웃어!' },
        { say: '진한 우유?', tier: 'good', face: 'laugh', answer: '하하! 반은 맞았어! 우유 마시면서 웃으면 두 배거든!' },
        { say: '그냥 타고난 거 아냐?', tier: 'meh', face: 'think', answer: '음, 그런 것도 있겠지! 근데 웃지 않는 날엔 우유 통도 무거워.' },
      ],
    },
    {
      id: 'sea',
      open: '나 원래 여기 사람 아니야. 먼 바다를 건너왔지! 궁금해?',
      replies: [
        { say: '궁금해! 다 들려줘', tier: 'great', remember: 'sea-story', answer: ['배 한 척에 노 하나! 파도가 산만 했어!', '근데 하나도 안 무서웠어. 신나서 계속 웃었거든, 하하!'] },
        { say: '왜 여기 정착했어?', tier: 'good', face: 'smile', answer: '초원이 바다처럼 물결치더라고! 여기서도 모험할 수 있겠다 싶었지.' },
        { say: '배 타는 건 별로야', tier: 'meh', face: 'calm', answer: '하하, 괜찮아! 땅 위에도 겨룰 거리는 잔뜩 있으니까.' },
      ],
    },
    {
      id: 'whip',
      open: '소들 목욕 어떻게 시키는지 알아? 물 한 번에 휙! 끝이야!',
      replies: [
        { say: '보여 줘! 물 채찍!', tier: 'great', remember: 'water-whip', answer: '하하하! 좋아, 뒤로 물러서! 휙! …아, 너도 좀 젖었네. 미안!' },
        { say: '소들이 안 놀라?', tier: 'good', face: 'think', answer: '처음엔 놀랐지! 지금은 줄 서서 기다려. 시원하거든!' },
        { say: '물 튀는 건 싫어', tier: 'meh', face: 'sorry', answer: '앗, 그럼 오늘 물바가지 장난은 참을게. 하루 한 번 규칙이야!' },
      ],
    },
    {
      id: 'egg',
      open: '닭장에서 엄청 큰 달걀 찾기 내기할래? 정 든 녀석들이 큰 걸 낳거든!',
      replies: [
        { say: '내가 먼저 찾는다!', tier: 'great', remember: 'big-egg', answer: '하하! 그 기세 좋다! 짚 밑을 봐. 거기가 명당이야!' },
        { say: '닭이 쪼지 않아?', tier: 'good', face: 'laugh', answer: '대장 닭은 좀 쪼아! 웃으면서 인사하면 봐줄걸, 하하!' },
        { say: '달걀은 그냥 사 먹을래', tier: 'meh', face: 'calm', answer: '하하, 그럼 장날에 와! 제일 큰 건 따로 빼 둘게.' },
      ],
    },
    {
      id: 'stew',
      open: '배고프다! {me}, 매운탕 좋아해? 나는 국물까지 다 마셔!',
      replies: [
        { say: '얼큰한 거 최고지!', tier: 'great', remember: 'spicy-stew', answer: '하하하! 통했다! 다음엔 같이 끓이자. 고기는 럭스한테 졸라 보고!' },
        { say: '맵기만 조금 줄이면', tier: 'good', answer: '좋아, 네 그릇엔 우유 한 잔 곁들여 줄게. 매운 데 딱이야!' },
        { say: '매운 건 못 먹어', tier: 'meh', face: 'sorry', answer: '에이, 아깝다! 그럼 달걀찜 해 줄게. 큰 달걀로!' },
      ],
    },
    {
      id: 'calf',
      open: '막내 송아지가 아직 이름이 없어! {me}, 하나 지어 줄래?',
      replies: [
        { say: '물결이 어때?', tier: 'great', remember: 'calf-name', answer: '물결! 하하하! 완벽해! 봐, 꼬리 흔든다. 마음에 든대!' },
        { say: '닐라 주니어!', tier: 'good', face: 'laugh', answer: '하하! 그럼 나보다 시끄러워질걸? 후보로 적어 둘게!' },
        { say: '그냥 소라고 불러', tier: 'meh', face: 'think', answer: '음… 그럼 다 소잖아! 이름은 다음에 같이 생각하자.' },
      ],
    },
    {
      id: 'dance',
      open: '물결 춤 알아? 춤인지 싸움인지 나도 몰라! 하하, 배워 볼래?',
      replies: [
        { say: '가르쳐 줘! 따라 할게', tier: 'great', remember: 'dance-wave', answer: '좋아! 무릎 살짝, 팔은 빙글! 그렇지! 너 물결 타는구나!' },
        { say: '보기만 할게', tier: 'good', face: 'smile', answer: '그것도 좋아! 박수 쳐 주면 나 더 높이 뛴다!' },
        { say: '춤은 쑥스러워', tier: 'meh', face: 'calm', answer: '하하, 소들 앞이라 그래? 걔들은 아무 말 안 해. 다음엔 꼭!' },
      ],
    },
    {
      id: 'monster',
      open: '옛날에 바다 한가운데서 엄청 큰 놈이랑 겨뤘어. 들을래?',
      replies: [
        { say: '그래서 누가 이겼어?', tier: 'great', remember: 'monster-tale', answer: ['결과? 나 지금 웃고 있잖아! 하하하!', '…사실 그 녀석 이마에 올라타서 실컷 웃어 줬지.'] },
        { say: '무섭지 않았어?', tier: 'good', face: 'think', answer: '조금! 근데 무서울 때 웃으면 그게 이기는 길이더라.' },
        { say: '허풍 아니야?', tier: 'meh', face: 'laugh', answer: '하하하! 샹크스 같은 소리 하네! 믿든 말든 진짜야!' },
      ],
    },
    {
      id: 'snail',
      open: '으, 아까 울타리에 달팽이가 붙어 있었어. 걔들은 정말 못 이기겠어!',
      replies: [
        { say: '내가 떼어 줄게', tier: 'great', face: 'wow', answer: '진짜? 너 최고야! 큰 괴물은 안 무서운데 그건 이상하게 싫어!' },
        { say: '천천히 가니까 귀엽잖아', tier: 'good', face: 'think', answer: '귀엽…나? 너무 느려서 내기를 못 하잖아! 하하!' },
        { say: '달팽이 요리도 있대', tier: 'meh', face: 'sorry', answer: '으아, 그 말은 못 들은 걸로 할게! 쑥이랑 같이 저리 치워!' },
      ],
    },
    {
      id: 'bet',
      open: '{me}, 오늘 무슨 내기 할까? 건초 쌓기? 징검다리 건너기?',
      replies: [
        { say: '징검다리! 빠지면 지는 거', tier: 'great', answer: '하하하! 좋아! 근데 나 물은 자신 있다? 빠져도 웃으면서 나와!' },
        { say: '건초 쌓기로 하자', tier: 'good', answer: '좋지! 지는 쪽이 오늘 닭장 청소다. 각오해!' },
        { say: '오늘은 내기 쉬자', tier: 'meh', face: 'calm', answer: '그래, 그런 날도 있지! 대신 내일은 두 판이다!' },
      ],
    },
    {
      id: 'pal',
      when: { ch: 3 },
      open: '{me}, 나 다음 모험 계획 세우는 중이야. 너도 같이 갈래? 진심이야!',
      replies: [
        { say: '당연하지. 짝꿍이잖아', tier: 'great', remember: 'adventure-pal', face: 'shy', answer: '…하하! 그 말 듣고 싶었어! 맨 앞자리는 네 거야. 약속!' },
        { say: '어디로 가는데?', tier: 'good', answer: '아직 몰라! 그게 제일 신나는 거잖아. 가 보면 알겠지!' },
        { say: '소들은 누가 봐?', tier: 'meh', face: 'think', answer: '하쿠한테 부탁하면 돼! 대신 우유 열 통 줘야겠다, 하하!' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비다! 물은 내 편이야! {me}, 우리 빗속에서 한 바퀴 돌래?',
      replies: [
        { say: '좋아! 같이 춤추자', tier: 'great', remember: 'dance-wave', answer: '하하하! 빗방울이 다 박자야! 빙글, 빙글! 신난다!' },
        { say: '건초 덮었어?', tier: 'good', face: 'wow', answer: '앗, 맞다! 잠깐만! …다 덮었어. 너 목장 일 잘 아는구나!' },
        { say: '젖는 건 싫어', tier: 'meh', face: 'calm', answer: '하하, 그럼 축사 처마 밑에 있어. 나 혼자 실컷 젖고 올게!' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '바람 소리 굉장하지! 이런 파도면 바다에선 큰 놈이 올라올 텐데!',
      replies: [
        { say: '동물들은 괜찮아?', tier: 'great', face: 'smile', answer: '다 축사에 넣었어! 걱정해 줘서 고마워. 내가 문 꽉 붙잡고 있었지!' },
        { say: '같이 보러 갈래?', tier: 'good', face: 'laugh', answer: '하하! 마음은 굴뚝같은데 오늘은 참자. 울타리부터 봐야 해!' },
        { say: '무서워…', tier: 'meh', face: 'calm', answer: '괜찮아, 내가 크게 웃어 줄게! 하하하! 봐, 바람 소리 작아졌지?' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다! 양들이 눈사람이 됐어! {me}, 눈싸움 한 판 붙어 볼래?',
      replies: [
        { say: '좋아! 각오해!', tier: 'great', answer: '하하하! 눈도 물이잖아? 그러니까 내가 유리해! 받아라!' },
        { say: '양들 털어 주자', tier: 'good', face: 'smile', answer: '오, 착하다! 털어 주면 꼬리 흔들어. 그다음에 눈싸움이다!' },
        { say: '손 시려', tier: 'meh', face: 'sorry', answer: '앗, 장갑 빌려줄게! 데운 우유도 한 잔! 몸부터 녹이자.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침! 방금 짠 우유야! 따끈해! {me}, 첫 잔 마셔 볼래?',
      replies: [
        { say: '고마워! 잘 마실게', tier: 'great', remember: 'dawn-milk', answer: '하하! 이 시간 우유가 제일 진해! 한 모금에 힘이 쭉 나지?' },
        { say: '같이 젖 짜도 돼?', tier: 'good', face: 'wow', answer: '물론! 손목 힘이 비결이야. 팔씨름 연습도 되고, 하하!' },
        { say: '아직 졸려…', tier: 'meh', face: 'calm', answer: '하하, 그럼 소들 옆에 기대 있어. 따뜻해서 금방 깰걸!' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤바다 소리 들려? 이런 밤엔 배 위에서 웃던 날들이 생각나.',
      replies: [
        { say: '그때 이야기 해 줘', tier: 'great', remember: 'sea-story', answer: ['별이 물에 다 비쳐서 위아래가 다 하늘이었어!', '그 한가운데서 혼자 노래 불렀지. 하하, 엄청 크게!'] },
        { say: '바다가 그리워?', tier: 'good', face: 'think', answer: '조금! 근데 여기엔 웃어 줄 사람이 있잖아. 그게 더 좋아.' },
        { say: '이제 자야지', tier: 'meh', face: 'calm', answer: '맞아, 나도 내일 새벽 축사야! 잘 자, {me}!' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '개울 물결이 노을 색이야! 발 담그고 가! 시원하다, 하하!',
      replies: [
        { say: '같이 담그자', tier: 'great', answer: '하하하! 좋아! 누가 오래 버티나 내기다! 차갑다!' },
        { say: '노을 예쁘다', tier: 'good', face: 'smile', answer: '그치? 물결이 춤추는 것 같아. 나도 따라 추고 싶어져.' },
        { say: '물 차갑지 않아?', tier: 'meh', face: 'laugh', answer: '차가우니까 재밌는 거야! 소리 질러도 돼, 하하!' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 팔씨름 대회 열자! 상품은 진한 우유 한 통!',
      replies: [
        { say: '나도 나간다!', tier: 'great', remember: 'arm-wrestle', answer: '하하하! 좋다! 결승에서 만나자! 봐주는 거 없어!' },
        { say: '심판은 누가 봐?', tier: 'good', face: 'think', answer: '볼리바스한테 부탁하면 또 무승부라고 할걸! 하하!' },
        { say: '구경만 할래', tier: 'meh', face: 'calm', answer: '구경도 좋아! 대신 응원은 제일 크게 해 줘!' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me}, 물 냄새 난다! 오늘 {fish} 낚았지? 손맛 어땠어?',
      replies: [
        { say: '힘겨루기 대단했어!', tier: 'great', answer: '하하하! 그 맛이지! 물속 녀석이랑 한 판 붙는 거, 나도 좋아해!' },
        { say: '겨우 한 마리야', tier: 'good', answer: '한 마리면 이긴 거야! 매운탕 한 그릇은 나오겠다!' },
        { say: '팔이 빠질 것 같아', tier: 'meh', face: 'sorry', answer: '하하, 손목을 써야 해! 우유 통 들기로 연습하자!' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '들었어! 엄청 큰 놈 낚았다며? 와, 나 지금 막 심장이 뛰어!',
      replies: [
        { say: '내가 이겼어!', tier: 'great', answer: '하하하하! 최고다! 큰 상대를 이긴 날은 크게 웃는 거야! 다 같이!' },
        { say: '팔이 아직 떨려', tier: 'good', face: 'wow', answer: '그게 승리의 떨림이야! 나도 바다 괴물이랑 겨룬 날 그랬어!' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 왔구나! 흙 묻었네! 물 채찍 한 번이면 깨끗해, 해 줄까?',
      replies: [
        { say: '좋아, 시원하게!', tier: 'great', remember: 'water-whip', answer: '하하! 간다, 휙! 개운하지? 소들도 이 맛에 줄 서!' },
        { say: '작물 좀 나눠 줄게', tier: 'good', face: 'smile', answer: '우와, 고마워! 대신 진한 우유 한 병 줄게. 맞바꾸기!' },
        { say: '그냥 둘래', tier: 'meh', face: 'calm', answer: '하하, 알았어! 흙도 훈장이지. 수고했어!' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me}, 금별 작물 나왔다며? 반짝반짝! 큰 상대 이긴 거랑 똑같다!',
      replies: [
        { say: '자랑하러 왔지!', tier: 'great', answer: '하하하! 자랑해야 맛이지! 소들아, 박수! …음메라도 해 봐!' },
        { say: '운이 좋았어', tier: 'good', answer: '운도 웃는 사람한테 오는 거야! 축하해!' },
      ],
    },
    {
      id: 'op-mood-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴이 좀 처졌다. 오늘은 내기 안 할게. 그냥 앉아.',
      replies: [
        { say: '네 웃음소리 듣고 싶어', tier: 'great', face: 'smile', answer: '그거라면 얼마든지! 하하하! …봐, 너 입꼬리 올라갔다. 내가 이겼어!' },
        { say: '좀 지쳤어', tier: 'good', face: 'calm', answer: '그럼 데운 우유 한 잔. 지친 날엔 소들 옆이 제일 따뜻해.' },
        { say: '혼자 있고 싶어', tier: 'meh', face: 'sorry', answer: '알았어. 근데 웃고 싶어지면 목장으로 와. 언제든!' },
      ],
    },
    {
      id: 'op-mood-high',
      when: { mood: 'high' },
      open: '{me}, 오늘 표정 최고다! 그 기운 나한테도 좀 줘! 힘이 막 나!',
      replies: [
        { say: '그럼 한 판 붙자!', tier: 'great', answer: '하하하! 그거지! 지금 우리 둘 다 최강이야! 덤벼!' },
        { say: '좋은 일 있었어', tier: 'good', face: 'smile', answer: '오, 뭔데? 말해 줘! 남의 기쁨 듣는 게 제일 신나!' },
      ],
    },
    {
      id: 'op-news-record',
      when: { news: 'record' },
      open: '들었어? 마을에 새 기록 나왔대! 와, 나도 뭐든 기록 세우고 싶다!',
      replies: [
        { say: '팔씨름 기록 세우자', tier: 'great', answer: '하하하! 좋다! 연속 승리 기록! 첫 상대는 가붕이다!' },
        { say: '우유 많이 짜기는?', tier: 'good', face: 'laugh', answer: '그건 소들이 세우는 기록이잖아! 하하, 그래도 해 볼까?' },
        { say: '기록은 관심 없어', tier: 'meh', face: 'calm', answer: '그래? 그럼 웃음 많이 웃기 기록은 어때? 그건 나 자신 있어!' },
      ],
    },
    {
      id: 'op-news-wedding',
      when: { news: 'wedding' },
      open: '오늘 결혼식 있었대! 축하 우유는 동네 전부 공짜다! 하하!',
      replies: [
        { say: '축하 잔치 하자!', tier: 'great', answer: '좋아! 소들 목에도 꽃 달아 주자! 다 같이 웃는 날이야!' },
        { say: '부럽다', tier: 'good', face: 'shy', answer: '하하, 나도 조금! …아니, 지금 그 얘기 하는 거 아니고!' },
      ],
    },
    {
      id: 'op-bond-yanineko',
      when: { bond: 'yanineko' },
      open: '{other} 만났어? 걔랑 들길 달리기 내기했는데 또 우유 한 통 걸었어!',
      replies: [
        { say: '누가 이겼어?', tier: 'great', answer: '내가! 하하하! 근데 걔가 중간에 그늘에서 잤대. 다음엔 정정당당하게!' },
        { say: '우유 아깝지 않아?', tier: 'good', face: 'laugh', answer: '하나도! 지면 주고 이기면 같이 마시는 거야!' },
        { say: '걔 또 잤어?', tier: 'meh', face: 'think', answer: '하하, 아마도! 그래서 나 혼자 결승선 밟았지 뭐야.' },
      ],
    },
    {
      id: 'op-bond-volibas',
      when: { bond: 'volibas' },
      open: '{other} 순경님 봤어? 저번 팔씨름 그거, 내가 이긴 거 맞지?',
      replies: [
        { say: '네가 이긴 거야!', tier: 'great', answer: '하하하! 그치? 근데 순경님은 늘 무승부래! 다시 붙어야겠다!' },
        { say: '무승부라던데', tier: 'good', face: 'think', answer: '으, 또 그 소리! 좋아, 다음엔 심판 둘 세우고 붙는다!' },
        { say: '둘 다 그만 싸워', tier: 'meh', face: 'laugh', answer: '싸움 아니야, 겨루기야! 웃으면서 하는 거라고, 하하!' },
      ],
    },
    {
      id: 'op-bond-ornn',
      when: { bond: 'ornn' },
      open: '대장간 다녀왔어? 오늘도 모루 소리 크더라! 나도 웃음으로 답했지!',
      replies: [
        { say: '여기까지 들려?', tier: 'great', answer: '들리지! 땅, 땅! 하면 내가 하하! 해. 들길 건너 주고받는 거야!' },
        { say: '울타리 못 받았어?', tier: 'good', answer: '응! 그 못은 아무리 밀어도 안 빠져. 분하지만 최고야!' },
        { say: '시끄럽지 않아?', tier: 'meh', face: 'think', answer: '하하, 시끄러운 건 서로 마찬가지라 괜찮대!' },
      ],
    },
    {
      id: 'op-bond-lux',
      when: { bond: 'lux' },
      open: '{other} 봤어? 저번 낚시 내기, 내가 한 마리 차이로 졌어! 분해!',
      replies: [
        { say: '다음엔 같이 이기자', tier: 'great', answer: '하하하! 좋아, 둘이 편먹고 붙자! 매운탕은 진 쪽이 끓이고!' },
        { say: '한 마리면 아깝다', tier: 'good', face: 'sorry', answer: '그러니까! 물 채찍 쓰면 안 된대. 반칙이래, 하하!' },
        { say: '낚시는 운이야', tier: 'meh', face: 'think', answer: '운이라도 다음엔 내 편으로 만들 거야!' },
      ],
    },
    {
      id: 'op-bond-haku',
      when: { bond: 'haku' },
      open: '{other} 만났구나! 오늘 복숭아랑 우유 바꾸기로 했어. 나 득 본 거지?',
      replies: [
        { say: '서로 득 본 거야', tier: 'great', answer: '하하! 맞아! 그래서 이웃이 좋은 거지. 걔 웃는 거 보면 내가 이긴 거고!' },
        { say: '복숭아 맛있겠다', tier: 'good', answer: '한 조각 나눠 줄게! 하쿠한텐 비밀로 하고, 하하!' },
      ],
    },
    {
      id: 'op-bond-gabung',
      when: { bond: 'gabung' },
      open: '{other} 만났어? 걔가 팔씨름 얘기 안 했어? 이번엔 내가 이길 차례야!',
      replies: [
        { say: '자기가 이긴대', tier: 'great', face: 'laugh', answer: '하하하! 그럴 줄 알았어! 좋아, 오늘 밤 통 위에서 결판이다!' },
        { say: '둘이 왜 맨날 비겨?', tier: 'good', face: 'think', answer: '둘 다 웃다가 힘이 풀리거든! 그게 문제야, 하하!' },
        { say: '아무 말 없던데', tier: 'meh', face: 'calm', answer: '흥, 숨기는 거야! 비법 연습 중이겠지!' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-race',
      when: { mem: 'race-yes' },
      use: 'race-yes',
      open: '{me}! 저번에 달리기 하자고 했지? 오늘이 그날이다! 준비됐어?',
      replies: [
        { say: '하나, 둘, 셋!', tier: 'great', answer: '하하하! 출발! …와, 빠르다! 이번엔 내가 우유 나른다!' },
        { say: '신발 끈 좀 묶고', tier: 'good', face: 'laugh', answer: '기다려 줄게! 정정당당해야 웃으면서 이기지!' },
      ],
    },
    {
      id: 'cb-arm',
      when: { mem: 'arm-wrestle' },
      use: 'arm-wrestle',
      open: '팔씨름 약속 기억하지? 우유 통 올려놨어. 팔 올려!',
      replies: [
        { say: '이번엔 안 진다', tier: 'great', answer: ['좋아, 그 눈빛! 시작!', '…으으! 하하하! 또 무승부다! 너 진짜 세졌어!'] },
        { say: '살살 해 줘', tier: 'good', face: 'smile', answer: '하하, 알았어! 대신 웃으면서 하기다. 그게 규칙!' },
      ],
    },
    {
      id: 'cb-laugh',
      when: { mem: 'laugh-power' },
      use: 'laugh-power',
      open: '웃음이 힘이라는 거, 너도 맞다고 했잖아. 요즘 많이 웃어?',
      replies: [
        { say: '네 덕분에 많이 웃어', tier: 'great', face: 'shy', answer: '…하하! 그 말 들으니까 나 지금 소 한 마리도 들 수 있겠다!' },
        { say: '요즘은 좀 덜 웃었어', tier: 'good', face: 'think', answer: '그럼 지금부터 채우자! 하하하! 따라 해 봐!' },
      ],
    },
    {
      id: 'cb-whip',
      when: { mem: 'water-whip' },
      use: 'water-whip',
      open: '물 채찍 새 기술 생겼어! 이번엔 안 젖게 해 줄게. 아마도! 볼래?',
      replies: [
        { say: '보여 줘! 기대된다', tier: 'great', answer: '간다! 휙, 빙글! …봐, 소 세 마리 한 번에! 너도 안 젖었지?' },
        { say: '우비 입고 볼게', tier: 'good', face: 'laugh', answer: '하하하! 현명하다! 사실 나도 장담은 못 해!' },
      ],
    },
    {
      id: 'cb-egg',
      when: { mem: 'big-egg' },
      use: 'big-egg',
      open: '{me}, 저번 달걀 찾기 기억나? 오늘 그보다 더 큰 게 나왔어!',
      replies: [
        { say: '와, 보여 줘!', tier: 'great', face: 'wow', answer: '이거 봐! 손바닥만 해! 하하, 너 오는 날 낳았나 봐!' },
        { say: '그걸로 뭐 해 먹어?', tier: 'good', answer: '달걀찜! 큰 거 하나면 둘이 먹고도 남아!' },
      ],
    },
    {
      id: 'cb-calf',
      when: { mem: 'calf-name' },
      use: 'calf-name',
      open: '네가 지어 준 이름, 막내가 이제 부르면 와! 같이 불러 볼래?',
      replies: [
        { say: '물결아, 이리 와!', tier: 'great', face: 'laugh', answer: '하하하! 봐, 뛰어온다! 너 목소리 알아듣는 거야!' },
        { say: '진짜 알아들어?', tier: 'good', face: 'smile', answer: '그럼! 우유 줄 때만 귀가 더 밝아지지만, 하하!' },
      ],
    },
    {
      id: 'cb-monster',
      when: { mem: 'monster-tale' },
      use: 'monster-tale',
      open: '바다 괴물 이야기 기억해? 사실 뒷이야기가 있어. 너한테만 해 줄게.',
      replies: [
        { say: '듣고 싶어', tier: 'great', face: 'smile', answer: '그 녀석도 마지막엔 웃더라. 같이 웃으면 싸울 이유가 없어져. 신기하지?' },
        { say: '또 허풍이지?', tier: 'good', face: 'laugh', answer: '하하하! 반은! 나머지 반은 너 웃기려고 한 거야!' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 그걸로 내기 상품 걸어 볼까? 하하!',
      replies: [
        { say: '그럼 진짜 열심히 할게', tier: 'great', remember: 'taste-heard', answer: '하하하! 그 기세 좋다! 나도 안 봐준다!' },
        { say: '어떻게 알았어?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '소들이 알려 줬지! 농담이야, 마을 수첩에 다 있어!' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 돌아다닌 거 진짜 신났어! 너랑이면 어디든 모험이야!',
      replies: [
        { say: '다음엔 더 멀리 가자', tier: 'great', remember: 'outing-talk', answer: '하하하! 좋아! 먼바다까지! 노는 내가 저을게!' },
        { say: '너 계속 뛰었잖아', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '신나니까 그렇지! 다음엔 너 손 잡고 뛸게!' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이지? 생일 기념 내기 대회 열자! 상품은 진한 우유!',
      replies: [
        { say: '네가 웃어 주면 돼', tier: 'great', face: 'shy', remember: 'bday-plan', answer: '…하하! 그건 공짜야! 그날은 하루 종일 웃어 줄게!' },
        { say: '대회 좋아!', tier: 'good', remember: 'bday-plan', answer: '좋아! 주인공은 무조건 우승이다. 그게 생일 규칙!' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에서 같이 있던 거… 내기도 안 했는데 엄청 신났어. 이상하지?',
      replies: [
        { say: '나도 그랬어', tier: 'great', face: 'shy', remember: 'date-talk', answer: '…하하! 그럼 우리 둘 다 이긴 거네. 다음에도 또 그러자.' },
        { say: '다음엔 팔씨름하자', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '하하하! 좋아! 근데 너 앞에선 힘이 잘 안 들어가더라.' },
      ],
    },
  ],
  chapters: [
    {
      title: '들길 너머의 웃음소리',
      hint: '한 번 이야기를 나누면 닐라가 큰 소리로 웃으며 반겨 줘요.',
      need: { days: 1 },
      scene: [
        '우유 통을 어깨에 멘 닐라가 성큼성큼 다가온다.',
        '"안녕! 나 닐라! 목장 하고 있어! 웃음소리 크지? 하하하!"',
        '"웃는 게 내 힘이야. 네가 웃으면 그것도 내 힘이 되고!"',
        '"그러니까 {me}, 오늘부터 우리 자주 웃자. 약속!"',
      ],
      replies: [
        { say: '좋아, 하하하!', tier: 'great', remember: 'laugh-power', answer: '봐, 벌써 힘이 난다! 우유 한 통 더 들 수 있겠어!' },
        { say: '웃음소리 진짜 크다', tier: 'good', face: 'laugh', answer: '하하! 그치? 들길 너머 대장간까지 들린대!' },
        { say: '조금 시끄러워', tier: 'meh', face: 'sorry', answer: '앗, 미안! 너 앞에선 조금만 작게 웃을게. …노력해 볼게!' },
      ],
    },
    {
      title: '새벽 축사의 첫 우유',
      hint: '새벽(게임 시각 오전 다섯 시부터 여덟 시)에 닐라 목장에 가 보세요. 첫 우유를 짠대요.',
      need: { days: 3, points: 20, visit: { area: 'ranch', from: 5, to: 8 } },
      scene: [
        '새벽 안개 속 축사. 닐라가 소 옆에 앉아 젖을 짜고 있다.',
        '"왔구나! 진짜 왔네! 이 시간에 온 사람은 네가 처음이야!"',
        '"이 시간 우유가 하루 중 제일 진해. 소들도 아직 꿈결이라 순하고."',
        '그녀가 김이 나는 잔을 건넨다. 따끈하고 고소하다.',
        '"바다 건너올 때 매일 해 뜨는 걸 봤거든. 여기선 소들이랑 같이 봐."',
      ],
      replies: [
        { say: '내일도 와도 돼?', tier: 'great', remember: 'dawn-milk', face: 'laugh', answer: '하하하! 당연하지! 너 몫의 잔을 따로 걸어 둘게!' },
        { say: '진짜 고소하다', tier: 'good', remember: 'dawn-milk', face: 'smile', answer: '그치? 이게 내 자랑이야. 소들한테 고맙다고 해 줘!' },
        { say: '너무 일찍이다', tier: 'meh', remember: 'dawn-milk', answer: '하하, 그래도 와 줬잖아! 그게 이긴 거야!' },
      ],
    },
    {
      title: '얼큰한 내기',
      hint: '닐라가 매운탕 얘기를 자꾸 해요. 매운탕 한 그릇을 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'maeuntang', take: true } },
      scene: [
        '매운탕을 내밀자 닐라가 펄쩍 뛴다.',
        '"우와아! 매운탕! 이거 내가 제일 좋아하는 거야! 어떻게 알았어?"',
        '원두막에 마주 앉아 숟가락을 든다. 김이 모락모락 오른다.',
        '"좋아, 내기다! 누가 먼저 땀 흘리나! 지는 쪽이 설거지!"',
        '두 숟갈 만에 그녀 이마에 땀이 맺힌다. 그래도 크게 웃는다.',
      ],
      replies: [
        { say: '네가 졌다! 하하!', tier: 'great', remember: 'stew-night', face: 'laugh', answer: '하하하! 졌는데 왜 이렇게 신나지? 설거지도 웃으면서 할게!' },
        { say: '같이 설거지하자', tier: 'good', remember: 'stew-night', face: 'smile', answer: '오, 그럼 무승부다! 가붕이랑 할 때처럼! 하하!' },
        { say: '너무 매워…', tier: 'meh', remember: 'stew-night', face: 'sorry', answer: '앗, 우유 마셔! 빨리! 매운 데엔 우유가 최고야!' },
      ],
    },
    {
      title: '물결 춤의 비밀',
      hint: '닐라와 물결 춤을 같이 배우면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'dance-wave' },
      scene: [
        '해 질 무렵 개울가. 닐라가 맨발로 물속에 서 있다.',
        '"물결 춤 말이야. 사실 이거 싸우는 법이었어. 바다 건널 때 배운."',
        '"근데 웃으면서 추다 보니까 그냥 춤이 됐어. 신기하지?"',
        '그녀가 손을 내민다. 물방울이 노을에 반짝인다.',
        '"오늘은 겨루지 말고, 그냥 같이 추자. 너랑은 그게 더 좋아."',
      ],
      replies: [
        { say: '손을 잡는다', tier: 'great', face: 'shy', answer: '…하하! 네 손 따뜻하다. 빙글, 그렇지! 우리 박자 딱 맞아!' },
        { say: '발 밟아도 웃기다', tier: 'good', face: 'laugh', answer: '하하하! 밟아도 돼! 그게 이 춤의 규칙이야!' },
        { say: '물이 너무 차가워', tier: 'meh', answer: '하하, 그럼 바위 위에서 추자! 춤은 어디서든 돼!' },
      ],
    },
    {
      title: '이기고 싶지 않은 내기',
      hint: '닐라와 아주 가까워지면 내기 끝에 숨겨 둔 말을 꺼내요. 그 뒤엔 꽃다발도 반길지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '들길 끝 언덕. 닐라가 숨을 몰아쉬며 풀밭에 털썩 눕는다.',
        '"하하… 이번 달리기, 내가 일부러 늦게 뛴 거 알아?"',
        '"이상해. 너랑 내기하면 자꾸 지고 싶어져. 이런 건 처음이야."',
        '그녀가 하늘을 보며 웃는다. 평소보다 조금 작은 웃음이다.',
        '"…꽃이라도 한 다발 받으면, 나 초원 끝까지 소리 지르며 뛸 것 같아."',
      ],
      replies: [
        { say: '그럼 다음엔 들고 올게', tier: 'great', face: 'shy', answer: '…하하하! 진짜? 그럼 나 오늘부터 목청 연습한다!' },
        { say: '다음엔 진짜로 뛰어', tier: 'good', face: 'laugh', answer: '하하! 알았어! 근데 장담은 못 해. 너 앞이면 다리가 풀려!' },
        { say: '숨 좀 돌려', tier: 'meh', face: 'calm', answer: '그래… 오늘은 그냥 하늘 보자. 이것도 좋다.' },
      ],
    },
    {
      title: '가장 큰 모험',
      hint: '닐라와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '밤 목장. 닐라가 울타리에 앉아 먼 바다 쪽을 본다.',
        '"나 바다 건너면서 큰 놈이랑 많이 겨뤘잖아. 다 이겼고."',
        '"근데 지금 제일 떨리는 상대는 너야. 하하, 웃기지?"',
        '"앞으로 모험은 다 너랑 할래. 매일매일, 끝까지!"',
        '그녀가 손가락을 꼼지락거린다. "…반지 같은 건 아직이지만!"',
      ],
      replies: [
        { say: '끝까지 같이 가자', tier: 'great', face: 'laugh', answer: '하하하하! 들었지, 소들아! 오늘은 평생 최고로 기쁜 날이야!' },
        { say: '반지는 내가 준비할게', tier: 'good', face: 'shy', answer: '…진짜? 하하! 그럼 그날까지 팔씨름은 안 할게. 손 다치면 안 되니까!' },
        { say: '천천히 가자', tier: 'meh', face: 'smile', answer: '좋아! 천천히 걷는 것도 모험이야. 너랑이면!' },
      ],
    },
  ],
  after: [
    '오늘 얘기 많이 했다! 내일은 달리기 하자, 하하!',
    '또 왔어? 신난다! 우유 한 잔 들고 가!',
    '소들이 부른다! 또 봐! 다음엔 안 봐줄 거야!',
    '오늘 웃은 만큼 내일 힘 날 거야! 하하하!',
  ],
};
