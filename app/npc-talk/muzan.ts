// 무잔 — 범마을 증권 지점장. 흰 정장·흰 중절모·검은 망토. 정중한 존댓말에
// 계산과 은근한 자부심이 묻어난다("변동성은 아름답지요", "나이는 영업 비밀").
// 무엇이든 투자로 값을 매기고, 햇볕을 피해 차양 밑에 서며, 변하지 않는 것(금·보석),
// 붉은 동백, 오래 사는 영지를 좋아한다. 해바라기·흔한 돌·달팽이는 질색.
// 섬뜩함은 서늘한 말투와 값을 매기는 눈빛뿐. 위협·해침·원작 대사는 없다.
// 이야기가 흐를수록 플레이어를 "팔지 않을 단 하나의 자산"으로 여기게 된다.
import type { NpcTalkBook } from './types.ts';

export const MUZAN_TALK: NpcTalkBook = {
  npc: 'muzan',
  memories: {
    'split-bet': '예금과 투자를 나눠 담겠다고 했어요',
    'shade-friend': '차양 밑 그늘이 좋다고 했어요',
    'gold-mind': '변하지 않는 것이 좋다고 했어요',
    'blue-hunt': '푸른 동백을 같이 찾아보겠다고 했어요',
    'white-suit': '흰 정장이 제일 어울린다고 했어요',
    'cut-loss': '손절하고 차 한 잔 하는 법을 배웠어요',
    'pocket-watch': '회중시계 태엽 감는 걸 함께 봤어요',
    'camellia-talk': '겨울에도 지지 않는 동백 이야기를 들었어요',
    'priceless': '값을 매길 수 없는 사람이 되겠다고 했어요',
    'unsold': '팔지 않을 자산이 생겼다는 말을 들었어요',
    'lantern-walk': '등불 아래 시장 거리를 함께 걸었어요',
    'red-camellia': '붉은 동백꽃 한 송이를 건넸어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 이야기를 나눴어요',
  },
  talks: [
    {
      id: 'deposit-or-invest',
      open: '{me}, 하나 여쭙지요. 예금입니까, 투자입니까? 대답이 곧 성향입니다.',
      replies: [
        { say: '나눠 담을게요. 반반', tier: 'great', remember: 'split-bet', answer: '훌륭하군요. 분산은 겁이 아니라 품위입니다. 평가를 올려 두지요.' },
        { say: '전부 투자요!', tier: 'good', face: 'think', answer: '용기는 높이 삽니다. 다만 용기에도 손절선은 그어 두시지요.' },
        { say: '저금통이면 충분해요', tier: 'meh', face: 'calm', answer: '나모 씨가 좋아하겠군요. 저는… 조용히 수수료를 아끼겠습니다.' },
      ],
    },
    {
      id: 'sun-or-shade',
      open: '해가 쨍하군요. {me}, 당신은 볕이 좋습니까, 그늘이 좋습니까?',
      replies: [
        { say: '차양 밑 그늘이요', tier: 'great', remember: 'shade-friend', answer: '역시 안목이 있으시군요. 그늘에선 판단이 식지 않습니다.' },
        { say: '적당히 둘 다요', tier: 'good', answer: '균형이군요. 저는 균형을 신뢰합니다. 볕만 빼면 말이지요.' },
        { say: '볕이 최고죠!', tier: 'meh', face: 'calm', answer: '…메르시 선생님과 말이 잘 통하시겠군요. 저는 이쪽에 있겠습니다.' },
      ],
    },
    {
      id: 'age-secret',
      open: '다들 제 나이를 궁금해하더군요. {me}, 당신도 짐작하는 숫자가 있습니까?',
      replies: [
        { say: '영업 비밀이라 안 물을게요', tier: 'great', face: 'smile', answer: '현명하군요. 묻지 않는 손님에게 제일 좋은 차를 내지요.' },
        { say: '서른 즈음이요?', tier: 'good', face: 'shy', answer: '…후한 호가군요. 정정하지 않겠습니다. 그대로 체결하지요.' },
        { say: '폭락장 몇 번 보셨어요?', tier: 'meh', face: 'think', answer: '손가락으로는 모자랍니다. 그 이상은 장부에도 없습니다.' },
      ],
    },
    {
      id: 'unchanging',
      open: '금, 보석, 오래 사는 영지. 저는 값이 변하지 않는 것을 사랑합니다.',
      replies: [
        { say: '저도 변하지 않는 게 좋아요', tier: 'great', remember: 'gold-mind', answer: '드문 취향입니다. 대개는 반짝이는 새것만 쫓지요. 기억해 두겠습니다.' },
        { say: '변하는 것도 재밌지 않아요?', tier: 'good', face: 'think', answer: '변동성은 아름답지요. 남의 것일 때는요. 제 금고 안은 고요해야 합니다.' },
        { say: '해바라기는요?', tier: 'meh', face: 'sorry', answer: '해를 따라 고개를 돌리는 꽃이지요. 지조가 없습니다. 실례지만 사양입니다.' },
      ],
    },
    {
      id: 'blue-camellia',
      open: '어딘가 푸른 동백이 핀다는 소문이 있습니다. 혹시 들어 보셨습니까?',
      replies: [
        { say: '같이 찾아볼게요', tier: 'great', remember: 'blue-hunt', answer: ['…동업 제안이군요. 수익 배분은 나중에 정하지요.', '아니, 정하지 않아도 되겠습니다. 이상하군요.'] },
        { say: '그런 꽃이 정말 있어요?', tier: 'good', face: 'think', answer: '소문만 있는 종목이 가장 비싸지요. 저는 그 소문을 오래 들고 있습니다.' },
        { say: '빨간 게 더 예뻐요', tier: 'meh', face: 'calm', answer: '붉은 동백도 좋아합니다. 다만 그건 이미 가진 꽃이라서요.' },
      ],
    },
    {
      id: 'many-suits',
      open: '정장은 여러 벌입니다. 장터용, 상담용, 산책용. {me}, 어느 쪽이 낫습니까?',
      replies: [
        { say: '지금 흰 정장이 제일이에요', tier: 'great', remember: 'white-suit', face: 'shy', answer: '…다림질한 보람이 있군요. 오늘 주름은 차트에만 두겠습니다.' },
        { say: '망토가 멋져요', tier: 'good', face: 'laugh', answer: '바람막이입니다. 극적인 효과는 덤이고요. 덤도 수익이지요.' },
        { say: '다 똑같아 보여요', tier: 'meh', face: 'calm', answer: '하얀 것은 다 같아 보이지요. 실은 원단 시세가 전부 다릅니다.' },
      ],
    },
    {
      id: 'losing-day',
      open: '하한가를 맞은 날, {me}, 당신은 어떻게 하십니까? 궁금하군요.',
      replies: [
        { say: '손절하고 차 한 잔 마셔요', tier: 'great', remember: 'cut-loss', answer: '정답에 가깝군요. 숫자에 감정을 섞으면 비싸집니다. 차는 제가 내지요.' },
        { say: '버티면 오르겠죠', tier: 'good', face: 'think', answer: '버팀도 전략이지요. 근거가 있다면요. 희망은 근거가 아닙니다.' },
        { say: '울어요', tier: 'meh', face: 'sorry', answer: '…그런 손님께는 차를 드립니다. 위로는 차가 하지요. 저는 장부를 하고요.' },
      ],
    },
    {
      id: 'pocket-watch',
      open: '이 회중시계는 꽤 오래되었습니다. 태엽을 감는 시간이 하루의 쉼이지요.',
      replies: [
        { say: '감는 거 보여 주세요', tier: 'great', remember: 'pocket-watch', answer: ['좋습니다. 천천히, 일정하게. 서두르면 태엽이 상하지요.', '…당신과 보니 시간이 조금 느리게 가는군요.'] },
        { say: '시계가 몇 개예요?', tier: 'good', face: 'smile', answer: '세지 않습니다. 오래된 물건은 개수가 아니라 손때로 세는 겁니다.' },
        { say: '그냥 새로 사세요', tier: 'meh', face: 'calm', answer: '새것은 언제든 삽니다. 오래된 것은 다시 살 수 없지요.' },
      ],
    },
    {
      id: 'snail',
      open: '오늘 객장 앞 계단에 달팽이가 있더군요. 저는 달팽이를 좋아하지 않습니다.',
      replies: [
        { say: '느려서요?', tier: 'great', face: 'think', answer: '정확합니다. 느린데 끈적하게 버티지요. 꼭 물린 종목 같습니다.' },
        { say: '제가 화단으로 옮겨 둘게요', tier: 'good', face: 'smile', answer: '고맙군요. 손은 씻고 오시지요. 대리석 손잡이를 아낍니다.' },
        { say: '귀엽던데요', tier: 'meh', face: 'calm', answer: '취향은 존중합니다. 거래는 하지 않겠지만요.' },
      ],
    },
    {
      id: 'staff-meeting',
      open: '아침 회의에서 직원에게 물었습니다. 왜 그 종목을 놓쳤느냐고. 당신이라면?',
      replies: [
        { say: '다음엔 무엇을 볼지 말할게요', tier: 'great', answer: '…그 대답이면 회의가 일찍 끝났겠군요. 채용하고 싶습니다. 농담 반입니다.' },
        { say: '솔직하게 몰랐다고 해요', tier: 'good', face: 'smile', answer: '정직은 높이 삽니다. 두 번째부터는 값이 떨어지지만요.' },
        { say: '날씨 탓을 할래요', tier: 'meh', face: 'think', answer: '변명이 셋째로 나오면 그 말이 꼭 섞이더군요. 기록해 두지요.' },
      ],
    },
    {
      id: 'appraisal',
      open: '저는 무엇이든 값을 매기는 버릇이 있습니다. {me}, 당신을 매겨 볼까요?',
      replies: [
        { say: '값을 못 매기실걸요', tier: 'great', remember: 'priceless', face: 'wow', answer: '…대담하군요. 그 말이 맞는지 오래 지켜보겠습니다. 장기 관찰입니다.' },
        { say: '비싸게 쳐 주세요', tier: 'good', face: 'laugh', answer: '협상할 줄 아시는군요. 시가보다 조금 높게 적어 두지요.' },
        { say: '부끄러워요, 하지 마세요', tier: 'meh', face: 'calm', answer: '그럼 보류하지요. 보류도 판단입니다.' },
      ],
    },
    {
      id: 'camellia',
      open: '붉은 동백은 한겨울에 핍니다. 그리고 꽃잎이 아니라 송이째 떨어지지요.',
      replies: [
        { say: '지지 않으려는 꽃 같아요', tier: 'great', remember: 'camellia-talk', answer: '바로 그겁니다. 흐트러지지 않는 마지막. 저는 그 품위를 삽니다.' },
        { say: '겨울에 피는 게 신기해요', tier: 'good', face: 'smile', answer: '추울 때 피는 꽃이 귀하지요. 폭락장에서 오르는 종목처럼요.' },
        { say: '꽃은 잘 몰라요', tier: 'meh', face: 'calm', answer: '괜찮습니다. 모르는 종목엔 들어가지 않는 것도 실력이지요.' },
      ],
    },
    {
      id: 'not-for-sale',
      when: { ch: 3 },
      open: '{me}, 제 장부에 처음으로 팔지 않을 항목이 생겼습니다. 무엇인지 아십니까?',
      replies: [
        { say: '…혹시 저예요?', tier: 'great', remember: 'unsold', face: 'shy', answer: '추리가 빠르군요. 신이치 군보다 빠릅니다. 대답은 영업 비밀로 하지요.' },
        { say: '금고 속 금이요?', tier: 'good', face: 'smile', answer: '금은 언제든 팝니다. 값만 맞으면요. 이건 값이 없는 쪽입니다.' },
        { say: '모르겠어요', tier: 'meh', face: 'calm', answer: '그럼 천천히 맞히시지요. 정답 공시는 아직 이릅니다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비가 오는군요. 빗소리는 체결음과 닮았습니다. {me}, 처마 밑으로 오시지요.',
      replies: [
        { say: '망토 끝 좀 빌려도 돼요?', tier: 'great', face: 'shy', answer: '…넉넉합니다. 원래 비를 막으라고 산 망토지요. 극적인 효과는 덤입니다.' },
        { say: '빵집 종목 오르겠네요', tier: 'good', face: 'laugh', answer: '배우셨군요. 비 오는 날 줄이 길어지는 곳을 기억해 두십시오.' },
        { say: '비 싫어요', tier: 'meh', face: 'calm', answer: '그럼 객장에서 쉬다 가시지요. 대리석만 적시지 않으신다면요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 거리를 하얗게 덮었군요. 제 정장처럼요. 오늘은 기분이 좋습니다.',
      replies: [
        { say: '정장이랑 잘 어울려요', tier: 'great', remember: 'white-suit', answer: '눈과 같은 색을 고른 보람이 있군요. 오늘은 산책을 길게 하겠습니다.' },
        { say: '손이 시려요', tier: 'good', face: 'smile', answer: '망토 안쪽 주머니에 손난로가 있습니다. 하나 쓰시지요. 이자는 없습니다.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: ['night', 'evening'] },
      open: '해가 졌군요. 이제야 제 시간입니다. {me}, 잠깐 걸으시겠습니까?',
      replies: [
        { say: '좋아요, 등불 따라 걸어요', tier: 'great', answer: '그럼 시장 거리로. 가게마다 매출을 눈으로 세는 게 제 산책입니다.' },
        { say: '시세 얘기는 빼고요', tier: 'good', face: 'laugh', answer: '…노력하지요. 세 걸음에 한 번쯤은 새어 나올 겁니다.' },
        { say: '졸려서 들어갈래요', tier: 'meh', face: 'calm', answer: '밤에는 숫자도 쉬어야지요. 저는 예외지만요. 조심히 가십시오.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '이른 시간이군요. 새벽 공기는 시가보다 정직합니다. 아직 아무도 값을 안 매겼지요.',
      replies: [
        { say: '해 뜨기 전에 들어가세요', tier: 'great', face: 'shy', answer: '…눈치가 빠르시군요. 정장 때문입니다. 정장 때문이에요.' },
        { say: '일찍 일어나셨네요', tier: 'good', answer: '해외 시세를 훑었습니다. 어젯밤 종가도 세 번 확인했지요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제군요. 소음은 질색입니다만, 축제 매출은 아주 좋아합니다.',
      replies: [
        { say: '등불 켜지면 같이 구경해요', tier: 'great', answer: '해가 진 뒤라면 기꺼이. 처마 그늘에서 보는 축제가 제일 우아하지요.' },
        { say: '오늘은 장부 덮으세요', tier: 'good', face: 'think', answer: '반쯤 덮지요. 나머지 반은 내일 배당을 기대하는 데 쓰겠습니다.' },
        { say: '시끄러워서 싫어요', tier: 'meh', face: 'calm', answer: '동감입니다. 다만 그 소음이 마을 가게를 먹여 살리지요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '바다 냄새가 나는군요. 오늘 {fish}, 잡으셨지요? 시세로 치면 어떻습니까?',
      replies: [
        { say: '팔지 않고 먹을 거예요', tier: 'great', face: 'laugh', answer: '실물 보유로군요. 신선할 때 드시지요. 생선은 주가보다 빨리 상합니다.' },
        { say: '어시장에 넘길래요', tier: 'good', answer: '현명합니다. 오늘 어시장 호가가 나쁘지 않더군요.' },
        { say: '그냥 운이었어요', tier: 'meh', face: 'calm', answer: '운도 수익률에 들어갑니다. 다만 반복되지는 않지요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문이 객장까지 왔습니다. 기록적인 놈을 낚으셨다더군요. 상한가입니다.',
      replies: [
        { say: '자랑하러 왔어요', tier: 'great', face: 'laugh', answer: '자랑할 만합니다. 오늘 마을 소식 일면은 당신이겠군요. 잔나 씨가 바쁘겠습니다.' },
        { say: '운이 좋았어요', tier: 'good', answer: '겸손도 품위입니다. 다만 오늘만큼은 실력이라고 적어 두지요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙이 묻었군요. 밭일을 하셨나 봅니다. 수확은 언제나 숫자로 돌아오지요.',
      replies: [
        { say: '이건 숫자 말고 밥이에요', tier: 'great', face: 'laugh', answer: '…졌습니다. 오늘만은 밥으로 계산하지요. 맛있게 드시길.' },
        { say: '농협 종목 오를까요?', tier: 'good', face: 'think', answer: '가을이면 늘 들뜨지요. 들뜸은 오래가지 않으니 적당히 파십시오.' },
        { say: '허리가 아파요', tier: 'meh', face: 'sorry', answer: '자산은 몸입니다. 오늘은 쉬시지요. 그게 제일 확실한 투자입니다.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물이 나왔다고요? 금빛이라니, 제 취향을 정확히 아시는군요.',
      replies: [
        { say: '보여 드리러 왔어요', tier: 'great', answer: '흠 없군요. 저는 흠 없는 것 앞에서만 말을 잃습니다. …보기 좋습니다.' },
        { say: '팔면 얼마예요?', tier: 'good', face: 'think', answer: '좋은 질문입니다. 다만 좋은 것은 바로 팔지 않는 편이 낫지요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 안색이 흐리군요. 오늘 장이 나빴습니까, 아니면 하루가 나빴습니까?',
      replies: [
        { say: '그냥 좀 지쳤어요', tier: 'great', face: 'calm', answer: '그럼 앉으시지요. 차를 내리겠습니다. 지친 날의 판단은 보류가 정답입니다.' },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', answer: '그렇다면 다행입니다. 그래도 차는 한 잔 드시고 가시지요. 무료입니다.' },
      ],
    },
    {
      id: 'op-news',
      when: { news: 'record' },
      open: '오늘 마을 소식 보셨습니까. 기록이 하나 깨졌더군요. 저는 기록이 좋습니다.',
      replies: [
        { say: '기록은 변하지 않으니까요', tier: 'great', remember: 'gold-mind', answer: '그렇지요. 한 번 적히면 남습니다. 금처럼요. 당신은 말이 통하는군요.' },
        { say: '저도 언젠가 깰래요', tier: 'good', face: 'smile', answer: '그날의 일면은 제가 먼저 사 두지요. 초판이 오르니까요.' },
        { say: '별 관심 없어요', tier: 'meh', face: 'calm', answer: '관심이 없을 때 사는 게 제일 싸지요. 기억해 두십시오.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '요즘 계좌가 붉게 물들었더군요. 오름입니다. {me}, 나쁘지 않습니다.',
      replies: [
        { say: '절반은 익절했어요', tier: 'great', answer: '…훌륭합니다. 오를 때 팔 줄 아는 분은 드뭅니다. 평가를 올리지요.' },
        { say: '더 오를 것 같아요!', tier: 'good', face: 'think', answer: '그럴지도요. 다만 낙관은 비싸게 사는 지름길입니다.' },
        { say: '운이 좋았나 봐요', tier: 'meh', face: 'calm', answer: '운은 다음 장에도 와 주지 않습니다. 원칙은 와 주지요.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '최근 장부가 파랗더군요. 내림입니다. {me}, 표정은 괜찮으십니까?',
      replies: [
        { say: '손절하고 다시 볼게요', tier: 'great', remember: 'cut-loss', answer: '결단이 빠르군요. 손실은 숫자일 뿐입니다. 숫자는 다시 쓰면 됩니다.' },
        { say: '물타기 할까요?', tier: 'good', face: 'think', answer: '근거가 있다면요. 희망으로 물을 타면 장부가 젖습니다.' },
        { say: '차 한 잔 주세요…', tier: 'meh', face: 'sorry', answer: '…드리지요. 오늘은 제일 좋은 찻잎으로. 위로는 차가 합니다.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '카지노에서 따셨다지요. 축하합니다. 다만 하우스는 결국 이긴다는 건 아시지요?',
      replies: [
        { say: '그래서 딴 건 저금했어요', tier: 'great', answer: '…감탄했습니다. 이긴 날 일어서는 분은 열에 하나도 없지요.' },
        { say: '오늘은 운이 좋았어요', tier: 'good', face: 'smile', answer: '운은 즐기십시오. 다만 장부에는 운이라고 적어 두시고요.' },
        { say: '내일도 갈 거예요!', tier: 'meh', face: 'think', answer: '미쿠 씨가 반기겠군요. 확률은 반기지 않을 겁니다.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노 앞에서 뵌 얼굴이 어둡더군요. 잃으셨습니까. 확률은 냉정하지요.',
      replies: [
        { say: '수업료라고 생각할게요', tier: 'great', face: 'smile', answer: '좋은 회계입니다. 비싼 수업일수록 오래 기억에 남지요.' },
        { say: '되찾으러 갈 거예요', tier: 'meh', face: 'think', answer: '…그 말을 한 손님들을 많이 압니다. 오늘은 차를 드시고 가시지요.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '메르시 선생님을 만나셨군요. 혹시 제 안색 이야기를 하던가요?',
      replies: [
        { say: '볕 좀 쬐시래요', tier: 'great', face: 'sorry', answer: '…또군요. 창백한 건 객장 조명 탓입니다. 그렇게 전해 주시지요.' },
        { say: '같이 그늘에서 걸어요', tier: 'good', remember: 'shade-friend', answer: '타협안이군요. 그늘과 산책, 둘 다 챙기지요. 선생님께는 비밀로.' },
        { say: '아무 말 없었어요', tier: 'meh', face: 'calm', answer: '그게 더 불안하군요. 다음 진료 때 몰아서 들으려나 봅니다.' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '하쿠 씨 과수원에 다녀오셨습니까. 올해 매출을 물었더니 사과를 주더군요.',
      replies: [
        { say: '그게 하쿠 씨의 대답이에요', tier: 'great', face: 'think', answer: '…그렇군요. 숫자 대신 실물로 답하는 분이었습니다. 단맛은 상한가였고요.' },
        { say: '사과 맛있었어요?', tier: 'good', face: 'smile', answer: '흠 없었습니다. 장부에는 적지 않았지요. 적을 칸이 없더군요.' },
      ],
    },
    {
      id: 'op-nyamo',
      when: { bond: 'nyamo' },
      open: '나모 씨를 보셨군요. 또 예금 금리 자랑을 하던가요? 그분과는 끝이 안 납니다.',
      replies: [
        { say: '둘 다 맞는 말 같아요', tier: 'great', remember: 'split-bet', answer: '…공정한 판정이군요. 나모 씨께는 제가 반 걸음 앞섰다고만 전해 주시지요.' },
        { say: '예금이 마음 편해요', tier: 'good', face: 'calm', answer: '편안함도 수익입니다. 인정하지요. 오늘만입니다.' },
        { say: '금리가 뭐예요?', tier: 'meh', face: 'wow', answer: '…창구로 오시지요. 첫 상담은 무료입니다. 놀랍게도요.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '신이치 군이 또 제 나이를 추리하던가요? 회중시계 흠집까지 세던데요.',
      replies: [
        { say: '영업 비밀이라고 해 뒀어요', tier: 'great', face: 'laugh', answer: '완벽한 답변입니다. 사건은 미제로 남기지요. 미제가 제일 오래 갑니다.' },
        { say: '정답이 뭔데요?', tier: 'good', face: 'think', answer: '탐정에게도 안 알려 준 걸 당신께 알려 드리면 공정하지 않지요.' },
        { say: '꽤 그럴듯했어요', tier: 'meh', face: 'sorry', answer: '…그럴듯했다니. 내일부터 시계를 안주머니에 넣겠습니다.' },
      ],
    },
    {
      id: 'op-makima',
      when: { bond: 'makima' },
      open: '마키마 씨와 이야기하셨군요. 그분은 웃으면서 값을 부르지요. 저처럼요.',
      replies: [
        { say: '두 분 다 속을 모르겠어요', tier: 'great', face: 'laugh', answer: '칭찬으로 받겠습니다. 속이 보이는 큰손은 이미 큰손이 아니지요.' },
        { say: '누가 더 무서워요?', tier: 'good', face: 'think', answer: '저는 정중할 뿐입니다. 무섭다는 평가는 시장이 내리는 것이지요.' },
      ],
    },
    {
      id: 'op-realtor',
      when: { bond: 'realtor' },
      open: '신형만 씨가 또 땅 이야기를 하셨지요. 땅은 도망가지 않습니다. 그래서 지루하지요.',
      replies: [
        { say: '집도 주식도 반반이요', tier: 'great', answer: '…현명하군요. 그분과 저 사이에 서 있는 사람이 제일 부자가 되더군요.' },
        { say: '집이 든든하긴 하죠', tier: 'good', face: 'calm', answer: '든든함은 인정합니다. 다만 집은 하루 만에 팔 수 없지요.' },
        { say: '둘 다 어려워요', tier: 'meh', face: 'smile', answer: '그럼 오늘은 주점에서 두 사람 논쟁만 들으시지요. 공짜 강의입니다.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-shade',
      when: { mem: 'shade-friend' },
      use: 'shade-friend',
      open: '{me}, 그늘이 좋다고 하셨지요. 오늘 차양 밑 자리를 하나 비워 두었습니다.',
      replies: [
        { say: '고마워요, 앉을게요', tier: 'great', face: 'smile', answer: '편히 앉으시지요. 같은 그늘에 있으면 판단도 같이 식습니다.' },
        { say: '기억하고 계셨어요?', tier: 'good', face: 'shy', answer: '손님 성향은 제 장부의 기본입니다. 당신 것은 조금 더 자세하지만요.' },
      ],
    },
    {
      id: 'cb-gold',
      when: { mem: 'gold-mind' },
      use: 'gold-mind',
      open: '변하지 않는 게 좋다던 {me}. 금고 안쪽 칸을 정리하다 그 말이 떠올랐습니다.',
      replies: [
        { say: '지금도 그래요', tier: 'great', answer: '그렇다면 당신도 변하지 않는 쪽이군요. 드물고, 귀한 성질입니다.' },
        { say: '요즘은 조금 변했어요', tier: 'good', face: 'think', answer: '…그럼 다시 평가하지요. 좋은 쪽으로 변했다면 상향입니다.' },
      ],
    },
    {
      id: 'cb-blue',
      when: { mem: 'blue-hunt' },
      use: 'blue-hunt',
      open: '푸른 동백을 같이 찾겠다고 하셨지요. 꽃집에 또 물었습니다. 아직이라더군요.',
      replies: [
        { say: '언젠가 꼭 찾을 거예요', tier: 'great', face: 'smile', answer: '…서두를 이유가 없어졌습니다. 찾는 동안 함께 걷는 것도 수익이니까요.' },
        { say: '숲 쪽도 봐 둘게요', tier: 'good', answer: '정보는 늘 환영입니다. 다만 해 진 뒤에 알려 주시지요.' },
      ],
    },
    {
      id: 'cb-cutloss',
      when: { mem: 'cut-loss' },
      use: 'cut-loss',
      open: '손절하고 차 한 잔. 당신이 한 말입니다. 그 뒤로 직원 회의에서 써먹고 있지요.',
      replies: [
        { say: '저작권료 주세요', tier: 'great', face: 'laugh', answer: '…좋습니다. 오늘 차는 제가 사지요. 수수료는 면제입니다.' },
        { say: '직원분들이 좋아해요?', tier: 'good', answer: '회의가 짧아졌다고 놀라더군요. 당신 탓으로 해 두겠습니다.' },
      ],
    },
    {
      id: 'cb-suit',
      when: { mem: 'white-suit' },
      use: 'white-suit',
      open: '흰 정장이 어울린다고 하셨지요. 오늘 새로 다렸습니다. 우연입니다. 아마도.',
      replies: [
        { say: '오늘도 제일 멋지세요', tier: 'great', face: 'shy', answer: '…평가가 후하군요. 정정하지 않겠습니다. 그대로 체결하지요.' },
        { say: '모자도 새 거예요?', tier: 'good', face: 'smile', answer: '눈썰미가 좋군요. 띠만 바꿨습니다. 붉은 동백 빛으로요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}, 맞지요? 객장 사은품 목록에 넣어 볼까 합니다.',
      replies: [
        { say: '그럼 매일 올게요', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: '그게 사은품의 목적입니다. 단골 확보지요. 당신은 이미 단골이지만요.' },
        { say: '어떻게 아셨어요?', tier: 'good', remember: 'taste-heard', answer: '손님의 취향은 잔고 다음으로 중요한 정보입니다. 당신 것은 첫째고요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '지난번 함께 다닌 날, 그늘만 골라 걸어 주시더군요. 눈치채고 있었습니다.',
      replies: [
        { say: '또 그늘로 같이 걸어요', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…좋습니다. 다음 동행은 해 진 뒤로. 제 시간을 전부 비워 두지요.' },
        { say: '저도 더웠거든요', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '핑계도 품위 있게 대시는군요. 마음에 듭니다.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이시지요. 선물은 값이 변하지 않는 것으로 고르는 중입니다.',
      replies: [
        { say: '마음이면 충분해요', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '…마음은 값을 매길 수 없어 곤란합니다. 그래도 준비해 보지요.' },
        { say: '금이면 좋겠어요!', tier: 'good', remember: 'bday-plan', face: 'laugh', answer: '솔직하군요. 금은 배신하지 않지요. 좋은 선택입니다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '흰 정장의 첫 상담',
      hint: '한 번 이야기를 나누면 무잔이 창구 뒤에서 상담 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '흰 중절모를 고쳐 쓴 무잔이 창구 너머로 장부를 펼친다.',
        '"범마을 증권 지점장 무잔입니다. 저는 손님을 잔고로 기억하지요."',
        '그가 펜 끝으로 빈 칸을 톡톡 두드린다.',
        '"그런데 {me}, 당신은 아직 칸이 비어 있군요. 흥미롭습니다."',
        '"첫 거래는 늘 기억에 남지요. 손실이든 수익이든."',
      ],
      replies: [
        { say: '좋은 칸으로 채울게요', tier: 'great', face: 'smile', answer: '기대하지요. 장기 보유 후보로 적어 두겠습니다.' },
        { say: '잔고 말고 이름으로 기억해 줘요', tier: 'good', face: 'think', answer: '…드문 요청이군요. 이름 칸을 하나 더 그려 두지요.' },
        { say: '그냥 구경 왔어요', tier: 'meh', face: 'calm', answer: '구경도 시장 조사입니다. 차는 무료입니다.' },
      ],
    },
    {
      title: '등불 아래의 산책',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 시장 거리로 가 보세요. 무잔이 산책 중이래요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 17, to: 21 } },
      scene: [
        '장이 닫힌 시장 거리. 등불이 하나둘 켜진다.',
        '무잔이 처마 그늘을 따라 천천히 걷고 있다. 망토가 조용히 흔들린다.',
        '"오셨군요. 빵집 줄의 길이가 내일의 시세입니다. 보이십니까."',
        '"낮에는 볕이 너무 밝아서요. 이 시간이 제게는 하루의 장입니다."',
        '그가 걸음을 늦춘다. 당신의 보폭에 맞추듯이.',
      ],
      replies: [
        { say: '내일도 이 시간에 걸어요', tier: 'great', remember: 'lantern-walk', face: 'shy', answer: '…약속으로 받겠습니다. 제 장부에서 가장 정확한 일정이 되겠군요.' },
        { say: '줄이 긴 가게 맞혀 볼게요', tier: 'good', remember: 'lantern-walk', face: 'laugh', answer: '좋습니다. 틀리면 차를 사시고, 맞히면 제가 사지요.' },
        { say: '다리 아파요', tier: 'meh', remember: 'lantern-walk', answer: '그럼 저 벤치까지만. 쉬는 것도 전략입니다.' },
      ],
    },
    {
      title: '붉은 동백 한 송이',
      hint: '무잔은 송이째 지는 붉은 동백을 좋아해요. 동백꽃 한 송이를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'camellia', take: true } },
      scene: [
        '동백꽃을 내밀자 무잔의 손이 잠깐 멈춘다.',
        '"…붉은 동백이군요. 어떻게 아셨습니까. 제 장부에도 없는 정보인데."',
        '그가 꽃을 모자 띠에 꽂아 본다. 흰 모자 위에서 붉은빛이 선명하다.',
        '"이 꽃은 흐트러지지 않고 송이째 떨어지지요. 저는 그 품위를 삽니다."',
        '"값을 치르려 했는데, 이건 시세가 없군요. 곤란합니다."',
      ],
      replies: [
        { say: '값은 안 받아요. 선물이에요', tier: 'great', remember: 'red-camellia', face: 'shy', answer: '…선물이라. 그럼 계산하지 않겠습니다. 오늘만, 아니 이번만은.' },
        { say: '모자에 잘 어울려요', tier: 'good', remember: 'red-camellia', face: 'smile', answer: '그렇다면 오늘 산책은 이대로 하지요. 다들 쳐다보겠군요.' },
        { say: '시세로 쳐 주세요', tier: 'meh', remember: 'red-camellia', face: 'think', answer: '…시세를 드리지요. 다만 장부엔 선물로 적겠습니다.' },
      ],
    },
    {
      title: '멈추지 않는 시계',
      hint: '무잔이 회중시계 태엽 감는 걸 함께 보면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'pocket-watch' },
      scene: [
        '문 닫은 객장. 전광판이 꺼지고, 무잔이 창가 그늘에 앉아 있다.',
        '손바닥 위에서 낡은 회중시계가 째깍거린다.',
        '"이 시계는 폭락장을 여러 번 같이 넘었습니다. 한 번도 멈춘 적이 없지요."',
        '"변하지 않는 것만 곁에 두었습니다. 사람은 변하니까요. 그게 원칙이었지요."',
        '그가 시계를 당신 쪽으로 내민다. "감아 보시겠습니까. 천천히."',
      ],
      replies: [
        { say: '천천히, 일정하게 감을게요', tier: 'great', face: 'shy', answer: '…잘 하시는군요. 원칙에 예외를 하나 적어 두어야겠습니다.' },
        { say: '망가뜨리면 어떡해요', tier: 'good', face: 'smile', answer: '그럼 같이 고치면 되지요. 혼자 고치는 것보다 오래 걸리겠지만요.' },
        { say: '시계는 잘 몰라요', tier: 'meh', face: 'calm', answer: '괜찮습니다. 제 손 위에 손을 얹으시지요. 감는 건 제가 하겠습니다.' },
      ],
    },
    {
      title: '값을 매길 수 없는 것',
      hint: '무잔과 아주 가까워지면 그가 장부를 덮고 이야기해요. 그 뒤엔 꽃다발 시세도 달라질지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤의 객장. 무잔이 상담 장부를 펼쳐 당신 이름이 적힌 칸을 보여 준다.',
        '칸은 여전히 비어 있다. 숫자가 하나도 없다.',
        '"몇 번이나 적으려 했습니다. 그런데 펜이 멈추더군요."',
        '"{me}, 당신은 제 장부에 적을 수 없는 유일한 자산입니다."',
        '"요즘은 꽃집 앞에서 푸른 동백보다 꽃다발 시세를 먼저 봅니다. 이상하지요."',
      ],
      replies: [
        { say: '그 칸은 비워 두세요', tier: 'great', face: 'shy', answer: '…그러지요. 꽃다발이라면, 계산하지 않고 받을 수 있을 것 같습니다.' },
        { say: '비싸게 적어 주세요', tier: 'good', face: 'laugh', answer: '그럴 수 없다는 게 문제입니다. 어떤 숫자도 모자라서요.' },
        { say: '피곤해서 먼저 갈게요', tier: 'meh', face: 'calm', answer: '바래다 드리지요. 이 이야기는 장이 다시 열리면 마저 하겠습니다.' },
      ],
    },
    {
      title: '평생 보유',
      hint: '무잔과 연인이 되면 마지막 이야기가 열려요. 그는 반지를 영원히 팔지 않을 자산이라 불러요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '등불이 꺼진 시장 거리. 무잔이 붉은 동백을 꽂은 모자를 벗어 든다.',
        '"오래 찾던 푸른 꽃보다 당신을 먼저 찾았습니다. 순서가 바뀌었지요."',
        '"불만은 없습니다. 오히려 계산이 처음으로 깔끔하게 맞습니다."',
        '"{me}, 평생 보유할 종목은 하나면 충분하더군요. 매도는 없습니다."',
        '"반지라도 들고 오신다면… 그날은 장을 닫겠습니다. 하루 종일."',
      ],
      replies: [
        { say: '평생 같이 걸어요', tier: 'great', face: 'shy', answer: '…약속입니다. 볕이 드는 날엔 망토를 함께 쓰지요. 그늘이 둘이 됩니다.' },
        { say: '장부엔 뭐라고 적어요?', tier: 'good', face: 'laugh', answer: '적지 않습니다. 영업 비밀이니까요. 당신과 저만 아는.' },
        { say: '조금 더 천천히요', tier: 'meh', face: 'smile', answer: '좋습니다. 장기 보유는 서두르지 않는 법이지요.' },
      ],
    },
  ],
  after: [
    '오늘 상담은 여기까지입니다. 과도한 정보는 판단을 흐리지요.',
    '또 오셨군요. 반갑습니다. 차는 늘 같은 맛으로 준비해 두지요.',
    '할 말이 남으셨다면 내일 시가 전에 오십시오. 기다리겠습니다.',
    '해가 지면 다시 걷지요. 그때는 시세 이야기를 줄이겠습니다. 아마도.',
  ],
};
