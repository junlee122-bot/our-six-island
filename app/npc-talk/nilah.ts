// 닐라 — 닐라 목장 주인. 밝고 호쾌한 반말, 큰 웃음("하하!", "하하하!"),
// "재밌겠다! 한 판 붙어 볼래?" 내기·팔씨름·달리기를 좋아하고, 물 채찍과
// 물바가지 장난으로 동물 목욕을 한 번에 끝낸다. 웃음이 곧 힘이라 남이 웃으면
// 같이 신난다. 먼 바다를 건너온 모험가라 큰 상대와 겨루는 이야기는 웃으며
// 가볍게만. 원작 대사는 옮기지 않고 말투와 소재(기쁨, 물결, 바다 괴물)만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const NILAH_TALK: NpcTalkBook = {
  npc: 'nilah',
  memories: {
    'race-yes': '달리기 내기를 하자고 했어요',
    'arm-wrestle': '팔씨름 한 판을 약속했어요',
    'laugh-power': '웃음이 힘이 된다는 말에 맞장구쳤어요',
    'sea-story': '먼 바다를 건너온 이야기를 들었어요',
    'water-whip': '물 채찍 솜씨를 보여 달라고 했어요',
    'big-egg': '제일 큰 달걀을 같이 찾았어요',
    'spicy-stew': '매운탕을 좋아한다고 했어요',
    'calf-name': '막내 송아지 이름을 같이 지었어요',
    'dance-wave': '물결 춤을 같이 배웠어요',
    'monster-tale': '바다 괴물과 겨룬 이야기를 들었어요',
    'adventure-pal': '모험 짝꿍이 되기로 했어요',
    'dawn-milk': '새벽 축사에서 첫 우유를 마셨어요',
    'stew-night': '매운탕을 같이 끓여 먹은 밤이 있어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 내기 잔치 이야기를 나눴어요',
    'date-talk': '방에서 보낸 시간을 이야기했어요',
    hometown: '동쪽 먼 바다 너머 고향 이야기를 들었어요',
    'haku-trade': '하쿠와 우유 과일 맞바꾸기를 응원했어요',
    'lux-bet': '럭스와의 낚시 내기에 편먹기로 했어요',
    'gabung-secret': '가붕 팔씨름 비법을 같이 궁리했어요',
    'demon-tale': '옛날 웃음 도둑을 이긴 얘기를 들었어요',
    'sheep-shear': '양털 깎기를 같이 했어요',
    yellowtail: '방어를 좋아한다는 걸 알게 됐어요',
    'quiet-day': '가만히 쉬는 날도 괜찮다고 말해 줬어요',
    'share-tears': '슬픈 날엔 나한테 말하라고 했어요',
    'boat-song': '배 위에서 부르던 노래를 들었어요',
    'swim-lesson': '헤엄치는 법을 배우기로 했어요',
    'ranch-dream': '마을 모두에게 우유 한 잔씩 주는 꿈을 들었어요',
    'rooster-race': '대장 닭과 아침 시합 이야기를 들었어요',
    'ice-milk': '우유 얼음과자를 같이 만들기로 했어요',
    'old-cow': '늙은 소 파도 이야기를 들었어요',
    'share-sad': '슬픔도 나누면 줄어든다는 걸 같이 알았어요',
    'dance-again': '물결 춤을 다시 함께 췄어요',
  },
  talks: [
    {
      id: 'race',
      open: '{me}! 재밌겠다! 저 사일로까지 달리기 한 판 붙어 볼래?',
      replies: [
        { say: '좋아! 봐주는 거 없기다', tier: 'great', remember: 'race-yes', answer: '하하하! 그 말 기다렸어! 지는 쪽이 우유 한 통 나르기다!' },
        { say: '천천히 걸어가면 안 돼?', tier: 'good', answer: '되지! 걸으면서 소들한테 인사하는 것도 모험이야, 하하!' },
        { say: '뛰는 건 싫어', tier: 'meh', face: 'calm', answer: '에이, 아쉽다! 그럼 응원이라도 크게 해 줘. 그것도 힘이 돼!' },
      ],
    },
    {
      id: 'arm',
      open: '팔 좀 보여 줘! 음, 좋은데? 언제 나랑 팔씨름 한 판 하자!',
      replies: [
        { say: '지금 당장 붙자!', tier: 'great', remember: 'arm-wrestle', answer: ['하하하! 좋아, 통 위에 팔 올려!', '…어? 생각보다 세다! 이건 무승부로 해 두자!'] },
        { say: '가붕보다 세?', tier: 'good', face: 'think', answer: '그건 아직 몰라! 스무 판 넘게 비겼거든. 다음엔 꼭 이긴다!' },
        { say: '팔 아플 것 같아', tier: 'meh', face: 'sorry', answer: '하하, 겁먹지 마! 살살 할게. 진짜로! 아마도!' },
      ],
    },
    {
      id: 'laugh',
      open: '{me}, 내 힘의 비결이 뭔지 알아? 근육? 아니야!',
      replies: [
        { say: '웃음이지?', tier: 'great', remember: 'laugh-power', answer: '정답! 하하하! 네가 웃으면 그것까지 다 내 힘이 돼. 그러니까 많이 웃어!' },
        { say: '진한 우유?', tier: 'good', face: 'laugh', answer: '하하! 반은 맞았어! 우유 마시면서 웃으면 두 배거든!' },
        { say: '그냥 타고난 거 아냐?', tier: 'meh', face: 'think', answer: '음, 그런 것도 있겠지! 근데 웃지 않는 날엔 우유 통도 무거워.' },
      ],
    },
    {
      id: 'sea',
      open: '나 원래 여기 사람 아니야. 먼 바다를 건너왔지! 궁금해?',
      replies: [
        { say: '궁금해! 다 들려줘', tier: 'great', remember: 'sea-story', answer: ['배 한 척에 노 하나! 파도가 산만 했어!', '근데 하나도 안 무서웠어. 신나서 계속 웃었거든, 하하!'] },
        { say: '왜 여기 정착했어?', tier: 'good', face: 'smile', answer: '초원이 바다처럼 물결치더라고! 여기서도 모험할 수 있겠다 싶었지.' },
        { say: '배 타는 건 별로야', tier: 'meh', face: 'calm', answer: '하하, 괜찮아! 땅 위에도 겨룰 거리는 잔뜩 있으니까.' },
      ],
    },
    {
      id: 'whip',
      open: '소들 목욕 어떻게 시키는지 알아? 물 한 번에 휙! 끝이야!',
      replies: [
        { say: '보여 줘! 물 채찍!', tier: 'great', remember: 'water-whip', answer: '하하하! 좋아, 뒤로 물러서! 휙! …아, 너도 좀 젖었네. 미안!' },
        { say: '소들이 안 놀라?', tier: 'good', face: 'think', answer: '처음엔 놀랐지! 지금은 줄 서서 기다려. 시원하거든!' },
        { say: '물 튀는 건 싫어', tier: 'meh', face: 'sorry', answer: '앗, 그럼 오늘 물바가지 장난은 참을게. 하루 한 번 규칙이야!' },
      ],
    },
    {
      id: 'egg',
      open: '닭장에서 엄청 큰 달걀 찾기 내기할래? 정 든 녀석들이 큰 걸 낳거든!',
      replies: [
        { say: '내가 먼저 찾는다!', tier: 'great', remember: 'big-egg', answer: '하하! 그 기세 좋다! 짚 밑을 봐. 거기가 명당이야!' },
        { say: '닭이 쪼지 않아?', tier: 'good', face: 'laugh', answer: '대장 닭은 좀 쪼아! 웃으면서 인사하면 봐줄걸, 하하!' },
        { say: '달걀은 그냥 사 먹을래', tier: 'meh', face: 'calm', answer: '하하, 그럼 장날에 와! 제일 큰 건 따로 빼 둘게.' },
      ],
    },
    {
      id: 'stew',
      open: '배고프다! {me}, 매운탕 좋아해? 나는 국물까지 다 마셔!',
      replies: [
        { say: '얼큰한 거 최고지!', tier: 'great', remember: 'spicy-stew', answer: '하하하! 통했다! 다음엔 같이 끓이자. 고기는 럭스한테 졸라 보고!' },
        { say: '맵기만 조금 줄이면', tier: 'good', answer: '좋아, 네 그릇엔 우유 한 잔 곁들여 줄게. 매운 데 딱이야!' },
        { say: '매운 건 못 먹어', tier: 'meh', face: 'sorry', answer: '에이, 아깝다! 그럼 달걀찜 해 줄게. 큰 달걀로!' },
      ],
    },
    {
      id: 'calf',
      open: '막내 송아지가 아직 이름이 없어! {me}, 하나 지어 줄래?',
      replies: [
        { say: '물결이 어때?', tier: 'great', remember: 'calf-name', answer: '물결! 하하하! 완벽해! 봐, 꼬리 흔든다. 마음에 든대!' },
        { say: '닐라 주니어!', tier: 'good', face: 'laugh', answer: '하하! 그럼 나보다 시끄러워질걸? 후보로 적어 둘게!' },
        { say: '그냥 소라고 불러', tier: 'meh', face: 'think', answer: '음… 그럼 다 소잖아! 이름은 다음에 같이 생각하자.' },
      ],
    },
    {
      id: 'dance',
      open: '물결 춤 알아? 춤인지 싸움인지 나도 몰라! 하하, 배워 볼래?',
      replies: [
        { say: '가르쳐 줘! 따라 할게', tier: 'great', remember: 'dance-wave', answer: '좋아! 무릎 살짝, 팔은 빙글! 그렇지! 너 물결 타는구나!' },
        { say: '보기만 할게', tier: 'good', face: 'smile', answer: '그것도 좋아! 박수 쳐 주면 나 더 높이 뛴다!' },
        { say: '춤은 쑥스러워', tier: 'meh', face: 'calm', answer: '하하, 소들 앞이라 그래? 걔들은 아무 말 안 해. 다음엔 꼭!' },
      ],
    },
    {
      id: 'monster',
      open: '옛날에 바다 한가운데서 엄청 큰 놈이랑 겨뤘어. 들을래?',
      replies: [
        { say: '그래서 누가 이겼어?', tier: 'great', remember: 'monster-tale', answer: ['결과? 나 지금 웃고 있잖아! 하하하!', '…사실 그 녀석 이마에 올라타서 실컷 웃어 줬지.'] },
        { say: '무섭지 않았어?', tier: 'good', face: 'think', answer: '조금! 근데 무서울 때 웃으면 그게 이기는 길이더라.' },
        { say: '허풍 아니야?', tier: 'meh', face: 'laugh', answer: '하하하! 샹크스 같은 소리 하네! 믿든 말든 진짜야!' },
      ],
    },
    {
      id: 'snail',
      open: '으, 아까 울타리에 달팽이가 붙어 있었어. 걔들은 정말 못 이기겠어!',
      replies: [
        { say: '내가 떼어 줄게', tier: 'great', face: 'wow', answer: '진짜? 너 최고야! 큰 괴물은 안 무서운데 그건 이상하게 싫어!' },
        { say: '천천히 가니까 귀엽잖아', tier: 'good', face: 'think', answer: '귀엽…나? 너무 느려서 내기를 못 하잖아! 하하!' },
        { say: '달팽이 요리도 있대', tier: 'meh', face: 'sorry', answer: '으아, 그 말은 못 들은 걸로 할게! 쑥이랑 같이 저리 치워!' },
      ],
    },
    {
      id: 'bet',
      open: '{me}, 오늘 무슨 내기 할까? 건초 쌓기? 징검다리 건너기?',
      replies: [
        { say: '징검다리! 빠지면 지는 거', tier: 'great', answer: '하하하! 좋아! 근데 나 물은 자신 있다? 빠져도 웃으면서 나와!' },
        { say: '건초 쌓기로 하자', tier: 'good', answer: '좋지! 지는 쪽이 오늘 닭장 청소다. 각오해!' },
        { say: '오늘은 내기 쉬자', tier: 'meh', face: 'calm', answer: '그래, 그런 날도 있지! 대신 내일은 두 판이다!' },
      ],
    },
    {
      id: 'pal',
      when: { ch: 3 },
      open: '{me}, 나 다음 모험 계획 세우는 중이야. 너도 같이 갈래? 진심이야!',
      replies: [
        { say: '당연하지. 짝꿍이잖아', tier: 'great', remember: 'adventure-pal', face: 'shy', answer: '…하하! 그 말 듣고 싶었어! 맨 앞자리는 네 거야. 약속!' },
        { say: '어디로 가는데?', tier: 'good', answer: '아직 몰라! 그게 제일 신나는 거잖아. 가 보면 알겠지!' },
        { say: '소들은 누가 봐?', tier: 'meh', face: 'think', answer: '하쿠한테 부탁하면 돼! 대신 우유 열 통 줘야겠다, 하하!' },
      ],
    },
    {
      id: 'hometown',
      open: '내 고향? 동쪽으로 한참, 바다 건너 또 바다 건너야 나와! 하하!',
      replies: [
        { say: '어떤 곳이었어?', tier: 'great', remember: 'hometown', face: 'smile', answer: ['물 냄새가 늘 나는 곳! 배가 골목처럼 오갔어.', '다들 노래를 크게 불렀지. 내 목청은 거기서 왔나 봐, 하하!'] },
        { say: '돌아가고 싶어?', tier: 'good', face: 'think', answer: ['가끔! 근데 지금은 여기가 좋아.', '고향은 마음에 넣어 다니는 거야. 우유 통처럼 가볍게!'] },
        { say: '너무 멀다', tier: 'meh', face: 'laugh', answer: '멀어서 재밌는 거야! 가까우면 모험이 아니잖아!' },
      ],
    },
    {
      id: 'haku-trade',
      open: '하쿠네 과수원이랑 우리 목장, 들길 하나 차이야. 맨날 뭘 바꿔 먹어!',
      replies: [
        { say: '좋은 이웃이네', tier: 'great', remember: 'haku-trade', answer: ['그치! 우유 한 통 주면 과일 한 바구니가 와.', '근데 하쿠는 웃는 걸 잘 안 보여 줘. 그래서 웃기면 내가 이긴 거!'] },
        { say: '누가 더 이득이야?', tier: 'good', face: 'think', answer: '계산해 본 적 없어! 둘 다 배부르면 무승부지, 하하!' },
        { say: '하쿠 좀 어려워', tier: 'meh', face: 'calm', answer: '조용해서 그래. 근데 물길 얘기 하면 눈이 반짝해. 해 봐!' },
      ],
    },
    {
      id: 'lux-bet',
      open: '{me}, 럭스랑 또 낚시 내기 하기로 했어! 이번엔 꼭 이길 거야!',
      replies: [
        { say: '내가 편먹어 줄게', tier: 'great', remember: 'lux-bet', answer: ['진짜? 하하하! 둘이면 무적이다!', '럭스한텐 비밀이야. 아니, 그냥 말하자! 그게 더 재밌어!'] },
        { say: '미끼부터 바꿔 봐', tier: 'good', face: 'think', answer: '오, 그런 방법이! 우유에 적신 빵? 하하, 농담이야. 반만!' },
        { say: '럭스가 이기겠지', tier: 'meh', face: 'sorry', answer: '으, 맞는 말이라 더 분해! 그래도 웃으면서 질 거야!' },
      ],
    },
    {
      id: 'gabung-secret',
      open: '가붕한테 팔씨름 이기는 비법 같이 짜 볼래? 넌 머리가 좋잖아!',
      replies: [
        { say: '웃기면 힘 풀리지 않을까', tier: 'great', remember: 'gabung-secret', face: 'wow', answer: ['오오! 그거다! 근데 그럼 나도 웃다가 힘 풀리는데?', '…하하하! 비법이 너무 무섭다! 둘 다 쓰러지겠어!'] },
        { say: '손목 운동 매일 하자', tier: 'good', answer: '정석이지! 우유 통 들기 백 번! 아, 열 번부터 할까?' },
        { say: '그냥 져 줘', tier: 'meh', face: 'calm', answer: '그건 안 돼! 진짜로 붙어야 둘 다 웃을 수 있어.' },
      ],
    },
    {
      id: 'ornn-nails',
      open: '오른이 벼린 울타리 못 봤어? 소가 밀어도 꿈쩍도 안 해!',
      replies: [
        { say: '오른 솜씨 대단하지', tier: 'great', answer: ['그치! 말은 적은데 손은 수다쟁이야!', '고맙다고 우유 주면 흠, 하고 받아. 그게 웃는 거래, 하하!'] },
        { say: '네가 밀어 봤어?', tier: 'good', face: 'laugh', answer: '당연하지! 온 힘으로! …못이 이겼어. 분하다!' },
        { say: '못 얘긴 재미없어', tier: 'meh', face: 'sorry', answer: '하하, 미안! 그럼 오른이 우유 마시다 콧수염 하얘진 얘기 할까?' },
      ],
    },
    {
      id: 'yanineko-run',
      open: '야니네코 알지? 걔 들길 달리기 진짜 빨라! 근데 꼭 중간에 쉬어!',
      replies: [
        { say: '셋이 같이 뛰자!', tier: 'great', answer: '하하하! 좋아! 지는 쪽 둘이 우유 한 통씩! 아, 그럼 내가 손해다!' },
        { say: '왜 중간에 쉬어?', tier: 'good', face: 'think', answer: '그늘이 보이면 못 참는대! 그래도 다시 뛰면 엄청 빨라.' },
        { say: '쉬는 게 현명하지', tier: 'meh', face: 'calm', answer: '흠, 너도 그쪽이구나! 그럼 결승선에 그늘을 만들어 둘게!' },
      ],
    },
    {
      id: 'volibas-call',
      open: '볼리바스 순경님은 왜 늘 무승부라고 할까? 내가 이긴 게 확실한데!',
      replies: [
        { say: '공정하려고 그런 거야', tier: 'great', face: 'think', answer: ['음… 그런가? 그럼 순경님도 우리 편이네!', '좋아, 다음엔 순경님이랑 직접 붙자! 판정은 네가 해!'] },
        { say: '진짜 비긴 거 아냐?', tier: 'good', face: 'laugh', answer: '하하! 너까지! 좋아, 다음엔 확실하게 이길게!' },
        { say: '그만 좀 싸워', tier: 'meh', face: 'sorry', answer: '싸움 아니야! 겨루기는 웃으면서 하는 거라고!' },
      ],
    },
    {
      id: 'demon',
      open: '옛날에 웃음을 훔쳐 먹는 녀석이랑 겨룬 적 있어. 들어 볼래?',
      replies: [
        { say: '어떻게 이겼어?', tier: 'great', remember: 'demon-tale', answer: ['그 녀석은 웃음을 먹고 크거든.', '그래서 내가 더 크게 웃었지! 배 터지게! 하하, 그게 끝이야!'] },
        { say: '무서운 얘기 아니지?', tier: 'good', face: 'smile', answer: '전혀! 끝이 웃긴 얘기야. 웃음은 뺏기는 게 아니라 나누는 거거든.' },
        { say: '또 허풍이지?', tier: 'meh', face: 'laugh', answer: '하하하! 반은! 근데 남은 반이 제일 재밌는 반이야!' },
      ],
    },
    {
      id: 'sheep',
      open: '오늘 양털 깎는 날이야! 털 뭉치가 구름 같아. 같이 해 볼래?',
      replies: [
        { say: '해 볼래! 가르쳐 줘', tier: 'great', remember: 'sheep-shear', answer: ['좋아! 살살, 물결처럼 쓱! 그렇지!', '봐, 양이 시원해서 폴짝 뛴다. 너 소질 있다!'] },
        { say: '양이 안 아파?', tier: 'good', face: 'smile', answer: '하나도! 머리 깎는 거랑 같아. 끝나면 다들 신나서 뛰어!' },
        { say: '털 날려서 싫어', tier: 'meh', face: 'calm', answer: '하하, 나 지금 머리에 털 잔뜩이지? 그럼 구경만 해!' },
      ],
    },
    {
      id: 'windmill',
      open: '저 풍차 소리 들려? 끼익 끼익. 배 위 돛 소리랑 똑같아!',
      replies: [
        { say: '그래서 여기 정착했구나', tier: 'great', face: 'shy', answer: '…하하! 들켰다! 처음 온 날 저 소리 듣고 그냥 짐 풀었어.' },
        { say: '기름칠 해야겠다', tier: 'good', face: 'laugh', answer: '그러면 소리가 안 나잖아! 그건 안 돼, 하하!' },
        { say: '좀 시끄럽네', tier: 'meh', face: 'calm', answer: '나한텐 노랫소리야. 밤에 들으면 잠이 솔솔 와.' },
      ],
    },
    {
      id: 'mugwort',
      open: '쑥 냄새만 맡으면 코가 찡해! 다들 좋다는데 난 이상하게 싫어!',
      replies: [
        { say: '나도 쑥은 별로야', tier: 'great', face: 'laugh', answer: '하하하! 동지다! 우리 쑥 반대 모임 하자! 회원 둘!' },
        { say: '쑥떡은 맛있는데', tier: 'good', face: 'think', answer: '떡은… 음, 반 입은 먹어 볼게. 우유랑 같이라면!' },
        { say: '쑥 한 다발 줄까?', tier: 'meh', face: 'sorry', answer: '으아, 장난이지? 그건 달팽이 다음으로 무서운 선물이야!' },
      ],
    },
    {
      id: 'yellowtail',
      open: '겨울 방어 먹어 봤어? 기름이 사르르! 그거 하나면 하루 종일 신나!',
      replies: [
        { say: '방어 최고지!', tier: 'great', remember: 'yellowtail', answer: ['하하하! 너 뭘 좀 아는구나!', '그 큰 녀석 낚는 손맛도 끝내줘. 바다에서 한 판 붙는 거야!'] },
        { say: '회로? 구이로?', tier: 'good', face: 'think', answer: '둘 다! 반은 회, 반은 구이! 남으면 매운탕! 버릴 게 없어!' },
        { say: '생선은 별로야', tier: 'meh', face: 'calm', answer: '그래? 그럼 네 몫은 내가 먹을게! 하하, 대신 우유 줄게.' },
      ],
    },
    {
      id: 'restday',
      open: '나 하루 종일 가만히 있어 본 적이 없어. 쉬는 날엔 뭐 해야 돼?',
      replies: [
        { say: '그냥 누워서 구름 봐', tier: 'great', remember: 'quiet-day', face: 'think', answer: ['구름… 보기만? 내기 없이?', '…해 볼게! 근데 구름이 소 모양이면 웃어도 되지?'] },
        { say: '쉬는 것도 내기하자', tier: 'good', face: 'laugh', answer: '하하하! 누가 오래 가만있나? 나 바로 질 것 같은데!' },
        { say: '넌 못 쉬겠다', tier: 'meh', face: 'sorry', answer: '맞아… 다리가 근질근질해. 그래도 언젠가 해 볼 거야!' },
      ],
    },
    {
      id: 'sadday',
      open: '{me}, 사람들은 슬플 때 뭐 해? 나는 그냥 더 크게 웃는데.',
      replies: [
        { say: '슬픈 날엔 나한테 말해', tier: 'great', remember: 'share-tears', face: 'shy', answer: ['…너한테?', '하하, 그런 말 처음 들어 봐. 이상하게 가슴이 뜨끈하다.'] },
        { say: '울기도 해', tier: 'good', face: 'think', answer: '울기… 그것도 물이네. 물은 내 편인데, 왜 그건 어렵지?' },
        { say: '웃으면 되지 뭐', tier: 'meh', face: 'calm', answer: '그치? 나도 그렇게 생각했는데… 가끔은 잘 안 되더라.' },
      ],
    },
    {
      id: 'song',
      open: '배 위에서 혼자 부르던 노래가 있어. 파도 박자에 맞춘 거! 들을래?',
      replies: [
        { say: '불러 줘! 크게!', tier: 'great', remember: 'boat-song', answer: ['좋아! 출렁, 출렁, 노를 저어라!', '…하하하! 닭들이 깼다! 그래도 박수 쳐 줘서 고마워!'] },
        { say: '가사가 뭐야?', tier: 'good', face: 'think', answer: '반은 까먹어서 매번 새로 지어! 오늘은 우유 노래야!' },
        { say: '조용히 불러 줘', tier: 'meh', face: 'sorry', answer: '조용히? 그건 해 본 적 없는데… 노력해 볼게!' },
      ],
    },
    {
      id: 'swim',
      open: '{me}, 헤엄칠 줄 알아? 모르면 내가 가르쳐 줄게! 물은 내 편이야!',
      replies: [
        { say: '배우고 싶어!', tier: 'great', remember: 'swim-lesson', answer: ['좋아! 첫 수업은 물에 누워 보기!', '힘 빼고 웃으면 둥둥 떠. 진짜야, 웃음이 부력이야!'] },
        { say: '조금은 할 줄 알아', tier: 'good', face: 'wow', answer: '오! 그럼 개울 끝까지 시합이다! 봐주는 거 없다!' },
        { say: '물은 무서워', tier: 'meh', face: 'calm', answer: '괜찮아. 발목까지만 담가 보자. 물이랑은 천천히 친해지면 돼.' },
      ],
    },
    {
      id: 'market',
      open: '장날에 우유 팔면 다들 왜 이렇게 시끄럽게 파냐고 해! 하하!',
      replies: [
        { say: '그래서 다 팔리잖아', tier: 'great', answer: '하하하! 그치! 웃음소리 듣고 오는 손님이 반이야!' },
        { say: '흥정은 잘해?', tier: 'good', face: 'sorry', answer: '전혀! 깎아 달라면 덤까지 줘. 웃어 주면 그냥 져!' },
        { say: '좀 작게 해', tier: 'meh', face: 'calm', answer: '노력은 하는데… 신나면 소리가 저절로 커져!' },
      ],
    },
    {
      id: 'dream',
      open: '나 꿈이 하나 있어. 마을 사람 전부한테 아침 우유 한 잔씩 주는 거!',
      replies: [
        { say: '나도 돕고 싶어', tier: 'great', remember: 'ranch-dream', face: 'wow', answer: ['진짜? 하하하! 그럼 배달 짝꿍이다!', '한 잔씩 줄 때마다 한 사람씩 웃겠지? 생각만 해도 신나!'] },
        { say: '소가 몇 마리 필요해?', tier: 'good', face: 'think', answer: '음… 많이! 계산은 하쿠한테 부탁할래, 하하!' },
        { say: '너무 힘들 것 같아', tier: 'meh', face: 'calm', answer: '힘든 건 괜찮아! 큰 상대일수록 재밌거든.' },
      ],
    },
    {
      id: 'rooster',
      open: '우리 대장 닭이 나보다 먼저 일어나! 매일 아침 누가 먼저 깨나 시합 중이야!',
      replies: [
        { say: '내일은 네가 이겨!', tier: 'great', remember: 'rooster-race', answer: '하하하! 응원 고마워! 오늘 밤엔 해 지자마자 잘 거야!' },
        { say: '닭을 이길 수 있어?', tier: 'good', face: 'think', answer: '아직 한 번도 못 이겼어! 저 녀석, 혹시 안 자는 거 아냐?' },
        { say: '그냥 더 자', tier: 'meh', face: 'calm', answer: '그럼 지는 거잖아! 그건 안 돼, 하하!' },
      ],
    },
    {
      id: 'icemilk',
      open: '우유를 얼려서 과일 넣으면 얼음과자가 돼! 하쿠 복숭아 넣으면 최고야!',
      replies: [
        { say: '같이 만들자!', tier: 'great', remember: 'ice-milk', answer: ['좋아! 우유는 내가, 복숭아는 하쿠가!', '{me}, 너는 젓는 담당! 팔씨름 연습도 되고, 하하!'] },
        { say: '겨울에 먹으면 춥잖아', tier: 'good', face: 'laugh', answer: '추울 때 먹어야 더 재밌어! 덜덜 떨면서 웃는 거야!' },
        { say: '그냥 우유가 좋아', tier: 'meh', face: 'smile', answer: '하하, 그것도 정답! 진한 우유는 그대로가 제일이지.' },
      ],
    },
    {
      id: 'old-cow',
      open: '구석 칸 누렁소 봤어? 파도야. 이 마을 와서 처음 산 소야!',
      replies: [
        { say: '이름이 멋지다', tier: 'great', remember: 'old-cow', face: 'smile', answer: ['그치! 바다를 건너왔으니까 파도!', '얘가 이 목장 첫 우유를 줬어. 나한텐 첫 친구야.'] },
        { say: '나이가 많아 보여', tier: 'good', face: 'think', answer: '응. 요즘 걸음이 좀 느려. 하하, 괜찮아! 천천히 같이 걸으면 돼.' },
        { say: '소는 다 똑같아 보여', tier: 'meh', face: 'sorry', answer: '에이! 파도는 눈썹이 있어! 잘 봐, 하얀 눈썹!' },
      ],
    },
    {
      id: 'share-more',
      when: { ch: 5 },
      open: '{me}, 요즘 나 웃음 말고 다른 것도 너한테 말하게 돼. 괜찮아?',
      replies: [
        { say: '뭐든 다 말해 줘', tier: 'great', remember: 'share-sad', face: 'shy', answer: ['…하하. 고마워.', '기쁜 것만 들고 다니던 바가지에, 이제 다른 물도 담겨.'] },
        { say: '네 웃음이 더 좋아졌어', tier: 'good', face: 'laugh', answer: '진짜? 하하하! 바닥까지 웃는 느낌이라 그런가 봐!' },
        { say: '좀 낯설다', tier: 'meh', face: 'calm', answer: '나도 낯설어! 그래도 너랑이니까 해 보는 거야.' },
      ],
    },
    {
      id: 'love-quiet',
      when: { love: 'dating' },
      open: '{me}, 너랑 있으면 내기 안 해도 심장이 막 뛰어. 이거 반칙 아니야?',
      replies: [
        { say: '나도 반칙 중이야', tier: 'great', face: 'shy', answer: ['…하하하! 그럼 둘 다 반칙패다!', '벌칙은… 손잡고 목장 한 바퀴! 천천히!'] },
        { say: '그건 반칙 아니야', tier: 'good', face: 'smile', answer: '그래? 다행이다! 그럼 마음 놓고 뛰게 둘게!' },
        { say: '숨 고르고 와', tier: 'meh', face: 'laugh', answer: '하하, 숨 고르면 더 뛰는걸! 너 때문이야!' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비다! 물은 내 편이야! {me}, 우리 빗속에서 한 바퀴 돌래?',
      replies: [
        { say: '좋아! 같이 춤추자', tier: 'great', remember: 'dance-wave', answer: '하하하! 빗방울이 다 박자야! 빙글, 빙글! 신난다!' },
        { say: '건초 덮었어?', tier: 'good', face: 'wow', answer: '앗, 맞다! 잠깐만! …다 덮었어. 너 목장 일 잘 아는구나!' },
        { say: '젖는 건 싫어', tier: 'meh', face: 'calm', answer: '하하, 그럼 축사 처마 밑에 있어. 나 혼자 실컷 젖고 올게!' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '바람 소리 굉장하지! 이런 파도면 바다에선 큰 놈이 올라올 텐데!',
      replies: [
        { say: '동물들은 괜찮아?', tier: 'great', face: 'smile', answer: '다 축사에 넣었어! 걱정해 줘서 고마워. 내가 문 꽉 붙잡고 있었지!' },
        { say: '같이 보러 갈래?', tier: 'good', face: 'laugh', answer: '하하! 마음은 굴뚝같은데 오늘은 참자. 울타리부터 봐야 해!' },
        { say: '무서워…', tier: 'meh', face: 'calm', answer: '괜찮아, 내가 크게 웃어 줄게! 하하하! 봐, 바람 소리 작아졌지?' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다! 양들이 눈사람이 됐어! {me}, 눈싸움 한 판 붙어 볼래?',
      replies: [
        { say: '좋아! 각오해!', tier: 'great', answer: '하하하! 눈도 물이잖아? 그러니까 내가 유리해! 받아라!' },
        { say: '양들 털어 주자', tier: 'good', face: 'smile', answer: '오, 착하다! 털어 주면 꼬리 흔들어. 그다음에 눈싸움이다!' },
        { say: '손 시려', tier: 'meh', face: 'sorry', answer: '앗, 장갑 빌려줄게! 데운 우유도 한 잔! 몸부터 녹이자.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침! 방금 짠 우유야! 따끈해! {me}, 첫 잔 마셔 볼래?',
      replies: [
        { say: '고마워! 잘 마실게', tier: 'great', remember: 'dawn-milk', answer: '하하! 이 시간 우유가 제일 진해! 한 모금에 힘이 쭉 나지?' },
        { say: '같이 젖 짜도 돼?', tier: 'good', face: 'wow', answer: '물론! 손목 힘이 비결이야. 팔씨름 연습도 되고, 하하!' },
        { say: '아직 졸려…', tier: 'meh', face: 'calm', answer: '하하, 그럼 소들 옆에 기대 있어. 따뜻해서 금방 깰걸!' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤바다 소리 들려? 이런 밤엔 배 위에서 웃던 날들이 생각나.',
      replies: [
        { say: '그때 이야기 해 줘', tier: 'great', remember: 'sea-story', answer: ['별이 물에 다 비쳐서 위아래가 다 하늘이었어!', '그 한가운데서 혼자 노래 불렀지. 하하, 엄청 크게!'] },
        { say: '바다가 그리워?', tier: 'good', face: 'think', answer: '조금! 근데 여기엔 웃어 줄 사람이 있잖아. 그게 더 좋아.' },
        { say: '이제 자야지', tier: 'meh', face: 'calm', answer: '맞아, 나도 내일 새벽 축사야! 잘 자, {me}!' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '개울 물결이 노을 색이야! 발 담그고 가! 시원하다, 하하!',
      replies: [
        { say: '같이 담그자', tier: 'great', answer: '하하하! 좋아! 누가 오래 버티나 내기다! 차갑다!' },
        { say: '노을 예쁘다', tier: 'good', face: 'smile', answer: '그치? 물결이 춤추는 것 같아. 나도 따라 추고 싶어져.' },
        { say: '물 차갑지 않아?', tier: 'meh', face: 'laugh', answer: '차가우니까 재밌는 거야! 소리 질러도 돼, 하하!' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 팔씨름 대회 열자! 상품은 진한 우유 한 통!',
      replies: [
        { say: '나도 나간다!', tier: 'great', remember: 'arm-wrestle', answer: '하하하! 좋다! 결승에서 만나자! 봐주는 거 없어!' },
        { say: '심판은 누가 봐?', tier: 'good', face: 'think', answer: '볼리바스한테 부탁하면 또 무승부라고 할걸! 하하!' },
        { say: '구경만 할래', tier: 'meh', face: 'calm', answer: '구경도 좋아! 대신 응원은 제일 크게 해 줘!' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me}, 물 냄새 난다! 오늘 {fish} 낚았지? 손맛 어땠어?',
      replies: [
        { say: '힘겨루기 대단했어!', tier: 'great', answer: '하하하! 그 맛이지! 물속 녀석이랑 한 판 붙는 거, 나도 좋아해!' },
        { say: '겨우 한 마리야', tier: 'good', answer: '한 마리면 이긴 거야! 매운탕 한 그릇은 나오겠다!' },
        { say: '팔이 빠질 것 같아', tier: 'meh', face: 'sorry', answer: '하하, 손목을 써야 해! 우유 통 들기로 연습하자!' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '들었어! 엄청 큰 놈 낚았다며? 와, 나 지금 막 심장이 뛰어!',
      replies: [
        { say: '내가 이겼어!', tier: 'great', answer: '하하하하! 최고다! 큰 상대를 이긴 날은 크게 웃는 거야! 다 같이!' },
        { say: '팔이 아직 떨려', tier: 'good', face: 'wow', answer: '그게 승리의 떨림이야! 나도 바다 괴물이랑 겨룬 날 그랬어!' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 왔구나! 흙 묻었네! 물 채찍 한 번이면 깨끗해, 해 줄까?',
      replies: [
        { say: '좋아, 시원하게!', tier: 'great', remember: 'water-whip', answer: '하하! 간다, 휙! 개운하지? 소들도 이 맛에 줄 서!' },
        { say: '작물 좀 나눠 줄게', tier: 'good', face: 'smile', answer: '우와, 고마워! 대신 진한 우유 한 병 줄게. 맞바꾸기!' },
        { say: '그냥 둘래', tier: 'meh', face: 'calm', answer: '하하, 알았어! 흙도 훈장이지. 수고했어!' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me}, 금별 작물 나왔다며? 반짝반짝! 큰 상대 이긴 거랑 똑같다!',
      replies: [
        { say: '자랑하러 왔지!', tier: 'great', answer: '하하하! 자랑해야 맛이지! 소들아, 박수! …음메라도 해 봐!' },
        { say: '운이 좋았어', tier: 'good', answer: '운도 웃는 사람한테 오는 거야! 축하해!' },
      ],
    },
    {
      id: 'op-mood-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴이 좀 처졌다. 오늘은 내기 안 할게. 그냥 앉아.',
      replies: [
        { say: '네 웃음소리 듣고 싶어', tier: 'great', face: 'smile', answer: '그거라면 얼마든지! 하하하! …봐, 너 입꼬리 올라갔다. 내가 이겼어!' },
        { say: '좀 지쳤어', tier: 'good', face: 'calm', answer: '그럼 데운 우유 한 잔. 지친 날엔 소들 옆이 제일 따뜻해.' },
        { say: '혼자 있고 싶어', tier: 'meh', face: 'sorry', answer: '알았어. 근데 웃고 싶어지면 목장으로 와. 언제든!' },
      ],
    },
    {
      id: 'op-mood-high',
      when: { mood: 'high' },
      open: '{me}, 오늘 표정 최고다! 그 기운 나한테도 좀 줘! 힘이 막 나!',
      replies: [
        { say: '그럼 한 판 붙자!', tier: 'great', answer: '하하하! 그거지! 지금 우리 둘 다 최강이야! 덤벼!' },
        { say: '좋은 일 있었어', tier: 'good', face: 'smile', answer: '오, 뭔데? 말해 줘! 남의 기쁨 듣는 게 제일 신나!' },
      ],
    },
    {
      id: 'op-news-record',
      when: { news: 'record' },
      open: '들었어? 마을에 새 기록 나왔대! 와, 나도 뭐든 기록 세우고 싶다!',
      replies: [
        { say: '팔씨름 기록 세우자', tier: 'great', answer: '하하하! 좋다! 연속 승리 기록! 첫 상대는 가붕이다!' },
        { say: '우유 많이 짜기는?', tier: 'good', face: 'laugh', answer: '그건 소들이 세우는 기록이잖아! 하하, 그래도 해 볼까?' },
        { say: '기록은 관심 없어', tier: 'meh', face: 'calm', answer: '그래? 그럼 웃음 많이 웃기 기록은 어때? 그건 나 자신 있어!' },
      ],
    },
    {
      id: 'op-news-wedding',
      when: { news: 'wedding' },
      open: '오늘 결혼식 있었대! 축하 우유는 동네 전부 공짜다! 하하!',
      replies: [
        { say: '축하 잔치 하자!', tier: 'great', answer: '좋아! 소들 목에도 꽃 달아 주자! 다 같이 웃는 날이야!' },
        { say: '부럽다', tier: 'good', face: 'shy', answer: '하하, 나도 조금! …아니, 지금 그 얘기 하는 거 아니고!' },
      ],
    },
    {
      id: 'op-bond-yanineko',
      when: { bond: 'yanineko' },
      open: '{other} 만났어? 걔랑 들길 달리기 내기했는데 또 우유 한 통 걸었어!',
      replies: [
        { say: '누가 이겼어?', tier: 'great', answer: '내가! 하하하! 근데 걔가 중간에 그늘에서 잤대. 다음엔 정정당당하게!' },
        { say: '우유 아깝지 않아?', tier: 'good', face: 'laugh', answer: '하나도! 지면 주고 이기면 같이 마시는 거야!' },
        { say: '걔 또 잤어?', tier: 'meh', face: 'think', answer: '하하, 아마도! 그래서 나 혼자 결승선 밟았지 뭐야.' },
      ],
    },
    {
      id: 'op-bond-volibas',
      when: { bond: 'volibas' },
      open: '{other} 순경님 봤어? 저번 팔씨름 그거, 내가 이긴 거 맞지?',
      replies: [
        { say: '네가 이긴 거야!', tier: 'great', answer: '하하하! 그치? 근데 순경님은 늘 무승부래! 다시 붙어야겠다!' },
        { say: '무승부라던데', tier: 'good', face: 'think', answer: '으, 또 그 소리! 좋아, 다음엔 심판 둘 세우고 붙는다!' },
        { say: '둘 다 그만 싸워', tier: 'meh', face: 'laugh', answer: '싸움 아니야, 겨루기야! 웃으면서 하는 거라고, 하하!' },
      ],
    },
    {
      id: 'op-bond-ornn',
      when: { bond: 'ornn' },
      open: '대장간 다녀왔어? 오늘도 모루 소리 크더라! 나도 웃음으로 답했지!',
      replies: [
        { say: '여기까지 들려?', tier: 'great', answer: '들리지! 땅, 땅! 하면 내가 하하! 해. 들길 건너 주고받는 거야!' },
        { say: '울타리 못 받았어?', tier: 'good', answer: '응! 그 못은 아무리 밀어도 안 빠져. 분하지만 최고야!' },
        { say: '시끄럽지 않아?', tier: 'meh', face: 'think', answer: '하하, 시끄러운 건 서로 마찬가지라 괜찮대!' },
      ],
    },
    {
      id: 'op-bond-lux',
      when: { bond: 'lux' },
      open: '{other} 봤어? 저번 낚시 내기, 내가 한 마리 차이로 졌어! 분해!',
      replies: [
        { say: '다음엔 같이 이기자', tier: 'great', answer: '하하하! 좋아, 둘이 편먹고 붙자! 매운탕은 진 쪽이 끓이고!' },
        { say: '한 마리면 아깝다', tier: 'good', face: 'sorry', answer: '그러니까! 물 채찍 쓰면 안 된대. 반칙이래, 하하!' },
        { say: '낚시는 운이야', tier: 'meh', face: 'think', answer: '운이라도 다음엔 내 편으로 만들 거야!' },
      ],
    },
    {
      id: 'op-bond-haku',
      when: { bond: 'haku' },
      open: '{other} 만났구나! 오늘 복숭아랑 우유 바꾸기로 했어. 나 득 본 거지?',
      replies: [
        { say: '서로 득 본 거야', tier: 'great', answer: '하하! 맞아! 그래서 이웃이 좋은 거지. 걔 웃는 거 보면 내가 이긴 거고!' },
        { say: '복숭아 맛있겠다', tier: 'good', answer: '한 조각 나눠 줄게! 하쿠한텐 비밀로 하고, 하하!' },
      ],
    },
    {
      id: 'op-bond-gabung',
      when: { bond: 'gabung' },
      open: '{other} 만났어? 걔가 팔씨름 얘기 안 했어? 이번엔 내가 이길 차례야!',
      replies: [
        { say: '자기가 이긴대', tier: 'great', face: 'laugh', answer: '하하하! 그럴 줄 알았어! 좋아, 오늘 밤 통 위에서 결판이다!' },
        { say: '둘이 왜 맨날 비겨?', tier: 'good', face: 'think', answer: '둘 다 웃다가 힘이 풀리거든! 그게 문제야, 하하!' },
        { say: '아무 말 없던데', tier: 'meh', face: 'calm', answer: '흥, 숨기는 거야! 비법 연습 중이겠지!' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '해가 쨍쨍! {me}, 이런 날은 초원 끝까지 달려야 해! 출발할까?',
      replies: [
        { say: '셋 세면 출발!', tier: 'great', answer: '하나, 둘… 하하하! 셋 전에 뛰었다! 반칙이지만 신난다!' },
        { say: '그늘에서 우유 마시자', tier: 'good', face: 'smile', answer: '그것도 좋지! 햇볕 좋은 날 그늘 우유는 반칙급 맛이야.' },
        { say: '너무 더워', tier: 'meh', face: 'sorry', answer: '앗, 그럼 물 채찍으로 시원하게 해 줄까? 살짝만!' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '구름 많다! 양들이 하늘에도 있는 것 같지? 하나, 둘… 다 셀 수 있을까?',
      replies: [
        { say: '저건 소 모양이야', tier: 'great', face: 'laugh', answer: '하하하! 진짜다! 뿔까지 있어! 너 눈 좋다!' },
        { say: '비 올 것 같아', tier: 'good', face: 'think', answer: '그럼 건초부터 덮어야지! 도와줄래? 끝나면 우유!' },
        { say: '흐려서 처져', tier: 'meh', face: 'calm', answer: '그럴 땐 내가 크게 웃을게. 하하! 봐, 구름 사이로 해 났다!' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이다! 새끼 양들이 폴짝폴짝! 나보다 빨라! {me}, 잡기 내기할래?',
      replies: [
        { say: '내가 먼저 잡는다!', tier: 'great', answer: '하하하! 좋아! 근데 꼭 안아만 주고 놔줘야 해. 그게 규칙!' },
        { say: '그냥 보고 있을래', tier: 'good', face: 'smile', answer: '보는 것도 좋아! 봄 초원은 그 자체로 춤이야.' },
        { say: '양 냄새 나', tier: 'meh', face: 'laugh', answer: '그게 봄 냄새야! 하하, 금방 익숙해져!' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '여름엔 개울이 최고야! 물싸움 한 판 붙어 볼래? 나 물이랑 친한 거 알지?',
      replies: [
        { say: '덤벼! 안 진다!', tier: 'great', answer: ['하하하! 받아라, 물바가지!', '…앗, 너 정확하다! 좋아, 이건 진짜 승부다!'] },
        { say: '물 채찍은 반칙이야', tier: 'good', face: 'laugh', answer: '알았어, 알았어! 맨손으로만! 그래도 내가 이길걸!' },
        { say: '옷 젖는 거 싫어', tier: 'meh', face: 'calm', answer: '그럼 심판 해 줘! 젖은 쪽이 이긴 걸로 할까? 하하!' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을엔 건초를 산처럼 쌓아! {me}, 누가 높이 쌓나 내기할래?',
      replies: [
        { say: '내 건초탑이 이긴다', tier: 'great', answer: '하하하! 좋다! 무너지면 그 위로 뛰어들기! 그것도 재밌어!' },
        { say: '하쿠네 사과는?', tier: 'good', face: 'smile', answer: '익었대! 일 끝나면 우유 들고 바꾸러 가자. 같이!' },
        { say: '허리 아파', tier: 'meh', face: 'sorry', answer: '앗, 그럼 무거운 건 내가! 넌 꼭대기에 별만 꽂아 줘.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '겨울 우유는 진해! 데워서 한 잔 할래? 손부터 녹이자!',
      replies: [
        { say: '고마워, 따뜻하다', tier: 'great', face: 'smile', answer: '하하! 그치? 겨울엔 다들 웃음이 줄어. 그러니까 내가 두 배로!' },
        { say: '방어 철이네', tier: 'good', face: 'wow', answer: '맞아! 럭스한테 한 마리 부탁해 놨어! 너도 와!' },
        { say: '추워서 싫어', tier: 'meh', face: 'calm', answer: '그럼 축사로 와. 소들 옆은 겨울에도 봄이야.' },
      ],
    },
    {
      id: 'op-day',
      when: { time: 'day' },
      open: '점심이다! 원두막에서 우유랑 달걀 먹을 건데, 같이 앉을래?',
      replies: [
        { say: '좋아! 배고파', tier: 'great', answer: '하하! 큰 달걀 너 줄게! 오늘 대장 닭이 기분 좋았나 봐!' },
        { say: '하쿠도 불러', tier: 'good', face: 'smile', answer: '좋지! 과일 디저트 확보! 셋이면 더 웃기다!' },
        { say: '먹고 왔어', tier: 'meh', face: 'calm', answer: '그럼 우유만이라도! 우유는 배 따로 있잖아, 하하!' },
      ],
    },
    {
      id: 'op-news-birthday',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 사람 있대! 축하 우유 들고 가야지! 같이 갈래?',
      replies: [
        { say: '같이 가서 노래 부르자', tier: 'great', answer: '하하하! 좋아! 내 목청이면 바다 건너까지 들릴걸!' },
        { say: '선물은 뭐 해?', tier: 'good', face: 'think', answer: '큰 달걀 하나에 리본! 소박하지만 웃음은 크게!' },
        { say: '모르는 사람인데', tier: 'meh', face: 'smile', answer: '모르면 오늘 알게 되는 거지! 축하는 아무한테나 해도 돼!' },
      ],
    },
    {
      id: 'op-news-legend',
      when: { news: 'legend' },
      open: '들었어? 누가 전설의 물고기를 낚았대! 와, 그 녀석이랑 겨뤄 보고 싶다!',
      replies: [
        { say: '너라면 이길 거야', tier: 'great', answer: '하하하! 그 말 듣고 힘 났어! 언젠가 바다에서 한 판!' },
        { say: '럭스가 샘내겠다', tier: 'good', face: 'laugh', answer: '그치! 지금쯤 낚싯대 닦고 있을걸, 하하!' },
        { say: '물고기는 그냥 둬', tier: 'meh', face: 'think', answer: '음… 겨루기만 하고 놔주면 되지! 그게 내 방식이야.' },
      ],
    },
    {
      id: 'op-news-museum',
      when: { news: 'museum' },
      open: '박물관에 새 물건 들어왔대! 혹시 바다 괴물 비늘 같은 거 아닐까?',
      replies: [
        { say: '같이 보러 가자', tier: 'great', answer: '좋아! 진짜 비늘이면 내가 이긴 녀석 거인지 봐 줄게, 하하!' },
        { say: '괴물은 없을걸', tier: 'good', face: 'laugh', answer: '하하! 그럼 큰 조개라도! 뭐든 신나!' },
        { say: '박물관은 지루해', tier: 'meh', face: 'think', answer: '조용해서 그래? 그럼 내가 작게… 작게 웃으면서 다닐게.' },
      ],
    },
    {
      id: 'op-friend-wedding',
      when: { friendNews: 'wedding' },
      open: '{me}, 네 친구 결혼한대! 축하해! 축하 우유는 내가 쏜다!',
      replies: [
        { say: '같이 축하해 줘', tier: 'great', answer: '당연하지! 소들 목에 리본 달고 축하 행진이다! 하하하!' },
        { say: '좀 부럽다', tier: 'good', face: 'shy', answer: '하하, 부러운 것도 기쁨이야! 그 기쁨 나한테도 옮았어!' },
        { say: '별로 안 친해', tier: 'meh', face: 'calm', answer: '그래도 좋은 날이잖아! 축하는 많을수록 좋아!' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}! 오늘 생일이지? 축하해! 오늘 내기는 전부 네가 이기는 날이야!',
      replies: [
        { say: '그럼 팔씨름 한 판!', tier: 'great', answer: ['좋아! 시작! …으으, 졌다! 하하하!', '진짜로 진 거야. 오늘 너 힘이 엄청 세!'] },
        { say: '우유 한 잔이면 돼', tier: 'good', face: 'smile', answer: '제일 진한 걸로! 그리고 생일 노래! 내 목청 알지?' },
        { say: '조용히 보낼래', tier: 'meh', face: 'calm', answer: '알았어. 그럼 작게 축하할게. 생일 축하해, {me}.' },
      ],
    },
    {
      id: 'op-recent-fishing',
      when: { recent: 'fishing' },
      open: '요즘 낚시 자주 다닌다며? 물속 녀석들이랑 힘겨루기, 재밌지?',
      replies: [
        { say: '손맛에 빠졌어', tier: 'great', answer: '하하하! 그 맛 알면 끝이야! 다음엔 같이 가서 내기다!' },
        { say: '럭스한테 배워', tier: 'good', face: 'smile', answer: '최고 선생님이네! 나도 반칙만 안 하면 배울 수 있대, 하하!' },
        { say: '잘 안 잡혀', tier: 'meh', face: 'think', answer: '웃으면서 기다려 봐! 물고기도 신나는 쪽으로 온대!' },
      ],
    },
    {
      id: 'op-recent-voyage',
      when: { recent: 'voyage' },
      open: '{me}, 먼바다 다녀왔지? 바다 냄새 난다! 파도 높았어? 다 말해 줘!',
      replies: [
        { say: '파도가 산만 했어', tier: 'great', answer: ['하하하! 그거지! 심장 뛰었지?', '나도 그렇게 바다를 건너왔어. 이제 너도 모험가야!'] },
        { say: '멀미했어…', tier: 'good', face: 'sorry', answer: '앗, 그럼 진한 우유 마셔! 속이 확 풀려!' },
        { say: '그냥 다녀왔어', tier: 'meh', face: 'think', answer: '그냥이라니! 바다는 늘 새로운데! 다음엔 같이 가자!' },
      ],
    },
    {
      id: 'op-stockup',
      when: { recent: 'stockUp' },
      open: '들었어! 투자한 거 올랐다며? 큰 상대 이긴 기분이지? 하하!',
      replies: [
        { say: '한턱낼게!', tier: 'great', answer: '하하하! 그럼 매운탕! 큰 냄비로! 다 같이 웃자!' },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 웃는 사람한테 오는 거야! 축하해!' },
        { say: '또 떨어질까 봐', tier: 'meh', face: 'calm', answer: '그건 그때 웃으면 돼! 오늘은 오늘 기쁨만!' },
      ],
    },
    {
      id: 'op-stockdown',
      when: { recent: 'stockDown' },
      open: '{me}, 요즘 투자한 거 좀 떨어졌다며. 괜찮아? 이리 와, 우유 한 잔.',
      replies: [
        { say: '네 얼굴 보니 낫다', tier: 'great', face: 'shy', answer: '…하하! 그럼 실컷 봐! 오늘은 무료야!' },
        { say: '좀 속상해', tier: 'good', face: 'calm', answer: '속상한 건 속상한 거야. 말해 줘서 고마워. 같이 앉아 있자.' },
        { say: '괜찮아, 신경 꺼', tier: 'meh', face: 'sorry', answer: '알았어. 근데 우유는 그냥 받아! 이건 내기 아니야.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '카지노에서 땄다며? 하하! 승부 좋아하는구나! 나랑도 한 판 할래?',
      replies: [
        { say: '팔씨름으로 붙자!', tier: 'great', answer: '하하하! 그게 내 판이지! 거긴 운이고, 여긴 웃음이야!' },
        { say: '운이 따랐어', tier: 'good', face: 'smile', answer: '좋은 날이네! 근데 오늘은 거기까지! 남은 운은 나랑 쓰자!' },
        { say: '비밀이었는데', tier: 'meh', face: 'laugh', answer: '마을은 좁아! 하하, 걱정 마. 소들한텐 말 안 할게.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노에서 좀 잃었다며? 하하, 괜찮아! 진 날은 크게 웃고 털어 버리는 거야!',
      replies: [
        { say: '같이 웃어 줘', tier: 'great', answer: '하하하! 봐, 벌써 반은 털었다! 나머지 반은 우유로!' },
        { say: '다신 안 갈래', tier: 'good', face: 'smile', answer: '좋아! 대신 내 목장 내기는 공짜야. 잃을 게 없어!' },
        { say: '말하지 마', tier: 'meh', face: 'sorry', answer: '앗, 미안! 입 꾹! …웃음은 새어 나와도 봐줘.' },
      ],
    },
    {
      id: 'op-recent-museum',
      when: { recent: 'museum' },
      open: '박물관 다녀왔다며? 옛날 물건 보면 모험 냄새 나지 않아?',
      replies: [
        { say: '옛날 배 그림 있었어', tier: 'great', face: 'wow', answer: '진짜? 내가 탄 배랑 닮았을까? 다음에 같이 보자!' },
        { say: '조용해서 좋았어', tier: 'good', face: 'think', answer: '조용한 데서 좋은 사람도 있지. 나는 거기서 재채기 참느라 혼났어!' },
        { say: '별거 없었어', tier: 'meh', face: 'laugh', answer: '하하! 그럼 내 목장이 더 재밌다! 와!' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['…{other}. 오늘 그 친구랑 좀 어색해졌어.', '하하, 나 이런 거 처음이라 어떻게 할지 모르겠어.'],
      replies: [
        { say: '먼저 웃으며 말 걸어', tier: 'great', face: 'think', answer: ['먼저… 그래, 내가 제일 잘하는 거잖아!', '근데 그냥 웃지 말고, 미안하다고도 해 볼게.'] },
        { say: '시간이 지나면 풀려', tier: 'good', face: 'calm', answer: '그럴까? 그럼 오늘은 소들이랑 있을게. 내일 다시 가 볼래.' },
        { say: '네가 잘못했네', tier: 'meh', face: 'sorry', answer: '으… 그런가? 반은 맞을지도. 아프다, 하하.' },
      ],
    },
    {
      id: 'op-with-lux',
      when: { with: 'lux' },
      open: '{me}! 지금 나 대 {other}, 낚시 내기 중이야! 심판 좀 해 줄래?',
      replies: [
        { say: '공정하게 볼게', tier: 'great', answer: '하하하! 좋아! 물 채찍 쓰면 바로 반칙패 선언해도 돼!' },
        { say: '나도 끼워 줘', tier: 'good', face: 'laugh', answer: '좋아! 셋이 붙자! 지는 쪽이 매운탕 끓이기!' },
        { say: '둘 다 그만해', tier: 'meh', face: 'calm', answer: '하하, 이건 노는 거야! 그치, {other}?' },
      ],
    },
    {
      id: 'op-with-haku',
      when: { with: 'haku' },
      open: ['{other}, 이 친구랑 우유 과일 맞바꾸는 중이야!', '오늘은 복숭아 세 개! {me}, 하나 먹어!'],
      replies: [
        { say: '고마워! 달다', tier: 'great', answer: '그치! 하쿠네 복숭아는 물을 잘 머금었대. 물은 역시 최고야!' },
        { say: '하쿠가 웃었다', tier: 'good', face: 'wow', answer: '진짜? 어디어디? 하하, 놓쳤다! 너 덕분이야!' },
        { say: '난 괜찮아', tier: 'meh', face: 'calm', answer: '그래? 그럼 우유라도! 빈손으로는 못 보내!' },
      ],
    },
    {
      id: 'op-with-gabung',
      when: { with: 'gabung' },
      open: '{me}, 마침 왔다! 나 대 {other}, 팔씨름 결판! 판정 좀 해 줘!',
      replies: [
        { say: '시작! 셋, 둘, 하나!', tier: 'great', answer: ['으으으! 하하하!', '…또 무승부다! 그치? 너도 봤지? 다음엔 진짜다!'] },
        { say: '둘 다 응원할게', tier: 'good', face: 'smile', answer: '양쪽 응원이면 둘 다 힘 나잖아! 또 비기겠다, 하하!' },
        { say: '다치지 마', tier: 'meh', face: 'calm', answer: '걱정 마! 웃으면서 하는 겨루기는 안 다쳐!' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-race',
      when: { mem: 'race-yes' },
      use: 'race-yes',
      open: '{me}! 저번에 달리기 하자고 했지? 오늘이 그날이다! 준비됐어?',
      replies: [
        { say: '하나, 둘, 셋!', tier: 'great', answer: '하하하! 출발! …와, 빠르다! 이번엔 내가 우유 나른다!' },
        { say: '신발 끈 좀 묶고', tier: 'good', face: 'laugh', answer: '기다려 줄게! 정정당당해야 웃으면서 이기지!' },
      ],
    },
    {
      id: 'cb-arm',
      when: { mem: 'arm-wrestle' },
      use: 'arm-wrestle',
      open: '팔씨름 약속 기억하지? 우유 통 올려놨어. 팔 올려!',
      replies: [
        { say: '이번엔 안 진다', tier: 'great', answer: ['좋아, 그 눈빛! 시작!', '…으으! 하하하! 또 무승부다! 너 진짜 세졌어!'] },
        { say: '살살 해 줘', tier: 'good', face: 'smile', answer: '하하, 알았어! 대신 웃으면서 하기다. 그게 규칙!' },
      ],
    },
    {
      id: 'cb-laugh',
      when: { mem: 'laugh-power' },
      use: 'laugh-power',
      open: '웃음이 힘이라는 거, 너도 맞다고 했잖아. 요즘 많이 웃어?',
      replies: [
        { say: '네 덕분에 많이 웃어', tier: 'great', face: 'shy', answer: '…하하! 그 말 들으니까 나 지금 소 한 마리도 들 수 있겠다!' },
        { say: '요즘은 좀 덜 웃었어', tier: 'good', face: 'think', answer: '그럼 지금부터 채우자! 하하하! 따라 해 봐!' },
      ],
    },
    {
      id: 'cb-whip',
      when: { mem: 'water-whip' },
      use: 'water-whip',
      open: '물 채찍 새 기술 생겼어! 이번엔 안 젖게 해 줄게. 아마도! 볼래?',
      replies: [
        { say: '보여 줘! 기대된다', tier: 'great', answer: '간다! 휙, 빙글! …봐, 소 세 마리 한 번에! 너도 안 젖었지?' },
        { say: '우비 입고 볼게', tier: 'good', face: 'laugh', answer: '하하하! 현명하다! 사실 나도 장담은 못 해!' },
      ],
    },
    {
      id: 'cb-egg',
      when: { mem: 'big-egg' },
      use: 'big-egg',
      open: '{me}, 저번 달걀 찾기 기억나? 오늘 그보다 더 큰 게 나왔어!',
      replies: [
        { say: '와, 보여 줘!', tier: 'great', face: 'wow', answer: '이거 봐! 손바닥만 해! 하하, 너 오는 날 낳았나 봐!' },
        { say: '그걸로 뭐 해 먹어?', tier: 'good', answer: '달걀찜! 큰 거 하나면 둘이 먹고도 남아!' },
      ],
    },
    {
      id: 'cb-calf',
      when: { mem: 'calf-name' },
      use: 'calf-name',
      open: '네가 지어 준 이름, 막내가 이제 부르면 와! 같이 불러 볼래?',
      replies: [
        { say: '물결아, 이리 와!', tier: 'great', face: 'laugh', answer: '하하하! 봐, 뛰어온다! 너 목소리 알아듣는 거야!' },
        { say: '진짜 알아들어?', tier: 'good', face: 'smile', answer: '그럼! 우유 줄 때만 귀가 더 밝아지지만, 하하!' },
      ],
    },
    {
      id: 'cb-monster',
      when: { mem: 'monster-tale' },
      use: 'monster-tale',
      open: '바다 괴물 이야기 기억해? 사실 뒷이야기가 있어. 너한테만 해 줄게.',
      replies: [
        { say: '듣고 싶어', tier: 'great', face: 'smile', answer: '그 녀석도 마지막엔 웃더라. 같이 웃으면 싸울 이유가 없어져. 신기하지?' },
        { say: '또 허풍이지?', tier: 'good', face: 'laugh', answer: '하하하! 반은! 나머지 반은 너 웃기려고 한 거야!' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 거 {taste}, 맞지? 그걸 내기 상품으로 걸어 볼까? 하하!',
      replies: [
        { say: '그럼 진짜 열심히 할게', tier: 'great', remember: 'taste-heard', answer: '하하하! 그 기세 좋다! 나도 안 봐준다!' },
        { say: '어떻게 알았어?', tier: 'good', face: 'laugh', remember: 'taste-heard', answer: '소들이 알려 줬지! 농담이야, 마을 수첩에 다 있어!' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 돌아다닌 거 진짜 신났어! 너랑이면 어디든 모험이야!',
      replies: [
        { say: '다음엔 더 멀리 가자', tier: 'great', remember: 'outing-talk', answer: '하하하! 좋아! 먼바다까지! 노는 내가 저을게!' },
        { say: '너 계속 뛰었잖아', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '신나니까 그렇지! 다음엔 너 손 잡고 뛸게!' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이지? 생일 기념 내기 대회 열자! 상품은 진한 우유!',
      replies: [
        { say: '네가 웃어 주면 돼', tier: 'great', face: 'shy', remember: 'bday-plan', answer: '…하하! 그건 공짜야! 그날은 하루 종일 웃어 줄게!' },
        { say: '대회 좋아!', tier: 'good', remember: 'bday-plan', answer: '좋아! 주인공은 무조건 우승이다. 그게 생일 규칙!' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에서 같이 있던 거… 내기도 안 했는데 엄청 신났어. 이상하지?',
      replies: [
        { say: '나도 그랬어', tier: 'great', face: 'shy', remember: 'date-talk', answer: '…하하! 그럼 우리 둘 다 이긴 거네. 다음에도 또 그러자.' },
        { say: '다음엔 팔씨름하자', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '하하하! 좋아! 근데 너 앞에선 힘이 잘 안 들어가더라.' },
      ],
    },
    {
      id: 'cb-sea',
      when: { mem: 'sea-story' },
      use: 'sea-story',
      open: '바다 건너온 얘기, 하나 더 있어! 돌고래 떼랑 경주한 날 얘기!',
      replies: [
        { say: '누가 이겼어?', tier: 'great', answer: ['돌고래! 하하하! 완패!', '근데 걔들도 웃는 얼굴이더라. 그래서 진 것도 신났어.'] },
        { say: '돌고래가 진짜 있어?', tier: 'good', face: 'wow', answer: '있지! 동쪽 바다엔 떼로 다녀. 언젠가 같이 보자!' },
      ],
    },
    {
      id: 'cb-stew',
      when: { mem: 'spicy-stew' },
      use: 'spicy-stew',
      open: '{me}, 얼큰한 거 좋아한다고 했지? 오늘 매운탕 국물 내가 냈어! 한 숟갈!',
      replies: [
        { say: '와, 얼큰하다!', tier: 'great', answer: '하하하! 그치? 땀 나면 이긴 거야! 한 그릇 더!' },
        { say: '조금 싱거운데?', tier: 'good', face: 'think', answer: '앗, 진짜? 고춧가루 한 줌 더! 너 입맛 정확하다!' },
      ],
    },
    {
      id: 'cb-dawn',
      when: { mem: 'dawn-milk' },
      use: 'dawn-milk',
      open: '새벽 첫 우유 기억나? 네 잔은 아직 축사 기둥에 걸어 뒀어! 하하!',
      replies: [
        { say: '내일 새벽에 갈게', tier: 'great', face: 'shy', answer: '…진짜? 하하! 그럼 대장 닭보다 먼저 일어나야겠다!' },
        { say: '그 잔 아직 있어?', tier: 'good', face: 'laugh', answer: '당연하지! 이름도 써 놨어. 삐뚤빼뚤하게, 하하!' },
      ],
    },
    {
      id: 'cb-stewnight',
      when: { mem: 'stew-night' },
      use: 'stew-night',
      open: '그날 매운탕 먹던 밤, 생각나? 그날 나 사실 좀 울적했었어.',
      replies: [
        { say: '알아. 그래서 같이 있었어', tier: 'great', face: 'shy', answer: ['…알고 있었구나.', '하하, 들켰는데 이상하게 기분이 좋다. 고마워.'] },
        { say: '맵기만 한 줄 알았어', tier: 'good', face: 'laugh', answer: '하하! 반은 매워서였어! 나머지 반은 이제 괜찮아.' },
      ],
    },
    {
      id: 'cb-pal',
      when: { mem: 'adventure-pal' },
      use: 'adventure-pal',
      open: '짝꿍! 다음 모험 정했어! 뒷산 계곡 끝까지 물길 따라가기! 어때?',
      replies: [
        { say: '좋아, 맨 앞은 나!', tier: 'great', answer: '하하하! 약속대로 맨 앞자리는 네 거! 난 바로 뒤에서 웃을게!' },
        { say: '도시락은 내가 쌀게', tier: 'good', face: 'smile', answer: '최고다! 그럼 우유는 내가! 최고의 짝꿍이야!' },
      ],
    },
    {
      id: 'cb-dance',
      when: { mem: 'dance-wave', noMem: 'dance-again' },
      open: '{me}, 물결 춤 아직 기억해? 무릎 살짝, 팔은 빙글! 한 번 더 출래?',
      replies: [
        { say: '물론! 빙글!', tier: 'great', remember: 'dance-again', answer: '하하하! 박자 그대로다! 너 몸이 기억하는구나!' },
        { say: '발 밟아도 돼?', tier: 'good', face: 'laugh', remember: 'dance-again', answer: '돼! 그게 이 춤의 규칙이라니까!' },
      ],
    },
    {
      id: 'cb-song',
      when: { mem: 'boat-song' },
      use: 'boat-song',
      open: '배 노래 기억나? 가사 새로 지었어! 이번엔 너 이름도 들어가!',
      replies: [
        { say: '불러 줘! 듣고 싶어', tier: 'great', face: 'shy', answer: ['출렁출렁, {me} 노를 저어라!', '…하하하! 부르다 보니 좀 부끄럽다!'] },
        { say: '내 이름 빼 줘', tier: 'good', face: 'laugh', answer: '안 돼! 이미 닭들이 외웠어, 하하!' },
      ],
    },
    {
      id: 'cb-swim',
      when: { mem: 'swim-lesson' },
      use: 'swim-lesson',
      open: '헤엄 수업 두 번째 시간! 오늘은 물장구! {me}, 개울로 가자!',
      replies: [
        { say: '힘 빼고 웃기, 맞지?', tier: 'great', answer: '정답! 하하하! 봐, 떴다! 너 이제 물이랑 친구야!' },
        { say: '발목까지만…', tier: 'good', face: 'smile', answer: '좋아, 그럼 발로 물장구만! 천천히 가도 돼.' },
      ],
    },
    {
      id: 'cb-yellowtail',
      when: { mem: 'yellowtail' },
      use: 'yellowtail',
      open: '방어 좋아한다고 했지? 럭스가 큰 놈 한 마리 줬어! 반 나눠 먹자!',
      replies: [
        { say: '최고다! 고마워', tier: 'great', answer: '하하하! 기름 좌르르! 같이 먹으니까 두 배로 맛있다!' },
        { say: '럭스한테 고맙다고 해', tier: 'good', face: 'smile', answer: '같이 가서 하자! 우유 한 통 들고! 그게 마을 법이야!' },
      ],
    },
    {
      id: 'cb-tears',
      when: { mem: 'share-tears' },
      use: 'share-tears',
      open: '{me}, 슬픈 날엔 말하라고 했지? 그 말 계속 생각났어.',
      replies: [
        { say: '언제든 말해', tier: 'great', face: 'shy', answer: ['…응. 아직은 웃는 게 편하지만.', '말할 데가 있다는 것만으로 힘이 나. 이것도 기쁨인가 봐.'] },
        { say: '오늘은 괜찮아?', tier: 'good', face: 'smile', answer: '오늘은 엄청 괜찮아! 하하! 네가 물어봐 줘서 더!' },
      ],
    },
    {
      id: 'cb-haku',
      when: { mem: 'haku-trade' },
      use: 'haku-trade',
      open: '들어 봐! 하쿠가 우유 받고 웃었어! 진짜로! 작게, 이만큼!',
      replies: [
        { say: '네가 이겼네!', tier: 'great', answer: '하하하! 그치! 이웃끼리 웃으면 둘 다 이긴 거야!' },
        { say: '뭐라고 했는데?', tier: 'good', face: 'think', answer: '물 냄새가 좋다고! 우유인데! 하쿠다워, 하하!' },
      ],
    },
    {
      id: 'cb-lux',
      when: { mem: 'lux-bet' },
      use: 'lux-bet',
      open: '편먹기로 한 낚시 내기 기억해? 오늘 럭스한테 도전장 보냈어!',
      replies: [
        { say: '이번엔 이기자!', tier: 'great', answer: '하하하! 그 기세! 지면 둘이 같이 매운탕 끓이자!' },
        { say: '미끼는 준비했어', tier: 'good', face: 'wow', answer: '역시 짝꿍! 나는 웃음만 준비했어, 하하!' },
      ],
    },
    {
      id: 'cb-gabung',
      when: { mem: 'gabung-secret' },
      use: 'gabung-secret',
      open: '웃기면 힘 풀린다는 비법, 가붕한테 써 봤어! 결과 궁금하지?',
      replies: [
        { say: '이겼어?', tier: 'great', face: 'laugh', answer: ['둘 다 웃다가 통에서 굴러떨어졌어!', '하하하! 순경님이 또 무승부래!'] },
        { say: '역시 비겼구나', tier: 'good', face: 'sorry', answer: '어떻게 알았어! 하하, 다음 비법도 부탁해!' },
      ],
    },
    {
      id: 'cb-rooster',
      when: { mem: 'rooster-race' },
      use: 'rooster-race',
      open: '{me}! 나 오늘 대장 닭보다 먼저 일어났어! 처음으로!',
      replies: [
        { say: '축하해! 대단하다', tier: 'great', answer: '하하하! 근데 닭이 날 보더니 그냥 다시 잤어. 이긴 거 맞지?' },
        { say: '몇 시에 잤는데?', tier: 'good', face: 'shy', answer: '…해 지자마자. 하하, 저녁도 안 먹고!' },
      ],
    },
    {
      id: 'cb-ice',
      when: { mem: 'ice-milk' },
      use: 'ice-milk',
      open: '우유 얼음과자 다 얼었어! 복숭아 콕콕! 약속대로 첫 입은 너!',
      replies: [
        { say: '시원하다! 달다!', tier: 'great', answer: '하하하! 그치! 젓느라 팔 아팠던 보람 있지?' },
        { say: '하쿠도 줘야지', tier: 'good', face: 'smile', answer: '벌써 하나 빼 뒀어! 이웃 몫은 늘 먼저야.' },
      ],
    },
    {
      id: 'cb-dream',
      when: { mem: 'ranch-dream' },
      use: 'ranch-dream',
      open: '배달 짝꿍! 오늘 아침 우유를 마을 다섯 집에 돌렸어! 꿈에 한 걸음!',
      replies: [
        { say: '다음엔 나도 같이', tier: 'great', answer: '하하하! 그럼 열 집! 둘이면 두 배야!' },
        { say: '다들 웃었어?', tier: 'good', face: 'smile', answer: '응! 한 집은 잠옷 바람으로 나왔어. 그게 제일 웃겼어!' },
      ],
    },
    {
      id: 'cb-sad',
      when: { mem: 'share-sad' },
      use: 'share-sad',
      open: '{me}, 오늘 파도가 햇볕 쬐며 꾸벅 졸더라. 그거 보는데 좀 찡했어.',
      replies: [
        { say: '같이 보러 가자', tier: 'great', face: 'smile', answer: ['응. 옆에 앉아만 있어 줘.', '…봐, 귀 쫑긋했다. 하하, 너 온 거 아나 봐.'] },
        { say: '찡해도 괜찮아', tier: 'good', face: 'calm', answer: '응. 이제 알아. 찡한 것도 나누면 따뜻해지더라.' },
      ],
    },
    {
      id: 'cb-hometown',
      when: { mem: 'hometown' },
      use: 'hometown',
      open: '고향 얘기 했던 거 기억나? 거기서 배운 장 보러 가는 노래가 있어!',
      replies: [
        { say: '같이 부르면서 가자', tier: 'great', answer: '하하하! 좋아! 시장 거리까지 박자 맞춰서! 하나, 둘!' },
        { say: '고향이 그립구나', tier: 'good', face: 'think', answer: '조금! 근데 노래 부르면 거기랑 여기가 이어지는 것 같아.' },
      ],
    },
    {
      id: 'cb-old-cow',
      when: { mem: 'old-cow' },
      use: 'old-cow',
      open: '파도 하얀 눈썹 봤지? 오늘 그 눈썹에 나비가 앉았어! 하하!',
      replies: [
        { say: '귀엽다! 보고 싶어', tier: 'great', answer: '지금 가면 아직 있을걸! 파도는 움직이는 걸 귀찮아하거든!' },
        { say: '파도는 잘 지내?', tier: 'good', face: 'calm', answer: '응. 느리지만 잘 지내. 물어봐 줘서 고마워.' },
      ],
    },
  ],
  chapters: [
    {
      title: '들길 너머의 웃음소리',
      hint: '한 번 이야기를 나누면 닐라가 큰 소리로 웃으며 반겨 줘요.',
      need: { days: 1 },
      scene: [
        '들길 너머에서 "하하하!" 하는 웃음소리가 먼저 들려온다.',
        '우유 통을 어깨에 멘 닐라가 성큼성큼 다가온다.',
        '"안녕! 나 닐라! 목장 하고 있어! 웃음소리 크지? 하하하!"',
        '그녀 뒤로 하얀 눈썹의 늙은 누렁소가 느릿느릿 따라온다.',
        '"얘는 파도! 이 마을 와서 처음 만난 소야. 내 첫 친구지!"',
        '"웃는 게 내 힘이야. 네가 웃으면 그것도 내 힘이 되고!"',
        '파도가 음매, 하고 맞장구치듯 꼬리를 흔든다.',
        '"봐, 파도도 찬성이래! 기쁜 건 나눌수록 커지거든."',
        '"그러니까 {me}, 오늘부터 우리 자주 웃자. 약속!"',
      ],
      replies: [
        { say: '좋아, 하하하!', tier: 'great', remember: 'laugh-power', answer: '봐, 벌써 힘이 난다! 우유 한 통 더 들 수 있겠어!' },
        { say: '웃음소리 진짜 크다', tier: 'good', face: 'laugh', answer: '하하! 그치? 들길 너머 대장간까지 들린대!' },
        { say: '조금 시끄러워', tier: 'meh', face: 'sorry', answer: '앗, 미안! 너 앞에선 조금만 작게 웃을게. …노력해 볼게!' },
      ],
    },
    {
      title: '새벽 축사의 첫 우유',
      hint: '새벽(게임 시각 오전 다섯 시부터 여덟 시)에 닐라 목장에 가 보세요. 첫 우유를 짠대요.',
      need: { days: 3, points: 20, visit: { area: 'ranch', from: 5, to: 8 } },
      scene: [
        '새벽 안개 속 축사. 닐라가 소 옆에 앉아 젖을 짜고 있다.',
        '"왔구나! 진짜 왔네! 이 시간에 온 사람은 네가 처음이야!"',
        '"이 시간 우유가 하루 중 제일 진해. 소들도 아직 꿈결이라 순하고."',
        '그녀가 김이 나는 잔을 건넨다. 따끈하고 고소하다.',
        '구석 칸에서는 늙은 파도가 눈을 반쯤 감고 되새김질을 한다.',
        '"파도는 요즘 우유가 조금씩 줄어. 나이가 있으니까. 하하, 괜찮아!"',
        '닐라가 웃는다. 그런데 손이 파도의 등에 잠깐 오래 머문다.',
        '"바다 건너올 때 매일 해 뜨는 걸 봤거든. 여기선 소들이랑 같이 봐."',
        '축사 틈으로 첫 햇살이 들어와 우유 통 위에서 반짝인다.',
        '"자, 첫 잔은 네 거! 내일 첫 잔도 네 거! 하하하!"',
      ],
      replies: [
        { say: '내일도 와도 돼?', tier: 'great', remember: 'dawn-milk', face: 'laugh', answer: '하하하! 당연하지! 너 몫의 잔을 따로 걸어 둘게!' },
        { say: '진짜 고소하다', tier: 'good', remember: 'dawn-milk', face: 'smile', answer: '그치? 이게 내 자랑이야. 소들한테 고맙다고 해 줘!' },
        { say: '너무 일찍이다', tier: 'meh', remember: 'dawn-milk', answer: '하하, 그래도 와 줬잖아! 그게 이긴 거야!' },
      ],
    },
    {
      title: '얼큰한 내기',
      hint: '닐라가 매운탕 얘기를 자꾸 해요. 매운탕 한 그릇을 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'maeuntang', take: true } },
      scene: [
        '매운탕을 내밀자 닐라가 펄쩍 뛴다.',
        '"우와아! 매운탕! 이거 내가 제일 좋아하는 거야! 어떻게 알았어?"',
        '원두막에 마주 앉아 숟가락을 든다. 김이 모락모락 오른다.',
        '"좋아, 내기다! 누가 먼저 땀 흘리나! 지는 쪽이 설거지!"',
        '두 숟갈 만에 그녀 이마에 땀이 맺힌다. 그래도 크게 웃는다.',
        '"사실 오늘 파도가 처음으로 우유를 한 방울도 안 줬어."',
        '"그래서 기운 내려고 매운 거 생각했는데, 네가 들고 왔네!"',
        '그녀가 국물을 후루룩 마시고, 일부러 더 크게 웃는다.',
        '"하하하! 맵다! 눈물이 다 나네! 이건 매워서 나는 거야!"',
        '눈가를 쓱 닦는 손이 평소보다 조금 느리다.',
        '"…아무튼 너 덕분에 배도 마음도 뜨끈해. 고마워, {me}."',
      ],
      replies: [
        { say: '네가 졌다! 하하!', tier: 'great', remember: 'stew-night', face: 'laugh', answer: '하하하! 졌는데 왜 이렇게 신나지? 설거지도 웃으면서 할게!' },
        { say: '같이 설거지하자', tier: 'good', remember: 'stew-night', face: 'smile', answer: '오, 그럼 무승부다! 가붕이랑 할 때처럼! 하하!' },
        { say: '너무 매워…', tier: 'meh', remember: 'stew-night', face: 'sorry', answer: '앗, 우유 마셔! 빨리! 매운 데엔 우유가 최고야!' },
      ],
    },
    {
      title: '물결 춤의 비밀',
      hint: '닐라와 물결 춤을 같이 배우면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'dance-wave' },
      scene: [
        '해 질 무렵 개울가. 닐라가 맨발로 물속에 서 있다.',
        '"물결 춤 말이야. 사실 이거 싸우는 법이었어. 바다 건널 때 배운."',
        '"근데 웃으면서 추다 보니까 그냥 춤이 됐어. 신기하지?"',
        '그녀가 물을 한 줌 떠서 노을에 비춰 본다.',
        '"나 가르쳐 준 스승님이 그랬어. 물은 뭐든 담는다고."',
        '"기쁨도 담고, 슬픔도 담고. 그래서 물은 안 깨진대."',
        '"난 그 말 반만 배웠나 봐. 기쁜 걸 담는 법만 알거든, 하하."',
        '"파도가 기운 없는 걸 보면 어떻게 할지 몰라서 웃기만 해."',
        '물방울이 그녀 손가락 사이로 반짝이며 떨어진다.',
        '"…이런 얘기, 너한테 처음 해. 이상하게 너한테는 돼."',
        '그녀가 손을 내민다. 물방울이 노을에 반짝인다.',
        '"오늘은 겨루지 말고, 그냥 같이 추자. 너랑은 그게 더 좋아."',
      ],
      replies: [
        { say: '손을 잡는다', tier: 'great', face: 'shy', answer: '…하하! 네 손 따뜻하다. 빙글, 그렇지! 우리 박자 딱 맞아!' },
        { say: '발 밟아도 웃기다', tier: 'good', face: 'laugh', answer: '하하하! 밟아도 돼! 그게 이 춤의 규칙이야!' },
        { say: '물이 너무 차가워', tier: 'meh', answer: '하하, 그럼 바위 위에서 추자! 춤은 어디서든 돼!' },
      ],
    },
    {
      title: '이기고 싶지 않은 내기',
      hint: '닐라와 아주 가까워지면 내기 끝에 숨겨 둔 말을 꺼내요. 그 뒤엔 꽃다발도 반길지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '들길 끝 언덕. 닐라가 숨을 몰아쉬며 풀밭에 털썩 눕는다.',
        '"하하… 이번 달리기, 내가 일부러 늦게 뛴 거 알아?"',
        '"이상해. 너랑 내기하면 자꾸 지고 싶어져. 이런 건 처음이야."',
        '언덕 아래 풀밭에서는 파도가 해를 쬐며 졸고 있다.',
        '"파도는 이제 젖을 안 짜. 저기서 실컷 쉬게 해 주기로 했어."',
        '"잘된 일이야. 그런데… 아침마다 첫 잔이 하나 모자라."',
        '그녀가 하늘을 보며 웃으려다, 웃음이 중간에 멈춘다.',
        '"어? 이상하다. 웃음이 안 나와. 이럴 땐 어떻게 하는 거야?"',
        '한동안 아무 말 없이 나란히 누워 바람 소리를 듣는다.',
        '"…너 옆에 있으니까, 안 웃어도 괜찮은 것 같아. 처음 알았어."',
        '"슬픈 것도 나누니까 반으로 줄어. 기쁜 건 두 배가 되고!"',
        '그제야 그녀가 작게, 진짜로 웃는다.',
        '"…꽃이라도 한 다발 받으면, 나 초원 끝까지 소리 지르며 뛸 것 같아."',
      ],
      replies: [
        { say: '그럼 다음엔 들고 올게', tier: 'great', face: 'shy', remember: 'share-sad', answer: '…하하하! 진짜? 그럼 나 오늘부터 목청 연습한다!' },
        { say: '다음엔 진짜로 뛰어', tier: 'good', face: 'laugh', answer: '하하! 알았어! 근데 장담은 못 해. 너 앞이면 다리가 풀려!' },
        { say: '숨 좀 돌려', tier: 'meh', face: 'calm', answer: '그래… 오늘은 그냥 하늘 보자. 이것도 좋다.' },
      ],
    },
    {
      title: '가장 큰 모험',
      hint: '닐라와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '밤 목장. 닐라가 울타리에 앉아 먼 바다 쪽을 본다.',
        '파도가 그녀 무릎께에 머리를 기대고 꾸벅꾸벅 존다.',
        '"나 바다 건너면서 큰 놈이랑 많이 겨뤘잖아. 다 이겼고."',
        '"옛날엔 웃음을 훔치는 녀석이랑도 겨뤄 봤어. 그것도 이겼지."',
        '"근데 그땐 몰랐어. 기쁨은 혼자 지키는 게 아니더라."',
        '"네가 내 슬픈 날을 같이 들어 준 뒤로, 웃음이 더 깊어졌어."',
        '"이제 웃을 때 바닥까지 다 웃는 느낌이야. 물결처럼 끝까지!"',
        '"근데 지금 제일 떨리는 상대는 너야. 하하, 웃기지?"',
        '"앞으로 모험은 다 너랑 할래. 기쁜 날도, 비 오는 날도."',
        '"매일매일, 끝까지! 파도도 증인이야. 그치, 파도?"',
        '파도가 음매, 하고 졸린 대답을 한다. 둘이 동시에 웃음을 터뜨린다.',
        '그녀가 손가락을 꼼지락거린다. "…반지 같은 건 아직이지만!"',
      ],
      replies: [
        { say: '끝까지 같이 가자', tier: 'great', face: 'laugh', answer: '하하하하! 들었지, 소들아! 오늘은 평생 최고로 기쁜 날이야!' },
        { say: '반지는 내가 준비할게', tier: 'good', face: 'shy', answer: '…진짜? 하하! 그럼 그날까지 팔씨름은 안 할게. 손 다치면 안 되니까!' },
        { say: '천천히 가자', tier: 'meh', face: 'smile', answer: '좋아! 천천히 걷는 것도 모험이야. 너랑이면!' },
      ],
    },
  ],
  after: [
    '오늘 얘기 많이 했다! 내일은 달리기 하자, 하하!',
    '또 왔어? 신난다! 우유 한 잔 들고 가!',
    '소들이 부른다! 또 봐! 다음엔 안 봐줄 거야!',
    '오늘 웃은 만큼 내일 힘 날 거야! 하하하!',
    '파도한테 인사하고 가! 졸려도 꼬리는 흔들 거야!',
    '아직 할 말 있어? 그럼 들길까지 같이 걷자! 천천히!',
    '물 한 바가지 맞고 갈래? 농담! 반만, 하하!',
    '오늘 하루 어땠어? 좋은 것도, 아닌 것도 다 말해도 돼.',
  ],
};
