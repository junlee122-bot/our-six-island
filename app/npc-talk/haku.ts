// 하쿠 — 강물 과수원 주인, 이십 대 중반. 차분하고 다정한 해요체, 말수가 적고
// 친구 이름을 꼭 "{me} 님"으로 불러 준다. 개울과 과일나무를 아끼고, 오래전엔
// 강이었던 것 같다는 이야기와 반쯤 잊은 긴 이름을 은근히 흘린다. 흰 비늘·하늘
// 기척은 농담처럼만. 주먹밥·과일 건네기, 종이 새, 물 위의 기차, 엄한 목욕탕
// 주인 밑에서 일한 기억, 신발을 잃은 어린아이를 건져 준 기억.
// 이야기 여섯 장은 남의 이름을 소중히 부르는 그가 잊었던 자기 이름(호박빛 물이
// 흐르던 강의 긴 이름)을 한 조각씩 되찾는 줄기. 원작 대사는 쓰지 않고 말투와
// 소재만 빌린다.
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
    'date-talk': '내 방에서 보낸 저녁을 이야기했어요',
    'lost-shoe': '물에 떠내려간 작은 신발 이야기를 들었어요',
    'fruit-tag': '과일 바구니에 이름표 붙이기를 도왔어요',
    'herb-lesson': '츠나데 님께 배운 약초 이야기를 들었어요',
    'lost-page': '강 이야기 책의 사라진 쪽을 찾기로 했어요',
    'songpyeon': '송편을 같이 빚기로 했어요',
    'stream-clean': '개울 청소를 같이 하기로 했어요',
    'apricot-jam': '살구잼을 같이 졸이기로 했어요',
    'graft': '접붙이기를 같이 지켜보기로 했어요',
    'kind-elder': '다정했던 옛 어른 이야기를 들었어요',
  },
  talks: [
    {
      id: 'your-name',
      open: '{me} 님. 이름을 부를 때마다 조금 안심이 돼요. 이상하죠?',
      replies: [
        { say: '나도 하쿠 이름 자주 부를게', tier: 'great', face: 'shy', answer: ['…고마워요.', '이름은 불러 줄 때 제일 단단해지거든요. 돌다리처럼요.'] },
        { say: '왜 안심이 돼요?', tier: 'good', face: 'think', answer: ['잊지 않았다는 증거니까요.', '저는 그게 중요해요. 잊는 쪽도, 잊히는 쪽도 아프니까요.'] },
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
        { say: '흐려지면 내가 불러 줄게요', tier: 'great', remember: 'name-keep', face: 'shy', answer: ['…그 약속, 물길에 새겨 둘게요.', '꼭요. {me} 님 목소리라면 어디서든 알아들을 거예요.'] },
        { say: '천천히 떠오를 거예요', tier: 'good', face: 'smile', answer: '그렇겠죠. 물은 결국 제 길을 찾으니까요.' },
        { say: '지금 이름도 괜찮은데요', tier: 'meh', face: 'calm', answer: '네, 지금 이름도 좋아요. 그래도 궁금해요.' },
      ],
    },
    {
      id: 'peach',
      open: '여름 복숭아는 개울물에 담가 두면 더 달아요. 하나 드릴까요?',
      replies: [
        { say: '복숭아 정말 좋아해요!', tier: 'great', remember: 'peach-lover', face: 'smile', answer: ['저도요.', '그럼 제일 볼 붉은 걸로 골라 둘게요. {me} 님 몫으로요.'] },
        { say: '반씩 나눠 먹어요', tier: 'good', answer: '좋아요. 나눠 먹으면 단맛이 오래 남아요.' },
        { say: '털이 좀 간지러워요', tier: 'meh', face: 'calm', answer: '물에 씻으면 괜찮아요. 제가 깎아 드릴게요.' },
      ],
    },
    {
      id: 'stepping-stones',
      open: '징검다리에 앉아 물을 보면 마음이 낮게 흘러가요. 앉아 볼래요?',
      replies: [
        { say: '네, 같이 앉아요', tier: 'great', remember: 'stream-sit', face: 'smile', answer: ['여기요. 이 돌이 제일 평평해요.', '하고 싶은 말이 있으면 물한테 해도 돼요. 물이 다 들어 줘요.'] },
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
        { say: '고마워요. 잘 먹을게요', tier: 'great', remember: 'rice-ball', face: 'smile', answer: ['천천히요.', '먹고 나면 기운이 제자리로 돌아와요. 울고 싶으면 울어도 되고요.'] },
        { say: '하쿠는 먹었어요?', tier: 'good', face: 'shy', answer: '저는 아까 복숭아 먹었어요. 걱정해 줘서 고마워요.' },
        { say: '배 안 고파요', tier: 'meh', face: 'calm', answer: '그럼 주머니에 넣어 가세요. 나중에 고파질 거예요.' },
      ],
    },
    {
      id: 'tree-names',
      open: '나무들한테 몰래 이름을 지어 줘요. 이 살구나무는 아직 이름이 없어요.',
      replies: [
        { say: '같이 지어 줘요', tier: 'great', remember: 'tree-name', face: 'smile', answer: ['좋아요.', '부르기 쉽고, 오래 기억할 수 있는 걸로요. 천천히 골라요.'] },
        { say: '왜 몰래 지어요?', tier: 'good', face: 'think', answer: '이름은 소중하니까요. 나무랑 저만 알면 돼요.' },
        { say: '나무가 알아들어요?', tier: 'meh', face: 'calm', answer: '알아들어요. 그날은 잎을 덜 떨어뜨리거든요.' },
      ],
    },
    {
      id: 'river-dream',
      open: '가끔 꿈을 꿔요. 제가 넓은 강이 되어 들판을 흐르는 꿈이요.',
      replies: [
        { say: '그 강 이야기 더 들려줘요', tier: 'great', remember: 'river-dream', face: 'think', answer: ['물풀이 있고, 갈대가 있었어요.', '물빛이 해 질 녘처럼 누렇게 맑았어요. 그 부분이 선명해요.'] },
        { say: '멋진 꿈이네요', tier: 'good', face: 'smile', answer: '깨고 나면 조금 그리워요. 그래서 개울을 찾아가요.' },
        { say: '그냥 꿈이에요', tier: 'meh', face: 'calm', answer: '그렇죠. …그렇겠죠.' },
      ],
    },
    {
      id: 'bathhouse',
      open: '오래전엔 커다란 목욕탕에서 일했어요. 주인이 아주 엄했어요.',
      replies: [
        { say: '힘들지 않았어요?', tier: 'great', remember: 'old-work', face: 'calm', answer: ['힘들었어요. 이름까지 잃을 뻔했거든요.', '그래서 지금은 남의 이름을 꼭 불러 줘요. 잃지 말라고요.'] },
        { say: '그래서 그렇게 부지런하군요', tier: 'good', face: 'smile', answer: '그때 배운 건 그거 하나예요. 일찍 일어나기.' },
        { say: '목욕탕 가고 싶다', tier: 'meh', face: 'laugh', answer: '마을 목욕탕이 훨씬 다정해요. 거길 가세요.' },
      ],
    },
    {
      id: 'flower-tea',
      open: '꽃차를 우렸어요. 살구꽃이랑 국화를 조금 섞었어요.',
      replies: [
        { say: '한 잔 같이 마셔요', tier: 'great', remember: 'herb-tea', face: 'smile', answer: '좋아요. 김이 올라갈 때 향이 제일 좋아요.' },
        { say: '메르시 님도 좋아하겠어요', tier: 'good', face: 'think', answer: ['네, 의원에도 한 봉지 드리려고요.', '밤새 환자 보시는 날엔 잠이 잘 온대요. 그게 제일 기뻐요.'] },
        { say: '저는 커피가 좋아요', tier: 'meh', face: 'calm', answer: '그럼 다음엔 프리렌 님 가게에서 만나요.' },
      ],
    },
    {
      id: 'sky',
      open: '구름 위는 생각보다 조용해요. …그런 것 같다는 얘기예요.',
      replies: [
        { say: '하늘 날아 본 적 있어요?', tier: 'great', remember: 'sky-joke', face: 'shy', answer: ['…꿈에서요.', '꿈 얘기예요. 정말이에요. 그렇게 보지 마세요.'] },
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
      id: 'lost-shoe',
      open: [
        '어릴 적 기억은 흐린데, 하나는 또렷해요.',
        '작은 신발 한 짝이 물에 떠내려왔어요. 분홍색이었어요.',
      ],
      replies: [
        { say: '신발 주인은 찾았어요?', tier: 'great', remember: 'lost-shoe', face: 'think', answer: ['신발을 쫓아 들어온 아이가 있었어요.', '물이 그 아이를 살살 얕은 데로 밀어 줬어요. 제가… 아니, 물이요.'] },
        { say: '분홍색까지 기억해요?', tier: 'good', face: 'shy', answer: '이상하죠. 이름은 잊었는데 그 색은 안 잊혀요.' },
        { say: '신발은 잘 떠내려가죠', tier: 'meh', face: 'calm', answer: '네. 그래서 개울가에선 신발 끈을 꼭 매요.' },
      ],
    },
    {
      id: 'fruit-tags',
      open: '바구니마다 이름표를 붙이는 중이에요. 누구 몫인지 잊지 않으려고요.',
      replies: [
        { say: '제가 글씨 써 줄게요', tier: 'great', remember: 'fruit-tag', face: 'smile', answer: ['고마워요. 또박또박요.', '이름이 예쁘게 쓰이면 과일도 더 예쁘게 익어요.'] },
        { say: '제 이름도 있어요?', tier: 'good', face: 'shy', answer: '맨 위 바구니요. 제일 먼저 붙였어요.' },
        { say: '그냥 섞어 두면 안 돼요?', tier: 'meh', face: 'calm', answer: '섞이면 누구 마음인지 몰라져요. 그건 싫어요.' },
      ],
    },
    {
      id: 'tsunade-herbs',
      open: '츠나데 님께 약초 거름을 배우고 있어요. 저울을 쓰면 혼나요.',
      replies: [
        { say: '그럼 어떻게 재요?', tier: 'great', remember: 'herb-lesson', face: 'think', answer: ['손바닥으로요. 한 줌, 반 줌, 손끝 하나.', '손이 기억할 때까지 하래요. 엄하지만 맞는 말이에요.'] },
        { say: '츠나데 님 무섭죠', tier: 'good', face: 'laugh', answer: ['조금요. 그래도 다 끝나면 꼭 차를 주세요.', '엄한 사람이 다정한 걸 보면, 옛날 생각이 나요.'] },
        { say: '저울이 정확한데요', tier: 'meh', face: 'calm', answer: '흙은 저울을 안 믿어요. 손을 믿어요.' },
      ],
    },
    {
      id: 'river-book',
      open: '베아트리스 님이 빌려준 강 이야기 책, 한 쪽이 찢겨 나갔어요.',
      replies: [
        { say: '그 쪽을 같이 찾아봐요', tier: 'great', remember: 'lost-page', face: 'wow', answer: ['…정말요?', '사라진 강 이름이 거기 있었을 것 같아요. 왠지 그래요.'] },
        { say: '베아트리스 님이 화났겠어요', tier: 'good', face: 'sorry', answer: '제가 찢은 건 아니라고 했더니, 알고 있대요. 다행이에요.' },
        { say: '다른 책 읽으면 되죠', tier: 'meh', face: 'calm', answer: '그 쪽은 다른 책엔 없을 거예요. 그래서 아까워요.' },
      ],
    },
    {
      id: 'bocchi-hut',
      open: '봇치 님은 사람 없는 원두막에서만 기타를 쳐요. 저는 나무 뒤에서 들어요.',
      replies: [
        { say: '모르는 척해 주는 거네요', tier: 'great', face: 'smile', answer: ['네. 들킨 걸 알면 다시 안 오실 거라서요.', '물도 듣는 척 안 하면서 다 들어요. 저도 그래요.'] },
        { say: '박수 쳐 드리면 좋아할걸요', tier: 'good', face: 'think', answer: '한 번 쳤다가 숨어 버리셨어요. 박수는 마음속으로만요.' },
        { say: '시끄럽지 않아요?', tier: 'meh', face: 'calm', answer: '아니요. 잎 떨어지는 소리보다 조용해요.' },
      ],
    },
    {
      id: 'frieren-tart',
      open: '프리렌 님 빵집에 살구를 대요. 오래 사신 분이라 옛 강 이름을 알지도 몰라요.',
      replies: [
        { say: '한번 여쭤봐요', tier: 'great', face: 'shy', answer: ['여쭤봤어요. 강이 너무 많아서 다 잊었대요.', '그래도 "누런 물빛 강"은 본 것 같다고… 그 말이 좋았어요.'] },
        { say: '살구 타르트 맛있어요', tier: 'good', face: 'smile', answer: '제 살구가 들어갔어요. 오늘 아침에 딴 거요.' },
        { say: '빵집 문 늦게 열잖아요', tier: 'meh', face: 'laugh', answer: '그래서 살구는 문 앞 그늘에 두고 와요. 다 알아요.' },
      ],
    },
    {
      id: 'nasera-coop',
      open: '농협에 과일을 낼 때, 나세라 님이 늘 제일 좋은 걸 먼저 골라 가요.',
      replies: [
        { say: '눈이 정확하시네요', tier: 'great', face: 'smile', answer: ['네. 한 번도 틀린 적이 없어요.', '대신 값은 깎으세요. 정직하게요. 그래서 믿어요.'] },
        { say: '좋은 건 남겨 두지 그래요', tier: 'good', face: 'think', answer: '좋은 건 많이 나눠야 해요. {me} 님 것은 따로 있고요.' },
        { say: '비싸게 팔아요', tier: 'meh', face: 'calm', answer: '나무는 값을 몰라요. 저도 잘 몰라요.' },
      ],
    },
    {
      id: 'nilah-water',
      open: '닐라 님은 인사 대신 물을 끼얹어요. 처음엔 놀랐어요.',
      replies: [
        { say: '하쿠는 물이랑 친하잖아요', tier: 'great', face: 'laugh', answer: ['…그래서 그런지 맞아도 하나도 안 차가워요.', '닐라 님은 그게 신기하대요. 저도 신기해요.'] },
        { say: '같이 물장난 해요?', tier: 'good', face: 'smile', answer: '가끔요. 대신 나무엔 안 튀게 해 달라고 해요.' },
        { say: '그건 좀 무례한데요', tier: 'meh', face: 'calm', answer: '그 집 인사예요. 우유를 꼭 같이 주시거든요.' },
      ],
    },
    {
      id: 'mercy-clinic',
      open: '메르시 님 의원에 허브를 갖다 드려요. 그분은 늘 남부터 챙겨요.',
      replies: [
        { say: '하쿠도 그렇잖아요', tier: 'great', face: 'shy', answer: ['…그런가요.', '그럼 다음엔 메르시 님 몫 주먹밥도 하나 쌀게요. 서로요.'] },
        { say: '어떤 허브요?', tier: 'good', face: 'think', answer: '카밀레랑 박하요. 개울가에서 제일 맑게 자라요.' },
        { say: '의원은 좀 무서워요', tier: 'meh', face: 'calm', answer: '안 무서워요. 아픈 걸 무서워하는 거예요, 다들.' },
      ],
    },
    {
      id: 'songpyeon',
      open: '송편을 좋아해요. 솔잎 깔고 쪄서, 반달 모양으로요.',
      replies: [
        { say: '다음 명절에 같이 빚어요', tier: 'great', remember: 'songpyeon', face: 'smile', answer: ['좋아요.', '소는 깨랑 밤이요. 제 건 모양이 반듯해서 재미없대요.'] },
        { say: '예쁘게 빚으면 좋은 짝 만난대요', tier: 'good', face: 'shy', answer: '…그 말 듣고 나서 더 열심히 빚어요. 비밀이에요.' },
        { say: '떡은 좀 질겨요', tier: 'meh', face: 'calm', answer: '갓 찐 건 말랑해요. 다음엔 바로 드릴게요.' },
      ],
    },
    {
      id: 'stream-clean',
      open: [
        '개울에 쓰레기가 걸리면 숨이 막히는 기분이에요. 이상하게요.',
        '어떤 강은 메워져서 길이 됐대요. 그 얘기만 들어도 가슴이 답답해요.',
      ],
      replies: [
        { say: '같이 개울 청소해요', tier: 'great', remember: 'stream-clean', face: 'wow', answer: ['…고마워요.', '물이 다시 노래하면, 저도 숨이 쉬어져요. 정말로요.'] },
        { say: '메워진 강이 불쌍해요', tier: 'good', face: 'sorry', answer: '네. 이름도 같이 묻혔을 거예요. 그래서 더요.' },
        { say: '길이 생기면 편하죠', tier: 'meh', face: 'calm', answer: '…그렇죠. 사람한테는요.' },
      ],
    },
    {
      id: 'apricot-jam',
      open: '살구가 너무 많이 익었어요. 잼으로 졸이면 여름을 겨울까지 데려갈 수 있어요.',
      replies: [
        { say: '저도 같이 저을래요', tier: 'great', remember: 'apricot-jam', face: 'smile', answer: ['눌어붙지 않게 천천히요.', '병마다 날짜 대신 그날 날씨를 적어요. {weather} 같은 거요.'] },
        { say: '기억도 그렇게 담으면 좋겠다', tier: 'good', face: 'think', answer: '…그러게요. 그럼 잊어버려도 뚜껑만 열면 되겠네요.' },
        { say: '그냥 먹는 게 낫죠', tier: 'meh', face: 'calm', answer: '그것도 맞아요. 한 알은 지금 드세요.' },
      ],
    },
    {
      id: 'pruning',
      open: '겨울엔 가지를 쳐요. 아까워도 쳐야 봄에 더 크게 자라요.',
      replies: [
        { say: '놓아줘야 자라는 거네요', tier: 'great', face: 'think', answer: ['네.', '저도 예전 일 몇 개는 놓아줬어요. 그래서 여기 있는 것 같아요.'] },
        { say: '나무가 아프지 않을까요?', tier: 'good', face: 'sorry', answer: '조금요. 그래서 자른 자리에 꼭 이름을 불러 줘요.' },
        { say: '그냥 두면 안 돼요?', tier: 'meh', face: 'calm', answer: '두면 엉켜요. 마음도 그렇대요. 츠나데 님이요.' },
      ],
    },
    {
      id: 'graft',
      open: '배나무 가지를 다른 나무에 접붙였어요. 둘이 하나로 이어질 거예요.',
      replies: [
        { say: '이어지는지 같이 봐요', tier: 'great', remember: 'graft', face: 'smile', answer: ['좋아요. 새순이 나면 붙은 거예요.', '그날은 둘 다한테 이름을 새로 지어 줘야겠어요.'] },
        { say: '다른 나무끼리도 돼요?', tier: 'good', face: 'think', answer: '가까운 사이면요. 물길도 가까우면 만나잖아요.' },
        { say: '좀 억지 같은데요', tier: 'meh', face: 'calm', answer: '처음엔 그래 보여요. 그래도 붙으면 아주 단단해요.' },
      ],
    },
    {
      id: 'kind-elder',
      open: '엄한 목욕탕 주인한테는 다정한 언니가 있었어요. 털실로 뭘 떠 줬어요.',
      replies: [
        { say: '그분은 어떤 분이었어요?', tier: 'great', remember: 'kind-elder', face: 'calm', answer: ['얼굴은 똑같은데 눈이 달랐어요.', '차를 따라 주면서 이름을 물어 주는 분이었어요. 그게 고마웠어요.'] },
        { say: '같은 얼굴에 다른 마음이네요', tier: 'good', face: 'think', answer: '네. 그래서 얼굴보다 목소리를 기억해요.' },
        { say: '털실 별로예요', tier: 'meh', face: 'calm', answer: '그 털실은 반짝였어요. 머리끈이었어요. 아마도요.' },
      ],
    },
    {
      id: 'few-words',
      open: '저는 말이 적죠. 같이 있으면 심심하지 않아요?',
      replies: [
        { say: '조용해서 좋아요', tier: 'great', face: 'shy', answer: ['…다행이에요.', '말 대신 과일 깎아 드릴게요. 그게 제 말이에요.'] },
        { say: '물소리가 대신 말해 줘요', tier: 'good', face: 'smile', answer: '맞아요. 그래서 개울가에서 만나는 게 좋아요.' },
        { say: '조금 심심해요', tier: 'meh', face: 'sorry', answer: '미안해요. 그럼 오늘은 하나 더 이야기할게요. …나무 얘기요.' },
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
    {
      id: 'scale-again',
      when: { ch: 4 },
      open: '요즘은 흰 게 묻어도 감추지 않아요. {me} 님이 봤으니까요.',
      replies: [
        { say: '반짝여서 예뻐요', tier: 'great', face: 'shy', answer: ['…예쁘다는 말은 처음 들어요.', '그럼 내일도 하나쯤 묻혀 올게요. 농담이에요.'] },
        { say: '다른 사람도 알아요?', tier: 'good', face: 'think', answer: '닐라 님은 생선 비늘인 줄 알아요. 그렇게 둬요.' },
        { say: '꽃잎 아니었어요?', tier: 'meh', face: 'calm', answer: '꽃잎이에요. {me} 님 앞에서만 아니고요.' },
      ],
    },
    {
      id: 'call-practice',
      when: { love: 'dating' },
      open: '{me} 님 이름을 혼자 연습해요. 제일 다정하게 들리는 소리로요.',
      replies: [
        { say: '지금 한번 불러 줘요', tier: 'great', face: 'shy', answer: ['…{me} 님.', '…됐어요? 귀가 뜨거워요. 오늘은 여기까지요.'] },
        { say: '저도 연습할래요', tier: 'good', face: 'smile', answer: '그럼 서로 들려줘요. 개울이 심판이에요.' },
        { say: '연습까지 해요?', tier: 'meh', face: 'calm', answer: '소중한 건 연습해요. 이름은 특히요.' },
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
        { say: '저도 도울게요!', tier: 'great', remember: 'storm-help', face: 'wow', answer: ['고마워요. 끈은 느슨하게요.', '나무도 숨 쉬어야 해요. 꽉 묶으면 오히려 부러져요.'] },
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
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '물빛이 너무 반짝여서 눈이 부셔요. 오늘은 열매가 햇빛을 실컷 먹겠어요.',
      replies: [
        { say: '그늘에서 같이 쉬어요', tier: 'great', face: 'smile', answer: ['살구나무 아래가 제일 시원해요.', '{me} 님 자리는 늘 비워 둬요. 거기요.'] },
        { say: '빨래 말리기 좋겠다', tier: 'good', face: 'laugh', answer: '저도 아까 널었어요. 바람이 금방 가져가요.' },
        { say: '너무 더워요', tier: 'meh', face: 'calm', answer: '개울에 발 담가요. 물이 열을 데려가요.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '구름이 낮게 깔렸어요. 저 위로 올라가면 해가 그대로 있을 텐데요.',
      replies: [
        { say: '올라가 본 것처럼 말하네요', tier: 'great', face: 'shy', answer: ['…그런 것 같다는 얘기예요.', '구름 위는 하얀 들판 같다고, 어디서 들었어요. 어디서요.'] },
        { say: '흐린 날도 좋아요', tier: 'good', face: 'smile', answer: '저도요. 잎이 쉬어 가는 날이에요.' },
        { say: '비 올까요?', tier: 'meh', face: 'think', answer: '아직은 물 냄새가 약해요. 저녁까진 괜찮아요.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '살구꽃이 개울에 떨어져 떠내려가요. 작은 배들 같아요.',
      replies: [
        { say: '어디까지 갈까요?', tier: 'great', face: 'think', answer: ['바다까지요.', '가는 길에 누군가 하나쯤 건져서 웃으면 좋겠어요.'] },
        { say: '꽃이 아까워요', tier: 'good', face: 'smile', answer: '꽃이 져야 열매가 와요. 기다리는 것도 봄이에요.' },
        { say: '꽃가루 때문에 재채기 나요', tier: 'meh', face: 'sorry', answer: '아, 미안해요. 원두막 쪽은 덜해요.' },
      ],
    },
    {
      id: 'op-summer-dusk',
      when: { season: 'summer', time: 'evening' },
      open: '여름 저녁엔 반딧불이 개울을 따라 날아요. 물 위에 별이 흐르는 것 같아요.',
      replies: [
        { say: '조용히 같이 봐요', tier: 'great', face: 'calm', answer: ['…네.', '말 안 해도 돼요. 반딧불은 조용한 사람한테 와요.'] },
        { say: '한 마리 잡아 볼까요?', tier: 'meh', face: 'sorry', answer: '보기만 해요. 잡으면 빛이 금방 꺼져요.' },
        { say: '물에 비쳐서 두 배네요', tier: 'good', face: 'smile', answer: '맞아요. 물은 좋은 걸 두 번 보여 줘요.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '사과에 이름표를 붙여 따는 중이에요. 이 줄은 다 {me} 님 몫이에요.',
      replies: [
        { say: '하나 같이 따요', tier: 'great', face: 'smile', answer: ['살짝 비틀어서요. 그렇죠.', '처음 딴 사과는 제일 오래 기억에 남아요.'] },
        { say: '그렇게 많이요?', tier: 'good', face: 'shy', answer: '나눠 드리면 되죠. {me} 님 이름으로요.' },
        { say: '배는 없어요?', tier: 'meh', face: 'calm', answer: '배는 다음 주예요. 서두르면 덜 달아요.' },
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
      id: 'op-evening',
      when: { time: 'evening' },
      open: '노을이 물에 비쳐서 개울이 두 갈래로 보여요. 진짜 물길은 이쪽이에요.',
      replies: [
        { say: '하쿠는 늘 길을 아네요', tier: 'great', face: 'shy', answer: ['물길만요.', '사람 사이 길은 아직 서툴러요. {me} 님한테 배우는 중이에요.'] },
        { say: '노을 예쁘네요', tier: 'good', face: 'smile', answer: '네. 하루가 이름을 부르고 가는 것 같아요.' },
        { say: '배고파요', tier: 'meh', face: 'laugh', answer: '주먹밥 있어요. 늘 하나는 남겨 둬요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤엔 물소리가 제 옛 이름을 부르는 것 같아요. 끝까지는 안 들려요.',
      replies: [
        { say: '같이 들어 볼게요', tier: 'great', remember: 'river-dream', face: 'calm', answer: ['…쉿.', '지금, 낮게 흐르는 소리요. 들렸어요?'] },
        { say: '무섭지 않아요?', tier: 'good', face: 'think', answer: '아니요. 그리운 쪽에 가까워요.' },
        { say: '바람 소리 아니에요?', tier: 'meh', face: 'calm', answer: '그럴지도요. 바람도 물길을 따라가요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날이에요. 개울에 작은 등을 띄울 거예요. 같이 띄울래요?',
      replies: [
        { say: '소원 하나 적어서요', tier: 'great', face: 'smile', answer: ['좋아요. 소원 옆에 이름도 적어요.', '물이 주인을 찾아 줘요. 꼭이요.'] },
        { say: '과일 바구니도 나눠요?', tier: 'good', answer: '네, 하나 챙겨 뒀어요. {me} 님 몫이에요.' },
        { say: '등이 가라앉으면요?', tier: 'meh', face: 'calm', answer: '안 가라앉아요. 오늘은 물이 기분이 좋거든요.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me} 님, 생일 축하해요. 오늘은 이름을 세 번 불러 드릴게요.',
      replies: [
        { say: '세 번이나요?', tier: 'great', face: 'shy', answer: ['{me} 님. {me} 님. …{me} 님.', '됐어요. 이제 일 년 내내 길을 안 잃을 거예요.'] },
        { say: '복숭아도 있어요?', tier: 'good', face: 'laugh', answer: '제일 단 걸로 남겨 뒀어요. 이름표도 붙였고요.' },
        { say: '생일 별거 아니에요', tier: 'meh', face: 'calm', answer: '이름이 처음 불린 날이잖아요. 별거예요.' },
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
        { say: '하쿠 거름 비결 알려 줘요', tier: 'great', face: 'think', answer: ['약초를 삭혀요.', '츠나데 님께 배운 비율이 있어요. 손바닥으로 재요. 엄격하게요.'] },
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
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님, 오늘 걸음이 가볍네요. 개울도 따라서 빨리 흘러요.',
      replies: [
        { say: '좋은 일이 있었어요', tier: 'great', face: 'smile', answer: ['그럼 들려줘요. 천천히요.', '좋은 이야기는 물에 띄워 두면 오래 가요.'] },
        { say: '하쿠 보러 와서요', tier: 'good', face: 'shy', answer: '…그 말은 반칙이에요. 사과 하나 드릴게요.' },
        { say: '그냥 그래요', tier: 'meh', face: 'calm', answer: '그냥 그런 날이 좋은 날일 때가 많아요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘 표정이 조금 지쳐 보여요. 원두막에서 쉬어 가요.',
      replies: [
        { say: '조금만 앉아 있을게요', tier: 'great', remember: 'rice-ball', face: 'calm', answer: ['네. 주먹밥 하나 옆에 둘게요.', '말은 안 해도 돼요. 다 먹으면 조금 나아져 있을 거예요.'] },
        { say: '괜찮아요', tier: 'good', face: 'think', answer: '괜찮다고 하는 얼굴도 다 보여요. 물처럼요.' },
      ],
    },
    {
      id: 'op-news-legend',
      when: { news: 'legend' },
      open: '마을 소식에 옛 전설이 실렸대요. 강에 사는 흰 용 이야기요.',
      replies: [
        { say: '하쿠 이야기 같아요', tier: 'great', face: 'shy', answer: ['…저요?', '저는 과수원 주인이에요. 그냥요. 그냥.'] },
        { say: '용이 진짜 있을까요?', tier: 'good', face: 'think', answer: '있다면 아마 조용히 살 거예요. 과일 키우면서요.' },
        { say: '전설은 다 지어낸 거예요', tier: 'meh', face: 'calm', answer: '그래도 누군가는 이름을 기억해 둔 거예요.' },
      ],
    },
    {
      id: 'op-news-wedding',
      when: { news: 'wedding' },
      open: '마을에 혼례 소식이 있어요. 두 이름이 나란히 불리는 날이에요.',
      replies: [
        { say: '나란히 불리면 좋겠다', tier: 'great', face: 'shy', answer: ['…네.', '두 물줄기가 만나면 더 깊어져요. 축하 바구니를 보내야겠어요.'] },
        { say: '과일 바구니 보내요?', tier: 'good', face: 'smile', answer: '복숭아 두 알을 꼭 붙여서요. 떨어지지 않게요.' },
        { say: '결혼은 아직 멀었어요', tier: 'meh', face: 'calm', answer: '물은 서두르지 않아요. 괜찮아요.' },
      ],
    },
    {
      id: 'op-news-museum',
      when: { news: 'museum' },
      open: '박물관에 새 물건이 들어왔대요. 오래된 것엔 누군가의 이름이 남아 있어요.',
      replies: [
        { say: '같이 보러 가요', tier: 'great', face: 'smile', answer: ['좋아요.', '이름표를 오래 읽을 거예요. 기다려 줄 수 있죠?'] },
        { say: '강에서 나온 것도 있대요', tier: 'good', face: 'think', answer: '…그럼 꼭 가 봐야겠어요. 낯익을지도 몰라요.' },
        { say: '오래된 건 지루해요', tier: 'meh', face: 'calm', answer: '지루한 만큼 오래 버틴 거예요. 대단하죠.' },
      ],
    },
    {
      id: 'op-friend-birthday',
      when: { friendNews: 'birthday' },
      open: '오늘 생일인 친구가 있대요. 이름표 붙인 과일을 하나 보내려고요.',
      replies: [
        { say: '제가 전해 줄게요', tier: 'great', face: 'smile', answer: ['고마워요.', '받는 사람 이름을 한 번 불러 주고 건네요. 그게 제 방식이에요.'] },
        { say: '하쿠는 다 챙기네요', tier: 'good', face: 'shy', answer: '이름을 아는 사람은 다요. 그게 전부예요.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다에 다녀왔다면서요. 강물은 다 거기로 가요. 잘 있던가요?',
      replies: [
        { say: '넓고 깊었어요', tier: 'great', face: 'think', answer: ['그렇죠.', '거기선 모든 강 이름이 섞인대요. 그래서 조금 무서워요.'] },
        { say: '하쿠도 같이 가요', tier: 'good', face: 'smile', answer: '저는 개울이 좋아요. 대신 돌아오면 이야기 들려줘요.' },
        { say: '배멀미 했어요', tier: 'meh', face: 'sorry', answer: '저런. 생강 넣은 꽃차 드릴게요.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '홀에서 잃었다고요. 괜찮아요, {me} 님. 이름을 잃은 건 아니잖아요.',
      replies: [
        { say: '그 말 들으니 괜찮아요', tier: 'great', face: 'smile', answer: ['다행이에요.', '잃은 건 물처럼 다른 데서 돌아오기도 해요. 사과 받아요.'] },
        { say: '다음엔 딸 거예요', tier: 'meh', face: 'sorry', answer: '…너무 오래 머물진 마요. 거긴 시간이 이상하게 흘러요.' },
        { say: '조금 속상해요', tier: 'good', face: 'calm', answer: '그럼 오늘은 징검다리에 앉아요. 물이 다 들어 줘요.' },
      ],
    },
    {
      id: 'op-museum-recent',
      when: { recent: 'museum' },
      open: '박물관에 기증했다면서요. {me} 님 이름이 거기 오래 남겠네요.',
      replies: [
        { say: '하쿠 이름도 남겨 줄까요?', tier: 'great', face: 'shy', answer: ['…아직은요.', '제 이름을 다 찾으면, 그때 같이 적어요.'] },
        { say: '뿌듯해요', tier: 'good', face: 'smile', answer: '그럴 만해요. 남는다는 건 좋은 일이에요.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '{other} 님하고 조금 서먹해졌어요. 흐린 물은 기다리면 가라앉는데요.',
      replies: [
        { say: '이름 불러 주면 풀릴 거예요', tier: 'great', face: 'think', answer: ['…맞아요.', '내일 아침에 제일 먼저 이름을 불러 드릴게요. 복숭아랑요.'] },
        { say: '무슨 일 있었어요?', tier: 'good', face: 'sorry', answer: '나뭇가지를 꺾었다고 제가 좀 굳은 얼굴을 했어요.' },
        { say: '내버려 둬요', tier: 'meh', face: 'calm', answer: '그럼 물이 막혀요. 조금만 기다렸다 갈게요.' },
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
      id: 'op-with-nilah',
      when: { with: 'nilah' },
      open: '{other} 님이랑 원두막에서 우유에 복숭아를 띄워 먹고 있었어요. 같이 해요.',
      replies: [
        { say: '저도 한 그릇이요!', tier: 'great', face: 'laugh', answer: ['네. 복숭아는 제가, 우유는 {other} 님이요.', '물은 안 끼얹기로 약속받았어요. 오늘만요.'] },
        { say: '둘이 사이좋네요', tier: 'good', face: 'shy', answer: '이웃이니까요. 서로 모자란 걸 바꿔요.' },
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
    {
      id: 'op-nasera',
      when: { bond: 'nasera' },
      open: '{other} 님 만났어요? 오늘 낸 배를 보고 고개를 두 번 끄덕였대요.',
      replies: [
        { say: '두 번이면 칭찬이에요', tier: 'great', face: 'wow', answer: ['…정말요? 한 번은 본 적 있는데.', '오늘은 배나무한테 이름을 크게 불러 줘야겠어요.'] },
        { say: '값은 잘 받았어요?', tier: 'good', face: 'smile', answer: '정직하게요. 그분은 늘 정직해요.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '{other} 님 빵집 들렀어요? 제 살구가 타르트가 됐을 거예요.',
      replies: [
        { say: '벌써 다 팔렸어요', tier: 'great', face: 'smile', answer: ['…다행이에요.', '살구들도 좋은 데로 갔네요. 내일은 더 갖다 드릴게요.'] },
        { say: '아직 문 안 열었던데요', tier: 'good', face: 'laugh', answer: '그럴 줄 알았어요. 살구는 그늘에 두고 왔어요.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '{other} 님 뵈었어요? 요즘 밤을 새우신대요. 박하를 더 갖다 드려야겠어요.',
      replies: [
        { say: '주먹밥도 같이요', tier: 'great', face: 'smile', answer: ['네. 남 챙기는 분은 누가 챙겨 드려야 해요.', '{me} 님이 전해 주면 더 잘 드실 거예요.'] },
        { say: '하쿠도 좀 쉬어요', tier: 'good', face: 'shy', answer: '…저요? 저는 괜찮아요. 고마워요.' },
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
      id: 'cb-stream',
      when: { mem: 'stream-sit' },
      use: 'stream-sit',
      open: '징검다리 그 돌, {me} 님 자리로 정했어요. 오늘 앉아 갈래요?',
      replies: [
        { say: '제 자리가 생겼네요', tier: 'great', face: 'shy', answer: ['네. 다른 사람은 옆 돌에 앉으래요.', '물한테도 말해 뒀어요. 그 돌은 안 적시기로요.'] },
        { say: '오늘은 물이 높네요', tier: 'good', face: 'think', answer: '어제 비가 왔거든요. 발은 들고 앉아요.' },
      ],
    },
    {
      id: 'cb-riceball',
      when: { mem: 'rice-ball' },
      use: 'rice-ball',
      open: '지난번 주먹밥, 짜지 않았어요? 오늘은 매실을 하나 넣어 봤어요.',
      replies: [
        { say: '딱 좋았어요', tier: 'great', face: 'smile', answer: ['다행이에요.', '그럼 매실 든 건 {me} 님 거, 안 든 건 제 거예요.'] },
        { say: '매실은 시어요', tier: 'good', face: 'laugh', answer: '조금요. 신 게 기운을 깨워 줘요. 한 입만요.' },
      ],
    },
    {
      id: 'cb-bathhouse',
      when: { mem: 'old-work' },
      use: 'old-work',
      open: '목욕탕 얘기 듣고 나서 마을 목욕탕 가 봤어요? 거긴 이름을 안 뺏어요.',
      replies: [
        { say: '하쿠도 같이 가요', tier: 'great', face: 'shy', answer: ['…큰 탕은 아직 좀 그래요.', '대신 끝나고 나오면 과일 우유 사 드릴게요.'] },
        { say: '거기 사장님 다정해요', tier: 'good', face: 'smile', answer: '네. 엄한 주인만 있는 건 아니더라고요.' },
      ],
    },
    {
      id: 'cb-sky',
      when: { mem: 'sky-joke' },
      use: 'sky-joke',
      open: '하늘 나는 꿈 얘기, 아무한테도 안 했죠? 닐라 님이 놀릴 거예요.',
      replies: [
        { say: '우리 둘만 알아요', tier: 'great', face: 'shy', answer: ['…고마워요.', '그럼 언젠가 꿈속에서 {me} 님도 태워 줄게요. 꿈속에서요.'] },
        { say: '벌써 말했는데요', tier: 'meh', face: 'sorry', answer: '…그래서 아까 날개 펴 보라고 하셨구나.' },
      ],
    },
    {
      id: 'cb-train',
      when: { mem: 'water-train' },
      use: 'water-train',
      open: '그 기차 얘기요. 어젯밤 개울 위로 아주 작은 기적 소리가 났어요.',
      replies: [
        { say: '마중 나가 볼까요?', tier: 'great', face: 'think', answer: ['아니요. 이번엔 안 탈 거예요.', '타면 돌아오는 길이 없잖아요. 여기가 좋아요.'] },
        { say: '물새 소리 아니에요?', tier: 'good', face: 'smile', answer: '그럴지도요. 물새도 기차처럼 줄 지어 가요.' },
      ],
    },
    {
      id: 'cb-storm',
      when: { mem: 'storm-help' },
      use: 'storm-help',
      open: '폭풍 날 같이 지지대 묶은 묘목, 하나도 안 쓰러졌어요.',
      replies: [
        { say: '다행이에요!', tier: 'great', face: 'smile', answer: ['네. {me} 님이 묶은 끈이 제일 반듯해요.', '그 나무 이름 끝에 {me} 님 글자 하나 넣었어요.'] },
        { say: '끈 풀어 줄까요?', tier: 'good', face: 'think', answer: '한 달만 더 두고요. 뿌리가 자리 잡을 때까지요.' },
      ],
    },
    {
      id: 'cb-spring',
      when: { mem: 'dawn-spring' },
      use: 'dawn-spring',
      open: '그 새벽 샘에 다시 가 봤어요. 물소리가 {me} 님 걸음 소리를 기억하더라고요.',
      replies: [
        { say: '또 같이 가요', tier: 'great', face: 'smile', answer: '네. 이번엔 주먹밥 싸 갈게요. 해 뜨는 것까지 봐요.' },
        { say: '물이 어떻게 기억해요?', tier: 'good', face: 'think', answer: '물은 다 기억해요. 잊은 척할 뿐이에요.' },
      ],
    },
    {
      id: 'cb-shoe',
      when: { mem: 'lost-shoe' },
      use: 'lost-shoe',
      open: '분홍 신발 얘기 했죠. 그 아이 이름이 입안에서 맴돌아요. 거의 다 왔어요.',
      replies: [
        { say: '떠오르면 꼭 알려 줘요', tier: 'great', face: 'think', answer: ['네.', '그 아이가 제 이름을 불러 줬던 것 같아요. 그래서 둘 다 찾고 싶어요.'] },
        { say: '그 아이도 기억할까요?', tier: 'good', face: 'shy', answer: '…그랬으면 좋겠어요. 물에 빠진 일은 잘 안 잊히니까요.' },
      ],
    },
    {
      id: 'cb-page',
      when: { mem: 'lost-page' },
      use: 'lost-page',
      open: '찢긴 쪽 말이에요. 도서관 책장 뒤에서 반만 찾았어요. 강 이름 앞 글자만요.',
      replies: [
        { say: '반이라도 다행이에요', tier: 'great', face: 'smile', answer: ['네. 나머지 반은…', '{me} 님이 불러 줄 때 같이 돌아올 것 같아요.'] },
        { say: '뭐라고 적혀 있었어요?', tier: 'good', face: 'shy', answer: '…아직 비밀이에요. 다 찾으면 제일 먼저 말할게요.' },
      ],
    },
    {
      id: 'cb-songpyeon',
      when: { mem: 'songpyeon' },
      use: 'songpyeon',
      open: '송편 빚기로 했죠. 솔잎을 따 왔어요. 반달 모양, 누가 더 예쁜지 봐요.',
      replies: [
        { say: '제가 이길 거예요', tier: 'great', face: 'laugh', answer: ['그럼 진 사람이 설거지예요.', '…제 건 또 너무 반듯하네요. 졌어요.'] },
        { say: '모양이 다 터졌어요', tier: 'good', face: 'smile', answer: '터진 게 제일 맛있어요. 소가 먼저 나오거든요.' },
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
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '{me} 님 방에서 보낸 저녁, 창가에 물그릇 두고 온 거 아직 있어요?',
      replies: [
        { say: '매일 물 갈아 줘요', tier: 'great', remember: 'date-talk', face: 'shy', answer: ['…그럼 저도 매일 거기 비치는 거네요.', '농담이에요. 반은요.'] },
        { say: '꽃 한 송이 꽂아 뒀어요', tier: 'good', remember: 'date-talk', face: 'smile', answer: '좋아요. 물그릇이 덜 외롭겠네요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '이름을 묻는 사람',
      hint: '한 번 이야기를 나누면 하쿠가 이름부터 물어봐요.',
      need: { days: 1 },
      scene: [
        '강물 과수원 입구, 개울 소리가 낮게 깔린 아침.',
        '하쿠가 물뿌리개를 내려놓고 고개를 숙인다.',
        '"처음 뵙네요. 하쿠예요. 과수원을 돌보고 있어요."',
        '"이름을 알려 주시겠어요? 저는 이름을 꼭 기억해요."',
        '대답을 듣자 그가 그 이름을 작게 한 번 따라 부른다.',
        '"…{me} 님. 좋은 이름이에요. 부르기 편해요."',
        '그가 가까운 살구나무 줄기에 손을 얹는다.',
        '"이제 이 나무들도 알 거예요. 걸음 소리랑 같이요."',
        '"사실 저는 제 이름을 반쯤 잊었어요. 하쿠는 짧게 줄인 거예요."',
        '"그래서 남의 이름만큼은 잊지 않으려고요. 잘 부탁해요."',
      ],
      replies: [
        { say: '하쿠 님 이름도 기억할게요', tier: 'great', face: 'smile', answer: ['…고마워요.', '서로 불러 주면 길을 잃지 않아요. 그런 걸로 해요.'] },
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
        '하쿠가 먼저 와 있다. 소매 끝이 이슬에 젖어 있다.',
        '"와 줬네요, {me} 님. …조금 놀랐어요. 진짜 올 줄은요."',
        '그가 무릎을 꿇고 손바닥에 물을 받는다.',
        '"과수원 개울은 여기서 시작돼요. 작지만 쉬지 않아요."',
        '"저도 어딘가에서 이렇게 시작됐을 거예요. 기억은 안 나지만요."',
        '샘물이 돌에 부딪혀 짧은 소리를 낸다. 그가 귀를 기울인다.',
        '"…방금 그 소리요. 제 이름 첫 소리랑 닮았어요."',
        '"물빛도 생각났어요. 해 질 녘처럼 누렇게 맑은, 호박빛이요."',
        '"…같이 와 줘서 고마워요. 혼자 오면 너무 조용하거든요."',
      ],
      replies: [
        { say: '하쿠의 시작도 찾아봐요', tier: 'great', remember: 'dawn-spring', face: 'shy', answer: ['…네.', '{me} 님이랑이면 찾을 수 있을 것 같아요. 한 조각씩요.'] },
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
        '둘이 징검다리에 앉아 말없이 복숭아를 먹는다.',
        '"…생각났어요. 이 단맛을 전에도 누구랑 나눠 먹었어요."',
        '"물에 빠진 어린아이요. 분홍 신발을 쫓아 들어왔던."',
        '"그 아이를 얕은 데로 데려다줬어요. 물이요. …아니, 제가요."',
        '"그 아이가 울면서 제 이름을 불렀어요. 끝까지요."',
        '"그 소리가 지금 조금 들려요. {me} 님 덕분에요."',
      ],
      replies: [
        { say: '같이 먹으니 더 달아요', tier: 'great', remember: 'peach-share', face: 'smile', answer: ['네.', '이 맛은 이름이랑 같이 오래 남을 거예요. 이번엔 안 잊어요.'] },
        { say: '그 아이는 무사했어요?', tier: 'good', remember: 'peach-share', face: 'think', answer: ['네. 맨발로 웃으면서 뛰어갔어요.', '…그 웃음도 이제 기억나요.'] },
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
        '물 위로 노을이 길게 눕는다. 그가 한참 말이 없다.',
        '"요즘 가끔, 제가 흐려지는 것 같아요. 물에 번진 글씨처럼요."',
        '"이름을 다 잊으면 저도 물에 섞여 버릴까 봐서요."',
        '"약속해 줬죠. 제 이름이 흐려지면 불러 주겠다고."',
        '{me} 님이 그의 이름을 부르자, 그가 천천히 고개를 든다.',
        '"…방금, 한 글자 더 돌아왔어요. 물이 비늘처럼 반짝였어요."',
        '"그 말을 듣고 처음으로, 잊는 게 덜 무서워졌어요."',
      ],
      replies: [
        { say: '하쿠. 여기 있어요', tier: 'great', remember: 'white-scale', face: 'shy', answer: ['…네. 들렸어요.', '물길 끝까지 들렸어요. 다시는 안 흐려질 것 같아요.'] },
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
        '"{me} 님, 기억이 하나 더 났어요. 좋은 건 아니에요."',
        '"제가 흐르던 강은 오래전에 메워졌어요. 위로 길이 났대요."',
        '"그래서 돌아갈 데가 없었어요. 계속 흘러만 다녔어요."',
        '"목욕탕에서도, 기차에서도, 늘 어딘가로 가야 했어요."',
        '그가 개울물을 한 줌 떠서 다시 흘려보낸다.',
        '"물은 늘 어딘가로 가야 한다고 생각했어요."',
        '"그런데 요즘은 이 과수원에, {me} 님 곁에 고이고 싶어요."',
        '"…꽃이라도 한 다발 받으면, 그땐 말을 잘 못 할 거예요."',
        '그가 귀끝까지 붉어진 채 고개를 돌린다.',
      ],
      replies: [
        { say: '여기 머물러요, 하쿠', tier: 'great', face: 'shy', answer: ['…네.', '그 말이면 강도 멈출 수 있어요. 여기가 제 연못이에요.'] },
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
        '"{me} 님이 불러 줄 때마다, 잊었던 이름이 한 글자씩 돌아왔어요."',
        '"샘에서 첫 소리, 복숭아 맛에서 그 아이, 노을에서 비늘."',
        '"그리고 오늘, 마지막 글자가 돌아왔어요. 여기서요."',
        '그가 몸을 숙여 {me} 님 귓가에 아주 긴 이름을 속삭인다.',
        '호박빛 물이 흐르던 강의 이름. 물소리처럼 길고 맑다.',
        '"…이건 {me} 님한테만 들려줄게요. 다른 데선 하쿠예요."',
        '개울이 한순간 반짝인다. 흰 비늘 같은 빛이 물 위로 흐른다.',
        '"이름을 찾았는데, 이상하게 떠나고 싶지가 않아요."',
        '"이름을 돌려준 사람 곁에 있는 게, 강이 바다에 닿는 거래요."',
        '"…반지처럼 둥근 약속이면, 물도 잊지 않을 거예요."',
        '"평생 {me} 님 이름을 부르고 싶어요. 매일 아침, 처음으로요."',
      ],
      replies: [
        { say: '평생 불러 줄게요', tier: 'great', face: 'shy', answer: ['…네.', '그럼 저는 평생 대답할게요. 매일요. 두 이름 다로요.'] },
        { say: '천천히 같이 걸어요', tier: 'good', face: 'smile', answer: '네. 물은 서두르지 않아요. 우리도요.' },
        { say: '그래도 하쿠가 좋아요', tier: 'meh', face: 'think', answer: '…{me} 님이 그렇게 부르면, 그게 제 이름이에요.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분히 했어요. 내일 또 이름 불러 드릴게요.',
    '나무들이 기다려요. 또 봬요, {me} 님.',
    '…또 오셨네요. 복숭아 한 조각 가져가요. 그냥요.',
    '개울가에 있을게요. 찾으면 이름만 불러 주세요.',
    '말이 다 떨어졌어요. 대신 귤 하나 드릴게요.',
    '{me} 님, 돌아가는 길은 물소리를 따라가요. 안 헤매요.',
    '오늘은 여기까지요. 주먹밥은 주머니에 넣어 뒀어요.',
  ],
};
