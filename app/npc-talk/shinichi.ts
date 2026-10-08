// 쿠도 신이치 — 산기슭 점집 천막의 떠돌이 점쟁이, 이십 대 중반 성인 탐정.
// 자신만만한 반말로 운세를 추리처럼 짚는다("범인은… 아니, 오늘 운세는",
// "단서는 결국 한 곳을 가리켜", "답은 하나로 모여"). 홈스 덕후, 전직 축구부,
// 음치, 아마추어 발명품, 검은 코트 무리와 하얀 망토 마술사. 비명이 들리면
// 뛰지만 대개 떨어진 파이. 작아 보이는 건 '변장' 농담으로만, 아이 취급은 없다.
// 원작 대사는 옮기지 않고 말버릇과 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const SHINICHI_TALK: NpcTalkBook = {
  npc: 'shinichi',
  memories: {
    'holmes-fan': '홈스 이야기를 좋아한다고 했어요',
    'spoiler-no': '추리소설은 결말부터 안 본다고 했어요',
    'soccer-yes': '같이 공을 차겠다고 했어요',
    'clue-shoes': '신발 흙으로 동선을 들켰어요',
    'pie-case': '사라진 파이 사건 이야기를 들었어요',
    'assistant': '탐정 조수가 되겠다고 했어요',
    'gadget': '발명품 자랑을 끝까지 들어 줬어요',
    'tone-deaf': '음치 노래를 끝까지 들어 줬어요',
    'black-coat': '검은 코트 무리 이야기를 들었어요',
    'white-cape': '하얀 망토 마술사 이야기를 들었어요',
    'disguise': '변장 이야기를 웃어넘겨 줬어요',
    'one-answer': '답은 결국 하나로 모인다고 했어요',
    'watch-first': '운세보다 관찰을 믿는다고 했어요',
    'forest-dawn': '새벽 숲에서 발자국을 함께 쫓았어요',
    'pie-night': '호박파이를 나눠 먹으며 사건을 풀었어요',
    'taste-heard': '내 취향을 추리 수첩에 적어 뒀대요',
    'outing-talk': '함께 걸은 수사 이야기를 나눴어요',
    'bday-plan': '생일 운세를 미리 봐 주기로 했어요',
  },
  talks: [
    {
      id: 'first-read',
      open: ['{me}, 앉아 봐. 말 안 해도 돼. 왼쪽 신발에 붉은 흙.', '과수원 둑길로 왔지? 자, 맞혔으면 고개만 끄덕여.'],
      replies: [
        { say: '어떻게 알았어?!', tier: 'great', remember: 'clue-shoes', face: 'laugh', answer: '관찰이야. 흙은 거짓말을 안 하거든. 오늘 운세도 이렇게 짚어 줄게.' },
        { say: '틀렸어. 장터 쪽이야', tier: 'good', face: 'think', answer: ['…장터 뒤 화단을 밟았구나. 흙이 같아.', '틀린 게 아니라 반만 맞힌 거야. 반은 인정할게.'] },
        { say: '그냥 운세나 봐 줘', tier: 'meh', face: 'calm', answer: '알았어. 근데 운세도 결국 관찰이야. 손 내밀어 봐.' },
      ],
    },
    {
      id: 'fortune-or-clue',
      open: '{me}, 솔직히 말해 봐. 운세를 믿어, 아니면 눈에 보이는 단서를 믿어?',
      replies: [
        { say: '눈에 보이는 단서!', tier: 'great', remember: 'watch-first', answer: '역시. 내 운세의 비밀이 그거야. 반은 관찰, 반은 직감. 남들한텐 비밀.' },
        { say: '운세도 조금은 믿어', tier: 'good', face: 'smile', answer: '그럼 내가 단서로 받쳐 줄게. 믿는 쪽이 안 다치게.' },
        { say: '둘 다 안 믿어', tier: 'meh', face: 'think', answer: '흠, 의심 많은 손님이네. 좋아, 그런 사람이 탐정 기질이 있어.' },
      ],
    },
    {
      id: 'holmes',
      open: '홈스 읽어 봤어? 안 읽었으면 큰일이야. 인생의 반을 놓친 거라고.',
      replies: [
        { say: '읽었지! 바이올린 장면 좋아', tier: 'great', remember: 'holmes-fan', face: 'wow', answer: '오! 거기서 멈추는 사람 처음 봐. {me}, 너 진짜 좋은 독자야.' },
        { say: '빌려줘. 읽어 볼게', tier: 'good', remember: 'holmes-fan', answer: '좋아, 첫 권부터. 대신 베아트리스한테 결말 묻기 없기다.' },
        { say: '두꺼운 책은 졸려', tier: 'meh', face: 'sorry', answer: '…탐정한테 그건 꽤 아픈 말이야. 짧은 단편부터 골라 줄게.' },
      ],
    },
    {
      id: 'spoiler',
      open: '추리소설 결말부터 펼쳐 보는 사람, 어떻게 생각해? 신중하게 대답해.',
      replies: [
        { say: '그건 범죄야', tier: 'great', remember: 'spoiler-no', face: 'laugh', answer: '하하! 판결 났다. 유죄. 너랑은 같은 책 읽어도 안심이야.' },
        { say: '궁금하면 그럴 수도', tier: 'good', face: 'think', answer: '…이해는 해. 이해만 할게. 내 책으론 하지 마.' },
        { say: '나 그렇게 읽는데', tier: 'meh', face: 'sorry', answer: '자백 감사. 앞으로 내 책장 근처엔 접근 금지야. 농담 반, 진담 반.' },
      ],
    },
    {
      id: 'soccer',
      open: '천막 뒤에 공 하나 있는데. {me}, 운세 끝나면 몇 번 차고 갈래?',
      replies: [
        { say: '좋아, 골키퍼 할게', tier: 'great', remember: 'soccer-yes', answer: '오, 각오해. 예전에 축구부 에이스였거든. 봐주는 거 없다.' },
        { say: '공 차는 거 구경할래', tier: 'good', answer: '관객도 중요해. 박수 소리로 슛 각도가 달라지거든. 진짜야.' },
        { say: '천막 찢어지면 어떡해', tier: 'meh', face: 'think', answer: '…그건 맞는 지적이야. 지난번에 한 번 찢었어. 개울가로 가자.' },
      ],
    },
    {
      id: 'pie-case',
      open: ['이번 주 사건 들을래? 빵집에서 호박파이 하나가 사라졌어.', '현장엔 부스러기, 창틀엔 발자국. 범인은 누굴까?'],
      replies: [
        { say: '창문 열어 둔 사람이 범인!', tier: 'great', remember: 'pie-case', face: 'wow', answer: '날카로운데! 반은 맞아. 범인은 열린 창으로 들어온 너구리였어.' },
        { say: '네가 먹은 거 아니야?', tier: 'good', face: 'laugh', answer: '하하! 탐정을 의심하다니 대담한데. …알리바이는 확실해. 아마.' },
        { say: '파이 하나로 무슨 사건이야', tier: 'meh', face: 'calm', answer: '작은 사건도 사건이야. 이 마을 사건은 대개 이 크기라 다행이지.' },
      ],
    },
    {
      id: 'assistant',
      open: '홈스한텐 늘 곁에서 기록하는 사람이 있었지. {me}, 너 조수 해 볼래?',
      replies: [
        { say: '할게. 수첩부터 살게', tier: 'great', remember: 'assistant', face: 'laugh', answer: '좋아, 오늘부터 정식 조수다. 첫 임무는 내 추리에 감탄하는 거.' },
        { say: '급여는 얼마야?', tier: 'good', face: 'think', answer: '호박파이 한 조각. 사건 해결하면 두 조각. 협상은 안 받아.' },
        { say: '나 바빠', tier: 'meh', answer: '그래, 농사가 먼저지. 자리는 비워 둘게. 마음 바뀌면 말해.' },
      ],
    },
    {
      id: 'gadget',
      open: '이 나비넥타이 봐. 목소리를 바꿔 주는 내 발명품이야. 들어 볼래?',
      replies: [
        { say: '대단하다! 더 보여 줘', tier: 'great', remember: 'gadget', face: 'wow', answer: '그럼 이 안경도. 멀리 있는 게 보여. 운동화는… 천막 밖에서만 시연할게.' },
        { say: '그걸 어디다 써?', tier: 'good', face: 'think', answer: '주로 장난 전화 막는 데. 가끔은 잔나 흉내 내서 예보도 하고.' },
        { say: '터지는 거 아니지?', tier: 'meh', face: 'sorry', answer: '…지난번 건 연기만 났어. 터진 건 아니야. 엄밀히 말하면.' },
      ],
    },
    {
      id: 'sing',
      open: '오늘 기분 좋으니까 노래 한 곡 할까? …표정 보니 소문 들었구나.',
      replies: [
        { say: '불러 봐. 끝까지 들을게', tier: 'great', remember: 'tone-deaf', face: 'shy', answer: ['…좋아. 박자는 정확해. 음은, 음…', '끝까지 들어 준 사람은 네가 처음이야. 증거로 남겨 둘게.'] },
        { say: '추리 이야기가 더 좋아', tier: 'good', face: 'laugh', answer: '하하, 돌려 말하는 법을 아네. 그래, 사건 이야기로 가자.' },
        { say: '귀마개 가져올게', tier: 'meh', face: 'sorry', answer: '…다들 그 말을 해. 음정도 추리처럼 맞히면 좋을 텐데.' },
      ],
    },
    {
      id: 'black-coat',
      open: '평일엔 검은 코트 입은 두 사람을 좀 지켜봐. 별일은 아니고, 수상해서.',
      replies: [
        { say: '조심해. 혼자 다니지 마', tier: 'great', remember: 'black-coat', face: 'smile', answer: '…걱정해 주는 거야? 고마워. 무리는 안 해. 주말엔 꼭 돌아오니까.' },
        { say: '나도 같이 볼래', tier: 'good', remember: 'black-coat', face: 'think', answer: '마음만 받을게. 대신 마을에서 수상한 그림자 보면 알려 줘.' },
        { say: '그냥 옷 취향 아니야?', tier: 'meh', face: 'laugh', answer: '하하, 그럴 수도. 근데 매일 똑같은 건 이상하잖아. 탐정 버릇이야.' },
      ],
    },
    {
      id: 'white-cape',
      open: '하얀 망토 마술사가 또 예고장을 보냈어. 도둑은 내 담당 아니라니까.',
      replies: [
        { say: '이번엔 네가 트릭을 읽어', tier: 'great', remember: 'white-cape', face: 'laugh', answer: '그럴 생각이야. 그 녀석 버릇은 다 적어 뒀거든. 이번엔 내 차례다.' },
        { say: '마술사라니 멋지다', tier: 'good', remember: 'white-cape', face: 'think', answer: '…멋지긴 해. 인정하긴 싫지만. 나한텐 그냥 끈질긴 맞수야.' },
        { say: '그냥 무시해', tier: 'meh', face: 'calm', answer: '그게 안 돼. 수수께끼를 보면 손이 먼저 가거든. 병이야.' },
      ],
    },
    {
      id: 'disguise',
      open: '{me}, 마을에서 내 키가 좀 작아 보이지? 변장이야. 깊게 묻지 마.',
      replies: [
        { say: '변장 실력이 대단하네', tier: 'great', remember: 'disguise', face: 'laugh', answer: '하하, 그치? 안경 하나로 이 정도면 수준급이지. 비밀은 지켜 줘.' },
        { say: '말 안 할게. 탐정 사정이니까', tier: 'good', face: 'smile', answer: '고마워. 너는 묻지 않을 줄 알았어. 그것도 추리였어.' },
        { say: '그 모습이 더 귀엽던데', tier: 'meh', face: 'sorry', answer: '…그 말은 못 들은 걸로 할게. 나는 어엿한 어른 탐정이거든.' },
      ],
    },
    {
      id: 'one-answer',
      when: { ch: 3 },
      open: '단서가 아무리 많아도 결국 한 곳을 가리켜. {me}, 넌 그 말 믿어?',
      replies: [
        { say: '믿어. 답은 하나로 모여', tier: 'great', remember: 'one-answer', face: 'smile', answer: '…좋다. 그럼 요즘 내 단서들이 어디를 가리키는지도 언젠가 말해 줄게.' },
        { say: '가끔은 둘일 수도 있지', tier: 'good', face: 'think', answer: '운세는 가끔 둘이지. 근데 사건은 아니야. 그게 탐정의 고집이야.' },
        { say: '어려운 말이다', tier: 'meh', answer: '하하, 쉽게 말하면 이거야. 끝까지 보면 다 풀린다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비다. 빗길엔 발자국이 선명해. {me}, 머리끝 젖은 거 보니 우산 안 썼지?',
      replies: [
        { say: '들켰다. 빗속 산책했어', tier: 'great', face: 'laugh', answer: '증거 확보. 천막 안으로 들어와. 수건은 탁자 위에 있어.' },
        { say: '추리하기 좋은 날이네', tier: 'good', answer: '그치? 빗소리 들으면 집중력이 두 배야. 오늘은 사건 기록 정리하는 날.' },
        { say: '천막 새는 거 아니야?', tier: 'meh', face: 'sorry', answer: '…왼쪽 구석은 좀 샌다. 그 자리만 피해 앉아.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 위 발자국은 거짓말을 못 해. 오늘 마을 사람들 동선이 다 보여.',
      replies: [
        { say: '내 발자국도 읽어 봐', tier: 'great', face: 'think', answer: '보폭이 넓어. 신나서 뛰어왔네. 범인은… 아니, 눈 온 게 좋은 사람.' },
        { say: '눈사람 만들자', tier: 'good', face: 'smile', answer: '좋아. 코는 당근. 고구마 쓰면 수사 대상이야.' },
        { say: '추워서 빨리 갈래', tier: 'meh', face: 'calm', answer: '그래, 감기는 탐정도 못 막아. 발자국 따라 곧장 집으로 가.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽에 돌아다니는 사람은 둘 중 하나야. 낚시꾼 아니면 범인. 너는?',
      replies: [
        { say: '낚시꾼이지, 당연히', tier: 'great', face: 'laugh', answer: '소매에 미끼 냄새. 알리바이 성립. 좋은 아침이야, {me}.' },
        { say: '그냥 일찍 깼어', tier: 'good', answer: '셋째 경우네. 내 공식이 틀렸어. 수첩에 고쳐 둘게.' },
        { say: '범인이면 어쩔 건데', tier: 'meh', face: 'think', answer: '…그 대답, 수상하네. 오늘 하루 지켜볼 거야. 농담이야.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤엔 운세 안 봐. 대신 홈스 이야기라면 밤새 할 수 있어. 들을래?',
      replies: [
        { say: '좋아. 제일 좋아하는 사건부터', tier: 'great', remember: 'holmes-fan', face: 'wow', answer: '고르기 어렵네… 좋아, 안개 낀 밤 이야기부터 해 줄게. 길어진다?' },
        { say: '한 장만 듣고 갈게', tier: 'good', face: 'laugh', answer: '그 한 장이 늘 세 장 되지. 내가 그래 봐서 알아.' },
        { say: '졸려서 가 볼게', tier: 'meh', face: 'calm', answer: '그래. 밤길엔 발소리 잘 들어. 습관 들이면 좋아.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 오늘은 광장에서 운세 봐 줄게. {me}, 첫 번째 손님 할래?',
      replies: [
        { say: '인연운 봐 줘!', tier: 'great', face: 'shy', answer: '…하필 그걸. 좋아, 오늘 인연운은 아주 가까이 있대. 더는 비밀.' },
        { say: '줄 서는 사람 구경할래', tier: 'good', answer: '그것도 관찰 훈련이야. 표정만 보면 다들 뭘 물을지 보여.' },
        { say: '불꽃놀이 보러 갈래', tier: 'meh', face: 'think', answer: '좋아. 근데 하얀 망토 보이면 바로 알려 줘. 그 녀석 축제 좋아하거든.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me}, 손톱 밑에 미끼 흔적. 오늘 {fish} 낚았지? 맞혔다.',
      replies: [
        { say: '정확해! 어떻게 알았어?', tier: 'great', face: 'laugh', answer: '비늘이 소매에 하나 붙어 있어. 운세에서 낚시운 나왔었지? 내 덕이다.' },
        { say: '냄새로 안 거 아니야?', tier: 'good', face: 'think', answer: '…그것도 단서 중 하나야. 탐정은 오감을 다 써.' },
        { say: '낚시는 그냥 그랬어', tier: 'meh', face: 'calm', answer: '그래도 건졌잖아. 다음 주 운세는 좀 더 좋게 봐 줄게.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '광장이 시끌시끌하던데. 사건인 줄 알고 뛰어갔더니 네 물고기였어!',
      replies: [
        { say: '마을 기록이야!', tier: 'great', face: 'wow', answer: '이건 사건이 아니라 특종이야. 잔나한테 먼저 알려 줘야겠다.' },
        { say: '운이 좋았지', tier: 'good', answer: '운만은 아니야. 찌 보는 눈이 좋아졌어. 그건 내가 증언할 수 있어.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손바닥 굳은살이 새로 생겼네. 오늘 밭일했지? 단서가 너무 쉽다.',
      replies: [
        { say: '수박도 곧 익어!', tier: 'great', face: 'wow', answer: '수박? 그럼 화채다. 익으면 꼭 알려 줘. 이건 탐정의 부탁이야.' },
        { say: '허리가 아파', tier: 'good', face: 'sorry', answer: '앉아. 의자 줄게. 운세는 앉아서 들어도 똑같이 맞아.' },
        { say: '밭 얘긴 그만', tier: 'meh', face: 'calm', answer: '알았어. 그럼 사건 얘기 할까. 오늘은 조용했지만.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me}, 오늘 표정이 반짝여. 금별 작물 나왔지? 내 추리는 틀린 적 없어.',
      replies: [
        { say: '맞아! 보석 같았어', tier: 'great', face: 'laugh', answer: '보석이라니, 내 취향 제대로 아네. 원석만큼 반짝였겠다.' },
        { say: '가끔 틀리잖아', tier: 'good', face: 'laugh', answer: '…노래 음정 말고는 안 틀려. 축하해, {me}.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 어깨가 내려가 있어. 걸음도 무겁고. 오늘은 운세 말고 이야기하자.',
      replies: [
        { say: '좀 지쳤어', tier: 'great', face: 'smile', answer: '그럼 아무것도 추리 안 할게. 그냥 앉아 있어. 그것도 괜찮아.' },
        { say: '들켰네. 괜찮아', tier: 'good', face: 'calm', answer: '괜찮다는 말도 단서야. 다음 주엔 운세 맑음으로 봐 줄게. 약속.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '입꼬리가 올라가 있어. 좋은 일 있었지? 범인은… 아니, 원인을 맞혀 볼게.',
      replies: [
        { say: '맞혀 봐!', tier: 'great', face: 'think', answer: '눈이 반짝, 걸음은 가볍고, 손엔 흙. 일이 잘 풀린 날이네. 맞지?' },
        { say: '비밀이야', tier: 'good', face: 'laugh', answer: '비밀은 탐정을 더 불타게 해. 다음 주까지 꼭 알아낸다.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '오늘 마을 소식 봤어? 기록이 나왔대. 이런 날은 다들 표정이 달라.',
      replies: [
        { say: '현장 보러 가자!', tier: 'great', answer: '좋아, 탐정은 현장이 먼저야. 증인 이야기부터 들어 보자.' },
        { say: '잔나 기사 기다릴래', tier: 'good', face: 'laugh', answer: '그 기사, 반은 맞고 반은 과장일걸. 그래도 재밌긴 해.' },
        { say: '별로 관심 없어', tier: 'meh', face: 'calm', answer: '그래. 큰 소식보다 작은 단서가 더 재밌을 때도 있지.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '결혼식 소식 들었어? 그 둘, 진작 알았어. 눈빛이 다 말해 줬거든.',
      replies: [
        { say: '역시 명탐정!', tier: 'great', face: 'laugh', answer: '하하, 그 정도야 기본이지. …남의 인연은 잘 보이는데 말이야.' },
        { say: '그럼 미리 말해 주지', tier: 'good', face: 'think', answer: '탐정은 확증 전엔 말 안 해. 그게 원칙이야.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '잔나 만났어? 또 내 사건을 기사로 쓴대. 날씨 예보만큼만 맞으면 좋겠는데.',
      replies: [
        { say: '이번 기사 꽤 정확하던데', tier: 'great', face: 'wow', answer: '진짜? 그럼 내가 넘긴 단서가 좋았던 거네. 특종은 서로 주고받는 거야.' },
        { say: '네 사진이 크게 났대', tier: 'good', face: 'shy', answer: '…그건 좀 곤란한데. 탐정은 얼굴이 알려지면 일하기 힘들어.' },
        { say: '기사는 안 읽어', tier: 'meh', face: 'calm', answer: '그래도 날씨란은 봐 둬. 그건 잔나가 잘 맞혀. 가끔.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '볼리바스 순경이랑 이야기했지? 사라진 바구니 사건, 같이 쫓는 중이야.',
      replies: [
        { say: '명콤비네!', tier: 'great', face: 'laugh', answer: '그치? 순경은 발로 뛰고 나는 머리를 쓰고. 콧수염이 떨리면 단서 나온 거야.' },
        { say: '순찰 몰래 도는 거 들켰어?', tier: 'good', face: 'sorry', answer: '…들켰어. 대신 수사 협력으로 봐주기로 했어. 휴.' },
      ],
    },
    {
      id: 'op-makima',
      when: { bond: 'makima' },
      open: '마키마 씨 만났어? 무슨 얘기 했어? 아니, 그냥 궁금해서. 관찰 대상이거든.',
      replies: [
        { say: '그냥 인사만 했어', tier: 'good', face: 'think', answer: '인사만? 그 사람은 인사로도 많은 걸 알아내. 조심해서 나쁠 건 없어.' },
        { say: '너도 관찰당하고 있을걸', tier: 'great', face: 'wow', answer: '…그럴 가능성, 부정 못 하겠다. 서로 관찰하는 사이라니. 흠, 재밌어.' },
        { say: '좋은 사람 같던데', tier: 'meh', face: 'calm', answer: '그럴 수도 있지. 근데 탐정은 끝까지 결론을 미뤄. 그게 일이야.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '베아트리스한테 다녀왔어? 혹시 내가 빌려준 책 결말 말하지 않았지?',
      replies: [
        { say: '안 들었어. 막았어', tier: 'great', face: 'laugh', answer: '고마워, 조수! 그 사람은 결말을 먼저 말하는 게 취미야. 나쁜 의미로.' },
        { say: '범인 이름 들었어…', tier: 'meh', face: 'sorry', answer: '…또야. 그 책은 다른 걸로 빌려줄게. 이번엔 진짜 숨겨 둔다.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '메르시 씨 봤어? 사건 현장마다 그 사람이 있어. 의사랑 탐정은 늘 만나나 봐.',
      replies: [
        { say: '든든한 사이네', tier: 'great', face: 'smile', answer: '맞아. 다친 사람은 메르시 씨가, 사건은 내가. 그게 우리 분업이야.' },
        { say: '너 또 다쳤어?', tier: 'good', face: 'sorry', answer: '…살짝 긁힌 거야. 메르시 씨한테 벌써 혼났으니 너까진 봐줘.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-holmes',
      when: { mem: 'holmes-fan' },
      use: 'holmes-fan',
      open: '{me}, 홈스 좋아한다고 했지? 천막에 다음 권 챙겨 왔어. 너 주려고.',
      replies: [
        { say: '고마워, 아껴 읽을게', tier: 'great', face: 'smile', answer: '다 읽으면 감상 꼭 들려줘. 그게 내 주말 낙이야.' },
        { say: '결말은 말하지 마', tier: 'good', face: 'laugh', answer: '내가? 절대. 그건 베아트리스 전문이야.' },
      ],
    },
    {
      id: 'cb-soccer',
      when: { mem: 'soccer-yes' },
      use: 'soccer-yes',
      open: '골키퍼 한다고 했던 거 기억하지? 오늘 개울가 빈터 비었어. 가자!',
      replies: [
        { say: '이번엔 다 막는다!', tier: 'great', face: 'laugh', answer: '좋아, 그 기세. 근데 내 슛은 각도가 추리야. 못 읽을걸.' },
        { say: '살살 차 줘', tier: 'good', answer: '하하, 알았어. 운동화 출력은 제일 낮게. 약속.' },
      ],
    },
    {
      id: 'cb-pie',
      when: { mem: 'pie-case' },
      use: 'pie-case',
      open: '그 호박파이 사건 말이야. 너구리가 또 왔어. 이번엔 창문 닫아 놨더니 문으로.',
      replies: [
        { say: '범인 꽤 똑똑하네', tier: 'great', face: 'laugh', answer: '그치? 맞수로 인정한다. 다음엔 덫 말고 파이 한 조각 놔두려고.' },
        { say: '문도 닫아', tier: 'good', face: 'think', answer: '…맞는 말이야. 탐정이 자물쇠를 잊다니. 기록에선 빼 줘.' },
      ],
    },
    {
      id: 'cb-black-coat',
      when: { mem: 'black-coat' },
      use: 'black-coat',
      open: '{me}, 걱정해 줬던 그 검은 코트 무리. 이번 주엔 아무 일 없었어. 보고하는 거야.',
      replies: [
        { say: '다행이다. 계속 조심해', tier: 'great', face: 'smile', answer: '응. 누가 기다린다는 걸 아니까 조심하게 되더라. 고마워.' },
        { say: '보고까지 해 줘?', tier: 'good', face: 'shy', answer: '조수한테 보고는 기본이지. …아니, 그냥 말하고 싶었어.' },
      ],
    },
    {
      id: 'cb-white-cape',
      when: { mem: 'white-cape' },
      use: 'white-cape',
      open: '하얀 망토 말이야, 이번엔 트릭을 반쯤 읽었어. 반쯤. 들어 볼래?',
      replies: [
        { say: '반이면 대단해. 들려줘', tier: 'great', face: 'wow', answer: '좋아. 비둘기가 열쇠였어. 나머지 반은 다음 예고장에서 잡는다.' },
        { say: '나머지 반은?', tier: 'good', face: 'sorry', answer: '…그건 묻지 마. 아직 분하니까.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 수첩에 적혀 있었어. 아, 탐정 수첩 말고 마을 수첩.',
      replies: [
        { say: '그것까지 조사했어?', tier: 'great', face: 'laugh', remember: 'taste-heard', answer: '조사는 기본이야. 다음 운세 덤은 그걸로 준비해 둘게.' },
        { say: '네 취향도 알려 줘', tier: 'good', remember: 'taste-heard', answer: '호박파이, 수박화채, 보석 원석. 단서는 공개해 줄게. 너한테만.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번 동행 수사 재밌었어. 네 발밑 보는 눈이 꽤 좋아졌더라, 조수.',
      replies: [
        { say: '다음에도 같이 가자', tier: 'great', face: 'smile', remember: 'outing-talk', answer: '좋아. 다음 코스는 숲 깊은 데야. 추리소설 첫 장 같은 곳.' },
        { say: '네가 너무 빨리 걸어', tier: 'good', face: 'sorry', remember: 'outing-talk', answer: '…단서 보면 발이 먼저 가. 다음엔 네 보폭에 맞출게.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이지? 숨겨도 소용없어. 생일 운세, 내가 미리 봐 둘까?',
      replies: [
        { say: '대길로 부탁해', tier: 'great', face: 'laugh', remember: 'bday-plan', answer: '부탁 안 해도 대길이야. 그날은 호박파이도 내가 산다.' },
        { say: '어떻게 알았어?', tier: 'good', face: 'think', remember: 'bday-plan', answer: '날짜 세는 눈치가 보였거든. 단서는 늘 표정에 있어.' },
      ],
    },
  ],
  chapters: [
    {
      title: '천막의 첫 손님',
      hint: '한 번 이야기를 나누면 신이치가 천막 안 손님 의자를 내줘요.',
      need: { days: 1 },
      scene: [
        '산기슭 천막 안. 신이치가 탁자 위 수정구를 한쪽으로 치운다.',
        '"이건 장식이야. 진짜 도구는 이거지." 그가 돋보기를 든다.',
        '"{me}, 신발, 소매, 손금. 셋 다 봤어. 단서는 결국 한 곳을 가리켜."',
        '"오늘 운세는… 좋은 사람을 만나는 날. 증거는 지금 내 앞에 있고."',
      ],
      replies: [
        { say: '그 좋은 사람이 너야?', tier: 'great', face: 'laugh', answer: '하하, 그 추리는 내가 할 차례였는데. 좋아, 반은 맞아.' },
        { say: '수정구는 왜 있어?', tier: 'good', face: 'think', answer: '손님들이 좋아하거든. 분위기도 단서야. 마음을 열게 하는.' },
        { say: '운세 너무 뻔하다', tier: 'meh', face: 'calm', answer: '뻔한 게 제일 잘 맞아. 다음 주에 확인해 봐.' },
      ],
    },
    {
      title: '새벽 숲의 발자국',
      hint: '새벽(게임 시각 오전 다섯 시부터 아홉 시)에 숲으로 가 보세요. 신이치가 발자국을 쫓고 있대요.',
      need: { days: 3, points: 20, visit: { area: 'woods', from: 5, to: 9 } },
      scene: [
        '새벽 숲. 이슬 젖은 흙 위에 신이치가 무릎을 꿇고 있다.',
        '"쉿. 여기 발자국. 앞발이 깊어. 뭔가 물고 뛰었다는 뜻이야."',
        '두 사람은 발자국을 따라 덤불을 헤친다. 끝에는 작은 굴이 있다.',
        '굴 앞에 바구니 하나. 안에는 잃어버린 털실 뭉치가 가득하다.',
        '"범인은 새끼 여우. 동기는 둥지 꾸미기. 사건 해결이네."',
      ],
      replies: [
        { say: '털실은 두고 가자', tier: 'great', remember: 'forest-dawn', face: 'smile', answer: '…나도 그 말 하려고 했어. 주인한텐 새 털실을 사 주자. 비밀 수사로.' },
        { say: '진짜 탐정 같았어', tier: 'good', remember: 'forest-dawn', face: 'laugh', answer: '같은 게 아니라 진짜야. 근데 칭찬은 고맙게 받을게.' },
        { say: '새벽은 너무 졸려', tier: 'meh', remember: 'forest-dawn', answer: '새벽은 탐정의 시간이야. 흔적이 아직 안 지워졌거든. 다음엔 커피 챙길게.' },
      ],
    },
    {
      title: '호박파이 실종 사건',
      hint: '신이치가 사라진 호박파이 이야기를 했어요. 호박파이 하나를 가지고 천막으로 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'pumpkinpie', take: true } },
      scene: [
        '호박파이를 내밀자 신이치의 손이 멈춘다.',
        '"…잠깐. 이 결이랑 향, 빵집 거 아니지? 네가 직접 구했구나."',
        '그가 파이를 정확히 반으로 가른다. 자를 댄 것처럼 반듯하다.',
        '"이번 주 사건 기록, 마지막 줄은 이렇게 적을게. 파이는 돌아왔다."',
        '"범인은 아직 못 잡았지만 피해자는 행복하다. 완벽한 결말이야."',
      ],
      replies: [
        { say: '반 나눠 먹자', tier: 'great', remember: 'pie-night', face: 'laugh', answer: '그래서 반으로 자른 거야. 너도 먹을 줄 추리했거든.' },
        { say: '내가 범인일지도?', tier: 'good', remember: 'pie-night', face: 'think', answer: '훔친 파이를 돌려주러 온 범인이라… 그럼 정상참작이다. 무죄.' },
        { say: '그냥 다 먹어', tier: 'meh', remember: 'pie-night', face: 'smile', answer: '…그건 안 되지. 같이 먹어야 사건 종결이야.' },
      ],
    },
    {
      title: '조수의 사건 일지',
      hint: '신이치의 조수가 되겠다고 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'assistant' },
      scene: [
        '천막을 닫은 밤. 신이치가 낡은 가죽 수첩을 꺼낸다.',
        '"내 사건 일지야. 아무한테도 안 보여 줬어. 펼쳐 봐."',
        '앞쪽은 빽빽한 추리, 뒤로 갈수록 마을의 작은 사건들이 적혀 있다.',
        '그리고 요즘 쪽마다 한 줄씩, 같은 이름이 나온다. {me}.',
        '"조수 기록란이야. …그렇게 보지 마. 기록은 정확해야 하거든."',
      ],
      replies: [
        { say: '나도 한 줄 써도 돼?', tier: 'great', face: 'shy', answer: '…써. 그 펜, 너 주려고 하나 더 사 뒀어. 이것도 추리였지.' },
        { say: '내 얘기가 왜 이렇게 많아?', tier: 'good', face: 'sorry', answer: '조수니까. 그게 다야. …아마도. 아직 조사 중이야.' },
        { say: '글씨가 작아 안 보여', tier: 'meh', face: 'laugh', answer: '하하, 탐정 안경 빌려줄게. 멀리 있는 것도 잘 보여.' },
      ],
    },
    {
      title: '풀리지 않는 수수께끼',
      hint: '신이치와 아주 가까워지면 그가 아직 못 푼 수수께끼를 털어놔요. 그땐 꽃다발도 단서가 될지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '축제가 끝난 광장. 신이치가 빈 운세 탁자에 기대어 서 있다.',
        '"{me}, 나 지금까지 못 푼 사건이 없었어. 하나만 빼고."',
        '"단서는 다 모였어. 네 웃음, 네가 오는 시간, 내 심장 소리."',
        '"근데 결론을 말하려고 하면 목소리가 안 나와. 발명품도 소용없어."',
        '그가 안경을 고쳐 쓰며 웃는다. 평소보다 자신 없는 웃음이다.',
      ],
      replies: [
        { say: '천천히 풀어도 돼', tier: 'great', face: 'shy', answer: '…고마워. 결정적 증거가 오면 바로 말할게. 꽃 한 다발 같은 거.' },
        { say: '지금 말해 봐!', tier: 'good', face: 'laugh', answer: '하하, 탐정은 확증 전엔 말 안 해. 원칙이야. …조금만 기다려.' },
        { say: '수수께끼 싫어', tier: 'meh', face: 'calm', answer: '그럼 쉬운 걸로 줄게. 다음 주말에도 와 줘. 그게 다야.' },
      ],
    },
    {
      title: '사건 종결',
      hint: '신이치와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '저녁 무렵 뒷산 꼭대기. 마을 동선이 한눈에 보이는 탐정의 전망대다.',
        '"{me}, 사건 일지 마지막 장을 정리했어. 들어 볼래?"',
        '"모든 단서는 한 사람을 가리켰다. 결론은 처음부터 하나였다."',
        '"사건 종결. …근데 이 결론, 평생 다시 확인하고 싶어."',
        '"다음 증거품은 작고 둥근 거면 좋겠다. 손가락에 맞는 걸로."',
      ],
      replies: [
        { say: '평생 확인해', tier: 'great', face: 'laugh', answer: '하하! 판결 났다. 이건 내 인생 최고의 사건이야.' },
        { say: '반지 크기도 추리했어?', tier: 'good', face: 'shy', answer: '…이미 했어. 딱 맞을걸. 근데 그건 네가 가져와 주면 좋겠어.' },
        { say: '아직은 천천히', tier: 'meh', face: 'smile', answer: '좋아. 결론은 안 바뀌니까. 천천히 같이 확인하자.' },
      ],
    },
  ],
  after: [
    '오늘 운세는 다 봤어. 하루 한 번이 제일 잘 맞거든.',
    '또 왔네? 발소리로 알았어. 남은 이야기는 다음 주말에.',
    '사건 일지 정리 중이야. 별일 없었다는 것도 기록해야 하거든.',
    '조심히 가. 단서를 다 모아 봐도 내일은 좋은 날이야.',
  ],
};
