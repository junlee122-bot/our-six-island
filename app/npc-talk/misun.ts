// 봉미선 — 범마을 부동산 실장 (화·목 카운터, 주말엔 형만과 함께).
// 『짱구는 못말려』 노하라 미사에(한국판 봉미선)를 마을로 옮긴 사람.
// 싹싹하고 밝은 해요체("어머", "어머어머"). 남편은 "여보"/"형만 씨"(남에겐 "우리 남편").
// 마을 최강 흥정꾼: 세일·쿠폰·한정 특가에 눈이 번쩍, 충동구매 뒤 후회, 찬장 맨 위 칸에
// 숨긴 간식, 작심삼일 다이어트, 우기는 낮잠("눈 감고 생각하는 거예요"), 화나면 가벼운
// 꿀밤, 남편 용돈 깎기와 비상금 찾기. 젊어 보인다는 말엔 약하고 나이·뱃살 얘기엔 정색.
// 집에는 말썽꾸러기 아들 짱구(피망 거부, 초코비, 액션가면, 엉덩이 춤), 기어다니며
// 반짝이는 것만 보면 달려드는 딸 짱아, 짱구가 밥을 자꾸 잊는 하얀 강아지 흰둥이.
// 잔소리 뒤엔 누구보다 깊은 정: 억척스럽지만 정 깊은 엄마이자 아내.
// 신형만과 결혼한 사이라 플레이어와 연애하지 않는다(꽃다발·청혼으로 잇지 않음):
// 이야기는 우정과 "우리 집 식구"가 되는 길이다. 마지막 장 '형만 씨의 자리'도
// 친구로 연다(16일·8하트). 원작 대사는 쓰지 않는다.
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
    'pepper-plan': '짱구 피망 작전을 같이 짜 줬어요',
    'chocobi': '초코비 하나만 협상을 도와줬어요',
    'shiny-baby': '짱아가 엄마 닮았다고 했어요',
    'dog-meal': '흰둥이 밥을 챙겨 주기로 했어요',
    'stash-hunt': '형만 씨 비상금 찾기를 도와줬어요',
    'gossip-pal': '시장 앞 수다 모임에 끼었어요',
    'mom-rest': '엄마도 쉬어야 한다고 말해 줬어요',
    'hero-show': '액션가면 시간을 같이 지켜 줬어요',
    'bus-run': '유치원 버스 아침 전쟁 이야기를 들었어요',
    'recipe-swap': '남은 반찬 살리는 법을 배웠어요',
    'tv-shop': '홈쇼핑 냄비를 말려 줬어요',
    'anniv-plan': '결혼기념일 계획을 같이 짰어요',
    'piggy-bank': '짱구 저금통 사건을 들었어요',
    'perm-talk': '파마 머리가 잘 어울린다고 했어요',
    'slipper-run': '슬리퍼 한 짝으로 뛰던 날을 함께했어요',
    'kid-dance': '짱구 엉덩이 춤 이야기에 웃었어요',
  },
  talks: [
    {
      id: 'thrift',
      open: '{me} 님은 돈 쓸 때 어떤 편이에요? 저는 백 원도 아까워요.',
      replies: [
        { say: '알뜰한 게 최고예요', tier: 'great', remember: 'thrift-pal', face: 'wow', answer: ['어머어머! 역시 제 눈은 정확해요.', '우리 이제 알뜰 동지예요. 세일 정보 다 공유할게요.'] },
        { say: '쓸 땐 쓰는 편이에요', tier: 'good', answer: '그것도 맞아요. 대신 쓸 데를 잘 골라야 해요. 제가 골라 드릴까요?' },
        { say: '있으면 다 써요', tier: 'meh', face: 'sorry', answer: ['어머, 그럼 안 돼요! 우리 남편이랑 똑같네요.', '우리 짱구도 그래요. 용돈 받으면 그날 초코비로 끝이에요.'] },
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
        { say: '그냥 잔 거잖아요', tier: 'meh', face: 'sorry', answer: '아니라니까요! …형만 씨한테는 말하지 마요. 짱구한테도요.' },
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
        { say: '짱구한테 물어볼게요', tier: 'meh', face: 'sorry', answer: ['어머, 안 돼요! 그 녀석 코는 강아지보다 좋아요.', '알면 하루 만에 바닥나요. 형만 씨도 모르는 칸이에요.'] },
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
        { say: '김장은 힘들어요', tier: 'meh', face: 'calm', answer: ['힘들죠. 그래서 다 같이 하는 거예요.', '짱구는 양념 묻은 손으로 흰둥이 쓰다듬고요. 아휴.'] },
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
        { say: '좋아서 웃는 거죠', tier: 'great', face: 'shy', answer: '어머, {me} 님 말 잘하네. 그렇다고 해 두죠. 형만 씨는 꿀밤 하나.' },
        { say: '저녁 메뉴 생각이겠죠', tier: 'good', face: 'laugh', answer: '아하하, 그럴 수도요. 그 사람 머릿속엔 맥주랑 오징어뿐이에요.' },
        { say: '뱃살 때문 아닐까요', tier: 'meh', face: 'calm', answer: ['…{me} 님. 그 단어는 우리 집 금지어예요.', '짱구가 그 말 했다가 꿀밤 두 대 맞았어요. 지금 들은 걸로 할게요.'] },
      ],
    },
    {
      id: 'husband-worry',
      open: '형만 씨가 요즘 피곤해 보여요. 잔소리를 좀 줄여야 할까 봐요.',
      replies: [
        { say: '잔소리도 정이잖아요', tier: 'great', face: 'smile', answer: ['어머… 그걸 알아주는 사람이 있네요.', '그럼 줄이지 말고, 반찬을 하나 늘릴게요.'] },
        { say: '고기 구워 주세요', tier: 'good', face: 'laugh', answer: '역시 그게 제일이죠. 한우는 못 사도 세일 삼겹살은 살 수 있어요.' },
        { say: '그냥 두면 돼요', tier: 'meh', face: 'think', answer: '그럴까요? 근데 그냥 두면 또 주점에 가요. 그게 문제예요.' },
      ],
    },
    {
      id: 'pepper',
      open: '우리 짱구가 피망을 안 먹어요. 접시에서 하나하나 골라내요. 어쩌죠?',
      replies: [
        { say: '잘게 다져서 숨겨요', tier: 'great', remember: 'pepper-plan', face: 'wow', answer: ['어머, 작전이네요! 볶음밥에 콩알만 하게요.', '들키면 {me} 님 아이디어라고 할게요. 농담이에요.'] },
        { say: '저도 피망 싫어해요', tier: 'good', face: 'laugh', answer: '어머, 어른이 그러면 안 되죠! …사실 형만 씨도 몰래 골라내요.' },
        { say: '안 먹으면 굶겨요', tier: 'meh', face: 'sorry', answer: '그게 되면 좋겠어요. 그 녀석은 굶으면서 초코비 숨긴 데를 찾아요.' },
      ],
    },
    {
      id: 'chocobi',
      open: '장 보러 가면 짱구가 과자 코너에 드러누워요. 초코비 사 달라고요.',
      replies: [
        { say: '하나만 약속하고 사 줘요', tier: 'great', remember: 'chocobi', face: 'smile', answer: ['그쵸, 하나만이요. 근데 꼭 두 개를 들고 와요.', '하나는 흰둥이 거래요. 강아지는 초코 못 먹는데 말이에요.'] },
        { say: '모른 척 지나가요', tier: 'good', face: 'think', answer: '해 봤어요. 그랬더니 계산대까지 굴러서 따라와요. 진짜예요.' },
        { say: '그냥 다 사 줘요', tier: 'meh', face: 'calm', answer: '어머, 그럼 우리 집 거덜 나요. {me} 님은 삼촌 노릇 하면 안 되겠다.' },
      ],
    },
    {
      id: 'jjanga',
      open: '짱아가 요즘 반짝이는 것만 보면 기어가요. 제 반지 앞에서 안 움직여요.',
      replies: [
        { say: '엄마 닮았네요', tier: 'great', remember: 'shiny-baby', face: 'laugh', answer: ['어머, 들켰네! 맞아요, 제 딸이에요.', '보석 가게 앞에선 저랑 짱아랑 둘 다 못 움직여요.'] },
        { say: '눈이 높은 아기네요', tier: 'good', face: 'shy', answer: '그쵸? 장난감 반지는 거들떠도 안 봐요. 큰일이에요, 진짜로.' },
        { say: '위험하지 않아요?', tier: 'meh', face: 'think', answer: '그래서 작은 건 다 높은 데 둬요. 찬장 맨 위 칸은 이미 꽉 찼지만요.' },
      ],
    },
    {
      id: 'whitey',
      open: '흰둥이 밥 주는 건 짱구 담당인데요, 또 잊었어요. 몇 번째인지 몰라요.',
      replies: [
        { say: '제가 가끔 들여다볼게요', tier: 'great', remember: 'dog-meal', face: 'wow', answer: ['어머, 정말요? 흰둥이가 제일 좋아하겠어요.', '사료는 현관 옆 통에 있어요. 세일 때 큰 걸로 샀어요.'] },
        { say: '결국 미선 씨가 주죠?', tier: 'good', face: 'smile', answer: '…네. 잔소리하면서 주죠. 그 눈망울을 어떻게 외면해요.' },
        { say: '강아지가 알아서 먹겠죠', tier: 'meh', face: 'sorry', answer: '흰둥이는 착해서 조르지도 않아요. 그래서 더 짠해요.' },
      ],
    },
    {
      id: 'stash',
      open: '형만 씨 비상금이 또 생긴 것 같아요. 요즘 맥주 안주가 좋아졌거든요.',
      replies: [
        { say: '같이 찾아봐요', tier: 'great', remember: 'stash-hunt', face: 'laugh', answer: ['좋아요! 책장, 양말 서랍, 구두 안은 이미 봤어요.', '남은 건 넥타이 상자예요. {me} 님 감을 믿어 볼게요.'] },
        { say: '모른 척해 주세요', tier: 'good', face: 'think', answer: '…그것도 내조죠. 대신 그 안주는 저도 반 먹을 거예요.' },
        { say: '형만 씨 불쌍해요', tier: 'meh', face: 'calm', answer: '불쌍하긴요. 그 돈이 다 대출 갚을 돈이에요. 삼십 년 넘게요.' },
      ],
    },
    {
      id: 'gossip',
      open: '시장 앞에서 동네 언니들 만나면 한 시간은 그냥 가요. 이상하죠?',
      replies: [
        { say: '저도 끼워 주세요', tier: 'great', remember: 'gossip-pal', face: 'laugh', answer: ['어머, 환영이에요! 대신 들은 건 반만 믿어요.', '반은 세일 정보고, 반은 남편 흉이거든요.'] },
        { say: '무슨 얘기 해요?', tier: 'good', face: 'think', answer: '배추 값, 유치원 소식, 누구네 남편 늦게 들어온 얘기요. 대부분 형만 씨요.' },
        { say: '시간 아깝지 않아요?', tier: 'meh', face: 'sorry', answer: '어머, 그 한 시간에 세일 정보가 세 개예요. 제일 남는 시간이에요.' },
      ],
    },
    {
      id: 'mom-rest',
      open: '가끔은요, 하루만 엄마 말고 그냥 봉미선이고 싶어요. 욕심이죠?',
      replies: [
        { say: '엄마도 쉬어야 해요', tier: 'great', remember: 'mom-rest', face: 'shy', answer: ['…어머, 그 말 듣고 싶었나 봐요. 눈물 날 뻔했어요.', '그날 오면 {me} 님이랑 빵집 가서 정가 케이크 먹을래요.'] },
        { say: '형만 씨한테 맡기세요', tier: 'good', face: 'laugh', answer: '맡겨 봤어요. 집에 와 보니 셋이 같이 자고 있더라고요. 흰둥이까지 넷.' },
        { say: '엄마는 원래 그래요', tier: 'meh', face: 'sorry', answer: '…알아요. 그래도 원래 그런 건 없어요. 다들 참는 거예요.' },
      ],
    },
    {
      id: 'hero-show',
      open: '저녁에 액션가면 할 때만 집이 조용해요. 그 삼십 분이 제 휴가예요.',
      replies: [
        { say: '그 시간엔 안 찾아갈게요', tier: 'great', remember: 'hero-show', face: 'laugh', answer: '어머, 배려 최고! 그 시간엔 찬장 맨 위 칸을 여는 시간이거든요.' },
        { say: '저도 액션가면 좋아요', tier: 'good', face: 'wow', answer: '어머, 어른 팬이 여기 있네! 짱구한테 말하면 포즈 배우러 올 거예요.' },
        { say: '애들 방송 유치해요', tier: 'meh', face: 'calm', answer: '쉿, 우리 집에선 그 말 금지예요. 짱구가 들으면 하루 종일 따져요.' },
      ],
    },
    {
      id: 'bus-run',
      open: '아침마다 유치원 버스랑 달리기해요. 짱구는 꼭 신발을 거꾸로 신어요.',
      replies: [
        { say: '아침이 전쟁이네요', tier: 'great', remember: 'bus-run', face: 'laugh', answer: ['전쟁이죠! 한 손엔 짱아, 한 손엔 도시락.', '흰둥이는 뒤에서 응원해요. 그게 제일 얄미워요.'] },
        { say: '전날 밤에 챙겨 두세요', tier: 'good', face: 'think', answer: '챙겨 두죠. 그럼 밤사이 짱구가 가방 안을 장난감으로 바꿔요.' },
        { say: '그냥 걸어가면 되잖아요', tier: 'meh', face: 'sorry', answer: '걸어가면 꽃 보고 개미 보고 예쁜 누나 보고 해 져요. 진짜로.' },
      ],
    },
    {
      id: 'leftover',
      open: '어제 남은 반찬이요, 오늘 볶음밥에 다 들어갔어요. 이게 살림 비법이에요.',
      replies: [
        { say: '비법 더 알려 주세요', tier: 'great', remember: 'recipe-swap', face: 'wow', answer: ['좋아요! 남은 찌개는 국수로, 식은 밥은 누룽지로.', '버리는 건 하나도 없어요. 피망만 빼고요. 짱구가 골라내니까요.'] },
        { say: '매일 새로 하면 안 돼요?', tier: 'good', face: 'think', answer: '그러면 좋죠. 근데 그 돈이면 짱아 기저귀가 한 봉지예요.' },
        { say: '남은 건 버려요', tier: 'meh', face: 'sorry', answer: '어머어머, 그 말 우리 엄마가 들었으면 쓰러져요. 저도요.' },
      ],
    },
    {
      id: 'tv-shop',
      open: '밤에 홈쇼핑 보는데 냄비 세트가 지금 아니면 끝이래요. 살까요, 말까요?',
      replies: [
        { say: '냄비 이미 여섯 개잖아요', tier: 'great', remember: 'tv-shop', face: 'sorry', answer: ['…맞아요. 정신 차렸어요. 고마워요, {me} 님.', '근데 그 사은품 국자가 좀 탐나긴 해요.'] },
        { say: '사은품이 뭔데요?', tier: 'good', face: 'think', answer: '국자랑 뒤집개요. …필요 없죠. 알아요. 근데 공짜잖아요.' },
        { say: '사세요, 지금 아니면 끝', tier: 'meh', face: 'laugh', answer: '어머, {me} 님 홈쇼핑 진행자 해도 되겠어요. 근데 안 살 거예요.' },
      ],
    },
    {
      id: 'anniv',
      open: '다음 달이 결혼기념일인데요, 형만 씨가 기억할까요? 내기할래요?',
      replies: [
        { say: '제가 슬쩍 귀띔할게요', tier: 'great', remember: 'anniv-plan', face: 'shy', answer: ['어머, 그래 줄래요? 대신 티 나게 하면 안 돼요.', '자기가 기억한 줄 알아야 그 사람이 뿌듯해하거든요.'] },
        { say: '기억하실 거예요', tier: 'good', face: 'smile', answer: '작년엔 전날 밤에 생각났대요. 그래도 꽃 한 송이는 사 왔어요.' },
        { say: '잊으면 꿀밤이죠', tier: 'meh', face: 'laugh', answer: '아하하, 꿀밤은 기본이고 용돈 동결이에요. 일 년이요.' },
      ],
    },
    {
      id: 'piggy',
      open: '짱구 돼지 저금통이 가벼워졌어요. 흔들어 보니까 동전 소리가 안 나요.',
      replies: [
        { say: '초코비로 변신했겠네요', tier: 'great', remember: 'piggy-bank', face: 'laugh', answer: ['정답이에요! 과자 봉지가 침대 밑에 수북했어요.', '꿀밤 하나, 그리고 저금통엔 제가 몰래 동전 하나 넣었어요.'] },
        { say: '흰둥이가 먹었을까요?', tier: 'good', face: 'laugh', answer: '아하하, 짱구도 그렇게 말했어요. 흰둥이는 억울한 얼굴이었고요.' },
        { say: '형만 씨 아닐까요?', tier: 'meh', face: 'think', answer: '…어머, 그럴 수도 있겠네요. 그 사람 비상금 출처가 궁금했거든요.' },
      ],
    },
    {
      id: 'perm',
      open: '그웬 원장님한테 파마했어요. 어때요? 형만 씨는 아무 말도 안 해요.',
      replies: [
        { say: '정말 잘 어울려요', tier: 'great', remember: 'perm-talk', face: 'shy', answer: ['어머어머, 그쵸? 제값 낸 보람이 있네요.', '{me} 님 말 형만 씨한테 그대로 전할 거예요. 공부하라고요.'] },
        { say: '어려 보이세요', tier: 'good', face: 'wow', answer: '어머, 오늘 견적서 다시 뽑아 줄게요. 더 싸게요.' },
        { say: '전이랑 뭐가 달라요?', tier: 'meh', face: 'calm', answer: '…{me} 님도 형만 씨랑 똑같네요. 남자들이란. 아, 모두가 그렇구나.' },
      ],
    },
    {
      id: 'dance',
      open: '짱구가 손님 앞에서 엉덩이 춤을 췄어요. 계약하러 온 손님 앞에서요!',
      replies: [
        { say: '손님이 웃었겠네요', tier: 'great', remember: 'kid-dance', face: 'laugh', answer: ['웃었어요. 그리고 계약도 했어요. 어이가 없죠.', '그래도 꿀밤은 줬어요. 상은 상이고 벌은 벌이에요.'] },
        { say: '저도 보고 싶어요', tier: 'good', face: 'sorry', answer: '어머, 그런 말 하면 큰일 나요. 달려와서 앞에서 춰 줄 거예요.' },
        { say: '혼내셨어요?', tier: 'meh', face: 'think', answer: '혼냈죠. 근데 혼내다가 저도 웃었어요. 엄마 실격이에요.' },
      ],
    },
    {
      id: 'nap-baby',
      open: '짱아 재우다가 저도 같이 잠들었어요. 이건 진짜 낮잠 아니에요. 육아예요.',
      replies: [
        { say: '그건 육아 맞아요', tier: 'great', face: 'laugh', answer: '그쵸! 같이 누워 줘야 자요. 일하다 잠든 거예요. 업무상 낮잠.' },
        { say: '잘 쉬셨네요', tier: 'good', face: 'shy', answer: '…네, 사실 개운했어요. 깨 보니 짱구가 이마에 낙서해 놨지만요.' },
        { say: '또 낮잠이네요', tier: 'meh', face: 'sorry', answer: '또라니요! 엄마 낮잠은 국가가 보장해야 해요.' },
      ],
    },
    {
      id: 'scold',
      open: '짱구한테 꿀밤 줄 때요, 사실 제 손이 더 아파요. 마음도요.',
      replies: [
        { say: '그래도 사랑하잖아요', tier: 'great', face: 'shy', answer: ['…그럼요. 그 녀석 자는 얼굴 보면 다 잊어요.', '내일 또 꿀밤 줄 거지만요. 그게 우리 집이에요.'] },
        { say: '말로 하면 안 돼요?', tier: 'good', face: 'think', answer: '말로 하면 엉덩이 춤으로 대답해요. 그래도 노력은 해 볼게요.' },
        { say: '짱구가 무섭겠어요', tier: 'meh', face: 'laugh', answer: '무서워하면 좋게요. 맞고 나서 엄마 손 아프냐고 묻는 녀석이에요.' },
      ],
    },
    {
      id: 'teacher-sister',
      open: '어머, 유치원 선생님이 저보고 언니냐고 물었어요. 짱구 누나냐고요!',
      replies: [
        { say: '그럴 만해요', tier: 'great', face: 'shy', answer: ['어머어머! {me} 님까지! 오늘 기분 최고예요.', '짱구가 옆에서 아줌마라고 해서 반은 깎였지만요.'] },
        { say: '선생님이 착하시네요', tier: 'good', face: 'think', answer: '…예의상 한 말이라는 뜻이에요? 그래도 기분은 받을게요.' },
        { say: '진짜 그렇게 물었어요?', tier: 'meh', face: 'calm', answer: '진짜예요! 왜 못 믿어요. {me} 님, 오늘 상담은 유료예요.' },
      ],
    },
    {
      id: 'market-friend',
      when: { ch: 2 },
      open: '{me} 님이랑 아침 시장 다녀온 뒤로 상인들이 우리 둘을 알아봐요.',
      replies: [
        { say: '흥정 팀이네요', tier: 'great', face: 'laugh', answer: '그쵸! 저는 깎고 {me} 님은 웃고. 덤이 두 배로 나와요.' },
        { say: '저는 짐꾼이었죠', tier: 'good', face: 'smile', answer: '최고의 짐꾼이요. 형만 씨보다 백 배 나아요. 투덜대지 않잖아요.' },
        { say: '좀 부끄러워요', tier: 'meh', face: 'shy', answer: '부끄러울 거 없어요. 알뜰한 건 자랑이에요.' },
      ],
    },
    {
      id: 'family-table',
      when: { ch: 3 },
      open: '{me} 님, 우리 집 밥상에 숟가락 하나 늘 놓아 둘게요. 언제든 와요.',
      replies: [
        { say: '반찬 하나 들고 갈게요', tier: 'great', remember: 'family-seat', face: 'wow', answer: '어머, 들고 오면 더 좋죠! 아니, 빈손도 괜찮아요. 진짜로요.' },
        { say: '형만 씨 괜찮을까요?', tier: 'good', face: 'laugh', answer: '그 사람이 제일 좋아해요. 맥주 같이 마실 사람 생겼다고요.' },
        { say: '폐 끼칠 것 같아요', tier: 'meh', face: 'smile', answer: ['폐라뇨. 숟가락 하나 값이에요.', '짱구는 벌써 {me} 님 자리 옆에 앉겠다고 찜했어요.'] },
      ],
    },
    {
      id: 'slipper-after',
      when: { ch: 5 },
      open: '그날 슬리퍼 한 짝 잃어버린 거요. 아직도 못 찾았어요. 아까워라.',
      replies: [
        { say: '짱구 찾았으니 됐죠', tier: 'great', face: 'smile', answer: ['…맞아요. 슬리퍼는 열 켤레라도 바꿔요.', '근데 세일하면 사려고요. 그건 그거예요.'] },
        { say: '같이 찾아볼까요?', tier: 'good', face: 'laugh', answer: '흰둥이가 물고 갔을 거예요. 마당 어딘가에 묻혀 있겠죠.' },
        { say: '새로 사세요', tier: 'meh', face: 'think', answer: '한 짝만 파는 데가 있으면 좋겠어요. 반값일 텐데.' },
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
        { say: '빨래 같이 걷어요', tier: 'good', answer: ['고마워요! 비 오는 날 이웃이 제일 든든해요.', '짱구는 빗물 웅덩이에서 첨벙대고 있을 거예요. 아휴.'] },
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
      id: 'op-day',
      when: { time: 'day' },
      open: '점심 지나니까 눈꺼풀이 무거워요. 짱아가 낮잠 자는 시간이거든요.',
      replies: [
        { say: '잠깐 눈 감고 생각하세요', tier: 'great', face: 'laugh', answer: '어머, 그 말 알아들어 주는 사람! 십 분만 생각할게요. 깨워 줘요.' },
        { say: '커피 한 잔 드릴까요?', tier: 'good', face: 'smile', answer: '고마워요. 믹스 커피면 충분해요. 비싼 건 잠이 더 와요.' },
        { say: '일하는 시간 아니에요?', tier: 'meh', face: 'sorry', answer: '…맞아요. 장부 펼게요. 눈은 반만 뜨고요.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '저녁 반찬 뭘로 할까 고민 중이에요. 짱구는 고기, 형만 씨는 안주래요.',
      replies: [
        { say: '고기 안주면 둘 다 되죠', tier: 'great', face: 'wow', answer: '어머, 천재예요! 삼겹살 세일이니까 딱이에요. 피망은 다져 넣고요.' },
        { say: '미선 씨 먹고 싶은 걸로요', tier: 'good', face: 'shy', answer: '…제가 먹고 싶은 거요? 그런 질문 오랜만이에요. 생각해 볼게요.' },
        { say: '그냥 라면 끓이세요', tier: 'meh', face: 'calm', answer: '라면은 비상식량이에요. 아직 비상 아니에요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '늦었네요, {me} 님. 형만 씨 기다리는 중이에요. 열두 시 넘으면 문 잠가요.',
      replies: [
        { say: '그래도 국은 데워 두시죠?', tier: 'great', face: 'shy', answer: '…어머, 들켰네. 데워 두죠. 꿀밤이랑 같이 줄 거지만요.' },
        { say: '진짜 잠그실 거예요?', tier: 'good', face: 'laugh', answer: '진짜예요! …현관 말고 뒷문은 열어 둘 거예요. 흰둥이 집 옆이요.' },
        { say: '저도 이제 자러 가요', tier: 'meh', answer: '네, 들어가요. 불은 꼭 끄고 자요. 전기세 아까워요.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '해 좋다! 이불 빨래 날이에요. 짱구 이불은 특히 햇볕이 필요하거든요.',
      replies: [
        { say: '이불 너는 거 도와줄게요', tier: 'great', face: 'laugh', answer: '어머, 고마워요! 탁탁 털 때 짱구가 숨어 있나 꼭 봐요. 진짜로.' },
        { say: '왜 특히요?', tier: 'good', face: 'shy', answer: '…그건 묻지 마요. 지도 그리는 나이라고만 해 둘게요.' },
        { say: '건조기 쓰세요', tier: 'meh', face: 'sorry', answer: '건조기는 전기세예요. 햇볕은 공짜고요. 계산 끝.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '하늘이 애매하네요. 빨래를 널까 말까. {me} 님 생각엔 비 올 것 같아요?',
      replies: [
        { say: '반만 널어 보세요', tier: 'great', face: 'wow', answer: '어머, 알뜰한 판단! 반은 말리고 반은 지키고. 그거예요.' },
        { say: '잔나 씨 예보 봤어요?', tier: 'good', face: 'think', answer: '봤죠. 근데 그 예보는 반대로 읽으면 맞는다는 소문이 있어요.' },
        { say: '그냥 널어요', tier: 'meh', face: 'calm', answer: '그러다 비 오면 {me} 님이 걷으러 와요. 약속이에요.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이에요! 이사철이라 부동산이 바쁘고, 봄옷 세일도 시작이에요.',
      replies: [
        { say: '세일 같이 가요', tier: 'great', face: 'laugh', answer: '좋아요! 그 전에 이 킬로만 빼고요. …봄이 끝나겠네요.' },
        { say: '바쁘면 도와드릴까요?', tier: 'good', face: 'smile', answer: '마음만으로도 고마워요. 짱아만 좀 봐 주면 더 고맙고요.' },
        { say: '봄은 졸려요', tier: 'meh', face: 'think', answer: '저도요. 그래서 봄엔 눈 감고 생각하는 시간이 길어요.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '덥죠? 짱구가 마당에서 물놀이하자고 난리예요. 물값은 누가 내는데요.',
      replies: [
        { say: '바다 가면 공짜예요', tier: 'great', face: 'wow', answer: '어머, 맞네! 도시락 싸서 바닷가 가요. 흰둥이도 데려가고요.' },
        { say: '수박 한 통 사요', tier: 'good', face: 'laugh', answer: '한 통이 반 통보다 싸요. 짱구가 씨를 마당에 다 뱉겠지만요.' },
        { say: '에어컨 트세요', tier: 'meh', face: 'sorry', answer: '에어컨은 손님 올 때만이에요. 우리 집 철칙이에요.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이에요. 유치원 운동회도 있고, 김장 준비도 해야 하고. 바빠요!',
      replies: [
        { say: '운동회 응원 갈게요', tier: 'great', face: 'wow', answer: ['어머, 정말요? 엄마 달리기도 있어요.', '작년엔 제가 일 등 했어요. 형만 씨는 넘어졌고요.'] },
        { say: '김장 날 알려 주세요', tier: 'good', face: 'smile', answer: '배추 값 제일 쌀 때 날 잡을게요. 고무장갑은 제가 준비해요.' },
        { say: '천천히 하세요', tier: 'meh', face: 'calm', answer: '천천히 하면 세일 끝나요. 엄마는 천천히가 없어요.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '추워요. 짱구는 눈사람 만든다고 제 장갑까지 끼고 나갔어요.',
      replies: [
        { say: '붕어빵 하나 드릴게요', tier: 'great', face: 'shy', answer: '어머, 따뜻해라! 반은 짱아 줄게요. …아니, 한 입만 줄게요.' },
        { say: '눈사람 같이 만들어요', tier: 'good', face: 'laugh', answer: '좋아요! 짱구가 만든 건 늘 형만 씨 닮게 나와요. 배가 나와서요.' },
        { say: '장갑 새로 사세요', tier: 'meh', face: 'think', answer: '연말 세일까지 버틸 거예요. 그때 사면 반값이에요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 공짜 시식 코너 어디 있는지 알아요? 경품 응모권도 모았어요.',
      replies: [
        { say: '시식 코너 같이 돌아요', tier: 'great', face: 'laugh', answer: '좋아요! 한 바퀴 돌면 점심값이 굳어요. 다이어트는 내일부터예요.' },
        { say: '응모권 몇 장이에요?', tier: 'good', face: 'wow', answer: '다섯 장이요! 형만 씨 거, 짱구 거까지 몰래 썼어요. 쉿.' },
        { say: '축제는 사람 많아요', tier: 'meh', face: 'calm', answer: '사람 많은 데 공짜도 많아요. 짱구 손만 꼭 잡으면 돼요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish} 낚았어요? 어머, 시장 가격이 얼만데! 공짜로 생긴 거잖아요.',
      replies: [
        { say: '한 마리 드릴게요', tier: 'great', face: 'wow', answer: '어머어머, 정말요? 오늘 저녁 반찬 걱정 끝! 형만 씨 안주도 해결이에요.' },
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
        { say: '운이 좋았어요', tier: 'good', answer: '운도 실력이에요. 짱구가 보면 자기도 낚시 간다고 떼쓰겠어요.' },
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
        { say: '피망도 있어요', tier: 'good', face: 'laugh', answer: '피망이요? 어머, 짱구 작전용이네요. 다져서 몰래 넣을 거예요.' },
        { say: '그냥 다 팔았어요', tier: 'meh', face: 'think', answer: '어머, 얼마에요? …다음엔 저한테 먼저 물어봐요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 얼굴이 왜 그래요. 밥은 먹었어요? 안 먹었죠. 다 보여요.',
      replies: [
        { say: '사실 좀 지쳤어요', tier: 'great', face: 'smile', answer: ['그럼 오늘은 우리 집 가요. 반찬 남았어요.', '잔소리는 밥 먹고 나서 할게요. 조금만요.'] },
        { say: '괜찮아요', tier: 'good', face: 'think', answer: '괜찮은 얼굴이 아닌데요. 짱구 거짓말할 때랑 똑같아요. 반찬 싸 갈래요?' },
        { say: '그냥 혼자 있을래요', tier: 'meh', face: 'calm', answer: '알았어요. 대신 저녁은 꼭 먹어요. 안 먹으면 꿀밤이에요.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '어머, {me} 님 오늘 얼굴 좋다! 무슨 좋은 일 있어요? 세일이에요?',
      replies: [
        { say: '미선 씨 수다가 좋아서요', tier: 'great', face: 'laugh', answer: '어머어머, 말도 잘하셔라. 오늘 상담은 특별 우대예요.' },
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
        { say: '같이 나눠 먹어요', tier: 'good', face: 'laugh', answer: '좋아요! 짱구가 촛불 끄겠다고 할 거예요. 그것만 막아 줘요.' },
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
      id: 'op-news-bday',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 사람 있대요. 선물은 실용적인 게 최고예요.',
      replies: [
        { say: '쿠폰 선물은 어때요?', tier: 'great', face: 'wow', answer: '어머, 제 마음을 읽었네요! 유효기간 긴 걸로 골라 줘야 해요.' },
        { say: '케이크가 좋지 않아요?', tier: 'good', face: 'smile', answer: '케이크도 좋죠. 대신 마감 할인 시간에 사요.' },
        { say: '선물은 귀찮아요', tier: 'meh', face: 'sorry', answer: '어머, 챙기는 게 이웃이에요. 귀찮음도 정이에요.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기가 잡혔대요! 짱구가 그거 보러 가자고 아침부터 졸라요.',
      replies: [
        { say: '같이 구경 가요', tier: 'great', face: 'laugh', answer: '좋아요! 구경은 공짜니까요. 짱구 손은 {me} 님이 잡아 줘요.' },
        { say: '얼마나 할까요?', tier: 'good', face: 'think', answer: '값을 못 매기죠. 그래도 매겨 보고 싶은 게 제 병이에요.' },
        { say: '물고기는 물고기죠', tier: 'meh', face: 'calm', answer: '어머, 형만 씨랑 똑같은 말을 하네. 둘 다 낭만이 없어요.' },
      ],
    },
    {
      id: 'op-friend-breakup',
      when: { friendNews: 'breakup' },
      open: '{me} 님 친구가 헤어졌다는 소식 들었어요. 괜찮대요? 밥은 먹는대요?',
      replies: [
        { say: '반찬 좀 싸 주세요', tier: 'great', face: 'smile', answer: ['그럼요. 지금 바로 싸 줄게요. 따뜻한 국도요.', '마음 아플 땐 일단 먹는 거예요. 그다음에 울어도 돼요.'] },
        { say: '시간이 약이겠죠', tier: 'good', face: 'think', answer: '맞아요. 시간이랑 밥이요. 둘 다 공짜는 아니지만 아끼면 안 돼요.' },
        { say: '잘 모르겠어요', tier: 'meh', face: 'sorry', answer: '그럼 한번 들여다봐 줘요. 친구는 그러라고 있는 거예요.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '{me} 님, 카지노에서 잃었다면서요. 형만 씨처럼 되면 안 돼요, 진짜.',
      replies: [
        { say: '가계부 같이 봐 주세요', tier: 'great', face: 'smile', answer: '좋아요! 반찬값부터 줄이는 거 아니에요. 군것질부터 줄여요.' },
        { say: '다음엔 딸 거예요', tier: 'good', face: 'sorry', answer: '어머, 그 말이 제일 무서운 말이에요. 우리 남편도 그랬어요.' },
        { say: '재밌었으면 됐죠', tier: 'meh', face: 'calm', answer: '재미값치곤 비싸요. 그 돈이면 짱구 크레파스가 백 통이에요.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '주식으로 벌었다면서요? 어머, 절반은 바로 저금해요. 바로요!',
      replies: [
        { say: '절반 저금할게요', tier: 'great', face: 'laugh', answer: '잘했어요! 그게 부자 되는 길이에요. 나머지 반으로 맛있는 거 사요.' },
        { say: '다 다시 넣을래요', tier: 'good', face: 'think', answer: '욕심은 금물이에요. 그래도 {me} 님 돈이니까 말리진 않을게요.' },
        { say: '형만 씨한테 빌려줄까요', tier: 'meh', face: 'sorry', answer: '절대 안 돼요! 그 돈은 비상금으로 숨어 버려요.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다 다녀왔다면서요? 고생했어요. 뱃삯은 뽑았어요?',
      replies: [
        { say: '넉넉히 뽑았어요', tier: 'great', face: 'wow', answer: '어머, 잘했다! 짱구한테 바다 얘기 좀 해 줘요. 선장 되겠다고 난리예요.' },
        { say: '겨우 본전이에요', tier: 'good', face: 'smile', answer: '본전이면 경치는 공짜로 본 거예요. 남는 장사죠.' },
        { say: '멀미만 했어요', tier: 'meh', face: 'sorry', answer: '어머, 생강차 끓여 줄게요. 생강은 세일할 때 사 뒀어요.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관에 기증했다면서요? 어머, 통 크다. 짱구 데리고 구경 갈게요.',
      replies: [
        { say: '제 이름 찾아보세요', tier: 'great', face: 'laugh', answer: '그럴게요! 짱구한테 이 사람 우리 집 식구라고 자랑할 거예요.' },
        { say: '입장료 공짜예요', tier: 'good', face: 'wow', answer: '그게 제일 좋아요! 공짜 나들이 장소로 일 등이에요.' },
        { say: '그냥 짐 정리였어요', tier: 'meh', face: 'think', answer: '짐 정리가 기증이 되다니. 우리 집 창고도 보내고 싶네요.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '{other} 씨랑 좀 틀어졌어요. 별일은 아닌데 오늘은 말 안 하려고요.',
      replies: [
        { say: '반찬으로 화해하세요', tier: 'great', face: 'think', answer: ['…그게 우리 집 방식이긴 해요.', '좋아하는 반찬 하나 해 놓고, 먼저 말 걸 때까지 기다릴래요.'] },
        { say: '무슨 일이에요?', tier: 'good', face: 'sorry', answer: '사소한 거예요. 너무 사소해서 말하기도 창피해요. 그래서 더 서운해요.' },
        { say: '미선 씨가 참으세요', tier: 'meh', face: 'calm', answer: '참는 건 잘해요. 엄마 경력이 몇 년인데요. 근데 오늘은 싫어요.' },
      ],
    },
    {
      id: 'op-realtor',
      when: { bond: 'realtor' },
      open: '우리 남편 만났죠? 또 용돈 얘기 했어요? 표정 보니 했네.',
      replies: [
        { say: '미선 씨 칭찬만 하던데요', tier: 'great', face: 'shy', answer: '…어머, 정말요? 그 사람이? 오늘 맥주 한 캔 허락해 줘야겠네.' },
        { say: '피곤해 보이던데요', tier: 'good', face: 'think', answer: '그쵸. 오늘 저녁은 고기예요. 짱구한텐 아빠 어깨 주물러 주라고 할래요.' },
        { say: '용돈 올려 달래요', tier: 'meh', face: 'calm', answer: '그 협상은 끝났다고 전해 주세요. 기각이에요.' },
      ],
    },
    {
      id: 'op-with-realtor',
      when: { with: 'realtor' },
      open: '{me} 님, 마침 잘 왔어요. 이 사람 또 발 냄새 얘기에 펄쩍 뛰어요.',
      replies: [
        { say: '두 분 사이좋네요', tier: 'great', face: 'shy', answer: ['어머, 사이좋긴요. 그냥 오래 살아서 그래요.', '…{other} 씨, 웃지 마요. 꿀밤이에요.'] },
        { say: '저는 모르는 일이에요', tier: 'good', face: 'laugh', answer: '현명하네요. 우리 집에서 발 얘기는 짱구도 피해 가요.' },
        { say: '진짜 냄새나요?', tier: 'meh', face: 'sorry', answer: '…말 안 할게요. {other} 씨 체면이 있으니까요. 흰둥이가 기절한 건 비밀.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '발키리 씨 만났어요? 공사비 좀 깎아 달랬더니 또 흥정은 안 된대요.',
      replies: [
        { say: '대신 솜씨는 최고잖아요', tier: 'great', face: 'smile', answer: '그건 맞아요. 짱구가 뛰어도 안 부서지는 침대예요. 흥, 그래도요.' },
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
    {
      id: 'op-with-nasera',
      when: { with: 'nasera' },
      open: '{me} 님, 증인 좀 서 줘요. {other} 씨가 고구마 값을 안 깎아 줘요.',
      replies: [
        { say: '제가 보기엔 비싸요', tier: 'great', face: 'laugh', answer: '들었죠, {other} 씨? 손님이 비싸대요. 자, 한 푼만 더!' },
        { say: '두 분 다 맞아요', tier: 'good', face: 'think', answer: '어머, 외교관이시네. 그럼 덤으로 하나만 얹어요. 공평하게.' },
        { say: '정가에 사세요', tier: 'meh', face: 'sorry', answer: '어머, 증인이 적군이었어요. 오늘은 후퇴예요.' },
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
        { say: '같이 한 바퀴 걸어요', tier: 'good', face: 'smile', answer: '좋아요. 짱아 유모차 밀고 시장까지 가요. 가는 김에 세일도 보고요.' },
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
      open: '그 찬장 맨 위 칸이요. 짱구가 의자 두 개 쌓고 거의 찾을 뻔했어요.',
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
        { say: '양념 맛보는 담당이요', tier: 'good', face: 'laugh', answer: '아하하, 그 자리는 짱구가 찜했어요. 대신 수육 첫 점 줄게요.' },
      ],
    },
    {
      id: 'cb-coupon',
      when: { mem: 'coupon-share' },
      use: 'coupon-share',
      open: '저번에 나눠 준 쿠폰이요. 유효기간 지나기 전에 다 썼어요? 확인할 거예요.',
      replies: [
        { say: '하나도 안 남기고 썼어요', tier: 'great', face: 'wow', answer: '어머, 우등생! 새 쿠폰 나오면 제일 먼저 드릴게요.' },
        { say: '하나 남았어요', tier: 'good', face: 'think', answer: '내일까지면 같이 가요. 쿠폰은 쓰라고 있는 거예요.' },
        { say: '어디 뒀는지 몰라요', tier: 'meh', face: 'sorry', answer: '어머어머… 그거 돈이었어요. 다음엔 지갑에 꽂아 드릴게요.' },
      ],
    },
    {
      id: 'cb-sale-eye',
      when: { mem: 'sale-eye' },
      use: 'sale-eye',
      open: '그 한정 특가 기억나요? 결국 샀는데요, 아직 포장도 안 뜯었어요.',
      replies: [
        { say: '선물로 쓰면 되죠', tier: 'great', face: 'laugh', answer: '어머, 그거예요! 다음 생일 선물은 이걸로 해결이에요.' },
        { say: '같이 반품하러 가요', tier: 'good', face: 'think', answer: '…그래야겠죠. 근데 반품하러 가서 또 살까 봐 무서워요.' },
        { say: '그럴 줄 알았어요', tier: 'meh', face: 'sorry', answer: '알았으면 말려 주지! 아니, 같이 설렜잖아요. 공범이에요.' },
      ],
    },
    {
      id: 'cb-pepper',
      when: { mem: 'pepper-plan' },
      use: 'pepper-plan',
      open: '피망 작전이요! 다져서 볶음밥에 넣었더니 짱구가 다 먹었어요!',
      replies: [
        { say: '작전 성공이네요', tier: 'great', face: 'laugh', answer: ['그쵸! 근데 다 먹고 나서 피망 맛 났대요.', '그래도 먹었어요. {me} 님 덕분이에요.'] },
        { say: '형만 씨는요?', tier: 'good', face: 'laugh', answer: '그 사람은 골라냈어요. 아들보다 못해요. 꿀밤 하나.' },
        { say: '들키진 않았어요?', tier: 'meh', face: 'think', answer: '들킬 뻔했죠. 흰둥이가 떨어진 피망 조각을 물고 다녀서요.' },
      ],
    },
    {
      id: 'cb-chocobi',
      when: { mem: 'chocobi' },
      use: 'chocobi',
      open: '하나만 약속, 지켰어요! 짱구가 초코비 한 통만 들고 왔어요. 기적이에요.',
      replies: [
        { say: '짱구 칭찬해 주세요', tier: 'great', face: 'smile', answer: ['칭찬했어요. 그랬더니 상으로 하나 더 사 달래요.', '…결국 두 개 샀어요. 엄마는 약해요.'] },
        { say: '미선 씨가 이겼네요', tier: 'good', face: 'laugh', answer: '이번엔요. 다음 장날엔 또 굴러다닐 거예요. 각오하고 있어요.' },
        { say: '한 통도 많아요', tier: 'meh', face: 'calm', answer: '어머, 그 녀석한테 한 통은 다이어트예요. 저처럼요.' },
      ],
    },
    {
      id: 'cb-shiny',
      when: { mem: 'shiny-baby' },
      use: 'shiny-baby',
      open: '짱아가 엄마 닮았다고 했잖아요. 어제 보석 가게 앞에서 둘이 같이 멈췄어요.',
      replies: [
        { say: '둘 다 눈이 높네요', tier: 'great', face: 'laugh', answer: '그쵸! 형만 씨는 뒤에서 지갑 꼭 쥐고 있었어요. 불쌍하게.' },
        { say: '뭐 사셨어요?', tier: 'good', face: 'shy', answer: '…구경만 했어요. 짱아한텐 반짝이 스티커 하나. 그게 제일 좋대요.' },
        { say: '형만 씨 떨었겠네요', tier: 'meh', face: 'think', answer: '떨었죠. 그 얼굴 보는 재미에 가는 것도 있어요.' },
      ],
    },
    {
      id: 'cb-dog-meal',
      when: { mem: 'dog-meal' },
      use: 'dog-meal',
      open: '흰둥이 밥 챙겨 줬죠? 흰둥이가 {me} 님 발소리만 들려도 꼬리 쳐요.',
      replies: [
        { say: '솜사탕 재주도 봤어요', tier: 'great', face: 'wow', answer: '어머, 그것까지 보여 줬어요? 그건 식구한테만 하는 재주예요.' },
        { say: '짱구한테도 알려 줘요', tier: 'good', face: 'laugh', answer: '알렸죠. 그랬더니 이제 {me} 님 담당이래요. 아휴.' },
        { say: '사료가 다 떨어졌어요', tier: 'meh', face: 'sorry', answer: '어머, 그럼 세일 기다리지 말고 오늘 사요. 흰둥이 일은 미루면 안 돼요.' },
      ],
    },
    {
      id: 'cb-stash',
      when: { mem: 'stash-hunt' },
      use: 'stash-hunt',
      open: '찾았어요! 형만 씨 비상금이요. 넥타이 상자가 아니라 액션가면 비디오 속!',
      replies: [
        { say: '짱구 공범이었네요', tier: 'great', face: 'laugh', answer: ['그쵸! 부자가 한편이었어요.', '반은 압수, 반은 모른 척. 그게 우리 집 판결이에요.'] },
        { say: '다 압수하셨어요?', tier: 'good', face: 'think', answer: '…반만요. 남자도 숨 쉴 구멍은 있어야죠. 안주값 정도는요.' },
        { say: '돌려주세요', tier: 'meh', face: 'sorry', answer: '돌려주긴요. 그 돈은 짱아 분유가 됐어요. 명예로운 전사예요.' },
      ],
    },
    {
      id: 'cb-gossip',
      when: { mem: 'gossip-pal' },
      use: 'gossip-pal',
      open: '저번 수다 모임에서 {me} 님 칭찬 많이 나왔어요. 언니들이 또 데려오래요.',
      replies: [
        { say: '이번엔 간식 들고 갈게요', tier: 'great', face: 'laugh', answer: '어머, 그럼 수다가 두 시간이 돼요! 세일 간식으로 부탁해요.' },
        { say: '무슨 칭찬이요?', tier: 'good', face: 'shy', answer: '싹싹하대요. 그리고 형만 씨보다 말을 잘 들어 준대요.' },
        { say: '좀 정신없었어요', tier: 'meh', face: 'sorry', answer: '아하하, 처음엔 다 그래요. 그냥 고개만 끄덕이면 돼요.' },
      ],
    },
    {
      id: 'cb-mom-rest',
      when: { mem: 'mom-rest' },
      use: 'mom-rest',
      open: '엄마도 쉬어야 한다고 했잖아요. 어제 형만 씨가 애들 데리고 나가 줬어요.',
      replies: [
        { say: '뭐 하고 쉬셨어요?', tier: 'great', face: 'shy', answer: ['…목욕하고, 과자 먹고, 드라마 보고, 잤어요.', '세 시간인데 사흘 쉰 것 같았어요. 고마워요.'] },
        { say: '형만 씨 멋지네요', tier: 'good', face: 'smile', answer: '그쵸. 오늘은 용돈 기각 안 할게요. 오늘만요.' },
        { say: '애들 걱정됐죠?', tier: 'meh', face: 'think', answer: '…사실 한 시간마다 전화했어요. 엄마는 쉬어도 엄마예요.' },
      ],
    },
    {
      id: 'cb-hero',
      when: { mem: 'hero-show' },
      use: 'hero-show',
      open: '액션가면 시간 지켜 줬잖아요. 덕분에 어제 찬장 과자 하나 다 먹었어요.',
      replies: [
        { say: '휴가 잘 보내셨네요', tier: 'great', face: 'laugh', answer: '삼십 분짜리 휴가요. 엄마한텐 그게 해외여행이에요.' },
        { say: '다이어트는요?', tier: 'good', face: 'sorry', answer: '…그건 액션가면 끝나고부터예요. 내일부터요.' },
        { say: '짱구한테 들켰어요?', tier: 'meh', face: 'think', answer: '광고 시간에 뒤돌아봐서 큰일 날 뻔했어요. 이제 광고도 조심해요.' },
      ],
    },
    {
      id: 'cb-anniv',
      when: { mem: 'anniv-plan' },
      use: 'anniv-plan',
      open: '결혼기념일이요! 형만 씨가 기억했어요. 자기가 기억한 줄 알아요.',
      replies: [
        { say: '귀띔한 건 비밀이에요', tier: 'great', face: 'shy', answer: ['고마워요, {me} 님. 꽃 한 송이랑 케이크요.', '케이크는 정가였대요. 그래서 혼 안 냈어요.'] },
        { say: '뭐 받으셨어요?', tier: 'good', face: 'smile', answer: '꽃 한 송이요. 그리고 짱구가 그린 엄마 얼굴. 주름은 빼 달랬어요.' },
        { say: '당연한 거죠', tier: 'meh', face: 'calm', answer: '당연한 게 제일 어려워요. 그 사람한텐 특히요.' },
      ],
    },
    {
      id: 'cb-market-dawn',
      when: { mem: 'market-dawn' },
      use: 'market-dawn',
      open: '아침 시장 상인들이 {me} 님 안부 물어요. 그 짐꾼 언제 또 오냐고요.',
      replies: [
        { say: '이번 장날에 갈게요', tier: 'great', face: 'laugh', answer: '좋아요! 오늘은 짱아도 업고 가요. 덤이 하나 더 나와요. 아기 몫이요.' },
        { say: '짐꾼이라뇨', tier: 'good', face: 'shy', answer: '아하하, 최고의 짐꾼이라는 뜻이에요. 칭찬이에요.' },
        { say: '아침은 힘들어요', tier: 'meh', face: 'smile', answer: '그럼 마감 할인 시간에 봐요. 저녁 시장도 나름 재밌어요.' },
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
      open: '그때 같이 나갔던 날이요. 오랜만에 애들 없이 걸었네요. 손이 허전하더라고요.',
      replies: [
        { say: '또 같이 장 보러 가요', tier: 'great', remember: 'outing-talk', face: 'laugh', answer: '좋아요! {me} 님이랑 가면 두 사람 몫 세일을 받아요. 최고예요.' },
        { say: '형만 씨가 애들 봤어요?', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '봤죠. 집에 오니 셋이 엉덩이 춤 연습 중이었어요. 흰둥이까지.' },
        { say: '좀 피곤했어요', tier: 'meh', remember: 'outing-talk', face: 'sorry', answer: '어머, 제가 너무 끌고 다녔죠. 다음엔 쉬엄쉬엄 갈게요.' },
      ],
    },
    {
      id: 'cb-bday-soon',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: '{me} 님 생일 곧이죠? 다 알아요. 잔치는 알뜰하게, 마음은 넉넉하게 할 거예요.',
      replies: [
        { say: '미선 씨 반찬이면 충분해요', tier: 'great', remember: 'bday-heard', face: 'shy', answer: '어머, 그럼 반찬을 세 가지… 아니, 다섯 가지 할게요.' },
        { say: '케이크도 있어요?', tier: 'good', remember: 'bday-heard', face: 'laugh', answer: '당연하죠. 짱구가 노래 불러 준대요. 엉덩이 춤은 막을게요.' },
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
        '범마을 부동산. 카운터 뒤에서 아기 칭얼대는 소리가 난다.',
        '봉미선이 등에 업은 아기를 토닥이며 활짝 웃는다.',
        '"어서 오세요! 범마을 부동산 실장 봉미선이에요."',
        '"아, 이 아이요? 우리 딸 짱아예요. 오늘은 같이 출근했어요."',
        '짱아가 내 옷의 반짝이는 단추를 보고 손을 뻗는다.',
        '"어머, 짱아! 남의 단추는 안 돼요. 누굴 닮아서 이럴까."',
        '"{me} 님이요? 이름 예쁘다. 장부에 적어 둘게요."',
        '"상담은 공짜예요. 공사비는 제가 한 푼이라도 깎아 드리고요."',
        '그때 전화가 울린다. 그녀가 수화기를 들고 표정이 굳는다.',
        '"…네, 선생님. 짱구가 또요? 네, 데리러 갈게요. 죄송해요."',
        '수화기를 내려놓은 그녀가 한숨을 쉬다가 다시 웃는다.',
        '"아들이 하나 더 있어요. 유치원에서 엉덩이 춤을 췄대요."',
        '"우리 남편은 월수금, 저는 화목이에요. 저한테 오는 게 이득이에요."',
      ],
      replies: [
        { say: '그럼 화목에 올게요', tier: 'great', face: 'laugh', answer: '어머, 눈치 빠르셔라! 우리 단골 하나 생겼네. 짱아도 좋대요.' },
        { say: '바쁘신데 얼른 가 보세요', tier: 'good', face: 'smile', answer: ['어머, 고마워요. 이해해 주는 손님은 처음이에요.', '다음에 오면 상담에 반찬까지 얹어 줄게요.'] },
        { say: '그냥 구경 왔어요', tier: 'meh', face: 'calm', answer: '구경도 환영이에요. 구경하다 계약하는 손님이 제일 많거든요.' },
      ],
    },
    {
      title: '아침 장보기',
      hint: '아침(게임 시각 여섯 시부터 열 시) 시장 거리에 가 보세요. 미선 씨가 장을 봐요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 6, to: 10 } },
      scene: [
        '아침 시장. 봉미선이 짱아를 업고 장바구니를 두 개 들었다.',
        '발치에서 하얀 강아지가 꼬리를 흔들며 따라다닌다.',
        '"어머, {me} 님! 진짜 왔네. 이쪽은 우리 흰둥이예요."',
        '"짱구가 밥을 또 잊어서요. 오늘은 저랑 아침 산책이에요."',
        '그녀가 배추를 들었다 놓고, 돌아서는 척하다 웃으며 돌아본다.',
        '"…그럼 이 무 하나 덤으로 주시는 거죠? 어머, 고마워라!"',
        '과자 가게 앞에서 그녀의 걸음이 잠깐 멈춘다. 초코비 상자다.',
        '"…한 통만요. 어제 피망을 반은 먹었거든요. 상이에요."',
        '"짱구한텐 비밀이에요. 엄마가 약한 거 알면 큰일 나요."',
        '바구니가 금세 찬다. 그녀가 그중 사과 하나를 내게 쥐여 준다.',
        '"이건 {me} 님 거예요. 같이 와 준 수고비예요."',
        '"공짜로 받은 거라 더 맛있어요. 흰둥이, 가자!"',
      ],
      replies: [
        { say: '흥정 진짜 대단해요', tier: 'great', remember: 'market-dawn', face: 'laugh', answer: '어머, 이 정도는 몸풀기예요. 다음엔 {me} 님이 해 봐요.' },
        { say: '바구니 들어 드릴게요', tier: 'good', remember: 'market-dawn', face: 'wow', answer: '어머, 고마워요! 형만 씨는 이런 거 투덜대면서 들어요.' },
        { say: '너무 일찍 일어났어요', tier: 'meh', remember: 'market-dawn', face: 'smile', answer: '아하하, 그래도 왔잖아요. 아침 시장은 일찍 일어난 사람 거예요.' },
      ],
    },
    {
      title: '맨 위 칸의 비밀',
      hint: '미선 씨는 호박파이를 몰래 좋아해요. 호박파이 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'pumpkinpie', take: true } },
      scene: [
        '호박파이를 내밀자 봉미선이 주위를 휙 둘러본다.',
        '"…쉿! 이리 와요. 짱구 유치원 버스 오기 전에요."',
        '그녀가 의자를 밟고 찬장 맨 위 칸을 연다. 과자 봉지가 빼곡하다.',
        '"이 칸은요, 애들 다 재우고 나서 여는 칸이에요."',
        '"하루 종일 엄마, 엄마, 여보, 여보. 그다음에 딱 십 분."',
        '"이 과자 한 봉지 먹는 십 분이 제 월급이에요."',
        '그녀가 파이를 반으로 잘라 큰 쪽을 내게 민다.',
        '"다이어트는 내일부터예요. 오늘은 {me} 님 성의를 받아야죠."',
        '그때 창밖에서 유치원 버스 경적이 울린다.',
        '"어머, 벌써! 빨리 먹어요, 빨리! 짱구 코는 강아지급이에요."',
        '둘이 허겁지겁 파이를 삼키고 입을 닦는다. 그녀가 킥킥 웃는다.',
        '"이 칸 아는 사람, 이제 둘이에요. 그만큼 믿는다는 거예요."',
      ],
      replies: [
        { say: '무덤까지 비밀로 할게요', tier: 'great', remember: 'pie-secret', face: 'laugh', answer: '어머, 든든해라! 이제 우리 진짜 동지예요. 다음 십 분도 나눠요.' },
        { say: '큰 쪽은 미선 씨 드세요', tier: 'good', remember: 'pie-secret', face: 'shy', answer: '…어머, 그럼 사양 안 할게요. 다이어트는 모레부터 하죠.' },
        { say: '과자가 너무 많은데요', tier: 'meh', remember: 'pie-secret', face: 'sorry', answer: '…다 세일할 때 산 거예요. 비상식량이에요. 그렇다고 해 줘요.' },
      ],
    },
    {
      title: '가계부의 빈칸',
      hint: '미선 씨가 돈 쓰는 습관을 물어볼 때, 알뜰한 게 좋다고 대답해 보세요.',
      need: { days: 9, points: 60, mem: 'thrift-pal' },
      scene: [
        '늦은 밤 부동산. 봉미선이 손때 묻은 가계부를 펼친다.',
        '줄마다 숫자가 빼곡하고, 귀퉁이엔 짱구의 크레파스 낙서가 있다.',
        '"알뜰한 게 좋다고 했죠. 그래서 보여 주는 거예요."',
        '"계란 한 판, 콩나물, 형만 씨 용돈. 백 원 단위까지 적어요."',
        '"이 줄 보세요. 제 립스틱이요. 석 달째 지웠다 썼다 해요."',
        '그녀가 맨 끝 장을 넘긴다. 금액 없이 이름만 적힌 칸들이 있다.',
        '"여긴 아깝지 않은 돈 칸이에요. 형만 씨 약값."',
        '"짱구 크레파스, 짱아 분유, 흰둥이 사료. 여긴 안 깎아요."',
        '"제 립스틱은 깎아도 여긴 한 번도 깎은 적 없어요."',
        '그녀가 연필로 새 칸을 하나 그린다.',
        '"그리고 이건… {me} 님 칸이에요."',
        '"금액은 안 적어요. 셀 필요가 없거든요."',
      ],
      replies: [
        { say: '저도 미선 씨 칸 만들게요', tier: 'great', face: 'shy', answer: ['어머… 그럼 서로 빈칸이네요.', '그거 참 알뜰한 거래예요. 손해 보는 사람이 없잖아요.'] },
        { say: '립스틱도 사세요', tier: 'good', face: 'wow', answer: ['…어머, 그 말에 눈물이 핑 도네요.', '다음 세일 때 살게요. 진짜로요. {me} 님이 증인이에요.'] },
        { say: '형만 씨 칸은 작네요', tier: 'meh', face: 'laugh', answer: '아하하, 거긴 따로 한 권 있어요. 용돈 기각 기록이요.' },
      ],
    },
    {
      title: '슬리퍼 한 짝',
      hint: '미선 씨와 아주 가까워지면 그녀가 저녁 밥상에 불러요.',
      need: { days: 13, points: 96 },
      scene: [
        '해 질 무렵, 봉미선이 슬리퍼 한 짝만 신고 광장으로 뛰어온다.',
        '"{me} 님! 짱구 못 봤어요? 유치원 버스에서 안 내렸대요!"',
        '짱아를 업은 채 숨이 턱에 닿았다. 머리가 다 헝클어졌다.',
        '시장, 빵집, 주점 앞까지 그녀와 함께 마을을 뛰어다닌다.',
        '"짱구야! 신짱구! 대답 안 하면 꿀밤 열 대야!"',
        '선착장 끝에서 흰둥이가 짖는다. 짱구가 배를 구경하고 있다.',
        '그녀가 달려가 짱구를 와락 끌어안는다. 꿀밤은 없다.',
        '"…다음에 또 그러면, 엄마 진짜 운다. 알았어?"',
        '돌아오는 길, 그녀가 잃어버린 슬리퍼 쪽 발을 내려다본다.',
        '"어머, 이거 세일 때 산 건데. …아무렴 어때요."',
        '그날 저녁 신형만네 밥상. 숟가락이 다섯 개 놓여 있다.',
        '"앉아요. 오늘 고기는 세일 고기 아니에요. 정가예요."',
        '"잔소리할 사람이 하나 늘었어요. 그건 식구라는 뜻이에요."',
      ],
      replies: [
        { say: '잔소리 많이 해 주세요', tier: 'great', remember: 'slipper-run', face: 'laugh', answer: ['어머, 각오해요! 우리 집 식구 된 거 무르기 없어요.', '짱구야, {me} 님한테 고맙다고 해. 엉덩이 말고 입으로!'] },
        { say: '꿀밤 안 주셨네요', tier: 'good', remember: 'slipper-run', face: 'shy', answer: '…오늘은 못 주겠더라고요. 내일 두 배로 줄 거예요. 아마도요.' },
        { say: '그냥 이웃인데요', tier: 'meh', remember: 'slipper-run', face: 'smile', answer: '같이 뛰어 준 이웃이 식구예요. 이 집 규칙이에요.' },
      ],
    },
    {
      title: '형만 씨의 자리',
      hint: '미선 씨와 열엿새 넘게 이야기하고 8하트가 되면, 형만 씨 이야기를 꺼내요.',
      need: { days: 16, points: 96 },
      scene: [
        '아침 부동산. 봉미선이 형만 씨 넥타이를 고쳐 매 준다.',
        '"똑바로 서요, 여보. 또 비뚤어졌잖아요."',
        '"짱구 열 나던 밤 기억나요? 당신이 업고 병원까지 뛰었잖아요."',
        '"신발도 짝짝이로 신고요. 그때 처음으로 멋있었어요."',
        '신형만이 머리를 긁적이고, 그녀가 넥타이를 꽉 당긴다.',
        '"용돈은 안 올려요. 대신 오늘 저녁은 당신 좋아하는 거예요."',
        '그녀가 나를 돌아보며 웃는다.',
        '"이 자리는 형만 씨 거예요. {me} 님 자리는 우리 밥상이고요."',
        '"둘 다 제 마음에서 제일 비싼 자리예요. 아깝지 않아서요."',
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
    '짱구 유치원 버스 올 시간이에요. 오늘은 신발 똑바로 신었으려나.',
    '흰둥이 밥 줬나 모르겠네. 짱구야! …아, 여기 부동산이지.',
    '짱아가 {me} 님 단추를 또 노려요. 얼른 가요, 얼른!',
    '형만 씨 오면 오늘 용돈 얘기는 꺼내지 말라고 해 줘요.',
  ],
};
