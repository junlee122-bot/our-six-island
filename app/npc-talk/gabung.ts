// 가붕 — 항구 등대지기. 목소리 크고 정의감 넘치는 기사형 반말("~다!",
// "기사는 ~한다"). 폭풍이 오면 등대 꼭대기에서 빙글빙글 도는 게 반복 농담,
// 등대 뒤 수풀에 숨는 버릇, 여동생 럭스 과보호, 잔나와 날씨 예보 대결.
// 창고 벽의 대검, 흰색·금색 고향 깃발, 줄 세우기와 규율, 츠나데의 꿀밤,
// 닐라와 팔씨름, 오른의 등불 갓, 신짜장의 먼 배달길. 이야기 여섯 장은
// "지키는 사람 옆에도 누가 있어야 한다"는 새 맹세와 두 번 깜빡이는 인사로
// 이어진다. 원작(가렌) 대사는 옮기지 않고 말버릇과 소재만 빌린다.
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
    'sword-care': '창고 벽 대검을 같이 닦기로 했어요',
    'trash-judge': '선착장 쓰레기 심판을 거들기로 했어요',
    'tsunade-tale': '츠나데가 남매를 돌봐 준 이야기를 들었어요',
    'lux-glow': '어린 럭스의 빛을 지켜 준 이야기를 들었어요',
    'home-shout': '힘들 때 고향 이름을 외친다는 걸 알아요',
    'gull-aide': '등대 갈매기 부관의 이름을 알아요',
    'paint-help': '봄에 등대 칠을 돕기로 했어요',
    'rule-book': '등대 규칙 수첩을 구경했어요',
    'home-star': '고향 쪽 별을 같이 찾았어요',
    'quiet-voice': '작게 말하기 연습을 도와주기로 했어요',
    'courage-talk': '용기에 대한 이야기를 나눴어요',
    'iron-rail': '광산 쇠로 난간을 고치기로 했어요',
    'grill-lesson': '생선 굽는 법을 같이 배우기로 했어요',
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
        { say: '맨 뒤로 보내야지!', tier: 'great', remember: 'justice-yes', answer: ['바로 그거다! 정의는 줄 서는 데서 시작한다!', '너는 기사 감이다! 내 옆자리를 비워 두겠다!'] },
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
        { say: '비밀은 지켜 줄게', tier: 'great', remember: 'bush-secret', face: 'shy', answer: ['…고맙다. 거기 있으면 마음이 차분해진다.', '순찰 지점이다! 정말이다! 잎사귀가 좀 붙어 올 뿐이다!'] },
        { say: '나도 숨어 봐도 돼?', tier: 'good', face: 'laugh', answer: '하하하! 자리가 좁다! 그래도 한 사람 몫은 비켜 주겠다!' },
        { say: '다 봤는데?', tier: 'meh', face: 'wow', answer: '보, 봤다고?! 그건 순찰이었다! 아무한테도 말하지 마라!' },
      ],
    },
    {
      id: 'knight',
      open: '기사단 시절 맹세가 하나 있었다. 지금도 지킨다. 들어 보겠나?',
      replies: [
        { say: '듣고 싶어', tier: 'great', remember: 'knight-oath', face: 'calm', answer: ['약한 사람 앞에 서고, 등 뒤를 보이지 않는다.', '칼은 내려놨지만 등불이 그 자리를 대신한다!', '…언젠가 이 맹세에 한 줄을 더하고 싶다. 아직은 비밀이다.'] },
        { say: '갑옷은 아직 있어?', tier: 'good', answer: '창고에 있다! 가끔 닦는다. 입으면 계단 백 칸이 지옥이 된다!' },
        { say: '옛날 얘기는 지루해', tier: 'meh', face: 'calm', answer: '음! 솔직해서 좋다. 기사는 지루한 말도 짧게 끝낸다!' },
      ],
    },
    {
      id: 'lux-worry',
      open: '럭스가 새벽 경매에서 또 목청을 터뜨렸다더라. 목 상하면 어쩌나!',
      replies: [
        { say: '걱정하는 마음 알아', tier: 'great', remember: 'lux-worry', answer: ['그렇지?! 다들 과보호라고 하는데 이건 오빠의 의무다!', '오늘 밤 꿀물 한 병 몰래 가게 앞에 두고 오겠다. 고맙다!'] },
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
        { say: '고향 얘기 해 줘', tier: 'great', remember: 'home-banner', face: 'calm', answer: ['하얀 성벽, 금빛 깃발. 다들 원칙을 좋아했다.', '줄도 반듯, 말도 반듯, 웃음도 반듯했다.', '여기 와서 원칙보다 사람이 먼저란 걸 배웠다!'] },
        { say: '등대가 예쁘더라', tier: 'good', answer: '하하! 그 말 페인트한테 전해 주겠다! 올해도 칠할 맛이 난다!' },
        { say: '다른 색도 좋을 텐데', tier: 'meh', face: 'think', answer: '분홍색? 럭스가 그 말 했다가 내가 사흘 동안 졸랐다. 결국 금색이다!' },
      ],
    },
    {
      id: 'light-name',
      open: '등불한테 이름을 붙여 줬다. 뭘까? 맞혀 봐라, {me}!',
      replies: [
        { say: '정의의 불꽃?', tier: 'great', remember: 'light-name', face: 'wow', answer: '정답이다! 단번에 맞히다니! 너는 기사의 마음을 안다!' },
        { say: '반짝이?', tier: 'good', face: 'laugh', answer: '그건 럭스가 지은 거다! 나는 반대했다! …가끔 그렇게 부른다!' },
        { say: '이름이 왜 필요해?', tier: 'meh', answer: '밤새 같이 있는 친구한테 이름이 없으면 섭섭하다! 그런 거다!' },
      ],
    },
    {
      id: 'sword-wall',
      open: ['창고 벽에 대검이 하나 걸려 있다. 고향에서 들고 온 거다.', '지금은 쓸 일이 없다. 그래도 한 달에 한 번은 닦는다!'],
      replies: [
        { say: '다음엔 같이 닦자', tier: 'great', remember: 'sword-care', face: 'shy', answer: ['…좋다! 기름 먹인 천을 두 장 준비하겠다.', '칼날은 내가, 손잡이는 네가. 그게 공평하다!'] },
        { say: '들어 보면 무거워?', tier: 'good', face: 'laugh', answer: '무겁다! 들고 한 바퀴 돌면 등대가 같이 도는 기분이다!' },
        { say: '칼은 좀 무서워', tier: 'meh', face: 'calm', answer: '그래서 벽에 걸어 뒀다. 지금 내 칼은 등불이다. 안심해라!' },
      ],
    },
    {
      id: 'trash-judge',
      open: '선착장에 생선 상자를 버리고 간 놈이 있다! 오늘 밤 잠복한다!',
      replies: [
        { say: '나도 같이 지킬래', tier: 'great', remember: 'trash-judge', answer: ['좋다! 정의의 잠복조 결성이다!', '잡으면 같이 줍게 하고 끝낸다. 심판은 깔끔해야 한다!'] },
        { say: '팻말을 붙여 보면?', tier: 'good', face: 'think', answer: '오! 버리지 마라, 등대지기가 본다. 그렇게 쓰겠다! 크게!' },
        { say: '그냥 치우면 되잖아', tier: 'meh', face: 'sorry', answer: '치우는 건 이미 했다! 근데 내일 또 버리면? 그래서 잠복이다!' },
      ],
    },
    {
      id: 'tsunade-bonk',
      open: '어릴 때 우리 남매를 돌봐 준 분이 츠나데 할머니다. 꿀밤이 셌다!',
      replies: [
        { say: '어떤 꿀밤이었어?', tier: 'great', remember: 'tsunade-tale', face: 'laugh', answer: ['지붕에서 뛰어내릴 때마다 한 대씩이다!', '럭스는 나를 말리다 같이 떨어져서 반 대만 맞았다!', '…그 꿀밤 덕에 바르게 컸다. 지금은 감사하다!'] },
        { say: '지금도 무서워?', tier: 'good', face: 'shy', answer: '무섭다! 그 앞에선 아직도 목소리가 반으로 준다!' },
        { say: '맞을 짓을 했네', tier: 'meh', face: 'sorry', answer: '크윽! 부정할 수 없다. 기사는 사실을 부정하지 않는다!' },
      ],
    },
    {
      id: 'lux-glow',
      open: ['럭스는 어릴 때 손에서 빛이 새곤 했다. 본인은 숨기려 했지.', '고향에선 그런 걸 이상하게 봤다. 나는 그게 걱정이었다.'],
      replies: [
        { say: '오빠가 지켜 줬구나', tier: 'great', remember: 'lux-glow', face: 'calm', answer: ['…못 본 척하는 게 내 방식이었다. 누가 보면 내가 앞에 섰다.', '지금은 그 빛으로 생선 비늘을 비춘다더라. 다행이다.'] },
        { say: '지금은 괜찮아?', tier: 'good', answer: '괜찮다! 이 섬은 반짝이는 걸 좋아한다. 그래도 나는 계속 본다!' },
        { say: '그냥 신기하다', tier: 'meh', face: 'think', answer: '신기하지. 나도 처음엔 그랬다. 신기한 거랑 걱정은 같이 온다.' },
      ],
    },
    {
      id: 'home-shout',
      open: '힘들 땐 고향 이름을 크게 외친다. 그러면 다리에 힘이 들어간다!',
      replies: [
        { say: '나도 따라 외칠래', tier: 'great', remember: 'home-shout', face: 'laugh', answer: ['좋다! 하나 둘 셋 하면 같이다!', '…음, 너는 네 고향 이름을 외쳐라. 우리 섬 이름도 좋다!'] },
        { say: '고향이 그리워?', tier: 'good', face: 'calm', answer: '가끔. 근데 외치고 나면 여기 바다가 대답한다. 그래서 괜찮다.' },
        { say: '갈매기 놀라겠다', tier: 'meh', face: 'sorry', answer: '이미 놀랐다! 부관이 사흘 동안 등대에 안 왔다!' },
      ],
    },
    {
      id: 'fog-voice',
      open: '봄 안개가 짙으면 뱃고동 대신 내가 외친다. 이쪽이다, 하고!',
      replies: [
        { say: '그 목소리면 다 들려', tier: 'great', face: 'wow', answer: '하하하! 그렇다! 이 목소리가 처음으로 쓸모 있던 날이었다!' },
        { say: '목 안 아파?', tier: 'good', face: 'shy', answer: '아프다! 그래서 럭스가 꿀물을 챙겨 준다. 투덜대면서!' },
        { say: '조금 시끄러울 듯', tier: 'meh', answer: '안개 날엔 시끄러운 게 정의다! 맑은 날엔 줄이겠다. 아마도!' },
      ],
    },
    {
      id: 'gull-aide',
      open: '등대 난간에 늘 앉는 갈매기가 있다. 이름을 지어 줬다. 부관이다!',
      replies: [
        { say: '부관, 멋진 이름이다', tier: 'great', remember: 'gull-aide', face: 'laugh', answer: ['그렇지! 아침마다 보고하러 온다! 생선 달라는 보고다!', '근무 태도는 엉망이지만 의리는 있다!'] },
        { say: '말은 잘 들어?', tier: 'good', face: 'think', answer: '전혀! 내 모자를 가져간 적도 있다. 그래도 부관이다!' },
        { say: '갈매기는 시끄럽던데', tier: 'meh', answer: '나만큼은 아니다! 그래서 둘이 잘 맞는다!' },
      ],
    },
    {
      id: 'paint-spring',
      open: '봄이 오면 등대를 새로 칠한다. 사다리가 길다. 손이 하나 모자란다!',
      replies: [
        { say: '그 손, 내가 할게', tier: 'great', remember: 'paint-help', answer: ['좋다! 너는 흰색, 나는 금색이다!', '끝나면 페인트 묻은 손으로 생선구이를 먹는 게 전통이다!'] },
        { say: '오른한테 부탁해 봐', tier: 'good', face: 'think', answer: '오른은 갓 고치느라 바쁘다. 그리고 둘이 칠하면 너무 조용하다!' },
        { say: '높은 데는 싫어', tier: 'meh', face: 'calm', answer: '그럼 아래서 통만 들어 줘라. 그것도 큰 도움이다!' },
      ],
    },
    {
      id: 'rule-book',
      open: '등대 규칙 수첩을 만들었다! 첫째, 불은 꺼뜨리지 않는다! 들어 볼 텐가?',
      replies: [
        { say: '둘째는 뭔데?', tier: 'great', remember: 'rule-book', face: 'laugh', answer: ['둘째, 새치기 정박 금지! 셋째, 계단에서 뛰지 않는다!', '넷째는… 수풀은 순찰 지점이다. 이건 내가 쓴 거다!'] },
        { say: '규칙이 많으면 피곤해', tier: 'good', face: 'think', answer: '음! 그래서 다섯 개로 줄였다. 고향에선 백 개였다!' },
        { say: '나중에 들을게', tier: 'meh', answer: '좋다! 수첩은 도망가지 않는다. 기사도 기다릴 줄 안다!' },
      ],
    },
    {
      id: 'home-star',
      open: '맑은 밤엔 북쪽 하늘에 밝은 별이 하나 있다. 고향 쪽에 뜨는 별이다.',
      replies: [
        { say: '나도 찾아 볼게', tier: 'great', remember: 'home-star', face: 'shy', answer: ['좋다! 등대 불빛 바로 위다. 금방 보인다.', '…누가 같이 봐 주면 덜 그립다. 그렇더라.'] },
        { say: '별 이름이 뭐야?', tier: 'good', answer: '고향에선 깃발별이라고 불렀다. 금빛이라서다!' },
        { say: '별은 다 비슷해', tier: 'meh', face: 'calm', answer: '그렇게 보일 수도 있다. 나한텐 하나가 조금 더 밝을 뿐이다.' },
      ],
    },
    {
      id: 'quiet-voice',
      open: '럭스가 나더러 목소리를 반으로 줄이라더라. 연습 중이다. 들어 봐라!',
      replies: [
        { say: '내가 연습 도와줄게', tier: 'great', remember: 'quiet-voice', face: 'laugh', answer: ['고맙다! …이게 작게 말한 거다! 들렸나?', '하하하! 들렸으면 실패다! 매일 조금씩 줄이겠다!'] },
        { say: '지금 목소리도 좋아', tier: 'good', face: 'shy', answer: '…크흠! 그런 말 들으면 연습할 마음이 사라진다!' },
        { say: '그건 무리일 듯', tier: 'meh', face: 'sorry', answer: '크윽! 럭스도 그렇게 말했다. 그래도 기사는 포기하지 않는다!' },
      ],
    },
    {
      id: 'courage',
      open: '{me}, 용기가 뭐라고 생각하나? 나는 요즘 그게 헷갈린다.',
      replies: [
        { say: '무서워도 하는 거?', tier: 'great', remember: 'courage-talk', face: 'think', answer: ['…그렇다. 안 무서운 게 용기인 줄 알았다.', '무서운 걸 들키고도 서 있는 게 진짜다. 너한테 배웠다!'] },
        { say: '앞에 나서는 거', tier: 'good', answer: '음! 고향에선 그렇게 배웠다. 맨 앞줄에 서는 것이 용기라고!' },
        { say: '잘 모르겠어', tier: 'meh', face: 'calm', answer: '그래. 나도 모른다. 모르는 채로 오늘 밤 불을 켜는 거다.' },
      ],
    },
    {
      id: 'iron-rail',
      open: '등대 난간이 녹슬었다. 광산에서 좋은 쇠가 나오면 갈아 끼우고 싶다!',
      replies: [
        { say: '쇠 캐 오면 줄게', tier: 'great', remember: 'iron-rail', answer: ['오오! 그럼 오른한테 맡겨 두드리겠다!', '새 난간에는 네 이름을 작게 새긴다! 기사의 감사다!'] },
        { say: '금도 좋아해?', tier: 'good', face: 'laugh', answer: '좋아한다! 금빛은 고향 깃발 색이다! 근데 난간엔 아깝다!' },
        { say: '광산은 어두워', tier: 'meh', face: 'think', answer: '그렇다. 그럴 땐 내 등불 하나 빌려주겠다. 작은 거다!' },
      ],
    },
    {
      id: 'grill-lesson',
      open: '생선을 구웠는데 한쪽은 숯, 한쪽은 날것이다. 이건 정의롭지 않다!',
      replies: [
        { say: '같이 다시 구워 보자', tier: 'great', remember: 'grill-lesson', face: 'laugh', answer: ['좋다! 불은 약하게, 마음은 굳게! 그게 비결이라더라!', '럭스한테 들킨 건 비밀이다. 들키면 도시락이 끊긴다!'] },
        { say: '숯 쪽만 떼고 먹어', tier: 'good', answer: '음! 그렇게 했다! 반은 맛있었다! 반의 승리다!' },
        { say: '사 먹는 게 낫겠다', tier: 'meh', face: 'sorry', answer: '크윽! 신짜장도 같은 말을 했다! 다들 내 불 조절을 못 믿는다!' },
      ],
    },
    {
      id: 'janna-score',
      open: '신문에 예보 대결 점수표가 실린다! 요즘은 잔나가 조금 앞선다!',
      replies: [
        { say: '역전할 수 있어!', tier: 'great', remember: 'forecast-me', answer: ['그렇다! 내 무릎은 가을에 강하다!', '잔나도 좋은 맞수다. 지면 진심으로 축하해 줄 거다! 대신 크게!'] },
        { say: '점수가 뭐가 중요해', tier: 'good', face: 'think', answer: '음! 맞다. 배들이 안 젖으면 그게 이긴 거다. 그래도 이기고 싶다!' },
        { say: '잔나가 더 잘 맞히던데', tier: 'meh', face: 'sorry', answer: '크윽! 오늘 두 번째로 듣는 말이다! 기사는 아파도 웃는다!' },
      ],
    },
    {
      id: 'delivery-stairs',
      open: '신짜장이 등대까지 편지를 가져올 때마다 계단에서 숨을 몰아쉰다.',
      replies: [
        { say: '아래 우편함을 달자', tier: 'great', face: 'wow', answer: ['그거다! 왜 그 생각을 못 했지! 오늘 당장 단다!', '…그래도 가끔은 올라오라고 해야겠다. 꼭대기 바람이 좋다.'] },
        { say: '같이 오르는 거 좋잖아', tier: 'good', face: 'laugh', answer: '그렇다! 둘이 숨차면 반씩 숨찬 거다! 기사의 계산이다!' },
        { say: '편지를 덜 받으면 돼', tier: 'meh', answer: '럭스 편지는 안 된다! 그 녀석 편지는 한 줄이라도 받는다!' },
      ],
    },
    {
      id: 'ornn-words',
      open: '오른이랑 등불 갓 이야기를 했다. 세 마디로 끝났다. 훌륭한 대화였다!',
      replies: [
        { say: '말이 적어도 통하네', tier: 'great', answer: ['그렇다! 그 사람 망치 소리가 말보다 정확하다!', '나는 백 마디 하고 오른은 세 마디. 합치면 딱 좋다!'] },
        { say: '뭐라고 했는데?', tier: 'good', face: 'laugh', answer: '오른: 고쳤다. 나: 고맙다! 오른: 응. 끝이다! 훌륭하다!' },
        { say: '너만 떠든 거 아냐?', tier: 'meh', face: 'sorry', answer: '…그럴지도 모른다. 오른은 듣는 걸 잘한다. 그것도 재능이다.' },
      ],
    },
    {
      id: 'squid-lights',
      open: '여름밤엔 오징어 배 불빛이 바다를 덮는다. 내 등불이 묻힐 지경이다!',
      replies: [
        { say: '그래도 네 불이 제일 커', tier: 'great', face: 'laugh', answer: '하하하! 그렇다! 크기도 정의도 내가 제일이다!' },
        { say: '바다가 예쁘겠다', tier: 'good', face: 'calm', answer: '예쁘다. 다들 집에 잘 돌아갈 불빛이라 더 그렇다.' },
        { say: '경쟁할 필요 있어?', tier: 'meh', face: 'think', answer: '음! 없다. 그래도 기사는 뭐든 이기고 싶어 한다. 버릇이다!' },
      ],
    },
    {
      id: 'snail-wall',
      open: '비 온 뒤엔 등대 벽에 달팽이가 줄지어 오른다. 줄은 잘 선다. 근데 싫다!',
      replies: [
        { say: '줄 잘 서면 봐줘', tier: 'great', face: 'laugh', answer: ['…크흠! 그 말이 맞다. 새치기하는 놈은 없었다.', '좋다! 휴전이다! 대신 등불 유리는 넘보지 마라!'] },
        { say: '왜 싫은데?', tier: 'good', face: 'think', answer: '너무 느리다! 기다리다 보면 내가 수풀에 숨고 싶어진다!' },
        { say: '귀엽던데', tier: 'meh', face: 'sorry', answer: '귀엽다니! …럭스도 그 말 했다. 우리 집에선 내가 소수파다.' },
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
    {
      id: 'two-chairs',
      when: { ch: 5 },
      open: '등대 꼭대기에 의자를 하나 더 놨다. 누구 자리인지는 묻지 마라!',
      replies: [
        { say: '내 자리 맞지?', tier: 'great', face: 'shy', answer: ['…크흠! 묻지 말라고 했다! 맞다!', '방석은 럭스가 골랐다. 그 녀석, 다 알고 있었다.'] },
        { say: '부관 자리 아니야?', tier: 'good', face: 'laugh', answer: '하하하! 부관은 난간이면 충분하다! 의자는 사람 몫이다!' },
        { say: '바람 불면 날아가', tier: 'meh', face: 'think', answer: '음! 그래서 밧줄로 묶어 뒀다. 기사의 준비는 철저하다!' },
      ],
    },
    {
      id: 'night-walk',
      when: { love: 'dating' },
      open: '{me}, 오늘 순찰은 방파제 끝까지다. 손 잡고 가도 되겠나? 안전 때문이다!',
      replies: [
        { say: '안전 때문에, 응', tier: 'great', face: 'shy', answer: ['…좋다! 안전이다! 다른 이유는 없다!', '…하나 있다. 그냥 잡고 싶었다. 끝이다!'] },
        { say: '부관도 데려가자', tier: 'good', face: 'laugh', answer: '그 녀석은 눈치가 없다! 오늘은 둘이서다!' },
        { say: '추운데 다음에', tier: 'meh', face: 'calm', answer: '그래. 그럼 등대 안에서 차 한 잔 하자. 그것도 순찰이다.' },
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
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '구름이 낮다! 등대지기한테 흐린 날은 제일 바쁜 날이다! {me}, 도와줄 텐가?',
      replies: [
        { say: '뭐든 시켜 줘!', tier: 'great', answer: ['좋다! 망원경 닦기 임무를 맡긴다!', '구름 너머 배가 보이면 크게 외쳐라! 나보다 크게!'] },
        { say: '오후엔 갤 거래', tier: 'good', face: 'think', answer: '잔나 예보군! 이번엔 나도 같은 생각이다. 비긴 걸로 하자!' },
        { say: '흐리면 졸려', tier: 'meh', face: 'calm', answer: '그럼 계단참에서 한숨 자라. 깨울 땐 작게 깨우겠다. 노력한다!' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny', time: 'day' },
      open: '맑다! 바다가 거울 같다! 오늘은 망원경으로 수평선 끝까지 보인다!',
      replies: [
        { say: '나도 한번 보여 줘', tier: 'great', face: 'laugh', answer: ['좋다! 오른쪽 끝이 럭스 가게 쪽이다.', '…아니, 거긴 보지 마라! 왼쪽 바다만 봐라!'] },
        { say: '잔나 예보 맞았네', tier: 'good', face: 'sorry', answer: '크윽! 오늘은 인정한다! 기사는 맑은 날에 너그럽다!' },
        { say: '눈부셔', tier: 'meh', answer: '그럼 등대 그늘로 와라! 그늘도 내가 지킨다!' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽 점검 끝! 등불은 해한테 넘겼다. {me}, 이 시간에 오다니 용감하군!',
      replies: [
        { say: '수고했어, 밤새', tier: 'great', face: 'shy', answer: '그 한마디면 밤샘이 하나도 안 아깝다! 고맙다!' },
        { say: '럭스 경매 보러 가', tier: 'good', answer: '나도 간다! 뒤에서 조용히 본다! 과보호 아니다! 구경이다!' },
        { say: '졸려 죽겠어', tier: 'meh', face: 'laugh', answer: '하하! 나도다! 그래도 동트는 바다는 보고 가라. 잠이 깬다!' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '해가 진다! 곧 불 올릴 시간이다! {me}, 심지에 불 붙이는 거 볼 텐가?',
      replies: [
        { say: '보고 싶어!', tier: 'great', face: 'wow', answer: ['좋다! 숨 참고 봐라! 불이 붙는 순간 바다가 대답한다!', '…방금 봤나? 저 배가 뱃고동을 울렸다! 인사다!'] },
        { say: '노을이 예쁘다', tier: 'good', face: 'calm', answer: '그렇다. 노을이 지면 내 차례다. 바통을 넘겨받는 기분이다.' },
        { say: '배고파서 가야 해', tier: 'meh', answer: '그래! 밥은 중요하다! 가는 길은 내가 비춰 주겠다!' },
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
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이다! 등대 칠할 계절이다! 흰색 한 통, 금색 한 통 사 왔다!',
      replies: [
        { say: '붓 하나 더 있어?', tier: 'great', remember: 'paint-help', face: 'laugh', answer: '있다! 사실 두 개 사 왔다! 누가 올 줄 알았다!' },
        { say: '안개 조심해', tier: 'good', answer: '고맙다! 안개 끼면 칠은 쉬고 외치기를 한다! 이쪽이다, 하고!' },
        { say: '페인트 냄새 싫어', tier: 'meh', face: 'sorry', answer: '음! 그럼 바람 부는 쪽에 서라. 냄새는 바다로 보내겠다!' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', time: ['evening', 'night'] },
      open: '여름밤이다! 오징어 배 불빛이 바다에 깔렸다! 내 불빛과 대결이다!',
      replies: [
        { say: '네 불이 이겼어!', tier: 'great', face: 'laugh', answer: '하하하! 심판이 공정하다! 오늘 밤 승리를 바다에 바친다!' },
        { say: '같이 보니까 예쁘다', tier: 'good', face: 'calm', answer: '…그렇다. 대결이라고 했지만 사실 저 불빛들이 좋다.' },
        { say: '모기가 많아', tier: 'meh', answer: '등대 꼭대기엔 모기도 못 올라온다! 백 칸이 성벽이다!' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이다! 갈치가 올라온다! {me}, 밤낚시 가면 내가 비춰 주겠다!',
      replies: [
        { say: '약속이야, 비춰 줘!', tier: 'great', answer: ['약속이다! 너 있는 쪽은 특별히 오래 비춘다!', '잡으면 반은 구이, 반은 럭스 가게다! 공정하게!'] },
        { say: '가을바람 좋다', tier: 'good', face: 'calm', answer: '그렇지. 가을바람은 정직하다. 예보가 쉬워서 잔나한테 미안하다!' },
        { say: '밤엔 졸려', tier: 'meh', face: 'think', answer: '그럼 새벽에 와라! 갈치는 기다려 주지 않지만 나는 기다린다!' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter', time: ['dawn', 'day'] },
      open: '겨울 바다는 거칠다! 방파제 끝엔 혼자 가지 마라! 기사의 명령이다!',
      replies: [
        { say: '네가 같이 가 줘', tier: 'great', face: 'shy', answer: '…좋다! 호위는 내 전문이다! 목도리는 단단히 매라!' },
        { say: '명령은 좀 세다', tier: 'good', face: 'laugh', answer: '하하! 그럼 부탁이다! 큰 목소리의 부탁이다!' },
        { say: '추워서 안 가', tier: 'meh', answer: '그게 제일 현명하다! 따뜻한 데 있어라. 바다는 내가 본다!' },
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
      id: 'op-festival-night',
      when: { festival: true, time: 'night' },
      open: '축제 밤이다! 등불을 금빛 갓으로 바꿨다! 바다가 축하받는 중이다!',
      replies: [
        { say: '등불도 축제 옷 입었네', tier: 'great', face: 'laugh', answer: '그렇다! 오른이 하루 만에 만들어 줬다! 말은 한 마디였다!' },
        { say: '배들이 헷갈리지 않아?', tier: 'good', face: 'think', answer: '미리 신문에 실었다! 잔나가 써 줬다. 예보 칸 옆에!' },
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
      id: 'op-squid',
      when: { fish: ['squid', 'horsemackerel'] },
      open: '{fish}! 불빛 따라 올라오는 녀석이다! 내 등불의 손님을 낚았군!',
      replies: [
        { say: '손님, 잘 모셨어!', tier: 'great', face: 'laugh', answer: '하하하! 그렇다! 정중하게 모셔라! 구이로!' },
        { say: '등불이 낚싯대야?', tier: 'good', face: 'think', answer: '음! 반은 맞다. 나는 지키고 너는 낚고! 협동이다!' },
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
        { say: '그냥 지쳤어', tier: 'great', face: 'calm', answer: ['그럼 여기 앉아라. 내가 바다를 볼 테니 너는 아무것도 안 해도 된다.', '…불빛 도는 거 세다 보면 잠이 온다. 나도 가끔 그런다.'] },
        { say: '심판은 됐어, 고마워', tier: 'good', face: 'calm', answer: '…그래. 칼 대신 귀를 빌려주겠다. 언제든 등대로 와라.' },
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
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '혼례 소식이다! 오늘 밤 등불은 축하로 세 번 깜빡인다! 정식이다!',
      replies: [
        { say: '로맨틱하다', tier: 'great', face: 'shy', answer: ['…크흠! 그런 단어는 내 수첩에 없다!', '없지만… 오늘은 적어 두겠다. 작은 글씨로.'] },
        { say: '축사는 네가 해', tier: 'good', face: 'laugh', answer: '하하! 내가 하면 산 너머까지 들린다! 그래서 늘 사양당한다!' },
        { say: '난 아직 멀었어', tier: 'meh', face: 'calm', answer: '음! 서두를 거 없다. 등불도 천천히 데워야 오래 간다.' },
      ],
    },
    {
      id: 'op-bday-news',
      when: { friendNews: 'birthday' },
      open: '오늘 생일인 친구가 있다더라! 생일엔 큰 목소리로 축하해야 한다!',
      replies: [
        { say: '같이 축하하러 가자', tier: 'great', answer: '좋다! 나는 노래, 너는 박수다! 노래는 짧게 하겠다! 아마도!' },
        { say: '선물은 뭐 해?', tier: 'good', face: 'think', answer: '생선구이다! 내가 구우면 반은 숯이니까 럭스한테 부탁한다!' },
      ],
    },
    {
      id: 'op-legend',
      when: { friendNews: 'legend' },
      open: '전설의 물고기를 낚은 사람이 있다더라! 그날 밤 내 불빛이 비췄을 거다!',
      replies: [
        { say: '분명 네 덕이야', tier: 'great', face: 'laugh', answer: '하하하! 신문에 한 줄 실어 달라고 잔나한테 부탁해야겠다!' },
        { say: '나도 낚고 싶다', tier: 'good', answer: '그 마음이다! 가을 보름밤에 와라! 내가 제일 밝게 켜 두겠다!' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다 다녀왔지? 망원경으로 돌아오는 배를 봤다! 무사해서 다행이다!',
      replies: [
        { say: '네 불빛 보고 왔어', tier: 'great', face: 'shy', answer: ['…그랬나. 크흠! 그 말이 등대지기한테 제일 큰 상이다.', '다음 항해 때도 꼭 켜 두겠다. 맹세한다!'] },
        { say: '파도가 셌어', tier: 'good', face: 'think', answer: '알고 있었다! 내 무릎이 쑤셨다! 다음엔 미리 말해 주겠다!' },
        { say: '별일 없었어', tier: 'meh', answer: '별일 없는 게 제일이다! 기사는 조용한 바다를 사랑한다!' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관에 뭔가 기증했다더라! 오래 남을 걸 지키는 일, 기사의 일과 같다!',
      replies: [
        { say: '대검도 기증할래?', tier: 'great', face: 'laugh', answer: '안 된다! 그건 아직 내 거다! …언젠가 생각해 보겠다!' },
        { say: '뿌듯했어', tier: 'good', answer: '좋다! 뿌듯함은 오래 간다! 등불 기름보다 오래!' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노에서 잃었다는 소문이 바닷바람에 실려 왔다. 괜찮나?',
      replies: [
        { say: '다음엔 안 갈래', tier: 'great', face: 'calm', answer: ['훌륭한 결단이다! 물러설 줄 아는 것도 기사의 덕목이다.', '대신 등대 계단을 오르자. 땀은 배신하지 않는다!'] },
        { say: '조금 속상해', tier: 'good', face: 'sorry', answer: '그럴 수 있다. 생선구이 하나 사 주겠다. 숯 안 묻은 걸로!' },
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
    {
      id: 'op-with-lux',
      when: { with: 'lux' },
      open: ['{me}! 마침 잘 왔다! 지금 {other} 목 상태를 점검하는 중이다!', '…럭스가 눈을 흘긴다. 점검은 잠시 미루겠다!'],
      replies: [
        { say: '럭스 편 들어 줄게', tier: 'great', face: 'laugh', answer: ['크윽! 둘이 한편이냐! 오빠는 외롭다!', '…그래도 둘이 친한 건 좋다. 아주 좋다!'] },
        { say: '목은 괜찮아 보여', tier: 'good', answer: '그래? 증인이 있으니 믿겠다! 오늘은 꿀물만 주고 물러난다!' },
        { say: '남매 싸움은 빠질게', tier: 'meh', face: 'sorry', answer: '싸움이 아니다! 걱정이다! …럭스는 싸움이라고 하겠지만!' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: '{me}, 심판을 부탁한다! 여기 {other}, 내 예보 맞수다! 내일 날씨로 내기 중이다!',
      replies: [
        { say: '공정하게 볼게', tier: 'great', answer: ['좋다! 공정함이야말로 기사가 바라는 거다!', '지는 쪽이 내일 신문사 앞을 쓴다. 빗자루는 내가 들고 왔다!'] },
        { say: '둘 다 반씩 맞을 듯', tier: 'good', face: 'think', answer: '음! 그럼 빗자루도 반씩 들자! 공평하다!' },
        { say: '잔나 편이야', tier: 'meh', face: 'sorry', answer: '크윽! 심판이 기울었다! 그래도 정직한 심판이다!' },
      ],
    },
    {
      id: 'op-with-volibas',
      when: { with: 'volibas' },
      open: '{other} 순경이랑 항구 순찰 중이다! 정의가 둘이니 두 배로 든든하다!',
      replies: [
        { say: '순찰대 멋있다!', tier: 'great', face: 'laugh', answer: '하하하! 그렇지! 이름도 지었다! 항구 정의단이다!' },
        { say: '너무 무서워 보여', tier: 'good', face: 'sorry', answer: '음! 덩치 둘이 걸으면 그렇다. 웃으면서 걷겠다! 이렇게!' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['…{other}. 그 이름만 들어도 오늘은 좀 서먹하다.', '내가 목소리를 너무 크게 냈나 보다.'],
      replies: [
        { say: '먼저 사과해 보자', tier: 'great', face: 'calm', answer: ['…그래. 기사는 먼저 고개를 숙일 줄 알아야 한다.', '작은 목소리로 하겠다. 연습한 보람이 있겠군.'] },
        { say: '하루 지나면 풀릴 거야', tier: 'good', face: 'think', answer: '음! 바다도 하룻밤 자면 잔잔해진다. 기다려 보겠다.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}! 생일이라고 들었다! 오늘 밤 등불은 너를 위해 세 번 깜빡인다!',
      replies: [
        { say: '꼭 창밖 볼게!', tier: 'great', face: 'shy', answer: ['좋다! 첫 번째는 축하, 두 번째도 축하다!', '세 번째는… 비밀이다! 보면 안다!'] },
        { say: '노래도 불러 줘', tier: 'good', face: 'laugh', answer: '좋다! …갈매기가 다 날아갔다. 그래도 끝까지 부르겠다!' },
        { say: '조용히 지나가고 싶어', tier: 'meh', face: 'calm', answer: '음! 그럼 한 번만 깜빡이겠다. 조용한 축하도 축하다.' },
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
      id: 'cb-forecast',
      when: { mem: 'forecast-me' },
      use: 'forecast-me',
      open: ['{me}! 신문 봤나? 이번 주 예보 대결, 내가 이겼다!', '내 편 들어 준 사람이 있어서 무릎에 힘이 났다!'],
      replies: [
        { say: '무릎 만세!', tier: 'great', face: 'laugh', answer: '무릎 만세다! 잔나가 축하 꽃차를 보냈다. 맞수는 이래야 한다!' },
        { say: '다음 주도 이길까?', tier: 'good', face: 'think', answer: '모른다! 그래서 재미있다! 다음 주도 내 편을 부탁한다!' },
      ],
    },
    {
      id: 'cb-sword',
      when: { mem: 'sword-care' },
      use: 'sword-care',
      open: '대검 닦는 날이다! 약속대로 천을 두 장 준비했다! 손잡이는 네 몫이다!',
      replies: [
        { say: '반짝반짝하게 닦을게', tier: 'great', face: 'smile', answer: ['좋다! …손잡이 천이 낡았구나. 흰색과 금색이다.', '언젠가 이 천을 다른 데 쓰고 싶다. 무슨 뜻인지는 나중에!'] },
        { say: '칼날은 조심해', tier: 'good', face: 'calm', answer: '걱정 마라! 날은 내가 맡는다. 너는 손만 지키면 된다!' },
      ],
    },
    {
      id: 'cb-trash',
      when: { mem: 'trash-judge' },
      use: 'trash-judge',
      open: '잠복 작전 결과 보고다! 범인은 부관이었다! 생선 상자를 물고 온 거다!',
      replies: [
        { say: '부관을 심판해야겠네', tier: 'great', face: 'laugh', answer: ['하하하! 심판했다! 하루 생선 금지다!', '…반나절로 줄였다. 기사는 자비도 안다.'] },
        { say: '사람 탓한 거 사과해', tier: 'good', face: 'sorry', answer: '음! 맞다. 팻말에 정정 문구를 붙였다. 잔나식으로!' },
      ],
    },
    {
      id: 'cb-tsunade',
      when: { mem: 'tsunade-tale' },
      use: 'tsunade-tale',
      open: '츠나데 할머니께 인사드리러 갔다! 허리를 숙였더니 꿀밤이 날아왔다!',
      replies: [
        { say: '반가워서 그러신 거야', tier: 'great', face: 'shy', answer: ['…그런 것 같다. 다 컸다면서 웃으셨다.', '럭스 몫까지 맞고 왔다. 오빠니까!'] },
        { say: '아직도 세셔?', tier: 'good', face: 'laugh', answer: '세다! 기사의 투구도 못 막는다! 존경한다!' },
      ],
    },
    {
      id: 'cb-gull',
      when: { mem: 'gull-aide' },
      use: 'gull-aide',
      open: '부관이 오늘 아침 너 있는 쪽으로 날아가더라! 안부 전하러 간 거다!',
      replies: [
        { say: '안부 잘 받았어', tier: 'great', face: 'laugh', answer: '하하! 그 녀석이 드디어 쓸모 있는 보고를 했다! 승진이다!' },
        { say: '내 빵을 물고 갔는데', tier: 'good', face: 'sorry', answer: '크윽! 부관의 잘못은 상관의 잘못이다! 빵은 내가 사겠다!' },
      ],
    },
    {
      id: 'cb-paint',
      when: { mem: 'paint-help' },
      use: 'paint-help',
      open: '칠 도와주기로 한 거, 붓 두 개 다 씻어 뒀다! 흰색이 네 몫이다!',
      replies: [
        { say: '금색도 해 보고 싶어', tier: 'great', face: 'wow', answer: ['금색을?! …좋다! 특별히 허락한다!', '깃발 쪽 한 줄은 네가 칠해라. 고향에도 없던 금빛이 될 거다!'] },
        { say: '흰색 좋아', tier: 'good', answer: '좋다! 흰색은 바탕이다. 바탕이 반듯해야 금빛이 산다!' },
      ],
    },
    {
      id: 'cb-star',
      when: { mem: 'home-star' },
      use: 'home-star',
      open: '어젯밤 깃발별이 유난히 밝았다. 너도 봤나? 같이 본 것 같았다.',
      replies: [
        { say: '응, 너 생각 했어', tier: 'great', face: 'shy', answer: '…크흠! 그런 말은 밤에 해라! 낮에 들으니 얼굴이 뜨겁다!' },
        { say: '구름 때문에 못 봤어', tier: 'good', face: 'calm', answer: '괜찮다. 별은 어디 안 간다. 다음 맑은 밤에 또 뜬다.' },
      ],
    },
    {
      id: 'cb-quiet',
      when: { mem: 'quiet-voice' },
      use: 'quiet-voice',
      open: '…들리나? 이게 연습한 목소리다. 럭스가 놀라서 생선을 떨어뜨렸다.',
      replies: [
        { say: '와, 진짜 작아졌다', tier: 'great', face: 'laugh', answer: ['그렇지?! …아니, 그렇지! 아, 다시 커졌다!', '하하하! 오래는 못 간다! 그래도 반은 성공이다!'] },
        { say: '원래 목소리가 그리워', tier: 'good', face: 'shy', answer: '그, 그럼 너 앞에서는 원래대로 하겠다! 크게!' },
      ],
    },
    {
      id: 'cb-hill',
      when: { mem: 'hill-light' },
      use: 'hill-light',
      open: '뒷산에서 같이 내 불빛 본 날 이후로, 불을 켤 때마다 그 산을 본다.',
      replies: [
        { say: '나도 거기서 손 흔들게', tier: 'great', face: 'shy', answer: '…좋다. 그럼 나는 두 번 깜빡여 답하겠다. 약속이다.' },
        { say: '수풀에 또 숨었었지?', tier: 'good', face: 'laugh', answer: '그건 순찰이었다! 뒷산 순찰! 몇 번을 말하나!' },
      ],
    },
    {
      id: 'cb-iron',
      when: { mem: 'iron-rail' },
      use: 'iron-rail',
      open: '오른이 새 난간을 달아 줬다! 네 이름도 작게 새겼다! 찾아봐라!',
      replies: [
        { say: '어디 있어? 보여 줘!', tier: 'great', face: 'wow', answer: ['꼭대기 바로 아래, 바다 쪽이다!', '오른이 새기고 한 마디 했다. 좋은 이름. 그게 끝이다!'] },
        { say: '부끄러운데', tier: 'good', face: 'laugh', answer: '하하! 작게 새겼다! 부관만 알 거다!' },
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
        '항구 끝, 하얀 등대 문 앞. 가붕이 차렷 자세로 서 있다.',
        '손에는 대검 대신 기름통이 들려 있다. 그래도 자세는 기사다.',
        '"나는 가붕! 이 항구의 등대지기다! 예전엔 기사였다!"',
        '목소리가 어찌나 큰지 선착장 갈매기들이 한꺼번에 날아오른다.',
        '"…크흠. 놀랐다면 미안하다. 목소리는 고향에 두고 오질 못했다."',
        '그가 등대 꼭대기를 가리킨다. 유리 안에서 심지가 밤을 기다린다.',
        '"저 불은 하룻밤도 꺼진 적이 없다. 그게 내 자랑이다!"',
        '"{me}, 너를 오늘부터 항구 식구로 인정한다! 이의는 받지 않는다!"',
        '"밤바다가 무서우면 불빛만 보고 와라. 그게 내 약속이다!"',
        '"그리고 불빛이 두 번 깜빡이면, 그건 내가 하는 인사다. 기억해라!"',
      ],
      replies: [
        { say: '든든하다, 잘 부탁해!', tier: 'great', answer: ['하하하! 좋은 대답이다!', '오늘 등불은 너를 위해 조금 더 밝게 켠다! 두 번 깜빡이는 것도 잊지 않는다!'] },
        { say: '목소리가 정말 크네', tier: 'good', face: 'laugh', answer: '그렇다! 안개 낀 날엔 뱃고동 대신 내가 외친다!' },
        { say: '식구는 좀 이르지 않아?', tier: 'meh', face: 'think', answer: '음! 그럼 견습 식구다! 금방 정식이 될 거다!' },
      ],
    },
    {
      title: '뒷산에서 본 불빛',
      hint: '밤(게임 시각 아홉 시부터 자정) 뒷산에 올라가 보세요. 등대 불빛이 다 보인대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 21, to: 24 } },
      scene: [
        '밤의 뒷산 꼭대기. 풀벌레 소리 너머로 바다가 검게 누워 있다.',
        '멀리 등대 불빛이 천천히 바다를 쓸고 지나간다.',
        '옆 수풀이 부스럭거리더니 가붕이 불쑥 일어선다.',
        '"왔구나! 숨어 있던 거 아니다! 기다리던 거다! 정말이다!"',
        '머리에 나뭇잎이 두 장 붙어 있다. 본인은 모르는 눈치다.',
        '"등불은 오른이 봐 주고 있다. 오늘만 특별히 부탁했다."',
        '"안에서만 지키다 보면, 밖에서 내 불빛이 어떻게 보이는지 모른다."',
        '그때 등대 불빛이 두 번 깜빡인다. 가붕이 주먹을 불끈 쥔다.',
        '"봤나? 오른한테 시켜 둔 거다! 말은 없어도 약속은 지킨다!"',
        '한참 바다를 보던 그가 조금 작은 목소리로 말한다.',
        '"…생각보다 작구나. 그래도 배 한 척 돌아오기엔 충분하다."',
      ],
      replies: [
        { say: '작아도 제일 밝아', tier: 'great', remember: 'hill-light', face: 'shy', answer: ['…크흠! 그런 말은 반칙이다!', '오늘 밤은 기분 좋게 지키겠다. 내려가면 오른한테도 전하겠다.'] },
        { say: '같이 봐서 좋다', tier: 'good', remember: 'hill-light', answer: '그렇다! 지키는 것도 좋지만 가끔은 보는 쪽도 좋다!' },
        { say: '머리에 잎 붙었어', tier: 'meh', remember: 'hill-light', face: 'laugh', answer: '그, 그건 순찰의 흔적이다! 뒷산 순찰! 그런 게 있다!' },
      ],
    },
    {
      title: '럭스의 도시락',
      hint: '가붕이 럭스 도시락 이야기를 했어요. 도시락 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'lunchbox', take: true } },
      scene: [
        '점심 무렵 등대 계단참. 가붕이 빈 빵 봉지를 접고 있다.',
        '"오늘은 럭스가 경매로 바빠서 도시락이 없다. 서운하지 않다!"',
        '도시락을 내밀자 가붕이 눈을 크게 뜬다.',
        '"이건… 럭스가 싸 준 거랑 보자기가 똑같다! 그 녀석이 시켰나?"',
        '아니라고 하자 가붕이 잠깐 말을 잃는다. 파도 소리만 들린다.',
        '"…그렇군. 네가 직접. 기사는 이런 데 약하다."',
        '그가 보자기 매듭을 조심조심 푼다. 큰 손이 괜히 서툴다.',
        '"어릴 때 츠나데 할머니가 우리 남매 도시락을 싸 주셨다."',
        '"럭스는 반찬을 늘 나한테 덜어 줬다. 오빠가 더 커야 한다면서."',
        '"그래서 나는 지금도 나눠 먹는 게 제일 맛있다."',
        '"반으로 나누자. 혼자 먹는 도시락보다 둘이 먹는 게 정의다!"',
      ],
      replies: [
        { say: '반씩, 공정하게!', tier: 'great', remember: 'lunch-shared', face: 'laugh', answer: ['하하하! 공정함은 기사의 첫째 덕목이다!', '생선은 네가 더 먹어라. 그건 공정함 말고 내 마음이다!'] },
        { say: '럭스한텐 비밀이야', tier: 'good', remember: 'lunch-shared', answer: '음! 비밀은 지킨다! …그 녀석은 냄새로 알겠지만!' },
        { say: '다 먹어도 돼', tier: 'meh', remember: 'lunch-shared', face: 'think', answer: '안 된다! 나눠 먹어야 맛있다. 그게 크라운가드 집안 규칙이다!' },
      ],
    },
    {
      title: '기사의 맹세',
      hint: '가붕에게서 기사단 시절의 맹세 이야기를 들으면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'knight-oath' },
      scene: [
        '해 질 녘 등대 창고. 문틈으로 붉은 빛이 길게 들어온다.',
        '가붕이 먼지 쌓인 갑옷 앞에 서 있다. 벽에는 대검이 걸려 있다.',
        '"맹세 얘기, 기억하지? 약한 사람 앞에 서고 등을 보이지 않는다."',
        '그가 대검 손잡이에 감긴 낡은 천을 쓸어 본다. 흰색과 금색이다.',
        '"고향에선 이 칼로 지켰다. 줄을 맞추고, 원칙을 맞추고."',
        '"여기 와서 처음엔 등불도 그렇게 지켰다. 혼자서, 반듯하게."',
        '"근데 알았다. 지키기만 하면 외롭다는 걸."',
        '"럭스한테 도시락을 받고, 너한테 수고했다는 말을 듣고서야."',
        '그가 투구를 내려놓고 멋쩍게 웃는다. 목소리가 평소의 반이다.',
        '"그래서 새 맹세를 하나 더 하려고 한다. 증인이 필요하다, {me}."',
      ],
      replies: [
        { say: '내가 증인이 될게', tier: 'great', face: 'shy', answer: ['…좋다. 잘 들어라.', '지키는 사람 옆에도 누가 있어야 한다. 그걸 부끄러워하지 않는다.', '그게 새 맹세다! …증인, 고맙다.'] },
        { say: '갑옷 한번 입어 봐', tier: 'good', face: 'laugh', answer: '하하! 지금 입으면 계단에서 굴러떨어진다! 맹세만 하겠다!' },
        { say: '맹세는 무거워', tier: 'meh', face: 'calm', answer: '그렇다. 그래서 혼자 들지 않으려는 거다. 천천히 생각해라.' },
      ],
    },
    {
      title: '폭풍 속의 꼭대기',
      hint: '가붕과 아주 가까워지면 폭풍 속 꼭대기에서 진짜 이유를 말해 줘요. 꽃다발 이야기도요.',
      need: { days: 13, points: 96 },
      scene: [
        '폭풍이 막 지나간 밤, 등대 꼭대기. 바람이 아직 난간을 흔든다.',
        '가붕이 등불 유리를 닦다가 너를 보고 크게 손짓한다.',
        '"올라왔구나! 백 칸을! 오늘 밤 제일 용감한 사람은 너다!"',
        '젖은 깃발이 펄럭인다. 그는 난간을 꽉 잡고 바다를 본다.',
        '"폭풍 오면 여기서 도는 거, 진짜 이유를 말해 주겠다."',
        '"바람을 재는 것도 반은 맞다. 나머지 반은… 무서워서다."',
        '"기사도 무섭다. 빙글빙글 돌면 무서운 게 바람에 날아간다."',
        '"어릴 땐 럭스 앞에서 무서운 티를 못 내서 그렇게 배웠다."',
        '그가 잠깐 웃는다. 등불이 그의 얼굴을 반쯤 밝힌다.',
        '"근데 요즘은 안 돌아도 안 무섭다. 너 때문인 것 같다."',
        '"…꽃 같은 거 받으면 깃발처럼 꼭대기에 걸어 둘 텐데."',
        '"그냥 한 말이다! 바람이 시킨 말이다! 정말이다!"',
      ],
      replies: [
        { say: '말해 줘서 고마워', tier: 'great', face: 'shy', answer: ['…크흠! 오늘은 목소리가 안 나온다.', '바람 탓이다! 바람 탓! …아니, 네 탓이다.'] },
        { say: '같이 돌아 볼까?', tier: 'good', face: 'laugh', answer: '하하하! 둘이 돌면 등대가 돈다! 그래도 해 보자!' },
        { say: '추우니까 내려가자', tier: 'meh', face: 'calm', answer: '그래. 계단은 내가 먼저 내려간다. 넘어지면 받아 주겠다.' },
      ],
    },
    {
      title: '꺼지지 않는 불',
      hint: '가붕과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽, 등불을 끄기 직전. 수평선이 연한 금빛으로 물든다.',
        '가붕이 유리를 닦다가 손을 멈춘다. 걸레가 한참 그대로다.',
        '"{me}. 등불은 해가 뜨면 끈다. 그게 등대지기의 규칙이다."',
        '"규칙은 지켰다. 하루도 빠짐없이. 고향에서 배운 대로."',
        '"근데 너한테 켠 불은 끄고 싶지 않다. 규칙이 처음 흔들린다."',
        '그가 주머니에서 흰 실과 금 실을 꼰 작은 매듭을 꺼낸다.',
        '"대검 손잡이에 감았던 천을 풀어서 만들었다. 서툴다."',
        '"기사로서 말고, 가붕으로서 묻겠다. 평생 지켜도 되겠나?"',
        '"아니, 고치겠다. 서로 지켜도 되겠나? 그게 새 맹세니까."',
        '바다 위로 해가 고개를 내민다. 그는 등불을 끄지 않는다.',
        '"…대답은 천천히 해도 된다. 반지는 아직 고르는 중이니까!"',
      ],
      replies: [
        { say: '평생 지켜 줘', tier: 'great', face: 'laugh', answer: ['하하하! 들었나, 바다야!', '오늘 등불은 해가 다 뜰 때까지 켜 둔다! 딱 오늘만 규칙 위반이다!'] },
        { say: '나도 너를 지킬게', tier: 'great', face: 'shy', answer: ['…그 말이 제일 강하다.', '기사도 지켜지면 울 수 있구나. 처음 알았다.'] },
        { say: '럭스한테 먼저 말해', tier: 'good', face: 'laugh', answer: '크윽! 그게 제일 무서운 관문이다! 같이 가 줘라!' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 충분하다! 내일 또 등대로 와라!',
    '할 말은 다 했다! 기사는 말보다 행동이다!',
    '불빛 안쪽으로만 다녀라! 그게 오늘의 마지막 명령이다!',
    '또 왔나? 반갑다! 수풀에는 아무도 없다! 정말이다!',
    '부관이 너를 배웅하겠단다! 아니, 생선 냄새를 맡은 거다!',
    '오늘 밤에도 두 번 깜빡이겠다! 창밖을 잊지 마라!',
    '럭스 가게 지나가면 밥 먹었는지만 봐 다오! 묻지는 말고!',
  ],
};
