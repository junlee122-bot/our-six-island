// 그웬 — 보송 미용실 원장 (원작: 리그 오브 레전드 그웬). 밝고 다정한 해요체, 칭찬이
// 끝이 없다. 바느질 인형이었다가 사람이 되어 세상 모든 게 처음이고 신기하다(단추 눈
// 시절 농담, 인형일 땐 냄새를 몰랐음). 실밥은 못 참음("싹둑!"), 가위 이름은 싹둑이,
// 바늘과 실, 이졸데 할머니에게 배운 손기술, 드라이어 김은 '착한 안개'. 쓰레쉬 가게
// 초록 안개는 살짝 경계(가볍게). 잔나·메르시·봉미선과 얽힌다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const GWEN_TALK: NpcTalkBook = {
  npc: 'gwen',
  memories: {
    'scissors-name': '가위 싹둑이에게 인사했어요',
    'new-wonder': '처음 보는 것이 신기하다고 했어요',
    'thread-ok': '실밥을 떼어 줘서 고맙다고 했어요',
    'isolde-story': '이졸데 할머니 이야기를 들었어요',
    'good-mist': '드라이어 김이 착한 안개라고 맞장구쳤어요',
    'green-mist': '초록 안개는 드라이어로 막자고 했어요',
    'button-eyes': '단추 눈 시절 이야기를 들었어요',
    'fav-smell': '비 냄새가 좋다고 했어요',
    'braid-me': '땋은 머리를 해 보고 싶다고 했어요',
    'ribbon-bonus': '파마 값 대신 리본 이야기를 들었어요',
    'praise-back': '그웬도 예쁘다고 말해 줬어요',
    'camellia-love': '동백꽃이 좋다고 했어요',
    'strawberry': '딸기 우유색이 귀엽다고 했어요',
    'sunset-thread': '노을 색 실을 함께 찾았어요',
    'camellia-pin': '동백꽃을 선물했어요',
    'taste-heard': '내 취향으로 리본을 떠 준대요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일 머리를 해 주기로 했어요',
  },
  talks: [
    {
      id: 'scissors-name',
      open: ['{me} 님, 인사해요. 제 가위 싹둑이예요!', '이름 불러 주면 더 잘 잘려요. 진짜예요.'],
      replies: [
        { say: '안녕, 싹둑이!', tier: 'great', remember: 'scissors-name', face: 'laugh', answer: '와, 싹둑이가 반짝했어요! 방금 봤죠? 기분 좋대요.' },
        { say: '가위에도 이름이 있어?', tier: 'good', face: 'smile', answer: '그럼요! 매일 같이 일하는 친구인걸요. 바늘은 콕콕이예요.' },
        { say: '그냥 가위 아니야?', tier: 'meh', face: 'sorry', answer: '쉿, 싹둑이 들어요! …괜찮아요, 금방 풀려요.' },
      ],
    },
    {
      id: 'new-wonder',
      open: [
        '{me} 님, 오늘 아침에 이슬을 처음 만져 봤어요.',
        '차갑고 동글동글하고… 세상엔 아직 처음인 게 너무 많아요!',
      ],
      replies: [
        { say: '나도 같이 신기해할래', tier: 'great', remember: 'new-wonder', face: 'wow', answer: ['정말요? 그럼 내일은 둘이 처음인 걸 찾아봐요!', '신기한 건 둘이 보면 두 배 신기하거든요.'] },
        { say: '이슬은 금방 마르던데', tier: 'good', remember: 'new-wonder', face: 'think', answer: '그래서 더 예쁜가 봐요. 금방 사라지는 건 꼭 오래 봐 둬요.' },
        { say: '그냥 물방울이잖아', tier: 'meh', face: 'calm', answer: '그냥 물방울도 처음이면 보석이에요. 헤헤.' },
      ],
    },
    {
      id: 'loose-thread',
      open: ['어머, {me} 님 소매에 실밥이요! 가만있어 봐요.', '…싹둑! 됐어요. 이제 완벽해요.'],
      replies: [
        { say: '고마워, 감쪽같다', tier: 'great', remember: 'thread-ok', face: 'laugh', answer: '헤헤, 실밥은 보이면 못 참아요. 남의 옷이어도요!' },
        { say: '언제 봤어?', tier: 'good', face: 'smile', answer: '들어올 때부터요. 눈이 자꾸 그쪽으로 가더라고요.' },
        { say: '그 정도는 괜찮은데', tier: 'meh', face: 'sorry', answer: '저는 안 괜찮아요! 미안해요, 손이 먼저 가요.' },
      ],
    },
    {
      id: 'isolde',
      open: ['제 손재주는 다 이졸데 할머니한테 배웠어요.', '한 땀 한 땀, 서두르지 말라고 하셨어요.'],
      replies: [
        { say: '할머니 이야기 더 해 줘', tier: 'great', remember: 'isolde-story', face: 'smile', answer: ['할머니 손은 늘 따뜻했어요. 바늘보다 먼저요.', '제 첫 실밥도 할머니가 정리해 주셨어요.'] },
        { say: '그래서 손이 빠르구나', tier: 'good', face: 'laugh', answer: '빠른 게 아니라 꼼꼼한 거예요! 할머니가 들으면 혼내요.' },
        { say: '바느질은 어려워', tier: 'meh', face: 'think', answer: '처음엔 다 그래요. 저도 손가락 많이 찔렸어요.' },
      ],
    },
    {
      id: 'good-mist',
      open: '드라이어 틀면 김이 몽글몽글 나오죠? 저는 이걸 착한 안개라고 불러요.',
      replies: [
        { say: '따뜻해서 착한 안개구나', tier: 'great', remember: 'good-mist', face: 'wow', answer: '맞아요! 딱 알아주시네요. 따뜻한 안개는 다 착해요.' },
        { say: '나쁜 안개도 있어?', tier: 'good', face: 'think', answer: '음… 있어요. 차갑고 초록색인 거요. 그건 다음에 얘기해요.' },
        { say: '그냥 김이잖아', tier: 'meh', face: 'calm', answer: '김에도 이름이 있으면 더 다정해져요. 그런 거예요.' },
      ],
    },
    {
      id: 'green-mist',
      open: ['쓰레쉬 씨 가게 앞엔 초록 안개가 깔려요.', '나쁜 분은 아닌데… 그 안개는 좀 으스스해요.'],
      replies: [
        { say: '드라이어로 막자!', tier: 'great', remember: 'green-mist', face: 'laugh', answer: '그쵸! 착한 안개로 밀어내면 돼요. 미용실 앞은 제가 지켜요.' },
        { say: '쓰레쉬 씨는 친절하던데', tier: 'good', face: 'think', answer: '네, 인사는 잘 받아 줘요. 그래도 랜턴은 좀 멀리서 볼래요.' },
        { say: '난 하나도 안 무서워', tier: 'meh', face: 'wow', answer: '와, 용감해요! 저는 아직 지나갈 때 걸음이 빨라져요.' },
      ],
    },
    {
      id: 'button-eyes',
      open: ['옛날엔 제 눈이 단추였어요. 진짜로요!', '그래서 지금은 보이는 게 다 예뻐요.'],
      replies: [
        { say: '지금 눈이 더 반짝여', tier: 'great', remember: 'button-eyes', face: 'shy', answer: '어머, 그런 말은 처음 들어요! 단추 시절엔 못 들었을 말이에요.' },
        { say: '단추 눈도 귀여웠겠다', tier: 'good', remember: 'button-eyes', face: 'laugh', answer: '귀여웠죠! 근데 윙크는 못 했어요. 지금은 할 수 있어요, 봐요!' },
        { say: '농담이지?', tier: 'meh', face: 'smile', answer: '헤헤, 믿거나 말거나예요. 저는 믿어요.' },
      ],
    },
    {
      id: 'smells',
      open: ['인형이던 시절엔 냄새를 몰랐어요.', '{me} 님은 무슨 냄새가 제일 좋아요?'],
      replies: [
        { say: '비 오는 날 흙냄새', tier: 'great', remember: 'fav-smell', face: 'wow', answer: '저도요! 처음 맡았을 때 한참 서 있었어요. 우리 똑같아요!' },
        { say: '샴푸 냄새', tier: 'good', face: 'laugh', answer: '미용실 냄새네요! 그럼 매일 와야겠다. 헤헤.' },
        { say: '별로 신경 안 써', tier: 'meh', face: 'think', answer: '그럼 다음에 같이 맡아 봐요. 하나씩 좋아질 거예요.' },
      ],
    },
    {
      id: 'braid',
      open: '{me} 님 머리, 땋으면 엄청 예쁠 것 같아요. 해 봐도 돼요?',
      replies: [
        { say: '응, 맡길게', tier: 'great', remember: 'braid-me', face: 'laugh', answer: '와아! 세 갈래로 한 땀 한 땀. 다 하면 거울 보고 놀라요.' },
        { say: '짧게 자르고 싶은데', tier: 'good', face: 'smile', answer: '짧은 머리도 좋아요! 싹둑이가 신나겠어요.' },
        { say: '지금 그대로가 좋아', tier: 'meh', face: 'calm', answer: '그럼 그대로 예쁘게 빗어만 드릴게요. 그것도 좋아요.' },
      ],
    },
    {
      id: 'misun-ribbon',
      open: ['미선 씨가 또 파마 값 깎아 달래요.', '저는 절대 안 깎아요. 대신 리본을 하나 달아 드려요.'],
      replies: [
        { say: '그게 더 다정하다', tier: 'great', remember: 'ribbon-bonus', face: 'laugh', answer: '그쵸? 값은 그대로, 예쁨은 더! 이게 보송 미용실 규칙이에요.' },
        { say: '조금 깎아 주지', tier: 'good', face: 'think', answer: '한 번 깎으면 매번 깎아야 해요. 리본은 매번 달아 드려도 되고요.' },
        { say: '나도 깎아 줘', tier: 'meh', face: 'sorry', answer: '{me} 님도요? 헤헤, 안 돼요. 리본은 두 개 달아 드릴게요.' },
      ],
    },
    {
      id: 'praise',
      open: ['오늘 {me} 님 눈썹 결이 예뻐요. 아, 귀도 예뻐요.', '…칭찬이 멈추질 않네요. 미안해요!'],
      replies: [
        { say: '그웬도 예뻐', tier: 'great', remember: 'praise-back', face: 'shy', answer: '어, 저요? …칭찬 받는 건 아직 서툴러요. 귀가 뜨거워요.' },
        { say: '계속 해 줘', tier: 'good', face: 'laugh', answer: '좋아요! 손톱도 예쁘고, 웃는 것도 예쁘고, 그리고 또…' },
        { say: '좀 쑥스러워', tier: 'meh', face: 'smile', answer: '쑥스러워하는 것도 예뻐요. 아, 또 했다.' },
      ],
    },
    {
      id: 'flowers',
      open: '미용실 창가에 꽃을 꽂아요. {me} 님은 무슨 꽃이 좋아요?',
      replies: [
        { say: '동백꽃', tier: 'great', remember: 'camellia-love', face: 'wow', answer: '동백! 저도 제일 좋아해요. 빨간 게 꼭 리본 같아요.' },
        { say: '코스모스', tier: 'good', face: 'smile', answer: '코스모스도 좋아요! 바람에 살랑거리는 게 앞머리 같아요.' },
        { say: '꽃은 잘 몰라', tier: 'meh', face: 'think', answer: '그럼 미용실 창가에서 하나씩 알려 드릴게요.' },
      ],
    },
    {
      id: 'strawberry-dye',
      open: '딸기 우유색 염색, 어떨 것 같아요? 요즘 그 색에 빠졌어요.',
      replies: [
        { say: '완전 귀엽겠다', tier: 'great', remember: 'strawberry', face: 'laugh', answer: '그쵸! 먼저 리본부터 그 색으로 떠 볼게요. 기대해요!' },
        { say: '딸기는 먹는 게 좋아', tier: 'good', face: 'smile', answer: '헤헤, 저도 먹는 게 더 좋아요. 사실 그래서 생각났어요.' },
        { say: '너무 튀지 않아?', tier: 'meh', face: 'think', answer: '튀어도 예쁘면 돼요. 그래도 {me} 님은 차분한 색이 어울려요.' },
      ],
    },
    {
      id: 'pocket-heart',
      when: { ch: 3 },
      open: ['앞치마 안쪽에 작은 주머니를 하나 꿰맸어요.', '뭐 넣을지는 아직 비밀이에요. 맞혀 볼래요?'],
      replies: [
        { say: '동백꽃잎?', tier: 'great', face: 'shy', answer: '…어떻게 알았어요? 그날 받은 꽃잎이요. 꼭 넣어 둘래요.' },
        { say: '싹둑이 쉬는 자리?', tier: 'good', face: 'laugh', answer: '헤헤, 싹둑이는 너무 커요. 더 작은 거예요.' },
        { say: '사탕?', tier: 'meh', face: 'smile', answer: '사탕도 좋네요! 그건 다음 주머니에 넣을게요.' },
      ],
    },
    {
      id: 'red-thread',
      when: { love: 'dating' },
      open: '{me} 님, 손 줘 봐요. 새끼손가락에 빨간 실 한 바퀴만 감을게요.',
      replies: [
        { say: '절대 안 풀리게 묶어 줘', tier: 'great', face: 'shy', answer: '이졸데 할머니한테 배운 매듭이에요. 평생 안 풀려요.' },
        { say: '간지러워', tier: 'good', face: 'laugh', answer: '헤헤, 저도 간지러워요. 마음이요.' },
        { say: '실밥 생기면 어떡해?', tier: 'meh', face: 'smile', answer: '그건 제가 싹둑! 해 드려야죠. 매일요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: ['비 와요! {me} 님, 머리 젖었잖아요.', '얼른 앉아요. 착한 안개로 말려 드릴게요.'],
      replies: [
        { say: '비 냄새 좋다', tier: 'great', remember: 'fav-smell', face: 'wow', answer: '그쵸! 인형일 땐 이 냄새를 몰랐어요. 지금은 제일 좋아요.' },
        { say: '고마워, 따뜻하다', tier: 'good', face: 'smile', answer: '부스스해지기 전에 다 말려요. 그래야 예뻐요.' },
        { say: '금방 마를 거야', tier: 'meh', face: 'sorry', answer: '안 돼요! 젖은 채로 다니면 감기 걸려요.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '바람이 너무 세요! 오늘은 다들 머리 포기하는 날이에요.',
      replies: [
        { say: '리본으로 꽉 묶어 줘', tier: 'great', face: 'laugh', answer: '좋아요, 두 번 묶을게요! 잔나 씨처럼 날아가면 안 되니까요.' },
        { say: '미용실은 괜찮아?', tier: 'good', face: 'smile', answer: '창문은 꼭 닫았어요. 싹둑이랑 실 상자도 안쪽에 뒀어요.' },
        { say: '머리 포기할래', tier: 'meh', face: 'sorry', answer: '포기라뇨! 빗 하나만 챙겨요. 들어오면 바로 빗어 드릴게요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: ['눈이에요! 처음 봤을 땐 하늘에서 솜이 터진 줄 알았어요.', '누가 바느질하다 놓쳤나 봐요.'],
      replies: [
        { say: '구름 솜이 터졌나 봐', tier: 'great', face: 'laugh', answer: '그쵸? 그럼 제가 꿰매 드려야겠다. 바늘 큰 거 꺼내야겠어요.' },
        { say: '머리에 눈 앉았어', tier: 'good', face: 'shy', answer: '어디요? 헤헤, 머리핀 같죠? 녹기 전에 봐 둬요.' },
        { say: '추워…', tier: 'meh', face: 'sorry', answer: '얼른 들어와요! 드라이어 켜 둘게요. 착한 안개 바로 나와요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: ['어머, 일찍 오셨네요! 싹둑이 갈아 두는 중이었어요.', '아침 머리는 솔직해요. 어디가 뻗치는지 다 보여요.'],
      replies: [
        { say: '내 뻗친 머리 좀 봐 줘', tier: 'great', face: 'laugh', answer: '여기, 여기, 또 여기! 헤헤, 오 분이면 반듯해져요.' },
        { say: '그웬도 일찍 일어나네', tier: 'good', face: 'smile', answer: '아침이 매일 신기해서요. 늦잠 자면 아깝잖아요.' },
        { say: '아직 졸려', tier: 'meh', face: 'calm', answer: '그럼 머리 감겨 드릴게요. 시원해서 눈이 번쩍 떠져요.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '노을빛이 {me} 님 머리에 비치니까 염색한 것 같아요. 예뻐요!',
      replies: [
        { say: '노을 색 실 찾았어?', tier: 'great', face: 'wow', answer: '아직이요! 기억해 줬네요. 언젠가 꼭 수놓아 둘 거예요.' },
        { say: '그웬 머리도 빛나', tier: 'good', face: 'shy', answer: '어머, 칭찬을 돌려받았어요. 오늘 하루가 보송해졌어요.' },
        { say: '해가 지네', tier: 'meh', face: 'calm', answer: '네, 하루가 한 땀 끝났어요. 내일 또 한 땀이에요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: ['축제 날이에요! 다들 예쁘게 하고 오니까 제일 바쁜 날이에요.', '리본을 벌써 백 개는 묶었어요!'],
      replies: [
        { say: '나도 축제 머리 해 줘', tier: 'great', face: 'laugh', answer: '그럼요! 동백 핀 하나 꽂으면 광장에서 제일 예뻐요.' },
        { say: '좀 쉬면서 해', tier: 'good', face: 'smile', answer: '고마워요. 근데 신나서 손이 안 멈춰요. 이따 쉴게요!' },
        { say: '난 그냥 구경만', tier: 'meh', face: 'calm', answer: '구경도 좋아요. 그래도 리본 하나는 달고 가요!' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: ['{me} 님, 낚시했어요? 바닷바람에 머리가 엉켰어요!', '오늘 잡은 건 {fish} 맞죠? 대단해요.'],
      replies: [
        { say: '엉킨 머리 좀 빗어 줘', tier: 'great', face: 'laugh', answer: '앉아요! 소금기부터 털고, 살살 빗어 드릴게요.' },
        { say: '그웬도 같이 가자', tier: 'good', face: 'sorry', answer: '저는 벌레 미끼가 무서워요. 그래도 옆에서 응원은 할게요!' },
        { say: '별거 아니야', tier: 'meh', face: 'wow', answer: '별거예요! 저는 물고기 근처도 못 가는걸요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었어요! 엄청 큰 물고기를 낚았다면서요? 미용실까지 소문이 왔어요.',
      replies: [
        { say: '기념 머리 해 줄래?', tier: 'great', face: 'laugh', answer: '물론이죠! 물결 파마 어때요? 바다 기념이에요.' },
        { say: '소문이 빠르네', tier: 'good', face: 'smile', answer: '미용실은 소문이 제일 먼저 닿는 곳이거든요. 메르시 씨 의원이랑요.' },
        { say: '운이 좋았어', tier: 'meh', face: 'think', answer: '운도 실력이에요! 아, 이건 포츈 씨가 싫어하는 말이죠.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 왔어요? 머리에 지푸라기 붙었어요. 가만, 하나 둘…',
      replies: [
        { say: '고마워, 다 떼어 줘', tier: 'great', face: 'laugh', answer: '다 뗐어요! 지푸라기도 리본처럼 귀여웠지만요.' },
        { say: '흙냄새 나지?', tier: 'good', face: 'wow', answer: '좋은 냄새예요! 인형일 땐 흙냄새도 몰랐거든요.' },
        { say: '바빠서 그냥 갈래', tier: 'meh', face: 'sorry', answer: '잠깐만요, 하나만 더! …싹둑, 아니 쏙. 됐어요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물을 거뒀다면서요! 와, 그 반짝임으로 머리핀 만들고 싶어요.',
      replies: [
        { say: '그웬 머리핀 만들자', tier: 'great', face: 'wow', answer: '정말요? 금별 핀이라니! 거울 앞에서 계속 볼 거예요.' },
        { say: '열심히 키웠거든', tier: 'good', face: 'smile', answer: '한 땀 한 땀처럼요! 정성은 꼭 반짝여요.' },
        { say: '먹는 게 먼저야', tier: 'meh', face: 'laugh', answer: '헤헤, 맞아요. 반짝임은 마음에만 꽂아 둘게요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: ['{me} 님, 오늘 어깨가 축 처졌어요.', '앉아요. 머리 감겨 드릴게요. 개운해질 거예요.'],
      replies: [
        { say: '고마워. 좀 지쳤어', tier: 'great', face: 'smile', answer: ['그럼 오늘은 아무 말 안 해도 돼요.', '따뜻한 물이랑 착한 안개가 다 해 줄 거예요.'] },
        { say: '마음이 찢어진 기분이야', tier: 'good', face: 'sorry', answer: '터진 데는 꿰매면 돼요. 천천히, 한 땀씩요. 제가 옆에 있을게요.' },
        { say: '괜찮아', tier: 'meh', face: 'think', answer: '괜찮다는 얼굴이 아닌데요. 그래도 오늘은 제가 머리 빗어 줄게요.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님, 오늘 얼굴이 반짝반짝해요! 좋은 일 있었죠?',
      replies: [
        { say: '그웬 보러 와서 그래', tier: 'great', face: 'shy', answer: '어머, 그런 말 하면 가위가 엇나가요! …그래도 좋아요.' },
        { say: '그냥 기분이 좋아', tier: 'good', face: 'laugh', answer: '그냥 좋은 날이 제일 좋은 날이에요. 리본 하나 달아 드릴게요!' },
        { say: '그래 보여?', tier: 'meh', face: 'smile', answer: '네! 거울 봐요. 제 말이 맞죠?' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['{me} 님, 생일 축하해요! 오늘은 공짜예요. 머리도, 리본도요!', '미선 씨한텐 비밀이에요.'],
      replies: [
        { say: '제일 예쁘게 해 줘', tier: 'great', face: 'laugh', answer: '맡겨 주세요! 오늘 {me} 님은 마을에서 제일 반짝일 거예요.' },
        { say: '공짜라니 미안한데', tier: 'good', face: 'smile', answer: '생일엔 미안한 거 아니에요. 받기만 하는 날이에요!' },
        { say: '생일 별로 안 챙겨', tier: 'meh', face: 'sorry', answer: '그럼 제가 챙길게요. 태어난 날은 신기한 날이잖아요.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: ['마을에 결혼 소식이 있대요! 신부 머리는 제가 하고 싶어요.', '면사포 끝단도 꿰매 드리고요.'],
      replies: [
        { say: '그웬 솜씨면 최고지', tier: 'great', face: 'shy', answer: '헤헤, 한 땀마다 행복하라고 빌면서 꿰맬 거예요.' },
        { say: '결혼식 가 봤어?', tier: 'good', face: 'wow', answer: '딱 한 번요! 다들 울면서 웃어서 깜짝 놀랐어요. 신기했어요.' },
        { say: '난 잘 모르는 사람이야', tier: 'meh', face: 'smile', answer: '그래도 축하는 해 줘요. 좋은 소식은 마을 모두의 거예요.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: ['{other} 씨 만났어요? 아침에 방송 전 머리 해 드렸거든요.', '나가자마자 바람에 다 날아갔대요. 또요!'],
      replies: [
        { say: '바람 담당이라 그래', tier: 'great', face: 'laugh', answer: '그쵸! 다음엔 바람에 날려도 예쁜 머리로 해 드릴 거예요.' },
        { say: '그래도 예뻤어', tier: 'good', face: 'smile', answer: '다행이다! 잔나 씨는 머리가 날려도 예쁘긴 해요.' },
        { say: '그냥 묶으면 되잖아', tier: 'meh', face: 'think', answer: '묶어도 풀리던데요. 바람이 잔나 씨를 너무 좋아해요.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: ['{other} 씨 의원 다녀왔어요? 거기랑 여기, 소문이 제일 빨라요.', '혹시 제 얘기 들었어요?'],
      replies: [
        { say: '칭찬만 하던데', tier: 'great', face: 'shy', answer: '정말요? 메르시 씨도 참. 다음에 머리 공짜로 해 드려야겠다.' },
        { say: '소문 뭐 있어?', tier: 'good', face: 'laugh', answer: '그건 비밀이에요! 미용 의자에서 들은 건 미용 의자에 남겨요.' },
        { say: '그냥 진료만 받았어', tier: 'meh', face: 'smile', answer: '아프지 마요! 아프면 머리도 같이 축 처져요.' },
      ],
    },
    {
      id: 'op-misun',
      when: { bond: 'misun' },
      open: ['{other} 씨 만났죠? 또 파마 값 얘기 했을 거예요.', '저는 안 깎아요. 리본은 달아 드려요!'],
      replies: [
        { say: '리본이 더 이득이래', tier: 'great', face: 'laugh', answer: '그쵸! 미선 씨도 실은 리본 받으러 오는 거예요. 헤헤.' },
        { say: '조금만 깎아 줘', tier: 'good', face: 'think', answer: '안 돼요. 대신 앞머리는 덤으로 다듬어 드릴게요.' },
        { say: '둘이 싸워?', tier: 'meh', face: 'smile', answer: '아뇨! 단골이랑 원장의 놀이예요. 매번 즐거워요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-scissors',
      when: { mem: 'scissors-name' },
      use: 'scissors-name',
      open: '싹둑이가 {me} 님 오면 꼭 인사하래요. 지난번 인사가 좋았대요.',
      replies: [
        { say: '싹둑아, 잘 지냈어?', tier: 'great', face: 'laugh', answer: '방금 반짝했어요! 오늘은 더 잘 잘릴 거예요.' },
        { say: '콕콕이도 잘 지내?', tier: 'good', face: 'wow', answer: '바늘 이름까지 기억했어요? 콕콕이도 반가워해요!' },
        { say: '가위가 말을 해?', tier: 'meh', face: 'smile', answer: '마음으로 해요. 들을 줄 아는 사람한테만요.' },
      ],
    },
    {
      id: 'cb-isolde',
      when: { mem: 'isolde-story' },
      use: 'isolde-story',
      open: ['이졸데 할머니 얘기 들어 줬던 거 기억나요.', '어젯밤 할머니 바늘 쌈지를 오랜만에 열어 봤어요.'],
      replies: [
        { say: '할머니가 기뻐하셨겠다', tier: 'great', face: 'shy', answer: '그럴까요? …바늘이 아직 반짝했어요. 할머니 손 같았어요.' },
        { say: '안에 뭐가 있었어?', tier: 'good', face: 'smile', answer: '빨간 실 한 타래랑 단추 두 개요. 제 옛날 눈인가 봐요. 헤헤.' },
        { say: '오래된 거네', tier: 'meh', face: 'calm', answer: '오래돼서 더 소중해요. 한 땀씩 쌓인 거니까요.' },
      ],
    },
    {
      id: 'cb-good-mist',
      when: { mem: 'good-mist' },
      use: 'good-mist',
      open: '착한 안개라고 같이 불러 줬잖아요. 그 뒤로 드라이어 켤 때마다 웃음 나요.',
      replies: [
        { say: '오늘도 착한 안개 부탁해', tier: 'great', face: 'laugh', answer: '맡겨 주세요! 오늘은 특별히 몽글몽글하게요.' },
        { say: '나도 집에서 그렇게 불러', tier: 'good', face: 'wow', answer: '정말요? 착한 안개가 마을에 퍼지고 있어요!' },
        { say: '그런 말 했었나?', tier: 'meh', face: 'smile', answer: '했어요! 저는 다 기억해요. 칭찬은 특히요.' },
      ],
    },
    {
      id: 'cb-button',
      when: { mem: 'button-eyes' },
      use: 'button-eyes',
      open: ['단추 눈 얘기 기억해요? 오늘 손님 외투에서 똑같은 단추를 봤어요.', '깜짝 놀라서 거울을 봤어요. 헤헤.'],
      replies: [
        { say: '지금 눈이 훨씬 예뻐', tier: 'great', face: 'shy', answer: '…또 그 말. 단추일 땐 이렇게 볼이 뜨거워질 줄 몰랐어요.' },
        { say: '그 단추 받아 왔어?', tier: 'good', face: 'laugh', answer: '아뇨, 손님 거니까요! 대신 단단히 다시 달아 드렸어요.' },
        { say: '단추가 다 비슷하지', tier: 'meh', face: 'think', answer: '비슷해도 다 달라요. 꿰매 본 사람은 알아요.' },
      ],
    },
    {
      id: 'cb-green-mist',
      when: { mem: 'green-mist' },
      use: 'green-mist',
      open: ['드라이어로 막자고 했던 거, 진짜 해 봤어요.', '쓰레쉬 씨가 웃었어요. 그 안개는 그냥 장식이래요.'],
      replies: [
        { say: '용감했네, 그웬', tier: 'great', face: 'laugh', answer: '헤헤, {me} 님 덕분이에요. 이제 지나갈 때 인사도 해요.' },
        { say: '장식이라니 다행이다', tier: 'good', face: 'smile', answer: '그래도 좀 으스스한 장식이에요. 거기까지는 양보 못 해요.' },
        { say: '쓰레쉬 씨 놀랐겠다', tier: 'meh', face: 'sorry', answer: '조금요… 다음엔 리본 하나 들고 사과하러 갈래요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님 좋아하는 게 {taste} 맞죠? 그 색으로 리본을 떠 볼까 해요.',
      replies: [
        { say: '그웬 리본이면 다 좋아', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '어머… 그럼 더 정성껏 떠야겠다. 한 땀마다 {me} 님 생각할게요.' },
        { say: '그걸 어떻게 알았어?', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '미용 의자에선 다 들려요. 손님이 좋아하는 건 꼭 기억해요.' },
        { say: '리본은 좀 부끄러운데', tier: 'meh', remember: 'taste-heard', face: 'smile', answer: '그럼 가방 손잡이에 달아요. 아무도 몰라요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: ['같이 걸었던 날이요. 처음 보는 골목이 너무 많아서 신났어요.', '{me} 님은 길을 다 알더라고요.'],
      replies: [
        { say: '다음엔 새 길로 가자', tier: 'great', remember: 'outing-talk', face: 'wow', answer: '좋아요! 처음 가는 길은 {me} 님이랑 가는 게 제일 좋아요.' },
        { say: '그웬 덕에 나도 신났어', tier: 'good', remember: 'outing-talk', face: 'smile', answer: '헤헤, 신나는 건 옮는대요. 좋은 병이에요.' },
        { say: '다리 아프지 않았어?', tier: 'meh', remember: 'outing-talk', face: 'laugh', answer: '하나도요! 인형 다리보다 훨씬 튼튼해요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: ['{me} 님 생일 곧이죠? 그날은 미용실 첫 손님 자리 비워 둘게요.', '어떤 머리 하고 싶어요?'],
      replies: [
        { say: '그웬이 골라 줘', tier: 'great', remember: 'bday-plan', face: 'laugh', answer: '맡겨 주세요! 아무한테도 안 한 머리로 해 드릴게요.' },
        { say: '동백 핀 꽂아 줘', tier: 'good', remember: 'bday-plan', face: 'shy', answer: '좋아요! 제일 예쁜 동백으로 제가 직접 만들게요.' },
        { say: '그냥 평소대로', tier: 'meh', remember: 'bday-plan', face: 'smile', answer: '평소대로라도 리본 하나는 꼭 달 거예요. 생일이니까요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '보송 미용실의 첫 손님',
      hint: '한 번 이야기를 나누면 그웬이 미용 의자를 돌려 줘요.',
      need: { days: 1 },
      scene: [
        '그웬이 미용 의자를 빙그르르 돌려 내 쪽으로 세운다.',
        '"어서 오세요! 보송 미용실 원장 그웬이에요."',
        '"앉아 봐요. 와, 머릿결 좋다. 귀 모양도 예쁘고요."',
        '그녀가 가위를 들어 보인다. "이 친구는 싹둑이예요."',
        '"오늘부터 {me} 님 머리는 제가 제일 잘 알게 될 거예요."',
      ],
      replies: [
        { say: '잘 부탁해, 원장님', tier: 'great', face: 'laugh', answer: '원장님이라니! 그냥 그웬이라고 불러요. 그게 더 좋아요.' },
        { say: '칭찬이 많네', tier: 'good', face: 'smile', answer: '예쁜 걸 보면 말이 먼저 나와요. 고칠 생각 없어요!' },
        { say: '그냥 구경 왔어', tier: 'meh', face: 'calm', answer: '구경도 환영이에요. 다음엔 앉아 줘요!' },
      ],
    },
    {
      title: '노을 색 실',
      hint: '저녁(게임 시각 오후 다섯 시부터 여덟 시) 마을 광장에 가 보세요. 그웬이 노을 색 실을 찾는대요.',
      need: { days: 3, points: 20, visit: { area: 'village', from: 17, to: 20 } },
      scene: [
        '마을 광장, 해가 기울 무렵. 그웬이 실타래를 하늘에 대 보고 있다.',
        '"아, 왔네요! 노을 색 실을 찾는 중이에요."',
        '"이건 너무 빨갛고, 이건 너무 노랗고… 하늘은 둘 다예요."',
        '그녀가 실 두 가닥을 겹쳐 꼬아 본다.',
        '"이렇게 꼬면 될까요? 처음 해 보는 색이라 떨려요."',
      ],
      replies: [
        { say: '딱 노을 색이야', tier: 'great', remember: 'sunset-thread', face: 'wow', answer: '정말요? 와… {me} 님이랑 찾으니까 찾아졌어요!' },
        { say: '하늘이 더 예쁘다', tier: 'good', remember: 'sunset-thread', face: 'laugh', answer: '헤헤, 하늘한텐 못 이겨요. 그래도 실로 조금은 닮아 볼래요.' },
        { say: '그냥 빨간 실 같은데', tier: 'meh', remember: 'sunset-thread', face: 'think', answer: '음… 해가 다 지면 다시 대 볼게요. 색은 금방 변하니까요.' },
      ],
    },
    {
      title: '동백 핀',
      hint: '그웬이 동백꽃 이야기를 했어요. 동백꽃 한 송이를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'camellia', take: true } },
      scene: [
        '동백꽃을 내밀자 그웬이 두 손으로 받는다. 손이 조금 떨린다.',
        '"동백이다… 이 빨강, 꼭 리본 같아요."',
        '"인형이던 시절엔 꽃 냄새를 몰랐어요. 지금은 알아요."',
        '그녀가 꽃을 코끝에 대고 한참 눈을 감는다.',
        '"이걸로 핀을 만들래요. 반은 제 거, 반은 {me} 님 거요."',
      ],
      replies: [
        { say: '같이 꽂고 다니자', tier: 'great', remember: 'camellia-pin', face: 'shy', answer: '…좋아요. 마을 사람들이 눈치채도 몰라요. 헤헤.' },
        { say: '그웬한테 어울려', tier: 'good', remember: 'camellia-pin', face: 'laugh', answer: '칭찬을 받으니까 꽃이 더 빨개 보여요. 아, 제 볼인가?' },
        { say: '마침 있어서 가져왔어', tier: 'meh', remember: 'camellia-pin', face: 'smile', answer: '마침이어도 좋아요. 마침이 쌓이면 인연이래요.' },
      ],
    },
    {
      title: '처음인 것들의 목록',
      hint: '평소 이야기에서 그웬과 함께 처음 보는 것을 신기해해 보세요. 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'new-wonder' },
      scene: [
        '그웬이 작은 수첩을 펼친다. 빼곡하게 무언가 적혀 있다.',
        '"이건 제가 처음 해 본 것들 목록이에요. 이슬, 비 냄새, 눈."',
        '"사람이 되고 나서 하나도 빼먹지 않고 적었어요."',
        '그녀가 마지막 줄을 손끝으로 짚는다. 내 이름이 있다.',
        '"이건… 처음 생긴 단골이요. 아니, 처음 생긴 소중한 사람이요."',
      ],
      replies: [
        { say: '앞으로도 같이 채우자', tier: 'great', face: 'shy', answer: '…네. 이 수첩, 이제 둘이서 쓰는 거예요. 약속이에요.' },
        { say: '목록이 길다', tier: 'good', face: 'laugh', answer: '세상이 너무 신기해서요! 아직 반도 안 적었어요.' },
        { say: '나도 처음이야?', tier: 'meh', face: 'smile', answer: '그럼요. 처음이고, 아직도 매일 신기해요.' },
      ],
    },
    {
      title: '엇박자',
      hint: '그웬과 아주 가까워지면 가위 소리가 이상해진대요. 그 뒤엔 꽃다발도 반길지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '머리를 다듬던 그웬의 가위가 갑자기 멈춘다.',
        '"…이상해요. 싹둑이 소리가 엇박자가 나요."',
        '"다른 손님 땐 안 그래요. {me} 님 머리만 만지면 이래요."',
        '그녀가 거울 너머로 나를 보다가 얼른 눈을 피한다.',
        '"동백이나 코스모스를 한 다발 받으면… 심장도 엇박자가 날 거예요."',
        '"아, 지금 그 말 한 거 아니에요! 아니, 맞아요."',
      ],
      replies: [
        { say: '그 엇박자, 내가 맞출게', tier: 'great', face: 'shy', answer: '…그럼 꽃 들고 와요. 그날은 싹둑이도 쉬게 할게요.' },
        { say: '그웬 얼굴 빨개', tier: 'good', face: 'laugh', answer: '노을 때문이에요! …아직 낮이네요. 헤헤.' },
        { say: '가위 고장 난 거 아냐?', tier: 'meh', face: 'sorry', answer: '싹둑이는 멀쩡해요. 고장 난 건… 다른 데예요.' },
      ],
    },
    {
      title: '두 사람 사이의 한 땀',
      hint: '그웬과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '그웬이 바늘에 빨간 실을 꿴다. 이졸데 할머니의 바늘이다.',
        '"사람과 사람 사이에도 실이 있대요. 할머니가 그랬어요."',
        '"저는 그 실을 꼭 제 손으로 꿰매고 싶었어요."',
        '그녀가 내 소매와 자기 소매를 한 땀으로 잇는다.',
        '"이제 실밥이 생겨도 안 자를 거예요. 이건 평생 두는 실이에요."',
        '"다음엔… 손가락에 반짝이는 걸로 꿰매 줄래요?"',
      ],
      replies: [
        { say: '반지로 꼭 잇자', tier: 'great', face: 'shy', answer: '…네. 그날 머리는 제가 할게요. 제 것도, {me} 님 것도요.' },
        { say: '소매가 붙어서 못 걸어', tier: 'good', face: 'laugh', answer: '그럼 같이 걸으면 되죠! 발도 맞춰요. 하나, 둘.' },
        { say: '천천히 생각해 볼게', tier: 'meh', face: 'smile', answer: '천천히요. 좋은 바느질은 서두르지 않는 거예요.' },
      ],
    },
  ],
  after: [
    '오늘 실타래는 여기까지! 내일 또 풀어요.',
    '머리 말리고 자요! 꼭이요.',
    '싹둑이가 손 흔들어요. 내일 또 와요!',
    '할 말 다 했는데 또 보니까 좋네요. 헤헤.',
    '실밥 생기면 바로 와요. 싹둑! 해 드릴게요.',
  ],
};
