// 럭스 — 항구 어시장 상인 겸 낚시조합장. 밝고 에너지 넘치는 해요체 흥정꾼.
// 새벽 경매 목청이 제일 크고, 빛·프리즘·반짝임 이야기를 좋아한다. 경매는
// '마지막 한 방'으로 끝낸다. 어릴 때 손에서 새던 빛을 숨기던 기억, 오빠 가붕의
// 과보호에 투덜대면서도 도시락은 챙긴다. 잔나 예보와 투덕. 원작(럭스) 대사는
// 옮기지 않고 말버릇과 소재만 빌린다.
// 이야기 줄기: 숨기던 빛 → 얼음 무지개 → 원석의 별빛 → 오빠의 세 번 깜빡임
// (괜찮다는 신호) → 값을 못 매기는 것 → 숨기지 않는 마지막 한 방.
import type { NpcTalkBook } from './types.ts';

export const LUX_TALK: NpcTalkBook = {
  npc: 'lux',
  memories: {
    'shine-fan': '반짝이는 비늘을 좋아한다고 했어요',
    'auction-cheer': '경매의 마지막 한 방을 응원했어요',
    'prism-gift': '프리즘 이야기를 들었어요',
    'hidden-light': '어릴 때 숨기던 빛 이야기를 들었어요',
    'brother-lunch': '오빠 도시락 이야기를 들어 줬어요',
    'brother-side': '오빠 과보호에 같이 투덜거렸어요',
    'forecast-lux': '날씨는 바다 냄새로 안다고 맞장구쳤어요',
    'sweet-tooth': '단 디저트를 같이 좋아한다고 했어요',
    'guild-join': '낚시조합에 들어오겠다고 했어요',
    'stamp-card': '단골 도장을 모으기로 했어요',
    'rainbow-ice': '얼음에 비친 무지개를 함께 봤어요',
    'loud-voice': '경매 목소리가 멋지다고 했어요',
    'dawn-market': '새벽 시장에서 첫 햇살을 함께 봤어요',
    'gem-light': '보석에 빛을 비춰 본 날이 있어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 경매 이야기를 나눴어요',
    'date-talk': '방에서 반짝임을 보여 준 날을 이야기했어요',
    'home-story': '하얀 돌의 고향 이야기를 들었어요',
    'tsunade-tea': '츠나데의 쓴 약초차 이야기를 들었어요',
    'nilah-bet': '닐라와의 낚시 내기를 응원했어요',
    'haggle-tip': '반짝임으로 하는 흥정 비법을 배웠어요',
    'light-signal': '등대 불빛 세 번의 뜻을 맞혔어요',
    'fav-season': '가을 갈치를 좋아한다고 했어요',
    'light-diary': '매일 쓰는 빛 일기 이야기를 들었어요',
    'auction-wand': '유리구슬 경매 막대가 지팡이 같다고 했어요',
    'harbor-wait': '폭풍 뒤 방파제에서 같이 기다리기로 했어요',
    'stop-call': '잠깐만요 한마디의 비밀을 알아요',
    'tavern-song': '주점 노래자랑 꼴찌를 응원했어요',
    'brother-gift': '오빠 생일 선물로 망토를 골라 줬어요',
    'last-star': '새벽의 마지막 별 이야기를 들었어요',
    'mine-gem': '광산에서 보석을 캐다 주기로 했어요',
    'first-auction': '첫 경매 날 금붕어 이야기를 들었어요',
    'name-light': '이름이 빛이라는 뜻인 걸 알아요',
    'janna-secret': '잔나 몰래 두는 사탕 비밀을 알아요',
    'love-light': '손끝 반짝임을 끄지 말라고 했어요',
    'brother-ok': '오빠에게 괜찮은 사람이라고 전해졌어요',
  },
  talks: [
    {
      id: 'scale-shine',
      open: '{me} 님, 이 비늘 좀 보세요! 빛에 비추면 색이 일곱 번 바뀌어요!',
      replies: [
        { say: '와, 진짜 반짝여요!', tier: 'great', remember: 'shine-fan', answer: ['그쵸?! 이 반짝임 알아보는 사람이 진짜 단골이에요!', '오늘은 덤 드릴게요! 제일 반짝이는 꼬리로요!'] },
        { say: '맛은 어때요?', tier: 'good', answer: '맛도 최고죠! 근데 먼저 눈으로 한 번 드셔 보세요. 그게 어시장 예절이에요!' },
        { say: '그냥 생선인데요', tier: 'meh', face: 'sorry', answer: ['그냥 생선이라뇨!', '…괜찮아요, 언젠간 보이실 거예요. 제가 꼭 보여 드릴게요!'] },
      ],
    },
    {
      id: 'last-shot',
      open: '경매 마감할 때 제가 뭐라고 외치는지 아세요? 마지막 한 방이에요!',
      replies: [
        { say: '그거 들으면 속 시원해요', tier: 'great', remember: 'auction-cheer', answer: ['그쵸?! 빛을 한데 모아서 쏘는 느낌이에요!', '숨을 꾹 모았다가, 낙찰! 내일도 크게 쏠게요!'] },
        { say: '왜 하필 한 방이에요?', tier: 'good', face: 'think', answer: '질질 끌면 생선이 식어요! 마지막은 짧고 밝게, 그게 제 방식이에요!' },
        { say: '좀 시끄럽던데요', tier: 'meh', face: 'laugh', answer: '하하, 오빠보단 조용해요! 그건 확실해요!' },
      ],
    },
    {
      id: 'prism',
      open: '가게 창에 유리 조각 하나 달아 뒀어요. 아침마다 무지개가 생겨요!',
      replies: [
        { say: '저도 보고 싶어요', tier: 'great', remember: 'prism-gift', answer: ['해 뜰 때 오세요! 무지개가 생선 위에 딱 내려앉아요.', '하루 중에 제일 예쁜 순간이에요. 진짜예요!'] },
        { say: '그걸 어떻게 알았어요?', tier: 'good', face: 'think', answer: '어릴 때부터 빛을 쫓아다녔거든요. 빛이 어디로 꺾이는지 다 외웠어요!' },
        { say: '눈부시지 않아요?', tier: 'meh', face: 'calm', answer: '조금요! 그래서 손님 쪽은 피해서 달았어요. 배려예요!' },
      ],
    },
    {
      id: 'hidden-light',
      open: ['어릴 때요, 손에서 빛이 새어 나올 때가 있었어요.', '그때는 들킬까 봐 소매에 꼭 숨겼어요. 이상하죠?'],
      replies: [
        { say: '하나도 안 이상해요', tier: 'great', remember: 'hidden-light', face: 'shy', answer: ['…고마워요.', '그 말 그때 들었으면 좋았을 텐데. 지금 들어서 다행이에요.'] },
        { say: '지금도 빛나요?', tier: 'good', face: 'smile', remember: 'hidden-light', answer: '가끔요! 기분 좋을 때 손끝이 반짝해요. 이제 안 숨겨요!' },
        { say: '무서웠겠어요', tier: 'meh', face: 'think', answer: '조금요. 근데 오빠가 못 본 척해 줬어요. 그게 오빠다운 거였어요.' },
      ],
    },
    {
      id: 'brother-lunch',
      open: '오늘 오빠 도시락 쌌어요. 투덜거리면서요! 근데 생선은 제일 좋은 걸로요.',
      replies: [
        { say: '착한 동생이네요', tier: 'great', remember: 'brother-lunch', face: 'shy', answer: '착한 거 아니에요! 그냥… 굶으면 등불 켜다 쓰러질까 봐요!' },
        { say: '오빠가 좋아하겠어요', tier: 'good', face: 'laugh', answer: ['좋아서 등대 계단에서 빙글빙글 돈대요.', '그건 좀 안 했으면 좋겠어요. 도시락이 섞이잖아요!'] },
        { say: '직접 싸라고 하세요', tier: 'meh', face: 'laugh', answer: '하하, 시켜 봤어요! 빵 두 덩이 들고 가더라고요. 그래서 제가 싸요.' },
      ],
    },
    {
      id: 'overprotect',
      open: '오빠가 또 망원경으로 가게를 봤대요! 딱 한 번이라는데 그게 몇 번째예요!',
      replies: [
        { say: '그건 좀 심했다!', tier: 'great', remember: 'brother-side', answer: '그쵸?! {me} 님은 제 편이에요! 오늘 덤은 두 배예요!' },
        { say: '걱정돼서 그러는 거죠', tier: 'good', face: 'think', answer: ['…알아요. 알아서 더 투덜거리는 거예요.', '고맙다고는 안 할 거예요! 절대로요!'] },
        { say: '망원경 뺏어요', tier: 'meh', face: 'laugh', answer: '하하! 뺏으면 등대에서 손으로 동그라미 만들고 볼걸요!' },
      ],
    },
    {
      id: 'forecast',
      open: '잔나 언니가 내일 맑대요. 근데 바다 냄새는 비라고 해요. {me} 님 생각은요?',
      replies: [
        { say: '바다 냄새를 믿어요', tier: 'great', remember: 'forecast-lux', answer: ['역시! 조업은 코로 하는 거예요!', '내일 조합원들한테 그물 걷으라고 할게요!'] },
        { say: '잔나 말도 일리가 있죠', tier: 'good', face: 'think', answer: '음, 언니 예보가 맞을 때도 있긴 해요. 가끔요! 아주 가끔!' },
        { say: '오빠 무릎은요?', tier: 'meh', face: 'laugh', answer: '하하하! 오빠 무릎은 늘 비래요. 그럼 맞을 때도 있겠죠!' },
      ],
    },
    {
      id: 'sweets',
      open: '경매 끝나면 단 거 하나 먹어요. 그게 제 보상이에요. {me} 님은 단 거 좋아해요?',
      replies: [
        { say: '호박파이면 최고죠!', tier: 'great', remember: 'sweet-tooth', face: 'wow', answer: ['어머, 제 최애예요! 우리 통했어요!', '다음엔 반씩 나눠 먹어요. 큰 쪽은 가위바위보로요!'] },
        { say: '조금은 좋아해요', tier: 'good', answer: '조금이면 딱 좋아요. 저는 조금이 많이라서 문제예요!' },
        { say: '짠 게 더 좋아요', tier: 'meh', face: 'calm', answer: '그럼 굴비 한 손 어때요? 어시장은 짠 것도 다 있어요!' },
      ],
    },
    {
      id: 'guild',
      open: '낚시조합장 된 지 꽤 됐어요. {me} 님도 조합에 들어오실래요?',
      replies: [
        { say: '들어갈래요!', tier: 'great', remember: 'guild-join', answer: ['환영해요! 조합원 첫째 규칙은 새벽에 일어나기예요!', '둘째 규칙은 잡으면 자랑하기! 그게 제일 중요해요!'] },
        { say: '뭘 하는 데예요?', tier: 'good', face: 'think', answer: '물때 공유하고, 그물 고치고, 잡은 거 자랑해요! 마지막이 제일 중요해요!' },
        { say: '새벽은 무리예요', tier: 'meh', face: 'sorry', answer: '아쉽다… 그럼 명예 조합원이요! 낮에만 오셔도 돼요!' },
      ],
    },
    {
      id: 'stamp',
      open: '단골 도장 카드 만들었어요! 도장 다 모으면 금빛 특별 단골이에요!',
      replies: [
        { say: '하나도 빠짐없이 모을게요', tier: 'great', remember: 'stamp-card', answer: '좋아요! 첫 도장은 제일 반짝이는 잉크로 찍어 드릴게요!' },
        { say: '특별 단골은 뭐가 좋아요?', tier: 'good', face: 'think', answer: '경매 전에 제일 좋은 상자를 먼저 보여 드려요! 비밀 혜택이에요!' },
        { say: '잃어버릴 것 같아요', tier: 'meh', face: 'laugh', answer: '하하, 그럼 제가 맡아 둘게요. 장부 맨 앞에 끼워 둘게요!' },
      ],
    },
    {
      id: 'voice',
      open: '새벽 경매 때 제 목소리 들으셨어요? 항구 끝까지 들린대요!',
      replies: [
        { say: '그 목소리 멋져요', tier: 'great', remember: 'loud-voice', face: 'shy', answer: ['헤헤, 정말요? 오빠한테 배운 거예요.', '그건 오빠한테 비밀이에요! 우쭐해서 더 커져요!'] },
        { say: '등대까지 들리던데요', tier: 'good', face: 'laugh', answer: '아마 오빠가 듣고 대답했을 거예요. 둘이 소리 지르기 대회예요!' },
        { say: '목 안 아파요?', tier: 'meh', answer: '조금요! 그래서 꿀물 마셔요. 오빠가 꿀을 자꾸 갖다줘요. 또 과보호예요!' },
      ],
    },
    {
      id: 'yanineko',
      open: '야니네코 씨가 또 생선 얻으러 왔어요. 눈이 반짝반짝해서 안 줄 수가 없어요!',
      replies: [
        { say: '럭스 마음이 더 반짝여요', tier: 'great', face: 'shy', answer: '어머! 그런 말은 경매가로 못 매겨요! 오늘 제일 기분 좋은 말이에요!' },
        { say: '조금만 주세요', tier: 'good', face: 'laugh', answer: ['알아요, 알아요! 꼬리만 줬어요!', '…몸통도 조금 줬어요. 진짜 조금요!'] },
        { say: '장사는 남겨야죠', tier: 'meh', face: 'think', answer: '맞는 말이에요. 근데 단골 웃음도 이문이에요. 제 계산법이에요!' },
      ],
    },
    {
      id: 'demacia-home',
      open: ['제 고향은 하얀 돌로 지은 반듯한 도시였어요.', '골목도 반듯, 인사도 반듯. 큰 소리 내면 혼나는 곳이었죠.'],
      replies: [
        { say: '그래서 여기가 좋아요?', tier: 'great', remember: 'home-story', answer: ['네! 여기선 크게 외치면 박수가 나와요!', '항구는 시끄럽고 비뚤비뚤해서 좋아요. 숨 쉬기 편해요.'] },
        { say: '하얀 도시도 예쁘겠다', tier: 'good', face: 'think', answer: ['예뻤어요. 눈 오는 날은 더요.', '근데 빛을 숨겨야 하는 곳이었어요. 그게 좀 슬펐어요.'] },
        { say: '규칙 많은 것도 좋은데요', tier: 'meh', face: 'laugh', answer: '하하, 오빠랑 말이 통하겠어요! 오빠는 아직도 반듯해요!' },
      ],
    },
    {
      id: 'tsunade-tea',
      open: ['어릴 때 넘어지면 츠나데 할머니가 약초차를 주셨어요.', '엄청 써요! 근데 마시면 무릎보다 마음이 먼저 나아요.'],
      replies: [
        { say: '지금도 마셔요?', tier: 'great', remember: 'tsunade-tea', face: 'smile', answer: ['경매 끝나고 목 쉬면 한 잔씩요!', '할머니라고 부르면 혼나요. 그 말은 우리 둘만 알기예요!'] },
        { say: '쓴 건 싫어요', tier: 'good', face: 'laugh', answer: '저도요! 그래서 꿀 한 숟가락 몰래 넣어요. 할머니한텐 비밀이에요!' },
        { say: '의원에 가면 되잖아요', tier: 'meh', face: 'calm', answer: '그것도 맞아요. 근데 할머니 차는 약보다 잔소리가 맛있어요.' },
      ],
    },
    {
      id: 'nilah-bet',
      open: '닐라 씨랑 낚시 내기 장부 쓰고 있어요. 지금 누가 앞서는지 맞혀 볼래요?',
      replies: [
        { say: '럭스가 이기고 있죠?', tier: 'great', remember: 'nilah-bet', answer: ['당연하죠! …라고 하고 싶은데 딱 비겼어요!', '닐라 씨는 물속에서 웃으면서 낚아요. 그게 제일 무서워요!'] },
        { say: '닐라 씨가 앞서죠?', tier: 'good', face: 'think', answer: '으으, 한 마리 차이예요! 다음 물때에 뒤집을 거예요!' },
        { say: '내기는 안 좋아요', tier: 'meh', face: 'calm', answer: '걸린 건 목장 우유 한 병이에요! 귀여운 내기예요. 진짜예요!' },
      ],
    },
    {
      id: 'haggle',
      open: ['흥정 비법 하나 알려 드릴까요?', '깎아 달라는 손님한테는 먼저 웃어요. 그다음 비늘을 보여 줘요.'],
      replies: [
        { say: '반짝이면 못 깎겠네요', tier: 'great', remember: 'haggle-tip', answer: '그쵸! 반짝임 앞에선 다들 지갑이 열려요. {me} 님도 써 보세요!' },
        { say: '덤을 주면 되잖아요', tier: 'good', face: 'think', answer: ['덤은 마지막 무기예요!', '처음부터 쓰면 마지막 한 방이 안 나와요. 아껴야 해요!'] },
        { say: '정가만 받으면 편한데', tier: 'meh', face: 'calm', answer: '편하죠. 근데 흥정은 손님이랑 수다 떠는 거예요. 그게 재밌어요!' },
      ],
    },
    {
      id: 'light-signal',
      open: ['밤에 등대 불빛이 세 번 깜빡이는 거 보셨어요?', '그거 오빠랑 저만 아는 신호예요. 뜻은 비밀!'],
      replies: [
        { say: '잘 자라는 뜻이죠?', tier: 'great', remember: 'light-signal', face: 'wow', answer: ['어떻게 알았어요?! 반은 맞았어요!', '나머지 반은… 괜찮다는 뜻이에요. 어릴 때부터요.'] },
        { say: '저도 따라 해 볼래요', tier: 'good', face: 'laugh', answer: '하하, 그럼 오빠가 헷갈려서 계단을 뛰어 내려올걸요!' },
        { say: '기름 아깝겠어요', tier: 'meh', face: 'calm', answer: '등대 불은 어차피 켜져 있어요! 깜빡이는 건 공짜예요!' },
      ],
    },
    {
      id: 'fav-season',
      open: '계절마다 제일 반짝이는 물고기가 달라요. {me} 님은 언제가 좋아요?',
      replies: [
        { say: '가을 갈치요!', tier: 'great', remember: 'fav-season', face: 'wow', answer: ['은빛 거울이죠! 빛에 비추면 제 얼굴이 비쳐요!', '가을 오면 제일 긴 놈 빼 둘게요. 약속해요!'] },
        { say: '봄 참돔이요', tier: 'good', answer: '행운의 붉은 물고기! 봄 햇살에 분홍빛이 돌아요. 좋은 눈이에요!' },
        { say: '겨울엔 안 나가요', tier: 'meh', face: 'laugh', answer: '겨울 방어가 제일 맛있는데! 화로 옆에서 구워 드릴 테니 오세요!' },
      ],
    },
    {
      id: 'light-diary',
      open: ['저 매일 빛 일기 써요.', '그날 제일 반짝였던 순간 하나만 적어요. 어제는 {me} 님 웃음이었어요.'],
      replies: [
        { say: '오늘은 뭘 적을 거예요?', tier: 'great', remember: 'light-diary', face: 'shy', answer: '…아직 몰라요. 지금 이 대화가 제일 유력해요!' },
        { say: '저도 써 볼래요', tier: 'good', answer: ['좋아요! 흐린 날엔 작은 반짝임 찾기가 숙제예요.', '그게 은근히 재밌어요. 찾으면 꼭 보여 줘요!'] },
        { say: '일기는 귀찮아요', tier: 'meh', face: 'laugh', answer: '한 줄이면 돼요! 반짝, 하고 끝! 경매 마감처럼요!' },
      ],
    },
    {
      id: 'auction-wand',
      open: '이 경매 막대 보셨어요? 끝에 유리구슬 달았어요. 휘두르면 빛이 튀어요!',
      replies: [
        { say: '마법 지팡이 같아요', tier: 'great', remember: 'auction-wand', face: 'wow', answer: ['그쵸?! 어릴 때 꿈이 빛나는 지팡이였어요!', '지금은 생선 가리키는 데 써요. 꿈은 이룬 거죠?'] },
        { say: '구슬은 어디서 났어요?', tier: 'good', answer: '바닷가에서 주웠어요! 파도에 닳아서 둥글고 맑아요. 제일 아끼는 거예요!' },
        { say: '손님 맞을 것 같아요', tier: 'meh', face: 'sorry', answer: '앗, 조심할게요! 아직 맞은 사람은 오빠뿐이에요!' },
      ],
    },
    {
      id: 'harbor-wait',
      open: ['폭풍 지나간 날엔 마지막 배가 들어올 때까지 방파제에 서 있어요.', '등불 들고요. 조합원이 다 돌아와야 잠이 와요.'],
      replies: [
        { say: '럭스가 지켜 주는 거네요', tier: 'great', remember: 'harbor-wait', face: 'shy', answer: ['지켜 주는 건 오빠 일인데… 저도 해 보고 싶었어요.', '빛으로 둥글게 감싸 주는 느낌으로요.'] },
        { say: '같이 기다려 줄게요', tier: 'good', face: 'smile', answer: '정말요? 그럼 등불 두 개 챙길게요. 하나는 {me} 님 거예요!' },
        { say: '춥지 않아요?', tier: 'meh', face: 'laugh', answer: '추워요! 그래서 오빠가 담요를 던져 줘요. 꼭대기에서요. 위험하게!' },
      ],
    },
    {
      id: 'stop-call',
      open: '제가 잠깐만요, 하고 부르면 그냥 가던 손님도 딱 멈춰요. 왜일까요?',
      replies: [
        { say: '빛에 묶인 것처럼요?', tier: 'great', remember: 'stop-call', face: 'laugh', answer: ['하하! 맞아요, 목소리로 꽁꽁 묶는 거예요!', '풀어 드릴 땐 덤을 얹어요. 그래야 또 오시죠!'] },
        { say: '목소리가 커서요', tier: 'good', answer: '그것도 있죠! 근데 웃으면서 하니까 화는 안 내요. 그게 비결이에요!' },
        { say: '좀 무섭겠는데요', tier: 'meh', face: 'sorry', answer: '헉, 무서웠어요? 다음엔 반짝이는 목소리로 부를게요!' },
      ],
    },
    {
      id: 'tavern-song',
      open: ['샹크스 선장님 주점에서 노래자랑 하면 제가 늘 꼴찌예요.', '음은 다 틀리는데 목소리만 커서요!'],
      replies: [
        { say: '그래도 제일 신나잖아요', tier: 'great', remember: 'tavern-song', answer: '그쵸?! 점수는 꼴찌, 박수는 일등이에요! 그게 제 노래예요!' },
        { say: '같이 나가 줄게요', tier: 'good', face: 'shy', answer: '진짜요? 그럼 둘이 꼴찌 해요! 혼자보다 덜 창피하겠죠?' },
        { say: '연습 좀 해요', tier: 'meh', face: 'laugh', answer: '오빠가 똑같이 말했어요. 근데 오빠는 박자를 하나도 못 맞춰요!' },
      ],
    },
    {
      id: 'brother-gift',
      open: '곧 오빠 생일이에요. 새 망토랑 방패 닦는 기름 중에 뭐가 좋을까요?',
      replies: [
        { say: '망토요, 바닷바람 막게', tier: 'great', remember: 'brother-gift', answer: ['역시! 등대 꼭대기 바람이 엄청 세거든요!', '파란색으로 할래요. 고향 깃발 색이에요.'] },
        { say: '기름이 실용적이죠', tier: 'good', face: 'think', answer: '오빠는 실용적인 걸 좋아하긴 해요. 근데 그럼 제가 재미없어요!' },
        { say: '도시락이면 되죠', tier: 'meh', face: 'laugh', answer: '그건 매일 주는 거예요! 생일엔 반짝이는 게 있어야죠!' },
      ],
    },
    {
      id: 'last-star',
      open: ['새벽 경매 전에 하늘 보면 마지막 별 하나가 남아 있어요.', '해 뜨기 직전까지 버티는 별이요. 제가 제일 좋아해요.'],
      replies: [
        { say: '럭스 같은 별이네요', tier: 'great', remember: 'last-star', face: 'shy', answer: '…끝까지 반짝이는 거요? 헤헤, 그 말 오늘 빛 일기에 적을래요.' },
        { say: '이름 붙여 줬어요?', tier: 'good', face: 'laugh', answer: '마지막 한 방이요! 별 이름으론 좀 시끄럽죠?' },
        { say: '그 시간엔 자요', tier: 'meh', face: 'calm', answer: '그럼 제가 대신 봐 둘게요. 오늘도 잘 버텼다고 전해 드릴게요!' },
      ],
    },
    {
      id: 'mine-gem',
      open: ['저 광산은 무서워요. 깜깜하면 힘이 쭉 빠져요.', '근데 반짝이는 보석은 다 거기서 나온대요. 억울해요!'],
      replies: [
        { say: '제가 캐다 드릴게요', tier: 'great', remember: 'mine-gem', face: 'wow', answer: '정말요?! 그럼 저는 입구에서 등불 들고 기다릴게요! 제일 밝게요!' },
        { say: '어둠이 있어야 빛나죠', tier: 'good', face: 'think', answer: ['…그런가 봐요. 보석도, 등대도요.', '좀 깊은 말이네요. 오늘 빛 일기에 쓸래요!'] },
        { say: '광산도 괜찮던데요', tier: 'meh', face: 'sorry', answer: '{me} 님은 용감하네요! 저는 입구에서 발만 동동 굴러요.' },
      ],
    },
    {
      id: 'first-auction',
      open: ['처음 경매 맡은 날, 목소리가 하나도 안 나왔어요.', '손님들 앞에서 입만 뻐끔뻐끔. 금붕어 같았대요!'],
      replies: [
        { say: '지금은 제일 크잖아요', tier: 'great', remember: 'first-auction', face: 'laugh', answer: ['그날 오빠가 맨 뒤에서 제일 크게 값을 불렀어요.', '생선이 필요해서가 아니래요. 제 목소리 끌어내려고요.'] },
        { say: '어떻게 이겨 냈어요?', tier: 'good', face: 'think', answer: '마지막 상자에서 숨 크게 쉬고 한 방에 외쳤어요. 그게 시작이에요!' },
        { say: '저도 그럴 것 같아요', tier: 'meh', face: 'smile', answer: '괜찮아요! 처음엔 다 금붕어예요. 금붕어도 반짝여요!' },
      ],
    },
    {
      id: 'name-light',
      open: '제 이름이요, 먼 나라 옛말로 빛이라는 뜻이래요. 어울려요?',
      replies: [
        { say: '딱 럭스 이름이에요', tier: 'great', remember: 'name-light', face: 'shy', answer: ['헤헤! 어릴 땐 이름 때문에 들킬까 봐 걱정했어요.', '지금은 자랑이에요. 크게 불러 주세요!'] },
        { say: '가붕 이름 뜻은요?', tier: 'good', face: 'laugh', answer: '오빠 이름은 그냥 오빠 같아요. 단단하고 시끄러운 뜻일 거예요!' },
        { say: '이름은 그냥 이름이죠', tier: 'meh', face: 'calm', answer: '그렇죠! 그래도 불러 줄 때 반짝하면 좋잖아요.' },
      ],
    },
    {
      id: 'janna-secret',
      open: ['잔나 언니 예보가 맞는 날엔요, 몰래 사탕 하나 두고 와요.', '언니 책상 바람개비 옆에요. 아무한테도 말 안 했어요!'],
      replies: [
        { say: '다정한 라이벌이네요', tier: 'great', remember: 'janna-secret', face: 'shy', answer: '라이벌이요? 좋아요, 그 말! 투덕거려도 좋아하는 라이벌이에요!' },
        { say: '틀린 날엔요?', tier: 'good', face: 'laugh', answer: '틀린 날엔 문 앞에서 크게 따지죠! 사탕은 그다음 날이에요!' },
        { say: '그냥 칭찬하면 되잖아요', tier: 'meh', face: 'think', answer: '그럼 언니가 우쭐해서 다음 예보 또 틀려요! 비밀이 나아요.' },
      ],
    },
    {
      id: 'promise-light',
      when: { ch: 3 },
      open: '{me} 님, 요즘 손끝이 자꾸 반짝여요. 숨기지 말까 봐요. 봐 줄래요?',
      replies: [
        { say: '보여 줘요. 다 볼게요', tier: 'great', remember: 'hidden-light', face: 'shy', answer: ['…자, 여기요. 작죠?', '근데 {me} 님 앞이라 제일 밝게 나온 거예요.'] },
        { say: '예쁘다', tier: 'good', face: 'smile', answer: '헤헤. 어릴 땐 무서웠는데 지금은 예쁘다는 말이 먼저 나와서 좋아요.' },
        { say: '눈이 부셔요', tier: 'meh', face: 'laugh', answer: '앗, 죄송해요! 조금 줄일게요! …줄이는 게 더 어렵네요!' },
      ],
    },
    {
      id: 'brother-ask',
      when: { ch: 4 },
      open: ['오빠가 어제 {me} 님 얘기를 물어봤어요.', '밥은 잘 먹는지, 착한지, 계단은 잘 오르는지. 이상한 질문만요!'],
      replies: [
        { say: '다 괜찮다고 해 줘요', tier: 'great', remember: 'brother-ok', face: 'laugh', answer: ['벌써 했어요! 제일 크게요!', '오빠가 고개를 끄덕였어요. 오빠 끄덕임은 훈장이에요!'] },
        { say: '계단은 왜요?', tier: 'good', face: 'shy', answer: '등대에 자주 올 사람인지 보는 거래요. …무슨 뜻일까요?' },
        { say: '좀 부담스러워요', tier: 'meh', face: 'sorry', answer: '미안해요! 오빠는 걱정을 질문으로 해요. 대신 제가 막아 줄게요!' },
      ],
    },
    {
      id: 'love-shine',
      when: { love: 'any' },
      open: ['{me} 님 손잡으면 손끝이 자꾸 반짝여요.', '예전 같으면 숨겼을 텐데, 이젠 그냥 둬요.'],
      replies: [
        { say: '계속 반짝여 줘요', tier: 'great', remember: 'love-light', face: 'shy', answer: '…네. {me} 님 앞에선 끄는 법을 잊어버렸어요.' },
        { say: '눈부신 연인이네요', tier: 'good', face: 'laugh', answer: '하하! 오빠한테 그 말 하면 햇빛 가리개를 사 올 거예요!' },
        { say: '사람들이 보잖아요', tier: 'meh', face: 'sorry', answer: '앗, 그렇네요. 그럼 주머니 속에서만 반짝일게요!' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽 경매 곧 시작해요! {me} 님, 맨 앞자리 비워 뒀어요! 귀 막으세요!',
      replies: [
        { say: '맨 앞에서 들을게요!', tier: 'great', remember: 'loud-voice', answer: '좋아요! 오늘 마지막 한 방은 {me} 님 쪽으로 쏠게요!' },
        { say: '오늘 뭐 들어왔어요?', tier: 'good', answer: '광어랑 참돔이요! 참돔은 빛에 비추면 분홍빛이 돌아요!' },
        { say: '아직 졸려요', tier: 'meh', face: 'laugh', answer: '하하, 제 목소리 한 번이면 깨요! 장담해요!' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '해 질 녘 바다 보세요! 물비늘이 금빛이에요. 제일 반짝이는 시간이에요!',
      replies: [
        { say: '같이 보고 가도 돼요?', tier: 'great', remember: 'rainbow-ice', face: 'shy', answer: ['그럼요! 가게 정리는 잠깐 미뤄요.', '이건 놓치면 안 돼요. 해가 마지막 한 방을 쏘는 중이거든요.'] },
        { say: '오늘 장사는 어땠어요?', tier: 'good', answer: '대박이었어요! 마지막 한 방이 시원하게 들어갔어요!' },
        { say: '배고파요', tier: 'meh', face: 'laugh', answer: '하하, 남은 생선 구워 드릴까요? 노을 반찬이에요!' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: ['밤바다 보세요. 오빠 등대 불이 바다에 길을 그려요.', '은빛 길이에요. 낮에는 절대 안 보이는 길.'],
      replies: [
        { say: '같이 그 길 봐요', tier: 'great', face: 'shy', answer: '…네. 조용히 보면 파도 소리랑 불빛이 박자가 맞아요.' },
        { say: '내일 경매 준비는요?', tier: 'good', answer: '다 끝났어요! 얼음도, 조명도, 목소리도 충전 중이에요!' },
        { say: '졸려요', tier: 'meh', face: 'calm', answer: '그럼 얼른 들어가요! 방파제 끝은 미끄러우니까 조심!' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비 와요! 잔나 언니는 맑다고 했는데! 제 코가 맞았어요! {me} 님도 봤죠?',
      replies: [
        { say: '럭스 코가 이겼어요', tier: 'great', remember: 'forecast-lux', answer: '그쵸?! 이따 언니한테 가서 자랑할 거예요! 같이 가요!' },
        { say: '오빠는 괜찮을까요?', tier: 'good', face: 'think', answer: '…등대 창문은 다 닫았겠죠? 꼼꼼한 척은 일등이에요.' },
        { say: '비 맞기 싫어요', tier: 'meh', answer: '천막 밑으로 오세요! 빗방울에 등불 비치는 것도 예뻐요!' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: ['바람 소리 들려요? 오빠 지금 꼭대기에서 돌고 있을 거예요.', '저는 방파제 등불 지켜요. 배가 다 들어올 때까지요.'],
      replies: [
        { say: '제가 같이 지킬게요', tier: 'great', remember: 'harbor-wait', face: 'shy', answer: '…든든해요. 등불 두 개면 빛이 둥글게 바다를 감싸요.' },
        { say: '가붕은 괜찮을까요?', tier: 'good', face: 'think', answer: '난간만 잡으면 괜찮아요. 오빠는 폭풍이랑 친해요. 이상하게요.' },
        { say: '안에 들어가요', tier: 'meh', face: 'sorry', answer: '마지막 배만 보고요! 약속해요. 조합장이니까요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이에요! 눈송이 하나하나가 빛을 꺾어요. 작은 프리즘이 막 내려와요!',
      replies: [
        { say: '정말 반짝여요', tier: 'great', remember: 'shine-fan', answer: '그쵸?! 이런 날은 경매 조명 안 켜도 돼요! 하늘이 켜 주니까요!' },
        { say: '생선은 안 얼어요?', tier: 'good', answer: '얼음 위에 있어서 괜찮아요! 오히려 싱싱해요!' },
        { say: '너무 추워요', tier: 'meh', face: 'sorry', answer: '앗, 화로 쪽으로 오세요! 손 녹이고 가세요!' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny', time: 'day' },
      open: '오늘 햇빛 공짜예요! 비늘마다 프리즘이에요. 장사하기 딱 좋은 날!',
      replies: [
        { say: '럭스 얼굴도 반짝여요', tier: 'great', face: 'shy', answer: '어머! 그건 땀이에요! …반은 기분이에요!' },
        { say: '그늘이 필요해요', tier: 'good', answer: '천막 밑 자리 내드릴게요! 생선은 그늘, 사람은 반쯤 햇빛!' },
        { say: '눈이 부셔요', tier: 'meh', face: 'calm', answer: '조합 모자 빌려 드릴게요! 반짝이 리본 달린 거예요. 더 눈부시려나?' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날은 빛이 모자라요! 그래서 오늘은 제가 두 배로 밝게 할 거예요!',
      replies: [
        { say: '럭스가 해 대신이네요', tier: 'great', face: 'laugh', answer: '맞아요! 오늘 어시장 해는 저예요! 눈부셔도 참아 주세요!' },
        { say: '흐린 날도 좋은데요', tier: 'good', face: 'think', answer: ['음… 물고기는 잘 물어요. 그건 인정!', '잔나 언니 예보는 또 맑음이었지만요!'] },
        { say: '오늘은 조용히 해요', tier: 'meh', face: 'sorry', answer: '헉, 조용히요? …노력해 볼게요. 딱 숨 세 번만요!' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄 참돔 들어왔어요! 비늘이 벚꽃색이에요. {me} 님, 행운 한 마리 어때요?',
      replies: [
        { say: '행운은 많을수록 좋죠', tier: 'great', answer: '그쵸! 오늘 경매 첫 상자는 봄 행운 상자예요!' },
        { say: '벚꽃은 어디서 봐요?', tier: 'good', face: 'think', answer: '언덕길이 제일이에요! 근데 참돔이 더 분홍빛이에요. 진짜로요!' },
        { say: '비싸 보여요', tier: 'meh', face: 'calm', answer: '봄엔 조금 비싸요. 대신 흥정 받아 드릴게요. 웃으면서 오세요!' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', time: ['evening', 'night'] },
      open: '오징어 배들 불 켜는 거 봐요! 바다에 별이 떨어진 것 같아요!',
      replies: [
        { say: '등대보다 밝네요', tier: 'great', face: 'laugh', answer: ['쉿! 오빠 들으면 삐져요!', '근데 맞아요. 오늘 밤만은 오징어 배 승!'] },
        { say: '오징어 사러 왔어요', tier: 'good', answer: '내일 새벽에 오세요! 지금 잡는 놈들이 경매에 올라와요!' },
        { say: '모기 많아요', tier: 'meh', face: 'sorry', answer: '앗, 모깃불 피워 드릴게요! 연기도 노을빛이라 예뻐요!' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: ['가을 전어 굽는 냄새 맡으셨죠?', '집 나간 사람도 돌아온대요. {me} 님도 돌아왔네요!'],
      replies: [
        { say: '냄새 따라왔어요', tier: 'great', face: 'laugh', answer: '하하! 역시! 한 마리 구워 드릴게요. 소금은 반짝이게 뿌려요!' },
        { say: '갈치는 없어요?', tier: 'good', answer: '있죠! 은빛 거울 갈치! 빛에 비춰 보고 고르세요!' },
        { say: '가시가 많아요', tier: 'meh', face: 'calm', answer: '가시는 제가 발라 드릴게요! 조합장 손은 빨라요!' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter', time: 'dawn' },
      open: '겨울 새벽 입김 보세요! 첫 햇살이 비치면 입김이 반짝여요!',
      replies: [
        { say: '같이 하얗게 불어 봐요', tier: 'great', remember: 'rainbow-ice', answer: ['후우! 봐요, 얼음에 무지개 떴어요!', '오늘 빛 일기는 이걸로 할래요!'] },
        { say: '방어 들어왔어요?', tier: 'good', answer: '기름 꽉 찬 놈으로요! 오늘 경매가 제일 뜨거울 거예요!' },
        { say: '손이 얼어요', tier: 'meh', face: 'sorry', answer: '화로 옆으로 오세요! 제 손은 늘 따뜻해요. 빛 때문인가 봐요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제예요! 오늘은 특별 경매! 마지막 한 방은 폭죽처럼 할 거예요!',
      replies: [
        { say: '제일 크게 외쳐 줘요!', tier: 'great', remember: 'auction-cheer', answer: ['맡겨 주세요! 등대까지 들리게 할게요!', '오빠가 대답하면 무승부예요!'] },
        { say: '뭐 파는데요?', tier: 'good', answer: '축제용 참돔이요! 행운의 붉은 물고기예요!' },
        { say: '구경만 할게요', tier: 'meh', face: 'calm', answer: '구경도 좋아요! 박수는 꼭 쳐 주세요!' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['{me} 님! 오늘 생일이죠?! 조합 게시판에 벌써 붙였어요!', '오늘 경매 첫 상자는 무조건 {me} 님 거예요!'],
      replies: [
        { say: '최고의 선물이에요', tier: 'great', face: 'laugh', answer: '아직 끝 아니에요! 마감 한 방은 생일 축하 외침이에요! 귀 막아요!' },
        { say: '조용히 지내고 싶어요', tier: 'good', face: 'shy', answer: ['그럼… 작게 할게요. 아니, 못 해요!', '대신 오늘 밤 등대 불 세 번 부탁해 둘게요.'] },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me} 님, 오늘 {fish} 잡았어요? 보여 주세요! 비늘부터요!',
      replies: [
        { say: '자, 빛에 비춰 봐요', tier: 'great', answer: '와! 이 빛 좀 보세요! {me} 님 손맛이 비늘에 묻어 있어요!' },
        { say: '팔 거예요', tier: 'good', answer: '좋아요! 조합장 특별가로 쳐 드릴게요! 공정하게요!' },
        { say: '작아서 창피해요', tier: 'meh', face: 'smile', answer: '작은 게 더 반짝일 때도 있어요! 창피할 거 하나도 없어요!' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었어요! 엄청난 걸 낚았다면서요! 조합 게시판에 크게 붙일게요!',
      replies: [
        { say: '경매에 올려 줄래요?', tier: 'great', answer: '그럼요! 오늘 마지막 한 방은 {me} 님 물고기예요! 대박 날 거예요!' },
        { say: '운이 좋았어요', tier: 'good', answer: '운도 실력이에요! 조합원들한테 그렇게 말할게요!' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물이요?! 빛에 비춰 봐도 돼요? 와, 금빛이 살아 있어요!',
      replies: [
        { say: '럭스 가게에 걸어 둬요', tier: 'great', face: 'wow', answer: '정말요?! 경매 조명보다 밝겠어요! 손님들이 다 쳐다볼 거예요!' },
        { say: '정성 들였어요', tier: 'good', answer: '그게 보여요! 정성은 꼭 반짝임으로 나와요!' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 오셨어요? 땀방울이 햇빛에 반짝여요! 수고하셨어요!',
      replies: [
        { say: '땀도 반짝인다니!', tier: 'great', answer: '하하! 반짝이는 건 다 좋아요! 오늘 생선은 덤 드릴게요!' },
        { say: '팔이 아파요', tier: 'good', answer: '그럼 오늘은 제가 생선 손질해 드릴게요. 쉬세요!' },
        { say: '바다가 더 좋은데요', tier: 'meh', face: 'think', answer: '밭도 바다도 다 좋죠! 둘 다 하는 사람이 제일 멋있어요!' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘 얼굴이 좀 흐려요. 제가 조금 비춰 드릴까요?',
      replies: [
        { say: '조금만 비춰 줘요', tier: 'great', face: 'smile', answer: ['자, 여기요. 손끝에서 작게.', '…괜찮아요. 흐린 날도 지나가요. 제가 보장해요.'] },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', face: 'calm', answer: '그래도 단 거 하나 드세요. 경매 끝나고 먹는 제 보상 나눠 드릴게요!' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님 오늘 얼굴이 반짝반짝해요! 좋은 일 있었죠? 다 말해 줘요!',
      replies: [
        { say: '럭스 보러 와서요', tier: 'great', face: 'shy', answer: '어머, 그런 말은 반칙이에요! 경매가로 못 매기는 말이에요!' },
        { say: '그냥 기분 좋아요', tier: 'good', answer: '그냥 좋은 날이 제일 좋은 날이에요! 저도 덩달아 반짝여요!' },
      ],
    },
    {
      id: 'op-news',
      when: { news: 'record' },
      open: '오늘 소식 보셨어요? 기록이 나왔대요! 조합 게시판이 반짝반짝해요!',
      replies: [
        { say: '다음엔 저예요!', tier: 'great', answer: '좋아요! 그날 마지막 한 방은 {me} 님 이름으로 외칠게요!' },
        { say: '축하할 일이네요', tier: 'good', answer: '그쵸! 조합에서 축하 생선구이 할 거예요! 오세요!' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '결혼 소식 들었어요?! 축하 경매 열어야겠어요! 참돔 두 마리 묶어서요!',
      replies: [
        { say: '럭스는 결혼 생각 있어요?', tier: 'great', face: 'shy', answer: ['어머! 갑자기요?!', '…오빠가 먼저 망원경으로 상대 검사할 거예요. 각오해요!'] },
        { say: '잔치에 생선 보내요', tier: 'good', answer: '벌써 얼음에 재워 뒀어요! 제일 반짝이는 놈들로요!' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기가 나왔대요! 조합 게시판이 난리예요! 비늘 봤어요?',
      replies: [
        { say: '저도 꼭 낚을 거예요', tier: 'great', answer: ['좋아요! 조합장이 물때 다 알려 드릴게요!', '낚으면 경매 말고 박물관이에요. 그런 건 값을 못 매겨요!'] },
        { say: '진짜 있는 거예요?', tier: 'good', face: 'think', answer: '있죠! 빛 좋은 날 바다 밑에서 반짝하는 게 보여요. 진짜예요!' },
      ],
    },
    {
      id: 'op-friendbday',
      when: { friendNews: 'birthday' },
      open: '오늘 생일인 친구가 있대요! 어시장에서 축하 생선구이 보낼까요?',
      replies: [
        { say: '같이 갖다줘요', tier: 'great', answer: '좋아요! 둘이 가면 축하가 두 배예요! 반짝이 리본도 달아요!' },
        { say: '단 게 좋을 것 같아요', tier: 'good', face: 'think', answer: '맞아요! 호박파이로 바꿀게요. 생일엔 단 거죠!' },
      ],
    },
    {
      id: 'op-fishing',
      when: { recent: 'fishing' },
      open: '요즘 낚시 자주 하시죠? 조합 장부에 {me} 님 이름이 자꾸 나와요!',
      replies: [
        { say: '조합장님 덕분이에요', tier: 'great', face: 'shy', answer: '헤헤, 그 말 장부 맨 위에 적을래요! 이달의 조합원 후보예요!' },
        { say: '손맛을 알았어요', tier: 'good', answer: '그 손맛 놓치지 마세요! 물이 반짝이는 쪽을 보면 더 잘 물어요!' },
        { say: '허리가 아파요', tier: 'meh', face: 'sorry', answer: '앗, 낚시는 허리예요! 쉬엄쉬엄! 츠나데 할머니 약 받아 드릴게요.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다 다녀왔어요? 바다 색이 어땠어요? 여기랑 달라요?',
      replies: [
        { say: '빛이 깊었어요', tier: 'great', face: 'wow', answer: '빛이 깊다니, 시인이에요! 저도 언젠가 꼭 가 볼래요. 오빠 몰래요!' },
        { say: '파도가 셌어요', tier: 'good', answer: '무사히 와서 다행이에요! 방파제 등불 켜 두길 잘했어요.' },
        { say: '뱃멀미 했어요', tier: 'meh', face: 'sorry', answer: '헉! 생강차 드릴게요. 뱃멀미엔 그게 최고예요!' },
      ],
    },
    {
      id: 'op-casino',
      when: { recent: 'casinoLose' },
      open: '카지노에서 좀 잃으셨다면서요? 괜찮아요, 생선은 배신 안 해요!',
      replies: [
        { say: '럭스 말이 맞아요', tier: 'great', face: 'laugh', answer: '그쵸! 오늘 고등어 덤으로 드릴게요. 운은 바다에서 다시 낚아요!' },
        { say: '미스 포츈 씨 무서워요', tier: 'good', face: 'laugh', answer: '그분 웃음은 반짝이는데 눈빛이 날카로워요! 저도 조심해요!' },
        { say: '다음엔 딸 거예요', tier: 'meh', face: 'think', answer: '음… 그 말 오빠도 했어요. 그리고 도시락값까지 다 잃었어요!' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관 다녀오셨어요? 제가 기증한 반짝이 조개 보셨어요?',
      replies: [
        { say: '제일 반짝였어요', tier: 'great', answer: '그쵸?! 조명 각도 제가 부탁드렸어요! 빛 배치는 자신 있어요!' },
        { say: '못 봤어요', tier: 'good', face: 'sorry', answer: '창가 쪽 두 번째 칸이에요! 다음엔 꼭 봐 주세요!' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['오늘 {other} 씨랑 좀 서먹해요. 제가 너무 크게 말했나 봐요.', '…흐린 날 같은 기분이에요.'],
      replies: [
        { say: '먼저 웃으면서 가 봐요', tier: 'great', face: 'smile', answer: '맞아요. 흥정도 웃으면서 시작하잖아요. 사탕 하나 들고 갈래요!' },
        { say: '시간이 해결해 줘요', tier: 'good', face: 'think', answer: '그렇겠죠? 내일 첫 햇살 보면 괜찮아질 거예요.' },
        { say: '럭스 잘못 아니에요', tier: 'meh', face: 'calm', answer: '고마워요. 근데 반은 제 목소리 탓이에요. 인정할래요.' },
      ],
    },
    {
      id: 'op-gabung',
      when: { bond: 'gabung' },
      open: '오빠 만났죠? 또 제 얘기 했죠? 밥 먹었냐, 목은 괜찮냐, 그렇죠?',
      replies: [
        { say: '네, 엄청 걱정하던데요', tier: 'great', remember: 'brother-lunch', face: 'shy', answer: '…진짜 못 말려요. 내일 도시락에 생선 하나 더 넣어야겠어요.' },
        { say: '도시락 자랑하던데요', tier: 'good', face: 'laugh', answer: '하하! 그럴 줄 알았어요! 투덜대면서 싸 준 거라고 했죠?' },
        { say: '수풀에 숨어 있던데요', tier: 'meh', face: 'laugh', answer: '또요?! 순찰이라고 했죠? 다 알아요!' },
      ],
    },
    {
      id: 'op-with-gabung',
      when: { with: 'gabung' },
      open: ['오빠가 또 따라왔어요! 순찰이래요.', '{me} 님, 우리 {other} 오빠 좀 보세요. 어시장에 갑옷이라니!'],
      replies: [
        { say: '든든한 오빠네요', tier: 'great', face: 'shy', answer: ['…든든하긴 해요.', '근데 생선 상자 앞에서 망토 휘날리면 비늘이 날려요!'] },
        { say: '두 분 닮았어요', tier: 'good', face: 'laugh', answer: '목소리만요! 얼굴은 제가 더 반짝여요. 오빠도 인정했어요!' },
        { say: '저 먼저 갈게요', tier: 'meh', face: 'sorry', answer: '앗, 오빠 때문이면 안 돼요! 오빠, 저기 수풀로 가 있어요!' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 언니 만났어요? 예보 틀렸다고 제 얘기 했어요? 제가 먼저 했어요!',
      replies: [
        { say: '럭스 코가 대단하대요', tier: 'great', remember: 'forecast-lux', face: 'wow', answer: '정말요?! 언니가 인정했다고요?! 오늘 게시판에 붙일래요!' },
        { say: '둘이 사이좋던데요', tier: 'good', face: 'shy', answer: '…사이는 좋아요. 예보만 안 맞아요. 그게 재밌어요!' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: '{other} 언니랑 내일 날씨 내기 중이에요! {me} 님은 누구 편이에요?',
      replies: [
        { say: '럭스 코 편이요', tier: 'great', remember: 'forecast-lux', face: 'laugh', answer: '들었죠, 언니?! 이걸로 제가 한 판 앞서요! 사탕은 제가 받아요!' },
        { say: '잔나 편이요', tier: 'good', face: 'sorry', answer: '배신이에요! …괜찮아요, 언니 바람개비도 가끔은 맞아요!' },
        { say: '둘 다 틀릴 것 같아요', tier: 'meh', face: 'think', answer: '헉, 그게 제일 무서운 답이에요! 그럼 셋이 내기해요!' },
      ],
    },
    {
      id: 'op-yanineko',
      when: { bond: 'yanineko' },
      open: '{other} 씨 봤어요? 오늘은 생선 얻으러 안 왔더라고요. 좀 서운해요!',
      replies: [
        { say: '이따 들른대요', tier: 'great', answer: '정말요?! 그럼 제일 반짝이는 꼬리 남겨 둘게요!' },
        { say: '낮잠 자던데요', tier: 'good', face: 'laugh', answer: '하하, 그럼 냄새로 깨우면 돼요. 구이 하나 굽죠!' },
      ],
    },
    {
      id: 'op-tsunade',
      when: { bond: 'tsunade' },
      open: '{other} 할머니 뵀어요? 제가 소매에 빛 숨기는 걸 처음 알아챈 분이에요.',
      replies: [
        { say: '럭스 칭찬하셨어요', tier: 'great', face: 'shy', answer: '어머… 정말요? 내일 꿀 한 병 갖다 드려야겠어요!' },
        { say: '오빠 꿀밤 얘기 하시던데요', tier: 'good', face: 'laugh', answer: '하하하! 그 얘기 저도 백 번 들었어요! 오빠는 아직도 떨어요!' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other} 씨 만났어요? 우리 낚시 내기 중이거든요! 오늘 뭐 잡았대요?',
      replies: [
        { say: '럭스가 이길 거예요', tier: 'great', answer: '그쵸?! 저는 빛으로 고기를 부르거든요! 반칙 아니에요! 재능이에요!' },
        { say: '큰 거 잡았대요', tier: 'good', face: 'think', answer: '으으, 지금 바로 바다 가야겠어요! 가게 잠깐 봐 줄래요?' },
      ],
    },
    {
      id: 'op-with-nilah',
      when: { with: 'nilah' },
      open: '{other} 씨랑 낚시 내기 결판 내는 날이에요! {me} 님이 심판 봐 줄래요?',
      replies: [
        { say: '공정하게 볼게요', tier: 'great', remember: 'nilah-bet', answer: '좋아요! 조합장도 반칙 없이 해요. 빛으로 고기 부르기만 빼고요!' },
        { say: '닐라 씨 응원할래요', tier: 'good', face: 'laugh', answer: '으앗! 그럼 저는 제가 응원할래요. 목소리는 제가 더 크니까요!' },
      ],
    },
    {
      id: 'op-with-captain',
      when: { with: 'captain' },
      open: ['{other} 선장님이랑 생선값 흥정 중이에요!', '웃음소리 때문에 제 목소리가 안 들려요!'],
      replies: [
        { say: '럭스가 이길 거예요', tier: 'great', face: 'laugh', answer: '그쵸?! 마지막 한 방 들어갑니다! …선장님이 또 웃으셨어요!' },
        { say: '선장님 편 들래요', tier: 'good', face: 'sorry', answer: '배신자! 그럼 주점 노래자랑에서 같이 꼴찌 해요!' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-shine',
      when: { mem: 'shine-fan' },
      use: 'shine-fan',
      open: '{me} 님! 반짝이는 비늘 좋아한다고 했죠? 오늘 제일 반짝이는 놈 빼 뒀어요!',
      replies: [
        { say: '역시 럭스!', tier: 'great', answer: '헤헤, 단골 취향은 다 외워요! 빛에 비춰 보고 가세요!' },
        { say: '기억하고 있었어요?', tier: 'good', face: 'shy', answer: '반짝이는 건 잘 안 잊어요. {me} 님 말도요!' },
      ],
    },
    {
      id: 'cb-auction',
      when: { mem: 'auction-cheer' },
      use: 'auction-cheer',
      open: '저번에 마지막 한 방 응원해 줬잖아요. 그 뒤로 더 크게 외쳐요!',
      replies: [
        { say: '등대까지 들렸어요', tier: 'great', face: 'laugh', answer: '하하하! 오빠가 대답했대요! 항구가 시끄러워졌어요!' },
        { say: '목 아끼세요', tier: 'good', answer: '알아요! 꿀물 마시면서 할게요. 오빠한테는 비밀이에요!' },
      ],
    },
    {
      id: 'cb-prism',
      when: { mem: 'prism-gift' },
      use: 'prism-gift',
      open: '창에 단 유리 조각, 각도를 바꿨어요. 이제 무지개가 계산대 위에 떠요!',
      replies: [
        { say: '내일 새벽에 볼게요', tier: 'great', answer: '좋아요! 해 뜨자마자 오세요! 제일 진한 무지개를 보여 드릴게요!' },
        { say: '계산대가 바쁘겠네요', tier: 'good', face: 'laugh', answer: '하하, 손님들이 무지개 구경하느라 계산을 까먹어요!' },
      ],
    },
    {
      id: 'cb-brother',
      when: { mem: 'brother-side' },
      use: 'brother-side',
      open: '저번에 제 편 들어 줬잖아요. 오빠한테 말했더니 망원경을 서랍에 넣었대요!',
      replies: [
        { say: '정의가 이겼네요', tier: 'great', face: 'laugh', answer: '하하하! 오빠 말투예요! 그 말 들으면 오빠가 좋아할걸요!' },
        { say: '오빠가 좀 짠하네요', tier: 'good', face: 'think', answer: '…그쵸. 그래서 오늘 도시락에 단 거 하나 넣어 줬어요.' },
      ],
    },
    {
      id: 'cb-sweet',
      when: { mem: 'sweet-tooth' },
      use: 'sweet-tooth',
      open: '단 거 좋아한다고 했죠? 호박파이 한 조각 남겨 뒀어요! 반씩 나눠요!',
      replies: [
        { say: '경매 끝난 보상이죠?', tier: 'great', answer: '맞아요! 오늘은 둘이 받는 보상이에요! 반짝반짝 맛있어요!' },
        { say: '럭스가 다 먹어요', tier: 'good', face: 'shy', answer: '안 돼요! 나눠 먹어야 맛있어요. 오빠한테 배운 몇 안 되는 거예요!' },
      ],
    },
    {
      id: 'cb-guild',
      when: { mem: 'guild-join' },
      use: 'guild-join',
      open: '조합원 {me} 님! 오늘 물때 공유할게요. 해 질 무렵 방파제가 좋아요!',
      replies: [
        { say: '조합장님 믿고 갈게요', tier: 'great', answer: '좋아요! 잡으면 조합 게시판에 자랑하기! 그게 규칙이에요!' },
        { say: '같이 가요', tier: 'good', face: 'shy', answer: '…가게 끝나고요! 오빠한테 불빛 좀 비춰 달라고 할게요.' },
      ],
    },
    {
      id: 'cb-home',
      when: { mem: 'home-story' },
      use: 'home-story',
      open: ['저번에 하얀 고향 얘기 했잖아요.', '어젯밤 꿈에 나왔는데요, 이상하게 항구 냄새가 났어요!'],
      replies: [
        { say: '여기가 진짜 집이네요', tier: 'great', face: 'shy', answer: ['…그런가 봐요. 꿈까지 시끄러웠어요.', '{me} 님도 꿈에 잠깐 나왔어요. 비밀이에요!'] },
        { say: '고향이 그리워요?', tier: 'good', face: 'think', answer: '가끔요. 그래도 오빠도 여기 있고, 바다도 있어요. 충분해요!' },
      ],
    },
    {
      id: 'cb-tsunade',
      when: { mem: 'tsunade-tea' },
      use: 'tsunade-tea',
      open: '츠나데 할머니 약초차에 꿀 넣은 거 들켰어요! 엄청 혼났어요!',
      replies: [
        { say: '같이 혼나 줄게요', tier: 'great', face: 'laugh', answer: '하하, 진짜요? 그럼 다음엔 둘이 꿀 반 숟가락씩 넣어요!' },
        { say: '할머니라고 불렀죠?', tier: 'good', face: 'wow', answer: '어떻게 알았어요?! 그것까지 들켜서 두 번 혼났어요!' },
      ],
    },
    {
      id: 'cb-nilah',
      when: { mem: 'nilah-bet' },
      use: 'nilah-bet',
      open: '닐라 씨랑 내기 결과요! 제가 한 마리 차이로 이겼어요! 우유 받았어요!',
      replies: [
        { say: '역시 조합장!', tier: 'great', face: 'laugh', answer: '헤헤! 우유 반 병 드릴게요. 응원값이에요!' },
        { say: '봐준 거 아니에요?', tier: 'good', face: 'think', answer: ['…그럴 리가요!', '아니, 물속에서 웃고 있긴 했는데. 설마요?'] },
      ],
    },
    {
      id: 'cb-signal',
      when: { mem: 'light-signal' },
      use: 'light-signal',
      open: ['어젯밤 등대 불빛 세 번 봤어요?', '그거 오빠가 {me} 님한테도 보낸 거래요. 처음 있는 일이에요!'],
      replies: [
        { say: '저도 괜찮다는 뜻이죠?', tier: 'great', face: 'wow', answer: '맞아요! 오빠가 {me} 님을 식구 줄에 세운 거예요. 큰일이에요!' },
        { say: '손 흔들어 줄걸', tier: 'good', face: 'laugh', answer: '다음엔 흔들어요! 오빠가 꼭대기에서 백 바퀴 돌 거예요!' },
      ],
    },
    {
      id: 'cb-season',
      when: { mem: 'fav-season' },
      use: 'fav-season',
      open: '가을 갈치 좋아한다고 했죠? 철 되면 제일 긴 은빛 놈 빼 둘게요!',
      replies: [
        { say: '거울처럼 반짝이겠다', tier: 'great', answer: '그쵸! {me} 님 얼굴 비춰 보고 가세요! 조합장 약속이에요!' },
        { say: '기억하고 있었어요?', tier: 'good', face: 'shy', answer: '단골 취향은 반짝이 펜으로 적어요. 안 지워져요!' },
      ],
    },
    {
      id: 'cb-diary',
      when: { mem: 'light-diary' },
      use: 'light-diary',
      open: ['빛 일기 보여 드릴게요. 딱 한 줄만요.', '오늘도 {me} 님이 왔다. 반짝.'],
      replies: [
        { say: '적어 줘서 고마워요', tier: 'great', face: 'shy', answer: '…쓸 게 그것밖에 없는 날도 있어요. 좋은 뜻이에요!' },
        { say: '다음 장도 보여 줘요', tier: 'good', face: 'laugh', answer: '안 돼요! 거긴 오빠 흉이 가득해요!' },
      ],
    },
    {
      id: 'cb-brother-gift',
      when: { mem: 'brother-gift' },
      use: 'brother-gift',
      open: ['오빠 생일에 파란 망토 줬어요!', '등대 꼭대기에서 망토 휘날리며 돌았대요. 해 질 때까지요!'],
      replies: [
        { say: '대성공이네요', tier: 'great', face: 'laugh', answer: '대성공이죠! 근데 어지러워서 저녁은 제가 떠먹여 줬어요!' },
        { say: '울지는 않았어요?', tier: 'good', face: 'think', answer: '안 울었대요. 근데 눈이 빨갰어요. 바닷바람 탓이래요!' },
      ],
    },
    {
      id: 'cb-first-auction',
      when: { mem: 'first-auction' },
      use: 'first-auction',
      open: '첫 경매 얘기 기억해요? 어제 새로 온 견습 상인이 금붕어가 됐어요!',
      replies: [
        { say: '럭스가 도와줬죠?', tier: 'great', face: 'smile', answer: ['그럼요! 맨 뒤에서 제일 크게 값을 불렀어요.', '오빠가 해 준 그대로요. 이제야 그 마음 알겠어요.'] },
        { say: '금붕어도 반짝여요', tier: 'good', face: 'laugh', answer: '하하! 제가 했던 말이네요! 그 말도 그대로 해 줬어요!' },
      ],
    },
    {
      id: 'cb-harbor',
      when: { mem: 'harbor-wait' },
      use: 'harbor-wait',
      open: '방파제에서 같이 기다려 준다고 했죠? 어젯밤 마지막 배 무사히 왔어요!',
      replies: [
        { say: '정말 다행이에요', tier: 'great', face: 'smile', answer: ['네! 등불 하나는 {me} 님 자리에 걸어 뒀어요.', '그래서 더 밝았나 봐요.'] },
        { say: '다음엔 꼭 갈게요', tier: 'good', face: 'shy', answer: '약속이에요! 등불 두 개, 늘 준비해 둘게요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님이 좋아하는 거, {taste}. 맞죠? 단골 장부에 반짝이 펜으로 적어 뒀어요!',
      replies: [
        { say: '반짝이 펜이라니!', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: '중요한 건 반짝이로 적어요! 그게 제 장부 규칙이에요!' },
        { say: '기억해 줘서 고마워요', tier: 'good', remember: 'taste-heard', answer: '단골 취향 외우는 게 조합장 일이에요! 헤헤.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 다녔을 때요, 오빠가 망원경으로 내내 따라왔대요! 알았어요?',
      replies: [
        { say: '다음엔 오빠도 데려가요', tier: 'great', remember: 'outing-talk', face: 'laugh', answer: '하하하! 그럼 목소리 큰 사람이 둘이에요! 좋아요, 시끄럽게 가요!' },
        { say: '몰랐어요!', tier: 'good', remember: 'outing-talk', face: 'sorry', answer: '저도 나중에 알았어요! 다음엔 수풀 많은 길로 가요. 오빠 못 따라오게!' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me} 님, 곧 생일이죠? 그날 경매 마지막 한 방은 생일 축하로 할게요!',
      replies: [
        { say: '항구가 다 알겠네요', tier: 'great', remember: 'bday-plan', face: 'laugh', answer: '그게 목적이에요! 오빠는 등불로, 저는 목소리로 축하할게요!' },
        { say: '부끄러워요', tier: 'good', remember: 'bday-plan', face: 'shy', answer: '그럼 작게 할게요… 아니, 못 해요! 크게 할게요!' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '{me} 님 방에서 손끝 반짝임 보여 드린 날, 오빠한테도 안 보여 준 거예요.',
      replies: [
        { say: '둘만의 비밀이에요', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…네. 그 반짝임은 경매에 절대 안 올려요. {me} 님 거예요.' },
        { say: '또 보여 줘요', tier: 'good', remember: 'date-talk', face: 'smile', answer: '헤헤, 다음엔 더 밝게 할게요. 연습해 둘게요!' },
      ],
    },
  ],
  chapters: [
    {
      title: '경매장의 첫 손님',
      hint: '한 번 이야기를 나누면 럭스가 새벽 경매 이야기를 들려줘요.',
      need: { days: 1 },
      scene: [
        '이른 새벽 항구 어시장. 얼음 깨지는 소리에 갈매기 소리가 섞인다.',
        '럭스가 얼음 상자 위로 훌쩍 올라서더니 손나팔을 만든다.',
        '"어서 오세요! 저는 럭스, 어시장 상인이자 낚시조합장이에요!"',
        '"{me} 님, 경매 처음이죠? 얼굴에 다 써 있어요. 눈이 동그래요!"',
        '그녀가 경매 막대를 빙글 돌린다. 끝에 달린 유리구슬이 빛을 튕긴다.',
        '"규칙은 간단해요. 갖고 싶으면 손 번쩍, 값은 크게 외치기!"',
        '"그리고 마지막은 제가 한 방에 끝내요. 숨 모았다가, 낙찰!"',
        '멀리 등대 꼭대기에서 불빛이 한 번 깜빡인다.',
        '"아, 저건 오빠예요. 신경 쓰지 마요. 원래 저래요!"',
        '"자, 첫 상자 올라갑니다! {me} 님, 구경만 말고 같이 외쳐요!"',
      ],
      replies: [
        { say: '그 한 방 꼭 볼게요!', tier: 'great', remember: 'auction-cheer', answer: ['좋아요! 첫 손님 기념으로 오늘 한 방은 {me} 님한테 바칠게요!', '귀는 꼭 막으세요. 진심이에요!'] },
        { say: '저는 목소리가 작아요', tier: 'good', face: 'smile', answer: '괜찮아요! 손만 번쩍 드세요. 제가 다 봐요. 눈이 밝거든요!' },
        { say: '그냥 사기만 할게요', tier: 'meh', face: 'calm', answer: '그것도 좋아요! 정가 손님도 소중한 손님이에요!' },
      ],
    },
    {
      title: '새벽 시장의 첫 햇살',
      hint: '새벽(게임 시각 네 시부터 일곱 시) 시장 거리에 가 보세요. 럭스가 첫 햇살을 보여 준대요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 4, to: 7 } },
      scene: [
        '아직 어두운 시장 거리. 가게 덧문은 모두 내려가 있다.',
        '럭스가 얼음 상자를 수레에 싣다가 손을 크게 흔든다.',
        '"왔다! 딱 맞춰 왔어요! 쉿, 잠깐만요. 이제 곧이에요."',
        '그녀가 얼음 조각 하나를 들어 동쪽 하늘에 비스듬히 댄다.',
        '첫 햇살이 얼음에 닿자, 골목 벽에 무지개가 일곱 줄로 퍼진다.',
        '빵집 굴뚝 연기까지 잠깐 일곱 빛깔로 물든다.',
        '"이거예요. 매일 아침 이걸 보려고 제일 먼저 나와요."',
        '"어릴 땐 제 손에서 나는 빛이 무서웠어요. 숨길 곳만 찾았죠."',
        '"근데 어느 날 아침 얼음에서 이걸 봤어요. 빛도 예쁠 수 있구나."',
        '무지개가 천천히 옅어진다. 럭스가 얼음을 수레에 도로 싣는다.',
        '"…처음으로 누구한테 보여 줬어요. 오빠한테도 안 보여 줬는데."',
      ],
      replies: [
        { say: '럭스 빛도 이만큼 예뻐요', tier: 'great', remember: 'dawn-market', face: 'shy', answer: ['…아침부터 그런 말 하면 반칙이에요!', '오늘 경매 목소리 떨리겠어요. {me} 님 탓이에요!'] },
        { say: '같이 봐서 좋아요', tier: 'good', remember: 'dawn-market', answer: '저도요! 혼자 보던 걸 같이 보니까 무지개가 한 줄 늘어난 것 같아요!' },
        { say: '너무 추워요', tier: 'meh', remember: 'dawn-market', face: 'laugh', answer: '하하, 새벽 시장은 원래 그래요! 화로 옆으로 가요!' },
      ],
    },
    {
      title: '보석에 비친 빛',
      hint: '럭스가 반짝이는 보석 이야기를 했어요. 보석 원석 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'gem', take: true } },
      scene: [
        '오후의 어시장. 경매가 끝난 뒤라 가게 안이 조용하다.',
        '보석 원석을 건네자 럭스의 눈이 동그래진다.',
        '"이거… 저 주는 거예요? 진짜요? 잠깐만요, 손부터 닦을게요!"',
        '그녀가 앞치마에 손을 몇 번이나 문지르고 원석을 받아 든다.',
        '"빛에 비춰 볼게요. 이건 경매 조명 말고 햇빛이어야 해요."',
        '창가 유리 조각 옆에 대자, 가게 안에 작은 별빛이 흩어진다.',
        '얼음 위 생선 비늘마다 별이 하나씩 내려앉는다.',
        '"봐요! 안에 빛이 갇혀 있다가 이제 나왔어요."',
        '"광산은 깜깜해서 싫은데, 이런 게 거기서 나온다니 신기하죠."',
        '"…꼭 어릴 때 저 같아요. 숨기다가, 누가 꺼내 주길 기다리던."',
        '럭스가 원석을 두 손으로 감싸 쥔다. 손가락 사이로 빛이 샌다.',
        '"이번엔 제 손에서 새는 거 아니에요. 원석 빛이에요. …아마도요!"',
      ],
      replies: [
        { say: '이제 숨기지 마요', tier: 'great', remember: 'gem-light', face: 'shy', answer: ['…네.', '{me} 님 앞에서는 안 숨길게요. 약속이에요.'] },
        { say: '가게 창에 걸어 둬요', tier: 'good', remember: 'gem-light', answer: '그럴게요! 유리 조각 옆에 두면 무지개가 두 배예요!' },
        { say: '팔면 비싸겠다', tier: 'meh', remember: 'gem-light', face: 'laugh', answer: '하하! 이건 경매에 안 올려요! 절대로요!' },
      ],
    },
    {
      title: '소매 속의 빛',
      hint: '럭스에게서 어릴 때 숨기던 빛 이야기를 들으면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'hidden-light' },
      scene: [
        '장사가 끝난 어시장. 얼음물 빠지는 소리만 졸졸 들린다.',
        '럭스가 등을 하나만 남기고 끈다. 그리고 소매를 천천히 걷는다.',
        '"전에 숨기던 빛 얘기 했죠. 그 뒷이야기, 해도 돼요?"',
        '"어느 밤 이불 속에서 손이 너무 밝아져서 울었어요. 들킬까 봐요."',
        '"근데 문 앞에서 오빠 목소리가 났어요. 괜찮다, 아무도 안 본다."',
        '"오빠는 그날 밤새 제 방 문 앞에 앉아 있었어요. 등불을 들고요."',
        '"무서우면 등불을 세 번 깜빡이래요. 그럼 자기가 온다고."',
        '그녀가 웃으며 등대 쪽을 본다. 멀리 불빛이 느리게 돈다.',
        '"다음 날엔 츠나데 할머니가 오셨어요. 제 손을 잡고 그러셨죠."',
        '"빛은 숨기는 게 아니라 나누는 거라고. 대신 천천히 배우라고."',
        '"그래서 과보호라고 투덜대도… 도시락은 계속 싸게 되나 봐요."',
        '손바닥 위로 작은 빛이 피어오른다. 반딧불만 한 빛이다.',
        '"{me} 님한테는 그냥 보여 주고 싶었어요. 숨기지 않고요."',
      ],
      replies: [
        { say: '그 빛, 따뜻하다', tier: 'great', face: 'shy', answer: ['…그 말 처음 들어요. 다들 밝다고만 했거든요.', '따뜻하구나, 이거. 오늘 빛 일기 맨 위에 적을래요.'] },
        { say: '오빠한테 고맙다고 해요', tier: 'good', face: 'think', answer: '…언젠가요! 지금 하면 등대 꼭대기에서 백 바퀴 돌걸요!' },
        { say: '오빠도 대단하네요', tier: 'meh', face: 'laugh', answer: '하하, 그건 오빠한테 절대 말하지 마세요! 목소리가 두 배 돼요!' },
      ],
    },
    {
      title: '경매에 안 올리는 것',
      hint: '럭스와 아주 가까워지면 경매에 절대 안 올리는 것 이야기를 해요. 꽃다발 얘기도 살짝요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 저녁, 불 꺼진 경매장. 물결 소리가 기둥을 두드린다.',
        '럭스가 경매 종을 만지작거리다 얼음 상자에 걸터앉는다.',
        '"{me} 님, 저 뭐든 값을 매길 수 있거든요. 생선도, 보석도."',
        '"비늘 한 번 보면 값이 나오고, 손님 얼굴 보면 흥정이 나와요."',
        '"근데 요즘 값을 못 매기는 게 하나 생겼어요."',
        '그녀가 장부를 펼친다. 맨 뒷장에 반짝이 펜으로 뭔가 적혀 있다.',
        '"이건 안 보여 줘요! …아니, 이름 하나 적힌 거예요. 그냥요."',
        '그녀의 손끝이 자꾸 반짝인다. 숨기려다, 그만둔다.',
        '"잔나 언니가 오늘 바람이 좋대요. 처음으로 언니 예보를 믿어 봐요."',
        '"좋은 바람이 불 때 하고 싶은 말이 있었거든요."',
        '"…꽃다발 같은 거 받으면 어시장 한가운데서 소리 지를 것 같아요."',
        '"그냥요! 그냥 하는 말이에요! 경매장이라 목소리가 커서 그래요!"',
      ],
      replies: [
        { say: '그게 뭔지 알 것 같아요', tier: 'great', face: 'shy', answer: ['…알면 말하지 마요!', '제가 먼저 마지막 한 방으로 말할 거예요. 기다려요!'] },
        { say: '손끝이 반짝여요', tier: 'good', face: 'laugh', answer: ['앗! 보지 마세요!', '…아니, 봐도 돼요. 이제 안 숨기기로 했잖아요.'] },
        { say: '배고파요, 밥 먹어요', tier: 'meh', face: 'calm', answer: '하하… 그래요. 생선구이 해 드릴게요. 말은 다음에 할게요.' },
      ],
    },
    {
      title: '마지막 한 방',
      hint: '럭스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽 경매가 끝난 뒤. 첫 햇살이 얼음 위에서 부서진다.',
        '럭스가 얼음 상자 위에 다시 올라선다. 경매 막대를 높이 든다.',
        '"여러분! 가지 마세요! 오늘 마지막 경매가 하나 남았어요!"',
        '상인들이 웅성거린다. 야니네코가 생선 꼬리를 문 채 멈춰 선다.',
        '츠나데는 팔짱을 끼고 빙긋 웃는다. 잔나는 하늘을 한 번 본다.',
        '"이건 안 팔아요! 제 마음이에요! 이미 {me} 님 거예요!"',
        '그녀가 숨을 모은다. 손끝에서 빛이 활짝 퍼진다. 이번엔 안 숨긴다.',
        '"낙찰! 마지막 한 방이에요!"',
        '시장 사람들이 박수를 친다. 멀리 등대 불빛이 세 번 깜빡인다.',
        '"…오빠까지 다 봤네요. 저건 괜찮다는 신호예요. 어릴 때부터요."',
        '럭스가 상자에서 뛰어내려 앞에 선다. 볼이 새빨갛다.',
        '"이제 평생 같이 있어야 해요, {me} 님. 경매 규칙이에요!"',
      ],
      replies: [
        { say: '평생 낙찰이에요', tier: 'great', face: 'laugh', answer: ['낙찰! 진짜 마지막 한 방이에요!', '반지는… {me} 님이 쏘는 걸로 해요. 기다릴게요!'] },
        { say: '오빠한테 인사 가요', tier: 'good', face: 'smile', answer: ['좋아요! 같이 가요.', '오빠 아마 꼭대기에서 돌고 있을 거예요. 기뻐서요!'] },
        { say: '부끄러워요', tier: 'meh', face: 'shy', answer: '저도요! 근데 숨기는 건 이제 그만할래요. 반짝이는 대로 갈래요.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 여기까지! 내일 새벽 경매 때 봐요!',
    '또 오셨어요? 반가워요! 오늘 제일 반짝이는 건 벌써 보셨죠?',
    '오빠 만나면 밥 먹으라고 전해 주세요! 제가 말한 건 비밀로요!',
    '마지막 한 방은 내일로 아껴 둘게요. 조심히 가세요!',
    '얼음 갈아야 해서요! 이따 노을 질 때 바다 한 번 봐요!',
    '잔나 언니 예보 들었어요? 저는 바다 냄새 믿을래요. 또 봐요!',
    '오늘 빛 일기엔 {me} 님 적을게요. 벌써 정했어요!',
  ],
};
