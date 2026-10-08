// 가붕 — 항구 등대지기. 목소리 크고 정의감 넘치는 기사형 반말("~다!",
// "기사는 ~한다"). 폭풍이 오면 등대 꼭대기에서 빙글빙글 도는 게 반복 농담,
// 등대 뒤 수풀에 숨는 버릇, 여동생 럭스 과보호, 잔나와 날씨 예보 대결.
// 원작(가렌) 대사는 옮기지 않고 말버릇과 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const GABUNG_TALK: NpcTalkBook = {
  npc: 'gabung',
  memories: {
    'justice-yes': '새치기는 심판해야 한다고 맞장구쳤어요',
    'spin-fan': '폭풍 속 회전을 멋있다고 했어요',
    'bush-secret': '등대 뒤 수풀의 비밀을 알아요',
    'knight-oath': '기사의 맹세 이야기를 들었어요',
    'lux-worry': '럭스 걱정을 같이 들어 줬어요',
    'lunch-love': '럭스 도시락이 최고라고 했어요',
    'forecast-me': '날씨 예보는 가붕 편이라고 했어요',
    'stairs-climb': '등대 계단 백 칸을 같이 오르기로 했어요',
    'night-watch': '밤새 불을 지키는 일이 멋지다고 했어요',
    'armwrestle': '닐라와의 팔씨름을 응원하기로 했어요',
    'home-banner': '고향 깃발 색 이야기를 들었어요',
    'light-name': '등불 이름이 정의의 불꽃인 걸 알아요',
    'hill-light': '뒷산에서 등대 불빛을 함께 봤어요',
    'lunch-shared': '도시락을 나눠 먹은 날이 있어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 순찰한 날을 이야기했어요',
    'bday-plan': '생일에 등불을 깜빡여 주기로 했어요',
    'date-talk': '방에서 조용히 쉬었던 날을 이야기했어요',
  },
  talks: [
    {
      id: 'queue-justice',
      open: '{me}! 오늘 빵집 줄에서 새치기한 놈을 봤다! 너라면 어떻게 하겠나?',
      replies: [
        { say: '맨 뒤로 보내야지!', tier: 'great', remember: 'justice-yes', answer: '바로 그거다! 정의는 줄 서는 데서 시작한다! 너는 기사 감이다!' },
        { say: '좋게 말로 해 볼래', tier: 'good', answer: '음! 그것도 기사의 길이다. 말이 통하면 칼은 필요 없지!' },
        { say: '그냥 모른 척해', tier: 'meh', face: 'think', answer: '모른 척이라니! …아니, 피곤한 날도 있지. 그럴 땐 내가 대신 심판한다!' },
      ],
    },
    {
      id: 'storm-spin',
      open: ['폭풍 오는 날 등대 꼭대기에서 내가 뭘 하는지 소문 들었나?', '…도는 거 아니다. 바람을 살피는 거다. 빙글빙글 살피는 거다!'],
      replies: [
        { say: '멋있던데! 또 돌아 줘', tier: 'great', remember: 'spin-fan', answer: '오오! 알아주는 사람이 있었다! 다음 폭풍엔 한 바퀴 더 돈다!' },
        { say: '어지럽지 않아?', tier: 'good', face: 'laugh', answer: '기사는 어지럽지 않다! …내려와서 잠깐 앉아 있긴 한다!' },
        { say: '위험해 보여', tier: 'meh', face: 'sorry', answer: '럭스도 그 말을 한다. 난간은 꽉 잡고 돈다! 약속한다!' },
      ],
    },
    {
      id: 'bush',
      open: '{me}, 등대 뒤 수풀 말이다. 거기서 나를 봤다는 소문이 있다. 사실이 아니다!',
      replies: [
        { say: '비밀은 지켜 줄게', tier: 'great', remember: 'bush-secret', face: 'shy', answer: '…고맙다. 거기 있으면 마음이 차분해진다. 순찰 지점이다! 정말이다!' },
        { say: '나도 숨어 봐도 돼?', tier: 'good', face: 'laugh', answer: '하하하! 자리가 좁다! 그래도 한 사람 몫은 비켜 주겠다!' },
        { say: '다 봤는데?', tier: 'meh', face: 'wow', answer: '보, 봤다고?! 그건 순찰이었다! 아무한테도 말하지 마라!' },
      ],
    },
    {
      id: 'knight',
      open: '기사단 시절 맹세가 하나 있었다. 지금도 지킨다. 들어 보겠나?',
      replies: [
        { say: '듣고 싶어', tier: 'great', remember: 'knight-oath', answer: ['약한 사람 앞에 서고, 등 뒤를 보이지 않는다.', '칼은 내려놨지만 등불이 그 자리를 대신한다!'] },
        { say: '갑옷은 아직 있어?', tier: 'good', answer: '창고에 있다! 가끔 닦는다. 입으면 계단 백 칸이 지옥이 된다!' },
        { say: '옛날 얘기는 지루해', tier: 'meh', face: 'calm', answer: '음! 솔직해서 좋다. 기사는 지루한 말도 짧게 끝낸다!' },
      ],
    },
    {
      id: 'lux-worry',
      open: '럭스가 새벽 경매에서 또 목청을 터뜨렸다더라. 목 상하면 어쩌나!',
      replies: [
        { say: '걱정하는 마음 알아', tier: 'great', remember: 'lux-worry', answer: '그렇지?! 다들 과보호라고 하는데 이건 오빠의 의무다! 고맙다!' },
        { say: '럭스는 잘할 거야', tier: 'good', answer: '…그래. 그 녀석은 원래 빛나는 녀석이다. 알면서도 걱정이 된다.' },
        { say: '좀 내버려 둬', tier: 'meh', face: 'sorry', answer: '으음! 럭스도 똑같이 말했다. 둘이 짰나? 노력해 보겠다!' },
      ],
    },
    {
      id: 'lunchbox',
      open: '오늘 럭스가 도시락을 싸 줬다! 투덜대면서 줬다! 그래도 줬다!',
      replies: [
        { say: '세상에서 제일 맛있겠다', tier: 'great', remember: 'lunch-love', answer: '바로 그거다! 투덜거림이 양념이다! 한 입 줄까? 아니, 안 된다!' },
        { say: '반찬 뭐 들었어?', tier: 'good', answer: '생선구이 둘, 달걀말이 하나! 생선은 그 녀석이 직접 골랐다!' },
        { say: '직접 싸 먹어', tier: 'meh', face: 'think', answer: '내가 싸면 빵 두 덩이가 끝이다! 기사는 칼은 잘 써도 칼질은 못 한다!' },
      ],
    },
    {
      id: 'forecast',
      open: '잔나가 내일 맑음이라더라. 내 무릎은 비라고 한다! {me}, 누구 편이냐?',
      replies: [
        { say: '당연히 가붕 무릎!', tier: 'great', remember: 'forecast-me', answer: '하하하! 동지를 얻었다! 내일 비 오면 우리 둘의 승리다!' },
        { say: '둘 다 맞으면 좋겠다', tier: 'good', face: 'think', answer: '아침엔 맑고 저녁엔 비? 음! 그것도 공정하군!' },
        { say: '잔나 쪽이 정확하던데', tier: 'meh', face: 'sorry', answer: '크윽! 정직한 대답이다. 기사는 정직을 존중한다! 아프지만!' },
      ],
    },
    {
      id: 'stairs',
      open: '등대 계단이 몇 칸인지 아나? 백 칸이다! 매일 오르내린다!',
      replies: [
        { say: '언젠가 같이 오를래', tier: 'great', remember: 'stairs-climb', answer: '좋다! 쉬엄쉬엄 가자. 꼭대기에서 보는 바다는 상으로 준다!' },
        { say: '다리 튼튼하겠다', tier: 'good', face: 'laugh', answer: '그렇다! 이 다리로 닐라한테 팔씨름은 졌지만! 다리 씨름이면 이긴다!' },
        { say: '듣기만 해도 숨차', tier: 'meh', answer: '하하! 처음엔 다 그렇다. 열 칸마다 쉬는 의자를 둘까 생각 중이다!' },
      ],
    },
    {
      id: 'night-watch',
      open: '밤새 등불을 지키면 바다가 나한테만 말을 거는 것 같다. 이상한가?',
      replies: [
        { say: '그 일, 정말 멋져', tier: 'great', remember: 'night-watch', face: 'shy', answer: '…크흠! 그런 말 들으면 목소리가 작아진다. 고맙다!' },
        { say: '바다가 뭐라는데?', tier: 'good', face: 'think', answer: '조심해라, 잘 자라, 그런 말이다. 사실 다 내가 하고 싶은 말이다!' },
        { say: '졸리지 않아?', tier: 'meh', answer: '안 졸리다! …새벽에 한 번 하품은 한다. 기사도 사람이다!' },
      ],
    },
    {
      id: 'armwrestle',
      open: '닐라가 또 팔씨름 내기를 걸어 왔다! 저번엔 바람이 그쪽 편이었다!',
      replies: [
        { say: '이번엔 꼭 이겨!', tier: 'great', remember: 'armwrestle', answer: '오오! 응원단이 생겼다! 이기면 너한테 갈치 한 마리 바친다!' },
        { say: '팔씨름에 바람이 왜?', tier: 'good', face: 'laugh', answer: '…그건 묻지 마라. 기사도 핑계가 필요할 때가 있다!' },
        { say: '닐라가 더 세던데', tier: 'meh', face: 'sorry', answer: '크윽! 인정한다! 그래서 매일 등불 기름통을 든다! 훈련이다!' },
      ],
    },
    {
      id: 'banner',
      open: '봄마다 등대를 흰색과 금색으로 칠한다. 고향 깃발 색이다.',
      replies: [
        { say: '고향 얘기 해 줘', tier: 'great', remember: 'home-banner', answer: ['하얀 성벽, 금빛 깃발. 다들 원칙을 좋아했다.', '여기 와서 원칙보다 사람이 먼저란 걸 배웠다!'] },
        { say: '등대가 예쁘더라', tier: 'good', answer: '하하! 그 말 페인트한테 전해 주겠다! 올해도 칠할 맛이 난다!' },
        { say: '다른 색도 좋을 텐데', tier: 'meh', face: 'think', answer: '분홍색? 럭스가 그 말 했다가 내가 사흘 동안 졸랐다. 결국 금색이다!' },
      ],
    },
    {
      id: 'light-name',
      open: '등불한테 이름을 붙여 줬다. 뭘까? 맞혀 봐라, {me}!',
      replies: [
        { say: '정의의 불꽃?', tier: 'great', remember: 'light-name', answer: '정답이다! 단번에 맞히다니! 너는 기사의 마음을 안다!' },
        { say: '반짝이?', tier: 'good', face: 'laugh', answer: '그건 럭스가 지은 거다! 나는 반대했다! …가끔 그렇게 부른다!' },
        { say: '이름이 왜 필요해?', tier: 'meh', answer: '밤새 같이 있는 친구한테 이름이 없으면 섭섭하다! 그런 거다!' },
      ],
    },
    {
      id: 'promise-light',
      when: { ch: 3 },
      open: '{me}. 너 사는 쪽으로 불빛이 닿게 등불 갓을 조금 돌려 놨다. 괜찮나?',
      replies: [
        { say: '매일 밤 볼게', tier: 'great', remember: 'night-watch', face: 'shy', answer: '…좋다. 그럼 매일 밤 두 번 깜빡이겠다. 너한테 하는 인사다!' },
        { say: '바다 쪽은 괜찮아?', tier: 'good', answer: '걱정 마라! 배들이 보는 쪽은 그대로다. 남는 빛만 돌렸다!' },
        { say: '눈부셔서 못 자', tier: 'meh', face: 'sorry', answer: '앗! 그건 생각 못 했다! 내일 오른한테 갓을 다시 봐 달라고 하겠다!' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비다! 잔나는 맑다고 했다! 내 무릎이 이겼다! {me}, 증인이 되어 줘라!',
      replies: [
        { say: '내가 증인이야!', tier: 'great', remember: 'forecast-me', answer: '하하하! 신문사에 같이 가자! 오늘 일면은 무릎의 승리다!' },
        { say: '우산부터 쓰자', tier: 'good', answer: '음! 맞는 말이다. 기사는 이겨도 젖지 않는다!' },
        { say: '비가 싫어', tier: 'meh', face: 'calm', answer: '그럼 등대 아래로 와라. 처마가 넓다. 비는 금방 지나간다!' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '폭풍이다! 가슴이 뛴다! {me}, 나는 꼭대기에 올라간다! 말리지 마라!',
      replies: [
        { say: '한 바퀴 크게 돌아!', tier: 'great', remember: 'spin-fan', answer: '오오오! 허락이 떨어졌다! 오늘은 바람보다 빨리 돈다!' },
        { say: '난간 꼭 잡아', tier: 'good', answer: '잡는다! 한 손으로 잡고 한 손으로 돈다! …그게 되나?' },
        { say: '그냥 안에 있어', tier: 'meh', face: 'sorry', answer: '으음… 럭스랑 똑같은 말이다. 알았다. 반 바퀴만 돈다!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 등불 유리에 붙는다. 닦고 내려오는 길이다. {me}, 손 시리지 않나?',
      replies: [
        { say: '네 손이 더 차가워 보여', tier: 'great', face: 'shy', answer: '…크흠! 기사는 추위를 안 탄다! 입김이 좀 나올 뿐이다!' },
        { say: '장갑 끼고 왔어', tier: 'good', answer: '준비성 좋다! 겨울 바다 앞에선 그게 제일 중요하다!' },
        { say: '추워서 집에 갈래', tier: 'meh', answer: '그래라! 길은 내 불빛이 비춰 준다. 미끄러지지 마라!' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽 점검 끝! 등불은 해한테 넘겼다. {me}, 이 시간에 오다니 용감하군!',
      replies: [
        { say: '수고했어, 밤새', tier: 'great', answer: '그 한마디면 밤샘이 하나도 안 아깝다! 고맙다!' },
        { say: '럭스 경매 보러 가', tier: 'good', answer: '나도 간다! 뒤에서 조용히 본다! 과보호 아니다! 구경이다!' },
        { say: '졸려 죽겠어', tier: 'meh', face: 'laugh', answer: '하하! 나도다! 그래도 동트는 바다는 보고 가라. 잠이 깬다!' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤이다! 불은 올렸고 기사는 깨어 있다! {me}, 불빛 안쪽으로만 다녀라!',
      replies: [
        { say: '같이 불빛 지킬래', tier: 'great', remember: 'night-watch', answer: '오! 든든한 동료다! 의자 하나 더 꺼내 오겠다!' },
        { say: '알았어, 조심할게', tier: 'good', answer: '좋다! 기사는 말 잘 듣는 사람을 좋아한다!' },
        { say: '어두운 거 무서워', tier: 'meh', face: 'sorry', answer: '그럼 내가 집까지 비춰 주겠다! 뒤돌아보면 불빛이 있을 거다!' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 등대에 흰색, 금색 깃발을 달았다! 오늘 줄에 새치기는 없다!',
      replies: [
        { say: '네가 서 있으니까!', tier: 'great', answer: '하하하! 그렇다! 오늘 나는 줄의 수호자다!' },
        { say: '깃발 멋있다', tier: 'good', answer: '그렇지! 멀리 배에서도 보인다! 밤엔 등불도 두 번 깜빡인다!' },
        { say: '사람 많아서 피곤해', tier: 'meh', face: 'calm', answer: '그럼 등대 아래 그늘로 와라. 거긴 조용하다. 수풀도 있다!' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: ['hairtail', 'conger'] },
      open: '오! {fish} 잡았나? 밤바다 물고기는 내 불빛 덕이다! 반은 농담이다!',
      replies: [
        { say: '네 불빛 덕분이야', tier: 'great', answer: '하하하! 그 말 듣고 싶었다! 다음 밤낚시도 내가 비춰 주겠다!' },
        { say: '구워 먹을 거야', tier: 'good', answer: '좋다! 밤에 잡은 건 구이가 최고다! 냄새 나면 내가 간다!' },
        { say: '그냥 운이었어', tier: 'meh', answer: '운도 불빛 아래서 오는 거다! 인정해라!' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '망원경으로 다 봤다! 엄청난 놈을 끌어올렸지? 항구의 영웅이다!',
      replies: [
        { say: '기사처럼 버텼지!', tier: 'great', answer: '그렇다! 등을 보이지 않는 낚시꾼이다! 오늘 등불은 너를 위해 켠다!' },
        { say: '팔이 떨어질 뻔했어', tier: 'good', answer: '하하! 닐라랑 팔씨름 한 판 하면 그 정도다! 잘했다!' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙 묻은 손이다! 밭일했나? 땅을 지키는 것도 기사의 일이다!',
      replies: [
        { say: '밭도 내가 지켜!', tier: 'great', answer: '훌륭하다! 너는 밭의 기사다! 쑥만 빼고 다 지켜라!' },
        { say: '허리가 아파', tier: 'good', answer: '등대 계단 오르기를 추천한다! …농담이다. 오늘은 쉬어라!' },
        { say: '바다가 더 좋은데', tier: 'meh', face: 'think', answer: '음! 바다도 밭도 정직하다. 둘 다 잘하면 된다!' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me}, 금별 작물이라고? 금빛이다! 고향 깃발 색이다! 대단하다!',
      replies: [
        { say: '등대에 걸어 둘까?', tier: 'great', answer: '하하하! 등불 옆에 두면 두 배로 빛나겠다! 럭스가 질투하겠군!' },
        { say: '정성 들였어', tier: 'good', answer: '그렇지! 정직하게 키운 건 반드시 보답한다!' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 얼굴이 흐리다. 누가 괴롭혔나? 말만 해라. 심판하러 간다!',
      replies: [
        { say: '그냥 지쳤어', tier: 'great', face: 'calm', answer: '그럼 여기 앉아라. 내가 바다를 볼 테니 너는 아무것도 안 해도 된다.' },
        { say: '심판은 됐어, 고마워', tier: 'good', answer: '…그래. 칼 대신 귀를 빌려주겠다. 언제든 등대로 와라.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '오늘 얼굴이 맑다! 내 예보로는 하루 종일 맑음이다! {me}, 맞지?',
      replies: [
        { say: '완전 맑음!', tier: 'great', answer: '하하하! 이번 예보는 잔나보다 내가 먼저 맞혔다!' },
        { say: '오후엔 흐릴지도', tier: 'meh', face: 'think', answer: '음! 그럼 오후에 다시 와라. 내가 맑게 해 주겠다!' },
      ],
    },
    {
      id: 'op-news',
      when: { news: 'record' },
      open: '오늘 소식 봤나? 기록이 나왔다더라! 정직한 노력은 꼭 빛을 본다!',
      replies: [
        { say: '나도 언젠가!', tier: 'great', answer: '그 마음이면 된다! 그날 등대에서 축포 대신 불빛을 쏘겠다!' },
        { say: '대단하네', tier: 'good', answer: '그렇다! 축하는 크게 해야 한다! 목소리는 내가 맡겠다!' },
      ],
    },
    {
      id: 'op-lux',
      when: { bond: 'lux' },
      open: '럭스 만났나? 그 녀석 밥은 먹었더냐? 목은 괜찮더냐? 내 얘기 하더냐?',
      replies: [
        { say: '오빠 도시락 챙기던데', tier: 'great', remember: 'lunch-love', face: 'shy', answer: '…그, 그랬나! 크흠! 오늘 등불은 특별히 밝게 켜겠다!' },
        { say: '잘 지내더라', tier: 'good', answer: '다행이다! 잘 지내는 걸 알면서도 꼭 묻게 된다. 오빠라서 그렇다!' },
        { say: '질문이 너무 많아', tier: 'meh', face: 'laugh', answer: '하하! 럭스도 똑같이 말한다! 그래서 너한테 묻는 거다!' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 만났다고? 내일 예보 뭐라더냐! 반대로 말해 줄 테니 들어 봐라!',
      replies: [
        { say: '맑대. 근데 난 너 믿어', tier: 'great', remember: 'forecast-me', answer: '하하하! 그럼 나는 비다! 우산 챙겨라! 이번엔 진다고 해도 웃겠다!' },
        { say: '둘이 사이좋게 해', tier: 'good', face: 'think', answer: '사이는 좋다! 예보만 안 맞을 뿐이다! 그게 재미다!' },
      ],
    },
    {
      id: 'op-tsunade',
      when: { bond: 'tsunade' },
      open: '{other} 할머니 뵀나? …내 얘기는 안 하시더냐? 어릴 때 꿀밤이 셌다!',
      replies: [
        { say: '다 큰 기사라고 칭찬하셨어', tier: 'great', face: 'shy', answer: '오오! 정말이냐! 다음에 찾아가서 허리 숙여 인사하겠다!' },
        { say: '꿀밤 얘기 하시던데', tier: 'good', face: 'laugh', answer: '크윽! 그 얘기는 영원히 따라다닌다! 그래도 덕분에 바르게 컸다!' },
      ],
    },
    {
      id: 'op-ornn',
      when: { bond: 'ornn' },
      open: '{other} 대장간 다녀왔나? 등불 갓 고친 거 봤나? 말은 짧은데 솜씨는 길다!',
      replies: [
        { say: '고마워하더라고 전할게', tier: 'great', answer: '그래 줘라! 직접 말하면 둘 다 말이 없어서 어색하다!' },
        { say: '망치 소리가 컸어', tier: 'good', face: 'laugh', answer: '하하! 내 목소리랑 그 망치 소리가 항구에서 제일 크다!' },
      ],
    },
    {
      id: 'op-sinjjajang',
      when: { bond: 'sinjjajang' },
      open: '{other} 봤나? 등대까지 배달 오는 길이 제일 멀다더라. 미안하다고 전해라!',
      replies: [
        { say: '계단 같이 올라 줘', tier: 'great', answer: '그래야겠다! 둘이 숨차면 반씩 나눠 숨찬 거다! 기사의 계산이다!' },
        { say: '내려가서 받으면 되잖아', tier: 'good', answer: '음! 맞는 말이다! 근데 등불을 비울 수 없어서… 반 칸까지만 내려간다!' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other} 만났나? 나 팔씨름 연습하는 거 들키지 않았겠지? 비밀이다!',
      replies: [
        { say: '안 들켰어. 이겨!', tier: 'great', remember: 'armwrestle', answer: '하하하! 이번엔 바람이 내 편이다! 확인했다!' },
        { say: '벌써 다 알던데', tier: 'meh', face: 'sorry', answer: '크윽! 정보전에서 졌다! 그래도 팔씨름은 아직 모른다!' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-justice',
      when: { mem: 'justice-yes' },
      use: 'justice-yes',
      open: '{me}! 저번에 새치기는 맨 뒤라고 했지? 오늘 그 말대로 심판했다!',
      replies: [
        { say: '역시 정의의 기사!', tier: 'great', answer: '하하하! 네 말이 내 칼이 됐다! 오늘 줄은 반듯했다!' },
        { say: '너무 세게 하진 않았지?', tier: 'good', face: 'think', answer: '걱정 마라! 맨 뒤로 보내고 사탕 하나 줬다! 정의에도 단맛이 필요하다!' },
      ],
    },
    {
      id: 'cb-spin',
      when: { mem: 'spin-fan' },
      use: 'spin-fan',
      open: '폭풍 속 회전이 멋있다고 했던 거, 그 뒤로 매일 연습한다! 안 어지럽다!',
      replies: [
        { say: '다음 폭풍엔 꼭 볼게', tier: 'great', answer: '좋다! 꼭대기 밑에서 박수 쳐라! 바람 소리보다 크게!' },
        { say: '연습은 좀 줄여', tier: 'good', face: 'laugh', answer: '하하! 럭스도 그 말 했다! 그럼 하루 걸러 하겠다!' },
      ],
    },
    {
      id: 'cb-bush',
      when: { mem: 'bush-secret' },
      use: 'bush-secret',
      open: '{me}… 수풀 일, 아무한테도 말 안 했지? 덕분에 오늘도 잘 숨었다! 아니, 순찰했다!',
      replies: [
        { say: '끝까지 비밀이야', tier: 'great', face: 'shy', answer: '…너는 믿을 수 있는 사람이다. 수풀 자리 반을 너한테 내주겠다!' },
        { say: '오늘은 왜 숨었어?', tier: 'good', face: 'think', answer: '럭스가 잔소리하러 왔다! 기사도 피할 때가 있다!' },
      ],
    },
    {
      id: 'cb-lux',
      when: { mem: 'lux-worry' },
      use: 'lux-worry',
      open: '저번에 럭스 걱정 들어 줘서 고마웠다. 그 녀석 목, 멀쩡하더라!',
      replies: [
        { say: '다행이다, 오빠', tier: 'great', face: 'laugh', answer: '하하! 너까지 오빠라고 부르면 지키는 사람이 둘이 된다! 좋다!' },
        { say: '거봐, 괜찮다니까', tier: 'good', answer: '음! 알고 있었다! 그래도 확인하는 게 오빠다!' },
      ],
    },
    {
      id: 'cb-stairs',
      when: { mem: 'stairs-climb' },
      use: 'stairs-climb',
      open: '계단 같이 오르기로 한 거 기억한다! 열 칸마다 쉬는 의자, 진짜 놨다!',
      replies: [
        { say: '오늘 같이 오르자', tier: 'great', answer: '좋다! 백 칸 끝에 바다가 기다린다! 기사의 보상이다!' },
        { say: '의자는 너무 친절하다', tier: 'good', face: 'shy', answer: '크흠! 너 오를 때만 쓰는 거다. 나는 안 쉰다! 아마도!' },
      ],
    },
    {
      id: 'cb-armwrestle',
      when: { mem: 'armwrestle' },
      use: 'armwrestle',
      open: '응원해 준 덕분에 닐라랑 비겼다! 비긴 건 진 게 아니다! 그렇지?',
      replies: [
        { say: '그럼! 거의 이긴 거야', tier: 'great', answer: '하하하! 그렇게 말해 주는 너는 정의롭다! 갈치 반 마리 바친다!' },
        { say: '다음엔 이기자', tier: 'good', answer: '그렇다! 기사는 무승부에서 멈추지 않는다!' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 거, {taste}. 맞지? 순찰 수첩에 적어 뒀다!',
      replies: [
        { say: '순찰 수첩에 왜?', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: '지켜야 할 것 목록이다! 너 좋아하는 것도 지킨다! 기사의 일이다!' },
        { say: '기억해 줘서 고마워', tier: 'good', remember: 'taste-heard', answer: '기사는 잊지 않는다! 목소리만 큰 게 아니다!' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 돌아다닌 거, 순찰보다 훨씬 즐거웠다! 또 가자!',
      replies: [
        { say: '다음엔 등대까지!', tier: 'great', remember: 'outing-talk', answer: '좋다! 백 칸 계단 끝까지 같이 가는 거다! 약속이다!' },
        { say: '네 목소리에 다 쳐다봤어', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '하하하! 그건 인사다! 다음엔 목소리를 반만 쓰겠다!' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이지? 그날 밤 등불을 세 번 깜빡이겠다! 창밖을 봐라!',
      replies: [
        { say: '꼭 볼게!', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '좋다! 배들은 헷갈리겠지만 상관없다! 네 생일이 더 중요하다!' },
        { say: '배들이 헷갈리잖아', tier: 'good', remember: 'bday-plan', face: 'think', answer: '음! 그럼 미리 공지를 붙이겠다! 생일 깜빡임이라고!' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에서 조용히 앉아 있던 날, 목소리를 줄여 봤다. 잘 줄었나?',
      replies: [
        { say: '그 목소리도 좋았어', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…그, 그럼 가끔 줄이겠다. 너 앞에서만이다!' },
        { say: '그래도 컸어', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '하하하! 그게 줄인 거였다! 더 연습하겠다!' },
      ],
    },
  ],
  chapters: [
    {
      title: '등대지기의 인사',
      hint: '한 번 이야기를 나누면 가붕이 등대에서 큰 소리로 인사해요.',
      need: { days: 1 },
      scene: [
        '가붕이 등대 문 앞에서 차렷 자세로 선다.',
        '"나는 가붕! 이 항구의 등대지기다! 예전엔 기사였다!"',
        '"{me}, 너를 오늘부터 항구 식구로 인정한다! 이의는 받지 않는다!"',
        '"밤바다가 무서우면 불빛만 보고 와라. 그게 내 약속이다!"',
      ],
      replies: [
        { say: '든든하다, 잘 부탁해!', tier: 'great', answer: '하하하! 좋은 대답이다! 오늘 등불은 너를 위해 조금 더 밝게 켠다!' },
        { say: '목소리가 정말 크네', tier: 'good', face: 'laugh', answer: '그렇다! 안개 낀 날엔 뱃고동 대신 내가 외친다!' },
        { say: '식구는 좀 이르지 않아?', tier: 'meh', face: 'think', answer: '음! 그럼 견습 식구다! 금방 정식이 될 거다!' },
      ],
    },
    {
      title: '뒷산에서 본 불빛',
      hint: '밤(게임 시각 아홉 시부터 자정) 뒷산에 올라가 보세요. 등대 불빛이 다 보인대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 21, to: 24 } },
      scene: [
        '뒷산 꼭대기. 멀리 등대 불빛이 바다를 쓸고 지나간다.',
        '수풀이 부스럭거리더니 가붕이 불쑥 나온다.',
        '"왔구나! 숨어 있던 거 아니다! 기다리던 거다!"',
        '"등불은 오른이 봐 주고 있다. 오늘만 특별히다."',
        '"안에서만 지키다 보면, 밖에서 내 불빛이 어떻게 보이는지 모른다."',
        '"…생각보다 작구나. 그래도 바다엔 충분하다."',
      ],
      replies: [
        { say: '작아도 제일 밝아', tier: 'great', remember: 'hill-light', face: 'shy', answer: '…크흠! 그런 말은 반칙이다! 오늘 밤은 기분 좋게 지키겠다!' },
        { say: '같이 봐서 좋다', tier: 'good', remember: 'hill-light', answer: '그렇다! 지키는 것도 좋지만 가끔은 보는 쪽도 좋다!' },
        { say: '수풀에 있었잖아', tier: 'meh', remember: 'hill-light', face: 'laugh', answer: '그, 그건 순찰이다! 뒷산 순찰! 그런 게 있다!' },
      ],
    },
    {
      title: '럭스의 도시락',
      hint: '가붕이 럭스 도시락 이야기를 했어요. 도시락 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'lunchbox', take: true } },
      scene: [
        '도시락을 내밀자 가붕이 눈을 크게 뜬다.',
        '"이건… 럭스가 싸 준 거랑 보자기가 똑같다! 그 녀석이 시켰나?"',
        '아니라고 하자 가붕이 잠깐 말을 잃는다.',
        '"…그렇군. 네가 직접. 기사는 이런 데 약하다."',
        '"반으로 나누자. 혼자 먹는 도시락보다 둘이 먹는 게 정의다!"',
      ],
      replies: [
        { say: '반씩, 공정하게!', tier: 'great', remember: 'lunch-shared', face: 'laugh', answer: '하하하! 공정함은 기사의 첫째 덕목이다! 생선은 네가 더 먹어라!' },
        { say: '럭스한텐 비밀이야', tier: 'good', remember: 'lunch-shared', answer: '음! 비밀은 지킨다! …그 녀석은 냄새로 알겠지만!' },
        { say: '다 먹어도 돼', tier: 'meh', remember: 'lunch-shared', face: 'think', answer: '안 된다! 나눠 먹어야 맛있다. 그게 크라운가드 집안 규칙이다!' },
      ],
    },
    {
      title: '기사의 맹세',
      hint: '가붕에게서 기사단 시절의 맹세 이야기를 들으면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'knight-oath' },
      scene: [
        '등대 창고. 가붕이 먼지 쌓인 갑옷 앞에 선다.',
        '"맹세 얘기, 기억하지? 약한 사람 앞에 서고 등을 보이지 않는다."',
        '"근데 여기 와서 알았다. 지키기만 하면 외롭다는 걸."',
        '그가 투구를 내려놓고 멋쩍게 웃는다.',
        '"그래서 새 맹세를 하나 더 하려고 한다. 증인이 필요하다, {me}."',
      ],
      replies: [
        { say: '내가 증인이 될게', tier: 'great', face: 'shy', answer: '…좋다. 지키는 사람 옆에도 누가 있어야 한다. 그게 새 맹세다!' },
        { say: '갑옷 한번 입어 봐', tier: 'good', face: 'laugh', answer: '하하! 지금 입으면 계단에서 굴러떨어진다! 맹세만 하겠다!' },
        { say: '맹세는 무거워', tier: 'meh', face: 'calm', answer: '그렇다. 그래서 혼자 들지 않으려는 거다. 천천히 생각해라.' },
      ],
    },
    {
      title: '폭풍 속의 꼭대기',
      hint: '가붕과 아주 가까워지면 폭풍 속 꼭대기에서 진짜 이유를 말해 줘요. 꽃다발 이야기도요.',
      need: { days: 13, points: 96 },
      scene: [
        '폭풍이 지나간 밤, 등대 꼭대기. 바람이 아직 세다.',
        '"폭풍 오면 여기서 도는 거, 진짜 이유를 말해 주겠다."',
        '"무서워서다. 기사도 무섭다. 돌면 무서운 게 날아간다."',
        '"근데 요즘은 안 돌아도 안 무섭다. 너 때문인 것 같다."',
        '"…꽃 같은 거 받으면 깃발처럼 꼭대기에 걸어 둘 텐데. 그냥 한 말이다!"',
      ],
      replies: [
        { say: '말해 줘서 고마워', tier: 'great', face: 'shy', answer: '…크흠! 오늘은 목소리가 안 나온다. 바람 탓이다! 바람 탓!' },
        { say: '같이 돌아 볼까?', tier: 'good', face: 'laugh', answer: '하하하! 둘이 돌면 등대가 돈다! 그래도 해 보자!' },
        { say: '추우니까 내려가자', tier: 'meh', face: 'calm', answer: '그래. 계단은 내가 먼저 내려간다. 넘어지면 받아 주겠다.' },
      ],
    },
    {
      title: '꺼지지 않는 불',
      hint: '가붕과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽, 등불을 끄기 직전. 가붕이 유리를 닦다가 손을 멈춘다.',
        '"{me}. 등불은 해가 뜨면 끈다. 근데 너한테는 끄고 싶지 않다."',
        '"기사로서 말고, 가붕으로서 묻겠다. 평생 지켜도 되겠나?"',
        '"…대답은 천천히 해도 된다. 반지는 아직 고르는 중이니까!"',
      ],
      replies: [
        { say: '평생 지켜 줘', tier: 'great', face: 'laugh', answer: '하하하! 들었나, 바다야! 오늘 등불은 끄지 않는다! 영원히!' },
        { say: '나도 너를 지킬게', tier: 'great', face: 'shy', answer: '…그 말이 제일 강하다. 기사도 지켜지면 울 수 있구나.' },
        { say: '럭스한테 먼저 말해', tier: 'good', face: 'laugh', answer: '크윽! 그게 제일 무서운 관문이다! 같이 가 줘라!' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분하다! 내일 또 등대로 와라!',
    '할 말은 다 했다! 기사는 말보다 행동이다!',
    '불빛 안쪽으로만 다녀라! 그게 오늘의 마지막 명령이다!',
    '또 왔나? 반갑다! 수풀에는 아무도 없다! 정말이다!',
  ],
};
