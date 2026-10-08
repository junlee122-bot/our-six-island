// 힘멜 — 시장 거리 빵집 알바생, 자칭 "마을의 용사". 폼 잡고 앞머리·외모 자랑을
// 하지만 누구에게나 다정한 반말. 광장에 자기 동상을 세우자는 청원(반복 농담),
// 늦잠 자는 사장 프리렌 대신 가게 문 열기, 사장님 꽃밭 마법을 좋아함, 성검 대신
// 빵칼, 멀리 사는 옛 친구 하이터(술 좋아하는 성당 사람)·아이젠(겁 많다면서 제일
// 튼튼한 드워프 아저씨)의 편지, 오십 년에 한 번 오는 유성우, 상자에 머리부터
// 넣는 사장님 꺼내기, 끝내 못 준 연꽃 무늬 반지. 프리렌을 짝사랑하지만 그녀는 모른다.
// 이야기는 플레이어와 이어지고, 짝사랑은 고마움으로 조용히 내려놓는다.
// 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const HIMMEL_TALK: NpcTalkBook = {
  npc: 'himmel',
  memories: {
    'statue-sign': '동상 청원서에 서명해 줬어요',
    'statue-doubt': '동상은 좀 과하다고 했어요',
    'bangs-praise': '앞머리가 멋있다고 해 줬어요',
    'pose-pick': '동상 포즈를 골라 줬어요',
    'hero-kind': '작은 도움도 용사의 일이라고 맞장구쳤어요',
    'crush-cheer': '사장님을 향한 마음을 응원하기로 했어요',
    'crush-tease': '짝사랑을 살짝 놀렸어요',
    'flower-magic': '꽃밭 마법 이야기를 들었어요',
    'bread-knife': '빵칼 검술을 구경했어요',
    'letters': '멀리 사는 옛 친구들 이야기를 들었어요',
    'key-duty': '열쇠 당번을 도와주기로 했어요',
    'cape-fan': '망토가 잘 어울린다고 했어요',
    'hide-seek': '숨바꼭질 내기를 응원했어요',
    'dawn-shop': '새벽에 함께 빵집 문을 열었어요',
    'cosmos-gift': '코스모스를 선물했어요',
    'true-hero': '동상을 원하는 진짜 이유를 들었어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일에 축하 행진을 해 준대요',
    'date-talk': '내 방에서 보낸 시간을 이야기했어요',
    'box-rescue': '상자에 빠진 사장님 꺼내는 요령을 배웠어요',
    'sword-story': '성검을 못 뽑은 날 이야기를 들었어요',
    'heiter-tale': '하이터의 술 편지 이야기를 들었어요',
    'eisen-tale': '아이젠 아저씨가 제일 용감하다고 들었어요',
    'meteor-promise': '오십 년 뒤 유성우를 같이 보기로 했어요',
    'old-hero': '할아버지가 돼도 멋있을 거라고 했어요',
    'interview': '동상 기사 인터뷰 연습을 도왔어요',
    'ring-story': '좌판의 연꽃 반지 이야기를 들었어요',
    'first-day': '빵집에 처음 온 날 이야기를 들었어요',
    'menu-name': '신메뉴 이름을 같이 지었어요',
    'promise-book': '약속 수첩에 내 이름이 적혔어요',
    'garden-help': '츠나데 할머니 텃밭을 같이 돕기로 했어요',
    'song-lesson': '고백 노래 연습을 들어 줬어요',
    'night-patrol': '밤 순찰에 따라나섰어요',
  },
  talks: [
    {
      id: 'statue',
      open: '{me}, 광장 한가운데 비어 있지? 거기 내 동상이 서면 딱인데.',
      replies: [
        { say: '서명할게! 어디다 써?', tier: 'great', remember: 'statue-sign', face: 'laugh', answer: ['역시 {me}! 여기, 맨 위 칸.', '역사에 남을 서명이야. 내 이름 바로 옆에.'] },
        { say: '동상은 좀 과하지 않아?', tier: 'good', remember: 'statue-doubt', face: 'think', answer: ['과해야 기억에 남지. 작게 만들면 아무도 안 봐.', '…근데 네 말도 수첩에 적어 둘게. 용사는 반대 의견도 들어.'] },
        { say: '돈은 누가 내?', tier: 'meh', face: 'sorry', answer: '…그건 아직 청원 단계라서. 모금은 다음 단계야.' },
      ],
    },
    {
      id: 'bangs',
      open: '잠깐. 오늘 앞머리 어때? 바람이 왼쪽에서 불어서 신경 쓰였거든.',
      replies: [
        { say: '멋있어. 용사 같아', tier: 'great', remember: 'bangs-praise', face: 'laugh', answer: ['그렇지? 거울한테도 물어봤는데 너랑 같은 대답이었어.', '거울이랑 {me}, 둘이 같으면 그건 진실이야.'] },
        { say: '오른쪽이 살짝 떴어', tier: 'good', face: 'wow', answer: '앗. 고마워. 이런 걸 말해 주는 게 진짜 동료야.' },
        { say: '잘 모르겠는데', tier: 'meh', face: 'calm', answer: '괜찮아. 모르는 사람 눈에도 멋있으면 그게 진짜야.' },
      ],
    },
    {
      id: 'pose',
      open: '동상 포즈를 셋으로 좁혔어. 칼 들기, 손 흔들기, 앞머리 넘기기.',
      replies: [
        { say: '앞머리 넘기기!', tier: 'great', remember: 'pose-pick', face: 'laugh', answer: ['알아보는구나! 바람까지 조각으로 새겨 달라고 할 거야.', '돌로 된 바람. 멋있지? 발키리 씨는 한숨부터 쉬던데.'] },
        { say: '손 흔드는 게 다정해', tier: 'good', remember: 'pose-pick', face: 'smile', answer: '다정한 용사라… 좋다. 지나가는 사람한테 인사하는 동상.' },
        { say: '그냥 서 있는 걸로', tier: 'meh', face: 'think', answer: '그건 너무 겸손해. 용사는 조금 뻔뻔해야 해.' },
      ],
    },
    {
      id: 'small-deed',
      open: '오늘 시장에서 할머니 짐을 들어 드렸어. 작은 일이지만 용사의 일이야.',
      replies: [
        { say: '작은 일이 제일 커', tier: 'great', remember: 'hero-kind', face: 'shy', answer: ['…너 그거 알아? 그 말, 내가 제일 듣고 싶던 말이야.', '마왕은 없어도 무거운 짐은 매일 있거든.', '그걸 같이 들어 주는 사람이 많은 마을이면 좋겠어.'] },
        { say: '나도 같이 도울래', tier: 'good', remember: 'hero-kind', face: 'smile', answer: '좋아! 그럼 오늘부터 너도 용사단이야. 망토는 나중에.' },
        { say: '그것도 용사야?', tier: 'meh', face: 'calm', answer: '그럼. 칼 휘두르는 것만 용사면 이 마을엔 용사가 없게?' },
      ],
    },
    {
      id: 'crush',
      open: '{me}, 비밀 하나. 사장님… 아, 아니다. 아니, 들어 줘. 나 사장님 좋아해.',
      replies: [
        { say: '응원할게, 힘멜', tier: 'great', remember: 'crush-cheer', face: 'shy', answer: ['…고마워. 근데 사장님은 꽃을 꽂아 둬도 몰라.', '그게 또 귀여워. 큰일이지?'] },
        { say: '다 티 나던데?', tier: 'good', remember: 'crush-tease', face: 'wow', answer: '진짜? 근데 왜 사장님만 몰라? …아, 사장님이니까.' },
        { say: '그걸 왜 나한테 말해', tier: 'meh', face: 'sorry', answer: '…용사도 털어놓을 데가 필요해. 봇치는 나보다 더 떨거든.' },
      ],
    },
    {
      id: 'flower-magic',
      open: '사장님이 꽃밭 피우는 마법 본 적 있어? 쓸모없대. 난 그게 제일 좋아.',
      replies: [
        { say: '왜 제일 좋아?', tier: 'great', remember: 'flower-magic', face: 'think', answer: ['쓸모없는 걸 좋아하는 사람은 다정하거든.', '그 마법 쓸 때 사장님 얼굴이 제일 편해 보여.', '옛날에 누가 가르쳐 준 거래. 그 얘기할 때도 그 얼굴이야.'] },
        { say: '나도 보고 싶다', tier: 'good', remember: 'flower-magic', face: 'smile', answer: '축제 날 졸라 봐. 일 년에 한 번은 보여 줘.' },
        { say: '쓸모없으면 별로지', tier: 'meh', face: 'calm', answer: '그런가? 꽃은 원래 먹지도 못하는데 다들 좋아하잖아.' },
      ],
    },
    {
      id: 'bread-knife',
      open: '이게 내 검이야. 빵칼. 성검은 못 뽑았지만 이걸로 바게트는 다 베어.',
      replies: [
        { say: '검술 보여 줘!', tier: 'great', remember: 'bread-knife', face: 'laugh', answer: ['좋아, 잘 봐. 하나, 둘… 봐, 바게트가 여덟 조각.', '단면도 멋있지? 부스러기도 안 날렸어.'] },
        { say: '빵칼도 멋있네', tier: 'good', face: 'smile', answer: '그렇지? 검은 뭘 지키느냐가 중요해. 이건 아침밥을 지켜.' },
        { say: '그냥 칼이잖아', tier: 'meh', face: 'think', answer: '그냥 칼로 진짜 용사가 될 수도 있는 거야. 두고 봐.' },
      ],
    },
    {
      id: 'letters',
      open: '편지 왔어! 멀리 사는 옛 친구들. 하나는 술 얘기, 하나는 받침대 얘기.',
      replies: [
        { say: '어떤 친구들이야?', tier: 'great', remember: 'letters', face: 'laugh', answer: ['술 좋아하는 착한 녀석이랑, 말수 적은 튼튼한 아저씨.', '둘 다 멀리 있어도 내 편이야. 든든하지.', '신짜장 씨가 편지 줄 때마다 "또 그분들?" 하고 웃어.'] },
        { say: '받침대가 뭐야?', tier: 'good', remember: 'letters', face: 'wow', answer: '동상 받침대! 깎아 준대. 근데 몇 년째 깎는 중이래.' },
        { say: '답장은 썼어?', tier: 'meh', face: 'sorry', answer: '…아직. 멋있는 첫 문장을 고민하다 보면 한 달이 가.' },
      ],
    },
    {
      id: 'key-duty',
      open: '사장님은 오늘도 늦잠. 그래서 열쇠는 늘 내 주머니에 있어. 무겁다, 책임감.',
      replies: [
        { say: '내가 도와줄게', tier: 'great', remember: 'key-duty', face: 'smile', answer: '진짜? 그럼 너는 간판 담당. 용사단 첫 임무야!' },
        { say: '깨우면 안 돼?', tier: 'good', face: 'laugh', answer: ['세 번 두드리면 한 번 대답해.', '그 한 번이 "오 분만"이야. 오 분은 늘 한 시간이 되고.'] },
        { say: '사장 바꿔야겠다', tier: 'meh', face: 'sorry', answer: '안 돼! …아, 너무 크게 말했다. 그냥, 난 이 가게가 좋아.' },
      ],
    },
    {
      id: 'cape',
      open: '망토 새로 다렸어. 바람 불 때 펄럭이는 각도가 중요하거든.',
      replies: [
        { say: '진짜 잘 어울려', tier: 'great', remember: 'cape-fan', face: 'laugh', answer: '그 말 들으려고 아침부터 다렸지. 보람 있다!' },
        { say: '빵집에서 덥지 않아?', tier: 'good', face: 'think', answer: '좀 더워. 근데 용사는 계절보다 망토가 먼저야.' },
        { say: '밀가루 묻겠다', tier: 'meh', face: 'sorry', answer: '…벌써 묻었어. 하얀 무늬라고 생각하기로 했어.' },
      ],
    },
    {
      id: 'hide-seek',
      open: '야니네코랑 숨바꼭질 내기 중이야. 또 지면 동상 서명 받으러 같이 가 준대.',
      replies: [
        { say: '이겨! 응원할게', tier: 'great', remember: 'hide-seek', face: 'laugh', answer: '좋아! 이번엔 햇볕 드는 데부터 찾아 볼 거야. 거기 꼭 있거든.' },
        { say: '져도 이득 아니야?', tier: 'good', face: 'think', answer: '…어? 그러네. 근데 용사는 일부러 지지 않아.' },
        { say: '그거 무슨 내기야', tier: 'meh', face: 'calm', answer: '청년끼리의 진지한 승부야. 이유는 잊었어.' },
      ],
    },
    {
      id: 'mirror',
      open: '{me}, 솔직히 말해 봐. 나 잘생겼지? 아니, 대답 안 해도 알아.',
      replies: [
        { say: '마을에서 제일', tier: 'great', face: 'laugh', answer: '동상 청원서에 그 문장 그대로 넣어도 돼? 추천사로!' },
        { say: '착한 게 더 멋있어', tier: 'good', face: 'shy', answer: '…그런 말은 반칙이야. 폼 잡을 틈을 안 주잖아.' },
        { say: '평범한데', tier: 'meh', face: 'sorry', answer: '…용사는 상처받지 않아. 오늘만 조금 받을게.' },
      ],
    },
    {
      id: 'mimic',
      open: ['{me}, 사장님이 또 창고 상자에 머리를 넣었어.', '다리만 보이는데, 다리가 좀 행복해 보였어.'],
      replies: [
        { say: '다리 잡고 당겨야지!', tier: 'great', remember: 'box-rescue', face: 'laugh', answer: ['정답! 근데 요령이 있어. 살살, 그리고 단번에.', '빠져나오면 사장님이 "어두웠어" 한마디 해. 그게 다야.', '난 그 한마디 들으려고 매번 당겨.'] },
        { say: '그냥 두면 안 돼?', tier: 'good', face: 'think', answer: ['한 번 그래 봤어. 점심때까지 그대로더라.', '손님들이 새로 들인 장식인 줄 알았대.'] },
        { say: '상자를 다 치우자', tier: 'meh', face: 'sorry', answer: '…그럼 사장님이 슬퍼해. 상자 여는 게 낙이거든.' },
      ],
    },
    {
      id: 'holy-sword',
      open: ['어릴 때 고향 축제에 바위에 꽂힌 검 뽑기가 있었어.', '다들 못 뽑았지. 나도 못 뽑았고.'],
      replies: [
        { say: '그래도 용사가 됐잖아', tier: 'great', remember: 'sword-story', face: 'shy', answer: ['…응. 그날 정했어. 검이 안 골라 주면 내가 길을 고르자고.', '못 뽑은 검 대신 들고 다닌 게, 지금 빵칼까지 왔어.'] },
        { say: '진짜 뽑힐 줄 알았어?', tier: 'good', face: 'laugh', answer: '당연하지! 앞머리까지 다듬고 갔어. 바위는 무심하더라.' },
        { say: '그건 장난감이었겠지', tier: 'meh', face: 'calm', answer: '아마도. 근데 장난감 앞에서 진지했던 내가 좀 좋아.' },
      ],
    },
    {
      id: 'heiter',
      open: ['하이터 편지 왔어. 첫 줄이 "요즘 술을 끊었습니다"야.', '둘째 줄이 "어제 축배를 들었는데"고.'],
      replies: [
        { say: '하이터답다', tier: 'great', remember: 'heiter-tale', face: 'laugh', answer: ['그치? 성당 일 하는 녀석이 술은 제일 좋아해.', '근데 사람 마음은 제일 잘 고쳐. 그래서 다들 용서해.'] },
        { say: '해장 빵 보내 줄까?', tier: 'good', remember: 'heiter-tale', face: 'smile', answer: ['좋은 생각! 사장님한테 짭짤한 빵 하나 부탁해 볼게.', '편지에 빵 부스러기 묻혀 보내면 하이터는 웃을 거야.'] },
        { say: '술 좀 줄이라고 해', tier: 'meh', face: 'sorry', answer: '그 말은 내가 오십 번은 썼어. 안 통해.' },
      ],
    },
    {
      id: 'eisen',
      open: '아이젠 아저씨 알아? 산 너머 사는 드워프. 자기는 겁쟁이래.',
      replies: [
        { say: '겁나도 버티는 게 용기야', tier: 'great', remember: 'eisen-tale', face: 'wow', answer: ['…너 아저씨 만나 본 적 있어? 딱 그 사람이야.', '제일 무서워하면서도 늘 제일 앞에 섰어.', '그래서 우리 넷 중에 제일 튼튼했지.'] },
        { say: '드워프는 튼튼하잖아', tier: 'good', face: 'smile', answer: '몸은 바위야. 마음은 생각보다 말랑해. 편지에 꽃 그림을 그려.' },
        { say: '겁쟁이 용사단이네', tier: 'meh', face: 'laugh', answer: '하하, 무서워할 줄 아는 사람이 오래 가는 법이야.' },
      ],
    },
    {
      id: 'meteor',
      open: ['옛날에 넷이서 밤새 유성우를 본 적 있어. 오십 년에 한 번 오는 거.', '다음엔 나 할아버지일 텐데. 그래도 보러 갈 거야.'],
      replies: [
        { say: '그때 나도 같이 볼래', tier: 'great', remember: 'meteor-promise', face: 'shy', answer: ['…오십 년 뒤 약속이야? 용사는 그런 약속 안 잊어.', '지팡이 짚고서라도 뒷산에 올라갈게. 자리 맡아 둬.'] },
        { say: '사장님은 그대로겠네', tier: 'good', face: 'think', answer: ['응. 사장님한텐 오십 년이 잠깐이래.', '그래서 그날 내가 옆에 있으면, 잠깐이 덜 쓸쓸할 거야.'] },
        { say: '오십 년은 너무 길어', tier: 'meh', face: 'calm', answer: '길지. 그러니까 그사이 좋은 날을 많이 모아 두자.' },
      ],
    },
    {
      id: 'old-hero',
      open: '{me}, 나 할아버지 돼도 잘생겼을까? 진지하게 묻는 거야.',
      replies: [
        { say: '주름도 멋있을 거야', tier: 'great', remember: 'old-hero', face: 'laugh', answer: ['역시! 주름 하나하나에 모험이 새겨질 거야.', '흰 앞머리도 바람에 날리면 꽤 볼만하겠지.'] },
        { say: '지금을 즐겨', tier: 'good', face: 'smile', answer: '맞아. 지금 얼굴을 많이 기억해 둬. 나중에 비교하게.' },
        { say: '그건 아무도 몰라', tier: 'meh', face: 'sorry', answer: ['…용사는 미래가 불안해도 웃어.', '웃고 있으니까, 불안은 네가 좀 덜어 줘.'] },
      ],
    },
    {
      id: 'gwen-salon',
      open: ['그웬 원장님 미용실 다녀왔어. 앞머리 끝만 다듬어 달랬는데.', '내가 거울 앞에서 너무 오래 고민해서 원장님이 먼저 지쳤어.'],
      replies: [
        { say: '그만큼 진지한 거지', tier: 'great', face: 'laugh', answer: '그렇지! 앞머리는 용사의 깃발이야. 대충 할 수 없어.' },
        { say: '잘 다듬어졌네', tier: 'good', face: 'smile', answer: '알아봐 주는구나. 머리카락 한 올 차이인데. 역시 동료야.' },
        { say: '그냥 맡기지 그랬어', tier: 'meh', face: 'think', answer: '맡겼어. 마지막 한 가위만 내가 골랐을 뿐이야.' },
      ],
    },
    {
      id: 'ornn-sword',
      open: ['오른 아저씨 대장간에서 진짜 검 값을 물어봤어.', '빵을 몇 년 구워야 하는지 세다가 그만뒀어.'],
      replies: [
        { say: '빵칼이 더 너다워', tier: 'great', face: 'shy', answer: ['…그 말 좋다. 아저씨도 비슷한 말 했어.', '지킬 게 빵이면 빵칼이 맞대. 숫돌은 공짜로 빌려줬어.'] },
        { say: '같이 모아 볼까?', tier: 'good', face: 'laugh', answer: '동상 기금이랑 검 기금… 용사는 돈이 많이 든다.' },
        { say: '검은 위험해', tier: 'meh', face: 'calm', answer: '맞아. 그러니까 휘두를 일 없는 마을이 제일 좋아.' },
      ],
    },
    {
      id: 'janna-interview',
      open: '잔나 기자가 동상 청원 기사를 써 준대! 인터뷰 연습 상대 좀 해 줄래?',
      replies: [
        { say: '좋아, 첫 질문 갑니다', tier: 'great', remember: 'interview', face: 'laugh', answer: ['동상을 세우려는 이유는요? …좋은 질문이에요, 기자님.', '음, 그건… 앞머리 각도부터 설명해야겠네요.', '…너무 길다고? 기사 한 면이면 돼.'] },
        { say: '기사 나오면 오려 둘게', tier: 'good', face: 'shy', answer: '고마워! 나도 오려서 망토 안쪽에 꿰매 둘 거야.' },
        { say: '날씨 기사 아니야?', tier: 'meh', face: 'sorry', answer: '…잔나 기자 예보 옆 귀퉁이래. 귀퉁이도 신문이야.' },
      ],
    },
    {
      id: 'volibas-permit',
      open: ['볼리바스 순경님이 광장 동상엔 허가 서류가 필요하대.', '서류가 열세 장이야. 순경님이 웃으면서 줬어.'],
      replies: [
        { say: '같이 채우자', tier: 'great', face: 'laugh', answer: ['진짜? 용사단 첫 행정 임무다!', '너는 글씨, 나는 서명. 앞머리는 증명사진 담당.'] },
        { say: '순경님 원래 그래', tier: 'good', face: 'think', answer: '응. 규칙을 지키는 것도 마을을 지키는 거래. 그 말은 좀 멋있었어.' },
        { say: '포기하는 게 빠르겠다', tier: 'meh', face: 'sorry', answer: '용사 사전에 포기는 없어. …서류 사전엔 있을지도.' },
      ],
    },
    {
      id: 'tsunade-garden',
      open: '츠나데 할머니 텃밭에서 무 뽑는 걸 도와드렸어. 할머니가 날 용사라 불러 줬어.',
      replies: [
        { say: '다음엔 나도 갈게', tier: 'great', remember: 'garden-help', face: 'laugh', answer: ['좋아! 할머니 무는 성검보다 안 뽑혀. 둘이 당기자.', '끝나면 할머니가 차를 주셔. 그게 보상이야.'] },
        { say: '진짜 용사네', tier: 'good', face: 'shy', answer: '그 말 오늘 두 번째야. 하루에 두 번이면 동상 없어도 되겠다.' },
        { say: '무가 무거웠어?', tier: 'meh', face: 'calm', answer: '응. 근데 할머니 허리가 더 무거웠을 거야.' },
      ],
    },
    {
      id: 'lux-fish',
      open: ['럭스네 어시장에 빵 배달 갔다가 망토에 생선 냄새가 뱄어.', '사장님이 킁킁하더니 "바다 냄새"래. 칭찬일까?'],
      replies: [
        { say: '칭찬 맞아', tier: 'great', face: 'laugh', answer: ['그렇지? 그럼 오늘은 바다의 용사로 할래.', '앞머리에 바닷바람 결까지 들어갔어. 일석이조야.'] },
        { say: '빨래해야겠다', tier: 'good', face: 'sorry', answer: '…응. 럭스가 생선 하나 얹어 줘서 냄새가 두 배야.' },
        { say: '사장님 관심 없을걸', tier: 'meh', face: 'think', answer: '관심 없는 사람은 킁킁도 안 해. 나는 그렇게 믿을래.' },
      ],
    },
    {
      id: 'makima-ring',
      open: ['마키마 씨 좌판에서 작은 반지를 봤어. 연꽃 무늬.', '꽃말이 오래가는 마음이래. 오래 사는 사람한테 딱이지.'],
      replies: [
        { say: '누구 주려고?', tier: 'great', remember: 'ring-story', face: 'shy', answer: ['…사장님. 사실 예전에 비슷한 걸 하나 산 적 있어.', '근데 못 줬어. 주머니에서 몇 해째 산책 중이야.', '이건 비밀이야. 봇치한테도 말 안 했어.'] },
        { say: '사 버려!', tier: 'good', face: 'laugh', answer: '마키마 씨 눈빛이 사라고 하더라. 무서워서 일단 도망쳤어.' },
        { say: '반지는 부담스럽지', tier: 'meh', face: 'think', answer: '그렇지. 받는 사람이 무슨 뜻인지 모르면 더 그래.' },
      ],
    },
    {
      id: 'first-day',
      open: ['내가 빵집에 처음 온 날, 사장님은 혼자 계산대에서 졸고 있었어.', '손님도 없고 진열대도 텅 비었지. 그래서 말했어. "같이 해요."'],
      replies: [
        { say: '그래서 지금이 됐네', tier: 'great', remember: 'first-day', face: 'shy', answer: ['응. 사장님은 "응" 한마디였어. 그게 시작이었어.', '그날 문을 안 두드렸으면, 난 그냥 잘생긴 청년이었겠지.'] },
        { say: '그때부터 좋아했어?', tier: 'good', face: 'laugh', answer: ['빵 냄새 때문이라고 해 둘게.', '…아니. 꽃 한 송이 보고 웃던 얼굴 때문이야.'] },
        { say: '알바 공고 봤어?', tier: 'meh', face: 'calm', answer: '공고는 없었어. 용사는 공고 없이도 찾아가.' },
      ],
    },
    {
      id: 'bocchi-song',
      open: '봇치한테 고백 노래를 배우는 중이야. 들어 볼래? …아, 아직 첫 소절이야.',
      replies: [
        { say: '들려줘!', tier: 'great', remember: 'song-lesson', face: 'laugh', answer: ['좋아. 흠흠. …어때? 봇치는 듣다가 탁자 밑에 숨었어.', '음이 조금 날아다닌대. 마음은 정확하대.'] },
        { say: '말로 하는 게 낫겠다', tier: 'good', face: 'think', answer: '…봇치도 결국 그렇게 말했어. 기타 치면서.' },
        { say: '노래는 좀…', tier: 'meh', face: 'sorry', answer: '알아. 용사가 못하는 것 목록에 노래를 적었어.' },
      ],
    },
    {
      id: 'beatrice-book',
      open: ['도서관에서 옛 용사 이야기책을 빌렸어. 크게 감탄하다 쫓겨났고.', '근데 베아트리스가 문밖까지 나와서 책을 건네줬어.'],
      replies: [
        { say: '마음은 착한 거네', tier: 'great', face: 'smile', answer: ['응. 혀를 차면서 "반납일 지키는 거야" 하더라.', '그게 그 사람 방식의 응원이야. 난 다 알아.'] },
        { say: '조용히 읽어야지', tier: 'good', face: 'sorry', answer: '…맞아. 감탄을 속으로 하는 연습 중이야. 얼굴은 시끄럽대.' },
        { say: '무슨 책이었어?', tier: 'meh', face: 'think', answer: '용사가 동상 없이 잊혀 가는 이야기. 결말이 마음에 안 들어.' },
      ],
    },
    {
      id: 'neighbor',
      open: '내 자취방 옆이 야니네코 방이야. 벽 너머로 매일 낮잠 코 고는 소리가 들려.',
      replies: [
        { say: '자장가 삼아', tier: 'great', face: 'laugh', answer: ['맞아! 이제 그 소리 없으면 잠이 안 와.', '이건 야니네코한테 비밀이야. 내기에서 써먹을 거거든.'] },
        { say: '벽 두드려 봐', tier: 'good', face: 'think', answer: '두드렸더니 "오 분만" 하더라. 사장님이랑 같은 말이야.' },
        { say: '이사 가', tier: 'meh', face: 'sorry', answer: '안 돼. 창문에서 광장 동상 자리가 보이는 방은 거기뿐이야.' },
      ],
    },
    {
      id: 'season-menu',
      open: '사장님이 신메뉴 이름을 나한테 맡겼어. 지금 후보는 "용사의 크루아상"이야.',
      replies: [
        { say: '앞머리 롤빵 어때', tier: 'great', remember: 'menu-name', face: 'laugh', answer: ['천재야! 결 따라 돌돌 말린 게 딱 내 앞머리야.', '사장님한테 가져가 볼게. 반대하면 네 이름을 댈 거야.'] },
        { say: '용사 빵 좋다', tier: 'good', remember: 'menu-name', face: 'smile', answer: '그치? 단순한 게 오래 남아. 동상처럼.' },
        { say: '그냥 크루아상', tier: 'meh', face: 'sorry', answer: '…사장님이랑 똑같은 말을 하네. 둘이 짰어?' },
      ],
    },
    {
      id: 'promise-book',
      open: ['나 작은 수첩 있어. 누구랑 한 약속을 다 적어 둬.', '빵 남겨 주기, 고양이 찾기, 지붕 고치기. 다 지켰어.'],
      replies: [
        { say: '나랑도 약속하자', tier: 'great', remember: 'promise-book', face: 'shy', answer: ['좋아. 뭐로 할까… 웃게 해 주기. 적었다.', '이건 기한 없는 약속이야. 매일 지킬 거야.'] },
        { say: '왜 적어 둬?', tier: 'good', face: 'think', answer: '잊으면 약속이 아니잖아. 용사는 기억력보다 수첩을 믿어.' },
        { say: '빵칼로 지붕을?', tier: 'meh', face: 'laugh', answer: '아니, 지붕은 망치로. 발키리 씨한테 빌렸어. 엄청 혼났어.' },
      ],
    },
    {
      id: 'shinichi-fortune',
      open: '쿠도 씨 점집에서 운세를 봤어. 동상은 먼 훗날 선대. 먼 훗날이 언젠데.',
      replies: [
        { say: '언젠가는 선다는 거네', tier: 'great', face: 'laugh', answer: ['그치? 그렇게 들으면 엄청 좋은 운세야.', '먼 훗날이면 사장님은 볼 수 있잖아. 그거면 돼.'] },
        { say: '점은 재미로 봐', tier: 'good', face: 'smile', answer: '알아. 근데 좋은 점은 진심으로 믿어도 손해 없어.' },
        { say: '안 선다는 뜻 아냐?', tier: 'meh', face: 'sorry', answer: '…그렇게 읽는 방법도 있구나. 못 들은 걸로 할게.' },
      ],
    },
    {
      id: 'mercy-cold',
      open: '비 맞고 다녔다가 감기 걸렸어. 메르시 선생님이 망토를 압수하려 했어.',
      replies: [
        { say: '망토 대신 우산 써', tier: 'great', face: 'shy', answer: ['…선생님보다 너한테 들으니까 들어야겠다.', '우산에 망토 무늬를 그려 볼까. 타협안이야.'] },
        { say: '용사도 아프구나', tier: 'good', face: 'sorry', answer: '아프지. 근데 아픈 날엔 다들 다정해서 좀 좋아.' },
        { say: '망토 압수 찬성', tier: 'meh', face: 'laugh', answer: '배신이다! …하하, 그래도 걱정해 준 거지?' },
      ],
    },
    {
      id: 'shift',
      when: { ch: 3 },
      open: '이상해. 요즘 가게에 꽃을 꽂을 때, 사장님 말고 다른 얼굴이 떠올라.',
      replies: [
        { say: '…누구 얼굴인데?', tier: 'great', face: 'shy', answer: ['그걸 묻다니, 용사를 너무 몰아붙인다.', '…답은 지금 눈앞에 있을지도. 아, 못 들은 걸로 해.'] },
        { say: '마음은 변하기도 해', tier: 'good', face: 'think', answer: ['응. 사장님을 좋아한 시간도 소중해.', '그래도 지금은 지금이야. 용사는 앞을 봐.'] },
        { say: '꽃집 주인 아니야?', tier: 'meh', face: 'laugh', answer: '아니야! …하하, 너 진짜 둔하다. 사장님만큼.' },
      ],
    },
    {
      id: 'kneel',
      when: { love: 'dating' },
      open: ['{me}, 연인이 생기면 꼭 해 보고 싶은 게 있었어.', '무릎 꿇고 손가락에 반지 끼워 주는 거. 연습만 몇 해 했어.'],
      replies: [
        { say: '연습 보여 줘', tier: 'great', face: 'shy', answer: ['…지금? 좋아. 무릎 꿇고, 손 잡고… 아, 반지가 없네.', '진짜 반지는 네 손에 맞는 걸로 고를래. 그게 순서야.'] },
        { say: '무릎 안 아파?', tier: 'good', face: 'laugh', answer: '아파. 그래서 연습할 땐 방석을 깔아. 용사의 비밀이야.' },
        { say: '좀 오글거려', tier: 'meh', face: 'sorry', answer: '…알아. 그래도 한 번은 폼 잡게 해 줘. 평생 한 번.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '좋은 아침, {me}! 해보다 먼저 일어난 용사 둘이네. 빵집 문 같이 열래?',
      replies: [
        { say: '간판은 내가 걸게', tier: 'great', remember: 'key-duty', face: 'laugh', answer: '좋아! 열쇠는 내가, 간판은 네가. 딱 맞는 용사단이야.' },
        { say: '사장님은 아직 자?', tier: 'good', face: 'smile', answer: '응. 오늘은 상자 안에서 자고 있었어. 머리만 넣고.' },
        { say: '난 더 잘래', tier: 'meh', face: 'calm', answer: '그래, 푹 자. 용사가 대신 아침을 지켜 둘게.' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비다! 망토가 무거워졌어. 그래도 벗진 않아. 우산 없으면 내 거 써.',
      replies: [
        { say: '같이 쓰자', tier: 'great', face: 'shy', answer: '…좋아. 근데 내 쪽이 좀 젖어도 돼. 앞머리만 지켜 줘.' },
        { say: '넌 어쩌고?', tier: 'good', face: 'smile', answer: '용사는 비 좀 맞아도 괜찮아. 감기는 좀 무섭지만.' },
        { say: '망토 벗어', tier: 'meh', face: 'sorry', answer: '…메르시 선생님이랑 같은 말 하네. 둘이 편먹었어?' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 왔어! 광장에 눈사람 용사 만들자. 동상 연습이라고 생각하면 돼.',
      replies: [
        { say: '앞머리도 만들자!', tier: 'great', remember: 'pose-pick', face: 'laugh', answer: '역시 넌 알아! 고드름으로 앞머리 내리면 딱이야.' },
        { say: '손 시려워', tier: 'good', face: 'smile', answer: '여기, 빵집에서 갓 나온 빵. 손난로 대신 들고 있어.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening', weather: ['sunny', 'cloudy'] },
      open: '노을 아래 서 봤어. 어때, 지금 이 각도. 동상 각도로 쓸 만하지?',
      replies: [
        { say: '그림 같아', tier: 'great', remember: 'bangs-praise', face: 'laugh', answer: '그림! 동상 다음엔 초상화 청원도 해야겠다.' },
        { say: '해가 눈부셔', tier: 'good', face: 'smile', answer: '그럼 내 그림자 쪽으로 와. 용사의 그늘이야.' },
        { say: '배고프다', tier: 'meh', face: 'calm', answer: '…남은 빵 있어. 폼은 접고 같이 먹자.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 오늘 서명이 제일 많이 모이는 날이야. 그리고 사장님 마법도!',
      replies: [
        { say: '서명 받는 거 도와줄게', tier: 'great', remember: 'statue-sign', face: 'laugh', answer: '고마워! 네가 서 있으면 서명이 두 배로 모일 거야.' },
        { say: '꽃밭 마법 같이 보자', tier: 'good', remember: 'flower-magic', face: 'shy', answer: '응. 맨 앞자리 맡아 둘게. 일 년 기다린 거야.' },
      ],
    },
    {
      id: 'op-festival-night',
      when: { festival: true, time: ['evening', 'night'] },
      open: ['축제 밤이야. 광장 가 봤어? 사장님이 꽃밭을 피웠어.', '돌바닥 틈마다 꽃이야. 다들 신발 벗고 걷더라.'],
      replies: [
        { say: '같이 걸으러 가자', tier: 'great', face: 'shy', answer: ['…응. 꽃 밟지 않게 내 발자국만 따라와.', '오늘은 동상 자리도 꽃으로 꽉 찼어. 그것도 좋다.'] },
        { say: '사장님 대단하다', tier: 'good', face: 'smile', answer: '그치? 쓸모없는 마법이라면서 매년 조금씩 넓어져.' },
        { say: '꽃가루 날리겠다', tier: 'meh', face: 'sorry', answer: '…에취. 맞아. 그래도 재채기하는 용사도 멋있어.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish} 낚았어? 대단한데! 용사단 식량 담당으로 임명할게.',
      replies: [
        { say: '영광입니다, 용사님', tier: 'great', face: 'laugh', answer: '하하! 좋아, 임명식은 동상 제막식 때 같이 하자.' },
        { say: '빵이랑 바꿀래?', tier: 'good', face: 'smile', answer: '좋지. 사장님한테 생선 빵 실험은 하지 말자고 할게.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 들었어! 오늘 기록급 물고기 잡았다며? 동상은 너부터 세워야겠다.',
      replies: [
        { say: '둘이 나란히 세우자', tier: 'great', face: 'shy', answer: '…나란히. 그거 좋다. 청원서 제목을 바꿔야겠어.' },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 실력이야. 용사도 반은 운으로 먹고살아.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 왔구나. 흙 묻은 얼굴도 용사 같아. 정말이야.',
      replies: [
        { say: '너도 해 볼래?', tier: 'great', face: 'laugh', answer: '좋아! 괭이도 검이랑 비슷하겠지? …아닌가.' },
        { say: '빵 재료 키우는 중', tier: 'good', face: 'smile', answer: '그럼 우리 빵의 뿌리는 너네 밭이네. 고마워.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물? 반짝반짝하다. 내 동상 받침대에 박으면 어울리겠는데.',
      replies: [
        { say: '하나 줄게', tier: 'great', face: 'wow', answer: '진짜? 아니, 넣어 둬. 마음만 받을게. 진짜 용사는 그래.' },
        { say: '팔아서 동상 지어', tier: 'good', face: 'laugh', answer: '하하! 그럼 첫 모금은 너야. 받침대에 이름 새겨 줄게.' },
        { say: '그건 안 돼', tier: 'meh', face: 'calm', answer: '알아, 농담이야. 반짝이는 건 원래 주인한테 어울려.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 좀 처져 보여. 용사가 할 수 있는 거 있어? 뭐든 말해.',
      replies: [
        { say: '그냥 옆에 있어 줘', tier: 'great', face: 'shy', answer: ['그건 제일 쉬운 임무야. 폼도 안 잡을게.', '그냥 있을게. 네가 됐다고 할 때까지.'] },
        { say: '웃긴 얘기 해 줘', tier: 'good', face: 'laugh', answer: '오늘 거울 보고 인사하다 손님한테 들켰어. …웃었지? 됐다.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '얼굴이 환하다! 좋은 일 있었지? 용사는 그런 거 한눈에 알아봐.',
      replies: [
        { say: '너 봐서 그래', tier: 'great', face: 'shy', answer: '…그런 대사는 내가 할 거였는데. 선수 뺏겼다.' },
        { say: '그냥 날씨가 좋아서', tier: 'good', face: 'smile', answer: '그것도 좋은 일이야. 용사는 작은 행운도 세어 둬.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '결혼 소식 들었어? 광장에서 식 올린대. …동상 자리는 비켜 주겠지?',
      replies: [
        { say: '오늘은 양보해', tier: 'great', face: 'laugh', answer: '물론! 용사는 축하할 땐 확실히 비켜. 꽃도 내가 날라 줄 거야.' },
        { say: '부럽지?', tier: 'good', face: 'shy', answer: '…조금. 언젠가 나도 저기 서 보고 싶어. 망토 입고.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '마을에 전설 같은 소식이 돌던데! 전설은 원래 용사 담당인데 말이야.',
      replies: [
        { say: '다음 전설은 너야', tier: 'great', face: 'laugh', answer: '그 말 청원서 맨 앞에 붙여도 돼? 진짜 붙일 거야.' },
        { say: '질투해?', tier: 'good', face: 'sorry', answer: '아니야! …조금. 좋은 소식이니 같이 기뻐하자.' },
      ],
    },
    {
      id: 'op-news-bday',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 사람이 있대! 용사는 이런 날 바빠. 축하 행진 준비해야지.',
      replies: [
        { say: '행진에 나도 낄래', tier: 'great', face: 'laugh', answer: ['좋아! 넌 꽃잎 담당. 나는 망토 펄럭임 담당.', '둘이면 행진이고, 하나면 그냥 산책이거든.'] },
        { say: '빵 하나 선물하자', tier: 'good', face: 'smile', answer: '좋다. 사장님 몰래 제일 예쁜 걸로 고를게.' },
        { say: '모르는 사람인데?', tier: 'meh', face: 'think', answer: '모르는 사람 생일도 축하하면, 다음엔 아는 사람이 돼.' },
      ],
    },
    {
      id: 'op-friend-record',
      when: { friendNews: 'record' },
      open: '네 친구가 마을 기록을 세웠다며? 소식 들었어. 용사단 명예 단원으로 추천할게.',
      replies: [
        { say: '전해 줄게!', tier: 'great', face: 'laugh', answer: '고마워! 단원증은 손으로 쓴 거라도 진심이라고 전해 줘.' },
        { say: '나도 질 수 없지', tier: 'good', face: 'smile', answer: '그 마음이 용사야. 기록은 서로 밀어 주면서 크는 거야.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring', time: ['dawn', 'day'] },
      open: '{season} 햇살이다. 망토 깃에 꽃 꽂았어. 오늘은 민들레야. 어때?',
      replies: [
        { say: '봄의 용사네', tier: 'great', face: 'laugh', answer: ['봄의 용사! 그 이름 받을게.', '꽃이 지면 다음 꽃으로. 용사의 봄은 길어.'] },
        { say: '꽃이 부러워하겠다', tier: 'good', face: 'shy', answer: '…그런 말 들으면 앞머리 넘길 타이밍을 놓쳐.' },
        { say: '민들레 씨 날린다', tier: 'meh', face: 'sorry', answer: '앗. 벌써 반쯤 날아갔어. 대머리 민들레 용사야.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: ['여름이야. 망토 안이 오븐 같아.', '그래도 벗으면 용사가 아니라 그냥 땀 흘리는 알바생이야.'],
      replies: [
        { say: '시원한 거 먹자', tier: 'great', face: 'laugh', answer: ['좋아! 츠나데 할머니 텃밭 딸기 얹어서.', '할머니가 용사한텐 덤도 주셔. 오늘 같이 가자.'] },
        { say: '그늘로 가자', tier: 'good', face: 'smile', answer: '응. 시장 차양 밑이 명당이야. 망토도 쉬게 해 줄게.' },
        { say: '그냥 벗어', tier: 'meh', face: 'sorry', answer: '…세 번째 듣는 말이야. 오늘은 반만 걷을게.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이다. 뒷산 코스모스 들판 봤어? 사장님 꽃밭 마법만큼 예뻐.',
      replies: [
        { say: '같이 보러 가자', tier: 'great', face: 'shy', answer: ['…좋아. 사장님 대신이 아니라, 너랑 보고 싶어서.', '아, 방금 그거 진심이야. 폼 아니야.'] },
        { say: '호박파이 철이네', tier: 'good', face: 'laugh', answer: '맞아! 빵집 호박파이는 내가 제일 좋아해. 한 조각 남겨 둘게.' },
        { say: '꽃은 다 비슷하지', tier: 'meh', face: 'think', answer: '가까이서 보면 다 달라. 사람이랑 같아.' },
      ],
    },
    {
      id: 'op-winter-night',
      when: { season: 'winter', time: ['evening', 'night'] },
      open: '겨울밤이다. 빵집 난로 불 끄러 가는 길이야. 같이 걸을래?',
      replies: [
        { say: '좋아, 같이 가', tier: 'great', face: 'smile', answer: ['고마워. 불 끄기 전에 남은 빵 하나 데워 먹자.', '사장님이 난로 앞에서 졸던 자리야. 아직 따뜻해.'] },
        { say: '별이 예쁘다', tier: 'good', face: 'think', answer: '겨울 별은 가까워 보여. 옛 친구들도 지금 이거 보고 있겠지.' },
        { say: '추워서 집에 갈래', tier: 'meh', face: 'calm', answer: '그래. 목도리 단단히 해. 감기는 용사도 못 이겨.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night', weather: ['sunny', 'cloudy'] },
      open: '밤 순찰 중이야. 용사는 자기 전에 마을을 한 바퀴 돌아. 아무 일 없나 보려고.',
      replies: [
        { say: '나도 따라갈래', tier: 'great', remember: 'night-patrol', face: 'laugh', answer: ['좋아! 오늘 밤 용사단은 둘이야.', '볼리바스 순경님이 보면 또 웃겠지만.'] },
        { say: '무슨 일이 있었어?', tier: 'good', face: 'think', answer: '고양이가 지붕에서 못 내려와서 도와줬어. 오늘의 대모험이야.' },
        { say: '그건 순경 일 아냐?', tier: 'meh', face: 'sorry', answer: '…맞아. 순경님도 그 말 했어. 그래도 둘이면 더 안심이잖아.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy', time: 'day' },
      open: '{weather}. 이런 날엔 빵이 잘 팔려. 다들 따뜻한 걸 찾나 봐.',
      replies: [
        { say: '흐려도 네가 밝네', tier: 'great', face: 'laugh', answer: '그렇지? 구름 낀 날엔 용사가 해 대신이야.' },
        { say: '나도 하나 살래', tier: 'good', face: 'smile', answer: '고마워! 갓 나온 거로 골라 줄게. 용사의 안목으로.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm', time: ['evening', 'night'] },
      open: '폭풍이야. 가붕 형 등대 불은 괜찮을까. 빵이라도 갖다 드리고 싶은데.',
      replies: [
        { say: '내일 같이 가자', tier: 'great', face: 'smile', answer: ['그래, 바람 잦아들면. 오늘은 둘 다 집에 있자.', '용사도 무모한 건 안 해. 아이젠 아저씨한테 배웠어.'] },
        { say: '등대는 튼튼해', tier: 'good', face: 'think', answer: '맞아. 가붕 형도 튼튼하고. 걱정은 접어 둘게.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['{me}! 오늘 생일이지? 용사단이 정식으로 축하할게.', '빵집에서 제일 예쁜 빵 하나 몰래 챙겨 뒀어.'],
      replies: [
        { say: '고마워, 용사님', tier: 'great', face: 'shy', answer: ['…용사님이라니. 오늘은 네가 주인공인데.', '생일 축하해. 너 태어나 줘서 이 마을이 좀 더 좋아.'] },
        { say: '행진은?', tier: 'good', face: 'laugh', answer: '물론 하지! 광장 한 바퀴. 망토 펄럭이며. 박수는 네가 쳐.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관 다녀왔구나. 옛 용사 전시 있지? 거기 내 자리 비어 있는지 봤어?',
      replies: [
        { say: '비어 있었어', tier: 'great', face: 'laugh', answer: ['역시! 거기 맞춰 동상 크기를 재 둬야겠다.', '박물관 관장님한테 청원서 하나 더 들고 가야지.'] },
        { say: '전시 멋지더라', tier: 'good', face: 'smile', answer: '그치? 옛날 사람들도 누군가 기억해 주길 바랐나 봐.' },
        { say: '그런 자리는 없어', tier: 'meh', face: 'sorry', answer: '…그럼 만들어야지. 용사는 자리가 없으면 만든다.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노에서 좀 잃었다며. 괜찮아. 용사도 이긴 날보다 진 날이 많았어.',
      replies: [
        { say: '위로해 줘서 고마워', tier: 'great', face: 'smile', answer: ['고맙긴. 진 날엔 빵이 맛있어. 하나 줄게.', '하이터는 진 날마다 술을 마셨는데, 넌 빵으로 하자.'] },
        { say: '다음엔 딸 거야', tier: 'good', face: 'think', answer: '그 기세 좋아. 근데 동상 기금에서 빌려줄 순 없어.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '바다 건너 다녀왔다며? 진짜 모험이다! 이야기해 줘. 다 들을게.',
      replies: [
        { say: '파도가 엄청났어', tier: 'great', face: 'wow', answer: ['우와! 그 이야기 편지에 써도 돼? 아이젠 아저씨가 좋아해.', '모험담은 나누면 두 배가 돼. 옛날에도 그랬어.'] },
        { say: '다음엔 같이 가자', tier: 'good', face: 'shy', answer: '…진짜? 그럼 사장님한테 휴가부터 말해 둬야겠다.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '주식 올랐다며? 축하해! 동상 기금 첫 후원자 자리가 아직 비어 있는데…',
      replies: [
        { say: '조금 보탤게', tier: 'great', face: 'laugh', answer: ['정말? 받침대에 이름 새겨 줄게. 내 이름 바로 옆에.', '…아니다, 마음만 받을게. 용사는 친구 돈 안 받아.'] },
        { say: '그건 내 돈이야', tier: 'good', face: 'laugh', answer: '하하, 알지. 물어보는 건 공짜잖아.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['오늘 {other} 씨랑 좀 서먹해.', '내가 먼저 말 걸어야 하는데… 용사도 이건 어렵네.'],
      replies: [
        { say: '빵 들고 먼저 가 봐', tier: 'great', face: 'think', answer: ['…그래. 빵은 말보다 먼저 마음을 전해 줘.', '고마워. 용기는 원래 동료한테서 빌리는 거야.'] },
        { say: '내일이면 풀릴 거야', tier: 'good', face: 'smile', answer: '그렇겠지. 근데 내일까지 기다리는 용사는 좀 별로야.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '사장님 만났어? 일어나 계셨어? 나한텐 오늘 한마디도 안 했는데.',
      replies: [
        { say: '네 꽃 예쁘대', tier: 'great', remember: 'crush-cheer', face: 'shy', answer: '…진짜? 그 말이면 일주일 버텨. 아니, 한 달.' },
        { say: '졸고 계시던데', tier: 'good', face: 'laugh', answer: '역시. 그래도 깨어 있는 날 만났으면 운 좋은 거야.' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: ['쉿, 사장님 지금 옆에서 눈 감고 계셔. 서서 조는 거야.', '…깨면 같이 인사하자. 오늘 앞머리 괜찮지?'],
      replies: [
        { say: '괜찮아, 멋있어', tier: 'great', face: 'shy', answer: ['다행이다. 사장님은 어차피 안 보겠지만.', '…그래도 혹시 모르잖아. 용사는 늘 준비해.'] },
        { say: '깨워 드릴까?', tier: 'good', face: 'laugh', answer: '아니, 오 분만 더. 사장님 말버릇이 나한테도 옮았어.' },
      ],
    },
    {
      id: 'op-bocchi',
      when: { bond: 'bocchi' },
      open: '봇치 봤어? 내 연애 상담 해 주다가 오늘도 먼저 쓰러졌어.',
      replies: [
        { say: '이번엔 내가 들어 줄게', tier: 'great', face: 'smile', answer: '고마워. 넌 안 쓰러지지? …다행이다. 그럼 처음부터 말할게.' },
        { say: '봇치 공연 가자', tier: 'good', face: 'laugh', answer: '좋아! 맨 앞에서 박수 치면 봇치가 녹아내리겠지만.' },
      ],
    },
    {
      id: 'op-with-bocchi',
      when: { with: 'bocchi' },
      open: '봇치랑 고백 작전 회의 중이었어. 봇치는 벌써 반쯤 녹았어.',
      replies: [
        { say: '나도 회의에 낄래', tier: 'great', face: 'laugh', answer: ['좋아! 셋이면 작전 회의, 둘이면 그냥 떨기 대회야.', '봇치, 일어나. 든든한 지원군이 왔어.'] },
        { say: '봇치 좀 쉬게 해 줘', tier: 'good', face: 'sorry', answer: '…맞다. 오늘은 내가 봇치 노래를 들어 주는 날로 할게.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '도서관 다녀왔어? 베아트리스가 내 얘기 했지. 떠든다고. 억울해.',
      replies: [
        { say: '좀 크긴 해, 목소리', tier: 'great', face: 'laugh', answer: '…용사의 목소리는 원래 멀리 가. 다음엔 속삭여 볼게.' },
        { say: '같이 사과하러 갈까', tier: 'good', face: 'smile', answer: '좋아. 빵 하나 들고 가자. 책 위엔 절대 안 올리고.' },
      ],
    },
    {
      id: 'op-yanineko',
      when: { bond: 'yanineko' },
      open: '야니네코 만났구나. 걔 어디 숨어 있었어? 아니, 말하지 마. 반칙이야.',
      replies: [
        { say: '햇볕 드는 데', tier: 'great', remember: 'hide-seek', face: 'wow', answer: '역시! …앗, 말했네. 이번 판은 무효로 하자.' },
        { say: '비밀이야', tier: 'good', face: 'laugh', answer: '의리 있네. 그런 동료가 좋아. 내가 찾아낼게.' },
      ],
    },
    {
      id: 'op-with-tsunade',
      when: { with: 'tsunade' },
      open: '츠나데 할머니랑 무 이야기 중이었어. 할머니가 내 팔뚝을 칭찬했어!',
      replies: [
        { say: '텃밭 일 덕분이네', tier: 'great', remember: 'garden-help', face: 'laugh', answer: ['맞아! 성검은 못 뽑아도 무는 뽑아. 다음엔 같이 뽑자.', '할머니, 이쪽도 일 잘해요. 제가 보증해요.'] },
        { say: '빵 반죽 덕이겠지', tier: 'good', face: 'smile', answer: '그것도 맞아. 용사의 팔뚝은 밀가루로 만들어져.' },
      ],
    },
    {
      id: 'op-with-gwen',
      when: { with: 'gwen' },
      open: '그웬 원장님이랑 앞머리 회의 중이야. 오늘 안건은 가르마 방향이야.',
      replies: [
        { say: '지금 그대로가 좋아', tier: 'great', face: 'shy', answer: ['…들었죠, 원장님? 회의 끝.', '원장님이 드디어 쉴 수 있겠다고 웃으셨어.'] },
        { say: '반대로 해 봐', tier: 'good', face: 'wow', answer: '대모험이다… 원장님, 가위 말고 빗만 부탁해요.' },
      ],
    },
    {
      id: 'op-with-ornn',
      when: { with: 'ornn' },
      open: '오른 아저씨한테 빵칼 날 세우는 법 배우는 중이야. 아저씨 손이 엄청 커.',
      replies: [
        { say: '용사의 검이 되겠네', tier: 'great', face: 'laugh', answer: ['그치? 이제 바게트가 저절로 갈라질 거야.', '아저씨가 칼보다 손목을 먼저 보래. 진짜 장인이야.'] },
        { say: '다치지 마', tier: 'good', face: 'smile', answer: '응. 아저씨가 숫돌보다 내 손가락을 더 걱정하더라.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-statue',
      when: { mem: 'statue-sign' },
      use: 'statue-sign',
      open: '네 서명 덕분에 청원서가 두 장째야! 한 장은 거의 내 글씨지만.',
      replies: [
        { say: '한 장 더 채우자', tier: 'great', face: 'laugh', answer: '좋아! 오늘 광장 한 바퀴 돌자. 용사단 출동!' },
        { say: '네 글씨가 많네', tier: 'good', face: 'sorry', answer: '…열정의 증거야. 그래도 너 같은 진짜 서명이 제일 빛나.' },
      ],
    },
    {
      id: 'cb-doubt',
      when: { mem: 'statue-doubt' },
      use: 'statue-doubt',
      open: ['동상은 과하다던 네 말, 계속 생각했어.', '그래서 크기를 줄였어. 실물 크기로. 많이 양보한 거야.'],
      replies: [
        { say: '그 정도면 좋아', tier: 'great', face: 'laugh', answer: ['그치? 실물 크기면 옆에 서서 키 재기도 할 수 있어.', '먼 훗날 누가 옆에 서 주면 좋겠다.'] },
        { say: '그래도 크다', tier: 'good', face: 'think', answer: '…앞머리만 조금 줄여 볼게. 그게 마지막 양보야.' },
      ],
    },
    {
      id: 'cb-crush',
      when: { mem: 'crush-cheer' },
      use: 'crush-cheer',
      open: '응원해 준 거 기억나? 사장님한테 꽃 줬어. 꽃병이 어디 있냐고만 하더라.',
      replies: [
        { say: '그래도 받았잖아', tier: 'great', face: 'shy', answer: '…그렇지? 받았어. 그거면 오늘은 용사가 이긴 거야.' },
        { say: '직접 말해 봐', tier: 'good', face: 'think', answer: '말하면… 사장님은 "응" 하고 잘 것 같아. 그게 무서워.' },
      ],
    },
    {
      id: 'cb-tease',
      when: { mem: 'crush-tease' },
      use: 'crush-tease',
      open: '{me}, 저번에 다 티 난다고 했지. 확인해 봤어. 모두 알더라. 사장님 빼고.',
      replies: [
        { say: '그게 매력이지', tier: 'great', face: 'laugh', answer: '하하… 맞아. 둔한 사장님, 티 나는 용사. 잘 어울리지?' },
        { say: '미안, 놀려서', tier: 'good', face: 'smile', answer: '아니야. 덕분에 숨기려다 앞머리만 망가지는 일은 없어졌어.' },
      ],
    },
    {
      id: 'cb-bangs',
      when: { mem: 'bangs-praise', time: ['day', 'evening'] },
      use: 'bangs-praise',
      open: '네가 앞머리 칭찬한 날부터 같은 방향으로만 넘겨. 오늘도 그 방향이야.',
      replies: [
        { say: '오늘도 멋있어', tier: 'great', face: 'laugh', answer: '그렇지? 이 방향은 이제 "{me} 방향"이라고 부를래.' },
        { say: '반대도 해 봐', tier: 'good', face: 'wow', answer: '모험이네… 좋아, 내일 반대로 넘기고 올게. 평가해 줘.' },
      ],
    },
    {
      id: 'cb-pose',
      when: { mem: 'pose-pick' },
      use: 'pose-pick',
      open: ['네가 골라 준 동상 포즈, 매일 아침 거울 앞에서 연습해.', '어제는 손님이 따라 했어. 유행 조짐이야.'],
      replies: [
        { say: '한 번 해 봐', tier: 'great', face: 'laugh', answer: ['자, 봐! …바람이 안 부네. 네가 후 불어 줘.', '그렇지, 그거야! 이제 완성이야. 둘이 만든 포즈.'] },
        { say: '손님 귀엽다', tier: 'good', face: 'smile', answer: '그치? 동상 생기면 그 앞에서 다들 따라 했으면 좋겠어.' },
      ],
    },
    {
      id: 'cb-cape',
      when: { mem: 'cape-fan' },
      use: 'cape-fan',
      open: '망토 잘 어울린다고 해 준 뒤로 다리미를 새로 샀어. 쓰레쉬 씨 잡화점에서.',
      replies: [
        { say: '각이 살아 있네', tier: 'great', face: 'laugh', answer: ['알아보는구나! 오늘 각도는 정확히 동상 각도야.', '쓰레쉬 씨가 웃으면서 덤으로 솔도 줬어. 좀 무서웠지만.'] },
        { say: '다리미 비쌌어?', tier: 'good', face: 'sorry', answer: '…동상 기금에서 조금 빌렸어. 비밀로 해 줘.' },
      ],
    },
    {
      id: 'cb-hide',
      when: { mem: 'hide-seek' },
      use: 'hide-seek',
      open: '숨바꼭질 결과 알려 줄게. …이겼어! 야니네코, 햇볕 든 지붕 위에서 자고 있었어.',
      replies: [
        { say: '축하해, 용사님!', tier: 'great', face: 'laugh', answer: ['고마워! 근데 깨우니까 "졌네" 하고 다시 자더라.', '이긴 건지 모르겠어. 그래도 서명은 받았어!'] },
        { say: '자는 건 반칙 아냐?', tier: 'good', face: 'think', answer: '…그러네? 다음 판 규칙에 넣어야겠다. 낮잠 금지.' },
      ],
    },
    {
      id: 'cb-box',
      when: { mem: 'box-rescue' },
      use: 'box-rescue',
      open: ['어제 사장님이 또 상자에 들어갔어. 이번엔 발부터.', '네가 배운 요령이 안 통했어. 당길 다리가 안 보였거든.'],
      replies: [
        { say: '그럼 머리를 당겨!', tier: 'great', face: 'laugh', answer: ['그렇게 했어! 사장님이 "이번엔 밝았어" 하더라.', '…그 말이 좀 웃겨서 하루 종일 기분 좋았어.'] },
        { say: '상자를 기울여 봐', tier: 'good', face: 'think', answer: '오, 그건 생각 못 했다. 다음 상자 사건 땐 써 볼게.' },
      ],
    },
    {
      id: 'cb-letters',
      when: { mem: 'letters' },
      use: 'letters',
      open: '옛 친구들한테 답장 썼어! 너 얘기도 넣었어. 용사단 새 단원이라고.',
      replies: [
        { say: '정식 단원이야?', tier: 'great', face: 'laugh', answer: '그럼! 망토는 없지만 마음은 있잖아. 그게 더 중요해.' },
        { say: '뭐라고 썼어?', tier: 'good', face: 'shy', answer: '착하고, 웃음이 좋고… 됐어, 여기까지. 나머진 비밀.' },
      ],
    },
    {
      id: 'cb-heiter',
      when: { mem: 'heiter-tale' },
      use: 'heiter-tale',
      open: ['하이터한테 네 얘기 했더니 답장이 왔어.', '그분께 축복을, 이래. 근데 종이에 포도주 얼룩이 있어.'],
      replies: [
        { say: '축복 잘 받을게', tier: 'great', face: 'laugh', answer: ['하하! 얼룩까지 축복이라고 생각해 줘.', '그 녀석 축복은 진짜 잘 들어. 술 냄새만 빼면.'] },
        { say: '또 마셨구나', tier: 'good', face: 'sorry', answer: '…응. 금주는 다음 달부터래. 매달 그래.' },
      ],
    },
    {
      id: 'cb-eisen',
      when: { mem: 'eisen-tale' },
      use: 'eisen-tale',
      open: ['아이젠 아저씨가 받침대 그림을 보냈어. 이제 반쯤 깎았대.', '구석에 작게 너랑 나를 새겨 넣었대. 내가 부탁했거든.'],
      replies: [
        { say: '나도 들어갔어?', tier: 'great', face: 'shy', answer: ['응. 아저씨 말로는 "용사 옆에 서 있는 용감한 사람".', '…그 표현, 내가 쓴 거야. 들켰다.'] },
        { say: '천천히 깎으시래', tier: 'good', face: 'smile', answer: '드워프 시간으로 천천히면… 우리 손주 때 오겠다.' },
      ],
    },
    {
      id: 'cb-meteor',
      when: { mem: 'meteor-promise' },
      use: 'meteor-promise',
      open: '오십 년 뒤 유성우 약속, 수첩에 적어 뒀어. 칸이 모자라서 표지에 썼어.',
      replies: [
        { say: '나도 적어 둘게', tier: 'great', face: 'shy', answer: ['…좋아. 둘이 적었으니까 둘 중 하나는 꼭 기억하겠지.', '아마 내가 먼저 할아버지가 되겠지만. 앞머리는 남아 있을 거야.'] },
        { say: '그 전에도 보자', tier: 'good', face: 'laugh', answer: '물론! 유성우가 아니어도 별은 매일 떠. 핑계는 많아.' },
      ],
    },
    {
      id: 'cb-ring',
      when: { mem: 'ring-story' },
      use: 'ring-story',
      open: ['연꽃 반지 얘기 기억해? 계속 주머니에 넣고 다녔는데, 이제 정했어.', '줄 사람한테 주되, 뜻은 안 붙이기로. 고마움만 담아서.'],
      replies: [
        { say: '멋진 결정이야', tier: 'great', face: 'shy', answer: ['…고마워. 네가 그렇게 말해 주니까 덜 아프다.', '용사는 원래 받는 것보다 주는 게 어울려.'] },
        { say: '뜻도 말하지 그래', tier: 'good', face: 'think', answer: '…아니. 사장님한텐 그 뜻이 무거울 거야. 가볍게가 좋아.' },
      ],
    },
    {
      id: 'cb-menu',
      when: { mem: 'menu-name' },
      use: 'menu-name',
      open: '네가 같이 지은 신메뉴 이름, 사장님이 통과시켰어! 첫 판이 금방 다 팔렸어.',
      replies: [
        { say: '우리 둘의 작품이네', tier: 'great', face: 'laugh', answer: ['맞아! 진열대 이름표에 작게 공동 작명이라고 적었어.', '사장님은 이름보다 맛이 중요하대. 그것도 맞는 말이야.'] },
        { say: '하나 남겨 줘', tier: 'good', face: 'smile', answer: '이미 남겨 뒀어. 용사는 동료 몫부터 챙겨.' },
      ],
    },
    {
      id: 'cb-flower',
      when: { mem: 'flower-magic', ch: 2 },
      use: 'flower-magic',
      open: ['꽃밭 마법 얘기 기억하지? 어제 사장님이 창가 화분에 살짝 걸어 줬어.', '축제도 아닌데. 내가 꽃병 채우는 걸 봤나 봐.'],
      replies: [
        { say: '사장님도 고마운 거야', tier: 'great', face: 'shy', answer: ['…그런가. 말은 없었는데, 꽃은 말이 많더라.', '그걸로 됐어. 진짜로.'] },
        { say: '보러 가도 돼?', tier: 'good', face: 'smile', answer: '물론! 근데 쉿. 사장님 깨면 쑥스러워서 꽃을 거둘지도.' },
      ],
    },
    {
      id: 'cb-interview',
      when: { mem: 'interview' },
      use: 'interview',
      open: '잔나 기자 기사 나왔어! 귀퉁이에 세 줄. 근데 사진이 들어갔어!',
      replies: [
        { say: '사진 잘 나왔어?', tier: 'great', face: 'laugh', answer: ['앞머리가 바람에 딱 날린 순간이야. 잔나 기자 실력이지.', '한 장은 오려서 사장님 계산대 옆에 붙였어.'] },
        { say: '세 줄이면 충분해', tier: 'good', face: 'smile', answer: '맞아. 세 줄이면 서명 세 개는 더 모일 거야.' },
      ],
    },
    {
      id: 'cb-promise',
      when: { mem: 'promise-book' },
      use: 'promise-book',
      open: ['약속 수첩 봐. 네 이름 옆에 동그라미가 잔뜩이야.', '웃게 해 주기. 매일 하나씩 그렸어.'],
      replies: [
        { say: '오늘도 성공이야', tier: 'great', face: 'shy', answer: ['…그럼 하나 더 그린다. 이 칸 금방 차겠다.', '새 수첩 사야겠어. 이번엔 두꺼운 걸로.'] },
        { say: '빼먹은 날은?', tier: 'good', face: 'laugh', answer: '그런 날은 없어! …비 온 날 하나는 반쯤 그렸어.' },
      ],
    },
    {
      id: 'cb-knife',
      when: { mem: 'bread-knife' },
      use: 'bread-knife',
      open: '빵칼 검술, 그날 이후로 신기술 생겼어. 식빵을 종이처럼 얇게!',
      replies: [
        { say: '보여 줘!', tier: 'great', face: 'laugh', answer: '자, 봐. …너무 얇아서 하나 날아갔다. 그것도 기술이야.' },
        { say: '두꺼운 게 맛있어', tier: 'good', face: 'think', answer: '…그건 그래. 신기술은 동상 제막식 때만 쓰자.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 용사는 동료 취향을 외워 둬.',
      replies: [
        { say: '기억해 줘서 고마워', tier: 'great', remember: 'taste-heard', face: 'smile', answer: '당연하지. 다음 신메뉴 회의 때 슬쩍 밀어 볼게.' },
        { say: '어떻게 알았어?', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '용사의 정보망이야. 사실 그냥 잘 들었어.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸은 날, 나 폼을 한 번도 안 잡았더라. 집에 와서 알았어.',
      replies: [
        { say: '그게 더 좋았어', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…그래? 그럼 다음에도 폼은 집에 두고 나갈게.' },
        { say: '다음엔 망토 입고 가', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '좋아! 펄럭이는 각도 연구해 둘게. 기대해.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일이지? 용사단이 광장에서 축하 행진을 할 거야. 단원은 나 혼자지만.',
      replies: [
        { say: '혼자여도 좋아', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '…그럼 두 배로 크게 걸을게. 망토도 두 배로 펄럭이고.' },
        { say: '빵이면 충분해', tier: 'good', remember: 'bday-plan', face: 'smile', answer: '빵도 행진도 둘 다 해 줄게. 용사는 욕심이 많아.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에 갔던 날, 거울이 있었는데 한 번도 안 봤어. 신기하지?',
      replies: [
        { say: '나만 봤어?', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…응. 용사도 가끔은 솔직해져. 오늘이 그날이야.' },
        { say: '앞머리 괜찮았어', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '다행이다! 확인 못 해서 밤새 걱정했거든.' },
      ],
    },
  ],
  chapters: [
    {
      title: '열쇠 당번 용사',
      hint: '한 번 이야기를 나누면 힘멜이 동상 청원서를 내밀어요.',
      need: { days: 1 },
      scene: [
        '시장 거리 빵집 앞. 갓 구운 빵 냄새 사이로 푸른 망토 자락이 펄럭인다.',
        '허리에 빵칼을 칼처럼 찬 청년이 간판을 정성껏 닦고 있다.',
        '"어? 처음 보는 얼굴이네. 안녕! 나는 힘멜."',
        '"마을의 용사이자, 이 빵집의 열쇠 당번이야. 둘 다 진지한 직함이야."',
        '그가 앞머리를 한 번 넘기더니 유리창에 비친 얼굴을 슬쩍 확인한다.',
        '유리 너머, 은발의 사장이 계산대에 엎드려 곤히 자고 있다.',
        '"저분이 사장님. 오늘도 문은 내가 열었어. 늘 그래."',
        '그 말을 할 때 그의 목소리가 아주 조금 부드러워진다.',
        '"아, 그리고 이거." 품에서 꼬깃꼬깃한 종이 한 장이 나온다.',
        '"광장 한가운데 내 동상을 세우자는 청원서야. 서명은 아직 몇 줄뿐이지만."',
        '"부담 갖지 마. 서명하면 그냥 역사에 남을 뿐이야."',
        '그가 펜을 내밀며 씩 웃는다. 그 웃음은 이상하게 폼보다 다정하다.',
      ],
      replies: [
        { say: '좋아, 서명할게!', tier: 'great', remember: 'statue-sign', face: 'laugh', answer: ['최고야! 첫 만남에 서명이라니. 넌 좋은 사람이야.', '용사는 그런 거 한눈에 알아봐. 앞으로 잘 부탁해, {me}.'] },
        { say: '생각해 볼게', tier: 'good', face: 'smile', answer: ['천천히 해. 청원서는 도망 안 가. 나도 안 가고.', '빵 사러 올 때마다 물어볼 거니까 각오해.'] },
        { say: '동상이 왜 필요해?', tier: 'meh', remember: 'statue-doubt', face: 'think', answer: ['…좋은 질문이야. 답은 나중에. 아주 나중에.', '오늘은 그냥 멋있어서라고 해 둘게.'] },
      ],
    },
    {
      title: '새벽의 열쇠',
      hint: '새벽(게임 시각 다섯 시부터 여덟 시) 시장 거리에 가 보세요. 힘멜이 빵집 문을 열어요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 5, to: 8 } },
      scene: [
        '아직 별이 남은 새벽. 시장 거리 가게들은 모두 덧문을 내렸다.',
        '빵집 앞에서만 작은 등불 하나가 흔들린다. 힘멜이 열쇠를 꽂고 있다.',
        '"왔구나! 진짜 왔어. 새벽의 용사단, 첫 출동이야."',
        '자물쇠가 철컥 열리자 차가운 가게 안에 어제의 밀가루 냄새가 고여 있다.',
        '창고 쪽에서 프리렌이 빈 상자에 머리를 넣은 채 잠들어 있다.',
        '힘멜이 익숙한 손길로 상자를 살짝 들어 올리고 담요를 덮어 준다.',
        '"쉿. 사장님은 깨우지 말자. 오븐은 내가 데울게."',
        '장작이 타닥거리고, 창밖 하늘이 남색에서 연보라로 바뀐다.',
        '"옛날에 친구들이랑 먼 길 다닐 때도, 불은 늘 내가 먼저 지폈어."',
        '"하이터는 술 깨느라, 아이젠 아저씨는 장작 패느라 바빴거든."',
        '"이 시간이 좋아. 아무도 모르게 누군가의 아침을 지키는 거."',
        '첫 빵이 부풀어 오를 무렵, 그가 창가 꽃병에 꽃 한 송이를 꽂는다.',
        '"사장님이 일어나서 이거 보면… 아마 모를 거야. 그래도 꽂아."',
      ],
      replies: [
        { say: '그게 진짜 용사네', tier: 'great', remember: 'dawn-shop', face: 'shy', answer: ['…그 말, 동상보다 좋다.', '오늘 첫 빵은 네 거야. 제일 잘 부푼 걸로.'] },
        { say: '간판은 내가 걸게', tier: 'good', remember: 'dawn-shop', face: 'smile', answer: ['고마워. 둘이 하니까 해가 뜨기 전에 끝났어.', '사장님이 깨면 간판이 저절로 걸린 줄 알 거야.'] },
        { say: '너무 졸려…', tier: 'meh', remember: 'dawn-shop', face: 'laugh', answer: ['하하, 사장님 옆에서 좀 자.', '둘이 나란히 졸면 귀엽겠다. 빵 나오면 깨워 줄게.'] },
      ],
    },
    {
      title: '코스모스 한 송이',
      hint: '힘멜이 가게에 꽂을 꽃을 찾고 있어요. 코스모스를 가지고 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'cosmos', take: true } },
      scene: [
        '오후의 빵집. 힘멜이 창가의 빈 꽃병을 들고 한숨을 쉬고 있다.',
        '"꽃집이 오늘 쉬는 날이래. 사장님 창가가 비면 가게가 쓸쓸해."',
        '코스모스를 내밀자 그가 눈을 동그랗게 뜨고 두 손으로 받는다.',
        '"이거… 늘 내가 사장님한테 주려고 사 오던 꽃이야."',
        '그는 꽃잎을 한참 들여다본다. 가느다란 줄기가 그의 손끝에서 흔들린다.',
        '"근데 받는 쪽이 되니까 기분이 이상하네. 좋은 쪽으로."',
        '"주는 건 늘 해 봤는데, 받는 건 처음인가 봐. 이렇게 간지러운 거구나."',
        '그는 꽃병 쪽으로 가다가 멈추고, 꽃을 자기 망토 깃에 꽂는다.',
        '"이건 가게용 아니야. 용사용이야. 오늘 하루 자랑하고 다닐래."',
        '안쪽에서 프리렌이 졸린 눈으로 "꽃병 비었네" 하고 중얼거린다.',
        '"내일 채울게요!" 힘멜이 크게 대답하고는, 나를 보며 몰래 웃는다.',
      ],
      replies: [
        { say: '잘 어울려', tier: 'great', remember: 'cosmos-gift', face: 'laugh', answer: ['그렇지? 광장 한 바퀴 돌고 올게.', '너도 같이 가! 누가 준 꽃인지 물어보면 대답해야 하잖아.'] },
        { say: '사장님 드려도 돼', tier: 'good', remember: 'cosmos-gift', face: 'think', answer: ['…아니. 이건 네가 준 거니까. 내가 가질래.', '사장님 꽃병은 내일 내가 채울게. 이건 따로야.'] },
        { say: '길가에 피어 있었어', tier: 'meh', remember: 'cosmos-gift', face: 'smile', answer: '길가 꽃이 제일 씩씩해. 나랑 닮았네.' },
      ],
    },
    {
      title: '동상을 원하는 이유',
      hint: '작은 도움도 용사의 일이라는 힘멜의 말에 맞장구치면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'hero-kind' },
      scene: [
        '밤의 광장. 가로등 불빛이 돌바닥 가운데 빈자리를 동그랗게 비춘다.',
        '힘멜이 그 한가운데 서서 두 팔을 벌려 본다. 동상 포즈다.',
        '"어때? …농담이야. 오늘은 진지한 얘기를 하려고 불렀어."',
        '"동상 말이야. 멋있어 보이려고만 그러는 건 아니야."',
        '"사장님은 오래 살잖아. 나보다 훨씬, 아주 훨씬."',
        '"먼 훗날 내가 없을 때, 사장님이 혼자 이 광장을 지나갈 거야."',
        '"그때 내 얼굴이 여기 서 있으면, 한 번쯤 웃어 주지 않을까 해서."',
        '그가 잠깐 말을 멈추고 앞머리를 만지작거린다. 밤바람이 차다.',
        '"하이터도 아이젠 아저씨도 다 알아. 나만 사장님한테 말 못 했지."',
        '"근데 요즘은… 먼 훗날보다 지금 옆에 있는 사람이 더 생각나."',
        '"작은 짐 하나 같이 들어 주는 사람. 그런 사람이랑 웃는 거."',
        '"동상 없어도 될 것 같아. 오늘 같은 밤이 있으면."',
      ],
      replies: [
        { say: '나도 오늘이 좋아', tier: 'great', remember: 'true-hero', face: 'shy', answer: ['…다행이다.', '용사가 처음으로 폼 안 잡고 한 말이었어. 들어 줘서 고마워.'] },
        { say: '동상도 세우자', tier: 'good', remember: 'true-hero', face: 'laugh', answer: ['하하! 그래, 청원은 계속할게.', '이유가 하나 늘었을 뿐이야. 이번엔 둘이 서 있는 동상.'] },
        { say: '사장님한텐 말했어?', tier: 'meh', remember: 'true-hero', face: 'think', answer: ['…아니. 이제는 말 안 해도 될 것 같아.', '이상하지. 그런데 하나도 안 슬퍼.'] },
      ],
    },
    {
      title: '망토를 벗은 용사',
      hint: '힘멜과 아주 가까워지면 그가 망토 없이 찾아와요. 그 뒤엔 꽃다발도 받을지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '해 질 녘 시장 거리. 빵집 문 앞에 낯선 청년이 서 있다.',
        '아니, 힘멜이다. 망토도, 빵칼도 없이 평범한 셔츠 차림이다.',
        '"알아보는 데 오래 걸렸지? 나도 거울 보고 놀랐어."',
        '"이상하지. 폼 잡을 게 하나도 없으니까 손을 어디 둘지 모르겠어."',
        '그가 주머니에 손을 넣었다 뺐다 하다가, 결국 뒷짐을 진다.',
        '"옛날 연꽃 반지 말이야. 사장님께 드렸어. 오래 일한 상이라고."',
        '"사장님은 끼어 보고 예쁘네, 한마디. 그걸로 됐어. 진짜로."',
        '"그 마음은 거기 잘 내려놓았어. 이제 주머니가 가벼워."',
        '"용사는 원래 혼자 떠나는 거라고 생각했어. 근데 아니더라."',
        '"{me}, 너랑 있으면 그냥 힘멜이어도 괜찮아."',
        '노을이 그의 앞머리 끝을 붉게 물들인다. 그는 처음으로 앞머리를 만지지 않는다.',
        '"…꽃다발 같은 거 받으면, 광장 한가운데서 자랑할 거야. 미리 말해 둘게."',
      ],
      replies: [
        { say: '그냥 힘멜이 좋아', tier: 'great', face: 'shy', answer: ['…반칙이야.', '그 말 들으니까 앞머리가 다 상관없어졌어.', '내일도 이렇게 올까. 아니, 망토는 입을게. 그건 나니까.'] },
        { say: '망토도 좋은데', tier: 'good', face: 'laugh', answer: ['하하! 그럼 내일은 다시 두르고 올게. 너 보라고.', '오늘 같은 날은 가끔만. 귀한 걸로 해 두자.'] },
        { say: '떨지 마', tier: 'meh', face: 'sorry', answer: '…노력할게. 용사도 처음 하는 모험은 떨려.' },
      ],
    },
    {
      title: '둘이서 가는 모험',
      hint: '힘멜과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '새벽 광장. 동상 자리에 작은 나무 받침대가 놓여 있다.',
        '모서리마다 서툰 조각 자국. 발키리 씨 공방에서 밤새 깎았단다.',
        '받침대 둘레엔 작은 꽃들이 동그랗게 피어 있다. 이 계절엔 없는 꽃이다.',
        '"사장님이 어젯밤 걸어 줬어. 꽃밭 마법. 이유는 안 묻더라."',
        '"동상 대신 이거. 위에 서 볼래? 둘이 서면 꽉 차."',
        '받침대에 오르자 나무가 살짝 삐걱이고, 그가 얼른 내 손을 잡는다.',
        '"아이젠 아저씨 받침대는 아직 반쯤이래. 이건 내 거라 금방 했어."',
        '"하이터한테도 편지 썼어. 동료가 생겼다고. 아니, 더 소중한 사람이라고."',
        '해가 지붕 너머로 고개를 내민다. 꽃잎마다 이슬이 반짝인다.',
        '"옛날엔 모험이 끝나면 다들 각자 길로 갔어. 그게 당연한 줄 알았어."',
        '"근데 이번 모험은 끝나도 같은 집으로 돌아갔으면 해."',
        '"앞으로 모든 모험, 너랑 가고 싶어. 끝까지."',
        '"반지는… 이번엔 네 손에 맞는 걸로 고르자. 아, 또 먼저 말해 버렸다."',
      ],
      replies: [
        { say: '끝까지 같이 가자', tier: 'great', face: 'shy', answer: ['…응.', '용사의 모험은 이제 둘이서야. 동상보다 오래갈 거야.', '오늘 일은 수첩 맨 앞장에 적을게. 지킬 약속 일번으로.'] },
        { say: '받침대 흔들려!', tier: 'good', face: 'laugh', answer: ['하하! 그러니까 손 꼭 잡아. 그게 설계 의도야.', '…거짓말이야. 그냥 잡고 싶었어.'] },
        { say: '천천히 생각할게', tier: 'meh', face: 'smile', answer: ['응. 기다리는 것도 용사가 잘하는 일이야.', '사장님한테 배웠거든. 오래 기다리는 법.'] },
      ],
    },
  ],
  after: [
    '오늘은 여기까지! 용사도 빵 나르러 가야 해.',
    '또 왔네! 서명은 하루 한 번이면 충분해. 마음은 매번 고맙고.',
    '앞머리 확인 끝. 내일 또 보자, {me}.',
    '잘 가! 밤길 조심해. 무서우면 용사를 불러.',
    '사장님 깨우러 가야 해. 세 번 두드리고, 오 분 기다리고.',
    '오늘 이야기는 약속 수첩에 적어 둘게. 내일 또 와.',
    '아, 망토에 밀가루. …못 본 걸로 해 줘. 또 보자!',
    '용사는 바빠. 그래도 너 지나가면 손은 꼭 흔들 거야.',
  ],
};
