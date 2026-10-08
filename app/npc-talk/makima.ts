// 마키마 — 떠돌이 행상인(장날 좌판 · 항구). 늘 차분하게 웃는 존댓말, 상대를
// "○○ 씨"로 부른다. 거래와 약속은 모두 "계약", 사람은 냄새로 알아보고,
// 묻기 전에 이미 아는 듯 말한다. 부탁처럼 들리는 명령("앉아 볼래요?"),
// 고르는 척하는 질문("예, 아니면 멍?"), 개에게 하듯 짧은 칭찬("착해요"),
// 상으로 주는 잼 바른 빵. 맛있는 음식·개·영화를 좋아하고 계약을 어기는
// 손님은 조용히 기억해 둔다. 섬뜩함은 말투와 아는 것뿐, 해치는 말은 없다.
// 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const MAKIMA_TALK: NpcTalkBook = {
  npc: 'makima',
  memories: {
    'dog-lover': '개를 좋아한다고 했어요',
    'cat-person': '고양이 쪽이 좋다고 했어요',
    'movie-pal': '영화를 같이 보기로 약속했어요',
    'eat-all': '무엇이든 잘 먹는다고 했어요',
    'keep-promise': '약속은 꼭 지킨다고 했어요',
    'sit-yes': '앉으라는 말에 바로 앉았어요',
    'smell-me': '내게서 나는 냄새 이야기를 들었어요',
    'old-job': '예전 일은 말하고 싶을 때 들려 달라고 했어요',
    'end-credits': '영화는 자막까지 다 본다고 했어요',
    'jam-bread': '잼 바른 빵을 상으로 받았어요',
    'walk-dogs': '항구의 떠돌이 개에게 같이 밥을 주기로 했어요',
    'stay-here': '이 마을이 돌아올 곳이 되면 좋겠다고 했어요',
    'market-dusk': '저녁 장터에서 좌판을 같이 지켰어요',
    'jam-night': '딸기잼 바른 식빵을 나눠 먹었어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-heard': '함께 걸은 날을 이야기했어요',
    'date-heard': '내 방에서 보낸 날을 이야기했어요',
  },
  talks: [
    {
      id: 'dog-or-cat',
      open: '{me} 씨, 개가 좋아요, 고양이가 좋아요? 대답은 이미 알 것 같지만요.',
      replies: [
        { say: '당연히 개죠', tier: 'great', remember: 'dog-lover', answer: '역시요. 개는 솔직하고, 부르면 와요. {me} 씨도 그렇죠. 착해요.' },
        { say: '둘 다 좋아요', tier: 'good', answer: '욕심이 많네요. 나쁘지 않아요. 욕심 있는 손님은 계약을 잘 지켜요.' },
        { say: '고양이 쪽이에요', tier: 'meh', face: 'think', remember: 'cat-person', answer: '그렇군요. 고양이는 계약서에 서명을 안 해요. 그래도 기억해 둘게요.' },
      ],
    },
    {
      id: 'movie-ask',
      open: '이번 장날 끝나고 영화를 볼 거예요. {me} 씨도 같이 볼래요? 예, 아니면 멍?',
      replies: [
        { say: '멍', tier: 'great', face: 'smile', remember: 'movie-pal', answer: '…착해요. 그럼 계약 성립이에요. 자리는 제가 골라 둘게요.' },
        { say: '예, 좋아요', tier: 'good', remember: 'movie-pal', answer: '좋아요. 약속이에요. 늦으면 제가 냄새로 찾으러 갈 거예요.' },
        { say: '영화는 졸려서요', tier: 'meh', face: 'calm', answer: '졸리면 자도 돼요. 옆자리에서 자는 사람도 저는 좋아해요.' },
      ],
    },
    {
      id: 'eat-anything',
      open: '{me} 씨는 못 먹는 음식이 있어요? 저는 없어요. 국물까지 다 마셔요.',
      replies: [
        { say: '저도 다 잘 먹어요', tier: 'great', remember: 'eat-all', answer: '좋아요. 그럼 다음 장날엔 같이 먹으러 가요. 제가 가게를 정할게요.' },
        { say: '매운 건 조금 힘들어요', tier: 'good', answer: '알아 둘게요. 매운 건 제가 먹고, 순한 건 {me} 씨가 먹어요. 공평하죠.' },
        { say: '편식이 심해요', tier: 'meh', face: 'think', answer: '그렇군요. 괜찮아요. 맛있는 걸 모르는 사람은 가르치면 돼요.' },
      ],
    },
    {
      id: 'keep-word',
      open: '{me} 씨는 약속을 어겨 본 적 있어요? 솔직하게 말해도 괜찮아요.',
      replies: [
        { say: '지키려고 늘 애써요', tier: 'great', remember: 'keep-promise', answer: '알아요. 그런 사람에게서는 좋은 냄새가 나요. 지금처럼요.' },
        { say: '가끔 늦기는 해요', tier: 'good', face: 'smile', answer: '늦는 건 괜찮아요. 오기만 하면 돼요. 저는 기다리는 걸 잘해요.' },
        { say: '기억이 안 나요', tier: 'meh', face: 'calm', answer: '그래요? 저는 기억해요. 걱정 마요. 아직 나쁜 건 하나도 없어요.' },
      ],
    },
    {
      id: 'sit-down',
      open: '{me} 씨, 좌판 옆에 의자가 하나 있어요. 앉아 볼래요?',
      replies: [
        { say: '바로 앉는다', tier: 'great', face: 'smile', remember: 'sit-yes', answer: '착해요. 그 자리, 앞으로 {me} 씨 자리로 할게요.' },
        { say: '왜요? 무슨 일 있어요?', tier: 'good', answer: '아무 일도 없어요. 그냥 오래 서 있으면 다리가 아프잖아요.' },
        { say: '서 있을게요', tier: 'meh', face: 'calm', answer: '그래요. 의자는 기다릴 수 있어요. 저도요.' },
      ],
    },
    {
      id: 'your-smell',
      open: '{me} 씨에게서 무슨 냄새가 나는지 알아요? 처음 왔을 때부터 궁금했죠?',
      replies: [
        { say: '무슨 냄새인데요?', tier: 'great', remember: 'smell-me', answer: ['햇볕에 말린 이불 냄새요. 그리고 조금 흙냄새.', '…거짓말을 못 하는 사람 냄새예요. 좋은 거예요.'] },
        { say: '씻고 왔는데요', tier: 'good', face: 'laugh', answer: '씻어도 남는 냄새가 있어요. 사람마다 하나씩이요. 나쁜 뜻은 아니에요.' },
        { say: '좀 무서운데요', tier: 'meh', face: 'calm', answer: '무서워할 필요 없어요. 저는 그냥 기억할 뿐이에요.' },
      ],
    },
    {
      id: 'old-job',
      open: '예전에는 공공 기관에서 일했어요. 무슨 일이었는지 궁금해요?',
      replies: [
        { say: '말하고 싶을 때 들을게요', tier: 'great', face: 'smile', remember: 'old-job', answer: '…그 대답은 처음 들어 봐요. 좋아요. 그날이 오면 {me} 씨에게 먼저 할게요.' },
        { say: '무슨 일이었어요?', tier: 'good', face: 'think', answer: '사람들을 줄 세우는 일이요. 아, 서류 이야기예요. 정말이에요.' },
        { say: '별로 관심 없어요', tier: 'meh', answer: '편한 손님이네요. 궁금한 게 없는 사람은 계약도 빨라요.' },
      ],
    },
    {
      id: 'end-credits',
      open: '영화가 끝나고 자막이 올라갈 때, {me} 씨는 바로 일어나요?',
      replies: [
        { say: '끝까지 다 봐요', tier: 'great', remember: 'end-credits', answer: '저도 그래요. 불이 켜질 때까지 앉아 있는 사람, 좋아해요.' },
        { say: '재밌으면 남아요', tier: 'good', answer: '정직하네요. 재미없는 영화도 끝까지 보면 가끔 좋은 장면이 있어요.' },
        { say: '바로 나가요', tier: 'meh', face: 'calm', answer: '그렇군요. 그럼 나갈 때 제 몫 팝콘도 들고 나가 줘요.' },
      ],
    },
    {
      id: 'guess-price',
      open: '이 물건, 얼마일 것 같아요? 맞히면 조금 깎아 줄게요.',
      replies: [
        { say: '마키마 씨가 정한 값이요', tier: 'great', face: 'laugh', answer: '정답이에요. 값은 제가 정하고, {me} 씨는 믿으면 돼요. 착해요.' },
        { say: '깎아 주세요', tier: 'good', answer: '솔직해서 좋아요. 대신 다음 장날에도 와요. 그게 조건이에요.' },
        { say: '비싸 보이는데요', tier: 'meh', face: 'think', answer: '비싼 건 이유가 있어요. 쓰레쉬 씨 좌판과 비교해 봐도 좋아요.' },
      ],
    },
    {
      id: 'jam-reward',
      open: '착한 사람에게는 잼 바른 빵을 줘요. {me} 씨는 착한 사람이에요?',
      replies: [
        { say: '착하게 굴게요', tier: 'great', remember: 'jam-bread', face: 'smile', answer: '좋아요. 여기, 잼을 듬뿍 발랐어요. 계약 선금이에요.' },
        { say: '그건 마키마 씨가 정하죠', tier: 'good', face: 'laugh', answer: '맞아요. 잘 아네요. 오늘은 반 조각이에요. 나머지는 다음에요.' },
        { say: '빵은 별로예요', tier: 'meh', face: 'calm', answer: '그럼 제가 먹을게요. 상은 거절해도 기록은 남아요.' },
      ],
    },
    {
      id: 'harbor-dog',
      open: '항구에 떠돌이 개가 한 마리 있어요. 저처럼요. 밥 주러 같이 갈래요?',
      replies: [
        { say: '같이 가요', tier: 'great', remember: 'walk-dogs', face: 'smile', answer: '좋아요. 그 아이는 {me} 씨 냄새도 금방 외울 거예요. 저처럼요.' },
        { say: '이름은 있어요?', tier: 'good', face: 'think', answer: '아직 없어요. 이름을 붙이면 떠나기 어려워지니까요. 개도, 저도.' },
        { say: '개는 좀 무서워요', tier: 'meh', face: 'calm', answer: '괜찮아요. 개도 알아요. 무서워하는 사람에겐 천천히 다가가요.' },
      ],
    },
    {
      id: 'wanderer',
      open: '떠돌이는 돌아갈 곳이 없어요. {me} 씨는 돌아갈 곳이 있어요?',
      replies: [
        { say: '이 마을이면 좋겠어요', tier: 'great', remember: 'stay-here', face: 'shy', answer: '…그 말, 계약서에 적어 둘게요. 저도 넣어 줄 거죠?' },
        { say: '제 밭이 있어요', tier: 'good', answer: '좋은 곳이네요. 흙냄새가 {me} 씨랑 같아요. 거기가 맞아요.' },
        { say: '생각해 본 적 없어요', tier: 'meh', face: 'think', answer: '그럼 천천히 생각해요. 답이 나오면 제가 먼저 알게 될 거예요.' },
      ],
    },
    {
      id: 'contract-draft',
      when: { ch: 3 },
      open: '{me} 씨와 계약서를 하나 쓰고 싶어요. 조건은 아직 비밀이에요. 괜찮아요?',
      replies: [
        { say: '조건은 같이 정해요', tier: 'great', face: 'wow', answer: ['…같이요? 그런 계약은 해 본 적이 없어요.', '좋아요. 첫 줄은 맛있는 저녁으로 할게요.'] },
        { say: '마키마 씨라면 괜찮아요', tier: 'good', face: 'smile', answer: '믿어 주는 건 좋아요. 그래도 읽지 않고 서명하면 안 돼요. 저한테도요.' },
        { say: '조금 무서운데요', tier: 'meh', face: 'calm', answer: '무서우면 기다릴게요. 서두르는 계약은 좋은 계약이 아니에요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 냄새가 나요. {me} 씨, 우산 없이 왔네요. 천막 아래로 와 볼래요?',
      replies: [
        { say: '고마워요, 들어갈게요', tier: 'great', face: 'smile', answer: '착해요. 물건도 사람도 젖으면 안 되니까요. 그칠 때까지 같이 있어요.' },
        { say: '비 오는 날 좋아요', tier: 'good', answer: '저도요. 빗소리가 나면 사람들이 천천히 걸어요. 다 잘 보여요.' },
        { say: '금방 갈 거예요', tier: 'meh', face: 'calm', answer: '그래요. 그럼 이 천 한 장 가져가요. 돌려주는 건 다음 장날이에요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 왔네요. 발자국을 보면 누가 어디를 다녀갔는지 다 알아요. {me} 씨 것도요.',
      replies: [
        { say: '어묵 사 드릴게요', tier: 'great', face: 'smile', answer: '좋아요. 눈 오는 날 어묵은 계약 없이도 받아요. 국물까지요.' },
        { say: '제가 어디 갔는데요?', tier: 'good', face: 'think', answer: '밭에 들렀다가 광장을 지나 여기로요. 맞죠? 틀린 적은 없어요.' },
        { say: '추워서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 손을 주머니에 넣어요. 오늘은 그게 제 부탁이에요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤이네요. 오늘은 영화를 세 편 봤어요. 네 번째를 고르는 중이에요.',
      replies: [
        { say: '같이 골라 드릴까요?', tier: 'great', remember: 'movie-pal', answer: '좋아요. {me} 씨가 고른 걸로 볼게요. 재미없어도 끝까지요.' },
        { say: '안 졸려요?', tier: 'good', face: 'calm', answer: '아직이요. 재미없는 영화를 보면 오히려 정신이 맑아져요.' },
        { say: '저는 자러 갈게요', tier: 'meh', answer: '잘 자요, {me} 씨. 돌아가는 길은 밝은 쪽으로 가요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날이에요. 음식 좌판이 전부 몇 개인지 세어 봤어요. 오늘 다 먹을 거예요.',
      replies: [
        { say: '저도 따라갈게요', tier: 'great', face: 'laugh', answer: '좋아요. 첫 접시는 제가, 두 번째는 {me} 씨가 사는 계약이에요.' },
        { say: '다 먹을 수 있어요?', tier: 'good', face: 'smile', answer: '먹을 수 있어요. 남기는 건 음식과의 약속을 어기는 거니까요.' },
        { say: '사람이 너무 많아요', tier: 'meh', face: 'calm', answer: '그럼 제 뒤에 붙어요. 신기하게도 사람들이 길을 비켜 줘요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me} 씨에게서 바다 냄새가 나요. 오늘 {fish}, 잡았죠? 회로 먹으면 맛있겠네요.',
      replies: [
        { say: '한 점 드릴게요', tier: 'great', answer: '착해요. 그럼 간장은 제가 준비할게요. 이건 거래가 아니라 상이에요.' },
        { say: '팔면 얼마 쳐 줘요?', tier: 'good', face: 'think', answer: '좋은 값이요. {me} 씨에게만요. 다른 사람에게는 비밀이에요.' },
        { say: '그냥 제가 먹을래요', tier: 'meh', face: 'calm', answer: '그래요. 맛있게 먹어요. 저는 냄새만으로도 조금 행복해요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '항구가 시끄럽네요. 오늘 큰 물고기를 낚은 사람이 {me} 씨죠? 알고 있었어요.',
      replies: [
        { say: '같이 먹어요', tier: 'great', face: 'smile', answer: '좋은 대답이에요. 이런 건 팔지 말고 나눠 먹는 거예요. 약속해요.' },
        { say: '어떻게 알았어요?', tier: 'good', face: 'laugh', answer: '냄새요. 그리고 {me} 씨 얼굴이요. 숨길 생각이 없었잖아요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙냄새가 나요. 오늘 밭일을 했군요. 작물은 주인을 닮는다던데요.',
      replies: [
        { say: '좋은 걸로 가져올게요', tier: 'great', answer: '좋아요. 계약해요. 제일 잘 자란 걸로요. {me} 씨는 좋은 걸 고를 줄 알아요.' },
        { say: '허리가 아파요', tier: 'good', face: 'sorry', answer: '그럼 앉아 볼래요? 의자는 비워 뒀어요. 오늘은 쉬는 게 일이에요.' },
        { say: '그냥 그랬어요', tier: 'meh', face: 'calm', answer: '그런 날도 있죠. 흙은 그래도 다 기억해요. 저처럼요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '반짝이는 냄새가 나요. 오늘 금별 작물을 거뒀군요. 계약할까요?',
      replies: [
        { say: '마키마 씨한테만 보여 줄게요', tier: 'great', face: 'shy', answer: '…좋아요. 저한테만이요. 그런 조건은 마음에 들어요.' },
        { say: '얼마에 사 줄 건데요?', tier: 'good', face: 'think', answer: '좋은 값이요. 하지만 이건 팔지 말고 맛있게 먹는 걸 권해요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 씨, 기운이 없는 냄새가 나요. 숨겨도 알아요. 맛있는 거 먹으러 가요.',
      replies: [
        { say: '네, 같이 가요', tier: 'great', face: 'smile', answer: '착해요. 따뜻한 국물로 할게요. 오늘은 아무것도 묻지 않아요.' },
        { say: '그냥 좀 지쳤어요', tier: 'good', answer: '알아요. 그럼 여기 앉아요. 잼 바른 빵 하나 줄게요. 명령이에요.' },
        { say: '혼자 있고 싶어요', tier: 'meh', face: 'calm', answer: '그래요. 대신 내일은 꼭 들러요. 그게 오늘의 조건이에요.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '오늘 광장에서 결혼식이 있었대요. 평생 계약이네요. 음식은 맛있었을까요.',
      replies: [
        { say: '남은 음식 얻어 올까요?', tier: 'great', face: 'laugh', answer: '좋은 생각이에요. 착해요. 축하는 배부르게 하는 거니까요.' },
        { say: '부럽네요', tier: 'good', face: 'think', answer: '그래요? 그 냄새, 기억해 둘게요. 언젠가 쓸모가 있을 것 같아요.' },
        { say: '결혼은 잘 모르겠어요', tier: 'meh', face: 'calm', answer: '모르는 계약은 서두르지 않는 게 좋아요. 현명하네요.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '{other} 씨를 만났군요. 그분 냄새가 조금 묻어 있어요. 무슨 값을 불렀어요?',
      replies: [
        { say: '마키마 씨 이야기를 했어요', tier: 'great', face: 'smile', answer: '그렇겠죠. 그분은 저를 읽고 싶어 해요. 저도 그분을 못 읽어요. 공평하죠.' },
        { say: '주식 이야기만 했어요', tier: 'good', answer: '그분 웃음은 저도 계산이 안 돼요. 그래서 거래할 때마다 재밌어요.' },
        { say: '아무 말도 안 할래요', tier: 'meh', face: 'calm', answer: '좋아요. 입이 무거운 사람은 좋은 손님이에요. 어느 쪽에게나요.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '{other} 씨 가게에 다녀왔네요. 이번 경매에 낼 물건, 혹시 봤어요?',
      replies: [
        { say: '봤지만 비밀이에요', tier: 'great', face: 'laugh', answer: '착해요. 그런데 이미 알고 있어요. {me} 씨 얼굴이 말해 줬거든요.' },
        { say: '반짝이는 등불이었어요', tier: 'good', face: 'think', answer: '그분은 모으고, 저는 약속을 모아요. 이번엔 누가 이길까요.' },
        { say: '잘 모르겠어요', tier: 'meh', answer: '괜찮아요. 경매 날 제 옆에 앉아 있기만 하면 돼요.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '{other} 씨가 오늘도 뒤에서 보고 있어요. 돌아보지는 마요. 그분이 민망해하니까요.',
      replies: [
        { say: '인사라도 해 드릴까요?', tier: 'great', face: 'laugh', answer: '좋아요. 그분은 손을 흔들면 더 숨어요. 그게 귀여워요.' },
        { say: '왜 지켜보는 거예요?', tier: 'good', face: 'think', answer: '제가 수상하대요. 맞는 말이에요. 그래서 성실한 순경 씨를 좋아해요.' },
        { say: '저도 수상해 보여요?', tier: 'meh', face: 'calm', answer: '아니요. {me} 씨는 수상한 냄새가 안 나요. 그게 조금 아쉬워요.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '{other} 씨가 또 제 수첩을 쓰고 있대요. 제가 어디서 왔는지 추리 중이라나요.',
      replies: [
        { say: '정답에 가까워요?', tier: 'great', face: 'smile', answer: '조금씩요. 그래서 좋아해요. 끝까지 보는 사람은 드물거든요.' },
        { say: '말해 주면 되잖아요', tier: 'good', answer: '그럼 그분이 재미없어해요. 추리는 영화처럼 끝까지 가야 맛있어요.' },
        { say: '둘 다 이상해요', tier: 'meh', face: 'laugh', answer: '맞아요. 이상한 사람 둘이 사이좋은 마을은 좋은 마을이에요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-dog',
      when: { mem: 'dog-lover' },
      use: 'dog-lover',
      open: '개를 좋아한다고 했죠? 오늘 목장 개들이 {me} 씨 냄새를 맡고 꼬리를 흔들었어요.',
      replies: [
        { say: '보러 가고 싶어요', tier: 'great', face: 'smile', answer: '같이 가요. 손가락을 딸깍 하면 다 앉아요. 보여 줄게요.' },
        { say: '기억하고 있었어요?', tier: 'good', answer: '저는 다 기억해요. 좋아하는 것도, 싫어하는 것도요.' },
      ],
    },
    {
      id: 'cb-eat',
      when: { mem: 'eat-all' },
      use: 'eat-all',
      open: '무엇이든 잘 먹는다고 했죠. 그래서 맛있는 집을 세 곳 골라 뒀어요. 오늘 전부요.',
      replies: [
        { say: '전부 가요!', tier: 'great', face: 'laugh', answer: '좋아요. 계약 성립이에요. 남기면 안 돼요. 그게 유일한 조항이에요.' },
        { say: '한 곳만 가면 안 돼요?', tier: 'good', face: 'think', answer: '그럼 한 곳에서 세 접시요. 숫자는 같아요. 공평하죠.' },
      ],
    },
    {
      id: 'cb-promise',
      when: { mem: 'keep-promise' },
      use: 'keep-promise',
      open: '약속은 꼭 지킨다고 했죠. 그 뒤로 지켜봤어요. 정말이더라고요.',
      replies: [
        { say: '지켜보셨어요?', tier: 'good', face: 'calm', answer: '조금이요. 계약 상대를 아는 건 제 일이에요. 나쁜 뜻은 아니에요.' },
        { say: '앞으로도 지킬게요', tier: 'great', face: 'smile', answer: '알아요. 그래서 오늘은 값을 반만 받을게요. 착한 사람 할인이에요.' },
      ],
    },
    {
      id: 'cb-credits',
      when: { mem: 'end-credits' },
      use: 'end-credits',
      open: '자막까지 본다고 했죠. 어젯밤 영화, 자막 뒤에 짧은 장면이 하나 더 있었어요.',
      replies: [
        { say: '무슨 장면이었어요?', tier: 'great', face: 'smile', answer: '개 한 마리가 주인에게 돌아오는 장면이요. 그것만으로 볼 만했어요.' },
        { say: '저도 볼걸 그랬어요', tier: 'good', answer: '다음엔 같이 봐요. 마지막까지 앉아 있는 사람은 둘이면 좋아요.' },
      ],
    },
    {
      id: 'cb-dogs-walk',
      when: { mem: 'walk-dogs' },
      use: 'walk-dogs',
      open: '항구 개 말이에요. 요즘 {me} 씨가 오는 시간에 맞춰 선착장에 앉아 있어요.',
      replies: [
        { say: '이름을 지어 줄까요?', tier: 'great', face: 'shy', answer: '…그래요. 이제 떠나기 어려워져도 괜찮을 것 같아요. 개도, 저도.' },
        { say: '밥 챙겨 갈게요', tier: 'good', answer: '착해요. 그 아이도 계약을 아는 것 같아요. 기다리면 온다는 걸요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 씨가 좋아하는 건, {taste}. 맞죠? 다음 장날 좌판에 하나 올려 둘게요.',
      replies: [
        { say: '어떻게 아셨어요?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '냄새요. 반은 농담이에요. 나머지 반은 말 안 할게요.' },
        { say: '꼭 사러 올게요', tier: 'great', face: 'smile', remember: 'taste-heard', answer: '좋아요. 그날은 {me} 씨 값으로 쳐 줄게요. 계약이에요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-heard' },
      open: '저번에 같이 걸었던 날, 상인들이 값을 깎아 줬죠. 왜인지는 아직 궁금해요?',
      replies: [
        { say: '또 같이 걸어요', tier: 'great', face: 'smile', remember: 'outing-heard', answer: '좋아요. 다음 산책 날은 제가 정할게요. 이미 정했지만요.' },
        { say: '조금 궁금해요', tier: 'good', face: 'calm', remember: 'outing-heard', answer: '다들 약속을 잘 지키는 사람들이라서요. 그 정도만 말해 둘게요.' },
        { say: '모르는 게 낫겠어요', tier: 'meh', remember: 'outing-heard', answer: '현명해요. 모르는 것도 계약의 일부예요.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-heard' },
      open: '{me} 씨 방, 좋은 냄새가 났어요. 개를 들이기 좋은 방이었어요.',
      replies: [
        { say: '언제든 또 와요', tier: 'great', face: 'shy', remember: 'date-heard', answer: '…언제든이요? 그 말, 그대로 계약서에 옮길게요.' },
        { say: '개는 아직 없어요', tier: 'good', face: 'laugh', remember: 'date-heard', answer: '그럼 제가 자주 가면 되겠네요. 비슷한 거예요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '좌판 앞의 첫 계약',
      hint: '한 번 이야기를 나누면 마키마가 작은 계약서 한 장을 내밀어요.',
      need: { days: 1 },
      scene: [
        '마키마가 좌판 아래에서 손바닥만 한 종이 한 장을 꺼낸다.',
        '"{me} 씨. 이건 계약서예요. 아주 작은 거요."',
        '"조건은 하나예요. 다음 장날에도 제 좌판에 들르는 것."',
        '"어기면 어떻게 되냐고요? 아무 일도 없어요. 제가 기억할 뿐이에요."',
        '그녀가 평소처럼 조용히 웃는다. 펜 끝이 이쪽을 향해 있다.',
      ],
      replies: [
        { say: '서명할게요', tier: 'great', remember: 'keep-promise', face: 'smile', answer: '착해요. 첫 계약 기념으로 잼 바른 빵 반 조각이에요.' },
        { say: '조건이 그게 다예요?', tier: 'good', face: 'think', answer: '지금은요. 계약은 작게 시작하는 거예요. 크게 키우는 건 나중이에요.' },
        { say: '생각해 볼게요', tier: 'meh', face: 'calm', answer: '그래요. 계약서는 여기 둘게요. {me} 씨는 결국 올 거예요.' },
      ],
    },
    {
      title: '저녁 장터의 좌판',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 시장 거리로 와 달래요. 좌판을 같이 지키재요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 17, to: 21 } },
      scene: [
        '해 질 녘 시장 거리. 마키마가 좌판 옆 빈 의자를 손끝으로 가리킨다.',
        '"왔네요. 시간 맞춰 올 줄 알았어요. 앉아요."',
        '손님이 지나갈 때마다 그녀가 작게 말한다. "저 사람은 오늘 살 거예요."',
        '정말로 그 손님이 돌아와 물건을 산다. 세 번 연속이다.',
        '"신기하죠? 냄새예요. 원하는 게 있는 사람은 걸음이 달라요."',
        '"{me} 씨는 처음부터 걸음이 똑같았어요. 그래서 편해요."',
      ],
      replies: [
        { say: '저는 뭘 원하는 걸음이에요?', tier: 'great', remember: 'market-dusk', face: 'smile', answer: '…그건 저도 아직 몰라요. 처음이에요. 그래서 계속 보고 싶어요.' },
        { say: '장사 잘하시네요', tier: 'good', remember: 'market-dusk', answer: '오늘은 {me} 씨가 옆에 있어서 더 잘됐어요. 정말이에요.' },
        { say: '조금 무섭네요', tier: 'meh', remember: 'market-dusk', face: 'calm', answer: '무서울 것 없어요. 저는 값을 알 뿐이에요. 사람 값이 아니라요.' },
      ],
    },
    {
      title: '딸기잼과 식빵',
      hint: '마키마가 잼 바른 빵 이야기를 했어요. 딸기잼 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'jam', take: true } },
      scene: [
        '딸기잼 병을 내밀자 마키마가 잠깐 말을 멈춘다.',
        '"…이건 제가 주는 상이에요. 받는 건 처음이네요."',
        '그녀가 식빵 두 장을 꺼내 잼을 끝까지 듬뿍 바른다.',
        '"예전 일터에서는 아무도 저한테 상을 주지 않았어요. 줄 사람만 있었죠."',
        '빵을 반으로 나누는 손이 평소보다 조금 느리다.',
      ],
      replies: [
        { say: '착하게 굴었으니까요', tier: 'great', remember: 'jam-night', face: 'laugh', answer: '…제 말을 저한테 돌려주네요. 좋아요. 착해요, {me} 씨.' },
        { say: '같이 먹으니 더 맛있어요', tier: 'good', remember: 'jam-night', face: 'smile', answer: '그래요. 이상하죠. 똑같은 잼인데요. 기억해 둘게요.' },
        { say: '잼이 너무 많아요', tier: 'meh', remember: 'jam-night', answer: '많은 게 좋은 거예요. 그건 계약서에도 없는 제 원칙이에요.' },
      ],
    },
    {
      title: '두 장의 영화 표',
      hint: '마키마와 영화를 같이 보기로 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'movie-pal' },
      scene: [
        '장이 끝난 밤, 마키마가 영화 표 두 장을 펼쳐 보인다.',
        '"약속했죠. 오늘은 처음부터 끝까지, 자막까지 볼 거예요."',
        '화면 속 개 한 마리가 비를 맞으며 주인을 기다린다.',
        '옆을 보니 그녀가 웃지 않고 화면만 보고 있다. 처음 보는 얼굴이다.',
        '불이 켜지자 그녀가 먼저 이쪽을 본다. "재미없었죠? 저는 좋았어요."',
      ],
      replies: [
        { say: '저도 좋았어요', tier: 'great', face: 'shy', answer: '…그럼 다음 표도 두 장 살게요. 그건 묻지 않고 정할게요.' },
        { say: '개가 기다려서 슬펐어요', tier: 'good', face: 'think', answer: '기다리는 건 슬픈 게 아니에요. 올 거라고 믿는 거니까요.' },
        { say: '중간에 졸았어요', tier: 'meh', face: 'calm', answer: '알아요. 옆에서 다 들렸어요. 그래도 끝까지 있었으니 착해요.' },
      ],
    },
    {
      title: '목줄 없는 개',
      hint: '마키마와 아주 가까워지면 그녀가 계약서 밖의 이야기를 꺼내요. 그 뒤엔 꽃다발 냄새도 반길지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '새벽 선착장. 항구 개가 마키마 발치에 엎드려 있다.',
        '"이 아이는 목줄이 없어요. 그런데 매일 여기로 와요."',
        '"저는 늘 사람들을 계약으로 묶었어요. 그래야 곁에 남는 줄 알았죠."',
        '"그런데 {me} 씨는 조건 없이 와요. 매번요. 그게 계산이 안 돼요."',
        '그녀가 개의 머리를 쓰다듬다가, 아주 조금 웃는다. 평소와 다른 웃음이다.',
      ],
      replies: [
        { say: '오고 싶어서 오는 거예요', tier: 'great', face: 'shy', answer: ['…그런 계약은 서류가 없어서 불안해요.', '꽃 냄새가 나는 날이 오면, 그때는 받을게요.'] },
        { say: '마키마 씨도 매일 오잖아요', tier: 'good', face: 'wow', answer: '…그러네요. 들켰어요. 이건 기억에서 지워 줄래요? 부탁이에요.' },
        { say: '개가 귀엽네요', tier: 'meh', face: 'calm', answer: '그렇죠. 그 아이도 {me} 씨를 좋아해요. 저처럼… 아니, 그냥요.' },
      ],
    },
    {
      title: '평생 유효한 계약',
      hint: '마키마와 연인이 되면 마지막 이야기가 열려요. 손가락에 맞는 무언가를 기다린대요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '장날이 끝난 좌판. 마키마가 하얀 종이 한 장을 펼친다. 아무것도 적혀 있지 않다.',
        '"{me} 씨와의 계약서예요. 조건은 아직 비어 있어요."',
        '"처음으로 해지 조항을 넣지 않을 거예요. 그러니 천천히 채워요."',
        '"첫 줄은 이거예요. 맛있는 건 같이 먹을 것. 영화는 끝까지 볼 것."',
        '그녀가 자기 약지를 한 번 쓰다듬는다. "크기는 이미 알고 있죠?"',
      ],
      replies: [
        { say: '둘째 줄은 제가 쓸게요', tier: 'great', face: 'laugh', answer: '좋아요. 무엇을 쓰든 서명할게요. …이런 말, 처음 해 봐요.' },
        { say: '반지 이야기예요?', tier: 'good', face: 'shy', answer: '냄새로 다 알면서 묻는 건 반칙이에요. 기다릴게요. 오래는 말고요.' },
        { say: '아직은 천천히요', tier: 'meh', face: 'smile', answer: '좋아요. 이 계약은 기한이 없으니까요. 저는 기다릴 수 있어요.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 여기까지 해요. 다음 약속은 제가 정할게요.',
    '또 왔네요. 올 줄 알았어요. 그래도 오늘 계약은 끝났어요.',
    '{me} 씨, 앉아서 구경만 하다 가요. 그건 공짜예요.',
    '영화 시간이에요. 내일 다시 와 볼래요? 예, 아니면 멍?',
  ],
};
