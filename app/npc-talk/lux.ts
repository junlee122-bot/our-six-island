// 럭스 — 항구 어시장 상인 겸 낚시조합장. 밝고 에너지 넘치는 해요체 흥정꾼.
// 새벽 경매 목청이 제일 크고, 빛·프리즘·반짝임 이야기를 좋아한다. 경매는
// '마지막 한 방'으로 끝낸다. 어릴 때 손에서 새던 빛을 숨기던 기억, 오빠 가붕의
// 과보호에 투덜대면서도 도시락은 챙긴다. 잔나 예보와 투덕. 원작(럭스) 대사는
// 옮기지 않고 말버릇과 소재만 빌린다.
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
  },
  talks: [
    {
      id: 'scale-shine',
      open: '{me} 님, 이 비늘 좀 보세요! 빛에 비추면 색이 일곱 번 바뀌어요!',
      replies: [
        { say: '와, 진짜 반짝여요!', tier: 'great', remember: 'shine-fan', answer: '그쵸?! 이 반짝임 알아보는 사람이 진짜 단골이에요! 덤 드릴게요!' },
        { say: '맛은 어때요?', tier: 'good', answer: '맛도 최고죠! 근데 먼저 눈으로 한 번 드셔 보세요. 그게 어시장 예절이에요!' },
        { say: '그냥 생선인데요', tier: 'meh', face: 'sorry', answer: '그냥 생선이라뇨! …괜찮아요, 언젠간 보이실 거예요. 제가 보여 드릴게요!' },
      ],
    },
    {
      id: 'last-shot',
      open: '경매 마감할 때 제가 뭐라고 외치는지 아세요? 마지막 한 방이에요!',
      replies: [
        { say: '그거 들으면 속 시원해요', tier: 'great', remember: 'auction-cheer', answer: '그쵸?! 빛을 한데 모아서 쏘는 느낌이에요! 내일도 크게 쏠게요!' },
        { say: '왜 하필 한 방이에요?', tier: 'good', face: 'think', answer: '질질 끌면 생선이 식어요! 마지막은 짧고 밝게, 그게 제 방식이에요!' },
        { say: '좀 시끄럽던데요', tier: 'meh', face: 'laugh', answer: '하하, 오빠보단 조용해요! 그건 확실해요!' },
      ],
    },
    {
      id: 'prism',
      open: '가게 창에 유리 조각 하나 달아 뒀어요. 아침마다 무지개가 생겨요!',
      replies: [
        { say: '저도 보고 싶어요', tier: 'great', remember: 'prism-gift', answer: '해 뜰 때 오세요! 무지개가 생선 위에 딱 내려앉아요. 제일 예쁜 순간이에요!' },
        { say: '그걸 어떻게 알았어요?', tier: 'good', answer: '어릴 때부터 빛을 쫓아다녔거든요. 빛이 어디로 꺾이는지 다 외웠어요!' },
        { say: '눈부시지 않아요?', tier: 'meh', face: 'calm', answer: '조금요! 그래서 손님 쪽은 피해서 달았어요. 배려예요!' },
      ],
    },
    {
      id: 'hidden-light',
      open: ['어릴 때요, 손에서 빛이 새어 나올 때가 있었어요.', '그때는 들킬까 봐 소매에 꼭 숨겼어요. 이상하죠?'],
      replies: [
        { say: '하나도 안 이상해요', tier: 'great', remember: 'hidden-light', face: 'shy', answer: '…고마워요. 그 말 그때 들었으면 좋았을 텐데. 지금 들어서 다행이에요.' },
        { say: '지금도 빛나요?', tier: 'good', face: 'smile', answer: '가끔요! 기분 좋을 때 손끝이 반짝해요. 이제 안 숨겨요!' },
        { say: '무서웠겠어요', tier: 'meh', face: 'think', answer: '조금요. 근데 오빠가 못 본 척해 줬어요. 그게 오빠다운 거였어요.' },
      ],
    },
    {
      id: 'brother-lunch',
      open: '오늘 오빠 도시락 쌌어요. 투덜거리면서요! 근데 생선은 제일 좋은 걸로요.',
      replies: [
        { say: '착한 동생이네요', tier: 'great', remember: 'brother-lunch', face: 'shy', answer: '착한 거 아니에요! 그냥… 굶으면 등불 켜다 쓰러질까 봐요!' },
        { say: '오빠가 좋아하겠어요', tier: 'good', answer: '좋아서 계단에서 돈대요. 그건 좀 안 했으면 좋겠어요.' },
        { say: '직접 싸라고 하세요', tier: 'meh', face: 'laugh', answer: '하하, 시켜 봤어요! 빵 두 덩이 들고 가더라고요. 그래서 제가 싸요.' },
      ],
    },
    {
      id: 'overprotect',
      open: '오빠가 또 망원경으로 가게를 봤대요! 딱 한 번이라는데 그게 몇 번째예요!',
      replies: [
        { say: '그건 좀 심했다!', tier: 'great', remember: 'brother-side', answer: '그쵸?! {me} 님은 제 편이에요! 오늘 덤은 두 배예요!' },
        { say: '걱정돼서 그러는 거죠', tier: 'good', face: 'think', answer: '…알아요. 알아서 더 투덜거리는 거예요. 고맙다고는 안 할 거예요!' },
        { say: '망원경 뺏어요', tier: 'meh', face: 'laugh', answer: '하하! 뺏으면 등대에서 손으로 동그라미 만들고 볼걸요!' },
      ],
    },
    {
      id: 'forecast',
      open: '잔나 언니가 내일 맑대요. 근데 바다 냄새는 비라고 해요. {me} 님 생각은요?',
      replies: [
        { say: '바다 냄새를 믿어요', tier: 'great', remember: 'forecast-lux', answer: '역시! 조업은 코로 하는 거예요! 내일 조합원들한테 그물 걷으라고 할게요!' },
        { say: '잔나 말도 일리가 있죠', tier: 'good', face: 'think', answer: '음, 언니 예보가 맞을 때도 있긴 해요. 가끔요! 아주 가끔!' },
        { say: '오빠 무릎은요?', tier: 'meh', face: 'laugh', answer: '하하하! 오빠 무릎은 늘 비래요. 그럼 맞을 때도 있겠죠!' },
      ],
    },
    {
      id: 'sweets',
      open: '경매 끝나면 단 거 하나 먹어요. 그게 제 보상이에요. {me} 님은 단 거 좋아해요?',
      replies: [
        { say: '호박파이면 최고죠!', tier: 'great', remember: 'sweet-tooth', answer: '어머, 제 최애예요! 우리 통했어요! 다음엔 반씩 나눠 먹어요!' },
        { say: '조금은 좋아해요', tier: 'good', answer: '조금이면 딱 좋아요. 저는 조금이 많이라서 문제예요!' },
        { say: '짠 게 더 좋아요', tier: 'meh', face: 'calm', answer: '그럼 굴비 한 손 어때요? 어시장은 짠 것도 다 있어요!' },
      ],
    },
    {
      id: 'guild',
      open: '낚시조합장 된 지 꽤 됐어요. {me} 님도 조합에 들어오실래요?',
      replies: [
        { say: '들어갈래요!', tier: 'great', remember: 'guild-join', answer: '환영해요! 조합원 첫째 규칙은 새벽에 일어나기예요! 화이팅!' },
        { say: '뭘 하는 데예요?', tier: 'good', answer: '물때 공유하고, 그물 고치고, 잡은 거 자랑해요! 마지막이 제일 중요해요!' },
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
        { say: '그 목소리 멋져요', tier: 'great', remember: 'loud-voice', face: 'shy', answer: '헤헤, 정말요? 오빠한테 배운 거예요. 그건 오빠한테 비밀이에요!' },
        { say: '등대까지 들리던데요', tier: 'good', face: 'laugh', answer: '아마 오빠가 듣고 대답했을 거예요. 둘이 소리 지르기 대회예요!' },
        { say: '목 안 아파요?', tier: 'meh', answer: '조금요! 그래서 꿀물 마셔요. 오빠가 꿀을 자꾸 갖다줘요. 또 과보호예요!' },
      ],
    },
    {
      id: 'yanineko',
      open: '야니네코 씨가 또 생선 얻으러 왔어요. 눈이 반짝반짝해서 안 줄 수가 없어요!',
      replies: [
        { say: '럭스 마음이 더 반짝여요', tier: 'great', face: 'shy', answer: '어머! 그런 말은 경매가로 못 매겨요! 오늘 제일 기분 좋은 말이에요!' },
        { say: '조금만 주세요', tier: 'good', answer: '알아요, 알아요! 꼬리만 줬어요! …몸통도 조금 줬어요!' },
        { say: '장사는 남겨야죠', tier: 'meh', face: 'think', answer: '맞는 말이에요. 근데 단골 웃음도 이문이에요. 제 계산법이에요!' },
      ],
    },
    {
      id: 'promise-light',
      when: { ch: 3 },
      open: '{me} 님, 요즘 손끝이 자꾸 반짝여요. 숨기지 말까 봐요. 봐 줄래요?',
      replies: [
        { say: '보여 줘요. 다 볼게요', tier: 'great', remember: 'hidden-light', face: 'shy', answer: '…자, 여기요. 작죠? 근데 {me} 님 앞이라 제일 밝게 나온 거예요.' },
        { say: '예쁘다', tier: 'good', face: 'smile', answer: '헤헤. 어릴 땐 무서웠는데 지금은 예쁘다는 말이 먼저 나와서 좋아요.' },
        { say: '눈이 부셔요', tier: 'meh', face: 'laugh', answer: '앗, 죄송해요! 조금 줄일게요! …줄이는 게 더 어렵네요!' },
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
      open: '해 질 녘 바다 보세요! 물비늘이 금빛이에요. 하루 중 제일 반짝이는 시간이에요!',
      replies: [
        { say: '같이 보고 가도 돼요?', tier: 'great', answer: '그럼요! 가게 정리는 잠깐 미뤄요. 이건 놓치면 안 돼요!' },
        { say: '오늘 장사는 어땠어요?', tier: 'good', answer: '대박이었어요! 마지막 한 방이 시원하게 들어갔어요!' },
        { say: '배고파요', tier: 'meh', face: 'laugh', answer: '하하, 남은 생선 구워 드릴까요? 노을 반찬이에요!' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 와요! 잔나 언니는 맑다고 했는데! 제 코가 맞았어요! {me} 님도 봤죠?',
      replies: [
        { say: '럭스 코가 이겼어요', tier: 'great', remember: 'forecast-lux', answer: '그쵸?! 이따 언니한테 가서 자랑할 거예요! 같이 가요!' },
        { say: '오빠는 괜찮을까요?', tier: 'good', face: 'think', answer: '…지금쯤 꼭대기에서 돌고 있을 거예요. 난간만 잡았으면 좋겠어요.' },
        { say: '비 맞기 싫어요', tier: 'meh', answer: '천막 밑으로 오세요! 빗방울에 등불 비치는 것도 예뻐요!' },
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
      id: 'op-festival',
      when: { festival: true },
      open: '축제예요! 오늘은 특별 경매! 마지막 한 방은 폭죽처럼 할 거예요!',
      replies: [
        { say: '제일 크게 외쳐 줘요!', tier: 'great', remember: 'auction-cheer', answer: '맡겨 주세요! 등대까지 들리게 할게요! 오빠가 대답하면 무승부예요!' },
        { say: '뭐 파는데요?', tier: 'good', answer: '축제용 참돔이요! 행운의 붉은 물고기예요!' },
        { say: '구경만 할게요', tier: 'meh', face: 'calm', answer: '구경도 좋아요! 박수는 꼭 쳐 주세요!' },
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
        { say: '럭스 가게에 걸어 둬요', tier: 'great', answer: '정말요?! 경매 조명보다 밝겠어요! 손님들이 다 쳐다볼 거예요!' },
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
        { say: '조금만 비춰 줘요', tier: 'great', face: 'smile', answer: '자, 여기요. 손끝에서 작게. …괜찮아요. 흐린 날도 지나가요.' },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', answer: '그래도 단 거 하나 드세요. 경매 끝나고 먹는 제 보상 나눠 드릴게요!' },
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
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 언니 만났어요? 이번 예보 틀렸다고 제 얘기 했어요? 제가 먼저 했어요!',
      replies: [
        { say: '럭스 코가 대단하대요', tier: 'great', remember: 'forecast-lux', answer: '정말요?! 언니가 인정했다고요?! 오늘 게시판에 붙일래요!' },
        { say: '둘이 사이좋던데요', tier: 'good', face: 'shy', answer: '…사이는 좋아요. 예보만 안 맞아요. 그게 재밌어요!' },
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
      open: '{other} 할머니 뵀어요? 저 어릴 때 소매에 빛 숨기는 거 처음 알아챈 분이에요.',
      replies: [
        { say: '럭스 칭찬하셨어요', tier: 'great', face: 'shy', answer: '어머… 정말요? 내일 꿀 한 병 갖다 드려야겠어요!' },
        { say: '오빠 꿀밤 얘기 하시던데요', tier: 'good', face: 'laugh', answer: '하하하! 그 얘기 저도 백 번 들었어요! 오빠는 아직도 떨어요!' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other} 만났어요? 우리 낚시 내기 중이거든요! 오늘 뭐 잡았대요?',
      replies: [
        { say: '럭스가 이길 거예요', tier: 'great', answer: '그쵸?! 저는 빛으로 고기를 부르거든요! 반칙 아니에요! 재능이에요!' },
        { say: '큰 거 잡았대요', tier: 'good', face: 'think', answer: '으으, 지금 바로 바다 가야겠어요! 가게 잠깐 봐 줄래요?' },
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
        { say: '럭스가 다 먹어요', tier: 'good', face: 'shy', answer: '안 돼요! 나눠 먹어야 맛있어요. 오빠한테 배운 유일한 거예요!' },
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
        '럭스가 얼음 상자 위로 훌쩍 올라선다.',
        '"어서 오세요! 저는 럭스, 어시장 상인이자 낚시조합장이에요!"',
        '"{me} 님, 경매 처음이죠? 규칙은 간단해요. 크게 외치는 사람이 이겨요!"',
        '"그리고 마지막은 제가 한 방에 끝내요. 그거 보러 다들 와요!"',
      ],
      replies: [
        { say: '그 한 방 꼭 볼게요!', tier: 'great', remember: 'auction-cheer', answer: '좋아요! 첫 손님 기념으로 오늘 한 방은 {me} 님한테 바칠게요!' },
        { say: '저는 목소리가 작아요', tier: 'good', face: 'smile', answer: '괜찮아요! 손만 번쩍 드세요. 제가 다 봐요. 눈이 밝거든요!' },
        { say: '그냥 사기만 할게요', tier: 'meh', face: 'calm', answer: '그것도 좋아요! 정가 손님도 소중한 손님이에요!' },
      ],
    },
    {
      title: '새벽 시장의 첫 햇살',
      hint: '새벽(게임 시각 네 시부터 일곱 시) 시장 거리에 가 보세요. 럭스가 첫 햇살을 보여 준대요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 4, to: 7 } },
      scene: [
        '아직 어두운 시장 거리. 럭스가 얼음 상자를 나르다 손을 흔든다.',
        '"왔다! 딱 맞춰 왔어요! 잠깐만, 이제 곧이에요."',
        '첫 햇살이 얼음 조각에 닿자, 골목 벽에 무지개가 일곱 줄로 퍼진다.',
        '"이거예요. 매일 아침 이걸 보려고 제일 먼저 나와요."',
        '"어릴 땐 제 손에서 나는 빛이 무서웠는데, 이걸 보고 빛이 좋아졌어요."',
      ],
      replies: [
        { say: '럭스 빛도 이만큼 예뻐요', tier: 'great', remember: 'dawn-market', face: 'shy', answer: '…아침부터 그런 말 하면 반칙이에요! 오늘 경매 목소리 떨리겠어요!' },
        { say: '같이 봐서 좋아요', tier: 'good', remember: 'dawn-market', answer: '저도요! 혼자 보던 걸 같이 보니까 무지개가 한 줄 늘어난 것 같아요!' },
        { say: '너무 추워요', tier: 'meh', remember: 'dawn-market', face: 'laugh', answer: '하하, 새벽 시장은 원래 그래요! 화로 옆으로 가요!' },
      ],
    },
    {
      title: '보석에 비친 빛',
      hint: '럭스가 반짝이는 보석 이야기를 했어요. 보석 원석 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'gem', take: true } },
      scene: [
        '보석 원석을 건네자 럭스의 눈이 동그래진다.',
        '"이거… 저 주는 거예요? 잠깐만요, 빛에 비춰 볼게요!"',
        '그녀가 원석을 창가에 대자 가게 안에 작은 별빛이 흩어진다.',
        '"봐요! 안에 빛이 갇혀 있다가 이제 나왔어요."',
        '"…꼭 어릴 때 저 같아요. 숨기다가, 누가 꺼내 주길 기다리던."',
      ],
      replies: [
        { say: '이제 숨기지 마요', tier: 'great', remember: 'gem-light', face: 'shy', answer: '…네. {me} 님 앞에서는 안 숨길게요. 약속이에요.' },
        { say: '가게 창에 걸어 둬요', tier: 'good', remember: 'gem-light', answer: '그럴게요! 유리 조각 옆에 두면 무지개가 두 배예요!' },
        { say: '팔면 비싸겠다', tier: 'meh', remember: 'gem-light', face: 'laugh', answer: '하하! 이건 경매에 안 올려요! 절대로요!' },
      ],
    },
    {
      title: '소매 속의 빛',
      hint: '럭스에게서 어릴 때 숨기던 빛 이야기를 들으면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'hidden-light' },
      scene: [
        '장사가 끝난 어시장. 럭스가 소매를 걷고 손바닥을 펼친다.',
        '"전에 숨기던 빛 얘기 했죠. 사실 그때 오빠가 봤어요."',
        '"오빠는 아무 말도 안 하고 제 방 앞에서 밤새 지켜 줬어요."',
        '"그래서 과보호라고 투덜대도… 도시락은 계속 싸게 되나 봐요."',
        '손바닥 위로 작은 빛이 피어오른다. 그녀가 웃는다.',
      ],
      replies: [
        { say: '그 빛, 따뜻하다', tier: 'great', face: 'shy', answer: '…그 말 처음 들어요. 다들 밝다고만 했거든요. 따뜻하구나, 이거.' },
        { say: '오빠한테 고맙다고 해요', tier: 'good', face: 'think', answer: '…언젠가요! 지금 하면 등대 꼭대기에서 백 바퀴 돌걸요!' },
        { say: '오빠도 대단하네요', tier: 'meh', face: 'laugh', answer: '하하, 그건 오빠한테 절대 말하지 마세요! 목소리가 두 배 돼요!' },
      ],
    },
    {
      title: '경매에 안 올리는 것',
      hint: '럭스와 아주 가까워지면 경매에 절대 안 올리는 것 이야기를 해요. 꽃다발 얘기도 살짝요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 저녁, 불 꺼진 경매장. 럭스가 경매 종을 만지작거린다.',
        '"{me} 님, 저 뭐든 값을 매길 수 있거든요. 생선도, 보석도."',
        '"근데 요즘 값을 못 매기는 게 하나 생겼어요."',
        '그녀의 손끝이 자꾸 반짝인다. 숨기려다 그만둔다.',
        '"…꽃다발 같은 거 받으면 어시장 한가운데서 소리 지를 것 같아요. 그냥요!"',
      ],
      replies: [
        { say: '그게 뭔지 알 것 같아요', tier: 'great', face: 'shy', answer: '…알면 말하지 마요! 제가 먼저 마지막 한 방으로 말할 거예요!' },
        { say: '손끝이 반짝여요', tier: 'good', face: 'laugh', answer: '앗! 보지 마세요! …아니, 봐도 돼요. 이제 안 숨겨요.' },
        { say: '배고파요, 밥 먹어요', tier: 'meh', face: 'calm', answer: '하하… 그래요. 생선구이 해 드릴게요. 말은 다음에 할게요.' },
      ],
    },
    {
      title: '마지막 한 방',
      hint: '럭스와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽 경매가 끝난 뒤, 럭스가 얼음 상자 위에 다시 올라선다.',
        '"여러분! 오늘 마지막 경매가 하나 남았어요!"',
        '"이건 안 팔아요! 제 마음이에요! 이미 {me} 님 거예요!"',
        '시장 사람들이 박수를 친다. 멀리 등대 불빛이 세 번 깜빡인다.',
        '"…오빠까지 다 들었네요. 이제 평생 같이 있어야 해요, {me} 님."',
      ],
      replies: [
        { say: '평생 낙찰이에요', tier: 'great', face: 'laugh', answer: '낙찰! 마지막 한 방이에요! 반지는… {me} 님이 쏘는 걸로 해요!' },
        { say: '오빠한테 인사 가요', tier: 'good', face: 'smile', answer: '좋아요! 같이 가요. 오빠 아마 꼭대기에서 돌고 있을 거예요!' },
        { say: '부끄러워요', tier: 'meh', face: 'shy', answer: '저도요! 근데 숨기는 건 이제 그만할래요. 반짝이는 대로 갈래요.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 여기까지! 내일 새벽 경매 때 봐요!',
    '또 오셨어요? 반가워요! 오늘 제일 반짝이는 건 벌써 보셨죠?',
    '오빠 만나면 밥 먹으라고 전해 주세요! 제가 말한 건 비밀로요!',
    '마지막 한 방은 내일로 아껴 둘게요. 조심히 가세요!',
  ],
};
