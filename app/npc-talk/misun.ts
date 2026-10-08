// 봉미선 — 범마을 부동산 실장 (화·목 카운터, 주말엔 형만과 함께).
// 싹싹하고 밝은 해요체("어머", "어머어머"). 남편은 "여보"/"형만 씨"(남에겐 "우리 남편").
// 마을 최강 흥정꾼: 세일·쿠폰·한정 특가에 눈이 번쩍, 충동구매 뒤 후회, 찬장 맨 위 칸에
// 숨긴 간식, 작심삼일 다이어트, 우기는 낮잠("눈 감고 생각하는 거예요"), 화나면 가벼운
// 꿀밤, 남편 용돈 깎기. 젊어 보인다는 말엔 약하고 나이·뱃살 얘기엔 정색. 잔소리 뒤엔
// 누구보다 깊은 정. 신형만과 결혼한 사이라 플레이어와 연애하지 않는다: 이야기는
// 우정과 "우리 집 식구"가 되는 길이다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const MISUN_TALK: NpcTalkBook = {
  npc: 'misun',
  memories: {
    'thrift-pal': '알뜰한 게 좋다고 했어요',
    'haggle-lesson': '흥정하는 법을 배우겠다고 했어요',
    'sale-eye': '한정 특가에 같이 설렜어요',
    'diet-cheer': '다이어트를 응원하겠다고 했어요',
    'nap-secret': '낮잠 아니라는 말을 믿어 줬어요',
    'young-look': '젊어 보인다고 말했어요',
    'snack-shelf': '찬장 맨 위 칸 비밀을 알게 됐어요',
    'allowance': '형만 씨 용돈 협상 이야기를 들었어요',
    'kimchi-help': '김장을 돕겠다고 했어요',
    'coupon-share': '쿠폰을 나눠 받기로 했어요',
    'market-dawn': '아침 시장을 함께 걸었어요',
    'pie-secret': '호박파이 비밀을 함께 지켰어요',
    'family-seat': '미선 씨네 밥상에 자리를 받았어요',
    'taste-heard': '내 취향을 가계부 옆에 적어 뒀대요',
    'outing-talk': '함께 나간 날을 이야기했어요',
    'bday-heard': '생일 잔치를 알뜰하게 차려 준대요',
  },
  talks: [
    {
      id: 'thrift',
      open: '{me} 님은 돈 쓸 때 어떤 편이에요? 저는 백 원도 아까워요.',
      replies: [
        { say: '알뜰한 게 최고예요', tier: 'great', remember: 'thrift-pal', face: 'wow', answer: ['어머어머! 역시 제 눈은 정확해요.', '우리 이제 알뜰 동지예요. 세일 정보 다 공유할게요.'] },
        { say: '쓸 땐 쓰는 편이에요', tier: 'good', answer: '그것도 맞아요. 대신 쓸 데를 잘 골라야 해요. 제가 골라 드릴까요?' },
        { say: '있으면 다 써요', tier: 'meh', face: 'sorry', answer: '어머, 그럼 안 돼요! 우리 남편이랑 똑같네요. 가계부부터 써요.' },
      ],
    },
    {
      id: 'haggle',
      open: '흥정은요, 웃으면서 한 번 더 깎는 거예요. 배워 볼래요?',
      replies: [
        { say: '네! 가르쳐 주세요', tier: 'great', remember: 'haggle-lesson', answer: ['좋아요! 첫째, 살 생각 없는 척.', '둘째, 돌아서는 척. 셋째, 덤 달라고 웃기. 끝이에요.'] },
        { say: '정가가 마음 편해요', tier: 'good', face: 'think', answer: '마음은 편하죠. 근데 지갑은 울어요. 그래도 착한 사람이네요.' },
        { say: '깎는 거 민망해요', tier: 'meh', face: 'calm', answer: '처음엔 다 그래요. 제가 옆에서 대신 깎아 줄게요.' },
      ],
    },
    {
      id: 'limited',
      open: '어머, 이거 보세요! 오늘만 한정 특가래요. 안 사면 손해죠?',
      replies: [
        { say: '한정이면 사야죠!', tier: 'great', remember: 'sale-eye', face: 'laugh', answer: '그쵸그쵸! 역시 {me} 님은 말이 통해요. …근데 이거 어디 쓰지?' },
        { say: '꼭 필요한 거예요?', tier: 'good', face: 'think', answer: '…음. 필요하진 않아요. 근데 싸잖아요. 아, 그게 함정이구나.' },
        { say: '안 사면 이득이죠', tier: 'meh', face: 'sorry', answer: '어머, 냉정해라. 맞는 말이라 더 속상해요.' },
      ],
    },
    {
      id: 'diet',
      open: '저 오늘부터 다이어트예요. 이번엔 진짜예요. 사흘은 갈 거예요.',
      replies: [
        { say: '응원할게요! 같이 걸어요', tier: 'great', remember: 'diet-cheer', face: 'wow', answer: '어머, 같이 걸어 준다고요? 그럼 나흘은 가겠어요. 신기록이에요!' },
        { say: '지금도 날씬하신데요', tier: 'good', face: 'shy', answer: '어머어머, 무슨 소리예요. 그래도 그 말은 받아 둘게요.' },
        { say: '사흘이요?', tier: 'meh', face: 'calm', answer: '…작심삼일이라고 하려고 했죠? 다 알아요. 꿀밤 맞을래요?' },
      ],
    },
    {
      id: 'nap',
      open: '아까 소파에 누워 있던 거 봤어요? 낮잠 아니에요. 눈 감고 생각한 거예요.',
      replies: [
        { say: '네, 생각 중이셨죠', tier: 'great', remember: 'nap-secret', face: 'laugh', answer: '그렇죠! 역시 {me} 님은 알아줘요. 계약서 구상이었어요. 아마도.' },
        { say: '코 고는 소리 났는데요', tier: 'good', face: 'shy', answer: '어머, 그건 생각이 깊어서 나는 소리예요. 진짜예요.' },
        { say: '그냥 잔 거잖아요', tier: 'meh', face: 'sorry', answer: '아니라니까요! …형만 씨한테는 말하지 마요.' },
      ],
    },
    {
      id: 'young',
      open: '{me} 님, 저 몇 살로 보여요? 솔직하게요. 아주 솔직하게.',
      replies: [
        { say: '대학생인 줄 알았어요', tier: 'great', remember: 'young-look', face: 'shy', answer: ['어머어머어머! 진짜요? 아이, 무슨.', '오늘 상담비는 안 받을게요. 원래 공짜지만요.'] },
        { say: '딱 보기 좋은 나이요', tier: 'good', answer: '음, 그것도 칭찬이죠? 좋아요, 그렇게 받아 둘게요.' },
        { say: '서른은 넘으셨죠?', tier: 'meh', face: 'calm', answer: '…{me} 님. 그 질문은 손님 목록에서 지워지는 질문이에요.' },
      ],
    },
    {
      id: 'snack',
      open: '찬장 맨 위 칸 있잖아요. 거기 아무것도 없어요. 절대 열지 마세요.',
      replies: [
        { say: '비밀 지켜 드릴게요', tier: 'great', remember: 'snack-shelf', face: 'laugh', answer: '어머, 눈치 빠르셔라. 좋아요, 하나만 나눠 드릴게요. 쉿이에요.' },
        { say: '뭐가 들었는데요?', tier: 'good', face: 'shy', answer: '아무것도 없다니까요. 과자 같은 건 진짜 없어요. 진짜로.' },
        { say: '형만 씨한테 물어볼게요', tier: 'meh', face: 'sorry', answer: '어머, 안 돼요! 거긴 형만 씨도 몰라요. 알면 큰일 나요.' },
      ],
    },
    {
      id: 'allowance',
      open: '우리 남편이 용돈 올려 달래요. {me} 님이 보기엔 누가 이길 것 같아요?',
      replies: [
        { say: '당연히 미선 씨죠', tier: 'great', remember: 'allowance', face: 'laugh', answer: '그쵸! 협상은 이미 끝났어요. 기각이에요. 대신 저녁에 고기 구워 줄 거예요.' },
        { say: '조금은 올려 주세요', tier: 'good', face: 'think', answer: '음… {me} 님이 그렇게 말하면 백 원은 올려 줄게요. 백 원이요.' },
        { say: '형만 씨 편이에요', tier: 'meh', face: 'calm', answer: '어머, 배신이네요. 다음 세일 정보는 늦게 알려 드릴 거예요.' },
      ],
    },
    {
      id: 'kimchi',
      open: '올해 김장은 배추 몇 포기나 할까요. 손이 하나라도 더 있으면 좋은데.',
      replies: [
        { say: '제가 도우러 갈게요', tier: 'great', remember: 'kimchi-help', face: 'wow', answer: ['어머, 정말요? 고무장갑 하나 더 사 둘게요.', '세일할 때요. 김치는 한 통 싸 드릴 거예요.'] },
        { say: '사 먹는 게 싸지 않아요?', tier: 'good', face: 'think', answer: '계산해 봤는데요, 직접 하는 게 조금 더 싸요. 그리고 더 맛있어요.' },
        { say: '김장은 힘들어요', tier: 'meh', face: 'calm', answer: '힘들죠. 그래서 다 같이 하는 거예요. 혼자 하면 이틀 앓아요.' },
      ],
    },
    {
      id: 'coupon',
      open: '이 쿠폰 뭉치 보세요. 반은 업무용, 반은 마트용이에요. 좀 나눠 드릴까요?',
      replies: [
        { say: '고마워요! 잘 쓸게요', tier: 'great', remember: 'coupon-share', face: 'laugh', answer: '유효기간 꼭 보세요! 기한 지난 쿠폰은 종이예요. 그냥 종이.' },
        { say: '업무용이 뭐예요?', tier: 'good', face: 'think', answer: '공사비 할인권이에요. 발키리 씨는 안 받아 주지만요. 흥.' },
        { say: '쿠폰은 귀찮아요', tier: 'meh', face: 'sorry', answer: '어머, 그 귀찮음이 다 돈이에요. 아까워라.' },
      ],
    },
    {
      id: 'contract',
      open: '계약서는요, 큰 글씨보다 작은 글씨를 먼저 읽어야 해요. 왜인지 알아요?',
      replies: [
        { say: '함정은 작게 쓰니까요', tier: 'great', face: 'wow', answer: '어머, 정답! {me} 님은 손님 말고 직원 해도 되겠어요.' },
        { say: '눈이 좋아서요?', tier: 'good', face: 'laugh', answer: '아하하, 그것도 맞네요. 노안 오기 전에 많이 읽어 둬요. 아, 저는 아직이에요.' },
        { say: '그냥 서명할래요', tier: 'meh', face: 'sorry', answer: '안 돼요! 그러다 큰일 나요. 다음부턴 꼭 저랑 같이 읽어요.' },
      ],
    },
    {
      id: 'impulse',
      open: '어제 산 냄비요. 집에 냄비가 다섯 개 있었는데… 왜 샀을까요.',
      replies: [
        { say: '여섯 개면 더 든든하죠', tier: 'great', face: 'laugh', answer: '그쵸? 그렇게 생각하기로 했어요. 김장 날 다 쓸 거예요. 아마도.' },
        { say: '환불하러 같이 가요', tier: 'good', face: 'think', answer: '…그게 맞겠죠. 근데 영수증을 어디 뒀더라. 어머.' },
        { say: '또 사셨어요?', tier: 'meh', face: 'sorry', answer: '또라뇨! …네, 또요. 우리 남편한테는 비밀이에요.' },
      ],
    },
    {
      id: 'belly',
      open: '요즘 형만 씨가 제 배를 보고 웃어요. 뭘 보고 웃는 걸까요?',
      replies: [
        { say: '예뻐서 웃는 거죠', tier: 'great', face: 'shy', answer: '어머, {me} 님 말 잘하네. 그렇다고 해 두죠. 형만 씨는 꿀밤 하나.' },
        { say: '저녁 메뉴 생각이겠죠', tier: 'good', face: 'laugh', answer: '아하하, 그럴 수도요. 그 사람 머릿속엔 맥주랑 오징어뿐이에요.' },
        { say: '뱃살 때문 아닐까요', tier: 'meh', face: 'calm', answer: '…{me} 님. 그 단어는 우리 집 금지어예요. 지금 들은 걸로 할게요.' },
      ],
    },
    {
      id: 'husband-worry',
      open: '형만 씨가 요즘 피곤해 보여요. 잔소리를 좀 줄여야 할까 봐요.',
      replies: [
        { say: '잔소리도 사랑이잖아요', tier: 'great', face: 'smile', answer: ['어머… 그걸 알아주는 사람이 있네요.', '그럼 줄이지 말고, 반찬을 하나 늘릴게요.'] },
        { say: '고기 구워 주세요', tier: 'good', face: 'laugh', answer: '역시 그게 제일이죠. 한우는 못 사도 세일 삼겹살은 살 수 있어요.' },
        { say: '그냥 두면 돼요', tier: 'meh', face: 'think', answer: '그럴까요? 근데 그냥 두면 또 주점에 가요. 그게 문제예요.' },
      ],
    },
    {
      id: 'family-table',
      when: { ch: 3 },
      open: '{me} 님, 우리 집 밥상에 숟가락 하나 늘 놓아 둘게요. 언제든 와요.',
      replies: [
        { say: '반찬 하나 들고 갈게요', tier: 'great', remember: 'family-seat', face: 'wow', answer: '어머, 들고 오면 더 좋죠! 아니, 빈손도 괜찮아요. 진짜로요.' },
        { say: '형만 씨 괜찮을까요?', tier: 'good', face: 'laugh', answer: '그 사람이 제일 좋아해요. 맥주 같이 마실 사람 생겼다고요.' },
        { say: '폐 끼칠 것 같아요', tier: 'meh', face: 'smile', answer: '폐라뇨. 숟가락 하나 값이에요. 그 정도는 가계부에 안 적어요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '어머, 비 와요! 빨래 널어 놨는데. 형만 씨는 또 우산 안 가져갔겠죠.',
      replies: [
        { say: '우산 갖다드릴게요', tier: 'great', face: 'wow', answer: '어머, {me} 님 천사예요? 가는 길에 빵집 마감 할인도 봐 주세요.' },
        { say: '빨래 같이 걷어요', tier: 'good', answer: '고마워요! 비 오는 날 이웃이 제일 든든해요.' },
        { say: '비 맞아도 괜찮아요', tier: 'meh', face: 'sorry', answer: '안 괜찮아요! 감기 약값이 더 들어요. 계산을 해요, 계산을.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 오네요. 난방비가 무서워요. {me} 님, 내복 입었어요?',
      replies: [
        { say: '네, 두 겹 입었어요', tier: 'great', face: 'laugh', answer: '어머, 잘했어요! 내복 한 벌이 기름 한 통이에요. 진짜예요.' },
        { say: '내복은 좀 그래요', tier: 'good', face: 'think', answer: '멋보다 따뜻함이에요. 그래도 젊으니까 봐 드릴게요. 저도 젊지만요.' },
        { say: '난방 세게 틀었어요', tier: 'meh', face: 'sorry', answer: '어머어머, 그 돈이면 고기가 몇 근이에요. 아까워라.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침이에요! 아침 장은 일찍 가야 싱싱한 걸 건져요. 같이 갈래요?',
      replies: [
        { say: '바구니 들고 따라갈게요', tier: 'great', face: 'laugh', answer: '좋아요! 오늘 계란 세일이에요. 한 사람당 한 판이라 둘이면 두 판이에요.' },
        { say: '아직 졸려요', tier: 'good', face: 'smile', answer: '저도요. 근데 세일 생각하면 눈이 번쩍 떠져요. 신기하죠?' },
        { say: '장은 저녁에 봐요', tier: 'meh', face: 'think', answer: '저녁엔 마감 할인이 있긴 하죠. 근데 좋은 건 아침에 다 나가요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '늦었네요, {me} 님. 형만 씨 기다리는 중이에요. 열두 시 넘으면 문 잠가요.',
      replies: [
        { say: '그래도 국은 데워 두시죠?', tier: 'great', face: 'shy', answer: '…어머, 들켰네. 데워 두죠. 꿀밤이랑 같이 줄 거지만요.' },
        { say: '진짜 잠그실 거예요?', tier: 'good', face: 'laugh', answer: '진짜예요! …현관 말고 뒷문은 열어 둘 거예요.' },
        { say: '저도 이제 자러 가요', tier: 'meh', answer: '네, 들어가요. 불은 꼭 끄고 자요. 전기세 아까워요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 공짜 시식 코너 어디 있는지 알아요? 경품 응모권도 모았어요.',
      replies: [
        { say: '시식 코너 같이 돌아요', tier: 'great', face: 'laugh', answer: '좋아요! 한 바퀴 돌면 점심값이 굳어요. 다이어트는 내일부터예요.' },
        { say: '응모권 몇 장이에요?', tier: 'good', face: 'wow', answer: '다섯 장이요! 형만 씨 거까지 몰래 썼어요. 쉿.' },
        { say: '축제는 사람 많아요', tier: 'meh', face: 'calm', answer: '사람 많은 데 공짜도 많아요. 그게 축제예요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish} 낚았어요? 어머, 시장 가격이 얼만데! 공짜로 생긴 거잖아요.',
      replies: [
        { say: '한 마리 드릴게요', tier: 'great', face: 'wow', answer: '어머어머, 정말요? 오늘 저녁 반찬 걱정 끝! 형만 씨도 좋아하겠다.' },
        { say: '팔면 얼마 받을까요?', tier: 'good', face: 'think', answer: '시장 아침 시세로 넘기세요. 저녁엔 깎여요. 제가 같이 가 줄까요?' },
        { say: '그냥 놀다 잡았어요', tier: 'meh', answer: '놀면서 반찬을 벌었네요. 부럽다, 진짜.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '어머, 오늘 엄청 큰 걸 낚았다면서요! 마을에 소문 다 났어요.',
      replies: [
        { say: '흥정해서 팔아 주세요', tier: 'great', face: 'laugh', answer: '맡겨만 줘요! 그 크기면 웃돈 받아 와요. 수수료는 반찬 하나.' },
        { say: '운이 좋았어요', tier: 'good', answer: '운도 실력이에요. 그날 그 자리에 간 게 실력이죠.' },
        { say: '별거 아니에요', tier: 'meh', face: 'think', answer: '별거예요! 겸손은 좋은데 가격은 겸손하면 안 돼요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 거뒀다면서요? 어머, 그건 시장에서 부르는 게 값이에요!',
      replies: [
        { say: '팔 때 같이 가 주세요', tier: 'great', face: 'laugh', answer: '좋아요! 나세라 씨 앞에서 제 실력 보여 줄게요. 한 푼도 안 밀려요.' },
        { say: '그냥 제가 먹을래요', tier: 'good', face: 'smile', answer: '그것도 좋아요. 귀한 건 귀한 사람이 먹는 거죠.' },
        { say: '얼마인지 몰라요', tier: 'meh', face: 'sorry', answer: '어머, 그럼 큰일 나요. 모르고 팔면 반값에 넘어가요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 왔어요? 손 좀 봐. 싱싱한 거 있으면 저한테 먼저 보여 줘요.',
      replies: [
        { say: '제일 좋은 거 챙겨 둘게요', tier: 'great', face: 'wow', answer: '어머, 고마워요! 시장보다 싸게… 아니, 제값 쳐 드릴게요. 조금만 깎고요.' },
        { say: '팔기 전에 물어볼게요', tier: 'good', answer: '그래요. 시세는 제가 매일 봐요. 손해 보게 두진 않아요.' },
        { say: '그냥 다 팔았어요', tier: 'meh', face: 'think', answer: '어머, 얼마에요? …다음엔 저한테 먼저 물어봐요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 얼굴이 왜 그래요. 밥은 먹었어요? 안 먹었죠. 다 보여요.',
      replies: [
        { say: '사실 좀 지쳤어요', tier: 'great', face: 'smile', answer: ['그럼 오늘은 우리 집 가요. 반찬 남았어요.', '잔소리는 밥 먹고 나서 할게요. 조금만요.'] },
        { say: '괜찮아요', tier: 'good', face: 'think', answer: '괜찮은 얼굴이 아닌데요. 그럼 반찬만 싸 갈래요?' },
        { say: '그냥 혼자 있을래요', tier: 'meh', face: 'calm', answer: '알았어요. 대신 저녁은 꼭 먹어요. 안 먹으면 꿀밤이에요.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '어머, {me} 님 오늘 얼굴 좋다! 무슨 좋은 일 있어요? 세일이에요?',
      replies: [
        { say: '미선 씨 봐서 좋아요', tier: 'great', face: 'shy', answer: '어머어머, 말도 잘하셔라. 오늘 상담은 특별 우대예요.' },
        { say: '그냥 기분이 좋아요', tier: 'good', answer: '그게 제일 좋은 거예요. 기분 좋은 날엔 돈도 덜 써요.' },
        { say: '세일 아니에요', tier: 'meh', face: 'think', answer: '어머, 세일 아닌데 기분이 좋아요? 신기한 사람이네.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me} 님, 오늘 생일이죠! 케이크는 사지 마요. 제가 구웠어요. 재료는 세일.',
      replies: [
        { say: '감동이에요, 고마워요', tier: 'great', face: 'shy', answer: '어머, 울지 마요. 세일 재료라도 마음은 정가예요.' },
        { say: '같이 나눠 먹어요', tier: 'good', face: 'laugh', answer: '좋아요! 한 조각만이에요. 다이어트… 오늘은 쉬는 날.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '마을에 결혼 소식 들었어요? 어머, 축의금은 얼마가 적당할까요.',
      replies: [
        { say: '마음이 제일이죠', tier: 'great', face: 'smile', answer: '맞아요. 우리 결혼할 때도 그랬어요. 형만 씨 양복은 빌린 거였지만요.' },
        { say: '미선 씨가 정해 주세요', tier: 'good', face: 'think', answer: '음, 우리 집 기준으로 알려 드릴게요. 알뜰하되 체면은 지키게요.' },
        { say: '결혼은 비싸네요', tier: 'meh', face: 'laugh', answer: '비싸죠. 근데 해 보면 그만한 값을 해요. 대부분은요.' },
      ],
    },
    {
      id: 'op-realtor',
      when: { bond: 'realtor' },
      open: '우리 남편 만났죠? 또 용돈 얘기 했어요? 표정 보니 했네.',
      replies: [
        { say: '미선 씨 칭찬만 하던데요', tier: 'great', face: 'shy', answer: '…어머, 정말요? 그 사람이? 오늘 맥주 한 캔 허락해 줘야겠네.' },
        { say: '피곤해 보이던데요', tier: 'good', face: 'think', answer: '그쵸. 오늘 저녁은 고기예요. 티는 안 낼 거예요.' },
        { say: '용돈 올려 달래요', tier: 'meh', face: 'calm', answer: '그 협상은 끝났다고 전해 주세요. 기각이에요.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '발키리 씨 만났어요? 공사비 좀 깎아 달랬더니 또 흥정은 안 된대요.',
      replies: [
        { say: '대신 솜씨는 최고잖아요', tier: 'great', face: 'smile', answer: '그건 맞아요. 우리 집 수납장 보면 할 말이 없어요. 흥, 그래도요.' },
        { say: '제가 같이 졸라 볼까요?', tier: 'good', face: 'laugh', answer: '둘이 가면 한 푼은 깎일지도요. 아니, 둘 다 쫓겨날지도요.' },
        { say: '정가가 맞는 거죠', tier: 'meh', face: 'sorry', answer: '어머, {me} 님까지 발키리 씨 편이에요? 섭섭해요.' },
      ],
    },
    {
      id: 'op-nasera',
      when: { bond: 'nasera' },
      open: '나세라 씨 만났죠? 오늘 시세 뭐래요? 그 사람이랑은 한 푼 싸움이에요.',
      replies: [
        { say: '미선 씨가 무섭대요', tier: 'great', face: 'laugh', answer: '아하하! 그 말이 제일 듣기 좋아요. 다음 흥정도 제가 이겨요.' },
        { say: '배추 값이 올랐대요', tier: 'good', face: 'think', answer: '어머, 김장 전에 또요? 내일 아침 일찍 가서 따져 봐야겠어요.' },
        { say: '친하게 지내세요', tier: 'meh', answer: '친해요, 친한데요. 흥정할 땐 남이에요.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '프리렌 씨 빵집 다녀왔어요? 마감 할인 몇 시부터인지 물어봤어요?',
      replies: [
        { say: '미선 씨 몫도 챙겼어요', tier: 'great', face: 'wow', answer: '어머어머, 진짜요? {me} 님 최고! 반값 빵은 맛도 두 배예요.' },
        { say: '그냥 정가로 샀어요', tier: 'good', face: 'think', answer: '어머, 조금만 기다리지. 그래도 그 빵은 정가로도 맛있죠.' },
        { say: '할인은 안 물어봤어요', tier: 'meh', face: 'sorry', answer: '다음엔 꼭 물어봐요. 그 사람 시간 개념이 좀 느긋해서요.' },
      ],
    },
    {
      id: 'op-gwen',
      when: { bond: 'gwen' },
      open: '그웬 원장님 만났어요? 파마 값 조금만 깎아 달랬는데 절대 안 된대요.',
      replies: [
        { say: '그래도 머리 예뻐요', tier: 'great', face: 'shy', answer: '어머, 그래요? 그럼 제값 낸 보람이 있네요. 조금 억울하지만요.' },
        { say: '다음엔 같이 가 볼까요', tier: 'good', face: 'laugh', answer: '좋아요! 둘이 가면 앞머리 정도는 서비스해 줄지도요.' },
        { say: '원장님이 맞는 거죠', tier: 'meh', face: 'calm', answer: '…다들 왜 정가 편이에요. 이 마을은 흥정 불모지예요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-haggle',
      when: { mem: 'haggle-lesson' },
      use: 'haggle-lesson',
      open: '흥정 배운다고 했죠? 요즘 실전은 해 봤어요? 몇 푼이나 깎았어요?',
      replies: [
        { say: '덤으로 하나 더 받았어요', tier: 'great', face: 'wow', answer: '어머어머, 제자가 다 컸네! 오늘은 제가 박수 쳐 드릴게요.' },
        { say: '돌아서는 척만 했어요', tier: 'good', face: 'laugh', answer: '시작이 반이에요. 다음엔 돌아서면서 웃어 봐요.' },
        { say: '아직 못 해 봤어요', tier: 'meh', face: 'smile', answer: '괜찮아요. 다음 장날에 제 옆에 서 있어요. 보고 배우는 거예요.' },
      ],
    },
    {
      id: 'cb-diet',
      when: { mem: 'diet-cheer' },
      use: 'diet-cheer',
      open: '다이어트 응원해 준다고 했죠. …오늘이 나흘째예요. 나흘째!',
      replies: [
        { say: '대단해요! 신기록이네요', tier: 'great', face: 'laugh', answer: '그쵸! 오늘 저녁엔 상으로 케이크를… 아, 안 되지.' },
        { say: '같이 한 바퀴 걸어요', tier: 'good', face: 'smile', answer: '좋아요. 시장까지 걸어가요. 가는 김에 세일도 보고요.' },
        { say: '입가에 크림 묻었어요', tier: 'meh', face: 'sorry', answer: '…어머. 이건 아침 거예요. 나흘째 아침이요. 못 본 걸로 해 줘요.' },
      ],
    },
    {
      id: 'cb-young',
      when: { mem: 'young-look' },
      use: 'young-look',
      open: '{me} 님이 저 대학생 같다고 했잖아요. 형만 씨한테 자랑했어요.',
      replies: [
        { say: '형만 씨 뭐래요?', tier: 'great', face: 'laugh', answer: '눈이 나쁜가 보다래요. 그래서 꿀밤 하나 줬어요. 딱 하나.' },
        { say: '진심이었어요', tier: 'good', face: 'shy', answer: '어머, 또 그런다. 오늘 반찬 하나 더 싸 줄게요.' },
      ],
    },
    {
      id: 'cb-snack',
      when: { mem: 'snack-shelf' },
      use: 'snack-shelf',
      open: '그 찬장 맨 위 칸이요. 형만 씨가 거의 찾을 뻔했어요. 큰일 날 뻔했죠.',
      replies: [
        { say: '저는 끝까지 모른 척했어요', tier: 'great', face: 'laugh', answer: '역시 {me} 님! 공범… 아니, 동지예요. 쿠키 하나 받아요.' },
        { say: '다른 데로 옮겨요', tier: 'good', face: 'think', answer: '쌀통 밑은 형만 씨 비상금 자리라 안 돼요. 고민이에요.' },
        { say: '그냥 같이 드세요', tier: 'meh', face: 'calm', answer: '…그게 제일 좋긴 하죠. 근데 그럼 제 몫이 줄잖아요.' },
      ],
    },
    {
      id: 'cb-allowance',
      when: { mem: 'allowance' },
      use: 'allowance',
      open: '용돈 협상 말이에요. 형만 씨가 결국 집안일을 하나 더 하겠대요.',
      replies: [
        { say: '그럼 조금 올려 주세요', tier: 'great', face: 'smile', answer: '…{me} 님이 그러니까 오백 원 올려 줄게요. 우리 남편, 고마워해야 해요.' },
        { say: '미선 씨 완승이네요', tier: 'good', face: 'laugh', answer: '그쵸? 협상은 늘 이렇게 끝나요. 그래도 고기는 굽죠.' },
      ],
    },
    {
      id: 'cb-kimchi',
      when: { mem: 'kimchi-help' },
      use: 'kimchi-help',
      open: '김장 도와준다던 거요. 고무장갑 세일할 때 샀어요. {me} 님 거예요.',
      replies: [
        { say: '배추 나르는 건 맡겨요', tier: 'great', face: 'wow', answer: '어머, 든든해라! 형만 씨는 허리 아프다고 맨날 빠지거든요.' },
        { say: '양념 맛보는 담당이요', tier: 'good', face: 'laugh', answer: '아하하, 그 자리는 제 거예요. 대신 수육 첫 점 줄게요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님 좋아하는 게 {taste} 맞죠? 가계부 옆에 적어 뒀어요. 세일하면 살게요.',
      replies: [
        { say: '미선 씨 최고예요', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '어머, 가계부에 남의 취향 적는 건 {me} 님이 처음이에요.' },
        { say: '정가일 땐요?', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '정가일 땐 기다려요. 세일은 반드시 와요. 그게 세상 이치예요.' },
        { say: '신경 안 쓰셔도 돼요', tier: 'meh', remember: 'taste-heard', face: 'smile', answer: '신경 쓰는 게 제 취미예요. 공짜 취미요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '그때 같이 나갔던 날이요. 오랜만에 형만 씨 말고 딴 사람이랑 걸었네요.',
      replies: [
        { say: '또 같이 장 보러 가요', tier: 'great', remember: 'outing-talk', face: 'laugh', answer: '좋아요! {me} 님이랑 가면 두 사람 몫 세일을 받아요. 최고예요.' },
        { say: '형만 씨 질투 안 해요?', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '질투요? 그 사람은 제가 장 보러 가면 쉬는 날인 줄 알아요.' },
        { say: '좀 피곤했어요', tier: 'meh', remember: 'outing-talk', face: 'sorry', answer: '어머, 제가 너무 끌고 다녔죠. 다음엔 쉬엄쉬엄 갈게요.' },
      ],
    },
    {
      id: 'cb-bday-soon',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: '{me} 님 생일 곧이죠? 다 알아요. 잔치는 알뜰하게, 마음은 넉넉하게 할 거예요.',
      replies: [
        { say: '미선 씨 반찬이면 충분해요', tier: 'great', remember: 'bday-heard', face: 'shy', answer: '어머, 그럼 반찬을 세 가지… 아니, 다섯 가지 할게요.' },
        { say: '케이크도 있어요?', tier: 'good', remember: 'bday-heard', face: 'laugh', answer: '당연하죠. 저도 한 조각 먹을 거예요. 생일 손님 대접이에요.' },
        { say: '조용히 지나가도 돼요', tier: 'meh', remember: 'bday-heard', face: 'calm', answer: '안 돼요. 생일은 챙기는 거예요. 그건 아끼면 안 되는 돈이에요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '상담은 공짜예요',
      hint: '한 번 이야기를 나누면 봉미선 실장이 상담 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '봉미선이 카운터 너머로 몸을 내밀며 활짝 웃는다.',
        '"어서 오세요! 범마을 부동산 실장 봉미선이에요."',
        '"{me} 님이요? 어머, 이름 예쁘다. 장부에 적어 둘게요."',
        '"상담은 공짜예요. 공사비는 제가 한 푼이라도 깎아 드리고요."',
        '"아, 우리 남편은 월수금이에요. 저는 화목. 저한테 오는 게 이득이에요."',
      ],
      replies: [
        { say: '그럼 화목에 올게요', tier: 'great', face: 'laugh', answer: '어머, 눈치 빠르셔라! 우리 단골 하나 생겼네.' },
        { say: '공짜 좋아요', tier: 'good', face: 'smile', answer: '그쵸? 공짜는 언제 들어도 좋은 말이에요.' },
        { say: '그냥 구경 왔어요', tier: 'meh', face: 'calm', answer: '구경도 환영이에요. 구경하다 계약하는 손님이 제일 많거든요.' },
      ],
    },
    {
      title: '아침 장보기',
      hint: '아침(게임 시각 여섯 시부터 열 시) 시장 거리에 가 보세요. 미선 씨가 장을 봐요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 6, to: 10 } },
      scene: [
        '아침 시장. 봉미선이 장바구니를 들고 좌판 앞에 서 있다.',
        '"어머, {me} 님! 진짜 왔네. 마침 잘 왔어요. 잘 봐요."',
        '그녀가 배추를 들었다 놓고, 돌아서는 척하다 웃으며 돌아본다.',
        '"…그럼 이 무 하나 덤으로 주시는 거죠? 어머, 고마워라!"',
        '바구니가 금세 찬다. 그녀가 그중 사과 하나를 내게 쥐여 준다.',
        '"이건 {me} 님 거예요. 같이 와 준 수고비. 공짜로 받은 거라 더 맛있어요."',
      ],
      replies: [
        { say: '흥정 진짜 대단해요', tier: 'great', remember: 'market-dawn', face: 'laugh', answer: '어머, 이 정도는 몸풀기예요. 다음엔 {me} 님이 해 봐요.' },
        { say: '바구니 들어 드릴게요', tier: 'good', remember: 'market-dawn', face: 'wow', answer: '어머, 고마워요! 형만 씨는 이런 거 한 번도 안 해 줬는데.' },
        { say: '너무 일찍 일어났어요', tier: 'meh', remember: 'market-dawn', face: 'smile', answer: '아하하, 그래도 왔잖아요. 아침 시장은 일찍 일어난 사람 거예요.' },
      ],
    },
    {
      title: '맨 위 칸의 비밀',
      hint: '미선 씨는 호박파이를 몰래 좋아해요. 호박파이 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'pumpkinpie', take: true } },
      scene: [
        '호박파이를 내밀자 봉미선이 주위를 휙 둘러본다.',
        '"…쉿! 이리 와요. 형만 씨 오기 전에요."',
        '그녀가 의자를 밟고 찬장 맨 위 칸을 연다. 과자 봉지가 빼곡하다.',
        '"다이어트는 내일부터예요. 오늘은 {me} 님 성의를 받아야죠."',
        '그녀가 파이를 반으로 잘라 큰 쪽을 내게 민다.',
        '"이 칸 아는 사람, 이제 둘이에요. 그만큼 믿는다는 거예요."',
      ],
      replies: [
        { say: '무덤까지 비밀로 할게요', tier: 'great', remember: 'pie-secret', face: 'laugh', answer: '어머, 든든해라! 이제 우리 진짜 동지예요. 한 입 더 먹어요.' },
        { say: '큰 쪽은 미선 씨 드세요', tier: 'good', remember: 'pie-secret', face: 'shy', answer: '…어머, 그럼 사양 안 할게요. 다이어트는 모레부터 하죠.' },
        { say: '과자가 너무 많은데요', tier: 'meh', remember: 'pie-secret', face: 'sorry', answer: '…다 세일할 때 산 거예요. 비상식량이에요. 그렇다고 해 줘요.' },
      ],
    },
    {
      title: '가계부의 빈칸',
      hint: '미선 씨가 돈 쓰는 습관을 물어볼 때, 알뜰한 게 좋다고 대답해 보세요.',
      need: { days: 9, points: 60, mem: 'thrift-pal' },
      scene: [
        '봉미선이 손때 묻은 가계부를 펼친다. 줄마다 숫자가 빼곡하다.',
        '"알뜰한 게 좋다고 했죠. 그래서 보여 주는 거예요."',
        '그녀가 맨 끝 장을 넘긴다. 금액 없이 이름만 적힌 칸들이 있다.',
        '"여긴 아깝지 않은 돈 칸이에요. 형만 씨 약값, 이웃 반찬값."',
        '"그리고 이건… {me} 님 칸이에요. 금액은 안 적어요. 셀 필요가 없거든요."',
      ],
      replies: [
        { say: '저도 미선 씨 칸 만들게요', tier: 'great', face: 'shy', answer: '어머… 그럼 서로 빈칸이네요. 그거 참 알뜰한 거래예요.' },
        { say: '알뜰함의 끝은 정이네요', tier: 'good', face: 'smile', answer: '맞아요. 아끼는 건 결국 쓸 데 쓰려고 하는 거예요.' },
        { say: '형만 씨 칸은 작네요', tier: 'meh', face: 'laugh', answer: '아하하, 거긴 따로 한 권 있어요. 용돈 기각 기록이요.' },
      ],
    },
    {
      title: '우리 집 식구',
      hint: '미선 씨와 아주 가까워지면 그녀가 저녁 밥상에 불러요.',
      need: { days: 13, points: 96 },
      scene: [
        '봉미선 집 저녁. 밥상에 숟가락이 세 개 놓여 있다.',
        '"어서 앉아요. 형만 씨, 맥주는 한 캔만이에요. 손님 앞이라도요."',
        '신형만이 웃으며 내 잔을 채우고, 미선이 고기를 뒤집는다.',
        '"{me} 님, 이 마을 와서 우리가 얼마나 든든했는지 알아요?"',
        '"잔소리할 사람이 하나 늘었잖아요. 그건 식구라는 뜻이에요."',
        '그녀가 내 밥그릇에 고기를 수북이 얹는다. 세일 고기가 아니다.',
      ],
      replies: [
        { say: '잔소리 많이 해 주세요', tier: 'great', remember: 'family-seat', face: 'laugh', answer: '어머, 각오해요! 우리 집 식구 된 거 무르기 없어요.' },
        { say: '오늘 고기 비싼 거네요', tier: 'good', remember: 'family-seat', face: 'shy', answer: '…눈치도 빠르셔라. 식구한텐 정가 고기예요. 오늘만요.' },
        { say: '그냥 이웃인데요', tier: 'meh', remember: 'family-seat', face: 'smile', answer: '이웃이 밥 먹으면 식구예요. 이 집 규칙이에요.' },
      ],
    },
    {
      title: '형만 씨의 자리',
      hint: '미선 씨의 마지막 이야기는 형만 씨 몫이라, 친구에게는 닫혀 있어요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '저녁 부동산. 봉미선이 형만 씨 넥타이를 고쳐 매 준다.',
        '"똑바로 서요, 여보. 또 비뚤어졌잖아요."',
        '그녀가 나를 돌아보며 웃는다.',
        '"이 자리는 형만 씨 거예요. {me} 님 자리는 우리 밥상이고요."',
        '"둘 다 제 마음에서 제일 아까운 자리예요. 아깝지 않아서요."',
      ],
      replies: [
        { say: '두 분 오래오래 행복하세요', tier: 'great', face: 'shy', answer: '어머, 축의금 대신 그 말이면 충분해요. 고마워요.' },
        { say: '밥상 자리 지킬게요', tier: 'good', face: 'laugh', answer: '그래요. 숟가락은 늘 놓아 둘게요.' },
        { say: '넥타이 또 비뚤어요', tier: 'meh', face: 'calm', answer: '…여보! 가만히 좀 있어요. 꿀밤이에요.' },
      ],
    },
  ],
  after: [
    '오늘 할 얘기는 다 했어요. 시장 세일 끝나기 전에 가 봐요!',
    '또 왔어요? 반찬 싸 줄까요? 사양하지 마요.',
    '저 잠깐 눈 감고 생각할 거예요. 낮잠 아니에요.',
    '불 끄고 다녀요, {me} 님. 전기세 아까워요.',
    '내일은 화요일이면 좋겠다. 그럼 제가 카운터 보거든요.',
  ],
};
