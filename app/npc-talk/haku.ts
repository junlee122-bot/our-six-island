// 하쿠 — 강물 과수원 주인, 이십 대 중반. 차분하고 다정한 해요체, 말수가 적고
// 친구 이름을 꼭 "{me} 님"으로 불러 준다. 개울과 과일나무를 아끼고, 오래전엔
// 강이었던 것 같다는 이야기와 반쯤 잊은 긴 이름을 은근히 흘린다. 흰 비늘·하늘
// 기척은 농담처럼만. 주먹밥·과일 건네기, 종이 새, 물 위의 기차, 엄한 목욕탕
// 주인 밑에서 일한 기억. 원작 대사는 쓰지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const HAKU_TALK: NpcTalkBook = {
  npc: 'haku',
  memories: {
    'name-keep': '이름이 흐려지면 불러 주기로 약속했어요',
    'peach-lover': '복숭아를 좋아한다고 했어요',
    'stream-sit': '징검다리에 같이 앉기로 했어요',
    'paper-bird': '종이 새 이야기를 들었어요',
    'rice-ball': '주먹밥을 받아 먹었어요',
    'tree-name': '나무 이름 짓기를 도왔어요',
    'river-dream': '강이었던 꿈 이야기를 들었어요',
    'old-work': '옛날 목욕탕 이야기를 들었어요',
    'herb-tea': '꽃차를 같이 마시기로 했어요',
    'sky-joke': '하늘을 나는 꿈 이야기를 나눴어요',
    'water-train': '물 위를 달리는 기차 이야기를 들었어요',
    'storm-help': '폭풍 날 묘목 지키기를 돕기로 했어요',
    'dawn-spring': '새벽 샘물을 함께 봤어요',
    'peach-share': '복숭아를 나눠 먹었어요',
    'white-scale': '흰 비늘 이야기를 들었어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일에 과일 바구니를 준비해 준대요',
  },
  talks: [
    {
      id: 'your-name',
      open: '{me} 님. 이름을 부를 때마다 조금 안심이 돼요. 이상하죠?',
      replies: [
        { say: '나도 하쿠 이름 자주 부를게', tier: 'great', face: 'shy', answer: '…고마워요. 이름은 불러 줄 때 제일 단단해지거든요.' },
        { say: '왜 안심이 돼요?', tier: 'good', face: 'think', answer: '잊지 않았다는 증거니까요. 저는 그게 중요해요.' },
        { say: '그냥 버릇 아니에요?', tier: 'meh', face: 'calm', answer: '버릇일지도요. 그래도 좋은 버릇이에요.' },
      ],
    },
    {
      id: 'lost-name',
      open: [
        '제 진짜 이름은 아주 길었던 것 같아요. 강 이름처럼요.',
        '끝부분이 아직 안 떠올라요. 물속에 잠긴 돌처럼요.',
      ],
      replies: [
        { say: '흐려지면 내가 불러 줄게요', tier: 'great', remember: 'name-keep', face: 'shy', answer: '…그 약속, 물길에 새겨 둘게요. 꼭요.' },
        { say: '천천히 떠오를 거예요', tier: 'good', face: 'smile', answer: '그렇겠죠. 물은 결국 제 길을 찾으니까요.' },
        { say: '지금 이름도 괜찮은데요', tier: 'meh', face: 'calm', answer: '네, 지금 이름도 좋아요. 그래도 궁금해요.' },
      ],
    },
    {
      id: 'peach',
      open: '여름 복숭아는 개울물에 담가 두면 더 달아요. 하나 드릴까요?',
      replies: [
        { say: '복숭아 정말 좋아해요!', tier: 'great', remember: 'peach-lover', face: 'smile', answer: '저도요. 그럼 제일 볼 붉은 걸로 골라 둘게요.' },
        { say: '반씩 나눠 먹어요', tier: 'good', answer: '좋아요. 나눠 먹으면 단맛이 오래 남아요.' },
        { say: '털이 좀 간지러워요', tier: 'meh', face: 'calm', answer: '물에 씻으면 괜찮아요. 제가 깎아 드릴게요.' },
      ],
    },
    {
      id: 'stepping-stones',
      open: '징검다리에 앉아 물을 보면 마음이 낮게 흘러가요. 앉아 볼래요?',
      replies: [
        { say: '네, 같이 앉아요', tier: 'great', remember: 'stream-sit', face: 'smile', answer: '여기요. 이 돌이 제일 평평해요. 물이 다 들어 줘요.' },
        { say: '물소리가 좋네요', tier: 'good', face: 'calm', answer: '그렇죠. 오래 들으면 무슨 말인지 알 것 같아요.' },
        { say: '빠질까 봐 무서워요', tier: 'meh', face: 'sorry', answer: '제 옆에선 안 빠져요. 물이 저를 알거든요.' },
      ],
    },
    {
      id: 'paper-bird',
      open: '과수원에 종이 새가 날아들면 쫓지 마세요. 누가 저를 찾는 거예요.',
      replies: [
        { say: '누가 찾는데요?', tier: 'great', remember: 'paper-bird', face: 'think', answer: ['아마… 옛날에 알던 누군가요.', '반가운 사람인지는 아직 몰라요. 그래서 조용히 둬요.'] },
        { say: '내가 접어서 날려 볼까요?', tier: 'good', face: 'smile', answer: '{me} 님이 보낸 거면 바로 알아볼게요. 접는 법 알려 드릴게요.' },
        { say: '그냥 종이 아니에요?', tier: 'meh', face: 'calm', answer: '대부분은요. 대부분은.' },
      ],
    },
    {
      id: 'rice-ball',
      open: '{me} 님, 얼굴이 조금 비어 보여요. 주먹밥 하나 드세요. 제가 쌌어요.',
      replies: [
        { say: '고마워요. 잘 먹을게요', tier: 'great', remember: 'rice-ball', face: 'smile', answer: '천천히요. 먹고 나면 기운이 제자리로 돌아와요.' },
        { say: '하쿠는 먹었어요?', tier: 'good', face: 'shy', answer: '저는 아까 복숭아 먹었어요. 걱정해 줘서 고마워요.' },
        { say: '배 안 고파요', tier: 'meh', face: 'calm', answer: '그럼 주머니에 넣어 가세요. 나중에 고파질 거예요.' },
      ],
    },
    {
      id: 'tree-names',
      open: '나무들한테 몰래 이름을 지어 줘요. 이 살구나무는 아직 이름이 없어요.',
      replies: [
        { say: '같이 지어 줘요', tier: 'great', remember: 'tree-name', face: 'smile', answer: '좋아요. 부르기 쉽고, 오래 기억할 수 있는 걸로요.' },
        { say: '왜 몰래 지어요?', tier: 'good', face: 'think', answer: '이름은 소중하니까요. 나무랑 저만 알면 돼요.' },
        { say: '나무가 알아들어요?', tier: 'meh', face: 'calm', answer: '알아들어요. 그날은 잎을 덜 떨어뜨리거든요.' },
      ],
    },
    {
      id: 'river-dream',
      open: '가끔 꿈을 꿔요. 제가 넓은 강이 되어 들판을 흐르는 꿈이요.',
      replies: [
        { say: '그 강 이야기 더 들려줘요', tier: 'great', remember: 'river-dream', face: 'think', answer: ['물풀이 있고, 갈대가 있었어요.', '누가 신발을 떨어뜨렸던 것 같아요. 그 부분이 선명해요.'] },
        { say: '멋진 꿈이네요', tier: 'good', face: 'smile', answer: '깨고 나면 조금 그리워요. 그래서 개울을 찾아가요.' },
        { say: '그냥 꿈이에요', tier: 'meh', face: 'calm', answer: '그렇죠. …그렇겠죠.' },
      ],
    },
    {
      id: 'bathhouse',
      open: '오래전엔 커다란 목욕탕에서 일했어요. 주인이 아주 엄했어요.',
      replies: [
        { say: '힘들지 않았어요?', tier: 'great', remember: 'old-work', face: 'calm', answer: ['힘들었어요. 이름까지 잃을 뻔했거든요.', '그래서 지금은 남의 이름을 꼭 불러 줘요.'] },
        { say: '그래서 그렇게 부지런하군요', tier: 'good', face: 'smile', answer: '그때 배운 건 그거 하나예요. 일찍 일어나기.' },
        { say: '목욕탕 가고 싶다', tier: 'meh', face: 'laugh', answer: '마을 목욕탕이 훨씬 다정해요. 거길 가세요.' },
      ],
    },
    {
      id: 'flower-tea',
      open: '꽃차를 우렸어요. 살구꽃이랑 국화를 조금 섞었어요.',
      replies: [
        { say: '한 잔 같이 마셔요', tier: 'great', remember: 'herb-tea', face: 'smile', answer: '좋아요. 김이 올라갈 때 향이 제일 좋아요.' },
        { say: '메르시 님도 좋아하겠어요', tier: 'good', face: 'think', answer: '네, 의원에도 한 봉지 드리려고요. 잠이 잘 온대요.' },
        { say: '저는 커피가 좋아요', tier: 'meh', face: 'calm', answer: '그럼 다음엔 프리렌 님 가게에서 만나요.' },
      ],
    },
    {
      id: 'sky',
      open: '구름 위는 생각보다 조용해요. …그런 것 같다는 얘기예요.',
      replies: [
        { say: '하늘 날아 본 적 있어요?', tier: 'great', remember: 'sky-joke', face: 'shy', answer: '…꿈에서요. 꿈 얘기예요. 정말이에요.' },
        { say: '구름 위 가 보고 싶다', tier: 'good', face: 'smile', answer: '언젠가 바람이 좋은 날이면요. 무섭지 않게요.' },
        { say: '비행기 타면 시끄러워요', tier: 'meh', face: 'calm', answer: '그건… 다른 방법으로 가는 거라서요.' },
      ],
    },
    {
      id: 'water-train',
      open: '물 위를 달리는 기차를 본 적 있어요. 바퀴가 물을 가르면서요.',
      replies: [
        { say: '어디로 가는 기차였어요?', tier: 'great', remember: 'water-train', face: 'think', answer: ['종점은 몰라요. 돌아오는 기차는 없었어요.', '그래서 저는 걸어서 돌아왔어요. 아마도요.'] },
        { say: '같이 타 보고 싶어요', tier: 'good', face: 'smile', answer: '편도라서 안 돼요. 대신 개울가 산책은 언제든지요.' },
        { say: '꿈이었겠죠', tier: 'meh', face: 'calm', answer: '그럴지도요. 그래도 꿈치고는 물이 차가웠어요.' },
      ],
    },
    {
      id: 'stones',
      open: '조약돌은 잘 못 다뤄요. 개울 바닥에 있어야 할 것 같아서요.',
      replies: [
        { say: '그럼 개울에 돌려줄게요', tier: 'great', face: 'smile', answer: '고마워요. 돌도 제자리가 있어요. 사람처럼요.' },
        { say: '벌레도 싫어한다면서요', tier: 'good', face: 'sorry', answer: '…네. 나무에 해를 주는 녀석들이 많아서요.' },
        { say: '돌이 예쁜데', tier: 'meh', face: 'calm', answer: '예쁘죠. 그러니까 물속에서 더 예뻐요.' },
      ],
    },
    {
      id: 'stay',
      when: { ch: 3 },
      open: '오래 흘러만 왔는데, 요즘은 머물고 싶은 곳이 생겼어요.',
      replies: [
        { say: '여기 과수원이요?', tier: 'great', face: 'shy', answer: '…과수원도요. 과수원만은 아니고요.' },
        { say: '잘됐네요', tier: 'good', face: 'smile', answer: '네. {me} 님 덕분인 것 같아요.' },
        { say: '또 떠날 거예요?', tier: 'meh', face: 'think', answer: '아니요. 이번엔 물이 고여서 연못이 될 거예요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비가 와요, {me} 님. 나무들이 목을 축이네요. 저도요.',
      replies: [
        { say: '하쿠도 비 좋아해요?', tier: 'great', face: 'smile', answer: '네. 빗소리를 들으면 아주 오래전 일이 떠오를 것 같아요.' },
        { say: '우산 같이 써요', tier: 'good', face: 'shy', answer: '고마워요. 저는 젖어도 괜찮지만, 같이 쓸게요.' },
        { say: '비 싫어요', tier: 'meh', face: 'calm', answer: '그럼 원두막으로 와요. 지붕이 튼튼해요.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '물길이 거칠어요. 어린 묘목에 지지대를 대는 중이에요.',
      replies: [
        { say: '저도 도울게요!', tier: 'great', remember: 'storm-help', face: 'wow', answer: '고마워요. 끈은 느슨하게요. 나무도 숨 쉬어야 해요.' },
        { say: '조심해요, 하쿠', tier: 'good', face: 'smile', answer: '네. 오늘은 징검다리도 건너지 마세요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 개울 위로 내려요. 녹으면 다시 물이 되겠죠.',
      replies: [
        { say: '물로 돌아가는 거네요', tier: 'great', face: 'think', answer: '네. 모양이 바뀌어도 이름은 그대로예요. 물도요.' },
        { say: '귤나무 눈 털어 줄까요?', tier: 'good', face: 'smile', answer: '살살요. 가지가 놀라지 않게요. 고마워요.' },
        { say: '추워요', tier: 'meh', face: 'calm', answer: '귤 하나 쥐여 드릴게요. 손이 데워질 거예요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침이에요, {me} 님. 이슬이 아직 잎에 있어요.',
      replies: [
        { say: '순찰 같이 돌아요', tier: 'great', face: 'smile', answer: '좋아요. 나무마다 이름을 부르면서 가요. 작게요.' },
        { say: '일찍 일어나시네요', tier: 'good', answer: '옛날 버릇이에요. 해보다 먼저 일어나야 했거든요.' },
        { say: '아직 졸려요', tier: 'meh', face: 'calm', answer: '그럼 개울물로 세수해요. 바로 깨요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤엔 물소리가 제 옛 이름을 부르는 것 같아요. 끝까지는 안 들려요.',
      replies: [
        { say: '같이 들어 볼게요', tier: 'great', remember: 'river-dream', face: 'calm', answer: '…쉿. 지금, 낮게 흐르는 소리요. 들렸어요?' },
        { say: '무섭지 않아요?', tier: 'good', face: 'think', answer: '아니요. 그리운 쪽에 가까워요.' },
        { say: '바람 소리 아니에요?', tier: 'meh', face: 'calm', answer: '그럴지도요. 바람도 물길을 따라가요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날이에요. 개울에 작은 등을 띄울 거예요. 같이 띄울래요?',
      replies: [
        { say: '소원 하나 적어서요', tier: 'great', face: 'smile', answer: '좋아요. 소원 옆에 이름도 적어요. 물이 주인을 찾아 줘요.' },
        { say: '과일 바구니도 나눠요?', tier: 'good', answer: '네, 하나 챙겨 뒀어요. {me} 님 몫이에요.' },
        { say: '등이 가라앉으면요?', tier: 'meh', face: 'calm', answer: '안 가라앉아요. 오늘은 물이 기분이 좋거든요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me} 님, 손에서 물 냄새가 나요. 오늘 {fish}, 낚았군요.',
      replies: [
        { say: '물고기한테 고맙다고 했어요', tier: 'great', face: 'smile', answer: '잘했어요. 물이 기억해요. 다음에도 좋은 날일 거예요.' },
        { say: '하쿠도 하나 드릴까요?', tier: 'good', face: 'shy', answer: '마음만요. 은어라면… 조금 흔들리겠지만요.' },
        { say: '팔 거예요', tier: 'meh', face: 'calm', answer: '그것도 좋아요. 손은 개울에 한 번 씻고 가요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '큰 걸 낚았다는 소식이 개울까지 흘러왔어요. 축하해요, {me} 님.',
      replies: [
        { say: '물이 도와준 거예요', tier: 'great', face: 'smile', answer: '…그렇게 말해 주니 물도 기뻐할 거예요.' },
        { say: '팔이 아직 떨려요', tier: 'good', face: 'laugh', answer: '복숭아 하나 드세요. 떨림엔 단 게 좋아요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '{me} 님, 손에 흙이 묻었네요. 밭일하고 왔군요. 수고했어요.',
      replies: [
        { say: '하쿠 거름 비결 알려 줘요', tier: 'great', face: 'think', answer: '약초를 삭혀요. 츠나데 님께 배운 비율이 있어요. 엄격하게요.' },
        { say: '열매가 잘 달렸어요', tier: 'good', face: 'smile', answer: '다행이에요. 나무랑 밭은 손을 기억해요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물이요? 물빛처럼 반짝이네요. 흙이 {me} 님을 좋아하나 봐요.',
      replies: [
        { say: '하쿠 나무들 덕분이에요', tier: 'great', face: 'shy', answer: '…나무들한테 전해 줄게요. 오늘 밤 잎이 반짝일 거예요.' },
        { say: '비싸게 팔 거예요', tier: 'meh', face: 'calm', answer: '좋은 값 받으세요. 무잔 님한테는 말하지 말고요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘 표정이 조금 지쳐 보여요. 원두막에서 쉬어 가요.',
      replies: [
        { say: '조금만 앉아 있을게요', tier: 'great', remember: 'rice-ball', face: 'calm', answer: '네. 주먹밥 하나 옆에 둘게요. 말은 안 해도 돼요.' },
        { say: '괜찮아요', tier: 'good', face: 'think', answer: '괜찮다고 하는 얼굴도 다 보여요. 물처럼요.' },
      ],
    },
    {
      id: 'op-news-legend',
      when: { news: 'legend' },
      open: '마을 소식에 옛 전설이 실렸대요. 강에 사는 흰 용 이야기요.',
      replies: [
        { say: '하쿠 이야기 같아요', tier: 'great', face: 'shy', answer: '…저요? 저는 과수원 주인이에요. 그냥요.' },
        { say: '용이 진짜 있을까요?', tier: 'good', face: 'think', answer: '있다면 아마 조용히 살 거예요. 과일 키우면서요.' },
        { say: '전설은 다 지어낸 거예요', tier: 'meh', face: 'calm', answer: '그래도 누군가는 이름을 기억해 둔 거예요.' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other} 님 만났어요? 아까 우유 한 통이랑 사과 한 바구니를 바꿨어요.',
      replies: [
        { say: '물바가지는 안 맞았어요?', tier: 'great', face: 'laugh', answer: '오늘은 맞았어요. 하루 한 번은 받아 주기로 했거든요.' },
        { say: '좋은 이웃이네요', tier: 'good', face: 'smile', answer: '네. 시끄럽지만 따뜻해요. 우유도 따뜻했어요.' },
      ],
    },
    {
      id: 'op-tsunade',
      when: { bond: 'tsunade' },
      open: '{other} 님 뵈었군요. 거름 비율 또 틀렸다고 하셨죠? 제 얘기요.',
      replies: [
        { say: '하쿠 칭찬도 했어요', tier: 'great', face: 'shy', answer: '…정말요? 그럼 오늘은 거름을 두 번 섞을게요.' },
        { say: '엄하신 분이죠', tier: 'good', face: 'smile', answer: '네. 엄한 스승은 오래 기억에 남아요. 좋은 쪽으로요.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '{other} 님한테 강 이야기 책 반납 기한 물어봐 주셨어요?',
      replies: [
        { say: '조금 더 읽어도 된대요', tier: 'great', face: 'smile', answer: '다행이에요. 읽다 보면 낯설지가 않아서 천천히 읽고 싶어요.' },
        { say: '늦으면 혼날걸요', tier: 'good', face: 'sorry', answer: '…알아요. 오늘 밤 다 읽을게요.' },
      ],
    },
    {
      id: 'op-bocchi',
      when: { bond: 'bocchi' },
      open: '{other} 님이 원두막에서 기타를 쳤대요. 나무들이 잎을 덜 떨어뜨렸어요.',
      replies: [
        { say: '하쿠가 박수 쳐 줘요', tier: 'great', face: 'smile', answer: '쳤더니 숨어 버렸어요. 다음엔 나무 뒤에서 조용히 칠게요.' },
        { say: '나무도 음악을 들어요?', tier: 'good', face: 'think', answer: '물도, 나무도 들어요. 좋은 소리는 오래 남아요.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '{other} 님이 또 과수원 매출을 물어보셨나요? 저한테도 물으셨어요.',
      replies: [
        { say: '사과로 대답했죠?', tier: 'great', face: 'laugh', answer: '네. 제일 빨간 걸로요. 그게 제 대답이에요.' },
        { say: '숫자 알려 드리지 그래요', tier: 'meh', face: 'calm', answer: '나무는 숫자로 자라지 않아요. 그래서 사과예요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-peach',
      when: { mem: 'peach-lover' },
      use: 'peach-lover',
      open: '복숭아 좋아한다고 하셨죠. 개울물에 담가 둔 거, 지금 딱 시원해요.',
      replies: [
        { say: '기억해 줬네요!', tier: 'great', face: 'smile', answer: '이름이랑 같이 기억해 뒀어요. 좋아하는 것까지요.' },
        { say: '제일 큰 걸로요', tier: 'good', face: 'laugh', answer: '그럴 줄 알고 제일 큰 걸 골라 뒀어요.' },
      ],
    },
    {
      id: 'cb-tree',
      when: { mem: 'tree-name' },
      use: 'tree-name',
      open: '같이 이름 지어 준 살구나무 있잖아요. 오늘 첫 꽃이 피었어요.',
      replies: [
        { say: '이름 부르러 가요', tier: 'great', face: 'smile', answer: '네. 작게 불러 줘요. 그래도 다 들어요.' },
        { say: '열매도 열릴까요?', tier: 'good', face: 'think', answer: '이름을 불러 준 나무는 꼭 열매를 맺어요.' },
      ],
    },
    {
      id: 'cb-bird',
      when: { mem: 'paper-bird' },
      use: 'paper-bird',
      open: '종이 새 얘기 기억하죠? 오늘 하나 날아왔어요. 날개에 아무것도 없었어요.',
      replies: [
        { say: '내가 보낸 걸지도요', tier: 'great', face: 'shy', answer: '…그랬다면 좋겠어요. 그럼 답장으로 복숭아를 보낼게요.' },
        { say: '괜찮아요?', tier: 'good', face: 'calm', answer: '네. 이상한 기척은 없었어요. 바람이 접은 건가 봐요.' },
      ],
    },
    {
      id: 'cb-dream',
      when: { mem: 'river-dream' },
      use: 'river-dream',
      open: '그 강 꿈, 또 꿨어요. 이번엔 누가 제 이름을 부르기 직전에 깼어요.',
      replies: [
        { say: '다음엔 끝까지 들어요', tier: 'great', face: 'think', answer: '네. 그 목소리, 왠지 {me} 님이랑 비슷했어요.' },
        { say: '아쉬웠겠어요', tier: 'good', face: 'sorry', answer: '조금요. 그래도 가까워지고 있어요. 느껴져요.' },
      ],
    },
    {
      id: 'cb-tea',
      when: { mem: 'herb-tea' },
      use: 'herb-tea',
      open: '꽃차 같이 마시기로 했죠. 오늘은 복숭아꽃을 말린 걸로 우렸어요.',
      replies: [
        { say: '향이 정말 좋아요', tier: 'great', face: 'smile', answer: '{me} 님이 좋아하니 봄을 한 번 더 맞은 기분이에요.' },
        { say: '한 잔 더 주세요', tier: 'good', face: 'laugh', answer: '네, 천천히요. 꽃차는 서두르면 맛이 숨어요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님, 좋아하는 게 {taste}, 맞죠? 이름 옆에 적어 뒀어요.',
      replies: [
        { say: '그것까지 기억해요?', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '좋아하는 걸 알면 그 사람이 더 선명해져요.' },
        { say: '하쿠는요?', tier: 'good', remember: 'taste-heard', face: 'smile', answer: '복숭아랑 살구요. 그리고 꽃차요. 다 아시잖아요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸었던 날, 개울이 줄곧 우리 옆을 따라왔어요. 기억나요?',
      replies: [
        { say: '또 같이 걸어요', tier: 'great', remember: 'outing-talk', face: 'smile', answer: '네. 이번엔 물길 끝까지요. 천천히요.' },
        { say: '다리가 좀 아팠어요', tier: 'good', remember: 'outing-talk', face: 'sorry', answer: '미안해요. 다음엔 원두막에서 자주 쉬어 가요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 {me} 님 생일이죠? 제철 과일로 바구니를 하나 채울게요.',
      replies: [
        { say: '복숭아 꼭 넣어 줘요', tier: 'great', remember: 'bday-plan', face: 'smile', answer: '제일 먼저 넣을게요. 이름표도 붙이고요.' },
        { say: '마음만 받을게요', tier: 'good', remember: 'bday-plan', face: 'shy', answer: '마음도 바구니도 다 드릴게요. 그날만큼은요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '이름을 묻는 사람',
      hint: '한 번 이야기를 나누면 하쿠가 이름부터 물어봐요.',
      need: { days: 1 },
      scene: [
        '과수원 입구, 하쿠가 물뿌리개를 내려놓고 고개를 숙인다.',
        '"처음 뵙네요. 하쿠예요. 과수원을 돌보고 있어요."',
        '"이름을 알려 주시겠어요? 저는 이름을 꼭 기억해요."',
        '대답을 듣자 그가 그 이름을 작게 한 번 따라 부른다.',
        '"…{me} 님. 이제 이 나무들도 알 거예요."',
      ],
      replies: [
        { say: '하쿠 님 이름도 기억할게요', tier: 'great', face: 'smile', answer: '…고마워요. 서로 불러 주면 길을 잃지 않아요.' },
        { say: '나무들이 알아요?', tier: 'good', face: 'think', answer: '네. 걸음 소리랑 같이 기억해요. 저처럼요.' },
        { say: '그냥 손님이에요', tier: 'meh', face: 'calm', answer: '손님도 이름이 있어요. 그래서 여쭸어요.' },
      ],
    },
    {
      title: '물이 시작되는 곳',
      hint: '새벽(게임 시각 오전 다섯 시부터 여덟 시) 뒷산에 올라가 보세요. 하쿠가 샘을 본대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 5, to: 8 } },
      scene: [
        '안개 낀 뒷산, 바위틈에서 맑은 물이 솟는다.',
        '하쿠가 무릎을 꿇고 손바닥에 물을 받는다.',
        '"과수원 개울은 여기서 시작돼요. 작지만 쉬지 않아요."',
        '"저도 어딘가에서 이렇게 시작됐을 거예요. 기억은 안 나지만요."',
        '"…같이 와 줘서 고마워요. 혼자 오면 너무 조용하거든요."',
      ],
      replies: [
        { say: '하쿠의 시작도 찾아봐요', tier: 'great', remember: 'dawn-spring', face: 'shy', answer: '…네. {me} 님이랑이면 찾을 수 있을 것 같아요.' },
        { say: '물이 정말 차갑네요', tier: 'good', remember: 'dawn-spring', face: 'smile', answer: '새벽 샘물이라서요. 마시면 머리가 맑아져요.' },
        { say: '너무 일찍이에요', tier: 'meh', remember: 'dawn-spring', face: 'calm', answer: '미안해요. 물은 이 시간에 제일 정직하거든요.' },
      ],
    },
    {
      title: '복숭아 한 알',
      hint: '하쿠가 복숭아 이야기를 했어요. 복숭아를 하나 가지고 하쿠를 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'peach', take: true } },
      scene: [
        '복숭아를 내밀자 하쿠가 두 손으로 조심스럽게 받는다.',
        '"…제가 키운 것보다 볼이 붉네요. 어디서 났어요?"',
        '그가 개울물에 복숭아를 담갔다가 반으로 가른다.',
        '"옛날엔 주는 쪽만 했어요. 받는 건 서툴러요."',
        '"그러니까 반은 {me} 님 거예요. 그게 제 방식이에요."',
      ],
      replies: [
        { say: '같이 먹으니 더 달아요', tier: 'great', remember: 'peach-share', face: 'smile', answer: '네. 이 맛은 이름이랑 같이 오래 남을 거예요.' },
        { say: '다 드셔도 되는데요', tier: 'good', remember: 'peach-share', face: 'shy', answer: '그럼 덜 맛있어요. 나눠야 맛이 와요.' },
        { say: '시장에서 샀어요', tier: 'meh', remember: 'peach-share', face: 'calm', answer: '나세라 님 좌판이겠네요. 그래도 주신 건 {me} 님이에요.' },
      ],
    },
    {
      title: '흰 비늘',
      hint: '하쿠의 이름이 흐려지면 불러 주겠다고 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'name-keep' },
      scene: [
        '저녁 징검다리, 하쿠의 어깨에 흰 것이 반짝인다.',
        '"…꽃잎이에요. 아마도요." 그가 웃지 않고 말한다.',
        '"가끔 이게 묻어 있어요. 어디서 오는지 저도 몰라요."',
        '"약속해 줬죠. 제 이름이 흐려지면 불러 주겠다고."',
        '"그 말을 듣고 처음으로, 잊는 게 덜 무서워졌어요."',
      ],
      replies: [
        { say: '하쿠. 여기 있어요', tier: 'great', remember: 'white-scale', face: 'shy', answer: '…네. 들렸어요. 물길 끝까지 들렸어요.' },
        { say: '비늘이어도 괜찮아요', tier: 'good', remember: 'white-scale', face: 'think', answer: '…그렇게 말해 준 사람은 {me} 님이 처음이에요.' },
        { say: '진짜 꽃잎 같은데요', tier: 'meh', remember: 'white-scale', face: 'calm', answer: '그럼 꽃잎으로 해 둬요. 오늘은요.' },
      ],
    },
    {
      title: '머무는 물',
      hint: '하쿠와 아주 가까워지면 그가 머물 곳 이야기를 해요. 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '노을 진 원두막, 하쿠가 개울 쪽을 오래 바라본다.',
        '"물은 늘 어딘가로 가야 한다고 생각했어요."',
        '"그런데 요즘은 이 과수원에, {me} 님 곁에 고이고 싶어요."',
        '"…꽃이라도 한 다발 받으면, 그땐 말을 잘 못 할 거예요."',
        '그가 귀끝까지 붉어진 채 고개를 돌린다.',
      ],
      replies: [
        { say: '여기 머물러요, 하쿠', tier: 'great', face: 'shy', answer: '…네. 그 말이면 강도 멈출 수 있어요.' },
        { say: '꽃 좋아해요?', tier: 'good', face: 'smile', answer: '{me} 님이 고른 꽃이라면요. 어떤 꽃이든요.' },
        { say: '물은 흘러야죠', tier: 'meh', face: 'think', answer: '…그렇죠. 그래도 연못도 물이에요.' },
      ],
    },
    {
      title: '되찾은 이름',
      hint: '하쿠와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '달밤의 개울가. 하쿠가 {me} 님의 손을 잡고 물 위를 본다.',
        '"{me} 님이 불러 줄 때마다, 잊었던 이름이 한 글자씩 돌아와요."',
        '"아직 다 찾진 못했어요. 그래도 이젠 급하지 않아요."',
        '"마지막 글자는 {me} 님 옆에서 찾고 싶어요. 평생요."',
        '"…반지처럼 둥근 약속이면, 물도 잊지 않을 거예요."',
      ],
      replies: [
        { say: '평생 불러 줄게요', tier: 'great', face: 'shy', answer: '…네. 그럼 저는 평생 대답할게요. 매일요.' },
        { say: '천천히 같이 찾아요', tier: 'good', face: 'smile', answer: '네. 물은 서두르지 않아요. 우리도요.' },
        { say: '지금 이름도 좋아요', tier: 'meh', face: 'think', answer: '…{me} 님이 그렇게 부르면, 그게 제 이름이에요.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분히 했어요. 내일 또 이름 불러 드릴게요.',
    '나무들이 기다려요. 또 봬요, {me} 님.',
    '…또 오셨네요. 복숭아 한 조각 가져가요. 그냥요.',
    '개울가에 있을게요. 찾으면 이름만 불러 주세요.',
  ],
};
