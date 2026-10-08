// 프리렌 — 시장 거리 빵집 카페 사장, 천 살 엘프. 느긋하고 무심한 반말. 아침잠이
// 많아 늘 늦게 연다. 쓸모없어 보이는 옛 레시피(마도서 귀퉁이의 빵 굽는 법) 수집,
// 상자만 보면 머리부터 넣는 버릇, 엘프의 시간 감각(십 년은 잠깐), 멀리 사는 옛
// 동료들의 편지. 알바생 힘멜의 마음은 모른다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const FRIEREN_TALK: NpcTalkBook = {
  npc: 'frieren',
  memories: {
    'morning-person': '아침형이라고 했어요',
    'sleepyhead': '늦잠을 좋아한다고 했어요',
    'odd-recipe': '이상한 레시피 모으기를 돕기로 했어요',
    'sweet-tooth': '단 걸 좋아한다고 했어요',
    'chest-warn': '상자는 조심하라고 말렸어요',
    'chest-dive': '같이 상자를 열어 보자고 했어요',
    'old-friends': '옛 동료들 이야기를 들었어요',
    'flower-field': '꽃밭 이야기를 들었어요',
    'time-talk': '시간이 빨리 간다는 이야기를 나눴어요',
    'stars': '유성우를 같이 보기로 했어요',
    'burnt-bread': '탄 빵도 맛있다고 했어요',
    'letter': '편지 쓰는 걸 도왔어요',
    'night-flower': '숲에서 밤에 피는 꽃을 함께 봤어요',
    'jam-jar': '딸기잼을 선물했어요',
    'useless-magic': '쓸모없는 마법을 하나 배웠어요',
    'recipe-found': '노래하는 빵 레시피를 함께 찾았어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일 케이크를 구워 준대요',
  },
  talks: [
    {
      id: 'morning',
      open: '{me}, 너는 아침에 잘 일어나? …난 못 일어나. 천 년째.',
      replies: [
        { say: '나도 늦잠 좋아해', tier: 'great', remember: 'sleepyhead', face: 'smile', answer: '…동지네. 그럼 가게 문 늦게 여는 거 이해해 주겠지. 다행이다.' },
        { say: '난 일찍 일어나', tier: 'good', remember: 'morning-person', face: 'wow', answer: '대단하다. 그럼 아침에 가게 문 좀 두드려 줘. 세 번은 두드려야 해.' },
        { say: '사장이 그러면 안 되지', tier: 'meh', face: 'calm', answer: '…알아. 힘멜도 그렇게 말해. 근데 졸린 건 졸린 거야.' },
      ],
    },
    {
      id: 'odd-recipe',
      open: '오래된 책 귀퉁이에서 이상한 빵 레시피를 찾았어. 구우면 빵이 살짝 떠.',
      replies: [
        { say: '그런 거 더 모으자', tier: 'great', remember: 'odd-recipe', face: 'wow', answer: '…같이? 좋아. 쓸모없는 레시피일수록 재밌어. 찾으면 알려 줘.' },
        { say: '뜨는 빵은 어디에 써?', tier: 'good', face: 'think', answer: '아무 데도. 그냥 뜨는 거야. 그게 좋은 거야.' },
        { say: '그냥 평범한 빵이 좋아', tier: 'meh', face: 'calm', answer: '…그래. 평범한 빵도 굽긴 해. 가끔.' },
      ],
    },
    {
      id: 'sweet',
      open: '시식용 빵 두 개. 하나는 달고 하나는 짜. 뭐 먹을래?',
      replies: [
        { say: '단 거!', tier: 'great', remember: 'sweet-tooth', face: 'smile', answer: '역시. 단 걸 고르는 사람은 믿을 수 있어. 내 기준이야.' },
        { say: '둘 다 반씩', tier: 'good', answer: '욕심쟁이. 근데 괜찮아. 나도 늘 그렇게 먹어.' },
        { say: '짠 거', tier: 'meh', face: 'think', answer: '…그건 실험작이야. 맛 평가 부탁해. 솔직하게.' },
      ],
    },
    {
      id: 'chest',
      open: '창고에 낡은 상자가 하나 있어. 열어 보고 싶은데… 열어도 될까?',
      replies: [
        { say: '물리면 어떡해. 조심해', tier: 'great', remember: 'chest-warn', face: 'wow', answer: '…어떻게 알았어. 옛날에 몇 번 물렸어. 머리부터. 이번엔 조심할게.' },
        { say: '같이 열어 보자', tier: 'good', remember: 'chest-dive', face: 'smile', answer: '좋아. 네가 뚜껑 잡아. 나는 머리 넣을게. …농담이야. 반쯤.' },
        { say: '그냥 버려', tier: 'meh', face: 'sorry', answer: '…안에 뭐가 있을지 모르잖아. 쓸모없는 마도서일지도.' },
      ],
    },
    {
      id: 'old-friends',
      open: '오늘 편지가 왔어. 옛날에 같이 여행하던 녀석들. 아직 잘 지낸대.',
      replies: [
        { say: '어떤 사람들이었어?', tier: 'great', remember: 'old-friends', face: 'think', answer: ['시끄러운 녀석, 술 좋아하는 녀석, 무뚝뚝한 녀석.', '…그리고 탄 빵도 맛있다고 해 주던 녀석. 다 좋은 사람들이었어.'] },
        { say: '답장 쓸 거야?', tier: 'good', remember: 'letter', answer: '…써야지. 근데 쓰다 보면 십 년이 지나 있어. 이번엔 빨리 써 볼게.' },
        { say: '부럽다', tier: 'meh', face: 'calm', answer: '너도 친구 있잖아. 일곱 명이나. 그게 더 대단해.' },
      ],
    },
    {
      id: 'burnt',
      open: '오늘 빵 좀 탔어. 그래도 맛은 괜찮아. …아마.',
      replies: [
        { say: '탄 빵도 맛있어', tier: 'great', remember: 'burnt-bread', face: 'shy', answer: '…예전에 똑같은 말 한 사람이 있었어. 그래서 탄 빵은 안 버려.' },
        { say: '하나만 줘 봐', tier: 'good', answer: '용감하네. 여기. 솔직한 맛 평가 부탁해.' },
        { say: '새로 구워 줘', tier: 'meh', face: 'calm', answer: '…알았어. 한 시간만 기다려. 아니, 두 시간.' },
      ],
    },
    {
      id: 'time',
      open: '십 년은 잠깐이야. 근데 요즘은 하루가 좀 길게 느껴져. 이상하지.',
      replies: [
        { say: '즐거운 일이 생겨서 그래', tier: 'great', remember: 'time-talk', face: 'think', answer: '…그런가. 그럼 그 즐거운 일이 뭔지 알아봐야겠다. 천천히.' },
        { say: '십 년이 잠깐이라고?', tier: 'good', face: 'laugh', answer: '응. 낮잠 한 번 자면 지나가. 너한텐 이상하게 들리겠지.' },
        { say: '그냥 피곤해서야', tier: 'meh', face: 'calm', answer: '…그럴지도. 자야겠다.' },
      ],
    },
    {
      id: 'flower-field',
      open: '꽃밭을 피우는 마법이 있어. 하나도 쓸모없는데 제일 좋아하는 마법이야.',
      replies: [
        { say: '보여 줄 수 있어?', tier: 'great', remember: 'flower-field', face: 'smile', answer: '…여기선 안 돼. 가게가 꽃집이 되거든. 언젠가 넓은 데서 보여 줄게.' },
        { say: '왜 제일 좋아해?', tier: 'good', face: 'think', answer: '옛날에 그걸 좋아해 준 사람이 있었어. 그것뿐이야. 충분하지.' },
        { say: '쓸모없으면 왜 배워?', tier: 'meh', face: 'calm', answer: '쓸모 있는 것만 배우면 재미없어. 천 년은 길거든.' },
      ],
    },
    {
      id: 'stars',
      open: '큰 유성우는 오십 년에 한 번 와. …아, 숫자는 됐고. 아무튼 드물어.',
      replies: [
        { say: '그때 같이 보자', tier: 'great', remember: 'stars', face: 'shy', answer: '…오십 년 뒤라도? 사람한텐 긴 약속인데. 좋아. 기억해 둘게.' },
        { say: '그냥 별도 예뻐', tier: 'good', answer: '맞아. 유성우 안 와도 별은 매일 있어. 그것도 괜찮지.' },
        { say: '그걸 어떻게 기다려', tier: 'meh', face: 'think', answer: '낮잠 몇 번 자면 와. 나한텐.' },
      ],
    },
    {
      id: 'himmel',
      open: '알바생 힘멜 말이야. 요즘 자꾸 꽃을 가게에 꽂아 둬. 왜 그러는지 모르겠어.',
      replies: [
        { say: '…정말 몰라?', tier: 'great', face: 'think', answer: '…몰라. 뭔데? 알면 알려 줘. 아니, 됐어. 힘멜한테 직접 물어볼게.' },
        { say: '가게가 예뻐지잖아', tier: 'good', answer: '그건 그래. 손님들도 좋아해. 그래서 안 치우고 있어.' },
        { say: '꽃가루 날리겠다', tier: 'meh', face: 'calm', answer: '…그 생각은 못 했네. 근데 그냥 둘래.' },
      ],
    },
    {
      id: 'bread-name',
      open: '새 빵 이름을 못 정했어. 동그랗고, 안에 잼 있고, 가끔 떠.',
      replies: [
        { say: '떠오르는 잼빵', tier: 'great', face: 'smile', answer: '…좋다. 쓸모없이 정확해. 그걸로 할게.' },
        { say: '프리렌빵', tier: 'good', face: 'shy', answer: '…내 이름은 좀. 근데 힘멜이 좋아하겠다.' },
        { say: '그냥 잼빵', tier: 'meh', answer: '그것도 맞는 말이야. 재미는 없지만.' },
      ],
    },
    {
      id: 'nap',
      open: '…음. 아, {me}. 미안, 카운터에서 졸았어. 무슨 일이야?',
      replies: [
        { say: '더 자. 내가 볼게', tier: 'great', face: 'shy', answer: '…진짜? 그럼 오 분만. 손님 오면 깨워. 아니, 안 깨워도 돼.' },
        { say: '빵 사러 왔어', tier: 'good', answer: '아, 응. 골라. 계산은 대충 해도 돼. 나도 대충 받아.' },
        { say: '사장이 졸면 어떡해', tier: 'meh', face: 'calm', answer: '…괜찮아. 빵은 내가 졸아도 부풀어.' },
      ],
    },
    {
      id: 'know-people',
      when: { ch: 3 },
      open: '요즘 사람에 대해 더 알고 싶어졌어. 그래서 말인데… 우선 너부터 알려 줘.',
      replies: [
        { say: '뭐든 물어봐', tier: 'great', face: 'shy', answer: '…그럼 하나씩. 천천히 물어볼게. 시간은 많으니까. 나는.' },
        { say: '왜 나부터야?', tier: 'good', face: 'think', answer: '…모르겠어. 그냥 제일 먼저 떠올랐어. 그게 이유야.' },
        { say: '나는 평범해', tier: 'meh', face: 'calm', answer: '평범한 게 제일 알기 어려워. 천 년 살아도.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '…지금 몇 시야. 새벽이면 아직 밤이지. {me}, 왜 깨어 있어?',
      replies: [
        { say: '프리렌 보러 왔지', tier: 'great', face: 'shy', answer: '…이 시간에? 이상한 사람. 근데 싫진 않아. 들어와. 빵은 아직이야.' },
        { say: '잠이 안 와서', tier: 'good', answer: '그럼 따뜻한 우유. 꿀 넣어서. 그거 마시면 나는 바로 자.' },
        { say: '가게 문 열 시간이야', tier: 'meh', face: 'sorry', answer: '…아직 아니야. 열 시. 열 시쯤. 대략.' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비 오는 날은 반죽이 안 부풀어. 그래서 오늘 빵은 납작해.',
      replies: [
        { say: '납작한 빵도 좋아', tier: 'great', face: 'smile', answer: '…그럼 이거. 납작한 김에 이름도 붙였어. 비 오는 날 빵.' },
        { say: '책 읽기 좋은 날이네', tier: 'good', remember: 'odd-recipe', answer: '응. 오늘은 옛 레시피 책 읽을 거야. 같이 찾아볼래?' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다. 천 번쯤 봤는데 아직 좋아. 따뜻한 우유에 꿀, 그게 규칙이야.',
      replies: [
        { say: '나도 한 잔', tier: 'great', face: 'smile', answer: '좋아. 두 잔. …천 번 봐도 둘이 보는 눈은 처음일지도.' },
        { say: '천 번이나?', tier: 'good', face: 'think', answer: '대충. 세다가 잠들었어. 늘.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring', weather: ['sunny', 'cloudy'] },
      open: '봄이야. 딸기가 제일 달 때. 딸기 타르트 굽는 계절이지.',
      replies: [
        { say: '첫 조각은 나 줘', tier: 'great', remember: 'sweet-tooth', face: 'smile', answer: '…예약 받았어. 가게 연 이래 처음 받는 예약이야.' },
        { say: '딸기 가져다줄까?', tier: 'good', answer: '응. 제일 단 걸로. 하쿠네 과일도 좋은데 네가 가져오면 더 좋아.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish}? 오늘 낚은 거야? …빵에 넣어 볼까. 옛날에 생선 빵 레시피가 있었어.',
      replies: [
        { say: '해 보자! 실험이야', tier: 'great', remember: 'odd-recipe', face: 'wow', answer: '…좋아. 실패하면 같이 먹자. 실패작도 반은 성공이야.' },
        { say: '그건 좀…', tier: 'good', face: 'laugh', answer: '…그치. 나도 그때 실패했어. 그래도 기억에 남는 맛이었어.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물? 반짝이네. 옛날 마법 재료 같아. 쓸모없는 마법에 딱이야.',
      replies: [
        { say: '그걸로 빵 구워 줘', tier: 'great', face: 'smile', answer: '…좋아. 금빛 빵. 이름은 아직 없어. 같이 지어 줘.' },
        { say: '팔 거야', tier: 'meh', face: 'calm', answer: '…그것도 맞는 선택이야. 현명해.' },
      ],
    },
    {
      id: 'op-himmel',
      when: { bond: 'himmel' },
      open: '힘멜 만났어? 오늘 출근하자마자 꽃 사러 갔대. 또야.',
      replies: [
        { say: '누구 주려나 보다', tier: 'great', face: 'think', answer: '…누구? 손님? 아, 가게에 꽂겠지. 늘 그러니까.' },
        { say: '힘멜 착하던데', tier: 'good', answer: '응. 너무 착해서 가끔 걱정돼. 근데 그게 걔야.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '주점 다녀왔구나. 선장이 또 우유를 가득 따라 줬지? 나한테도 그래.',
      replies: [
        { say: '프리렌도 우유 파구나', tier: 'great', face: 'smile', answer: '응. 주점에서 우유 시키는 사람 둘이 있으면 덜 이상해 보여.' },
        { say: '허풍 카드는 해?', tier: 'good', face: 'laugh', answer: '안 해. 표정을 너무 안 바꿔서 다들 싫어해.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '잡화점 다녀왔어? 쓰레쉬가 오래된 마도서 들여왔다던데. 얼마래?',
      replies: [
        { say: '대신 흥정해 줄게', tier: 'great', face: 'wow', answer: '…진짜? 그 사람 나한텐 절대 안 깎아 줘. 너라면 될지도.' },
        { say: '비싸던데', tier: 'good', answer: '역시. 그래도 갖고 싶어. 빵 백 개 팔면 되려나. 오십 년쯤 걸리겠다.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night', weather: ['sunny', 'cloudy'] },
      open: '밤하늘은 천 년 전이랑 거의 똑같아. 별 하나가 좀 옮겨 갔나.',
      replies: [
        { say: '어느 별이 옮겨 갔어?', tier: 'great', remember: 'stars', face: 'think', answer: '저기, 저 작은 거. …아니 저거였나. 아무튼 옮겨 갔어. 아마.' },
        { say: '별 보는 거 좋아?', tier: 'good', answer: '응. 별은 안 서두르잖아. 나랑 비슷해.' },
        { say: '졸려 보여', tier: 'meh', face: 'calm', answer: '…졸려. 들어갈게. 너도 자.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 얼굴이 좀 지쳐 보여. …빵 먹을래? 단 거. 그게 제일 빨라.',
      replies: [
        { say: '고마워. 먹을게', tier: 'great', face: 'smile', answer: '응. 다 먹을 때까지 아무 말 안 할게. 그냥 옆에 있을게.' },
        { say: '괜찮아', tier: 'good', answer: '…괜찮다는 말은 대체로 안 괜찮을 때 해. 천 년 동안 배운 거야.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-sleepy',
      when: { mem: 'sleepyhead', time: ['day', 'evening'] },
      use: 'sleepyhead',
      open: '늦잠 동지. 오늘 몇 시에 일어났어? 난 열한 시. 이겼다.',
      replies: [
        { say: '정오에 일어났어', tier: 'great', face: 'wow', answer: '…졌다. 너 진짜 대단하다. 오늘은 네가 사장 해.' },
        { say: '오늘은 일찍 일어났어', tier: 'good', remember: 'morning-person', face: 'think', answer: '…배신자. 그래도 아침에 가게 문 두드려 줄 수 있겠네.' },
      ],
    },
    {
      id: 'cb-recipe',
      when: { mem: 'odd-recipe', noMem: 'recipe-found' },
      open: '이상한 레시피 같이 모으기로 했잖아. 오늘 하나 찾았어. 구우면 빵이 노래해.',
      replies: [
        { say: '미쿠한테 들려주자', tier: 'great', remember: 'recipe-found', face: 'smile', answer: '…좋은 생각이야. 음이 맞을지는 모르겠지만. 빵이니까.' },
        { say: '어디에 써?', tier: 'good', remember: 'recipe-found', face: 'think', answer: '아무 데도. 그래서 좋은 거라고 했잖아.' },
      ],
    },
    {
      id: 'cb-chest',
      when: { mem: 'chest-warn' },
      use: 'chest-warn',
      open: '창고 상자, 네 말 듣고 막대기로 열어 봤어. …물렸어. 막대기가.',
      replies: [
        { say: '머리 안 넣어서 다행이야', tier: 'great', face: 'laugh', answer: '…응. 네 덕분이야. 처음으로 머리 무사했어.' },
        { say: '안에 뭐 있었어?', tier: 'good', face: 'think', answer: '아무것도. 상자가 배고팠던 것 같아. 빵 하나 줬어.' },
      ],
    },
    {
      id: 'cb-friends',
      when: { mem: 'old-friends' },
      use: 'old-friends',
      open: '전에 옛 동료 얘기 했지. 답장 썼어. 너 얘기도 조금 썼어.',
      replies: [
        { say: '뭐라고 썼어?', tier: 'great', face: 'shy', answer: '…빵을 잘 먹는 사람이 있다고. 그리고 같이 있으면 시간이 빨리 간다고.' },
        { say: '부끄러운데', tier: 'good', face: 'smile', answer: '괜찮아. 걔들 답장 오려면 몇 년 걸려. 그때쯤엔 안 부끄러울 거야.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며. 그걸로 빵 만들어 볼까 생각 중이야.',
      replies: [
        { say: '기대할게', tier: 'great', remember: 'taste-heard', face: 'smile', answer: '…응. 실패해도 먹어 줘. 그게 조건이야.' },
        { say: '빵이 될까?', tier: 'good', remember: 'taste-heard', face: 'think', answer: '뭐든 빵이 돼. 맛있을지는 모르지만.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 다닌 날, 네가 걷는 속도에 맞추느라 좀 빨리 걸었어. 오랜만이었어.',
      replies: [
        { say: '다음엔 내가 맞출게', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…그럼 엄청 느려질 거야. 괜찮아? 꽃 보다 멈추고, 상자 보다 멈추고.' },
        { say: '힘들었어?', tier: 'good', remember: 'outing-talk', answer: '조금. 그래도 재밌었어. 다음에도 가자.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일이지? 케이크 구울게. 떠오르는 케이크는 위험하니까 평범한 걸로.',
      replies: [
        { say: '떠도 좋아!', tier: 'great', remember: 'bday-plan', face: 'laugh', answer: '…그럼 끈 달아 둘게. 날아가면 곤란하니까.' },
        { say: '딸기 많이!', tier: 'good', remember: 'bday-plan', face: 'smile', answer: '알았어. 딸기 산더미. 그건 자신 있어.' },
      ],
    },
  ],
  chapters: [
    {
      title: '늦게 여는 빵집',
      hint: '한 번 이야기를 나누면 프리렌이 시식용 빵을 하나 내밀어요.',
      need: { days: 1 },
      scene: [
        '프리렌이 하품을 하며 오븐에서 빵 하나를 꺼낸다.',
        '"이거. 시식용. 처음 온 손님한테 주는 거야. 가끔."',
        '"삼백 년 전 레시피야. 맛이 이상하면 레시피 탓이야. 내 탓 아니고."',
        '그녀가 무심한 얼굴로 내 반응을 기다린다.',
      ],
      replies: [
        { say: '맛있어! 또 먹고 싶다', tier: 'great', remember: 'sweet-tooth', face: 'smile', answer: '…그래? 다행이다. 그럼 또 와. 늦게 열지만.' },
        { say: '독특한 맛이야', tier: 'good', face: 'think', answer: '정직하네. 맞아, 독특해. 그게 이 레시피의 좋은 점이야.' },
        { say: '좀 탔는데', tier: 'meh', face: 'calm', answer: '…알아. 그래도 맛은 괜찮지? 아마.' },
      ],
    },
    {
      title: '밤에 피는 꽃',
      hint: '밤(게임 시각 저녁 여덟 시부터 자정) 숲에 가 보세요. 프리렌이 꽃을 찾고 있대요.',
      need: { days: 3, points: 20, visit: { area: 'woods', from: 20, to: 24 } },
      scene: [
        '어두운 숲, 프리렌이 쪼그려 앉아 땅을 보고 있다.',
        '"쉿. 여기. 밤에만 피는 꽃이야. 이 숲엔 없을 줄 알았는데."',
        '작은 꽃이 달빛을 받아 천천히 벌어진다.',
        '"이 꽃 보려고 옛날에 몇 년을 걸었어. 여기선 걸어서 오 분이네."',
        '"…같이 봐서 다행이야. 혼자 보면 금방 잊어버리거든."',
      ],
      replies: [
        { say: '이제 안 잊겠다', tier: 'great', remember: 'night-flower', face: 'shy', answer: '…응. 너랑 본 거니까. 그건 오래 기억할게. 천 년쯤.' },
        { say: '예쁘다', tier: 'good', remember: 'night-flower', face: 'smile', answer: '응. 쓸모는 없어. 그래서 좋아.' },
        { say: '벌레 많다…', tier: 'meh', remember: 'night-flower', face: 'calm', answer: '…밤 숲이니까. 금방 갈게. 조금만 더.' },
      ],
    },
    {
      title: '딸기잼 한 병',
      hint: '프리렌이 딸기잼 이야기를 했어요. 딸기잼을 가지고 빵집에 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'jam', take: true } },
      scene: [
        '딸기잼 병을 내밀자 프리렌의 눈이 조금 커진다.',
        '"…이거, 내가 제일 좋아하는 거. 어떻게 알았어?"',
        '그녀가 병을 햇빛에 비춰 본다. 붉은빛이 카운터에 번진다.',
        '"옛날에 여행할 때, 잼 한 병이면 일주일을 버텼어. 아껴 먹으면서."',
        '"이건 아껴 먹지 말아야겠다. 너랑 같이 먹을래."',
      ],
      replies: [
        { say: '빵에 듬뿍 발라 먹자', tier: 'great', remember: 'jam-jar', face: 'laugh', answer: '…듬뿍. 좋은 단어야. 오늘은 사장이 허락할게.' },
        { say: '아껴 먹어도 돼', tier: 'good', remember: 'jam-jar', face: 'smile', answer: '아니야. 맛있는 건 같이 먹을 때 먹어야 해. 그것도 배운 거야.' },
        { say: '그냥 남아서 줬어', tier: 'meh', remember: 'jam-jar', face: 'think', answer: '…그래도 고마워. 남는 걸 나한테 준 거잖아.' },
      ],
    },
    {
      title: '쓸모없는 마법',
      hint: '프리렌과 이상한 레시피를 같이 모으기로 하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'odd-recipe' },
      scene: [
        '가게 문을 닫은 뒤, 프리렌이 낡은 공책을 펼친다.',
        '"모아 둔 레시피들이야. 대부분 쓸모없어. 빵이 뜨거나, 노래하거나."',
        '"근데 이 페이지는 비어 있어. 마지막에 넣을 걸 아직 못 정했거든."',
        '그녀가 손끝을 튕기자 공책 위에 작은 꽃 한 송이가 피어난다.',
        '"…이게 제일 쓸모없는 마법. 너한테 처음 보여 주는 거야."',
      ],
      replies: [
        { say: '제일 좋은 마법이네', tier: 'great', remember: 'useless-magic', face: 'shy', answer: '…그렇게 말해 줄 줄 알았어. 그래서 보여 준 거야.' },
        { say: '나도 배울 수 있어?', tier: 'good', remember: 'useless-magic', face: 'smile', answer: '음… 백 년쯤 걸릴 거야. 그래도 하고 싶으면 알려 줄게.' },
        { say: '빵이랑 무슨 상관이야?', tier: 'meh', remember: 'useless-magic', face: 'think', answer: '상관없어. 그냥 보여 주고 싶었어.' },
      ],
    },
    {
      title: '천 년의 하루',
      hint: '프리렌과 아주 가까워지면 그녀가 시간 이야기를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '저녁, 가게 앞 벤치. 프리렌이 해 지는 쪽을 본다.',
        '"예전엔 사람이랑 지낸 시간을 금방 잊었어. 십 년이 잠깐이라서."',
        '"그래서 후회한 적이 있어. 더 알아 둘걸, 하고."',
        '"…이번엔 그러기 싫어. 너에 대해선."',
        '그녀가 고개를 돌려 나를 본다. 무심한 얼굴인데, 조금 다르다.',
      ],
      replies: [
        { say: '천천히 알아 가자', tier: 'great', face: 'shy', answer: '…응. 꽃밭 마법은 꽃다발 받으면 보여 줄게. 그게 순서인 것 같아.' },
        { say: '다 알려 줄게', tier: 'good', face: 'smile', answer: '다는 말고. 조금씩. 그래야 오래 알 수 있잖아.' },
        { say: '잊어도 괜찮아', tier: 'meh', face: 'think', answer: '…싫어. 이번엔.' },
      ],
    },
    {
      title: '함께 보낼 백 년',
      hint: '프리렌과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '넓은 들판. 프리렌이 손을 들자 발밑부터 꽃이 번져 나간다.',
        '"약속한 꽃밭. 쓸모없는 마법 중에 제일 큰 거야."',
        '"사람의 백 년은 나한텐 짧아. 그래도 그 백 년, 전부 기억할 거야."',
        '"하루도 안 빼고. 그게 이번의 내 다짐이야."',
      ],
      replies: [
        { say: '하루하루 같이 보내자', tier: 'great', face: 'shy', answer: '…응. 늦잠은 자도 돼? 그것만 허락해 줘.' },
        { say: '꽃밭이 끝이 없네', tier: 'good', face: 'smile', answer: '응. 백 년치야. 다 걸으려면 오래 걸릴 거야. 같이 걸어.' },
        { say: '백 년은 너무 길어', tier: 'meh', face: 'think', answer: '…나한텐 짧아. 그러니까 하루도 아깝지 않게.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 했어. 이제 낮잠 시간.',
    '…또 왔네. 빵 하나 가져가. 그냥.',
    '할 말 다 했어. 내일 또 와. 늦게 열지만.',
    '응. 잘 가. 다음엔 더 안 탄 빵 구워 둘게. 아마.',
  ],
};
