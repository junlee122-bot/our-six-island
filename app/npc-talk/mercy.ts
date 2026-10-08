// 메르시 — 산기슭 메르시 의원의 마을 의사. 다정하고 밝은 해요체에 살짝 장난기
// ("의사 선생님 말 들어요~", "처방이에요", "합격이에요"). 무리하는 사람을 그냥
// 못 보고, 진료 중에도 작은 농담을 섞는다. 넘어진 사람 일으키기, 부르면 날아오는
// 수호천사, 옷장 속 날개 옷, 높은 산 고향과 핫초콜릿, 커피와 단 것, 옛 팀 이야기.
// 산삼·꽃차·바닐라 푸딩·영지를 좋아하고 벌레와 복어는 질색. 원작 대사는 옮기지
// 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const MERCY_TALK: NpcTalkBook = {
  npc: 'mercy',
  memories: {
    'rest-promise': '무리하지 않겠다고 약속했어요',
    'coffee-fan': '커피를 좋아한다고 했어요',
    'tea-fan': '꽃차가 더 좋다고 했어요',
    'sweet-tooth': '단 걸 좋아한다고 털어놓았어요',
    'mountain-home': '높은 산 고향 이야기를 들었어요',
    'fall-up': '넘어지면 일으켜 달라고 했어요',
    'wing-story': '옷장 속 날개 옷 이야기를 들었어요',
    'checkup-yes': '정기 검진을 받겠다고 했어요',
    'ginseng-hunt': '산삼을 같이 찾아보자고 했어요',
    'bug-help': '벌레는 제가 쫓아 주기로 했어요',
    'night-owl': '밤늦게까지 깨어 있는 편이라고 했어요',
    'old-team': '옛 팀 동료들 이야기를 들었어요',
    'hill-dusk': '뒷산에서 노을을 함께 봤어요',
    'flowertea-cup': '꽃차를 함께 우려 마셨어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸었던 날을 이야기했어요',
    'bday-plan': '생일 건강 검진 이야기를 나눴어요',
  },
  talks: [
    {
      id: 'overwork',
      open: '{me} 씨, 솔직하게요. 요즘 하루에 몇 시간 자요? 의사 선생님이 묻는 거예요~',
      replies: [
        { say: '이제 푹 잘게요. 약속해요', tier: 'great', remember: 'rest-promise', face: 'smile', answer: '좋아요, 약속이에요! 진료 기록에 적어 둘게요. 어기면 수액이에요.' },
        { say: '그럭저럭 자요', tier: 'good', answer: '그럭저럭이면 조금 모자란 거예요. 오늘은 한 시간만 일찍 누워요.' },
        { say: '잠은 사치예요', tier: 'meh', face: 'sorry', answer: '어머, 그건 제일 위험한 말이에요. 쓰러지면 제가 날아가야 하잖아요.' },
      ],
    },
    {
      id: 'coffee-or-tea',
      open: '진료 사이에 한 잔 하려고요. {me} 씨는 커피파예요, 꽃차파예요?',
      replies: [
        { say: '커피죠! 선생님처럼', tier: 'great', remember: 'coffee-fan', face: 'laugh', answer: '들켰네요. 저 커피 없인 못 일어나요. 대신 하루 두 잔까지만, 우리 둘 다요.' },
        { say: '꽃차가 좋아요', tier: 'good', remember: 'tea-fan', answer: '훌륭한 선택이에요. 마음이 차분해지죠. 하쿠 씨 블렌딩이면 최고예요.' },
        { say: '에너지 음료요', tier: 'meh', face: 'sorry', answer: '음… 그건 제 처방 목록에서 빼 두고 싶어요. 물 한 잔부터 마셔요.' },
      ],
    },
    {
      id: 'sweets',
      open: '비밀 하나 말해도 돼요? 점심엔 디저트부터 먹어요. 의사인데요.',
      replies: [
        { say: '저도 그래요! 단 게 최고', tier: 'great', remember: 'sweet-tooth', face: 'laugh', answer: '동지네요! 단 거는 마음의 약이에요. 의사가 보증하니까 믿어요.' },
        { say: '그래도 밥은 먹어요?', tier: 'good', face: 'shy', answer: '먹어요, 먹어요. 순서만 살짝 바꾼 거예요. 진료 기록엔 쓰지 마요.' },
        { say: '의사가 그래도 돼요?', tier: 'meh', face: 'think', answer: '의사도 사람이에요. 대신 {me} 씨는 밥부터 먹어요. 그건 처방이에요.' },
      ],
    },
    {
      id: 'mountain',
      open: '제 고향은 아주 높은 산골이에요. 아침마다 소 방울 소리에 깼어요.',
      replies: [
        { say: '고향 이야기 더 해 줘요', tier: 'great', remember: 'mountain-home', face: 'smile', answer: ['눈 덮인 봉우리가 노을에 분홍색이 돼요. 공기가 아주 차고 맑아요.', '그래서 저는 뒷산이 좋아요. 숨이 깊어지거든요.'] },
        { say: '추웠겠어요', tier: 'good', answer: '추웠죠. 그래서 핫초콜릿을 진하게 타는 법을 일찍 배웠어요. 고향식으로요.' },
        { say: '산은 힘들어서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 산은 제가 오를게요. {me} 씨는 무릎 아끼고요. 그것도 처방이에요.' },
      ],
    },
    {
      id: 'fall-down',
      open: '마을에서 누가 넘어지면 제가 제일 먼저 가요. {me} 씨도 넘어지면 부를 거죠?',
      replies: [
        { say: '네, 꼭 일으켜 주세요', tier: 'great', remember: 'fall-up', face: 'smile', answer: '맡겨요! 제 손 잡으면 금방 일어나요. 그렇죠, 다 나았어요!' },
        { say: '혼자 일어날게요', tier: 'good', answer: '씩씩해서 좋아요. 그래도 무릎 까졌으면 의원엔 꼭 들러요.' },
        { say: '안 넘어질 건데요', tier: 'meh', face: 'laugh', answer: '다들 그렇게 말하고 넘어져요. 볼리바스 씨가 대표예요.' },
      ],
    },
    {
      id: 'wings',
      open: '옷장 깊숙이 날개 달린 옷이 하나 있어요. 웃지 마요, 진짜예요.',
      replies: [
        { say: '한번 보고 싶어요', tier: 'great', remember: 'wing-story', face: 'shy', answer: ['언젠가요. 옛날엔 그걸 입고 다친 사람한테 날아갔어요.', '지금은 뛰어가요. 무릎엔 그게 더 좋더라고요.'] },
        { say: '수호천사 옷이네요', tier: 'good', face: 'laugh', answer: '그런 별명도 있었어요. 지금은 산기슭 의원 의사예요. 그게 더 좋아요.' },
        { say: '코스프레예요?', tier: 'meh', face: 'think', answer: '…진료 도구예요. 아마도요. 그렇게 해 둬요.' },
      ],
    },
    {
      id: 'checkup',
      open: '{me} 씨, 마지막으로 건강 검진 받은 게 언제예요? 기억 안 나죠?',
      replies: [
        { say: '이번 계절에 받을게요', tier: 'great', remember: 'checkup-yes', answer: '합격이에요! 예약 칸 하나 비워 둘게요. 사탕도 하나 줄게요.' },
        { say: '선생님이 지금 봐 주세요', tier: 'good', face: 'smile', answer: '자, 맥박… 음, 아주 건강해요. 웃는 얼굴도 정상이고요.' },
        { say: '병원은 무서워요', tier: 'meh', face: 'sorry', answer: '괜찮아요. 주사는 안 놔요. 아마도요. 농담이에요, 반쯤.' },
      ],
    },
    {
      id: 'ginseng',
      open: '깊은 산에 산삼이 숨어 있대요. 저 그거 정말 좋아해요. 찾으면 보물이죠.',
      replies: [
        { say: '같이 찾으러 가요!', tier: 'great', remember: 'ginseng-hunt', face: 'wow', answer: '정말요? 좋아요! 약초 가방 두 개 챙길게요. 독초는 제가 골라내고요.' },
        { say: '영지도 좋대요', tier: 'good', answer: '어머, 아는구나! 영지도 제 단골 약재예요. 차로 달이면 쌉쌀하고 좋아요.' },
        { say: '그냥 풀 아니에요?', tier: 'meh', face: 'calm', answer: '풀이죠. 아주 비싸고 귀한 풀이요. 츠나데 씨 앞에선 그 말 하지 마요.' },
      ],
    },
    {
      id: 'bugs',
      open: '저 의사지만 벌레는 정말 못 봐요. 진료실에 나방이 들어오면 비명 질러요.',
      replies: [
        { say: '제가 쫓아 드릴게요', tier: 'great', remember: 'bug-help', face: 'laugh', answer: '정말요? 그럼 {me} 씨는 오늘부터 의원 벌레 담당이에요. 보수는 푸딩이에요.' },
        { say: '저도 무서워요', tier: 'good', face: 'sorry', answer: '그럼 둘이서 의자 위로 올라가요. 그게 제일 안전한 처방이에요.' },
        { say: '귀엽지 않아요?', tier: 'meh', face: 'wow', answer: '…{me} 씨, 그 말은 진찰이 필요해 보여요. 농담이에요. 반은요.' },
      ],
    },
    {
      id: 'night-owl',
      open: '{me} 씨는 아침형이에요, 밤형이에요? 표정 보면 대충 알지만요.',
      replies: [
        { say: '해 뜨면 바로 일어나요', tier: 'great', face: 'smile', answer: '합격이에요! 그 생활 그대로 쭉 가요. 제가 다 부럽네요.' },
        { say: '밤에 더 쌩쌩해요', tier: 'good', remember: 'night-owl', face: 'think', answer: '그럴 줄 알았어요. 그래도 자정 넘기면 안 돼요. 꿀잠 처방이에요.' },
        { say: '잠은 안 자도 돼요', tier: 'meh', face: 'sorry', answer: '그런 사람이 제일 먼저 쓰러져요. 옛 팀에서 많이 봤어요.' },
      ],
    },
    {
      id: 'old-team',
      open: '옛날에 시끄러운 팀에 있었어요. 다들 다쳐 놓고 웃는 사람들이었죠.',
      replies: [
        { say: '그 사람들 얘기 들려줘요', tier: 'great', remember: 'old-team', face: 'smile', answer: ['방패 든 덩치 큰 아저씨는 다쳐도 노래를 불렀어요. 볼리바스 씨랑 똑같죠.', '…그립네요. 지금은 이 마을이 제 팀이에요.'] },
        { say: '선생님이 고생했겠네요', tier: 'good', face: 'laugh', answer: '고생이요? 매일이었죠. 그래서 커피 없인 못 사는 몸이 됐어요.' },
        { say: '옛날 얘기는 지루해요', tier: 'meh', face: 'calm', answer: '그럼 지금 얘기 해요. {me} 씨 오늘 어디 다쳤어요? 그게 더 중요해요.' },
      ],
    },
    {
      id: 'bright-side',
      open: '아픈 사람만 보다 보면 저도 기운이 빠질 때가 있어요. {me} 씨는 그럴 때 어떻게 해요?',
      replies: [
        { say: '선생님 보러 와요', tier: 'great', face: 'shy', answer: '…어머. 그런 처방은 처음 들어요. 효과는 좋을 것 같네요.' },
        { say: '단 거 먹어요', tier: 'good', face: 'laugh', answer: '역시요! 바닐라 푸딩 하나면 세상이 다시 밝아지죠.' },
        { say: '그냥 참아요', tier: 'meh', face: 'sorry', answer: '참는 건 치료가 아니에요. 다음엔 의원 와서 수다라도 떨어요.' },
      ],
    },
    {
      id: 'guardian',
      when: { ch: 3 },
      open: '{me} 씨, 수호천사가 한 사람씩 있다면… 저는 누구 거 하면 좋을까요?',
      replies: [
        { say: '제 거 해 주세요', tier: 'great', face: 'shy', answer: '…그렇게 바로 대답하면 반칙이에요. 진단은 보류할게요. 좋다는 뜻이에요.' },
        { say: '마을 모두의 거요', tier: 'good', face: 'smile', answer: '그렇죠, 그게 맞아요. 그래도 {me} 씨 부르면 제일 먼저 날아갈래요.' },
        { say: '선생님 자신이요', tier: 'meh', face: 'think', answer: '저요? …그건 생각 못 했네요. 의사도 자기 돌보는 건 서툴러요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 오는 날엔 무릎 아픈 분들이 많아요. {me} 씨, 젖었으면 수건부터요!',
      replies: [
        { say: '선생님도 감기 조심해요', tier: 'great', face: 'shy', answer: '어머, 의사 걱정을 해 주네요. 고마워요. 핫초콜릿 두 잔 탈게요.' },
        { say: '우산 깜빡했어요', tier: 'good', answer: '그럴 줄 알았어요. 의원 우산 하나 빌려 가요. 돌려주는 건 천천히요.' },
        { say: '비 맞는 거 좋아요', tier: 'meh', face: 'sorry', answer: '낭만은 좋은데 감기는 안 낭만적이에요. 따뜻한 물부터 마셔요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이에요! 고향 생각나네요. {me} 씨, 미끄러우니까 보폭은 작게요.',
      replies: [
        { say: '고향에도 이렇게 와요?', tier: 'great', remember: 'mountain-home', face: 'smile', answer: '훨씬 깊게요. 창문까지 쌓여요. 그래도 여기 눈이 더 포근해요.' },
        { say: '선생님 팔 잡을게요', tier: 'good', face: 'laugh', answer: '좋아요. 둘이 넘어지면 제가 먼저 일어나서 일으킬게요.' },
        { say: '눈싸움하러 가요', tier: 'meh', face: 'think', answer: '장갑 끼고요! 손 트면 연고 바르러 오기예요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '이 시간까지 안 자면 어떡해요. 지팡이 불 끄려던 참이었어요.',
      replies: [
        { say: '선생님 얼굴 보고 자려고요', tier: 'great', face: 'shy', answer: '…그런 말 하면 제 맥박이 바빠져요. 얼른 들어가 자요.' },
        { say: '잠이 안 와서요', tier: 'good', remember: 'night-owl', answer: '그럼 꽃차 한 잔 줄게요. 따뜻하게 마시고 바로 누워요. 처방이에요.' },
        { say: '밤샐 거예요', tier: 'meh', face: 'sorry', answer: '안 돼요. 의사 선생님 말 들어요~ 내일 쓰러지면 제가 슬퍼요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '벌써 일어났어요? 잠은 충분히 잤어요? 핫초콜릿 한 잔은 드릴게요.',
      replies: [
        { say: '푹 잤어요!', tier: 'great', answer: '얼굴 보니 합격이에요! 오늘 하루도 그 얼굴로 다녀요.' },
        { say: '조금 덜 잤어요', tier: 'good', face: 'think', answer: '그럼 점심 뒤에 낮잠 십오 분이요. 정확히 십오 분이요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제예요! 저는 구급 천막 지켜요. 들뜨는 건 좋지만 과식은 금지예요~',
      replies: [
        { say: '천막에 간식 갖다줄게요', tier: 'great', face: 'laugh', answer: '어머, 천사네요! 그럼 저도 초콜릿 반 나눠 줄게요. 다친 사람 먼저지만요.' },
        { say: '선생님도 좀 놀아요', tier: 'good', face: 'shy', answer: '저녁에 교대하면요. 그때 같이 한 바퀴 돌아요.' },
        { say: '오늘은 다 먹을 거예요', tier: 'meh', face: 'sorry', answer: '…소화제 미리 챙겨 둘게요. 배 아프면 바로 와요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '바다 냄새가 나네요. 오늘 {fish}, 낚았죠? 손에 바늘은 안 찔렸어요?',
      replies: [
        { say: '하나도 안 다쳤어요', tier: 'great', answer: '합격이에요! 낚시는 마음에도 좋아요. 기다리는 동안 맥박이 내려가거든요.' },
        { say: '손가락 살짝 찔렸어요', tier: 'good', face: 'sorry', answer: '자, 이리 줘 봐요. 소독하고 반창고. 다 나았어요!' },
        { say: '혹시 복어였으면요?', tier: 'meh', face: 'wow', answer: '복어는 절대 먹지 마요! 그건 의사로서 진지하게 하는 말이에요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '마을이 시끌시끌해요! 엄청 큰 놈 낚았다면서요? 허리는 괜찮아요?',
      replies: [
        { say: '허리 멀쩡해요! 기분 최고!', tier: 'great', face: 'laugh', answer: '축하해요! 기분 좋은 날엔 면역력도 올라가요. 진짜예요.' },
        { say: '팔이 좀 떨려요', tier: 'good', face: 'think', answer: '근육이 놀란 거예요. 따뜻한 물에 담그고 오늘은 쉬어요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙이 묻었네요. 밭일했죠? 허리 숙일 땐 무릎부터 굽혔어요?',
      replies: [
        { say: '선생님 말대로 했어요', tier: 'great', answer: '훌륭해요! 그 자세면 허리가 고마워할 거예요. 오늘의 모범 환자예요.' },
        { say: '허리가 뻐근해요', tier: 'good', face: 'sorry', answer: '거봐요. 여기 누워 봐요. 찜질 하나 올려 줄게요.' },
        { say: '그런 거 신경 안 써요', tier: 'meh', face: 'think', answer: '지금은 괜찮죠. 나중에 의원 단골 되는 길이에요. 조심해요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 거뒀다면서요? 정성 들인 밭은 건강한 사람이 만들어요.',
      replies: [
        { say: '선생님 덕에 건강해서요', tier: 'great', face: 'shy', answer: '어머, 그런 말은 처방전에 붙여 두고 싶네요. 축하해요!' },
        { say: '운이 좋았어요', tier: 'good', answer: '운도 잘 자고 잘 먹는 사람한테 와요. 의학적으로요. 아마도요.' },
      ],
    },
    {
      id: 'op-low-mood',
      when: { mood: 'low' },
      open: '{me} 씨, 얼굴이 많이 지쳐 보여요. 일단 앉아요. 제 손 잡고요.',
      replies: [
        { say: '좀 쉬고 싶어요', tier: 'great', face: 'smile', answer: '그거면 돼요. 오늘 처방은 휴식이에요. 꽃차 우려 줄게요. 아무것도 하지 마요.' },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', face: 'think', answer: '별일 아니어도 지친 건 지친 거예요. 오늘은 일찍 들어가요. 약속이에요.' },
        { say: '할 일이 너무 많아요', tier: 'meh', face: 'sorry', answer: '그래서 더 쉬어야 해요. 쓰러지면 할 일이 두 배가 돼요. 진짜예요.' },
      ],
    },
    {
      id: 'op-high-mood',
      when: { mood: 'high' },
      open: '{me} 씨, 오늘 안색 최고예요! 진료할 필요도 없겠어요.',
      replies: [
        { say: '선생님 처방 덕이에요', tier: 'great', face: 'laugh', answer: '그럼 저 오늘 명의 인정이에요? 커피 한 잔으로 자축해야겠네요.' },
        { say: '잘 자고 잘 먹었어요', tier: 'good', answer: '그게 제일 좋은 약이에요. 그 생활 그대로 쭉 가요.' },
      ],
    },
    {
      id: 'op-birthday',
      when: { news: 'birthday' },
      open: '오늘 누구 생일이래요! 케이크는 좋지만 한 조각만이요. 의사 잔소리예요~',
      replies: [
        { say: '선생님 몫도 챙길게요', tier: 'great', face: 'laugh', answer: '들켰네요. 단 건 마음의 약이니까요. 한 조각만, 정말이에요.' },
        { say: '다 같이 축하해요', tier: 'good', face: 'smile', answer: '좋아요. 건강하게 한 살 더 먹는 게 제일 큰 선물이죠.' },
      ],
    },
    {
      id: 'op-ornn',
      when: { bond: 'ornn' },
      open: '오른 씨 만났죠? 혹시 손에 화상 자국 없었어요? 연고를 또 안 발랐을 거예요.',
      replies: [
        { say: '새 화상이 있던데요', tier: 'great', face: 'sorry', answer: '역시! 오늘 저녁엔 대장간으로 왕진 가야겠어요. 연고 네 통째예요.' },
        { say: '바빠 보이던데요', tier: 'good', face: 'think', answer: '늘 바쁘죠. 그래서 더 걱정이에요. 물이라도 마시라고 전해 줘요.' },
        { say: '잘 모르겠어요', tier: 'meh', answer: '괜찮아요. 제가 직접 볼게요. 숨겨 봐야 다 보여요.' },
      ],
    },
    {
      id: 'op-tsunade',
      when: { bond: 'tsunade' },
      open: '{other} 씨랑 얘기했어요? 또 약초가 수액보다 낫다고 했죠?',
      replies: [
        { say: '둘 다 쓰면 된대요', tier: 'great', face: 'wow', answer: '어머, 그건 제 말인데요! …그 사람도 사실 저랑 같은 생각이에요. 비밀이에요.' },
        { say: '선생님 칭찬하던데요', tier: 'good', face: 'shy', answer: '정말요? 앞에선 절대 안 하면서. 다음엔 제가 먼저 칭찬해야겠네요.' },
        { say: '술 얘기만 했어요', tier: 'meh', face: 'sorry', answer: '…간 수치 걱정되네요. 다음 왕진은 그쪽이에요.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '{other} 씨 봤어요? 어제 순찰하다 넘어져 놓고 멀쩡하다고 했어요.',
      replies: [
        { say: '절뚝거리던데요', tier: 'great', face: 'think', answer: '그럴 줄 알았어요! 오늘 오후엔 붕대 들고 찾아갈게요. 도망가도 날아가요.' },
        { say: '씩씩해 보였어요', tier: 'good', face: 'laugh', answer: '씩씩한 거랑 멀쩡한 건 달라요. 그 사람은 그걸 몰라요.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 씨 만났어요? 이번 주 건강 칼럼 같이 쓰는 중이에요. 주제 하나 줄래요?',
      replies: [
        { say: '잠 잘 자는 법이요!', tier: 'great', face: 'laugh', answer: '딱이에요! 마을에 밤샘하는 사람이 너무 많거든요. {me} 씨 이름도 넣을까요?' },
        { say: '단 거 먹어도 되는 날', tier: 'good', face: 'shy', answer: '…그건 제가 쓰고 싶은 거네요. 잔나 씨한테 들키면 웃을 거예요.' },
        { say: '칼럼은 안 읽어요', tier: 'meh', face: 'sorry', answer: '어머. 그럼 제가 직접 읽어 줄게요. 진료 받으러 올 때마다요.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '{other} 씨 봤어요? 차양 밑에만 있잖아요. 햇볕 좀 쬐라고 또 말해야겠어요.',
      replies: [
        { say: '선생님 말은 들을 거예요', tier: 'great', face: 'laugh', answer: '그럼 좋겠네요. 얼굴이 너무 창백해서 진료하고 싶어 손이 근질거려요.' },
        { say: '그분은 밤이 좋대요', tier: 'good', face: 'think', answer: '밤도 좋죠. 그래도 사람은 낮에 걸어야 해요. 의학은 고집이 세요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-coffee',
      when: { mem: 'coffee-fan' },
      use: 'coffee-fan',
      open: '커피파 {me} 씨! 오늘 몇 잔째예요? 저는 아직 한 잔이에요. 자랑이에요.',
      replies: [
        { say: '저도 딱 한 잔이요', tier: 'great', face: 'laugh', answer: '둘 다 합격! 그럼 두 번째 잔은 같이 마셔요. 그게 마지막이에요.' },
        { say: '세 잔째예요…', tier: 'good', face: 'sorry', answer: '어머, 오늘은 커피 끝이에요. 대신 꽃차 처방이에요.' },
      ],
    },
    {
      id: 'cb-sweet',
      when: { mem: 'sweet-tooth' },
      use: 'sweet-tooth',
      open: '단 거 좋아한다던 {me} 씨, 이거요. 바닐라 푸딩 하나 남겨 뒀어요.',
      replies: [
        { say: '반씩 나눠 먹어요', tier: 'great', face: 'shy', answer: '…그럼 반만요. 단 건 둘이 먹으면 반만 살찐대요. 제 학설이에요.' },
        { say: '고마워요, 잘 먹을게요', tier: 'good', answer: '천천히 먹어요. 단 거는 급하게 먹으면 약효가 없어요.' },
      ],
    },
    {
      id: 'cb-mountain',
      when: { mem: 'mountain-home' },
      use: 'mountain-home',
      open: '고향 산 이야기 기억해요? 어젯밤 꿈에 소 방울 소리가 들렸어요.',
      replies: [
        { say: '언젠가 같이 가 봐요', tier: 'great', face: 'shy', answer: '…정말요? 그럼 등산화부터 골라 줄게요. 무릎 보호대도요.' },
        { say: '그리워요?', tier: 'good', face: 'calm', answer: '조금요. 그래도 여기 사람들이 있어서 괜찮아요. {me} 씨도요.' },
      ],
    },
    {
      id: 'cb-fall',
      when: { mem: 'fall-up' },
      use: 'fall-up',
      open: '넘어지면 부르기로 했죠? 요즘 안 넘어졌어요? 무릎 좀 봐요.',
      replies: [
        { say: '한 번 넘어졌는데 버텼어요', tier: 'great', face: 'think', answer: '버티지 말고 부르기로 했잖아요! …그래도 다 나았네요. 합격이에요.' },
        { say: '안 넘어졌어요!', tier: 'good', face: 'laugh', answer: '잘했어요. 그래도 약속은 그대로예요. 부르면 날아가요.' },
      ],
    },
    {
      id: 'cb-checkup',
      when: { mem: 'checkup-yes' },
      use: 'checkup-yes',
      open: '{me} 씨, 검진 받겠다고 했죠? 예약 칸 아직 비워 뒀어요. 도망 금지예요~',
      replies: [
        { say: '지금 받을게요', tier: 'great', face: 'laugh', answer: '좋아요! 맥박 정상, 안색 정상, 웃음 정상. 사탕 받아 가요.' },
        { say: '다음 주에요, 진짜로', tier: 'good', face: 'think', answer: '진짜로요? 진료 기록에 큰 글씨로 적어 둘게요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 씨 좋아하는 거, {taste}. 맞죠? 진료 기록 구석에 적어 뒀어요.',
      replies: [
        { say: '그런 것도 적어요?', tier: 'great', face: 'shy', remember: 'taste-heard', answer: '좋아하는 게 있으면 회복이 빨라요. 그러니 중요한 기록이에요.' },
        { say: '선생님은 뭐 좋아해요?', tier: 'good', remember: 'taste-heard', answer: '꽃차랑 바닐라 푸딩이요. 그리고 산삼이요. 욕심쟁이죠?' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 걸은 날, 산책 처방 효과 최고였어요. 제가 더 건강해졌어요.',
      replies: [
        { say: '또 같이 걸어요', tier: 'great', face: 'smile', remember: 'outing-talk', answer: '좋아요! 다음엔 뒷산까지요. 물병 두 개 챙길게요.' },
        { say: '선생님 계속 잔소리했잖아요', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '잔소리 아니고 처방이에요! …조금은 잔소리였어요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me} 씨, 곧 생일이죠? 선물로 무료 건강 검진 어때요? 농담이에요, 반쯤.',
      replies: [
        { say: '선생님이랑 푸딩이면 돼요', tier: 'great', face: 'shy', remember: 'bday-plan', answer: '…그건 제가 받는 선물 같은데요. 그래도 좋아요. 제일 맛있는 걸로요.' },
        { say: '검진도 좋아요', tier: 'good', face: 'laugh', remember: 'bday-plan', answer: '정말요? 그럼 생일 특별 검진이에요. 끝나면 케이크 한 조각 처방할게요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '메르시 의원의 첫 진료',
      hint: '한 번 이야기를 나누면 메르시가 진료 기록 첫 장을 펼쳐요.',
      need: { days: 1 },
      scene: [
        '메르시가 새 진료 기록부를 꺼내 첫 장을 펼친다.',
        '"자, 이름 적고… 맥박도 볼게요. 음, 아주 건강하네요!"',
        '"이 기록부는 {me} 씨 전용이에요. 아플 때만 오라는 뜻은 아니에요."',
        '"안 아파도 와요. 수다도 진료니까요. 의사 선생님 말 들어요~"',
      ],
      replies: [
        { say: '자주 올게요, 선생님', tier: 'great', remember: 'checkup-yes', face: 'smile', answer: '약속이에요! 다음엔 꽃차 내 둘게요. 단골 환자 특전이에요.' },
        { say: '주사는 안 놓죠?', tier: 'good', face: 'laugh', answer: '안 놔요. 오늘은요. 농담이에요. 그렇게 겁먹은 얼굴 하지 마요.' },
        { say: '저 안 아픈데요', tier: 'meh', face: 'calm', answer: '그러니까 지금 오는 거예요. 아프기 전에 오는 사람이 제일 똑똑해요.' },
      ],
    },
    {
      title: '뒷산의 분홍 노을',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 뒷산에 올라가 보세요. 메르시가 산책 중이래요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 17, to: 21 } },
      scene: [
        '뒷산 꼭대기, 메르시가 왕진 가방을 내려놓고 숨을 깊게 쉰다.',
        '"왔네요! 여기 공기는 고향 산이랑 닮았어요. 숨이 깊어져요."',
        '"고향에선 노을이 지면 눈 덮인 봉우리가 분홍색이 돼요."',
        '"여기엔 눈은 없지만… 같이 보는 사람이 있으니까 더 좋네요."',
        '하늘이 천천히 분홍빛으로 물든다. 메르시가 조용히 웃는다.',
      ],
      replies: [
        { say: '정말 분홍색이에요', tier: 'great', remember: 'hill-dusk', face: 'wow', answer: '그렇죠? 이 색 보면 피로가 싹 풀려요. 오늘의 처방은 노을이에요.' },
        { say: '선생님도 좀 쉬어요', tier: 'good', remember: 'hill-dusk', face: 'shy', answer: '…지금 쉬고 있어요. {me} 씨 옆에서요. 이것도 휴식이에요.' },
        { say: '산 오르느라 힘들어요', tier: 'meh', remember: 'hill-dusk', face: 'laugh', answer: '자, 앉아요. 물 마시고요. 내려갈 땐 보폭 작게, 제 팔 잡고요.' },
      ],
    },
    {
      title: '꽃차 한 주전자',
      hint: '메르시가 꽃차를 좋아한대요. 꽃차 하나를 가지고 의원에 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '꽃차를 내밀자 메르시의 눈이 반짝인다.',
        '"어머, 꽃차예요! 제가 제일 좋아하는 거 어떻게 알았어요?"',
        '진료실 창가에서 주전자에 물을 올린다. 꽃잎이 천천히 핀다.',
        '"옛 팀에선 커피만 마셨어요. 쉴 틈이 없었거든요."',
        '"이렇게 기다려야 우러나는 차는, 여기 와서 처음 배웠어요."',
      ],
      replies: [
        { say: '기다리는 것도 약이네요', tier: 'great', remember: 'flowertea-cup', face: 'smile', answer: '맞아요! {me} 씨 오늘 의사 면허 반쯤 줄게요. 첫 잔은 {me} 씨 거예요.' },
        { say: '꽃잎 피는 거 예뻐요', tier: 'good', remember: 'flowertea-cup', face: 'shy', answer: '그렇죠? 저 이거 보는 게 진료 중 제일 좋은 시간이에요.' },
        { say: '커피가 빠른데요', tier: 'meh', remember: 'flowertea-cup', face: 'laugh', answer: '빠른 게 늘 좋은 건 아니에요. 오늘은 천천히 마셔 봐요. 처방이에요.' },
      ],
    },
    {
      title: '의사의 약속',
      hint: '메르시에게 무리하지 않겠다고 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'rest-promise' },
      scene: [
        '진료가 끝난 밤, 메르시가 진료 기록부를 덮고 한숨을 쉰다.',
        '"{me} 씨, 무리 안 하겠다고 약속했었죠. 지키고 있어요?"',
        '"사실 그 약속, 저도 지키기 어려워요. 다치는 사람이 보이면 몸이 먼저 가요."',
        '"그래서 부탁할게요. 제가 무리하면 {me} 씨가 말려 줘요."',
        '"서로의 의사가 되는 거예요. 어때요?"',
      ],
      replies: [
        { say: '좋아요. 서로의 의사예요', tier: 'great', face: 'shy', answer: '…고마워요. 그럼 오늘 처방은 제 몫까지 {me} 씨가 내려요. 일찍 자기요.' },
        { say: '저 잔소리 잘해요', tier: 'good', face: 'laugh', answer: '기대할게요! 제 잔소리보다 세면 인정해 줄게요.' },
        { say: '선생님은 괜찮잖아요', tier: 'meh', face: 'calm', answer: '그렇게 보이죠. 의사가 제일 자기 몸을 몰라요. 그래서 부탁하는 거예요.' },
      ],
    },
    {
      title: '진단은 보류예요',
      hint: '메르시와 아주 가까워지면 그녀가 미뤄 둔 진단을 털어놓아요. 그 뒤엔 꽃다발도 웃으며 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 저녁, 불 꺼진 진료실. 메르시가 청진기를 만지작거린다.',
        '"{me} 씨, 요즘 저한테 이상한 증상이 있어요."',
        '"{me} 씨 목소리만 들리면 맥박이 빨라져요. 제 맥박이요."',
        '"의사니까 원인은 알 것 같은데… 진단은 아직 보류할게요."',
        '"꽃다발은 처방전에 없지만, 받으면 금방 나을 것 같기도 하고요."',
      ],
      replies: [
        { say: '그 증상, 저도 있어요', tier: 'great', face: 'shy', answer: '…어머. 그럼 같은 병이네요. 치료법은 둘이 같이 찾아봐요.' },
        { say: '꽃다발, 기억해 둘게요', tier: 'good', face: 'laugh', answer: '아, 그건 혼잣말이었어요! …그래도 기억해 줘요. 조금은요.' },
        { say: '과로 아니에요?', tier: 'meh', face: 'calm', answer: '…그럴지도요. 오늘은 일찍 잘게요. 그래도 그 진단은 아닌 것 같아요.' },
      ],
    },
    {
      title: '당신 전담 수호천사',
      hint: '메르시와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '메르시가 옷장에서 하얀 날개 옷을 꺼내 와 웃는다.',
        '"보여 주기로 했잖아요. 이걸 입고 많은 사람한테 날아갔어요."',
        '"이제 날아갈 곳을 하나로 정하고 싶어요. {me} 씨한테요."',
        '"마을 모두의 의사는 그대로지만, 수호천사는 {me} 씨 전담이에요."',
        '"반지 같은 건 처방전에 없지만… 받으면 평생 낫지 않을 것 같아요."',
      ],
      replies: [
        { say: '평생 제 수호천사 해 줘요', tier: 'great', face: 'shy', answer: '…약속이에요. 의사 선생님 약속은 절대 안 깨져요. 그렇죠, {me} 씨?' },
        { say: '저도 선생님 지킬게요', tier: 'good', face: 'laugh', answer: '서로의 의사, 서로의 수호천사네요. 처방전이 꽉 찼어요.' },
        { say: '아직 실감이 안 나요', tier: 'meh', face: 'smile', answer: '괜찮아요. 맥박 재 줄게요. 천천히 실감해요. 저 안 도망가요.' },
      ],
    },
  ],
  after: [
    '오늘은 여기까지! 쉬는 것도 처방이에요.',
    '또 왔어요? 아픈 데 없으면 물 한 잔 마시고 가요.',
    '누가 부르네요. 날아가 봐야 해요. 무리 금지예요~',
    '안 아파도 와도 돼요. 그래도 오늘은 일찍 자요. 약속이에요.',
  ],
};
