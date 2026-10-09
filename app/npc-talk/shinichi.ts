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
    'museum-case': '박물관 은방울 실종 사건을 함께 맡았어요',
    'legend-fish': '전설의 물고기 목격담을 같이 추리했어요',
    'blue-camellia': '푸른 동백 소문을 같이 쫓기로 했어요',
    'lighthouse': '등대 불빛이 깜빡이는 이유를 궁금해했어요',
    'wait-weekend': '주말마다 기다리겠다고 했어요',
    'father-novel': '추리소설가 아버지 이야기를 들었어요',
    'people-watch': '광장에서 사람 추리 놀이를 했어요',
    'scream-run': '비명이 들리면 같이 뛰겠다고 했어요',
    'lost-box': '천막 분실물 상자를 같이 정리했어요',
    'cipher': '암호 쪽지를 주고받기로 했어요',
    'gem-like': '서로 원석 같다고 말해 줬어요',
    'coffee': '탐정의 쓴 커피를 같이 마셨어요',
    'thresh-ledger': '등불 상점 장부가 수상하다는 데 맞장구쳤어요',
    'partner': '조수 말고 파트너라고 적기로 했어요',
    'date-talk': '방 데이트를 추억으로 두기로 했어요',
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
    {
      id: 'museum-bell',
      open: ['{me}, 사건 파일 하나 펼칠게. 박물관 은방울이 사라졌어.', '유리장은 멀쩡, 자물쇠도 그대로. 남은 건 창틀의 흰 얼룩 하나.'],
      replies: [
        { say: '새가 물어 간 거 아니야?', tier: 'great', remember: 'museum-case', face: 'wow', answer: ['…흰 얼룩이 새 흔적이라면, 말이 돼.', '좋아, {me}. 이 사건 너랑 같이 맡는다. 수첩에 서명해.'] },
        { say: '관장님이 수상해', tier: 'good', face: 'think', answer: ['관장님은 그날 개울에서 낚시 중이었어.', '소매 비늘로 알리바이 성립. 용의자 명단에서 지울게.'] },
        { say: '은방울이 뭔데?', tier: 'meh', face: 'calm', answer: ['손바닥만 한 작은 종이야. 흔들면 맑게 울려.', '모르는 것도 단서야. 일단 박물관부터 같이 가 보자.'] },
      ],
    },
    {
      id: 'legend-fish',
      open: ['전설의 물고기 봤다는 사람이 셋이야. 근데 증언이 다 달라.', '하나는 금빛, 하나는 은빛, 하나는 무지개. 넌 어떻게 봐?'],
      replies: [
        { say: '본 시간이 달랐던 거야!', tier: 'great', remember: 'legend-fish', face: 'wow', answer: ['…아침 해, 한낮, 노을. 비늘이 빛 따라 변한 거구나.', '범인은… 아니, 정답은 햇빛이었네. 너 탐정 재능 있어.'] },
        { say: '한 명은 허풍이겠지', tier: 'good', face: 'think', answer: '그럴 수도. 근데 셋 다 손에 낚싯줄 자국이 있었어. 거짓말은 아니야.' },
        { say: '물고기는 그냥 물고기', tier: 'meh', face: 'calm', answer: '그렇게 말하면 낚시꾼들이 울어. 전설은 지켜 줘야지.' },
      ],
    },
    {
      id: 'blue-camellia',
      open: ['요즘 소문 들었어? 뒷산 어딘가에 푸른 동백이 핀대.', '본 사람은 없고 꽃잎만 하나 돌아다녀. 냄새가 나지, 사건 냄새.'],
      replies: [
        { say: '같이 찾으러 가자', tier: 'great', remember: 'blue-camellia', face: 'laugh', answer: ['그 말 기다렸어. 꽃잎 끝에 붉은 흙이 묻어 있었거든.', '단서는 결국 한 곳을 가리켜. 과수원 위 비탈이야.'] },
        { say: '물감 칠한 장난일걸', tier: 'good', face: 'think', answer: '나도 처음엔 그랬어. 근데 문질러도 안 지워져. 진짜 꽃잎이야.' },
        { say: '꽃엔 관심 없어', tier: 'meh', face: 'calm', answer: '그래, 사건이 꽃만 있는 건 아니니까. 다른 파일 펼칠게.' },
      ],
    },
    {
      id: 'lighthouse',
      open: ['밤마다 등대 불빛이 세 번 깜빡이다 멈춰. 고장은 아니래.', '{me}, 불빛이 신호라면 누가 누구한테 보내는 걸까?'],
      replies: [
        { say: '바다 위 누군가한테?', tier: 'great', remember: 'lighthouse', face: 'wow', answer: ['나도 거기까지 왔어. 다음 주말 밤에 같이 세어 보자.', '신호를 읽으면 사람이 보여. 내가 이 일을 좋아하는 이유야.'] },
        { say: '나방이 가린 거 아니야?', tier: 'good', face: 'laugh', answer: '하하, 그 가능성은 지웠어. 나방은 박자를 못 맞추거든.' },
        { say: '그냥 고장이겠지', tier: 'meh', face: 'sorry', answer: '…탐정한테 그건 제일 재미없는 결말이야. 일단 보류할게.' },
      ],
    },
    {
      id: 'wait-weekend',
      open: ['평일엔 마을에 없잖아. 다른 마을 사건 때문에.', '{me}, 솔직히 말해 줘. 주말까지 기다리는 거, 지루하지 않아?'],
      replies: [
        { say: '기다릴게. 매주라도', tier: 'great', remember: 'wait-weekend', face: 'shy', answer: ['…그 말, 생각보다 크게 들린다.', '좋아. 그럼 나도 매주 꼭 돌아올게. 사건보다 먼저.'] },
        { say: '편지라도 보내 줘', tier: 'good', face: 'smile', answer: '암호로 써도 돼? 하하, 농담. 짧게라도 꼭 보낼게.' },
        { say: '바쁘면 안 와도 돼', tier: 'meh', face: 'sorry', answer: '…그래. 근데 나는 오고 싶어서 오는 거야. 그건 알아 둬.' },
      ],
    },
    {
      id: 'father-novel',
      open: '우리 아버지는 추리소설을 써. 그래서 집에 결말 원고가 굴러다녔지.',
      replies: [
        { say: '그래서 결말부터가 싫구나', tier: 'great', remember: 'father-novel', face: 'laugh', answer: ['정답. 어릴 때 원고 훔쳐보다 크게 혼났거든.', '그 뒤로 결말은 내 손으로 찾기로 했어. 탐정의 시작이야.'] },
        { say: '원고 몰래 읽어 봤어?', tier: 'good', face: 'think', answer: '…딱 한 번. 범인 이름이 나랑 같았어. 지금 생각해도 수상해.' },
        { say: '나도 소설 쓸래', tier: 'meh', face: 'smile', answer: '좋지. 첫 독자는 나로 해 줘. 결말 쪽은 손으로 가리고 읽을게.' },
      ],
    },
    {
      id: 'people-watch',
      open: ['광장 의자에 앉아서 놀이 하나 하자. 지나가는 사람 추리하기.', '저기 앞치마에 밀가루. 자, {me}, 어디서 오는 길일까?'],
      replies: [
        { say: '빵집에서 반죽하다 나왔어', tier: 'great', remember: 'people-watch', face: 'laugh', answer: ['정답에 가까워. 손등 계핏가루까지 보면 만점이야.', '너 관찰력 늘었다. 조수 수업 효과가 나오네.'] },
        { say: '요리 좋아하는 사람?', tier: 'good', face: 'smile', answer: '틀린 말은 아니야. 추리는 정답보다 이유가 중요해.' },
        { say: '남 보는 건 실례 같아', tier: 'meh', face: 'think', answer: '…맞는 말이야. 그래서 보기만 하고 입은 닫아. 탐정의 예의지.' },
      ],
    },
    {
      id: 'scream-run',
      open: ['아까 시장에서 비명 들렸지? 나 또 뛰었어.', '…현장엔 떨어진 파이 하나. 주인이 울고 있었어. 사건은 사건이야.'],
      replies: [
        { say: '다음엔 나도 같이 뛸게', tier: 'great', remember: 'scream-run', face: 'laugh', answer: ['좋아. 둘이 뛰면 파이가 떨어지기 전에 받을지도 몰라.', '진지하게, 이 버릇 이해해 주는 사람 드물어. 고마워.'] },
        { say: '파이 주인은 괜찮았어?', tier: 'good', face: 'smile', answer: '새 파이를 반값에 샀대. 범인은 바람이라 체포는 못 했어.' },
        { say: '좀 천천히 다녀', tier: 'meh', face: 'sorry', answer: '…메르시 씨도 그 말 했어. 내 무릎이 증거래.' },
      ],
    },
    {
      id: 'lost-box',
      open: ['천막 뒤에 분실물 상자 있어. 장갑, 열쇠, 단추 하나.', '주인 찾는 게 은근 재밌어. {me}, 같이 정리해 볼래?'],
      replies: [
        { say: '열쇠 주인부터 찾자', tier: 'great', remember: 'lost-box', face: 'wow', answer: ['좋아. 녹 색깔 보니 항구 쪽 창고 열쇠야.', '오늘 안에 주인 찾는다. 조수랑 하면 반나절이면 돼.'] },
        { say: '단추가 예쁘다', tier: 'good', face: 'think', answer: '놋쇠 단추야. 대장간 앞치마에서 떨어진 것 같아. 은근 단서야.' },
        { say: '그냥 버리면 안 돼?', tier: 'meh', face: 'calm', answer: '안 돼. 잃어버린 건 누군가한텐 소중해. 그게 내 원칙이야.' },
      ],
    },
    {
      id: 'dislikes',
      open: '{me}, 비밀 하나. 나 달팽이랑 매미는 좀 그래. 왜인지 맞혀 봐.',
      replies: [
        { say: '소리랑 끈적임 때문?', tier: 'great', face: 'laugh', answer: ['정답. 매미는 집중을 깨고, 달팽이는… 그냥 그래.', '탐정에게도 약점은 있어. 너한테만 알려 준 거야.'] },
        { say: '탐정도 무서운 게 있구나', tier: 'good', face: 'shy', answer: '무서운 게 아니라 안 맞는 거야. 차이가 커. 아주 커.' },
        { say: '선물로 줘야지', tier: 'meh', face: 'sorry', answer: '…그건 범행 예고로 받아들일게. 하지 마. 진짜로.' },
      ],
    },
    {
      id: 'gem-stone',
      open: ['이거 봐. 광산에서 나온 원석이야. 겉은 돌인데 깨면 반짝여.', '사람도 비슷해. 겉만 보면 아무것도 모르지.'],
      replies: [
        { say: '너도 원석 같아', tier: 'great', remember: 'gem-like', face: 'shy', answer: ['…그런 말은 반칙이야. 증거로 남겨 둘게.', '대신 너도 원석이야. 주말마다 조금씩 더 반짝이거든.'] },
        { say: '대장간에서 골랐어?', tier: 'good', face: 'think', answer: '오른 씨가 골라 줬어. 원석 보는 눈은 그 사람이 진짜야.' },
        { say: '돌은 돌이지', tier: 'meh', face: 'calm', answer: '돌이라고 다 같지는 않아. 그걸 가려내는 게 내 일이야.' },
      ],
    },
    {
      id: 'cipher',
      open: ['{me}, 쪽지 하나 줄게. 암호야. 풀면 내일 운세가 나와.', '힌트는 하나. 줄마다 첫 글자만 읽어.'],
      replies: [
        { say: '풀었다! 대길이네!', tier: 'great', remember: 'cipher', face: 'laugh', answer: ['하하, 빨랐어. 다음 쪽지는 더 어렵게 만든다.', '우리끼리만 아는 암호, 하나쯤 있어도 좋잖아.'] },
        { say: '힌트 하나만 더', tier: 'good', remember: 'cipher', face: 'smile', answer: '좋아. 거꾸로 읽어 봐. …아, 이건 힌트가 너무 컸다.' },
        { say: '그냥 말로 해 줘', tier: 'meh', face: 'calm', answer: '재미없는 손님이네. 좋아, 내일 운세는 맑음. 끝.' },
      ],
    },
    {
      id: 'bad-fortune',
      open: '나쁜 운세가 나오면 내가 어떻게 할 것 같아? 그대로 말할까, 돌려 말할까?',
      replies: [
        { say: '조심할 점으로 바꿔 말해', tier: 'great', face: 'smile', answer: ['맞아. 나쁜 운세는 경고일 뿐이야. 판결이 아니거든.', '단서는 사람을 겁주려고 있는 게 아니야. 지키려고 있지.'] },
        { say: '그대로 말해야 정직하지', tier: 'good', face: 'think', answer: '정직은 중요해. 근데 말하는 방법도 추리만큼 중요해.' },
        { say: '좋은 것만 말해', tier: 'meh', face: 'sorry', answer: '그건 거짓말이 돼. 탐정은 거짓말로 사람을 안 달래.' },
      ],
    },
    {
      id: 'coffee',
      open: ['천막 뒤 주전자에 커피 있어. 쓴맛 진하게.', '머리 쓰는 날엔 이게 필요해. {me}, 한 잔 할래?'],
      replies: [
        { say: '진하게 줘', tier: 'great', remember: 'coffee', face: 'laugh', answer: '오, 탐정 체질이네. 같이 마시면 추리가 반 시간은 빨라져.' },
        { say: '설탕 많이 넣어 줘', tier: 'good', remember: 'coffee', face: 'smile', answer: ['좋아, 세 숟갈. 단 걸 좋아한다는 건 수첩에 적어 둘게.', '다음 잔부터는 말 안 해도 세 숟갈이야. 탐정은 안 잊어.'] },
        { say: '커피는 못 마셔', tier: 'meh', face: 'calm', answer: '그럼 보리차. 탐정은 손님 잔을 비워 두지 않아.' },
      ],
    },
    {
      id: 'thresh-ledger',
      open: ['등불 상점 쓰레쉬 씨 장부 말이야. 글씨가 너무 반듯해.', '사람이 쓴 장부치곤 흠이 없어. 수상하지 않아?'],
      replies: [
        { say: '흠 없는 게 더 수상해', tier: 'great', remember: 'thresh-ledger', face: 'think', answer: ['그치? 흠 없는 기록일수록 뒤를 봐야 해.', '…너무 열심히 보다가 쓰레쉬 씨랑 눈이 마주쳤어. 웃더라.'] },
        { say: '장사꾼은 원래 꼼꼼해', tier: 'good', face: 'smile', answer: '그것도 맞아. 일단 의심만 해 둘게. 탐정은 의심이 취미야.' },
        { say: '남의 장부를 왜 봐', tier: 'meh', face: 'sorry', answer: '…맞는 지적. 계산대 위에 펼쳐져 있었어. 안 보기가 더 어려웠어.' },
      ],
    },
    {
      id: 'muzan-age',
      open: '은행 지점장 말이야. 손등은 젊은데 말투는 몇백 년 산 사람 같아.',
      replies: [
        { say: '나이 추리해 봐', tier: 'great', face: 'laugh', answer: ['해 봤지. 결론은… 영업 비밀이래. 정면으로 막혔어.', '그래도 언젠가 맞힌다. 미제로 남기긴 싫거든.'] },
        { say: '안 건드리는 게 좋아', tier: 'good', face: 'think', answer: '…그 사람 눈빛 보면 네 말이 맞아. 관찰은 멀리서만 할게.' },
        { say: '그냥 동안인가 봐', tier: 'meh', face: 'calm', answer: '동안이라는 결론은 탐정한테 패배야. 보류할게.' },
      ],
    },
    {
      id: 'hwachae',
      open: '수박화채는 추리 같아. 국물 맛만 봐도 누가 만들었는지 보이거든.',
      replies: [
        { say: '내 것도 맞혀 봐', tier: 'great', face: 'laugh', answer: ['좋아. 얼음이 크고 수박이 반듯하면 너야. 성실한 손이거든.', '다음에 들고 와. 맞히면 한 그릇 더 먹는 걸로.'] },
        { say: '여름엔 화채가 최고지', tier: 'good', face: 'smile', answer: '그치? 화채 앞에선 사건도 잠깐 쉬어 가.' },
        { say: '단 건 별로야', tier: 'meh', face: 'calm', answer: '그럼 수박만 썰어 줄게. 취향도 단서니까.' },
      ],
    },
    {
      id: 'partner-word',
      when: { love: 'dating' },
      open: ['{me}, 요즘 사건 일지에 조수라고 쓰다가 자꾸 펜이 멈춰.', '맞는 말이 따로 있는 것 같아서. 뭐라고 쓰면 좋을까?'],
      replies: [
        { say: '파트너라고 써', tier: 'great', remember: 'partner', face: 'shy', answer: ['…파트너. 좋다. 그 단어, 오늘부터 고정이야.', '앞으로 결론은 둘이서 내는 거다. 약속.'] },
        { say: '그냥 내 이름으로 써', tier: 'good', face: 'smile', answer: '그것도 좋네. 네 이름이 제일 정확한 기록이야.' },
        { say: '조수가 편해', tier: 'meh', face: 'laugh', answer: '하하, 그래. 그럼 조수 겸, 내 제일 소중한 증인으로.' },
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
      open: ['오늘의 사건 파일. 마을 소식에 기록이 떴어.', '이런 날은 다들 표정이 달라. 증인 찾기 쉬운 날이지.'],
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
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: ['사건 파일 도착. 오늘 마을 소식에 전설이 떴어.', '{me}, 증인 진술부터 받자. 직접 봤어, 아니면 소문이야?'],
      replies: [
        { say: '물 위로 뛰는 걸 봤어!', tier: 'great', face: 'wow', answer: ['…진짜? 눈동자가 아직 반짝여. 그게 증거야.', '사건 일지 첫 장 갱신이다. 비늘 색까지 자세히 말해 줘.'] },
        { say: '소문만 들었어', tier: 'good', face: 'think', answer: '그럼 같이 확인하자. 소문은 세 번 거르면 사실만 남아.' },
        { say: '전설은 믿기 어려워', tier: 'meh', face: 'calm', answer: '의심도 좋은 수사 태도야. 증거가 나오면 그때 놀라.' },
      ],
    },
    {
      id: 'op-museum',
      when: { news: 'museum' },
      open: ['박물관 소식 봤어? 새 유물이 들어왔대.', '전시장은 사건 현장 같아. 물건마다 숨은 이야기가 있거든.'],
      replies: [
        { say: '같이 보러 가자', tier: 'great', face: 'laugh', answer: '좋아. 유리장 앞에서 내가 해설해 줄게. 반은 추리야.' },
        { say: '은방울 사건 생각나', tier: 'good', face: 'think', answer: ['나도. 이번 건 유리장 자물쇠부터 확인했어.', '창문도 닫혀 있더라. 날개 달린 용의자 대비 완료.'] },
        { say: '박물관은 지루해', tier: 'meh', face: 'sorry', answer: '…지루한 게 아니라 조용한 거야. 단서가 속삭이는 곳이지.' },
      ],
    },
    {
      id: 'op-recent-museum',
      when: { recent: 'museum' },
      open: '{me}, 손끝에 먼지 털린 자국. 박물관에 뭘 기증했구나. 그치?',
      replies: [
        { say: '맞아! 보러 와 줘', tier: 'great', face: 'laugh', answer: ['당연하지. 기증자 이름표부터 확인할 거야.', '네 이름 옆에 내 감상 쪽지 붙여도 돼? 반은 농담.'] },
        { say: '어떻게 또 알았어', tier: 'good', face: 'wow', answer: '먼지 결이 고와. 유리장 먼지는 장터 먼지랑 달라.' },
      ],
    },
    {
      id: 'op-friend-wedding',
      when: { friendNews: 'wedding' },
      open: ['또 결혼 소식이야. 이번엔 네 친구네.', '사건 파일에 적어 둘게. 진작 눈치챈 사람 명단에 나 하나 추가.'],
      replies: [
        { say: '어떻게 눈치챘어?', tier: 'great', face: 'think', answer: ['둘이 같은 꽃집 리본을 달고 다녔어.', '증거는 작은 데 숨어. 축하 인사는 네가 대신 전해 줘.'] },
        { say: '부럽다', tier: 'good', face: 'shy', answer: '…그 말은 사건 일지 말고 내 기억에만 적어 둘게.' },
        { say: '결혼은 아직 멀었지', tier: 'meh', face: 'calm', answer: '그래, 결론은 서두르면 틀려. 사건도 그래.' },
      ],
    },
    {
      id: 'op-friend-record',
      when: { friendNews: 'record' },
      open: '네 친구가 기록을 냈더라. 현장 증언 들으러 갈래? 아니, 축하하러.',
      replies: [
        { say: '같이 축하하러 가자', tier: 'great', face: 'laugh', answer: '좋아. 축하가 먼저, 추리는 그다음. 오늘만 순서 바꾼다.' },
        { say: '나도 질 수 없지', tier: 'good', face: 'wow', answer: ['오, 경쟁심. 그 눈빛 좋은데.', '다음 기록 운세는 내가 미리 봐 줄게. 덤으로.'] },
      ],
    },
    {
      id: 'op-friend-legend',
      when: { friendNews: 'legend' },
      open: ['네 친구가 전설을 만났대. 오늘 사건 파일은 그걸로 꽉 찼어.', '{me}, 질투 나? 표정에 살짝 쓰여 있는데.'],
      replies: [
        { say: '조금. 나도 만날 거야', tier: 'great', face: 'laugh', answer: '좋아, 정직한 증언이야. 다음 전설은 네 차례로 추리해 둘게.' },
        { say: '친구가 잘돼서 좋아', tier: 'good', face: 'smile', answer: '그 말이 제일 멋있다. 운세 덤으로 행운 하나 더 얹어 줄게.' },
      ],
    },
    {
      id: 'op-birthday-news',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 사람이 있대. 누군지는 소식 보기 전에 맞혔어.',
      replies: [
        { say: '어떻게 알았어?', tier: 'great', face: 'think', answer: ['빵집엔 큰 케이크 주문, 꽃집엔 리본 품절.', '단서는 결국 한 곳을 가리켜. 축하는 같이 하자.'] },
        { say: '선물 같이 고르자', tier: 'good', face: 'smile', answer: '좋아. 받는 사람 취향은 내가 추리할게. 포장은 네가 해.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '{me}, 얼굴이 바닷바람에 탔네. 먼바다 다녀왔지? 배 위 사건은 없었어?',
      replies: [
        { say: '없었어. 평화로웠어', tier: 'great', face: 'smile', answer: '다행이다. 배는 밀실이라 늘 걱정돼. 무사히 와서 좋아.' },
        { say: '파도 때문에 멀미했어', tier: 'good', face: 'sorry', answer: '앉아. 생강차 줄게. 탐정식 응급 처치야.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '주머니가 불룩한데. {me}, 홀에서 이겼구나. 금전운이 맞았네.',
      replies: [
        { say: '네 운세 덕이야', tier: 'great', face: 'laugh', answer: '하하, 수수료는 호박파이 한 조각. 그리고 오늘은 거기서 멈춰.' },
        { say: '실력이었어', tier: 'good', face: 'think', answer: '…그렇다고 해 두자. 근데 판은 늘 집이 이기게 짜여 있어.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: ['걸음이 무겁네. 홀에서 잃었구나.', '괜찮아. 다만 오늘은 거기 다시 가지 마. 탐정의 부탁이야.'],
      replies: [
        { say: '운세부터 볼걸', tier: 'great', face: 'smile', answer: '그치? 다음엔 천막 먼저 들러. 운세 덤으로 경고도 줄게.' },
        { say: '그냥 재미로 했어', tier: 'good', face: 'calm', answer: '그런 마음이면 괜찮아. 놀이는 놀이로 끝내야지.' },
        { say: '다시 가서 되찾을래', tier: 'meh', face: 'sorry', answer: '…잃은 걸 쫓으면 더 잃어. 그건 추리가 아니라 경험이야.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '{me}, 입꼬리가 그래프처럼 올라갔네. 증권에서 벌었지?',
      replies: [
        { say: '맞아! 금전운 적중', tier: 'great', face: 'laugh', answer: '역시 내 운세. 근데 이럴 때 제일 조심해야 해. 기록해 둬.' },
        { say: '조금 벌었어', tier: 'good', face: 'smile', answer: '조금이 쌓이면 큰 거야. 사건 단서처럼.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '한숨이 세 번. 주식 떨어졌구나. 표정이 다 말해 줘.',
      replies: [
        { say: '위로해 줘', tier: 'great', face: 'smile', answer: ['좋아. 추리소설 한 권 빌려줄게.', '책 덮을 때쯤엔 그래프도 고개를 들 거야. 운세가 그래.'] },
        { say: '다음엔 오를 거야', tier: 'good', face: 'think', answer: '그 마음가짐 좋아. 단서는 늘 다음 장에 있어.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '맑다! 그림자 짧은 날엔 숨을 데가 없어. 수사하기 딱이야.',
      replies: [
        { say: '공 차러 가자!', tier: 'great', face: 'laugh', answer: '바로 그거야. 손님 끊기면 개울가로 뛴다. 골대는 네가 맡아.' },
        { say: '오늘 운세는?', tier: 'good', face: 'smile', answer: '맑음. 너한테만 덤으로, 좋은 소식 하나가 따라온대.' },
        { say: '더워서 싫어', tier: 'meh', face: 'calm', answer: '그럼 천막 그늘로 와. 수박화채 있으면 최고인데.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날엔 그림자가 없어서 단서가 숨어. 오늘은 눈을 더 크게 떠.',
      replies: [
        { say: '같이 찾아볼까?', tier: 'great', face: 'think', answer: ['좋아. 오늘 사건은 사라진 장바구니야.', '시장 골목부터 가 보자. 대개 다른 가게 앞에 있거든.'] },
        { say: '흐린 날 운세는?', tier: 'good', face: 'smile', answer: '조심조심, 그래도 맑음 쪽. 구름 뒤엔 해가 있거든.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: ['해 질 녘엔 그림자가 길어져. 거짓말이 숨기 좋은 시간이야.', '{me}, 오늘 본 운세 맞았는지 확인하는 중이야. 네 것도 맞았어?'],
      replies: [
        { say: '응, 딱 맞았어', tier: 'great', face: 'laugh', answer: '역시. 오늘 적중 기록 갱신이다. 네 덕이야.' },
        { say: '반만 맞았어', tier: 'good', face: 'think', answer: '반이면 충분해. 나머지 반은 네가 만든 거니까.' },
        { say: '안 맞았던데', tier: 'meh', face: 'sorry', answer: '…그럼 정직하게 적을게. 틀린 기록도 기록이야.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이야. 호박파이 철이자 파이 실종 사건 철이지. 올해도 바빠.',
      replies: [
        { say: '파이 지키러 가자', tier: 'great', face: 'laugh', answer: '좋아, 빵집 창문 순찰조 결성. 대가는 파이 한 조각.' },
        { say: '범인은 또 너구리?', tier: 'good', face: 'think', answer: '용의자 일 순위야. 근데 올해는 까치도 수상해. 반짝이를 물어 가거든.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: ['여름엔 매미 소리 때문에 추리가 흐려져.', '{me}, 매미 좀 조용히 시켜 줄 수 있어? …농담이야. 반쯤.'],
      replies: [
        { say: '화채 먹으며 버티자', tier: 'great', face: 'laugh', answer: '그게 정답이야. 차가운 화채 앞에선 매미도 용서돼.' },
        { say: '매미 싫어하는구나', tier: 'good', face: 'shy', answer: '…들켰다. 탐정의 약점이야. 남들한텐 비밀로.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '등불 상점 다녀왔지? 손에 등유 냄새. 쓰레쉬 씨 장부 혹시 봤어?',
      replies: [
        { say: '흘끗 봤어', tier: 'great', face: 'think', answer: ['그래서, 반듯했지? 너무 반듯했지?', '…내 의심이 지나친가. 아니, 탐정한텐 딱 적당해.'] },
        { say: '남의 장부는 안 봐', tier: 'good', face: 'smile', answer: '훌륭한 태도야. 나도 배워야 하는데. 눈이 먼저 가.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '은행 지점장이랑 이야기했어? 그 사람 나이, 혹시 힌트라도 들었어?',
      replies: [
        { say: '영업 비밀이래', tier: 'great', face: 'laugh', answer: '하하, 나한테도 똑같이 말했어. 그 일관성이 단서야.' },
        { say: '물어볼 엄두가 안 나', tier: 'good', face: 'think', answer: '현명해. 그 눈빛 앞에선 탐정도 잠깐 쉬어 가.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['{other} 일 들었어. 서먹한 건 사건보다 풀기 어려워.', '이럴 땐 누가 틀렸는지보다 왜 엇갈렸는지를 봐야 해.'],
      replies: [
        { say: '화해 좀 도와줄래?', tier: 'great', face: 'smile', answer: '좋아. 오해의 실마리부터 찾자. 대개 말 한마디가 범인이야.' },
        { say: '두면 풀리겠지', tier: 'good', face: 'calm', answer: '그것도 방법이야. 시간도 꽤 훌륭한 탐정이거든.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['{me}, 생일이지? 추리할 필요도 없어. 얼굴이 이미 말해 줘.', '오늘 운세는 볼 것도 없이 대길. 증거는 이 호박파이고.'],
      replies: [
        { say: '파이까지 준비했어?', tier: 'great', face: 'wow', answer: ['당연하지. 일주일 전부터 날짜에 동그라미 쳐 놨어.', '생일 축하해, {me}. 오늘은 사건 없이 너만 볼게.'] },
        { say: '고마워, 신이치', tier: 'good', face: 'shy', answer: '…이름 불러 주니까 이상하게 쑥스럽다. 축하해.' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: ['마침 잘 왔어. 지금 잔나랑 특종 회의 중이야.', '{me}, 증인으로 한마디 해 줘. 이번 주 마을 최대 사건은?'],
      replies: [
        { say: '사라진 은방울!', tier: 'great', face: 'wow', answer: ['역시 내 조수. 잔나, 일 면 비워 둬.', '…범인을 아직 모른다는 건 작은 글씨로 부탁해.'] },
        { say: '전설의 물고기!', tier: 'good', face: 'laugh', answer: '그것도 특종이지. 잔나 표정 봐, 벌써 제목 쓰고 있어.' },
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
    {
      id: 'cb-museum',
      when: { mem: 'museum-case' },
      use: 'museum-case',
      open: ['{me}, 은방울 사건 진척 보고. 창틀 얼룩, 역시 새였어.', '흰 깃털에 검은 끝. 용의자가 좁혀지는 중이야.'],
      replies: [
        { say: '까치 아니야?', tier: 'great', face: 'wow', answer: ['…내가 말하려던 걸 먼저 말했네.', '파트너… 아니, 조수 실력이 쑥쑥 느는데.'] },
        { say: '계속 같이 쫓자', tier: 'good', face: 'smile', answer: '물론. 이 사건은 처음부터 둘이 맡은 거야.' },
      ],
    },
    {
      id: 'cb-legend',
      when: { mem: 'legend-fish' },
      use: 'legend-fish',
      open: ['햇빛 따라 비늘 색이 바뀐다던 네 추리 말이야.', '어부들한테 말했더니 다들 무릎을 치더라.'],
      replies: [
        { say: '내 추리 맞았네!', tier: 'great', face: 'laugh', answer: '응, 공로는 네 거야. 사건 일지에 네 이름으로 적었어.' },
        { say: '네가 말해서 믿은 거지', tier: 'good', face: 'shy', answer: '…그럴 수도. 근데 시작은 너였어. 그건 정확히 적을게.' },
      ],
    },
    {
      id: 'cb-camellia',
      when: { mem: 'blue-camellia' },
      use: 'blue-camellia',
      open: ['푸른 동백 말이야. 과수원 위 비탈에서 꽃봉오리를 찾았어.', '아직 안 폈어. 피는 날 제일 먼저 너한테 알려 줄게.'],
      replies: [
        { say: '피면 같이 보러 가자', tier: 'great', face: 'shy', answer: '약속이야. 그날은 운세 천막도 닫는다.' },
        { say: '꽃잎 주인 찾았네', tier: 'good', face: 'laugh', answer: '반쯤. 진짜 결말은 꽃이 펴야 나와. 결말부터 보기는 금지잖아.' },
      ],
    },
    {
      id: 'cb-lighthouse',
      when: { mem: 'lighthouse' },
      use: 'lighthouse',
      open: ['등대 불빛 수수께끼, 풀었어. 먼바다 어부들한테 보내는 인사래.', '세 번은 잘 자라는 뜻. 사건이 이렇게 따뜻하게 끝나다니.'],
      replies: [
        { say: '따뜻한 결말이네', tier: 'great', face: 'smile', answer: '응. 이런 결말이면 미리 알아도 괜찮겠다. 농담이야.' },
        { say: '우리도 신호 정하자', tier: 'good', face: 'shy', answer: '…좋아. 천막 등불 두 번은 들어와도 된다는 뜻. 기억해.' },
      ],
    },
    {
      id: 'cb-wait',
      when: { mem: 'wait-weekend' },
      use: 'wait-weekend',
      open: ['{me}, 이번 주도 돌아왔어. 기다려 준다고 했잖아.', '평일 사건 현장에서도 그 말이 자꾸 생각나더라.'],
      replies: [
        { say: '어서 와. 기다렸어', tier: 'great', face: 'shy', answer: '…응. 다녀왔어. 이 말 하려고 서둘렀어.' },
        { say: '사건은 잘 풀렸어?', tier: 'good', face: 'smile', answer: '물론. 근데 마을로 오는 길이 더 빨랐어. 이유는 추리해 봐.' },
      ],
    },
    {
      id: 'cb-gadget',
      when: { mem: 'gadget' },
      use: 'gadget',
      open: '내 발명품 자랑 끝까지 들어 줬지? 그래서 새 거 첫 시연은 너야. 탐정 손목시계.',
      replies: [
        { say: '와, 뭐가 나와?', tier: 'great', face: 'wow', answer: ['불빛이 나와. 그게 다야. …지금은.', '다음 주엔 바늘도 돌 거야. 아마.'] },
        { say: '이번엔 안 터지지?', tier: 'good', face: 'laugh', answer: '연기만 조금. 이번엔 진짜 조금이야.' },
      ],
    },
    {
      id: 'cb-tone',
      when: { mem: 'tone-deaf' },
      use: 'tone-deaf',
      open: '내 노래 끝까지 들어 준 사람, 너 하나야. 그래서 연습했어. 다시 들어 볼래?',
      replies: [
        { say: '좋아, 끝까지 들을게', tier: 'great', face: 'shy', answer: ['…고마워. 박자는 정확해. 음은… 음.', '네가 웃으면서 들어 주니까 그걸로 됐어.'] },
        { say: '연습 효과 있어?', tier: 'good', face: 'laugh', answer: '개울가 개구리들이 조용해졌어. 감동했거나 도망갔거나.' },
      ],
    },
    {
      id: 'cb-cipher',
      when: { mem: 'cipher' },
      use: 'cipher',
      open: ['{me}, 오늘 쪽지 가져왔어. 이번엔 어려운 암호야.', '힌트는 없어. 우리가 처음 만난 장소를 생각해 봐.'],
      replies: [
        { say: '천막이다!', tier: 'great', face: 'laugh', answer: '정답. 풀이는 "다음 주말에도 와". 그게 이번 주 운세야.' },
        { say: '모르겠어, 알려 줘', tier: 'good', face: 'shy', answer: '…"다음 주말에도 와". 말로 하니까 좀 쑥스럽네.' },
      ],
    },
    {
      id: 'cb-disguise',
      when: { mem: 'disguise' },
      use: 'disguise',
      open: '변장 이야기 웃어넘겨 줘서 고마웠어. 이번 주엔 모자까지 썼는데, 알아봤어?',
      replies: [
        { say: '전혀 못 알아봤어', tier: 'great', face: 'laugh', answer: '하하, 그럼 성공이다. 근데 넌 발소리로 알아볼 줄 알았는데.' },
        { say: '안경 보고 바로 알았지', tier: 'good', face: 'think', answer: '…안경이 문제였구나. 다음엔 안경까지 바꾼다.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '{me}, 네 방에서 보낸 시간 말이야. 사건 일지에 쓰려다 안 썼어.',
      replies: [
        { say: '왜 안 썼어?', tier: 'great', face: 'shy', remember: 'date-talk', answer: ['기록하면 사건이 되잖아. 그건 그냥 추억으로 두고 싶었어.', '…탐정이 기록을 안 하다니. 이상하지?'] },
        { say: '나도 좋았어', tier: 'good', face: 'smile', remember: 'date-talk', answer: '그 증언이면 충분해. 다음에도 초대해 줘.' },
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
        '천막 기둥엔 쪽지가 빼곡하다. 맨 위에 굵은 글씨가 보인다.',
        '반짝이 실종 사건. 박물관 은방울, 놋쇠 단추, 잔나의 렌즈 뚜껑.',
        '"요즘 마을에서 반짝이는 것만 사라져. 크기는 작고, 범인은 조용해."',
        '"평일엔 내가 마을 밖이라 눈이 모자라. 주말 사이 본 게 있으면 알려 줘."',
        '"임시 조수야. 수당은 호박파이 한 조각. 운세는 덤이고."',
      ],
      replies: [
        { say: '그 좋은 사람이 너야?', tier: 'great', face: 'laugh', answer: ['하하, 그 추리는 내가 할 차례였는데.', '좋아, 반은 맞아. 나머지 반은 같이 사건 풀면서 확인하자.'] },
        { say: '임시 조수, 해 볼게', tier: 'good', face: 'smile', answer: '계약 성립. 눈에 띄는 반짝이가 사라지면 바로 나한테 와.' },
        { say: '수정구는 왜 있어?', tier: 'meh', face: 'think', answer: '손님들이 좋아하거든. 분위기도 단서야. 마음을 열게 하는.' },
      ],
    },
    {
      title: '새벽 숲의 발자국',
      hint: '새벽(게임 시각 오전 다섯 시부터 아홉 시)에 숲으로 가 보세요. 신이치가 발자국을 쫓고 있대요.',
      need: { days: 3, points: 20, visit: { area: 'woods', from: 5, to: 9 } },
      scene: [
        '새벽 숲. 이슬 젖은 흙 위에 신이치가 무릎을 꿇고 있다.',
        '"왔구나, 조수. 시간 정확해. 쉿, 여기 발자국."',
        '"앞발이 깊어. 뭔가 물고 뛰었다는 뜻이야. 반짝이 사건 범인일지도."',
        '두 사람은 발자국을 따라 덤불을 헤친다. 끝에는 작은 굴이 있다.',
        '굴 앞에 바구니 하나. 안에는 잃어버린 털실 뭉치가 가득하다.',
        '"범인은 새끼 여우. 동기는 둥지 꾸미기. 털실 사건은 해결이네."',
        '신이치가 바구니를 살피다 고개를 젓는다. 반짝이는 건 하나도 없다.',
        '"…이상해. 은방울도 단추도 없어. 여우는 반짝이엔 관심이 없나 봐."',
        '그때 머리 위 가지에서 깃털 하나가 팔랑 떨어진다. 흰 바탕에 검은 끝.',
        '"범인은 둘이었어. 땅 위에 하나, 하늘에 하나. 수사는 이제부터야."',
      ],
      replies: [
        { say: '털실은 두고 가자', tier: 'great', remember: 'forest-dawn', face: 'smile', answer: ['…나도 그 말 하려고 했어.', '주인한텐 새 털실을 사 주자. 비밀 수사로.'] },
        { say: '깃털 주인을 쫓자', tier: 'good', remember: 'forest-dawn', face: 'wow', answer: '좋아, 그 눈빛. 깃털은 증거품 봉투에 넣었어. 다음은 함정이야.' },
        { say: '새벽은 너무 졸려', tier: 'meh', remember: 'forest-dawn', answer: '새벽은 탐정의 시간이야. 흔적이 아직 안 지워졌거든. 다음엔 커피 챙길게.' },
      ],
    },
    {
      title: '호박파이 함정 수사',
      hint: '신이치가 깃털 주인을 꾀어낼 미끼를 찾아요. 호박파이 하나를 가지고 천막으로 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'pumpkinpie', take: true } },
      scene: [
        '호박파이를 내밀자 신이치의 손이 멈춘다.',
        '"…잠깐. 이 결이랑 향, 빵집 거 아니지? 네가 직접 구했구나."',
        '"좋아, 이걸로 함정을 놓자. 지난번 깃털 주인을 불러낼 거야."',
        '그가 파이 옆에 은숟가락 하나를 반짝반짝 닦아 올려 둔다.',
        '해 질 녘. 둘은 천막 그늘에 숨어 숨을 죽인다.',
        '푸드득. 까치 한 마리가 내려앉더니 파이는 본체만체한다.',
        '부리에 물린 건 은숟가락이다. 까치는 뒷산 쪽으로 날아간다.',
        '"봤지? 범인은 파이가 아니라 반짝이를 노렸어. 동선은 뒷산이야."',
        '신이치가 남은 파이를 정확히 반으로 가른다. 자를 댄 것처럼 반듯하다.',
        '"이번 주 기록 마지막 줄은 이거야. 파이는 무사, 숟가락은 미끼."',
        '"피해자는 행복하고, 조수는 훌륭했다. 사건의 결말… 의 앞부분이야."',
      ],
      replies: [
        { say: '반 나눠 먹자', tier: 'great', remember: 'pie-night', face: 'laugh', answer: '그래서 반으로 자른 거야. 너도 먹을 줄 추리했거든.' },
        { say: '숟가락은 괜찮아?', tier: 'good', remember: 'pie-night', face: 'think', answer: ['괜찮아. 일부러 내준 거야.', '저 숟가락이 둥지까지 길을 알려 줄 거야. 우리 나침반이지.'] },
        { say: '그냥 다 먹어', tier: 'meh', remember: 'pie-night', face: 'smile', answer: '…그건 안 되지. 같이 먹어야 수사 회의가 돼.' },
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
        '마지막 쪽엔 반짝이 사건 지도. 뒷산에 동그라미가 잔뜩 그려져 있다.',
        '"뒷산까진 좁혔는데, 나무가 너무 많아. 어느 나무인지 모르겠어."',
        '창밖을 가리키는 손. 등대 불빛이 뒷산 소나무 끝에서 반짝 튄다.',
        '신이치가 벌떡 일어난다. "…빛이 반사됐어. 거기 반짝이가 모였다는 뜻이야."',
        '그가 한참 말없이 {me} 쪽을 본다.',
        '"내가 놓친 걸 네가 찾았어. 이건 조수가 아니라…"',
        '그는 말을 삼키고 수첩을 넘긴다. 요즘 쪽마다 같은 이름이 있다. {me}.',
        '"조수 기록란이야. …그렇게 보지 마. 기록은 정확해야 하거든."',
      ],
      replies: [
        { say: '나도 한 줄 써도 돼?', tier: 'great', face: 'shy', answer: ['…써. 그 펜, 너 주려고 하나 더 사 뒀어.', '이것도 추리였지. 네가 쓰고 싶어 할 거라는.'] },
        { say: '아니라면 뭔데?', tier: 'good', face: 'sorry', answer: '…그건 아직 조사 중이야. 결론은 사건 끝나고 말할게.' },
        { say: '글씨가 작아 안 보여', tier: 'meh', face: 'laugh', answer: '하하, 탐정 안경 빌려줄게. 멀리 있는 것도 잘 보여.' },
      ],
    },
    {
      title: '풀리지 않는 수수께끼',
      hint: '신이치와 아주 가까워지면 반짝이 사건이 끝나요. 그가 못 푼 수수께끼엔 꽃다발이 단서가 될지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '노을 진 뒷산. 둘은 등대 불빛이 튀던 큰 소나무 아래에 선다.',
        '신이치가 탐정 안경을 올린다. "찾았다. 꼭대기 둥지."',
        '둥지 안엔 은방울, 놋쇠 단추, 렌즈 뚜껑, 그리고 은숟가락이 반짝인다.',
        '까치 부부가 지켜보는 가운데, 그는 반짝이들을 하나씩 조심히 꺼낸다.',
        '빈자리엔 유리구슬 몇 알을 넣어 준다. "둥지는 지켜 줘야지."',
        '"사건 종결. 범인은 까치 부부, 동기는 신혼집 꾸미기. 처벌은 없음."',
        '은방울이 바람에 맑게 울린다. 신이치가 그 소리를 한참 듣는다.',
        '"{me}, 나 혼자 푼 사건은 많아. 근데 이번 건 둘이 풀었지."',
        '"그런데 하나만 아직 못 풀었어. 단서는 다 모였는데."',
        '"네 웃음, 네가 오는 시간, 내 심장 소리. 결론이 목에서 안 나와."',
        '"발명품도 소용없어. 목소리 바꾸는 넥타이로도 이건 못 말하겠더라."',
        '그가 안경을 고쳐 쓰며 웃는다. 평소보다 자신 없는 웃음이다.',
      ],
      replies: [
        { say: '천천히 풀어도 돼', tier: 'great', face: 'shy', answer: ['…고마워. 결정적 증거가 오면 바로 말할게.', '꽃 한 다발 같은 거. 아, 이건 혼잣말이야.'] },
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
        '멀리 박물관 창가에 돌아온 은방울이 걸려 있다. 바람이 불면 울린다.',
        '"{me}, 사건 일지 마지막 장을 정리했어. 들어 볼래?"',
        '"평일마다 마을을 떠나면서, 늘 마음 한쪽은 여기 두고 갔어."',
        '"기다려 달라는 말은 이제 안 할게. 같이 가자는 말을 하고 싶어."',
        '"조수 말고 파트너. 사건도, 주말도, 그다음 날들도."',
        '"모든 단서는 한 사람을 가리켰다. 결론은 처음부터 하나였다."',
        '"사건 종결. …근데 이 결론, 평생 다시 확인하고 싶어."',
        '"다음 증거품은 작고 둥근 거면 좋겠다. 손가락에 맞는 걸로."',
        '은방울 소리가 바람을 타고 언덕까지 올라온다. 그가 쑥스럽게 웃는다.',
      ],
      replies: [
        { say: '평생 확인해, 파트너', tier: 'great', face: 'laugh', answer: ['하하! 판결 났다.', '이건 내 인생 최고의 사건이야. 앞으로도 둘이 풀자.'] },
        { say: '반지 크기도 추리했어?', tier: 'good', face: 'shy', answer: '…이미 했어. 딱 맞을걸. 근데 그건 네가 가져와 주면 좋겠어.' },
        { say: '아직은 천천히', tier: 'meh', face: 'smile', answer: '좋아. 결론은 안 바뀌니까. 천천히 같이 확인하자.' },
      ],
    },
  ],
  after: [
    '오늘 운세는 다 봤어. 하루 한 번이 제일 잘 맞거든.',
    '또 왔네? 발소리로 알았어. 남은 이야기는 다음 주말에.',
    '사건 일지 정리 중이야. 별일 없었다는 것도 기록해야 하거든.',
    '조심히 가. 단서를 다 모아 보니 내일은 좋은 날이야.',
    '{me}, 신발 끈 풀렸어. 이건 운세가 아니라 그냥 관찰이야.',
    '사건 일지에 한 줄 적었어. 오늘도 조수가 다녀감.',
    '돌아가는 길에 반짝이는 거 보이면 기억해 둬. 까치가 노릴지도 몰라.',
  ],
};
